from fastapi import APIRouter

from server.tenant_manager import create_tenant, delete_tenant

tenants_router = APIRouter(prefix='/tenants', tags=['Tenants'])


@tenants_router.post('/', response_model=bool)
async def create_new_tenant(name: str, schema: str, host: str):
    print(f'Creating new tenant: {name}, {schema}, {host}')
    # TODO: Add admin auth
    return create_tenant(name, schema, host)


@tenants_router.delete('/', response_model=bool)
async def delete_existing_tenant(schema: str):
    # TODO: Add admin auth
    return delete_tenant(schema)
