import asyncio
import json
import logging
from datetime import datetime
from typing import Any, List

import httpx

from server.settings import settings
from server.utils.db_dependencies import TenantAwareDatabaseService

logger = logging.getLogger(__name__)


def trim_base64_images(data: Any) -> Any:
    """
    Recursively search and trim base64 image data in content structure.

    This function traverses a nested dictionary/list structure and replaces
    base64 image data with "..." to reduce log size.
    """
    if isinstance(data, dict):
        if (
            data.get('type') == 'image'
            and isinstance(data.get('source'), dict)
            and data['source'].get('type') == 'base64'
            and 'data' in data['source']
        ):
            data['source']['data'] = '...'
        else:
            for key, value in data.items():
                data[key] = trim_base64_images(value)
    elif isinstance(data, list):
        for i, item in enumerate(data):
            data[i] = trim_base64_images(item)

    return data


def trim_http_body(body: Any) -> Any:
    """
    Process an HTTP body (request or response) to trim base64 image data.

    Handles both string (JSON) and dictionary body formats.
    Returns the trimmed body.
    """
    try:
        if isinstance(body, str):
            try:
                body_json = json.loads(body)
                return json.dumps(trim_base64_images(body_json))
            except json.JSONDecodeError:
                if len(body) > 1000:
                    return '<trimmed>'
                return body
        elif isinstance(body, dict):
            return trim_base64_images(body)
        else:
            return body
    except Exception as e:  # noqa: BLE001 - safe logging util
        logger.error(f'Error trimming HTTP body: {str(e)}')
        return '<trim error>'


def add_job_log(job_id: str, log_type: str, content: Any, tenant_schema: str) -> None:
    """Add a log entry for a job with tenant context."""
    from server.database.multi_tenancy import with_db

    with with_db(tenant_schema) as db_session:
        db_service = TenantAwareDatabaseService(db_session)

        trimmed_content = trim_base64_images(content)

        log_data = {
            'job_id': job_id,
            'log_type': log_type,
            'content': content,
            'content_trimmed': trimmed_content,
        }

        db_service.create_job_log(log_data)
        logger.info(f'Added {log_type} log for job {job_id} in tenant {tenant_schema}')


