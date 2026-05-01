from fastapi import APIRouter, Depends

from app.api.deps import current_user
from app.models.user import User
from app.schemas.user_schema import UserOut
from app.services.user_service import to_user_out

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(current_user)) -> UserOut:
    return to_user_out(user)
