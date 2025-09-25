from fastapi import APIRouter, HTTPException, Request

from server.database.multi_tenancy import get_tenant_by_clerk_user_id
from server.tenant_manager import create_tenant

tenants_router = APIRouter(prefix='/tenants', tags=['Tenants'])


@tenants_router.get('/', response_model=dict[str, str | None])
async def get_tenant(request: Request):
    clerk_user_id = request.state.clerk_user_id
    tenant = get_tenant_by_clerk_user_id(clerk_user_id, include_api_key=True)
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')

    return {
        'api_key': getattr(tenant, 'api_key', None),
        'name': tenant.name,
        'schema': tenant.schema,
        'host': tenant.host,
    }


@tenants_router.post('/', response_model=dict[str, str])
async def create_new_tenant(request: Request, name: str, schema: str, host: str):
    clerk_user_id = request.state.clerk_user_id

    try:
        new_tenant_api_key = create_tenant(name, schema, host, clerk_user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # TODO: create and add Anthropic API key for tenant

    # TODO: send mail with credentials to user

    return {'api_key': new_tenant_api_key}


# @tenants_router.delete('/', response_model=bool)
# async def delete_existing_tenant(schema: str):
#     # TODO: Can't be done by schema but must by clerk_user_id
#     return delete_tenant(schema)
