from pydantic_settings import BaseSettings

# Ordered pool of free OpenRouter models used for generation.
# When parallel workers start simultaneously, load is spread via per-call shuffle.
# Models are periodically verified — remove any that return 404/None consistently.
FREE_MODEL_POOL: list[str] = [
    "openai/gpt-oss-120b:free",              # reliable ~2-3s, good JSON
    "openai/gpt-oss-20b:free",               # reliable ~2s, slightly smaller
    "meta-llama/llama-3.3-70b-instruct:free",# good quality, can 429 under load
    "google/gemma-3-27b-it:free",            # good, can 429 under load
    "qwen/qwen3.6-plus:free",               # thinking disabled via extra_body
    "nousresearch/hermes-3-llama-3.1-405b:free",  # large model, good quality
    "z-ai/glm-4.5-air:free",               # slower backup
]


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://linguaai:linguaai123@localhost:5432/linguaai"
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "qwen/qwen3.6-plus:free"
    # Google AI Studio (Gemini) — openai-compat endpoint, tried first in generation
    GOOGLE_AI_STUDIO_KEY: str = ""
    GOOGLE_AI_STUDIO_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai"
    GOOGLE_AI_STUDIO_MODEL: str = "gemini-2.5-flash"
    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440
    AI_GENERATION_MAX_DRAFTS_PER_DAY: int = 30
    AI_GENERATION_MAX_EXERCISES_PER_REQUEST: int = 15
    AI_GENERATION_DEFAULT_EXERCISES: int = 8
    AI_GENERATION_MAX_TOKENS: int = 16384
    AI_GENERATION_MAX_COURSE_LESSONS: int = 12
    AI_GENERATION_MAX_RETRIES: int = 2

    # SMTP (password reset)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
