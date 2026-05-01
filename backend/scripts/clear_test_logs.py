"""One-shot: delete login_logs rows from the test PowerShell sessions
(those have city='Delhi'/'New Delhi' and ip='127.0.0.1' — easy to identify)."""
import asyncio
from sqlalchemy import text
from app.db.client import close_engine, connect_engine, get_session_factory


async def main() -> None:
    connect_engine()
    factory = get_session_factory()
    try:
        async with factory() as session:
            res = await session.execute(text(
                "DELETE FROM login_logs "
                "WHERE ip_address = '127.0.0.1' "
                "  AND (city ILIKE '%delhi%' OR city ILIKE '%mumbai%')"
            ))
            await session.commit()
            print(f"deleted {res.rowcount} stale row(s)")
    finally:
        await close_engine()


if __name__ == "__main__":
    asyncio.run(main())
