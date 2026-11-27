<p align="center">
  <img src="public/favicon.svg" width="72" alt="F1 Archive Logo" />
</p>

<h1 align="center">F1 // ARCHIVE — The Evolution of Speed</h1>

<p align="center">
  <strong>Cinematic Formula 1 Historical Archive, 3D Telemetry Replay, Parametric Vehicle Lab &amp; Offline SQL Historian</strong><br/>
  Spanning 77 seasons (1950–2026), 860+ drivers, 214 constructors, 77 circuits, and interactive 3D WebGL engineering simulations.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Three.js-R174-000000?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js R174" />
  <img src="https://img.shields.io/badge/Vite-6.4.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/SQLite_WASM-Official_3.x-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite WASM" />
  <img src="https://img.shields.io/badge/Vitest-314+_Passed-00E701?style=flat-square&logo=vitest&logoColor=white" alt="Unit Tests" />
  <img src="https://img.shields.io/badge/Playwright-25_Passed-45ba4b?style=flat-square&logo=playwright&logoColor=white" alt="Playwright E2E" />
  <img src="https://img.shields.io/badge/5--Era_GLB_Suite-161_kB_Total-00D2FF?style=flat-square" alt="5-Era GLB Suite" />
</p>

---

## ⚡ Architecture & Highlights

- **Full F1DB In-Browser SQLite Engine (`@sqlite.org/sqlite-wasm`)**: Queries a 4.67 MB pre-indexed SQLite 3 database directly inside an off-thread Web Worker. Zero server requirement for analytical queries, full text search, and historical aggregations.
- **Parametric 5-Era 3D Vehicle Lab**: 5 distinct historical chassis (`1950s Front-Engine`, `1988 Turbo Cockpit-Forward`, `2004 V10 High-Downforce`, `2024 Ground-Effect`, and `2026 Active Aero`) proceduralized with Draco compression (<40 kB per era, ~161 kB total suite), real-time carbon weave PBR shaders, dynamic liveries, and interactive technical hotspots.
- **Topographic 3D Circuit Ribbons & 2D SVG Maps**: Procedural 3D track extrusion using Frenet-Serret spatial frames, Open-Meteo SRTM satellite elevation deltas, zebra kerbs, and animated sector lighting across 28 venues with a clean 2D SVG toggle.
- **High-Performance Telemetry & 3D Ghost-Lap Replay**: Micro-sector anchored dual-car playback, 4-channel synchronized uPlot graphs (speed, throttle, brake, gear/RPM), time delta traces ($\Delta t$), and OpenF1 live session ingestion with LRU caching.
- **Monte Carlo Pit-Wall Strategy Simulator**: Deterministic Mulberry32 PRNG engine running 1,000–5,000 race simulations in an off-thread Web Worker, modeling compound degradation cliffs, fuel burn pace progression ($-0.035\text{ s/lap}$), and pit loss windows.
- **3-Layer Audience Depth Model**: Seamless toggle between `Learn` (plain-English explanations & 25-term glossary tooltips), `Pro` (FIA technical specs & raw telemetry), and `Dev` (live query inspector drawer, database schema browser, and performance HUD).
- **Zero-Waste WebGL Rendering**: Strict Three.js `frameloop="demand"` (0 FPS idle, zero battery drain when static), shared canvas architecture across sub-routes, and a live GPU performance overlay (`Shift + P` or `?debug=perf`).
- **Offline PWA Architecture**: TanStack Query persist client backed by IndexedDB (`idb-keyval`), custom service worker with Stale-While-Revalidate caching, and strict bundle size enforcement ($< 1.5\text{ MB}$ JS, $< 120\text{ kB}$ CSS).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph DataPipeline[Data Pipeline & Build-Time ETL]
        F1DB[(F1DB CC-BY-4.0)] --> SyncScript[npm run sync:data]
        GeoJSON[(bacinger GeoJSON)] --> SyncScript
        OpenMeteo[(Open-Meteo SRTM)] --> SyncScript
        SyncScript --> StaticBundles[public/data/seasons/ & circuits/]
        SyncScript --> DBBuilder[npm run build:browser-db]
        DBBuilder --> BrowserDB[(public/data/f1db-browser.sqlite 4.67MB)]
    end

    subgraph ClientCore[Frontend Client Application (React 18 + Vite 6)]
        AppRoot[App Shell & Routing] --> Nav[Navigation & Search Palette]
        AppRoot --> QueryProvider[TanStack Query + IndexedDB Persister]
        AppRoot --> InspectDrawer[Live Inspect Query Drawer]

        Nav --> Home[Home Hub & Starter Stories]
        Nav --> ArchiveHub[Archive Hub: Seasons, Drivers, Constructors]
        Nav --> Circuits[Circuits: 2D SVG / 3D Topographic Ribbons]
        Nav --> Telemetry[Telemetry: Ghost Lap & uPlot Traces]
        Nav --> Strategy[Strategy: Monte Carlo Pit-Wall Simulator]
        Nav --> CADLab[Vehicle Lab: 5-Era 3D Models & Hotspots]
        Nav --> Historian[AI Race Historian: SQL Lab & Voice Companion]
        Nav --> Docs[System Architecture Explorer & ADRs]

        Circuits --> RibbonEngine[circuitRibbonBuilder & Frenet-Serret Frame]
        Telemetry --> TelemetryMath[Normalized Distance Interp & uPlot]
        Strategy --> StrategyWorker[Mulberry32 Web Worker Engine]
        CADLab --> ThreeCanvas[Three.js r174 / R3F Canvas]
        Historian --> SQLiteWorker[@sqlite.org/sqlite-wasm Web Worker]
    end

    subgraph BackendTier2[Optional Tier 2 Backend Microservice]
        Historian -.->|VITE_HISTORIAN_API_URL| FastAPISvc[FastAPI SQLite Microservice]
        FastAPISvc --> SQLiteSandboxed[(Sandboxed Read-Only SQLite F1DB)]
    end
