from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

from server.computer_use.config import APIProvider

ROOT_DIR = Path(__file__).parent.parent
ENV_FILE_PATH = ROOT_DIR / '.env'


class Settings(BaseSettings):
    app_name: str = 'Awesome API'
    items_per_user: int = 50

    API_PROVIDER: APIProvider

    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str

    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        extra='allow',
    )


settings = Settings()
