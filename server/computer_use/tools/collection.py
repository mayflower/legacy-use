"""Collection classes for managing multiple tools."""

from typing import Any

from anthropic.types.beta import BetaToolUnionParam

from .base import (
    BaseAnthropicTool,
    ToolError,
    ToolFailure,
    ToolResult,
)
from .computer import BaseComputerTool


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
        try:
            if isinstance(tool, BaseComputerTool):
                return await tool(session_id=session_id, **tool_input)
            else:
                return await tool(**tool_input)
        except ToolError as e:
            return ToolFailure(error=e.message)