```

---

## 📦 Feature Breakdown by Hub

### 1. 🏠 Home Hub & Audience Depth
- **Audience Mode Switcher**: Global toggle between **Learn** (simplified narratives, plain-English glossary tooltips), **Pro** (telemetry deltas, FIA tyre codes, downforce metrics), and **Dev** (live SQL/JSON drawer, query execution timings, memory heap stats).
- **Curated Starter Stories**: Quick-launch analytical presets ("1988 Senna vs. Prost", "Monza Slipstream Masters", "Modern Ground Effect Era").
- **Paddock Favorites**: Pin drivers, constructors, and circuits to local storage for instant access across the app.
- **On This Day in F1**: Daily historical milestone banner pulling births, victories, and pivotal events with nearest-milestone fallbacks.
- **Inspect Query Drawer (`</>`)**: Global CodeMirror 6 drawer displaying the live SQL or REST query powering the active view with copy-to-clipboard functionality.
- **Keyboard Shortcuts**: Global hotkeys `1`–`5` for hub switching, `Cmd/Ctrl + K` for command search, `Shift + P` for performance HUD, and `?` for the shortcut cheat sheet.

### 2. 📚 Archive Hub: Seasons, Drivers & Constructors
- **Virtualized Driver Directory**: Smooth 60 FPS scrolling through 860+ historical drivers using `@tanstack/react-virtual`.
- **Era-Normalized Head-to-Head**: Direct teammate comparison engine filtering non-mutual races, DNS entries, and mid-season team transfers. Includes career points share percentage and podium conversion rates.
- **Cross-Era What-If Championship Simulator**: Recalculates any World Championship (1950–2026) under alternative scoring systems: modern 25-18-15, classic 10-6-4, 9-6-4, 10-8-6, Olympic medal system, and best-11 dropped scores (resolving 1988 Senna vs. Prost).
- **2026 Constructors & Historical Lineage**: Full constructor registry with official hexadecimal brand liveries, championship histories, and 2026 powertrain regulations.
- **URL State Synchronization**: Deep-linkable search, filters, and active comparison tabs via `nuqs`.

### 3. 🗺️ Circuits Hub: 2D Maps & 3D Topographic Ribbons
- **Dual Representation**: Instant toggle between lightweight 2D SVG vector maps and 3D WebGL extruded topographic ribbons.
- **Real-World SRTM Elevation**: Extrudes asphalt ribbons using 1-meter resolution elevation profiles fetched from Open-Meteo satellite topography (e.g. Spa-Francorchamps' 103 m elevation delta through Eau Rouge and Raidillon).
- **Frenet-Serret Spatial Curvature**: Computes smooth 3D track surfaces, banked corner angles, curbs, and apex kerbing using adaptive curve segmentation.
- **Corner DNA Telemetry**: Interactive corner analysis for 28 premier circuits, detailing apex gear, entry speeds, corner radius, braking G-forces, and famous overtake zones.

### 4. ⏱️ Telemetry & Monte Carlo Strategy Simulator
- **Dual-Car 3D Ghost Lap**: Real-time dual-car replay synchronized along normalized track distance ($s \in [0, 1]$), eliminating Cartesian coordinates mismatches.
- **Synchronized 4-Channel uPlot Traces**: Microsecond-fast rendering of Speed, Throttle, Brake, and Gear/RPM aligned with the 3D replay car position.
- **OpenF1 Live Session Ingestion**: Direct loading of official OpenF1 session intervals, lap times, and driver telemetry with automatic LRU memory caching.
- **Deterministic Monte Carlo Web Worker**: Simulates 1,000 to 5,000 race iterations using Mulberry32 PRNG. Models compound degradation curves, fuel burn pace offsets ($-0.035\text{ s/lap}$ per kg consumed), pit stop delta distributions, and undercut probability windows.

### 5. 🏎️ 3D Vehicle Evolution Lab
- **5-Era Architectural Progression**:
  1. `1950s Front-Engine`: Long nose, exposed cockpit, narrow wire tyres, ground-level exhaust.
  2. `1988 Turbo Era`: Cockpit-forward monocoque, rear turbo airbox, wide slick tyres.
  3. `2004 V10 Era`: High-downforce multi-element wings, sidepod chimneys, grooved dry tyres.
  4. `2024 Ground Effect`: Venturi floor tunnels, wheel wake deflectors, halo safety titanium cell.
  5. `2026 Active Aero`: Compact chassis dimensions ($3,400\text{ mm}$ wheelbase, $1,900\text{ mm}$ width), active straight/corner aerodynamic modes, and $350\text{ kW}$ electric powertrain split.
- **Extreme Draco Compression**: Custom glTF pipeline delivering 5 distinct era models totaling **161 kB** (<40 kB each), loading in single-digit milliseconds.
- **Procedural PBR Shaders**: Carbon-fiber weave normal maps, metallic automotive clearcoat, and tyre rubber textures.
- **Interactive Anatomy Hotspots**: Clickable 3D callouts detailing technical regulations, safety structures, and powertrain components.

### 6. 🏛️ Offline SQL Historian & Optional Backend
- **Browser-Native SQLite 3**: Embedded `@sqlite.org/sqlite-wasm` running inside an off-thread Web Worker over a pre-indexed 4.67 MB SQLite database.
- **CodeMirror 6 Editor**: Syntax-highlighted SQL workspace with dark-mode styling, schema autocomplete, and query duration metrics.
- **Analytical Presets**: 16 battle-tested queries (Monza past winners, pole-to-win conversion percentages, rain-master performances, elevation extremes, and decade-by-decade constructor dominance).
- **Export Formats**: One-click export to CSV or JSON.
- **Optional Tier 2 FastAPI Service**: Transparent fallback or remote execution via a sandboxed read-only Python FastAPI microservice (`?mode=ro&immutable=1`).

### 7. 📖 In-App Architecture Explorer (`/docs`)
- **System Blueprint**: Interactive architectural topology visualizer rendering client-side data flows, Web Worker boundaries, and storage persisters.
- **Architectural Decision Records (ADRs)**: Full in-app reader for project ADRs (`0001` through `0005`).
- **Live Database Schema Inspector**: Real-time schema table browser querying `sqlite_master` to inspect tables, column types, foreign keys, and indexes.

---

## 🛠️ Tech Stack & Dependencies

| Category | Technologies | Description |
|---|---|---|
| **Core Framework** | React 18.3.1, TypeScript 5.5.3, Vite 6.4.3 | Strict mode, zero `any` policy, ESM architecture |
| **3D & WebGL Engine** | Three.js r174, `@react-three/fiber` 8.18.0, `@react-three/drei` 9.122.0 | Canvas pooling, demand frameloop, Draco decoding |
| **Database & Engine** | `@sqlite.org/sqlite-wasm` 3.49.1, Web Workers | Offline SQLite 3 B-Tree engine in browser worker |
| **Data Viz & Telemetry** | `uplot` 1.6.31, `echarts` 5.6.0, `echarts-for-react` 3.0.2 | 60 FPS multi-channel synchronized traces |
| **Code Editor** | `@uiw/react-codemirror` 4.23.15, `@codemirror/lang-sql` | SQL syntax highlighting, line numbers, dark theme |
| **State & Networking** | `@tanstack/react-query` 5.67.3, `idb-keyval` 6.2.1, `nuqs` 2.4.1 | IndexedDB persistence, URL query param syncing |
| **Styling & Motion** | Tailwind CSS 3.4.17, Radix UI Primitives, Lucide Icons | Fully accessible, responsive dark-mode styling |
| **Validation & Schema** | `zod` 3.24.2 | Strict runtime data contracts across all models |
| **Testing Suite** | Vitest 4.1.11, Playwright 1.58.2, Testing Library | 314+ unit tests, 25 full-page E2E specifications |
| **Backend (Optional)** | Python 3.10+, FastAPI 0.115+, Uvicorn, SQLite3 | Sandboxed read-only query microservice |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: $\ge 20.19.0$
- **npm**: $\ge 10.0.0$
- *(Optional)* Python $\ge 3.10$ and `uv` for the optional Tier 2 FastAPI backend

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Khare69/F1-Archive.git
cd F1-Archive
npm install
```

