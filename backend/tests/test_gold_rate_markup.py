from app.services.gold_rate import buy_rate_paise_per_g, sell_rate_paise_per_g


def test_buy_rate_includes_markup():
    base = 1_000_000  # ₹10,000/g
    buy = buy_rate_paise_per_g(base)
    assert buy > base
    # At default 300 bps markup, expect ~+3%
    assert 1_029_000 <= buy <= 1_031_000


def test_sell_rate_includes_discount():
    base = 1_000_000
    sell = sell_rate_paise_per_g(base)
    assert sell < base
    # At default 200 bps discount, expect ~-2%
    assert 979_000 <= sell <= 981_000


def test_buy_always_above_sell():
    base = 950_000
    assert buy_rate_paise_per_g(base) > sell_rate_paise_per_g(base)