def _create_api_response_callback(
    job_id_str: str, running_token_total_ref: List[int], tenant_schema: str
):
    """Creates the callback function for handling API responses."""

    def api_response_callback(request, response, error):
        nonlocal running_token_total_ref
        exchange = {
            'timestamp': datetime.now().isoformat(),
            'request': {
                'method': getattr(request, 'method', None),
                'url': str(getattr(request, 'url', '')),
                'headers': dict(getattr(request, 'headers', {})),
            },
        }

        try:
            if hasattr(request, 'read'):
                body_bytes = request.read()
                if body_bytes:
                    exchange['request']['body_size'] = len(body_bytes)
                    try:
                        exchange['request']['body'] = body_bytes.decode('utf-8')
                    except UnicodeDecodeError:
                        exchange['request']['body'] = '<binary data>'
                else:
                    exchange['request']['body_size'] = 0
                    exchange['request']['body'] = ''
            elif hasattr(request, 'content') and request.content:
                exchange['request']['body_size'] = len(request.content)
                try:
                    exchange['request']['body'] = request.content.decode('utf-8')
                except UnicodeDecodeError:
                    exchange['request']['body'] = '<binary data>'
            elif hasattr(request, '_content') and request._content:
                exchange['request']['body_size'] = len(request._content)
                try:
                    exchange['request']['body'] = request._content.decode('utf-8')
                except UnicodeDecodeError:
                    exchange['request']['body'] = '<binary data>'
            else:
                exchange['request']['body_size'] = 0
                exchange['request']['body'] = ''
        except Exception as e:  # noqa: BLE001 - safe logging util
            logger.error(f'Error getting request body: {str(e)}')
            exchange['request']['body_size'] = -1
            exchange['request']['body'] = f'<Error retrieving body: {str(e)}>'

        if isinstance(response, httpx.Response):
            exchange['response'] = {
                'status_code': response.status_code,
                'headers': dict(response.headers),
            }

            try:
                if hasattr(response, 'text'):
                    exchange['response']['body'] = response.text
                    exchange['response']['body_size'] = len(
                        response.text.encode('utf-8')
                    )
                elif hasattr(response, 'content') and response.content:
                    exchange['response']['body_size'] = len(response.content)
                    try:
                        exchange['response']['body'] = response.content.decode('utf-8')
                    except UnicodeDecodeError:
                        exchange['response']['body'] = '<binary data>'
                else:
                    exchange['response']['body_size'] = 0
                    exchange['response']['body'] = ''
            except Exception as e:  # noqa: BLE001 - safe logging util
                logger.error(f'Error getting response body: {str(e)}')
                exchange['response']['body_size'] = -1
                exchange['response']['body'] = f'<Error retrieving body: {str(e)}>'

            try:
                if hasattr(response, 'json'):
                    response_data = response.json()
                    if isinstance(response_data, dict) and 'usage' in response_data:
                        usage = response_data['usage']
                        total_tokens = 0

                        if 'input_tokens' in usage:
                            total_tokens += usage['input_tokens']
                            exchange['input_tokens'] = usage['input_tokens']

                        if 'output_tokens' in usage:
                            total_tokens += usage['output_tokens']
                            exchange['output_tokens'] = usage['output_tokens']

                        if 'cache_creation_input_tokens' in usage:
                            cache_creation_tokens = int(
                                usage['cache_creation_input_tokens'] * 1.25
                            )
                            total_tokens += cache_creation_tokens
                            exchange['cache_creation_tokens'] = cache_creation_tokens

                        if 'cache_read_input_tokens' in usage:
                            cache_read_tokens = int(
                                usage['cache_read_input_tokens'] / 10
                            )
                            total_tokens += cache_read_tokens
                            exchange['cache_read_tokens'] = cache_read_tokens

                        current_total = running_token_total_ref[0]
                        current_total += total_tokens
                        running_token_total_ref[0] = current_total

                        if current_total > settings.TOKEN_LIMIT:
                            limit_message = (
                                f'Token usage limit of {settings.TOKEN_LIMIT} exceeded. '
                                f'Current usage: {current_total}. Job will be interrupted.'
                            )
                            exchange['token_limit_exceeded'] = True
                            logger.warning(f'Job {job_id_str}: {limit_message}')
                            add_job_log(
                                job_id_str, 'system', limit_message, tenant_schema
                            )

                            task = asyncio.current_task()
                            if task:
                                task.cancel()
            except Exception as e:  # noqa: BLE001 - safe logging util
                logger.error(f'Error extracting token usage: {repr(e)}')

        if error:
            exchange['error'] = {
                'type': error.__class__.__name__,
                'message': str(error),
            }

        add_job_log(job_id_str, 'http_exchange', exchange, tenant_schema)

    return api_response_callback


def _create_tool_callback(job_id_str: str, tenant_schema: str):
    """Creates the callback function for handling tool usage."""

    def tool_callback(tool_result, tool_id):
        tool_log = {
            'tool_id': tool_id,
            'output': getattr(tool_result, 'output', None),
            'error': getattr(tool_result, 'error', None),
            'has_image': hasattr(tool_result, 'base64_image')
            and getattr(tool_result, 'base64_image') is not None,
        }

        if (
            hasattr(tool_result, 'base64_image')
            and tool_result.base64_image is not None
        ):
            tool_log['base64_image'] = tool_result.base64_image

        add_job_log(job_id_str, 'tool_use', tool_log, tenant_schema)

    return tool_callback


def _create_output_callback(job_id_str: str, tenant_schema: str):
    """Creates the callback function for handling message output."""

    def output_callback(content_block):
        add_job_log(job_id_str, 'message', content_block, tenant_schema)

    return output_callback
