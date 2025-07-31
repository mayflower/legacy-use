"""Collection classes for managing multiple tools."""

import inspect
from typing import Any

from anthropic.types.beta import BetaToolUnionParam

from .base import (
    BaseAnthropicTool,
    ToolError,
    ToolFailure,
    ToolResult,
)
from .computer import BaseComputerTool


def validate_tool_input(
    tool: BaseAnthropicTool, tool_input: dict[str, Any]
) -> tuple[bool, str | None]:
    """Validate tool input against the tool's input schema."""

    print('tool_input', tool_input.keys())

    func = tool.__call__

    signature = inspect.signature(func)

    expected_params = set(signature.parameters.items())

    required_params = set()
    optional_params = set()

    for param, value in expected_params:
        # skip self, session_id, kwargs
        if param in {'self', 'session_id', 'kwargs'}:
            continue
        if value.default is not inspect.Parameter.empty:
            optional_params.add(param)
        else:
            required_params.add(param)
    print('required_params', required_params)
    print('optional_params', optional_params)
    missing_params = required_params - set(tool_input.keys())
    print('missing_params', missing_params)
    if missing_params:
        return (
            False,
            f'Tool {tool.name} input is missing required parameters: {missing_params}',
        )

    return True, None


class ToolCollection:
    """A collection of anthropic-defined tools."""

    def __init__(self, *tools: BaseAnthropicTool):
        self.tools = tools
        self.tool_map = {tool.to_params()['name']: tool for tool in tools}

    def to_params(
        self,
    ) -> list[BetaToolUnionParam]:
        return [tool.to_params() for tool in self.tools]

    async def run(
        self, *, name: str, tool_input: dict[str, Any], session_id: str
    ) -> ToolResult:
        tool = self.tool_map.get(name)
        if not tool:
            return ToolFailure(error=f'Tool {name} is invalid')

        # Validate tool input
        valid, error = validate_tool_input(tool, tool_input)

        # debug
        valid = False
        error = 'Tool is missing required parameters'

        if not valid:
            # create tool result to prompt the AI to fix the input
            return ToolResult(
                output=f'Tool {name} input is invalid: {error}',
            )

        try:
            if isinstance(tool, BaseComputerTool):
                return await tool(session_id=session_id, **tool_input)
            else:
                return await tool(**tool_input)
        except ToolError as e:
            return ToolFailure(error=e.message)
