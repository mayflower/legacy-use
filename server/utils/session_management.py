import asyncio
import logging
from typing import Any, Dict, Optional, Set  # Added Optional and Dict for type hints
from uuid import UUID

# Imports copied from job_execution.py for these functions
from server.models.base import SessionCreate

# Remove the direct import that causes circular dependency
# from server.routes.sessions import (
#     create_session,
# )  # This might cause issues if routes imports utils

# Initialize logger and db (copied from job_execution.py - potential issue)
logger = logging.getLogger(__name__)

# Global state copied from job_execution.py (potential issue)
targets_with_pending_sessions: Set[str] = set()
targets_with_pending_sessions_lock = asyncio.Lock()


async def launch_session_for_target(
    target_id: str, tenant_schema: str
) -> Optional[Dict[str, Any]]:
    """Launch a new session for the given target within the provided tenant schema."""
    try:
        logger.info(f'Launching session for target {target_id}')
        # Log the session launch - we don't have a job ID so we'll just log to the system logger
        logger.info(f'Launching new session for target {target_id}')

        # Create session object with required name field
        # Convert target_id to string before slicing
        target_id_str = str(target_id)
        session_name = f'Auto-created session for target {target_id_str[:8]}'
        session_create = SessionCreate(
            target_id=UUID(target_id), name=session_name
        )  # Ensure target_id is UUID

        # Launch session using the existing route function with proper dependencies
        # to avoid duplicating logic here.
        from server.database.multi_tenancy import with_db
        from server.routes.sessions import create_session
        from server.utils.db_dependencies import TenantAwareDatabaseService

        # Create a tenant-aware DB service and pass it explicitly, along with the tenant dict
        with with_db(tenant_schema) as db_session:
            db_tenant = TenantAwareDatabaseService(db_session)
            session_info: Optional[Dict[str, Any]] = await create_session(
                session_create,
                request=None,
                get_or_create=False,
                db_tenant=db_tenant,
                tenant={'schema': tenant_schema},
            )

        if session_info:
            # Log with prominent session ID
            session_id = session_info.get('id')
            logger.info(
                f'SUCCESS: Launched new session {session_id} for target {target_id}'
            )
            return session_info
        else:
            logger.error(
                f'Failed to launch session for target {target_id} - create_session returned None'
            )
            return None

    except Exception as e:
        logger.error(
            f'Error launching session for target {target_id}: {str(e)}', exc_info=True
        )
        # Don't raise here, let the finally block run, return None
        return None  # Indicate failure
    finally:
        # Remove target from pending sessions set only if it was added
        # Note: The original code adds it *before* calling this function.
        # This function might need the lock/set passed in if we refactor later.
        async with targets_with_pending_sessions_lock:
            if target_id in targets_with_pending_sessions:
                targets_with_pending_sessions.remove(target_id)
                logger.info(
                    f'Removed target {target_id} from pending sessions (in launch_session_for_target finally block)'
                )