### 2. Build the Browser Database & Static Data
Ensure static bundles and the indexed SQLite 3 browser database are generated:
```bash
# Ingest raw historical datasets
npm run sync:data

# Build the 4.67 MB pre-indexed SQLite browser database
npm run build:browser-db
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. (Optional) Run Tier 2 FastAPI Backend
```bash
cd backend
python -m venv .venv

# Windows PowerShell:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

---

## 📜 Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts Vite dev server with hot module replacement (`localhost:5173`) |
| `npm run build` | Compiles TypeScript and builds optimized production bundles to `dist/` |
| `npm run preview` | Locally serves the production build in `dist/` |
| `npm run lint` | Runs ESLint checks across TypeScript and React code |
| `npm run format` | Checks and formats source code with Prettier |
| `npm test` | Runs the full Vitest unit test suite (314+ tests) |
| `npm run test:watch` | Starts Vitest in interactive watch mode |
| `npm run test:coverage` | Computes test coverage with v8 engine (enforces $\ge 65\%$ global, $\ge 80\%$ math/ETL) |
| `npm run test:e2e` | Executes Playwright end-to-end tests across all views (25 specs) |
| `npm run models:optimize` | Runs Draco glTF compressor on raw vehicle meshes |
| `npm run models:verify` | Validates geometry, polycount, bounding boxes, and Draco chunks on all 5 era models |
| `npm run sync:data` | Executes the upstream data extraction and validation pipeline |
| `npm run build:browser-db` | Assembles the pre-indexed SQLite browser database from F1DB data |
| `npm run size` | Enforces bundle budgets ($< 1.5\text{ MB}$ JS, $< 120\text{ kB}$ CSS) |
| `npm run audit:lighthouse` | Audits accessibility, SEO, and best practices with Lighthouse CI |

