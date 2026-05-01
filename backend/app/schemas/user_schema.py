from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: str | None
    referral_code: str
    is_admin: bool = False
    created_at: datetime
