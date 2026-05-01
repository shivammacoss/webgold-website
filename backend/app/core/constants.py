"""Numeric constants shared across the app.

Money is stored in paise (int) and gold in milligrams (int) at the DB layer.
"""
PAISE_PER_INR = 100
MG_PER_GRAM = 1000
TROY_OZ_TO_G = 31.1034768

GOLD_RATE_CACHE_TTL_SEC = 60
GOLD_RATE_SNAPSHOT_INTERVAL_SEC = 5 * 60

INDIA_RETAIL_MARKUP_BPS = 1000  # 10% — Indian retail premium over international spot

REFERRAL_CODE_LENGTH = 8
FD_MATURITY_INTERVAL_MIN = 15

DAYS_PER_YEAR = 365
BPS_DIVISOR = 10_000
