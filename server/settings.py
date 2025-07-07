from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from environs import Env

ROOT_DIR = Path(__file__).parent.parent
ENV_FILE_PATH = ROOT_DIR / '.env'

print('Root dir', ROOT_DIR)

env = Env()
env.read_env(ENV_FILE_PATH)

print('API_KEY', env('API_KEY'))

print('Env', env.dump())

print('FAIL', env('FAIL'))


class Settings(BaseSettings):
    app_name: str = 'Awesome API'
    items_per_user: int = 50

    model_config = SettingsConfigDict(env_file=ENV_FILE_PATH, extra='allow')


settings = Settings()
