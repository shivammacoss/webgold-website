"""Schema bootstrap + first-run seed.

For dev we use Base.metadata.create_all() so a fresh `psql -c 'CREATE DATABASE mysafe_gold'`
is enough to start the app. For production, use Alembic migrations instead — see
`alembic init migrations` and replace the create_all() call with an upgrade step.
"""
from sqlalchemy import select, text

from app.db.client import Base, get_engine, get_session_factory

# Side-effect import: ensure every model class is registered on Base.metadata.
from app.models import audit as _audit  # noqa: F401
from app.models import fd as _fd  # noqa: F401
from app.models import gold as _gold  # noqa: F401
from app.models import user as _user  # noqa: F401
from app.models.fd import FDPlan


async def init_db() -> None:
    """Create tables (if missing), apply tiny additive migrations, and seed plans."""
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # In-place additive migrations for columns added after first deploy.
        # Idempotent — `IF NOT EXISTS` is a no-op once applied.
        await conn.execute(text(
            "ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS kind VARCHAR(16) "
            "NOT NULL DEFAULT 'LOGIN'"
        ))
        await conn.execute(text(
            "ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS geo_source VARCHAR(16)"
        ))
        await conn.execute(text(
            "ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS accuracy_m INTEGER"
        ))
    await _seed_fd_plans()


async def _seed_fd_plans() -> None:
    factory = get_session_factory()
    async with factory() as session:
        existing = await session.scalar(select(FDPlan).limit(1))
        if existing is not None:
            return
        session.add_all([
            FDPlan(name="Gold Saver — 90 days",  lock_in_days=90,  apr_bps=450, min_grams_mg=100),
            FDPlan(name="Gold Plus — 180 days",  lock_in_days=180, apr_bps=550, min_grams_mg=250),
            FDPlan(name="Gold Max — 365 days",   lock_in_days=365, apr_bps=700, min_grams_mg=500),
        ])
        await session.commit()
