"""
Interactive session routes for AI-powered action execution.

This module provides endpoints for executing individual computer actions
or workflows using AI planning and execution, similar to the job system
but without creating persistent jobs.
"""

from datetime import datetime
import logging
from typing import List, Optional
from uuid import UUID

from anthropic.types.beta import BetaMessageParam
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from server.computer_use import get_default_model_name, get_tool_version, sampling_loop
from server.computer_use.config import APIProvider
from server.database import db
from server.models.base import JobStatus, Parameter
from server.routes.ai import ActionStep
from server.settings import settings

logger = logging.getLogger(__name__)

# Create router
interactive_router = APIRouter(prefix='/interactive', tags=['Interactive Sessions'])


class ActionResponse(BaseModel):
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    base64_image: Optional[str] = None
    ai_reasoning: Optional[str] = None  # AI's reasoning about the action


class WorkflowRequest(BaseModel):
    steps: List[ActionStep]
    parameters: List[Parameter]
    stop_on_error: bool = True


class WorkflowResponse(BaseModel):
    status: JobStatus
    reason: Optional[str] = None
    extraction: Optional[dict] = None
    exchanges: Optional[list] = None
    ai_output_parts: Optional[list] = None
    tool_results: Optional[list] = None


def create_workflow_prompt(workflow_request: WorkflowRequest) -> str:
    prompt = """You are an AI assistant that can control a computer through various tools.  Your goal is to execute the following steps:\n\n"""

    for i, step in enumerate(workflow_request.steps):
        prompt += f"""Step {i + 1}: {step.title}\n{step.instruction}\n---\n"""

    return prompt


@interactive_router.post(
    '/sessions/{session_id}/workflow', response_model=WorkflowResponse
)
async def execute_workflow(session_id: UUID, workflow_request: WorkflowRequest):
    """
    Execute a sequence of AI-powered computer actions as a workflow.

    This endpoint takes a list of natural language instructions and executes
    them sequentially using AI planning and execution.

    Example usage:
    POST /interactive/sessions/{session_id}/workflow
    {
        "steps": [
            {"instruction": "Take a screenshot to see the current state"},
            {"instruction": "Click on the File menu"},
            {"instruction": "Click on New Document", "context": "The File menu should be open"},
            {"instruction": "Type 'Hello World' in the document"}
        ],
        "stop_on_error": true
    }
    """
    # Validate session exists
    session = db.get_session(str(session_id))
    if not session:
        raise HTTPException(status_code=404, detail=f'Session {session_id} not found')

    # Check session is ready
    if session.get('state') != 'ready':
        raise HTTPException(
            status_code=400,
            detail=f'Session {session_id} is not ready (current state: {session.get("state")})',
        )

    # Get AI configuration once for the entire workflow
    model = get_default_model_name(APIProvider(settings.API_PROVIDER))
    tool_version = get_tool_version(model)

    logger.info(f'Creating job for interactive workflow: {workflow_request}')

    # Create a job for this interactive action
    job = db.create_job(
        {
            'target_id': session['target_id'],
            'session_id': session_id,
            'api_name': 'interactive_workflow',
            'parameters': {},  # TODO: fix parameters
            'status': 'running',
        }
    )
    if not job:
        raise HTTPException(status_code=500, detail='Failed to create job')

    # Create the prompt for the AI
    prompt = create_workflow_prompt(workflow_request)
    # Create initial message for the sampling loop
    messages = [BetaMessageParam(role='user', content=prompt)]

    # Collect AI output and tool results
    ai_output_parts = []
    tool_results = []

    def output_callback(content_block):
        if content_block.get('type') == 'text':
            ai_output_parts.append(content_block.get('text', ''))

    def tool_callback(tool_result, tool_id):
        tool_results.append(tool_result)

    # Execute using sampling loop
    try:
        result, exchanges = await sampling_loop(
            job_id=job['id'],
            db=db,
            model=model,
            provider=APIProvider(settings.API_PROVIDER),
            system_prompt_suffix='',
            messages=messages,
            output_callback=output_callback,
            tool_output_callback=tool_callback,
            api_key=settings.ANTHROPIC_API_KEY or '',
            only_n_most_recent_images=3,
            session_id=str(session_id),
            tool_version=tool_version,
        )

        logger.info(f'Sampling loop result: {result}')
        logger.info(f'Sampling loop exchanges: {exchanges}')

        job_success_update = {
            'status': JobStatus.SUCCESS.value,
            'completed_at': datetime.now(),
            'updated_at': datetime.now(),
        }
        db.update_job(job['id'], job_success_update)

        return WorkflowResponse(
            status=JobStatus.SUCCESS,
            extraction=result,
            exchanges=exchanges,
            ai_output_parts=ai_output_parts,
            tool_results=tool_results,
        )
    except Exception as e:  # Handle exceptions raised by sampling_loop (e.g., ValueError, APIError, RuntimeError)
        error_message = str(e)
        logger.error(f'Job {job["id"]}: {error_message}', exc_info=True)

        # Update job status to ERROR on exception
        job_update = {
            'status': JobStatus.ERROR.value,
            'error': error_message,
            'completed_at': datetime.now(),
            'updated_at': datetime.now(),
        }
        db.update_job(job['id'], job_update)

        return WorkflowResponse(
            status=JobStatus.ERROR,
            reason=error_message,
            extraction=None,
            exchanges=[],
        )
