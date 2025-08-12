"""
Job execution logic backed by Postgres leases.

Queue Pause Logic:
- A target's job queue is implicitly paused when any job for that target enters
  the ERROR or PAUSED state (checked in claim query).
"""

import asyncio
import logging
import traceback
from datetime import datetime
from typing import Dict
import os
import socket


# Remove direct import of APIGatewayCore
from server.models.base import Job, JobStatus
from server.settings import settings
from server.utils.db_dependencies import TenantAwareDatabaseService
from server.utils.telemetry import capture_job_resolved
from server.utils.job_logging import (
    add_job_log,
    _create_api_response_callback,
    _create_tool_callback,
    _create_output_callback,
)

# Add import for session management functions

# Set up logging
logger = logging.getLogger(__name__)

# Remove global database service - will use TenantAwareDatabaseService per tenant
# db = DatabaseService()


running_job_tasks: Dict[str, asyncio.Task] = {}
tenant_worker_tasks: Dict[str, asyncio.Task] = {}
tenant_worker_lock = asyncio.Lock()
WORKER_ID = f'{socket.gethostname()}:{os.getpid()}'


async def start_workers_for_all_tenants():
    """Start a worker loop per active tenant."""
    logger.info('Starting worker loops for all active tenants...')
    from server.utils.tenant_utils import get_active_tenants

    tenants = get_active_tenants()
    for tenant in tenants:
        await start_worker_for_tenant(tenant['schema'])


async def start_worker_for_tenant(tenant_schema: str):
    async with tenant_worker_lock:
        task = tenant_worker_tasks.get(tenant_schema)
        if task is None or task.done():
            logger.info(f'Starting worker loop for tenant {tenant_schema}')
            tenant_worker_tasks[tenant_schema] = asyncio.create_task(
                worker_loop_for_tenant(tenant_schema)
            )


async def worker_loop_for_tenant(tenant_schema: str):
    from server.database.multi_tenancy import with_db

    while True:
        try:
            claimed = None
            with with_db(tenant_schema) as db_session:
                db = TenantAwareDatabaseService(db_session)
                claimed = db.claim_next_job(WORKER_ID, tenant_schema=tenant_schema)
            if not claimed:
                await asyncio.sleep(0.5)
                continue
            job = Job(**claimed)
            await process_job_with_tenant(job, tenant_schema)
        except Exception as e:
            logger.error(f'Worker loop error (tenant={tenant_schema}): {e}')
            await asyncio.sleep(1.0)


async def process_job_queue_for_tenant(tenant_schema: str):
    logger.warning(
        'process_job_queue_for_tenant is deprecated; worker_loop_for_tenant is used instead'
    )
    raise NotImplementedError


async def process_job_with_tenant(job: Job, tenant_schema: str):
    """Process a job using tenant-aware database service."""

    # Execute the job using the existing execute_api_in_background function
    # but with tenant-aware database service
    task = asyncio.create_task(
        execute_api_in_background_with_tenant(job, tenant_schema)
    )
    running_job_tasks[str(job.id)] = task

    # Wait for the job to complete
    try:
        await task
    except Exception as e:
        logger.error(
            f'Error executing job {job.id} for tenant {tenant_schema}: {str(e)}'
        )

    # Remove the job from running_job_tasks
    if str(job.id) in running_job_tasks:
        del running_job_tasks[str(job.id)]


# Exported symbol kept for compatibility with routes; will start workers
job_queue_initializer = start_workers_for_all_tenants


"""Logging helpers moved to server.utils.job_logging."""


"""Logging helpers moved to server.utils.job_logging."""


async def get_target_lock(target_id, tenant_schema: str):
    raise NotImplementedError('Target locks are DB-backed now')


async def clean_up_target_lock(target_id, tenant_schema: str):
    return None


# Helper function for precondition checks
async def _check_preconditions_and_set_running(
    job: Job, job_id_str: str, tenant_schema: str
) -> tuple[bool, bool]:
    # No-op: claiming already set RUNNING and enforced constraints
    return True, False


# Removed local logging helpers and callbacks; imported from server.utils.job_logging


