from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent

ENV_FILE_PATH = ROOT_DIR / '.env'


class Settings(BaseSettings):
    app_name: str = 'Awesome API'
    items_per_user: int = 50

    model_config = SettingsConfigDict(env_file=ENV_FILE_PATH)


settings = Settings()
