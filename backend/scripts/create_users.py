"""One-shot bootstrapper: creates a demo user + a super admin.

- Adds the `is_admin` column on `users` if it doesn't yet exist (idempotent).
- Inserts each account only if the email isn't already taken.
- Run with: `python -m scripts.create_users` from the backend directory.
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import text

from app.core.security import hash_password
from app.db.client import close_engine, connect_engine, get_session_factory
from app.utils.helpers import gen_referral_code

ACCOUNTS = [
    {
        "email": "user@mysafegold.com",
        "password": "User@123!",
        "full_name": "Demo User",
        "is_admin": False,
    },
    {
        "email": "admin@mysafegold.com",
        "password": "Admin@123!",
        "full_name": "Super Admin",
        "is_admin": True,
    },
]


async def main() -> None:
    connect_engine()
    factory = get_session_factory()

    try:
        async with factory() as session:
            await session.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
            # Clean up any prior .local accounts (rejected by EmailStr at login).
            await session.execute(
                text(
                    "DELETE FROM wallets WHERE user_id IN "
                    "(SELECT id FROM users WHERE email LIKE '%@mysafegold.local')"
                )
            )
            await session.execute(
                text("DELETE FROM users WHERE email LIKE '%@mysafegold.local'")
            )
            await session.commit()

            for acc in ACCOUNTS:
                existing = (
                    await session.execute(
                        text("SELECT id FROM users WHERE email = :email"),
                        {"email": acc["email"]},
                    )
                ).first()
                if existing:
                    print(f"[skip] {acc['email']} already exists (id={existing[0]})")
                    continue

                user_id = uuid.uuid4()
                wallet_id = uuid.uuid4()
                now = datetime.now(timezone.utc)
                code = gen_referral_code()
                pwd_hash = hash_password(acc["password"])

                await session.execute(
                    text(
                        """
                        INSERT INTO users
                            (id, email, password_hash, full_name, phone,
                             referral_code, referred_by_id, created_at, is_admin)
                        VALUES
                            (:id, :email, :pwd, :name, NULL,
                             :code, NULL, :now, :is_admin)
                        """
                    ),
                    {
                        "id": user_id,
                        "email": acc["email"],
                        "pwd": pwd_hash,
                        "name": acc["full_name"],
                        "code": code,
                        "now": now,
                        "is_admin": acc["is_admin"],
                    },
                )
                await session.execute(
                    text(
                        """
                        INSERT INTO wallets (id, user_id, inr_paise, gold_mg, updated_at)
                        VALUES (:id, :uid, 0, 0, :now)
                        """
                    ),
                    {"id": wallet_id, "uid": user_id, "now": now},
                )
                await session.commit()

                role = "SUPER ADMIN" if acc["is_admin"] else "USER"
                print(
                    f"[ok] {role:<11} email={acc['email']}  "
                    f"password={acc['password']}  referral={code}  id={user_id}"
                )
    finally:
        await close_engine()


if __name__ == "__main__":
    asyncio.run(main())
