# ADR-0001: SQLite-WASM for Zero-Latency Offline Historian

## Context and Problem Statement
F1 // ARCHIVE requires fast, flexible, and comprehensive analytical querying across 75+ years of historical Formula 1 data (1950–2026). Traditional architectures rely on remote REST or GraphQL APIs connecting to a backend SQL database. This introduces server operating costs, cold-start latency, rate limits, and network dependence for users.

## Decision
We adopted official SQLite-WASM running in a dedicated browser Web Worker (`src/features/historian/sqlWorker.ts`) backed by an immutable, pre-indexed 4.67 MB SQLite database (`/data/f1db-browser.sqlite`).

## Technical Implementation
1. **Offline Fetch & Storage**: The 4.67 MB database is fetched on first load and loaded into WebAssembly memory. TanStack Query and IndexedDB cache query results.
2. **Worker Isolation**: SQL execution runs off the main thread, preventing UI jank during complex multi-table joins.
3. **Safety Timeout**: The client enforces a strict 3,000ms execution timeout cap. If a query runs longer (e.g. Cartesian product), the worker is terminated and cleanly restarted.
4. **Read-Only Enforcements**: The database is opened read-only. For companion backend servers, `sqlite3_set_authorizer` rejects mutations.

## Consequences
- **Positive**: Zero backend hosting costs; instant sub-10ms query execution; full offline support once cached; complete SQL power available to users.
- **Negative**: Initial download payload of ~4.67 MB (compressed to ~1.4 MB over HTTP/brotli); limited to the memory constraints of browser WASM.
