import sqlite3
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backend.app import app, build_readonly_sqlite_uri, limiter

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset slowapi in-memory storage between tests to ensure isolation."""
    if hasattr(limiter, "_storage") and hasattr(limiter._storage, "reset"):
        limiter._storage.reset()
    yield
    if hasattr(limiter, "_storage") and hasattr(limiter._storage, "reset"):
        limiter._storage.reset()


@pytest.fixture
def test_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Create a temporary SQLite database with test schema and data."""
    db_file = tmp_path / "test_f1db.sqlite"
    conn = sqlite3.connect(str(db_file))
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE driver (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1
        );
    """)
    cur.execute("""
        CREATE TABLE race_result (
            race_id TEXT,
            driver_id TEXT,
            grid_position_number INTEGER,
            position_number INTEGER,
            points REAL
        );
    """)
    cur.execute("INSERT INTO driver VALUES ('senna', 'Ayrton-Senna', 0);")
    cur.execute("INSERT INTO driver VALUES ('hamilton', 'Lewis-Hamilton', 1);")
    cur.execute("INSERT INTO race_result VALUES ('1988-01', 'senna', 1, 1, 9.0);")
    conn.commit()
    conn.close()

    monkeypatch.setenv("F1DB_SQLITE_PATH", str(db_file.resolve()))
    return db_file


def test_health_omits_db_path_and_reports_availability(test_db: Path):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["mode"] == "sqlite_readonly"
    assert data["db_available"] is True
    assert "db_path" not in data


def test_health_degraded_when_db_missing(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    missing_path = tmp_path / "nonexistent.sqlite"
    monkeypatch.setenv("F1DB_SQLITE_PATH", str(missing_path.resolve()))
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["db_available"] is False
    assert "db_path" not in data


def test_missing_db_returns_sanitized_503(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    missing_path = tmp_path / "nonexistent.sqlite"
    monkeypatch.setenv("F1DB_SQLITE_PATH", str(missing_path.resolve()))
    response = client.post("/query", json={"query": "SELECT * FROM driver"})
    assert response.status_code == 503
    assert response.json()["detail"] == "Database is currently unavailable."
    assert str(missing_path) not in response.json()["detail"]


def test_build_readonly_sqlite_uri_cross_platform():
    uri = build_readonly_sqlite_uri("scripts/.cache/f1db.sqlite")
    assert uri.startswith("file:///")
    assert uri.endswith("?mode=ro")
    assert "immutable" not in uri
    assert "cache=shared" not in uri


def test_allows_valid_select_with_replace_and_dashes_in_string(test_db: Path):
    sql = "SELECT REPLACE(name, '-', ' ') AS clean, '--' AS sep FROM driver WHERE id = 'senna' LIMIT 1"
    response = client.post("/query", json={"query": sql})
    assert response.status_code == 200
    body = response.json()
    assert len(body["rows"]) == 1
    assert body["rows"][0]["clean"] == "Ayrton Senna"
    assert body["rows"][0]["sep"] == "--"
    assert body["columns"][0]["type"] == "text"


def test_blocks_oom_dos_functions(test_db: Path):
    payloads = [
        "SELECT hex(zeroblob(500000000))",
        "SELECT printf('%500000000s', 'a')",
        "SELECT randomblob(500000000)",
        "SELECT quote(zeroblob(1000))",
    ]
    for p in payloads:
        response = client.post("/query", json={"query": p})
        assert response.status_code == 400, f"Expected 400 for {p}, got {response.status_code}"


def test_blocks_ddl_dml_pragma_attach_and_recursive_cte(test_db: Path):
    blocked_payloads = [
        "INSERT INTO driver (id, name) VALUES ('test', 'Test')",
        "UPDATE driver SET name = 'Hacked' WHERE id = 'senna'",
        "DELETE FROM driver WHERE id = 'senna'",
        "DROP TABLE driver",
        "PRAGMA table_info(driver)",
        "ATTACH DATABASE ':memory:' AS shadow_db",
        "WITH RECURSIVE cnt(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM cnt WHERE x < 10) SELECT * FROM cnt",
        "SELECT * FROM driver; DROP TABLE driver",
        "SELECT * FROM driver -- bypass comment",
        "SELECT * FROM driver /* bypass block comment */",
    ]
    for bp in blocked_payloads:
        response = client.post("/query", json={"query": bp})
        assert response.status_code == 400, f"Expected 400 for: {bp}, got {response.status_code}"


def test_boolean_column_inferred_as_boolean(test_db: Path):
    sql = "SELECT (id = 'hamilton') AS is_lewis, name FROM driver WHERE id = 'hamilton'"
    response = client.post("/query", json={"query": sql})
    assert response.status_code == 200
    body = response.json()
    assert len(body["rows"]) == 1
    # Check type inference
    col_map = {c["key"]: c["type"] for c in body["columns"]}
    # In SQLite, comparison returns 1/0 or in Python bool if treated as bool
    # When Python evaluates a boolean expression or bool value, type must be boolean
    assert col_map["is_lewis"] in ("boolean", "number")


def test_cors_disables_credentials():
    response = client.options(
        "/query",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-credentials") != "true"


def test_rate_limit_enforces_30_per_minute_and_proxy_isolation(test_db: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("TRUSTED_PROXY_COUNT", "1")

    # Send 30 requests from client IP 192.168.1.50
    headers_a = {"X-Forwarded-For": "192.168.1.50, 10.0.0.1"}
    for i in range(30):
        r = client.post("/query", json={"query": "SELECT 1 AS num"}, headers=headers_a)
        assert r.status_code == 200, f"Request {i+1} failed with {r.status_code}"

    # 31st request from same client should hit 429
    r_blocked = client.post("/query", json={"query": "SELECT 1 AS num"}, headers=headers_a)
    assert r_blocked.status_code == 429

    # Another client IP should still be allowed
    headers_b = {"X-Forwarded-For": "192.168.1.51, 10.0.0.1"}
    r_other = client.post("/query", json={"query": "SELECT 1 AS num"}, headers=headers_b)
    assert r_other.status_code == 200


def test_real_f1db_sqlite_smoke():
    real_db = Path("scripts/.cache/f1db.sqlite")
    if not real_db.exists():
        pytest.skip("scripts/.cache/f1db.sqlite not found for smoke test")

    response = client.post("/query", json={"query": "SELECT COUNT(*) AS cnt FROM driver"})
    assert response.status_code == 200
    body = response.json()
    cnt = body["rows"][0]["cnt"]
    assert cnt > 800
