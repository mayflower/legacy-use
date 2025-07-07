from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = 'Awesome API'
    items_per_user: int = 50


settings = Settings()
