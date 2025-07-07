"""
Settings management routes.
"""

from typing import Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from server.computer_use.config import (
    APIProvider,
    get_default_model_name,
)
from server.settings import settings


def obscure_api_key(api_key: Optional[str]) -> Optional[str]:
    """
    Obscure an API key by showing only the last 4 characters.

    Args:
        api_key: The API key to obscure

    Returns:
        Obscured API key showing only last 4 digits, or None if key is None/empty
    """
    if not api_key or len(api_key) < 4:
        return None

    return f'****{api_key[-4:]}'


class ProviderConfiguration(BaseModel):
    """Configuration for a VLM provider."""

    provider: str
    name: str
    default_model: str
    available: bool
    description: str
    credentials: Dict[str, Optional[str]]


class ProvidersResponse(BaseModel):
    """Response model for providers endpoint."""

    current_provider: str
    providers: List[ProviderConfiguration]


# Create router
settings_router = APIRouter(prefix='/settings', tags=['Settings'])


@settings_router.get('/providers', response_model=ProvidersResponse)
async def get_providers():
    """Get available VLM providers and their configurations."""

    # Define provider configurations
    provider_configs = {
        APIProvider.ANTHROPIC: {
            'name': 'Anthropic',
            'description': 'Anthropic Claude models via direct API',
            'available': bool(getattr(settings, 'ANTHROPIC_API_KEY', None)),
            'credentials': {
                'api_key': obscure_api_key(
                    getattr(settings, 'ANTHROPIC_API_KEY', None)
                ),
            },
        },
        APIProvider.BEDROCK: {
            'name': 'Amazon Bedrock',
            'description': 'Anthropic Claude models via AWS Bedrock',
            'available': all(
                [
                    getattr(settings, 'AWS_ACCESS_KEY_ID', None),
                    getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
                    getattr(settings, 'AWS_REGION', None),
                ]
            ),
            'credentials': {
                'access_key_id': obscure_api_key(
                    getattr(settings, 'AWS_ACCESS_KEY_ID', None)
                ),
                'secret_access_key': obscure_api_key(
                    getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)
                ),
                'region': getattr(settings, 'AWS_REGION', None),
            },
        },
        APIProvider.VERTEX: {
            'name': 'Google Vertex AI',
            'description': 'Anthropic Claude models via Google Vertex AI',
            'available': all(
                [
                    getattr(settings, 'VERTEX_REGION', None),
                    getattr(settings, 'VERTEX_PROJECT_ID', None),
                ]
            ),
            'credentials': {
                'region': getattr(settings, 'VERTEX_REGION', None),
                'project_id': obscure_api_key(
                    getattr(settings, 'VERTEX_PROJECT_ID', None)
                ),
            },
        },
    }

    # Build provider list
    providers = []
    for provider_enum, config in provider_configs.items():
        providers.append(
            ProviderConfiguration(
                provider=provider_enum.value,
                name=config['name'],
                default_model=get_default_model_name(provider_enum),
                available=config['available'],
                description=config['description'],
                credentials=config['credentials'],
            )
        )

    return ProvidersResponse(
        current_provider=settings.API_PROVIDER.value, providers=providers
    )
