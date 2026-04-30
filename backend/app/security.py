from datetime import datetime, timedelta, timezone
from typing import Literal

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TokenType = Literal["access", "refresh"]


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _expiry(token_type: TokenType) -> datetime:
    now = datetime.now(timezone.utc)
    if token_type == "access":
        return now + timedelta(minutes=settings.jwt_access_minutes)
    return now + timedelta(days=settings.jwt_refresh_days)


def create_token(user_id: str, token_type: TokenType = "access") -> str:
    payload = {
        "sub": user_id,
        "type": token_type,
        "exp": _expiry(token_type),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError as e:
        raise ValueError("invalid token") from e
