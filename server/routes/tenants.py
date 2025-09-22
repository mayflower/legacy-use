from fastapi import APIRouter, HTTPException

from server.tenant_manager import create_tenant, delete_tenant

tenants_router = APIRouter(prefix='/tenants', tags=['Tenants'])


@tenants_router.post('/', response_model=str)
async def create_new_tenant(name: str, schema: str, host: str, clerk_id: str):
    print(f'Creating new tenant: {name}, {schema}, {host}')

    # TODO: Do not allow a user to create a tenant if he already has a tenant

    try:
        new_tenant_api_key = create_tenant(name, schema, host, clerk_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # TODO: create and add Anthropic API key for tenant

    return new_tenant_api_key


@tenants_router.delete('/', response_model=bool)
async def delete_existing_tenant(schema: str):
    # TODO: Remove with missing authorization
    # TODO: Add admin auth
    return delete_tenant(schema)
