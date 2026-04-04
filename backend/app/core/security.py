from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    """
    Hashes a password using Argon2. No character limit.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against an Argon2 hash.
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Returns False if verification fails or the hash is invalid
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    # Token expires in 24 hours
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)
