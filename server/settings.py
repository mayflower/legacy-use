from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

from server.computer_use.config import APIProvider

ROOT_DIR = Path(__file__).parent.parent
ENV_FILE_PATH = ROOT_DIR / '.env'


class Settings(BaseSettings):
    FASTAPI_SERVER_HOST: str = '0.0.0.0'
    FASTAPI_SERVER_PORT: int = 8088

    API_KEY: str = 'not-secure-api-key'
    API_KEY_NAME: str = 'X-API-Key'

    API_PROVIDER: APIProvider = APIProvider.ANTHROPIC

    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str

    ANTHROPIC_API_KEY: str

    VERTEX_REGION: str
    VERTEX_PROJECT_ID: str

    ENVIRONMENT: str = 'development'
    API_SENTRY_DSN: str | None = None

    LOG_RETENTION_DAYS: int = 7

    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        extra='allow',
    )


settings = Settings()  # type: ignore
