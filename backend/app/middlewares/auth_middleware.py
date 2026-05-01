"""OAuth2 bearer scheme — used by `current_user` to extract the JWT."""
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=True)
