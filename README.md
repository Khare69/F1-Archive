<p align="center">
  <img src="public/favicon.svg" width="72" alt="F1 Archive Logo" />
</p>

<h1 align="center">F1 // ARCHIVE — The Evolution of Speed</h1>

<p align="center">
  <strong>Cinematic Formula 1 Historical Archive, 3D Telemetry Replay, CAD Vehicle Lab &amp; Explainable AI Race Historian</strong><br/>
  Spanning 77 seasons (1950–2026), 861 drivers, 214 constructors, 77 circuits, and interactive 3D WebGL engineering simulations.
</p>

<p align="center">
  <a href="https://github.com/Khare69/F1-Archive/releases/tag/v1.0.0"><img src="https://img.shields.io/badge/Release-v1.0.0-gold?style=flat-square&logo=github" alt="v1.0.0 Release" /></a>
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Three.js-R174-000000?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js R174" />
  <img src="https://img.shields.io/badge/Vite-6.4.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Vitest-68_Passed-00E701?style=flat-square&logo=vitest&logoColor=white" alt="Unit Tests: 68 Passed" />
  <img src="https://img.shields.io/badge/Playwright-E2E_Passed-45ba4b?style=flat-square&logo=playwright&logoColor=white" alt="Playwright E2E" />
  <img src="https://img.shields.io/badge/Model_Size-1.19_MB_Draco-00D2FF?style=flat-square" alt="1.19 MB Draco GLB" />
</p>

---

## ⚡ Highlights & Engineering Benchmarks

- **Full F1DB Historical Vault (1950–2026)**: Ingests 77 world championship seasons, 861 drivers, 214 constructors, 77 circuits, and 1,100+ Grands Prix with zero runtime API dependency.
- **Explainable AI Race Historian & SQL Lab**: Natural language query synthesizer over F1DB with 16 analytical presets, client-side entity parser, inspectable SQL, and optional hardened FastAPI SQLite microservice.
- **3D Telemetry Ghost-Lap Replay**: Sector-anchored 3D dual-car playback (Silverstone, Monaco, Spa, Madrid 2026 sim) with 25 mini-sectors, dynamic delta times, synchronized telemetry traces, and 80 ms throttled UI updates.
- **Strategy & Tyre Degradation Analytics**: Multi-stint compound wear curves, lap-time delta breakdowns, and fuel-corrected pace toggle ($-0.035\text{ s/lap}$ per kg burn-off).
- **Driver Head-to-Head & Era Normalizer**: Mutual teammate gap analysis (filtering mid-season switches and DNSs), career points share percentage, and cross-era "What-If" championship scoring simulator (1988 Senna vs. Prost, 2008, 2021).
- **3D Vehicle CAD Lab & 2026 Active Aero Inspector**: Draco-compressed 3D chassis (`f1_chassis.glb`, 1.19 MB down from 18 MB), procedural PBR liveries, 2,000-particle wind tunnel, and 2026 Straight Mode / Corner Mode active aerodynamics toggles.
- **Zero-Waste WebGL Rendering**: Strict `frameloop="demand"` (0 FPS idle, zero battery drain when static), automated WebGL context reclamation on page navigation, and live GPU profiler overlay (`Shift + P` or `?debug=perf`).
- **Offline PWA Architecture**: Custom service worker with Network-First navigations, Cache-First static assets and 3D models, Network-Only dynamic APIs, and web manifest.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph DataIngestion[Data Pipeline & Upstream ETL]
        F1DB[(F1DB CC-BY-4.0)] --> SyncScript[scripts/sync-f1-data.mjs]
        GeoJSON[(bacinger GeoJSON)] --> SyncScript
        OpenF1[(OpenF1 CC BY-NC-SA 4.0)] --> SyncScript
        SyncScript --> StaticBundles[public/data/seasons/ & telemetry/]
    end

    subgraph ClientCore[Frontend Client Application (React 18 + Vite 6)]
        AppRoot[App Shell & Routing] --> Nav[Navigation & Command Palette]
        AppRoot --> StoragePersist[TanStack Query + safeStorage]
        
        Nav --> Seasons[Seasons Vault & What-If Simulator]
        Nav --> Drivers[Drivers Archive & Teammate H2H]
        Nav --> Circuits[Circuits Archive & 3D Topographic Ribbons]
        Nav --> Standings[Live Standings Jolpica Client]
        Nav --> Garage[Paddock Garage Simulator]
        
        Nav --> CADLab[3D Vehicle CAD Lab]
        CADLab --> ThreeCore[Three.js r174 / R3F Canvas]
        ThreeCore --> Draco[1.19 MB Draco GLB + PBR Shaders]
        ThreeCore --> Aero2026[2026 Active Aero Inspector]
        
        Nav --> Telemetry[3D Telemetry Replay & Strategy]
        Telemetry --> Ghost3D[Sector-Anchored Ghost Car Playback]
        Telemetry --> StintAnalytics[Fuel-Corrected Stint Degradation]
        
        Nav --> Historian[Explainable AI Race Historian]
        Historian --> Tier1Engine[Tier 1: Client In-Memory F1DB Text-to-SQL]
    end

    subgraph BackendTier2[Optional Tier 2 Backend Microservice]
        Historian -.->|VITE_HISTORIAN_API_URL| FastAPISvc[FastAPI SQLite Microservice]
        FastAPISvc --> SQLiteSandboxed[(Sandboxed Read-Only SQLite F1DB)]
    end

    subgraph OfflineObservability[PWA & Observability]
        SW[Service Worker sw.js] --> CacheStorage[(CacheStorage v1.0.0)]
        Obs[observability.ts] --> PerfObserver[Native PerformanceObserver]
        Obs -.-> SentryPostHog[Sentry & PostHog Facades]
    end
