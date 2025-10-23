# load configuration (like database URLs) from environment variables here
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://medai:medai@localhost:5432/medai"
    class Config:
        env_file = ".env"

settings = Settings() # settings object to be imported elsewhere