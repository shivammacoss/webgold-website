"""User-shaped projections."""
from app.models.user import User
from app.schemas.user_schema import UserOut


def to_user_out(u: User) -> UserOut:
    return UserOut(
        id=str(u.id),
        email=u.email,
        full_name=u.full_name,
        phone=u.phone,
        referral_code=u.referral_code,
        is_admin=getattr(u, "is_admin", False),
        created_at=u.created_at,
    )
