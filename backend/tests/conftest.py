"""pytest config — kept minimal because the unit tests below are pure-math
and don't need DB/HTTP fixtures. Add a Postgres-backed AsyncSession fixture
here when adding integration tests (use `pytest-asyncio` + a transactional
rollback fixture against a disposable test database)."""
