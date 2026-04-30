from app.services.fd_scheduler import compute_payout_mg


def test_payout_90d_at_4_5pct():
    # 1 g (1000 mg) at 4.5% APR for 90 days
    payout = compute_payout_mg(1000, 450, 90)
    expected_interest = (1000 * 450 * 90) // (10_000 * 365)
    assert payout == 1000 + expected_interest


def test_payout_365d_at_7pct_one_gram():
    payout = compute_payout_mg(1000, 700, 365)
    # ~7% on 1 gram = ~70 mg interest
    assert 1069 <= payout <= 1071


def test_payout_zero_principal_zero_interest():
    assert compute_payout_mg(0, 700, 365) == 0