# Main job execution logic
async def execute_api_in_background_with_tenant(job: Job, tenant_schema: str):
    """Execute a job's API call in the background."""
    # Import core only when needed
    from server.core import APIGatewayCore
    from server.database.multi_tenancy import with_db

    job_id_str = str(job.id)

    # Track token usage for this job - Use a list to allow modification by nonlocal callback
    running_token_total_ref = [0]

    # Add initial job log
    add_job_log(job_id_str, 'system', 'Queue picked up job', tenant_schema)

    try:
        # Already RUNNING due to DB claim

        # Create callbacks using helper functions
        api_response_callback = _create_api_response_callback(
            job_id_str, running_token_total_ref, tenant_schema
        )
        tool_callback = _create_tool_callback(job_id_str, tenant_schema)
        output_callback = _create_output_callback(job_id_str, tenant_schema)

        try:
            # Create tenant-aware database service for the core
            with with_db(tenant_schema) as db_session:
                db_service = TenantAwareDatabaseService(db_session)
                core = APIGatewayCore(tenant_schema=tenant_schema, db_tenant=db_service)

                # Wrap the execute_api call in its own try-except block to better handle cancellation
                api_response = await core.execute_api(
                    job_id=job_id_str,
                    api_response_callback=api_response_callback,
                    tool_callback=tool_callback,
                    output_callback=output_callback,
                    session_id=str(job.session_id),
                )

            # Update job with result and API exchanges using tenant-aware database service
            with with_db(tenant_schema) as db_session:
                db_service = TenantAwareDatabaseService(db_session)
                updated_job = db_service.update_job(
                    job.id,
                    {
                        'status': api_response.status,
                        'result': api_response.extraction,
                        'completed_at': datetime.now(),
                        'updated_at': datetime.now(),
                    },
                )

            # Check if the job status is paused or error, which will implicitly pause the target's queue
            if api_response.status in [JobStatus.PAUSED, JobStatus.ERROR]:
                logger.info(
                    f'Target {job.target_id} queue will be paused due to job {api_response.status.value}'
                )
                # special message for api credits exceeded
                if (
                    api_response.status == JobStatus.PAUSED
                    and 'API Credits Exceeded' in str(api_response.reason)
                ):
                    add_job_log(
                        job_id_str,
                        'error',
                        f'Target {job.target_id} queue will be paused due to insufficient credits',
                        tenant_schema,
                    )
                else:
                    add_job_log(
                        job_id_str,
                        'system',
                        f'Target {job.target_id} queue will be paused due to job {api_response.status.value}',
                        tenant_schema,
                    )

            # Set completion future if it exists
            try:
                from server.routes import jobs

                if (
                    hasattr(jobs, 'completion_futures')
                    and job_id_str in jobs.completion_futures
                ):
                    future = jobs.completion_futures[job_id_str]
                    if not future.done():
                        future.set_result(api_response.status == JobStatus.SUCCESS)
                        logger.info(f'Set completion future for job {job_id_str}')
            except Exception as e:
                logger.error(f'Error setting completion future: {e}')

            msg = f'Job completed with status: {api_response.status}'
            # if status is not success, add the reason
            if api_response.status != JobStatus.SUCCESS:
                msg += f' and reason: {api_response.reason}'
            add_job_log(job_id_str, 'system', msg, tenant_schema)

            # Include token usage in the job data for telemetry
            # TODO: This is a hack to get the token usage into the job data for telemetry,
            # since for some reason that data is returned as None by the DB -> looks like some weird race condition

            from server.utils.job_utils import compute_job_metrics

            # Use tenant-aware database service for getting HTTP exchanges
            with with_db(tenant_schema) as db_session:
                db_service = TenantAwareDatabaseService(db_session)
                http_exchanges = db_service.list_job_http_exchanges(
                    job.id, use_trimmed=True
                )
                metrics = compute_job_metrics(updated_job, http_exchanges)
                job_with_tokens = updated_job.copy()
                job_with_tokens['total_input_tokens'] = metrics['total_input_tokens']
                job_with_tokens['total_output_tokens'] = metrics['total_output_tokens']

                capture_job_resolved(None, job_with_tokens, manual_resolution=False)

        except asyncio.CancelledError:
            # Job was cancelled during API execution
            logger.info(f'Job {job_id_str} was cancelled during API execution')

            # Access the token total from the reference list
            running_token_total = running_token_total_ref[0]

            # Check if cancellation was due to token limit
            if running_token_total > settings.TOKEN_LIMIT:
                error_message = f'Job was automatically terminated: exceeded token limit of {settings.TOKEN_LIMIT} tokens (used {running_token_total} tokens)'
                add_job_log(job_id_str, 'system', error_message, tenant_schema)
            else:
                add_job_log(
                    job_id_str, 'system', 'API execution was cancelled', tenant_schema
                )

            # Update job status to ERROR using tenant-aware database service
            with with_db(tenant_schema) as db_session:
                db_service = TenantAwareDatabaseService(db_session)
                db_service.update_job(
                    job.id,
                    {
                        'status': JobStatus.ERROR,
                        'error': 'Job was automatically terminated: exceeded token limit'
                        if running_token_total > settings.TOKEN_LIMIT
                        else 'Job was interrupted by user',
                        'completed_at': datetime.now(),
                        'updated_at': datetime.now(),
                        'total_input_tokens': running_token_total
                        // 2,  # Rough estimate
                        'total_output_tokens': running_token_total
                        // 2,  # Rough estimate
                    },
                )

            # Set completion future with error if it exists
            try:
                from server.routes import jobs

                if (
                    hasattr(jobs, 'completion_futures')
                    and job_id_str in jobs.completion_futures
                ):
                    future = jobs.completion_futures[job_id_str]
                    if not future.done():
                        future.set_exception(asyncio.CancelledError())
                        logger.info(
                            f'Set completion future with error for job {job_id_str}'
                        )
            except Exception as e:
                logger.error(f'Error setting completion future with error: {e}')

            # Re-raise to be caught by the outer try-except
            raise

    except asyncio.CancelledError:
        # Job was cancelled, already handled in interrupt_job or inner try-except
        logger.info(f'Job {job_id_str} was cancelled')

        # Access the token total from the reference list
        running_token_total = running_token_total_ref[0]

        # Check if this was due to token limit
        if running_token_total > settings.TOKEN_LIMIT:
            add_job_log(
                job_id_str,
                'system',
                f'Job execution was cancelled due to token limit ({running_token_total}/{settings.TOKEN_LIMIT})',
                tenant_schema,
            )
        else:
            add_job_log(
                job_id_str, 'system', 'Job execution was cancelled', tenant_schema
            )

        # No in-memory locks to clean up

        # Remove the task from running_job_tasks
        if job_id_str in running_job_tasks:
            del running_job_tasks[job_id_str]

        # Ensure completion future is set if it exists and hasn't been set yet
        try:
            from server.routes import jobs

            if (
                hasattr(jobs, 'completion_futures')
                and job_id_str in jobs.completion_futures
            ):
                future = jobs.completion_futures[job_id_str]
                if not future.done():
                    future.set_result(True)
                    logger.info(
                        f'Set completion future in finally block for job {job_id_str}'
                    )
        except Exception as e:
            logger.error(f'Error setting completion future in finally: {e}')

        # No chained processing here; worker loop will pick next claim

    except Exception as e:
        error_message = str(e)
        error_traceback = ''.join(
            traceback.format_exception(type(e), e, e.__traceback__)
        )

        # Update job with error using tenant-aware database service
        with with_db(tenant_schema) as db_session:
            db_service = TenantAwareDatabaseService(db_session)
            db_service.update_job(
                job.id,
                {
                    'status': JobStatus.ERROR,
                    'error': error_message,
                    'completed_at': datetime.now(),
                    'updated_at': datetime.now(),
                },
            )

        # Log that the target queue will be paused
        logger.info(f'Target {job.target_id} queue will be paused due to job error')
        add_job_log(
            job_id_str,
            'system',
            f'Target {job.target_id} queue will be paused due to job error',
            tenant_schema,
        )

        # Set completion future with error if it exists
        try:
            from server.routes import jobs

            if (
                hasattr(jobs, 'completion_futures')
                and job_id_str in jobs.completion_futures
            ):
                future = jobs.completion_futures[job_id_str]
                if not future.done():
                    future.set_exception(e)
                    logger.info(
                        f'Set completion future with error for job {job_id_str}'
                    )
        except Exception as e:
            logger.error(f'Error setting completion future with error: {e}')

        # Log the error
        add_job_log(
            job_id_str, 'system', f'Error executing job: {error_message}', tenant_schema
        )
        add_job_log(job_id_str, 'error', error_traceback, tenant_schema)
    finally:
        if job_id_str in running_job_tasks:
            del running_job_tasks[job_id_str]


# This function is deprecated - use tenant-specific processing instead
async def process_job_queue():
    """Deprecated: This function is no longer used. Use tenant-specific job processing."""
    logger.warning('process_job_queue is deprecated - use tenant-specific processing')
    raise NotImplementedError('Use tenant-specific job processing')


# This function is deprecated - use tenant-specific processing instead
async def process_next_job():
    """Deprecated: This function is no longer used. Use tenant-specific job processing."""
    logger.warning('process_next_job is deprecated - use tenant-specific processing')
    raise NotImplementedError('Use tenant-specific job processing')


async def enqueue_job(job_obj: Job, tenant_schema: str):
    """
    Updates a job's status to QUEUED, adds it to the tenant-specific queue,
    logs the event, and ensures the job processor task is running.

    Args:
        job_obj: The Job Pydantic model instance to enqueue.
        tenant_schema: The tenant schema for this job.
    """
    from server.database.multi_tenancy import with_db

    with with_db(tenant_schema) as db_session:
        db_service = TenantAwareDatabaseService(db_session)
        db_service.update_job_status(job_obj.id, JobStatus.QUEUED)
    add_job_log(str(job_obj.id), 'system', 'Job added to queue', tenant_schema)
    await start_worker_for_tenant(tenant_schema)
