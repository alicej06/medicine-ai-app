# load configuration (like database URLs) from environment variables here
from typing import Literal, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore", 
    )

    # Core
    database_url: str = Field(alias="DATABASE_URL")

    # LLM
    llm_provider: Literal["gemini", "hf"] = Field(default="gemini", alias="LLM_PROVIDER")

    # Gemini
    gemini_api_key: Optional[str] = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-1.5-flash", alias="GEMINI_MODEL")

    # HF local
    hf_model: str = Field(default="mistralai/Mistral-7B-Instruct-v0.2", alias="HF_MODEL")

    @property
    def DATABASE_URL(self) -> str: 
        return self.database_url

    @property
    def LLM_PROVIDER(self) -> str:
        return self.llm_provider

settings = Settings()