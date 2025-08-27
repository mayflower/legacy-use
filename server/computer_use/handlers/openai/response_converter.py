"""
OpenAI response conversion utilities.

This module contains utilities for converting OpenAI responses to Anthropic format.
"""

import json

from anthropic.types.beta import (
    BetaContentBlockParam,
    BetaTextBlockParam,
    BetaToolUseBlockParam,
)
from openai.types.chat import ChatCompletion

from server.computer_use.handlers.utils.key_mapping_utils import normalize_key_combo
from server.computer_use.logging import logger


def process_computer_tool(tool_name: str, tool_input: dict) -> dict:
    """
    Process computer tool input, normalizing action names and parameters.

    Args:
        tool_name: Name of the tool being called
        tool_input: Raw tool input

    Returns:
        Processed tool input
    """
    # Computer tool action names exposed as individual functions
    COMPUTER_ACTIONS = {
        'screenshot',
        'left_click',
        'mouse_move',
        'type',
        'key',
        'scroll',
        'left_click_drag',
        'right_click',
        'middle_click',
        'double_click',
        'left_mouse_down',
        'left_mouse_up',
        'hold_key',
        'wait',
    }

    # If called as an action function, embed action name
    if tool_name in COMPUTER_ACTIONS:
        tool_input = tool_input or {}
        tool_input['action'] = tool_name

    # Convert coordinate list to tuple if present
    if 'coordinate' in tool_input and isinstance(tool_input['coordinate'], list):
        tool_input['coordinate'] = tuple(tool_input['coordinate'])

    # Map legacy 'click' action to 'left_click' for compatibility
    if tool_input.get('action') == 'click':
        tool_input['action'] = 'left_click'

    action = tool_input.get('action')

    # Normalize key combos and key/text field for key-like actions
    if action in {'key', 'hold_key'}:
        if 'text' not in tool_input and 'key' in tool_input:
            # Remap key -> text
            tool_input['text'] = tool_input.pop('key')
        if 'text' in tool_input and isinstance(tool_input['text'], str):
            tool_input['text'] = normalize_key_combo(tool_input['text'])

    # Special handling for scroll: ensure scroll_amount is int and direction is valid
    if action == 'scroll':
        # scroll_amount should be int (wheel notches)
        if 'scroll_amount' in tool_input:
            try:
                tool_input['scroll_amount'] = int(tool_input['scroll_amount'])
            except Exception:
                logger.warning(
                    f'scroll_amount could not be converted to int: {tool_input.get("scroll_amount")}'
                )
        # scroll_direction should be one of the allowed values
        allowed_directions = {'up', 'down', 'left', 'right'}
        if 'scroll_direction' in tool_input:
            direction = str(tool_input['scroll_direction']).lower()
            if direction not in allowed_directions:
                logger.warning(f'Invalid scroll_direction: {direction}')
            tool_input['scroll_direction'] = direction

    # make sure api_type is 20250124
    tool_input['api_type'] = 'computer_20250124'
    return tool_input


def process_extraction_tool(tool_input: dict) -> dict:
    """
    Process extraction tool input, ensuring proper data structure.

    Args:
        tool_input: Raw tool input

    Returns:
        Processed tool input with proper data structure
    """
    logger.debug(f'Processing extraction tool - original input: {tool_input}')

    # OpenAI sends {name: ..., result: ...} directly based on our simplified schema
    # But our extraction tool expects {data: {name: ..., result: ...}}
    if 'data' not in tool_input:
        # If 'data' field is missing but we have name and result, wrap them
        if 'name' in tool_input and 'result' in tool_input:
            original_input = tool_input.copy()
            tool_input = {
                'data': {
                    'name': tool_input['name'],
                    'result': tool_input['result'],
                }
            }
            logger.debug(
                f'Wrapped extraction data - from: {original_input} to: {tool_input}'
            )
        else:
            logger.warning(
                f'Extraction tool call missing required fields. Has: {tool_input.keys()}, needs: name, result'
            )
    else:
        # data field already exists, validate its structure
        extraction_data = tool_input['data']
        logger.debug(f"Extraction tool already has 'data' field: {extraction_data}")
        if not isinstance(extraction_data, dict):
            logger.warning(f'Extraction data is not a dict: {type(extraction_data)}')
        elif 'name' not in extraction_data or 'result' not in extraction_data:
            logger.warning(
                f'Extraction data missing required fields. Has: {extraction_data.keys()}, needs: name, result'
            )

    return tool_input


