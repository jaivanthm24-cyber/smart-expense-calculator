import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Expense Calculator"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database: Default to sqlite locally if PostgreSQL is not specified
    DATABASE_URL: str = Field(
        default="sqlite:///./smart_expense.db",
        description="Database connection string (PostgreSQL or SQLite)",
    )

    # JWT Authentication
    SECRET_KEY: str = Field(
        default="smart-expense-calculator-super-secret-production-grade-jwt-key-2026",
        description="JWT secret key for signing tokens",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

    # Environment
    ENVIRONMENT: str = "development"

    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "allow",
    }


settings = Settings()
