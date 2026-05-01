from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import current_user, get_session
from app.models.user import User
from app.schemas.fd_schema import FDOut, FDPlanOut, FDStartIn
from app.services import fd_service

router = APIRouter(prefix="/fd", tags=["fd"])


@router.get("/plans", response_model=list[FDPlanOut])
async def list_plans(session: AsyncSession = Depends(get_session)) -> list[FDPlanOut]:
    return await fd_service.list_plans_out(session)


@router.get("", response_model=list[FDOut])
async def list_user_fds(
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> list[FDOut]:
    return await fd_service.list_user_fds_out(session, str(user.id))


@router.post("/start", response_model=FDOut)
async def start_fd(
    payload: FDStartIn,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> FDOut:
    return await fd_service.start_fd(session, str(user.id), payload)


@router.post("/{fd_id}/break", response_model=FDOut)
async def break_fd(
    fd_id: str,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> FDOut:
    return await fd_service.break_fd(session, str(user.id), fd_id)