def convert_tool_call(tool_call) -> BetaContentBlockParam:
    """
    Convert a single OpenAI tool call to Anthropic format.

    Args:
        tool_call: OpenAI tool call object

    Returns:
        Anthropic tool use block
    """
    try:
        # Parse the function arguments
        tool_input = json.loads(tool_call.function.arguments)
        tool_name = tool_call.function.name

        # Log the raw tool input for debugging
        logger.debug(f'Processing tool call: {tool_name} (id: {tool_call.id})')

        # Computer tool action names exposed as individual functions
        COMPUTER_ACTIONS = {
            'screenshot',
            'left_click',
            'mouse_move',
            'type',
            'key',
            'scroll',
            'left_click_drag',
            'right_click',
            'middle_click',
            'double_click',
            'left_mouse_down',
            'left_mouse_up',
            'hold_key',
            'wait',
        }

        # Special handling for computer tool or any of its action functions
        if tool_name == 'computer' or tool_name in COMPUTER_ACTIONS:
            tool_input = process_computer_tool(tool_name, tool_input)
            # Always emit a single Anthropic tool_use for 'computer'
            tool_name = 'computer'
            logger.debug(
                f'Added computer tool_use from action {tool_call.function.name} - id: {tool_call.id}'
            )

        # Special handling for extraction tool
        elif tool_name == 'extraction':
            tool_input = process_extraction_tool(tool_input)

        # Create the tool use block
        return BetaToolUseBlockParam(
            type='tool_use',
            id=tool_call.id,
            name=tool_name,
            input=tool_input,
        )

    except json.JSONDecodeError as e:
        logger.error(
            f'Failed to parse tool arguments: {tool_call.function.arguments}, error: {e}'
        )
        # Return error as text block
        return BetaTextBlockParam(
            type='text',
            text=f'Error parsing tool arguments for {tool_call.function.name}: {e}',
        )


def convert_openai_to_anthropic_response(
    response: ChatCompletion,
) -> tuple[list[BetaContentBlockParam], str]:
    """
    Convert OpenAI response to Anthropic format blocks and stop reason.

    Maps OpenAI's finish_reason to Anthropic's stop_reason:
    - 'stop' -> 'end_turn'
    - 'tool_calls' -> 'tool_use'
    - 'length' -> 'max_tokens'
    """
    # OpenAI finish reason to Anthropic stop reason mapping
    STOP_REASON_MAP = {
        'stop': 'end_turn',
        'tool_calls': 'tool_use',
        'length': 'max_tokens',
    }

    content_blocks = []

    # Log the full response for debugging
    logger.debug(f'Full OpenAI response object: {response}')

    # Extract message from OpenAI response
    message = response.choices[0].message
    logger.debug(
        f'OpenAI message extracted - content: {message.content is not None}, tool_calls: {len(message.tool_calls) if message.tool_calls else 0}'
    )

    # Log tool calls if present
    if message.tool_calls:
        for tc in message.tool_calls:
            logger.debug(f'OpenAI tool call: {tc.function.name} (id: {tc.id})')

    # Convert content
    if message.content:
        content_blocks.append(BetaTextBlockParam(type='text', text=message.content))

    # Convert tool calls
    if message.tool_calls:
        logger.debug(
            f'Converting {len(message.tool_calls)} tool calls from OpenAI response'
        )
        for tool_call in message.tool_calls:
            block = convert_tool_call(tool_call)
            content_blocks.append(block)
            logger.debug(
                f'Added to content blocks - tool: {tool_call.function.name}, id: {tool_call.id}'
            )

    # Map finish reason
    finish_reason = response.choices[0].finish_reason
    stop_reason = STOP_REASON_MAP.get(finish_reason, 'end_turn')

    return content_blocks, stop_reason
