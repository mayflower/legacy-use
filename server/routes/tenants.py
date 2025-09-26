import httpx
from fastapi import APIRouter, HTTPException, Request

from server.computer_use.config import APIProvider
from server.database.multi_tenancy import get_tenant_by_clerk_user_id
from server.settings import settings
from server.settings_tenant import set_tenant_setting
from server.tenant_manager import create_tenant, delete_tenant

tenants_router = APIRouter(prefix='/tenants', tags=['Tenants'])


async def signup_legacy_use_proxy(email: str):
    base_url = settings.LEGACYUSE_PROXY_BASE_URL.rstrip('/') + '/'
    url = f'{base_url}signup'
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            url,
            json={'email': email, 'skipEmailSending': True},
        )
        return response.json()


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
    clerk_email = request.state.clerk_email

    try:
        new_tenant_api_key = create_tenant(name, schema, host, clerk_user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        signup_response = await signup_legacy_use_proxy(clerk_email)
        legacy_use_proxy_key = signup_response.get('api_key')
        if not legacy_use_proxy_key:
            raise HTTPException(
                status_code=400, detail='Failed to sign up with legacy-use proxy'
            )
    except Exception as e:
        delete_tenant(schema)
        raise HTTPException(status_code=400, detail=str(e))

    try:
        set_tenant_setting(
            schema,
            'LEGACYUSE_PROXY_API_KEY',
            legacy_use_proxy_key,
        )
        set_tenant_setting(schema, 'API_PROVIDER', APIProvider.LEGACYUSE_PROXY.value)
    except Exception as e:
        delete_tenant(schema)
        raise HTTPException(status_code=400, detail=str(e))

    return {'api_key': new_tenant_api_key}


# @tenants_router.delete('/', response_model=bool)
# async def delete_existing_tenant(schema: str):
#     # TODO: Can't be done by schema but must by clerk_user_id
#     return delete_tenant(schema)
