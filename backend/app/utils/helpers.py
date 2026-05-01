import secrets
import string

from app.core.constants import REFERRAL_CODE_LENGTH


def gen_referral_code(length: int = REFERRAL_CODE_LENGTH) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))
