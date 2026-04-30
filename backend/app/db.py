"""MongoDB connection + Beanie initialization (Beanie 2.x uses PyMongo async)."""
from beanie import init_beanie
from pymongo import AsyncMongoClient

from app.config import get_settings
from app.models import (
    FDPlan,
    GoldFD,
    GoldRateSnap,
    Referral,
    Transaction,
    User,
    Wallet,
)

DOCUMENT_MODELS = [User, Wallet, Transaction, FDPlan, GoldFD, GoldRateSnap, Referral]

_client: AsyncMongoClient | None = None


async def init_db() -> None:
    """Connect to Mongo, register Beanie documents, seed FD plans on first run."""
    global _client
    settings = get_settings()
    _client = AsyncMongoClient(settings.mongo_url)
    await init_beanie(database=_client[settings.mongo_db], document_models=DOCUMENT_MODELS)

    # Seed FD plans if collection is empty
    if await FDPlan.find_one() is None:
        await FDPlan.insert_many([
            FDPlan(name="Gold Saver — 90 days",  lock_in_days=90,  apr_bps=450, min_grams_mg=100),
            FDPlan(name="Gold Plus — 180 days",  lock_in_days=180, apr_bps=550, min_grams_mg=250),
            FDPlan(name="Gold Max — 365 days",   lock_in_days=365, apr_bps=700, min_grams_mg=500),
        ])


def get_client() -> AsyncMongoClient:
    if _client is None:
        raise RuntimeError("DB not initialized — call init_db() at startup")
    return _client
