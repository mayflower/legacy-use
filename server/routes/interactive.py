"""
Interactive session routes for AI-powered action execution.

This module provides endpoints for executing individual computer actions
or workflows using AI planning and execution, similar to the job system
but without creating persistent jobs.
"""

import asyncio
import logging
from typing import List, Optional
from uuid import UUID

from anthropic.types.beta import BetaMessageParam
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from server.computer_use import get_default_model_name, get_tool_version, sampling_loop
from server.computer_use.config import APIProvider
from server.database import db
from server.models.base import Parameter
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
    success: bool
    completed_steps: int
    total_steps: int
    results: List[ActionResponse]
    error: Optional[str] = None


def create_action_prompt(action_step: ActionStep) -> str:
    """Create a prompt for the AI to execute a specific action"""
    return f"""Your goal is: {action_step.title}
    Please execute the following action: {action_step.instruction}
Might make sense to take a screenshot first to see the current state, then perform the requested action. Be precise and follow the instruction exactly.
"""


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
    try:
        # Validate session exists
        session = db.get_session(str(session_id))
        if not session:
            raise HTTPException(
                status_code=404, detail=f'Session {session_id} not found'
            )

        # Check session is ready
        if session.get('state') != 'ready':
            raise HTTPException(
                status_code=400,
                detail=f'Session {session_id} is not ready (current state: {session.get("state")})',
            )

        results = []
        completed_steps = 0

        # Get AI configuration once for the entire workflow
        model = get_default_model_name(APIProvider(settings.API_PROVIDER))
        tool_version = get_tool_version(model)

        # Create a job for this interactive action
        job = db.create_job(
            {
                'target_id': session['target_id'],
                'session_id': session_id,
                'api_name': 'interactive_workflow',
                'parameters': workflow_request.parameters,
                'status': 'running',
            }
        )
        if not job:
            raise HTTPException(status_code=500, detail='Failed to create job')

        try:
            # Create the prompt for the AI
            prompt = create_action_prompt(workflow_request.steps[0])

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

                # Determine if the action was successful
                success = True
                error_msg = None

                # Check if result indicates an error
                if isinstance(result, dict) and not result.get('success', True):
                    success = False
                    error_msg = result.get('error', 'Unknown error occurred')

                # Get the most recent tool result (usually contains the final action result)
                final_tool_result = tool_results[-1] if tool_results else None
                output = final_tool_result.output if final_tool_result else None
                base64_image = (
                    final_tool_result.base64_image if final_tool_result else None
                )

                # If there was a tool error, mark as failed
                if final_tool_result and final_tool_result.error:
                    db.update_job_status(job['id'], 'failed')
                    success = False
                    error_msg = final_tool_result.error
                    logger.error(f'Tool error: {error_msg}')
                else:
                    # Update job status to completed
                    db.update_job_status(job['id'], 'completed')

                action_response = ActionResponse(
                    success=success,
                    output=output,
                    error=error_msg,
                    base64_image=base64_image,
                    ai_reasoning=' '.join(ai_output_parts) if ai_output_parts else None,
                )

            except Exception as sampling_error:
                logger.error(f'Sampling loop error for step {i + 1}: {sampling_error}')
                action_response = ActionResponse(
                    success=False,
                    error=f'AI execution failed: {str(sampling_error)}',
                )

            results.append(action_response)
            completed_steps += 1

            # If there was an error and we should stop on error
            if not action_response.success and workflow_request.stop_on_error:
                logger.warning(
                    f'Workflow stopped due to error: {action_response.error}'
                )

            # Small delay between steps to allow UI to settle
            await asyncio.sleep(0.5)

        except Exception as e:
            error_response = ActionResponse(
                success=False, error=f'Workflow failed: {str(e)}'
            )
            results.append(error_response)

            if workflow_request.stop_on_error:
                return

        return WorkflowResponse(
            success=completed_steps == len(workflow_request.steps)
            and all(r.success for r in results),
            completed_steps=completed_steps,
            total_steps=len(workflow_request.steps),
            results=results,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Error executing workflow: {str(e)}')
        return WorkflowResponse(
            success=False,
            completed_steps=0,
            total_steps=len(workflow_request.steps),
            results=[],
            error=f'Workflow failed: {str(e)}',
        )
