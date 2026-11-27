# F1 // ARCHIVE — System Architecture Specification

## 1. Executive Summary

F1 // ARCHIVE is a high-performance, offline-capable Formula 1 technical archive, analytics platform, and 3D simulation laboratory spanning 1950 through the 2026 technical regulations.

The platform executes entirely client-side with zero required backend servers, leveraging browser-native technologies:
- **SQLite-WASM in a dedicated Web Worker** for sub-10ms SQL queries across 75+ years of Grand Prix data.
- **Three.js & React Three Fiber (R3F)** for procedural Frenet-Serret ribbon tracks and 5-era 3D chassis inspection.
- **Dedicated Web Workers** for deterministic Monte Carlo pit-wall strategy simulations and telemetry resampling.
- **3-Layer Audience Depth Architecture** providing contextual insight for Beginners (Learn), enthusiasts (Pro), and engineers/developers (Dev).

---

## 2. System Architecture & Component Topology

```
+---------------------------------------------------------------------------------------+
|                                    BROWSER CLIENT                                     |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |                        Presentation & UI Layer (React 18)                     |   |
|   |  - Tailwind CSS v4 Carbon Engineering Theme (#0B0E14, #11151E, #E10600)       |   |
|   |  - Audience Depth (ExperienceModeContext: Learn | Pro | Dev)                   |   |
|   |  - Lazy </> Inspect Query Drawer (CodeMirror 6, Isolated Chunk)                |   |
|   +---------------------------------------+---------------------------------------+   |
|                                           |                                           |
|            +------------------------------+-----------------------------+             |
|            |                                                            |             |
|   +--------v----------------------+                            +--------v---------+   |
|   |  Client Data Client & State   |                            |   3D Graphics    |   |
|   |  - TanStack Query v5          |                            |   & Simulation   |   |
|   |  - Nuqs URL Search Params     |                            |  - R3F / Three.js|   |
|   |  - IndexedDB Query Persistence|                            |  - Draco / glTF  |   |
|   +---------------+---------------+                            +--------+---------+   |
|                   |                                                     |             |
|   +---------------v---------------+                            +--------v---------+   |
|   |     Worker Subsystem          |                            |  Procedural Ribs |   |
|   |  - sqlWorker.ts (SQLite-WASM) |                            |  - Ribbon Builder|   |
|   |  - strategyWorker.ts (MonteC) |                            |  - Frenet Frames |   |
|   +---------------+---------------+                            +------------------+   |
|                   |                                                                   |
+-------------------|-------------------------------------------------------------------+
                    | Fetch on Init
+-------------------v-------------------------------------------------------------------+
|                            STATIC DEPLOYMENT (CDN / HOSTING)                          |
|  - /data/f1db-browser.sqlite (4.67 MB, indexed SQLite 3 B-Tree)                       |
|  - /data/historical-events.json, /data/telemetry/*.json                               |
|  - /models/f1_chassis_*.glb (5 eras, Draco compressed, standardized orientation)     |
+---------------------------------------------------------------------------------------+
```

---

## 3. Data Ingestion & ETL Pipeline

Data ingestion is handled at build-time by Node/TypeScript pipelines (`scripts/etl/`):
1. **F1DB Ingestion (`scripts/etl/build-f1db-sqlite.ts`)**:
   - Downloads or unzips official F1DB releases.
   - Enforces path-traversal prevention (Zip-Slip guards).
   - Validates CSV/JSON schema invariants via Zod v4.
   - Compiles normalized SQLite B-Trees with covering indexes (`idx_race_year`, `idx_result_race`, `idx_driver_standing_year`).
2. **Circuit Elevation Pipeline (`scripts/etl/generate-circuits-with-elevation.ts`)**:
   - Matches circuit coordinates against Open-Meteo SRTM elevation grids.
   - Generates equidistant spline interpolation points for smooth 3D road ribbons.
3. **Telemetry & Strategy Calibration**:
   - Synthesizes and calibrates multi-channel GPS traces (Speed, Throttle, Brake, Gear, RPM, DRS).
   - Validates telemetry pack invariants (`scripts/telemetry/__tests__/telemetryPackInvariants.test.ts`).

---

## 4. Dual-Tier SQL Query Execution Engine

Queries are handled through a dual-tier execution abstraction (`sqlClient.ts`):
1. **Tier 1 (Browser Offline SQLite-WASM Worker)**:
   - Fetches `/data/f1db-browser.sqlite` (4.67 MB) once and initializes a WebAssembly SQLite worker.
   - Executes ad-hoc user SQL and application analytical queries entirely client-side.
   - Implements a strict **3,000ms execution timeout cap** with automatic worker termination and recreation on runaway queries.
2. **Tier 2 (FastAPI Companion Server - Optional)**:
   - When configured, provides server-side SQL compilation with strict `sqlite3_set_authorizer` denying destructive operations (`DROP`, `DELETE`, `UPDATE`, `ATTACH`).

---

## 5. 3D WebGL & Procedural Pipeline

1. **Procedural Track Ribbon Generator (`circuitRibbonBuilder.ts`)**:
   - Takes GPS latitude, longitude, and elevation points.
   - Projects coordinates into local Cartesian space using Mercator projection.
   - Computes smooth 3D Frenet-Serret frames along the centerline spline to generate road deck, inner/outer kerbs, and apex run-off geometry.
2. **Blender MCP 5-Era Vehicle Pipeline (`scripts/blender/build_era_cars.py`)**:
   - Standardized coordinate system: `+X` Nose, `-X` Tail, `+Z` Roof (Blender) $\to$ `+Y` Roof, `-Z` Tail, `+X` Nose (glTF 2.0).
   - Real-world physical dimensions (Length 4.2m–5.5m, Width 1.8m–2.0m, Height ~1.0m).
   - 9 canonical material slots mapped dynamically to team liveries via `carMaterialMapper.ts`.
   - Draco geometry compression keeping each vehicle under 1 MB.

---

## 6. Testing, Verification & Quality Gates

The continuous integration matrix (`.github/workflows/ci.yml`) enforces zero-compromise quality standards:
- **Static Typing**: `npx tsc -b` with strict null checks.
- **Linting & Hygiene**: ESLint + Prettier + zero feature `.css` files in `src/features/`.
- **Model Verification**: `npm run models:verify` asserting glTF 2.0 structure and bounds across all 5 era models.
- **Unit & Integration Coverage**: Vitest v4 with `@vitest/coverage-v8`, enforcing $\ge 65\%$ global coverage and $\ge 80\%$ on pure-math/ETK modules.
- **End-to-End Testing**: Playwright E2E test suite covering audience modes, telemetry replay, and 3D interactions.
- **Performance & Accessibility Audits**: Lighthouse CI asserting Accessibility $\ge 0.90$, Best Practices $\ge 0.90$, SEO $\ge 0.90$, and Performance $\ge 0.80$.