---

## 📂 Project Structure

```
f1-project/
├── .github/                 # GitHub Actions CI workflows
├── backend/                 # Optional Tier-2 FastAPI SQLite microservice
│   ├── app.py               # Read-only sandboxed API routes
│   ├── requirements.txt     # Python production dependencies
│   └── tests/               # Backend pytest test suite
├── docs/                    # Architecture documentation & decision records
│   └── adr/                 # Architectural Decision Records (0001–0005)
├── e2e/                     # Playwright end-to-end tests (app.spec.ts)
├── public/                  # Static assets served directly
│   ├── data/                # Static JSON feeds, track splines & f1db-browser.sqlite
│   ├── models/              # Draco-compressed 5-era glTF chassis models (161 kB total)
│   └── sw.js                # Custom Service Worker (PWA caching)
├── scripts/                 # Automation, ETL, and verification tooling
│   ├── blender/             # Parametric Blender Python (bpy) vehicle scripts & validators
│   ├── etl/                 # F1DB transformation & schema validation scripts
│   └── telemetry/           # Telemetry pack generation & invariant testing
├── src/                     # React application source code
│   ├── components/          # Reusable UI primitives, Navigation, DevTools & HUD
│   ├── contexts/            # React context providers (ExperienceMode, InspectQuery)
│   ├── data/                # Static schemas, glossary, hotspots & corner registries
│   ├── features/            # Feature modules partitioned by domain
│   │   ├── cars/            # 3D Vehicle Lab, era registry, liveries & anatomy
│   │   ├── circuits/        # Topographic 3D ribbons, 2D SVG maps & Corner DNA
│   │   ├── docs/            # Architecture Explorer & in-app ADR reader
│   │   ├── drivers/         # Driver archive, virtual list & H2H comparison
│   │   ├── historian/       # SQLite WASM client, presets, CodeMirror editor & audio
│   │   ├── home/            # Home view, starter stories, Favorites & OnThisDay
│   │   ├── seasons/         # Seasons archive & What-If scoring simulator
│   │   ├── strategy/        # Monte Carlo pit-wall simulator & Web Worker
│   │   └── telemetry/       # 3D ghost lap replay, uPlot graphs & OpenF1 loader
│   ├── hooks/               # Custom hooks (shortcuts, media queries, sound)
│   ├── lib/                 # IndexedDB persisters, query clients & utilities
│   ├── routes/              # React Router definitions & route shells
│   └── types/               # TypeScript interfaces & domain types
├── package.json             # Pinned package dependencies and npm scripts
├── tsconfig.json            # Strict TypeScript configuration
└── vite.config.ts           # Vite build pipeline, proxy & coverage setup
```

