from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mongo_url: str = "mongodb://localhost:27017"
    mongo_db: str = "mysafe_gold"

    jwt_secret: str = "dev-secret-change-me"
    jwt_access_minutes: int = 15
    jwt_refresh_days: int = 30

    gold_api_key: str = "goldapi-demo"
    gold_api_url: str = "https://www.goldapi.io/api/XAU/INR"

    gold_buy_markup_bps: int = 300
    gold_sell_discount_bps: int = 200

    cors_origins: str = "http://localhost:3000,http://localhost:8081,http://localhost:19006"

    referral_bonus_paise: int = 5000

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