```

---

## 📦 Feature Breakdown

### 1. 🏛️ Explainable AI Race Historian & SQL Lab (`/historian`)
- **Natural Language Parsing**: Client-side intent parser converts natural language queries ("Tell me about Lewis Hamilton career stats", "Ferrari titles", "Monza masters", "1988 Senna vs Prost") into inspectable SQL.
- **16 Analytical Presets**: Verified SQL queries covering all-time Grand Prix winners, constructor titles, pole-to-win advantages, youngest champions, dropped score simulations, and rain-master classifications.
- **Dual View Modes**: Interactive sortable data tables and comparative horizontal bar charts.
- **SQL Inspector**: Full formatted SQL code block with explanation of era regulations, translation reasoning, execution latency, and one-click copy button.
- **Two-Tier Architecture**: Runs 100% in the browser (Tier 1) with zero server requirement; seamlessly integrates with the FastAPI microservice (Tier 2) when configured.

### 2. 🏎️ 3D Telemetry Ghost-Lap Replay & Strategy Analytics (`/telemetry`)
- **Precomputed Iconic Showdowns**:
  - *Silverstone 2024*: Hamilton vs. Verstappen (British GP victory duel)
  - *Monaco 2024*: Leclerc vs. Piastri (Q3 pole shootout)
  - *Spa 2024*: Verstappen vs. Norris (Eau Rouge & Kemmel sector duel)
  - *Madrid 2026 (Simulation)*: Alonso vs. Sainz (Active Aero & MOM energy deployment)
- **Sector-Anchored Coordinate Matching**: Uses normalized distance ($s \in [0, 1]$) along track splines to eliminate OpenF1 Cartesian coordinate mismatch.
- **Multi-Channel Synchronized Traces**: Real-time speed ($km/h$), throttle (%), brake (%), gear, RPM, and delta time ($\Delta t$).
- **25 Track Mini-Sectors**: Micro-sector delta map highlighting where each driver gained or lost time.
- **Strategy & Stint Degradation**: Multi-stint degradation curves, tyre compound performance, and toggleable fuel-corrected pace ($-0.035\text{ s/lap}$ per kg burn-off).

### 3. 📐 3D Vehicle CAD Lab & 2026 Regulation Inspector (`/cars`)
- **Draco Compressed GLB**: Chassis geometry optimized to **1.19 MB** (down from 18 MB original mesh).
- **Procedural PBR Shaders**: Carbon-fiber weave, metallic car paint with clearcoat, glass, and tyre rubber.
- **Wind-Tunnel Flow**: 2,000-particle aerodynamic streamline simulator.
- **2026 Regulation Inspector**:
  - Hotspot annotations highlighting Active Aero, $350\text{ kW}$ electric / 50-50 MGU-K split, Manual Override Mode (+0.5 MJ within 1 s), and 768 kg weight target.
  - Interactive **Active Aero Toggle**: Straight Mode (low drag) vs. Corner Mode (high downforce).
  - Parametric 3D wireframe box comparing 2026 compact dimensions ($3,400\text{ mm}$ wheelbase, $1,900\text{ mm}$ width) against 2022–2025 ground-effect regulations ($3,600\text{ mm} \times 2,000\text{ mm}$).

### 4. ⚖️ Driver Head-to-Head & Cross-Era What-If Simulator
- **Driver Comparison (`/drivers/compare`)**: Side-by-side radar and bar comparisons with mutual teammate head-to-head calculations (filtering non-mutual races, DNS entries, and mid-season team transfers) and career points share percentages.
- **What-If Championship Simulator (`/seasons/:year`)**: Recalculates historical World Drivers' Championships under alternative points systems (25-18-15 modern, 10-6-4 classic, 9-6-4, 10-8-6, medal system, and dropped scores). Fully covers 1988 (Senna 11-best vs. Prost total), 2008, 2021, and complete FIA countback.

### 5. 🗺️ Circuits Archive & 3D Topographic Ribbons (`/circuits`)
- Topographic ribbon extrusion rendering 3D elevation profiles for all 77 historical circuits.
- Historic statistics: circuit length, lap records, pole-to-win rates, and era layout changes.

### 6. 🔧 Paddock Garage Telemetry Simulator (`/garage`)
- Dynamic vehicle setup tuning: downforce levels, Pirelli tyre compounds, power unit engine modes.
- Real-time physics engine calculating simulated lap times, cornering G-forces, top speeds, and tyre thermal degradation.

### 7. 📊 Live Standings & Calendar (`/standings`)
- Live drivers' and constructors' championship standings via Jolpica F1 API.
- Offline resilience: in-memory + safeStorage caching with 12-hour TTL and curated static fallbacks.

---

## 🛠️ Tech Stack & Dependencies

| Category | Technologies |
|---|---|
| **Core Framework** | React 18.3.1, TypeScript 5.5.3, Vite 6.4.3 |
| **3D & WebGL Engine** | Three.js r174, `@react-three/fiber` 8.18.0, `@react-three/drei` 9.122.0 |
| **Motion & Interaction** | Framer Motion 11.18.2, Lucide React |
| **State & Data Caching**| TanStack Query v5.67.3 with safeStorage localStorage persister |
| **Routing** | React Router DOM 6.30.1 |
| **Testing** | Vitest 4.1.11, Testing Library (React / DOM / user-event), Playwright 1.58.2 |
| **Microservice (Backend)**| Python 3.10+, FastAPI 0.115+, Uvicorn, SQLite3 (read-only URI sandbox) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: $\ge 18.0.0$
- **npm**: $\ge 9.0.0$
- *(Optional)* Python $\ge 3.10$ for the Tier 2 SQLite backend

### 1. Clone & Install
```bash
git clone https://github.com/Khare69/F1-Archive.git
cd F1-Archive
npm install
```

### 2. Environment Configuration (Optional)
Copy `.env.example` to `.env.local` to enable optional services:
```bash
cp .env.example .env.local
```

```env
# Optional: Tier 2 FastAPI Backend (leave blank for pure Tier 1 client mode)
VITE_HISTORIAN_API_URL=http://localhost:8000

