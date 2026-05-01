"""Auth business logic — register / login / token refresh."""
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.exceptions.custom_exceptions import (
    EmailAlreadyRegistered,
    InvalidCredentials,
    InvalidReferralCode,
)
from app.integrations.ip_geo_client import lookup_ip_geo
from app.integrations.reverse_geo_client import reverse_geocode
from app.models.audit import LoginLog
from app.models.user import User
from app.repositories import audit_repo, user_repo
from app.schemas.auth_schema import RegisterIn, TokenPair
from app.utils.helpers import gen_referral_code


@dataclass
class RequestMeta:
    ip: str | None = None
    user_agent: str | None = None
    # Optional precise coords from the browser's Geolocation API. When present
    # they win over IP-based geo (and work on localhost where IP geo can't).
    lat: float | None = None
    lng: float | None = None
    accuracy_m: int | None = None


async def _unique_referral_code(session: AsyncSession) -> str:
    for _ in range(20):
        code = gen_referral_code()
        if not await user_repo.get_user_by_referral_code(session, code):
            return code
    raise RuntimeError("could not generate referral code")


async def register_user(session: AsyncSession, payload: RegisterIn) -> TokenPair:
    if await user_repo.get_user_by_email(session, payload.email):
        raise EmailAlreadyRegistered()

    referrer: User | None = None
    if payload.referral_code:
        referrer = await user_repo.get_user_by_referral_code(session, payload.referral_code)
        if not referrer:
            raise InvalidReferralCode()

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        referral_code=await _unique_referral_code(session),
        referred_by_id=referrer.id if referrer else None,
    )
    await user_repo.insert_user(session, user)
    await user_repo.insert_wallet(session, user.id)

    if referrer:
        await user_repo.insert_referral(session, referrer.id, user.id)

    return _issue_token_pair(str(user.id))


async def login_user(
    session: AsyncSession,
    email: str,
    password: str,
    meta: RequestMeta | None = None,
) -> TokenPair:
    user = await user_repo.get_user_by_email(session, email)
    if not user or not verify_password(password, user.password_hash):
        raise InvalidCredentials()

    if meta is not None:
        await record_activity(session, user.id, meta, kind="LOGIN")

    return _issue_token_pair(str(user.id))


async def record_activity(
    session: AsyncSession, user_id, meta: RequestMeta, *, kind: str
) -> None:
    """Best-effort audit row. Geo lookup is async + bounded; failures are silent.

    Priority: explicit browser coords > IP-based geo. Browser coords also get
    reverse-geocoded so we can show a city/country, not just lat/lng.

    `kind`: "LOGIN" for auth events, "HEARTBEAT" for periodic pings while signed in.
    """
    country = region = city = None
    lat = meta.lat
    lng = meta.lng
    accuracy = meta.accuracy_m
    geo_source: str = "NONE"

    if lat is not None and lng is not None:
        geo_source = "BROWSER"
        place = await reverse_geocode(lat, lng)
        country, region, city = place.country, place.region, place.city
    else:
        ip_geo = await lookup_ip_geo(meta.ip or "")
        country, region, city = ip_geo.country, ip_geo.region, ip_geo.city
        lat, lng = ip_geo.lat, ip_geo.lng
        accuracy = None
        if lat is not None and lng is not None:
            geo_source = "IP"

    log = LoginLog(
        user_id=user_id,
        kind=kind,
        ip_address=meta.ip,
        user_agent=(meta.user_agent or "")[:512] or None,
        country=country,
        region=region,
        city=city,
        lat=lat,
        lng=lng,
        geo_source=geo_source,
        accuracy_m=accuracy,
    )
    await audit_repo.insert_login_log(session, log)


async def issue_impersonation_tokens(
    session: AsyncSession, target_user_id
) -> TokenPair:
    """Used by the admin impersonation endpoint — no password check, since the
    caller has already been authorised as an admin."""
    user = await user_repo.get_user_by_id(session, target_user_id)
    if not user:
        raise InvalidCredentials("user not found")
    return _issue_token_pair(str(user.id))


async def refresh_tokens(session: AsyncSession, refresh_token: str) -> TokenPair:
    try:
        data = decode_token(refresh_token)
    except ValueError:
        raise InvalidCredentials("invalid refresh token")
    if data.get("type") != "refresh":
        raise InvalidCredentials("wrong token type")

    user = await user_repo.get_user_by_id(session, data["sub"])
    if not user:
        raise InvalidCredentials("user not found")
    return _issue_token_pair(str(user.id))


def _issue_token_pair(user_id: str) -> TokenPair:
    return TokenPair(
        access_token=create_token(user_id, "access"),
        refresh_token=create_token(user_id, "refresh"),
    )
