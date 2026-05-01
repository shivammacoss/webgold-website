from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.schemas.auth_schema import LoginIn, RefreshIn, RegisterIn, TokenPair
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _extract_client_ip(request: Request) -> str | None:
    """Trust X-Forwarded-For first (behind a proxy/CDN), then X-Real-IP, then
    fall back to the immediate socket peer."""
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    return request.client.host if request.client else None


def _extract_browser_geo(request: Request) -> tuple[float | None, float | None]:
    """Reads optional X-Geo-Lat / X-Geo-Lng headers — set by the user app's
    login form when the browser grants Geolocation permission."""
    raw_lat = request.headers.get("x-geo-lat")
    raw_lng = request.headers.get("x-geo-lng")
    try:
        lat = float(raw_lat) if raw_lat else None
        lng = float(raw_lng) if raw_lng else None
    except ValueError:
        return None, None
    if lat is None or lng is None:
        return None, None
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        return None, None
    return lat, lng


def _extract_accuracy(request: Request) -> int | None:
    raw = request.headers.get("x-geo-accuracy")
    try:
        return int(float(raw)) if raw else None
    except ValueError:
        return None


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterIn, session: AsyncSession = Depends(get_session)
) -> TokenPair:
    return await auth_service.register_user(session, payload)


@router.post("/login", response_model=TokenPair)
async def login(
    payload: LoginIn,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> TokenPair:
    lat, lng = _extract_browser_geo(request)
    meta = auth_service.RequestMeta(
        ip=_extract_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        lat=lat,
        lng=lng,
        accuracy_m=_extract_accuracy(request),
    )
    return await auth_service.login_user(session, payload.email, payload.password, meta)


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    payload: RefreshIn, session: AsyncSession = Depends(get_session)
) -> TokenPair:
    return await auth_service.refresh_tokens(session, payload.refresh_token)