# Optional: Production Observability
VITE_SENTRY_DSN=
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

### 3. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` to explore the archive.

### 4. (Optional) Run Tier 2 FastAPI Historian Backend
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

## 🧪 Verification & Testing Suite

### Unit & Integration Tests (Vitest)
Executes 68 unit tests across 10 test suites covering telemetry math, scoring simulators, Jolpica client error handling, OpenF1 LRU caching, data integrity, and the AI Race Historian:
```bash
npm test
```

### End-to-End Tests (Playwright)
Executes deterministic offline E2E tests verifying all 10 core pages, 3D WebGL canvases, transport controls, and command palette navigation:
```bash
npm run test:e2e
```

### Type Checking & Linting
```bash
npx tsc -b
npm run lint
```

### Production Build
```bash
npm run build
npm run preview
```

---

## ⚡ Performance Profiling & WebGL Safety

Press **`Shift + P`** or append **`?debug=perf`** to any URL to open the unified **Race Control Performance HUD**:
- **FPS**: Real-time rendering frame rate.
- **Frame Delta**: Elapsed frame time in milliseconds.
- **Draw Calls**: Active GPU draw calls per frame.
- **Triangles / Geometry**: Polycount of the active 3D scene.
- **JS Heap**: Live heap usage via `performance.memory` (Chrome/Edge).
- **Frameloop Mode**: Indicates `demand` (0 FPS idle) vs. `always` (playback active).

---

## ⚖️ Legal Disclaimer

> **This website is unofficial and is not associated in any way with the Formula 1 companies.**  
> F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.  
> Historical statistics, race results, and telemetry are aggregated for non-commercial educational, analytical, and research purposes.

---

## 📄 Licensing & Security

- **Source Code**: Licensed under the [MIT License](LICENSE).
- **Data & Telemetry Attribution**: Comprehensive upstream licensing, CC-BY-4.0 attributions, and CC BY-NC-SA 4.0 telemetry firewall terms are detailed in [LICENSES.md](LICENSES.md).
- **Security Policy**: Vulnerability disclosure guidelines are documented in [SECURITY.md](SECURITY.md).
