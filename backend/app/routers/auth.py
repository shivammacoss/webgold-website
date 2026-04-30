import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import current_user
from app.models import Referral, User, Wallet
from app.schemas import LoginIn, RefreshIn, RegisterIn, TokenPair, UserOut
from app.security import create_token, decode_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _gen_referral_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(8))


async def _unique_referral_code() -> str:
    for _ in range(20):
        code = _gen_referral_code()
        if not await User.find_one(User.referral_code == code):
            return code
    raise HTTPException(500, "could not generate referral code")


def _user_out(u: User) -> UserOut:
    return UserOut(
        id=str(u.id),
        email=u.email,
        full_name=u.full_name,
        phone=u.phone,
        referral_code=u.referral_code,
        created_at=u.created_at,
    )


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterIn) -> TokenPair:
    if await User.find_one(User.email == payload.email):
        raise HTTPException(400, "email already registered")

    referrer: User | None = None
    if payload.referral_code:
        referrer = await User.find_one(User.referral_code == payload.referral_code)
        if not referrer:
            raise HTTPException(400, "invalid referral code")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        referral_code=await _unique_referral_code(),
        referred_by_id=str(referrer.id) if referrer else None,
    )
    await user.insert()
    await Wallet(user_id=str(user.id)).insert()

    if referrer:
        await Referral(referrer_id=str(referrer.id), referee_id=str(user.id)).insert()

    return TokenPair(
        access_token=create_token(str(user.id), "access"),
        refresh_token=create_token(str(user.id), "refresh"),
    )


@router.post("/login", response_model=TokenPair)
async def login(payload: LoginIn) -> TokenPair:
    user = await User.find_one(User.email == payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "invalid credentials")

    return TokenPair(
        access_token=create_token(str(user.id), "access"),
        refresh_token=create_token(str(user.id), "refresh"),
    )


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshIn) -> TokenPair:
    try:
        data = decode_token(payload.refresh_token)
    except ValueError:
        raise HTTPException(401, "invalid refresh token")

    if data.get("type") != "refresh":
        raise HTTPException(401, "wrong token type")

    from beanie import PydanticObjectId
    try:
        user = await User.get(PydanticObjectId(data["sub"]))
    except Exception:
        raise HTTPException(401, "invalid user id in token")
    if not user:
        raise HTTPException(401, "user not found")

    return TokenPair(
        access_token=create_token(str(user.id), "access"),
        refresh_token=create_token(str(user.id), "refresh"),
    )


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(current_user)) -> UserOut:
    return _user_out(user)
