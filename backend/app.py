"""
F1 Archive — Race Historian & SQLite Analytics Microservice (Tier 2 Backend)
FastAPI service providing sandboxed, read-only SQL execution against F1DB SQLite.
"""

import os
import re
import sqlite3
import time
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="F1 Archive Historian Backend",
    description="Sandboxed read-only SQL execution and LLM query parsing over F1DB",
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
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Database path resolution
DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "scripts", ".cache", "f1db.sqlite")
DB_PATH = os.environ.get("F1DB_SQLITE_PATH", os.path.abspath(DEFAULT_DB_PATH))

# Disallowed tokens & patterns for SQL Sandbox Hardening
DISALLOWED_KEYWORDS = [
    r"\bINSERT\b", r"\bUPDATE\b", r"\bDELETE\b", r"\bDROP\b", r"\bALTER\b",
    r"\bCREATE\b", r"\bATTACH\b", r"\bDETACH\b", r"\bPRAGMA\b", r"\bVACUUM\b",
    r"\bREINDEX\b", r"\bEXEC\b", r"\bEXECUTE\b", r"\bTRUNCATE\b", r"\bREPLACE\b",
    r"\bRECURSIVE\b",  # Prevent recursive CTE infinite loops
    r"\bLOAD_EXTENSION\b"
]
DISALLOWED_REGEX = re.compile("|".join(DISALLOWED_KEYWORDS), re.IGNORECASE)
COMMENT_REGEX = re.compile(r"(--|/\*|\*/)")

# Simple in-memory rate limiting (max 30 requests per minute per client IP)
RATE_LIMIT_WINDOW = 60.0
RATE_LIMIT_MAX_REQUESTS = 30
client_request_history: Dict[str, List[float]] = {}


def check_rate_limit(client_ip: str) -> None:
    now = time.time()
    history = client_request_history.get(client_ip, [])
    # Filter requests within the current window
    history = [t for t in history if now - t < RATE_LIMIT_WINDOW]
    if len(history) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 30 queries per minute permitted."
        )
    history.append(now)
    client_request_history[client_ip] = history


def validate_sql(sql: str) -> None:
    """
    Strict security validation:
    1. Rejects empty queries
    2. Rejects multiple statements (semicolon stacking)
    3. Rejects SQL comments (-- and /* */)
    4. Rejects recursive CTEs and write/DDL keywords
    5. Must begin with SELECT or WITH
    """
    stripped = sql.strip()
    if not stripped:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # Reject comments
    if COMMENT_REGEX.search(stripped):
        raise HTTPException(
            status_code=400,
            detail="SQL comments (-- or /* */) are disallowed for security."
        )

    # Reject statement stacking (semicolon inside or ending before extra tokens)
    clean_no_semi = stripped.rstrip(";")
    if ";" in clean_no_semi:
        raise HTTPException(
            status_code=400,
            detail="Stacked statements are prohibited. Execute only a single statement."
        )

    # Reject write/DDL and recursive CTEs
    match = DISALLOWED_REGEX.search(clean_no_semi)
    if match:
        raise HTTPException(
            status_code=400,
            detail=f"Security sandbox violation: keyword '{match.group(0)}' is prohibited."
        )

    # Must start with SELECT or WITH
    normalized_start = clean_no_semi.lstrip()[:10].upper()
    if not (normalized_start.startswith("SELECT") or normalized_start.startswith("WITH")):
        raise HTTPException(
            status_code=400,
            detail="Query must begin with SELECT or WITH."
        )


def execute_sandboxed_query(sql: str, max_rows: int = 200) -> Dict[str, Any]:
    """
    Executes a query in read-only URI mode with PRAGMA query_only=ON,
    and a 3,000 ms wall-clock execution cap enforced via set_progress_handler.
    """
    if not os.path.exists(DB_PATH):
        raise HTTPException(
            status_code=503,
            detail=f"Database file not found at {DB_PATH}. Please run F1DB ingestion or configure F1DB_SQLITE_PATH."
        )

    start_time = time.time()
    timeout_seconds = 3.0

    def progress_callback():
        # Invoked periodically every N opcodes by SQLite
        if time.time() - start_time > timeout_seconds:
            # Returning non-zero aborts the query immediately with OperationalError: interrupted
            return 1
        return 0

    # URI read-only mode connection with shared cache and immutable flag
    uri = f"file:{os.path.abspath(DB_PATH)}?mode=ro&cache=shared&immutable=1"
    conn = None
    try:
        conn = sqlite3.connect(uri, uri=True, check_same_thread=False)
        conn.execute("PRAGMA query_only = ON;")
        conn.row_factory = sqlite3.Row

        # Set progress handler every 10,000 SQLite VM opcodes
        conn.set_progress_handler(progress_callback, 10000)

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
                row_dict[col["key"]] = val
                # Infer numeric type if applicable
                if isinstance(val, (int, float)):
                    col["type"] = "number"
            formatted_rows.append(row_dict)

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

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
        raise HTTPException(status_code=400, detail=f"SQLite Operational Error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database execution error: {str(e)}")
    finally:
        if conn:
            conn.close()


class QueryRequest(BaseModel):
    query: str = Field(..., description="Inspectable read-only SQL query")
    natural_prompt: Optional[str] = Field(None, description="Original natural language query")
    max_rows: Optional[int] = Field(200, ge=1, le=1000, description="Max rows to return")


@app.get("/health")
def health_check():
    db_exists = os.path.exists(DB_PATH)
    return {
        "status": "ok",
        "mode": "sqlite_readonly",
        "db_available": db_exists,
        "db_path": DB_PATH
    }


@app.post("/query")
def run_query(req: QueryRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip)
    validate_sql(req.query)
    result = execute_sandboxed_query(req.query, max_rows=req.max_rows or 200)
    result["naturalPrompt"] = req.natural_prompt
    result["sql"] = req.query
    return result


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
