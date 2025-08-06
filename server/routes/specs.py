"""
API specifications routes.
"""

from typing import Any, Dict

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from server.database import db

specs_router = APIRouter(prefix='/specs')

# Initialize OpenAPI spec structure
openapi_spec = {
    'openapi': '3.0.3',
    'info': {
        'title': 'API Gateway Specifications',
        'description': 'Auto-generated API specifications from database definitions',
        'version': '1.0.0',
    },
    'servers': [{'url': '/api/v1', 'description': 'API Gateway server'}],
    'paths': {},
    'components': {
        'schemas': {},
        'securitySchemes': {
            'ApiKeyAuth': {
                'type': 'apiKey',
                'in': 'header',
                'name': 'X-API-Key',
            }
        },
    },
    'security': [{'ApiKeyAuth': []}],
}


def convert_parameter_to_openapi_property(param: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert an API definition parameter to OpenAPI property format.

    Args:
        param: Parameter dictionary from the database

    Returns:
        OpenAPI property definition
    """
    property_def = {
        'description': param.get('description', ''),
    }

    # Map parameter types to OpenAPI types
    param_type = param.get('type', 'string').lower()
    if param_type in ['string', 'str']:
        property_def['type'] = 'string'
    elif param_type in ['integer', 'int']:
        property_def['type'] = 'integer'
    elif param_type in ['number', 'float']:
        property_def['type'] = 'number'
    elif param_type in ['boolean', 'bool']:
        property_def['type'] = 'boolean'
    elif param_type in ['array', 'list']:
        property_def['type'] = 'array'
        property_def['items'] = {'type': 'string'}  # Default to string items
    elif param_type in ['object', 'dict']:
        property_def['type'] = 'object'
    else:
        property_def['type'] = 'string'  # Default fallback

    # Add enum values if provided
    if 'enum' in param:
        property_def['enum'] = param['enum']

    # Add example if provided
    if 'example' in param:
        property_def['example'] = param['example']

    # Add default if provided
    if 'default' in param:
        property_def['default'] = param['default']

    return property_def


def convert_api_definition_to_openapi_path(
    api_def: Any, version: Any
) -> Dict[str, Any]:
    """
    Convert an API definition and version to OpenAPI path format.

    Args:
        api_def: APIDefinition model instance
        version: APIDefinitionVersion model instance

    Returns:
        OpenAPI path definition
    """
    # Convert parameters to OpenAPI properties
    properties = {}
    required = []

    for param in version.parameters:
        param_name = param.get('name', '')
        if param_name:
            properties[param_name] = convert_parameter_to_openapi_property(param)
            if param.get('required', False):
                required.append(param_name)

    # Create request schema
    request_schema = {
        'type': 'object',
        'properties': properties,
    }
    if required:
        request_schema['required'] = required

    # Create response schema based on response_example
    response_schema: Dict[str, Any] = {'type': 'object', 'description': 'API response'}

    if version.response_example:
        # Try to infer schema from example
        if isinstance(version.response_example, dict):
            response_properties = {}
            for key, value in version.response_example.items():
                if isinstance(value, str):
                    response_properties[key] = {'type': 'string'}
                elif isinstance(value, int):
                    response_properties[key] = {'type': 'integer'}
                elif isinstance(value, float):
                    response_properties[key] = {'type': 'number'}
                elif isinstance(value, bool):
                    response_properties[key] = {'type': 'boolean'}
                elif isinstance(value, list):
                    response_properties[key] = {
                        'type': 'array',
                        'items': {'type': 'string'},
                    }
                elif isinstance(value, dict):
                    response_properties[key] = {'type': 'object'}
                else:
                    response_properties[key] = {'type': 'string'}

            if response_properties:
                response_schema['properties'] = response_properties

    # Create the path definition
    path_def = {
        'post': {
            'summary': api_def.name,
            'description': api_def.description,
            'tags': ['API Gateway'],
            'requestBody': {
                'required': True,
                'content': {'application/json': {'schema': request_schema}},
            },
            'responses': {
                '200': {
                    'description': 'Successful response',
                    'content': {
                        'application/json': {
                            'schema': response_schema,
                            'example': version.response_example,
                        }
                    },
                },
                '400': {'description': 'Bad request'},
                '500': {'description': 'Internal server error'},
            },
        }
    }

    return path_def


@specs_router.get('/openapi.json')
async def get_api_specs():
    """
    Get API specifications in OpenAPI format.

    Returns all active API definitions from the database as OpenAPI compatible specifications.
    """
    try:
        # Get all non-archived API definitions with versions eagerly loaded
        api_definitions = await db.get_api_definitions_with_versions(
            include_archived=False
        )

        # Convert each API definition to OpenAPI format
        for api_def in api_definitions:
            # Get the active version for this API definition
            active_version = None
            for version in api_def.versions:
                if version.is_active:
                    active_version = version
                    break

            if not active_version:
                continue  # Skip if no active version

            # Create path for this API
            path_key = f'/api/{api_def.name}'
            openapi_spec['paths'][path_key] = convert_api_definition_to_openapi_path(
                api_def, active_version
            )

        return JSONResponse(content=openapi_spec)

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={'error': f'Failed to generate API specifications: {str(e)}'},
        )
