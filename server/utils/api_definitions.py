"""
Utility functions for working with API definitions.

These helpers encapsulate common database lookups for API definition
parameters, response examples, and response schemas.
"""


async def get_api_parameters(api_def, db_tenant):
    """Get parameters for an API definition's active version."""
    version = await db_tenant.get_active_api_definition_version(api_def.id)
    return version.parameters if version else []


async def get_api_response_example(api_def, db_tenant):
    """Get response example for an API definition's active version."""
    version = await db_tenant.get_active_api_definition_version(api_def.id)
    return version.response_example if version else {}


async def get_api_response_schema(api_def, db_tenant):
    """Get response schema for an API definition's active version."""
    version = await db_tenant.get_active_api_definition_version(api_def.id)
    return version.response_schema if version else {}