---

## 🧪 Testing & Verification Matrix

Every commit and pull request must satisfy the complete 9-gate quality matrix:

```bash
# 1. Clean code and dependency lint check
npm run lint

# 2. Strict TypeScript type compilation
npx tsc -b

# 3. 3D Era Vehicle Mesh Validation
npm run models:verify

# 4. Unit Test Suite & Code Coverage
npm run test:coverage

# 5. Optional Python Backend Linting & Tests
uv run --with-requirements backend/requirements-dev.txt ruff check backend/
uv run --with-requirements backend/requirements-dev.txt pytest backend/tests -v

# 6. Production Bundle Build & Size Budget Enforcement
npm run build && npm run size

# 7. Playwright End-to-End Suite
npx playwright test e2e/app.spec.ts

# 8. Lighthouse CI Performance & Accessibility Audit
npm run audit:lighthouse

# 9. Clean Git Working Tree
git status --short
```

---

## 🏛️ Architecture & Decision Records

Technical decisions are documented as Architectural Decision Records under `docs/adr/` and viewable directly within the application at `/docs`:

- [ADR-0001: WebGL Context Lifecycle & Route Architecture](docs/adr/0001-webgl-context-lifecycle-and-route-architecture.md)
- [ADR-0002: Dual-Tier SQL Query Engine & Security Sandboxing](docs/adr/0002-dual-tier-sql-query-engine-and-security-sandboxing.md)
- [ADR-0003: 3D Topographic Circuit Geometry with SRTM Elevation](docs/adr/0003-3d-topographic-circuit-geometry-with-srtm-elevation.md)
- [ADR-0004: Monte Carlo Strategy Engine & Web Worker Architecture](docs/adr/0004-monte-carlo-strategy-engine-and-web-worker-architecture.md)
- [ADR-0005: Blender Procedural 5-Era Car Pipeline](docs/adr/0005-blender-and-procedural-circuits.md)

Detailed system architecture and data pipelines are elaborated in [ARCHITECTURE.md](ARCHITECTURE.md).

---

## ⚖️ Data Sources, Licensing & Attributions

- **Formula 1 Disclaimer**: This project is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX, and related marks are trademarks of Formula One Licensing B.V.
- **F1DB**: Historical race results, drivers, constructors, and championship standings are sourced from [F1DB](https://github.com/f1db/f1db) under the [Creative Commons Attribution 4.0 International (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/) license.
- **Circuit GeoJSON**: Geographic circuit outlines are adapted from [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) under the [MIT License](https://opensource.org/licenses/MIT).
- **SRTM Topography**: Elevation data provided by the [Open-Meteo Elevation API](https://open-meteo.com/en/docs/elevation-api) under the [CC-BY-4.0 License](https://creativecommons.org/licenses/by/4.0/).
- **Live Standings**: Live championship tables are queried via the [Jolpica F1 API](https://github.com/jolpica/jolpica-f1).
- **Telemetry Feeds**: High-resolution telemetry traces are ingested via the [OpenF1 API](https://openf1.org) under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/) license.
- **Source Code**: The application code is open-source under the [MIT License](LICENSE).
