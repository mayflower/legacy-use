import os
from pathlib import Path
from typing import Any, Dict, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

from server.config.env_file import write_to_env_file

ROOT_DIR = Path(__file__).parent.parent
ENV_FILE_PATH = ROOT_DIR / '.env'
ENV_LOCAL_FILE_PATH = ROOT_DIR / '.env.local'


def get_setting_env_file():
    if 'PYTEST_VERSION' in os.environ:
        print('Settings: Using test environment')
        return [ROOT_DIR / '.env.test', ROOT_DIR / '.env.template']

    return [ENV_FILE_PATH, ENV_LOCAL_FILE_PATH]


class AWSSettingsSource:
    """Custom settings source that can fetch secrets from AWS Secrets Manager."""

    def __init__(self, secret_name: Optional[str] = None):
        self.secret_name = secret_name or os.getenv('AWS_SECRETS_MANAGER_SECRET_NAME')
        self._secrets_cache: Optional[Dict[str, str]] = None

    def _get_secrets_from_aws(self) -> Optional[Dict[str, str]]:
        """Fetch secrets from AWS Secrets Manager if available."""
        if not self.secret_name:
            return None

        try:
            import boto3
            import json
            from botocore.exceptions import ClientError, NoCredentialsError

            # Check if AWS credentials are available
            session = boto3.Session()
            if not session.get_credentials():
                return None

            secretsmanager = session.client('secretsmanager')

            try:
                response = secretsmanager.get_secret_value(SecretId=self.secret_name)
                secret_string = response['SecretString']
                return json.loads(secret_string)
            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceNotFoundException':
                    print(f"AWS Secrets Manager: Secret '{self.secret_name}' not found")
                else:
                    print(f'AWS Secrets Manager error: {e}')
                return None
            except NoCredentialsError:
                print('AWS Secrets Manager: No credentials available')
                return None

        except ImportError:
            print('AWS Secrets Manager: boto3 not available')
            return None
        except Exception as e:
            print(f'AWS Secrets Manager error: {e}')
            return None

    def __call__(self, settings: BaseSettings) -> Dict[str, Any]:
        """Return settings from AWS Secrets Manager."""
        if self._secrets_cache is None:
            self._secrets_cache = self._get_secrets_from_aws() or {}

        return self._secrets_cache


def get_settings_sources():
    """Get all settings sources in order of precedence."""
    sources = []

    # Add AWS Secrets Manager source if configured
    aws_source = AWSSettingsSource()
    if aws_source.secret_name:
        sources.append(aws_source)

    # Add environment variables (highest precedence)
    sources.append(os.environ)

    return sources


class Settings(BaseSettings):
    FASTAPI_SERVER_HOST: str = '0.0.0.0'
    FASTAPI_SERVER_PORT: int = 8088

    DATABASE_URL: str = 'postgresql://postgres:postgres@localhost:5432/legacy_use'
    ALEMBIC_CONFIG_PATH: str = 'server/alembic.ini'

    # Database connection pooling settings
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 2
    DATABASE_POOL_TIMEOUT: int = 10
    DATABASE_POOL_RECYCLE: int = 3600
    DATABASE_POOL_PRE_PING: bool = True

    API_KEY_NAME: str = 'X-API-Key'

    GOOGLE_GENAI_API_KEY: str | None = None
    LEGACYUSE_PROXY_BASE_URL: str = 'https://api.legacy-use.com/'

    ENVIRONMENT: str = 'development'
    API_SENTRY_DSN: str | None = None

    VITE_PUBLIC_POSTHOG_HOST: str = 'https://eu.i.posthog.com'
    VITE_PUBLIC_POSTHOG_KEY: str = 'phc_i1lWRELFSWLrbwV8M8sddiFD83rVhWzyZhP27T3s6V8'
    VITE_PUBLIC_DISABLE_TRACKING: bool = False

    LOG_RETENTION_DAYS: int = 7
    SHOW_DOCS: bool = True
    HIDE_INTERNAL_API_ENDPOINTS_IN_DOC: bool = False
    API_SLUG_PREFIX: str = '/api'  # Slug prefix for all API routes, e.g. '/slug'. Default is empty (no prefix)

    model_config = SettingsConfigDict(
        env_file=get_setting_env_file(),
        extra='allow',
        sources=get_settings_sources(),
    )

    def __setattr__(self, name: str, value: Any) -> None:
        """Override setter to also write changes to .env.local file"""
        super().__setattr__(name, value)
        write_to_env_file(ENV_LOCAL_FILE_PATH, name, value)


settings = Settings()  # type: ignore
