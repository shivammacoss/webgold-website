"""Activity heartbeat — the user app pings this every 2 minutes while signed
in so we keep an up-to-date IP + location trail.
"""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import current_user, get_session
from app.api.v1.routes.auth_routes import (
    _extract_accuracy,
    _extract_browser_geo,
    _extract_client_ip,
)
from app.models.user import User
from app.services import auth_service

router = APIRouter(prefix="/audit", tags=["audit"])


@router.post("/heartbeat", status_code=status.HTTP_204_NO_CONTENT)
async def heartbeat(
    request: Request,
    user: User = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Records a HEARTBEAT row with the user's current IP + browser geo (if any)."""
    lat, lng = _extract_browser_geo(request)
    meta = auth_service.RequestMeta(
        ip=_extract_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        lat=lat,
        lng=lng,
        accuracy_m=_extract_accuracy(request),
    )
    await auth_service.record_activity(session, user.id, meta, kind="HEARTBEAT")
