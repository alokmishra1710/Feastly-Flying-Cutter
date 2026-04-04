import os
from dotenv import load_dotenv

# This looks for the .env file created above
load_dotenv()

class Settings:
    # The first argument in getenv must match the key in your .env file
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    JWT_SECRET: str = os.getenv("JWT_SECRET")
    RECAPTCHA_SECRET: str = os.getenv("RECAPTCHA_SECRET")
    # Set DISABLE_RECAPTCHA=true in .env during development/testing
    DISABLE_RECAPTCHA: bool = os.getenv("DISABLE_RECAPTCHA", "false").lower() == "true"

    def __init__(self):
        # Validation: Stop the app if these are missing
        if not self.DATABASE_URL:
            raise RuntimeError("DATABASE_URL is not set in .env")
        if not self.JWT_SECRET:
            raise RuntimeError("JWT_SECRET is not set in .env")

settings = Settings()
