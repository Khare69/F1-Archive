# F1 Archive — Race Historian Backend (Tier 2 Microservice)

High-performance, hardened FastAPI service for server-side Text-to-SQL analytics and full-database queries over the historical F1DB SQLite registry (1950–2026).

---

## Architecture & Tier Model

- **Tier 1 (Client Default)**: The web app runs 100% statically in the browser via `src/features/historian/historianEngine.ts`. No backend or server is required to query drivers, constructors, circuits, or historical presets.
- **Tier 2 (Optional Backend)**: When `VITE_HISTORIAN_API_URL` is configured (e.g. `http://localhost:8000`), the client connects to this microservice for deep ad-hoc SQL execution across the full raw multi-gigabyte F1DB database.

---

## Security Sandbox & Hardening

1. **Read-Only SQLite URI**: The database connection is opened strictly with URI `mode=ro` (`file:{path}?mode=ro`).
2. **`PRAGMA query_only = ON`**: SQLite database engine rejects any internal mutation attempts.
3. **Execution Time Cap (3,000 ms)**: Query execution is governed by `conn.set_progress_handler` checking wall-clock elapsed time every 10,000 opcodes and aborting queries that exceed 3 seconds.
4. **Statement Sanitization**:
   - Rejects semicolon stacking (strictly single statements).
   - Prohibits SQL comments (`--` and `/* ... */`).
   - Prohibits recursive CTEs (`RECURSIVE`) to prevent infinite recursion DoS.
   - Prohibits write/DDL keywords: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `ATTACH`, `DETACH`, `PRAGMA`, `VACUUM`, `REINDEX`, `EXEC`, `TRUNCATE`, `REPLACE`, `LOAD_EXTENSION`.
5. **Rate Limiting**: Bounded in-memory rate limiter caps clients at 30 requests per minute.
6. **Server-Side LLM Credentials**: All LLM API keys (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`) stay strictly on the server and are **never** prefixed with `VITE_` or sent to the frontend.

---

## Setup & Running

### 1. Install Dependencies
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure F1DB SQLite Path
Download the official F1DB SQLite release from [F1DB GitHub Releases](https://github.com/f1db/f1db/releases) (e.g., `f1db-sqlite.zip`) and extract `f1db.sqlite`.

Set the path via environment variable (or place it at `scripts/.cache/f1db.sqlite`):
```bash
# Windows PowerShell
$env:F1DB_SQLITE_PATH = "C:\path\to\f1db.sqlite"

# Linux / macOS
export F1DB_SQLITE_PATH="/path/to/f1db.sqlite"
```

### 3. Start the Server
```bash
uvicorn app:app --reload --port 8000
```

### 4. Connect Frontend
In the root directory, configure `.env.local`:
```env
VITE_HISTORIAN_API_URL=http://localhost:8000
```
When running `npm run dev`, the frontend Race Historian header will automatically switch to:
`TIER 2: FASTAPI BACKEND CONNECTED` (with green status indicator).
