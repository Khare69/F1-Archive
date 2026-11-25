"""
F1 Archive — Race Historian & SQLite Analytics Microservice (Tier 2 Backend)
FastAPI service providing sandboxed, read-only SQL execution against F1DB SQLite.
"""

import logging
import os
import re
import sqlite3
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logger = logging.getLogger("f1_archive.backend")

app = FastAPI(
    title="F1 Archive Historian Backend",
    description="Sandboxed read-only SQL execution microservice over F1DB SQLite",
    version="1.0.0"
)

# CORS configuration
allowed_origins_env = os.environ.get("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]
if allowed_origins_env:
    allowed_origins.extend([origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

# Database path resolution
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "public" / "data" / "f1db-browser.sqlite"


def get_db_path() -> Path:
    if "F1DB_SQLITE_PATH" in os.environ:
        return Path(os.environ["F1DB_SQLITE_PATH"]).resolve()
    if DEFAULT_DB_PATH.exists():
        return DEFAULT_DB_PATH.resolve()
    legacy_cache_path = Path(__file__).resolve().parent.parent / "scripts" / ".cache" / "f1db.sqlite"
    if legacy_cache_path.exists():
        return legacy_cache_path.resolve()
    return DEFAULT_DB_PATH.resolve()


def build_readonly_sqlite_uri(db_path: str | Path) -> str:
    resolved = Path(db_path).resolve()
    return f"{resolved.as_uri()}?mode=ro"


MAX_QUERY_LENGTH = 4000

# Strict allowlist of safe SQLite functions (OOM DoS and side-effect prevention)
ALLOWED_SQL_FUNCTIONS = frozenset({
    # Aggregates
    "count", "sum", "avg", "min", "max", "total", "group_concat",
    # Safe string functions
    "lower", "upper", "length", "substr", "substring", "trim",
    "ltrim", "rtrim", "replace", "instr", "coalesce", "ifnull",
    "nullif", "iif", "typeof",
    # Safe math & date functions
    "abs", "round", "sign", "ceil", "ceiling", "floor", "power", "sqrt",
    "date", "time", "datetime", "julianday", "strftime", "unixepoch",
})

SQLITE_RECURSIVE_CODE = getattr(sqlite3, "SQLITE_RECURSIVE", 33)


def sqlite_readonly_authorizer(action_code: int, arg1: Optional[str], arg2: Optional[str],
                               db_name: Optional[str], trigger_name: Optional[str]) -> int:
    """
    SQLite authorizer callback enforcing strict read-only execution:
    - Allows SQLITE_SELECT
    - Allows SQLITE_READ on main database
    - Allows SQLITE_FUNCTION only for safe functions in ALLOWED_SQL_FUNCTIONS
    - Unconditionally denies all other action codes (DML, DDL, PRAGMA, ATTACH, RECURSIVE)
    """
    if action_code == sqlite3.SQLITE_SELECT:
        return sqlite3.SQLITE_OK
    elif action_code == sqlite3.SQLITE_READ:
        if db_name in (None, "", "main"):
            return sqlite3.SQLITE_OK
        return sqlite3.SQLITE_DENY
    elif action_code == sqlite3.SQLITE_FUNCTION:
        func_name = (arg2 or "").lower()
        if func_name in ALLOWED_SQL_FUNCTIONS:
            return sqlite3.SQLITE_OK
        return sqlite3.SQLITE_DENY
    elif action_code == SQLITE_RECURSIVE_CODE:
        return sqlite3.SQLITE_DENY
    return sqlite3.SQLITE_DENY


def validate_sql_structure(sql: str) -> str:
    """
    Quote-aware SQL validation:
    1. Validates query length (max 4000 chars)
    2. Scans outside single & double quotes to reject comments (-- or /* */)
    3. Rejects statement stacking (semicolons with subsequent tokens)
    4. Rejects RECURSIVE CTE keyword outside quotes
    5. Verifies query begins with SELECT or WITH
    """
    if len(sql) > MAX_QUERY_LENGTH:
        raise HTTPException(status_code=400, detail="Query exceeds maximum length of 4000 characters.")

    stripped = sql.strip()
    if not stripped:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    in_single = False
    in_double = False
    i = 0
    n = len(stripped)
    outside_tokens: List[str] = []

    while i < n:
        c = stripped[i]
        if not in_single and not in_double:
            if c == "'":
                in_single = True
                i += 1
                continue
            elif c == '"':
                in_double = True
                i += 1
                continue
            elif c == '-' and i + 1 < n and stripped[i + 1] == '-':
                raise HTTPException(status_code=400, detail="SQL comments are disallowed for security.")
            elif c == '/' and i + 1 < n and stripped[i + 1] == '*':
                raise HTTPException(status_code=400, detail="SQL comments are disallowed for security.")
            elif c == ';':
                rest = stripped[i + 1:].strip()
                if rest:
                    raise HTTPException(
                        status_code=400,
                        detail="Stacked statements are prohibited. Execute only a single statement."
                    )
                else:
                    break
            else:
                outside_tokens.append(c)
                i += 1
        elif in_single:
            if c == "'":
                if i + 1 < n and stripped[i + 1] == "'":
                    i += 2
                    continue
                else:
                    in_single = False
            i += 1
        elif in_double:
            if c == '"':
                if i + 1 < n and stripped[i + 1] == '"':
                    i += 2
                    continue
                else:
                    in_double = False
            i += 1

    if in_single or in_double:
        raise HTTPException(status_code=400, detail="Unclosed quotation mark in SQL query.")

    outside_text = "".join(outside_tokens)
    if re.search(r"\bRECURSIVE\b", outside_text, re.IGNORECASE):
        raise HTTPException(status_code=400, detail="Recursive CTEs are prohibited.")

    cleaned = stripped.rstrip(";").strip()
    if not re.match(r"^(SELECT|WITH)\b", cleaned, re.IGNORECASE):
        raise HTTPException(status_code=400, detail="Query must begin with SELECT or WITH.")

    return cleaned


# Simple in-memory rate limiting (max 30 requests per minute per client IP)
RATE_LIMIT_WINDOW = 60.0
RATE_LIMIT_MAX_REQUESTS = 30
client_request_history: Dict[str, List[float]] = {}


def check_rate_limit(client_ip: str) -> None:
    now = time.time()
    history = client_request_history.get(client_ip, [])
    history = [t for t in history if now - t < RATE_LIMIT_WINDOW]
    if len(history) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 30 queries per minute permitted."
        )
    history.append(now)
    client_request_history[client_ip] = history


def execute_sandboxed_query(sql: str, max_rows: int = 200) -> Dict[str, Any]:
    """
    Executes a query in read-only URI mode with PRAGMA query_only=ON,
    authorizer callback, and a 3,000 ms wall-clock execution cap enforced via set_progress_handler.
    """
    target_db_path = get_db_path()
    if not target_db_path.exists():
        logger.error("Database file not found at %s", target_db_path)
        raise HTTPException(
            status_code=503,
            detail="Database is currently unavailable."
        )

    start_time = time.monotonic()
    timeout_seconds = 3.0

    def progress_callback():
        if time.monotonic() - start_time > timeout_seconds:
            return 1
        return 0

    uri = build_readonly_sqlite_uri(target_db_path)
    conn = None
    try:
        conn = sqlite3.connect(uri, uri=True, check_same_thread=False)
        # Register PRAGMAs BEFORE attaching authorizer (authorizer denies SQLITE_PRAGMA)
        conn.execute("PRAGMA query_only = ON;")
        conn.execute("PRAGMA temp_store = MEMORY;")
        conn.execute("PRAGMA cache_size = -8000;")
        conn.set_authorizer(sqlite_readonly_authorizer)
        conn.set_progress_handler(progress_callback, 2000)
        conn.row_factory = sqlite3.Row

        cursor = conn.cursor()
        cursor.execute(sql)

        rows_raw = cursor.fetchmany(max_rows + 1)
        truncated = len(rows_raw) > max_rows
        rows_to_return = rows_raw[:max_rows]

        columns = [
            {"key": col[0], "label": col[0].replace("_", " ").title(), "type": "text"}
            for col in (cursor.description or [])
        ]

        formatted_rows = []
        for r in rows_to_return:
            row_dict = {}
            for col in columns:
                val = r[col["key"]]
                if isinstance(val, str) and len(val) > 65536:
                    raise HTTPException(
                        status_code=400,
                        detail="Result cell value exceeds 64KB limit."
                    )
                row_dict[col["key"]] = val
                if val is not None:
                    if isinstance(val, bool):
                        col["type"] = "boolean"
                    elif isinstance(val, (int, float)) and col["type"] != "boolean":
                        col["type"] = "number"
            formatted_rows.append(row_dict)

        elapsed_ms = round((time.monotonic() - start_time) * 1000, 2)

        return {
            "columns": columns,
            "rows": formatted_rows,
            "rowCount": len(formatted_rows),
            "truncated": truncated,
            "executionTimeMs": elapsed_ms,
            "source": "f1db_sqlite_backend"
        }

    except sqlite3.OperationalError as e:
        if "interrupted" in str(e).lower():
            raise HTTPException(
                status_code=408,
                detail="Query execution timed out (exceeded 3,000 ms execution cap)."
            )
        logger.warning("SQLite operational error: %s", e)
        raise HTTPException(status_code=400, detail="Invalid or unauthorized SQL query.")
    except sqlite3.DatabaseError as e:
        if "not authorized" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail="Query rejected by read-only SQL security policy."
            )
        logger.warning("SQLite database error: %s", e)
        raise HTTPException(status_code=400, detail="Invalid or unauthorized SQL query.")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during query execution: %s", e)
        raise HTTPException(status_code=500, detail="Internal query execution error.")
    finally:
        if conn:
            conn.close()


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000, description="Inspectable read-only SQL query")
    natural_prompt: Optional[str] = Field(None, description="Original natural language query")
    max_rows: Optional[int] = Field(200, ge=1, le=1000, description="Max rows to return")


@app.get("/health")
def health_check():
    db_exists = get_db_path().exists()
    return {
        "status": "ok" if db_exists else "degraded",
        "mode": "sqlite_readonly",
        "db_available": db_exists,
    }


@app.post("/query")
def run_query(req: QueryRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip)
    validated_sql = validate_sql_structure(req.query)
    result = execute_sandboxed_query(validated_sql, max_rows=req.max_rows or 200)
    result["naturalPrompt"] = req.natural_prompt
    result["sql"] = validated_sql
    return result


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
