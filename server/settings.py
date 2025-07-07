from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

from server.computer_use.config import APIProvider

ROOT_DIR = Path(__file__).parent.parent
ENV_FILE_PATH = ROOT_DIR / '.env'


class Settings(BaseSettings):
    app_name: str = 'Awesome API'
    items_per_user: int = 50

    API_PROVIDER: APIProvider = APIProvider.ANTHROPIC

    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str

    ANTHROPIC_API_KEY: str

    VERTEX_REGION: str
    VERTEX_PROJECT_ID: str

    ENVIRONMENT: str = 'development'
    API_SENTRY_DSN: str | None = None

    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        extra='allow',
    )


settings = Settings()  # type: ignore
