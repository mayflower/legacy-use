"""
Tools routes.
"""

from fastapi import APIRouter, HTTPException

from server.computer_use.tools.groups import TOOL_GROUPS_BY_VERSION

tools_router = APIRouter(prefix='/tools')


@tools_router.get('/{tool_name}')
async def get_tool(tool_name: str):
    """Get a tool for a given name."""
    raise HTTPException(status_code=500, detail='Not implemented')


@tools_router.get('/group/{group_name}')
async def get_tools_group(group_name: str):
    """Get all tools for a given group."""
    tool_group = TOOL_GROUPS_BY_VERSION[group_name]
    tool_specifications = [tool().internal_spec() for tool in tool_group.tools]
    return {'status': 'success', 'message': tool_specifications}
