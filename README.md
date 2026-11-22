<p align="center">
  <img src="public/favicon.svg" width="60" alt="F1 Archive Logo" />
</p>

<h1 align="center">F1 // ARCHIVE — The Evolution of Speed</h1>

<p align="center">
  <strong>A cinematic Formula 1 historical archive and telemetry interface</strong><br/>
  Explore 75+ years of seasons, legendary teams, iconic drivers, interactive 3D race cars, and a lap‑time simulator — all wrapped in a race‑control telemetry aesthetic.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Three.js-R174-000000?logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Framer_Motion-13-FF0050?logo=framer&logoColor=white" alt="Framer Motion" />
</p>

---

## ✨ Features

### 🏠 Cinematic Welcome & Home
- **First‑visit welcome experience** with an animated F1 car animation and live telemetry HUD countdown — automatically skipped for returning visitors, users with reduced‑motion preferences, or slow connections.
- **Home dashboard** showcasing archive‑wide statistics (seasons, constructors, drivers, circuits, wins) with a module directory for quick navigation.

### 📅 Seasons Vault
- Browse every championship season from 1950 to 2026.
- View champion driver & constructor, notable events, and records broken per year.

### 🏎️ Constructors Archive
- Detailed team profiles: headquarters, team principal, championship count, pole positions, fastest laps.
- Technical specifications per team — power unit, chassis, weight, downforce, and top speed.
- Roster of team drivers with career stats.

### 👨‍✈️ Drivers Roster & Comparator
- Full driver profiles with career wins, podiums, championships, and race‑by‑race finish charts.
- **Head‑to‑head Driver Comparison** tool — select two drivers and compare stats side‑by‑side with visual bar charts.

### 📐 3D Vehicle Lab (CAD Lab)
- **Interactive 3D car viewer** powered by Three.js / React Three Fiber.
- Procedurally generated team liveries applied via PBR shaders (metallic paint, carbon fiber, glass, rubber).
- **Aero wind‑tunnel mode** with 2,000‑particle airflow simulation.
- Hover over individual car components (front wing, sidepods, halo, etc.) to see engineering telemetry cards.
- Studio‑quality 4‑point PBR lighting with ACES filmic tone mapping, contact shadows, and HDR environment map.

### 🗺️ Race Circuits
- Circuit profiles with track length, turn count, DRS zones, elevation, lap records, and type classification.
- **3D topographic track viewer** — circuits rendered as elevated 3D ribbon geometry inside a dedicated Three.js canvas.

### 🔧 Paddock Garage — Telemetry Simulator
- Configure a full car setup: choose constructor, driver, and target Grand Prix circuit.
- Tune aerodynamic downforce (LOW / MEDIUM / HIGH), Pirelli tyre compound (SOFT / MEDIUM / HARD / WET), and power unit engine mode (BALANCED / OVERTAKE / QUALIFYING).
- **Real‑time simulated lap output** — predicted lap time vs. track record, top speed, lateral G‑force, tyre grip percentage, and aero drag rating.
- Setup preferences persist in `localStorage`.

### 📊 Live Standings
- **Live championship standings** for both Drivers and Constructors, fetched from the [Jolpica (Ergast) F1 API](https://api.jolpi.ca/ergast/f1).
- Current season **race schedule** with dates and circuit info.
- Graceful offline fallback with curated static data when the API is unreachable.
- Dual‑layer caching: in‑memory + `localStorage` with 12‑hour TTL.

### 🔍 Command Palette (Search)
- Global search modal triggered via `Ctrl+K` / `Cmd+K`.
- Instantly search across all teams, drivers, circuits, and seasons with fuzzy matching.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 with TypeScript 5 |
| **Build Tool** | Vite 6 (with manual chunk splitting for Three.js, Framer Motion, React) |
| **3D Engine** | Three.js r174 via `@react-three/fiber` + `@react-three/drei` |
| **Animations** | Framer Motion 13, CSS keyframe animations |
| **Routing** | React Router DOM v6 |
| **API** | Jolpica F1 REST API (Ergast successor) |
| **Styling** | Vanilla CSS with custom design tokens (glassmorphism, carbon‑fiber textures, neon telemetry aesthetic) |
| **Fonts** | Titillium Web (headlines), Share Tech Mono (telemetry), Outfit (body) |
| **Testing** | Vitest + Testing Library (React / jsdom) |
| **Code Quality** | TypeScript strict mode |

---

## 📂 Project Structure

```
f1 project/
├── public/
│   ├── favicon.svg
│   └── models/
│       └── f1_chassis.glb          # 3D car model (~18 MB)
├── scripts/
│   └── verify_app.cjs              # Automated UI verification script
├── src/
│   ├── api/
│   │   ├── jolpicaClient.ts        # Jolpica F1 API client with caching & fallbacks
│   │   └── jolpicaClient.test.ts
│   ├── components/                  # Shared UI components
│   │   ├── ErrorBoundary/
│   │   ├── FallbackImage/
│   │   ├── Navigation/
│   │   ├── PageTransition/
│   │   └── StatCard/
│   ├── contexts/
│   │   └── UserPreferencesContext.tsx
│   ├── data/
│   │   ├── f1_database.ts          # Curated F1 database (teams, drivers, seasons, circuits)
│   │   ├── dataService.ts          # Data access abstraction layer
│   │   └── dataService.test.ts
│   ├── features/                    # Feature modules (page-level components)
│   │   ├── cars/                    # 3D Vehicle Lab (Three.js canvas, livery generator, wind tunnel)
│   │   ├── circuits/                # Circuit archive + 3D track viewer
│   │   ├── drivers/                 # Driver roster + head-to-head comparison
│   │   ├── garage/                  # Paddock telemetry simulator
│   │   ├── home/                    # Landing page / dashboard
│   │   ├── notfound/                # 404 page
│   │   ├── search/                  # Command palette (Ctrl+K)
│   │   ├── seasons/                 # Season vault
│   │   ├── standings/               # Live championship standings
│   │   ├── teams/                   # Constructors archive
│   │   └── welcome/                 # Cinematic first-visit intro
│   ├── hooks/
│   │   ├── useDocumentTitle.ts
│   │   └── useUserPreferences.ts
│   ├── test/
│   │   └── setup.ts                # Vitest setup (jsdom)
│   ├── types/
│   │   └── f1.ts                   # TypeScript interfaces for all domain models
│   ├── App.tsx                     # Root component with routing & layout
│   ├── App.css
│   ├── index.css                   # Global design system & tokens
│   └── main.tsx                    # React DOM entry point
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/Khare69/F1-Archive.git
cd F1-Archive

# Install dependencies
npm install
```

### Development

```bash
# Start the dev server (default: http://localhost:5173)
npm run dev
```

### Production Build

```bash
# Type-check + build
npm run build

# Preview the production build locally
npm run preview
```

### Testing

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch
```

### UI Verification

```bash
# Automated UI smoke test (Playwright-based)
npm run verify:ui
```

---

## 🏗️ Architecture & Engineering Design

```mermaid
flowchart TD
    UI[React Viewport & Pages] --> Service[Data Service Layer]
    Service --> StaticData[Offline Data Store]
    Service --> APIClient[Jolpica Client]
    APIClient --> MemCache[(Memory Cache)]
    APIClient --> LocalCache[(localStorage Cache)]
    APIClient --> RemoteAPI[Jolpica / Ergast API]
    UI --> R3F[React Three Fiber / Three.js CAD Lab]
    R3F --> Shaders[Procedural PBR Shaders & Wind Tunnel]
```

- **Separation of Concerns**: Components never touch raw database arrays or API endpoints directly; all queries flow through `src/data/dataService.ts`.
- **Resilient Dual-Tier Caching**: The API client checks memory cache first, then localStorage, and falls back gracefully to curated historical data if offline.
- **Modular WebGL Pipeline**: The 3D viewer is lazily loaded with `@react-three/fiber` and `@react-three/drei`, applying procedural liveries via PBR shaders.

---

## 🌐 API & Data Sources

| Source | Usage | License / Terms |
|---|---|---|
| **Jolpica F1 API** (`api.jolpi.ca/ergast/f1`) | Live driver standings, constructor standings, and race schedule | CC BY-NC-SA 4.0 |
| **Curated Historical Data** | Offline-first database covering 1950–2026 seasons, teams, drivers, and circuits | CC-BY-4.0 |
| **Track Geometries** | Topographic elevation and 3D track ribbon coordinates | MIT License |

---

## 🎨 Design Philosophy

The UI is inspired by Formula 1 **race‑control telemetry screens** and **broadcast graphics**:

- **Dark cockpit aesthetic** — deep navy/black backgrounds with carbon‑fiber textures and grid overlays.
- **Neon telemetry accents** — cyan (`#00D2FF`), racing red (`#FF1E1E`), and championship gold (`#FFD700`).
- **Glassmorphism panels** — frosted glass cards with subtle gradients and glowing borders.
- **Monospace data readouts** — Share Tech Mono for a telemetry‑authentic feel.
- **Cinematic motion** — Framer Motion page transitions, AnimatePresence, and CSS keyframe animations (pulse, shimmer, float, scanline).
- **Accessibility‑conscious** — respects `prefers-reduced-motion`, skips intro on slow connections, full keyboard navigation, ARIA labels.

---

## ⚡ Performance Optimizations

- **Code splitting** — The heavy 3D Vehicle Lab module is lazy‑loaded with `React.lazy()` + `Suspense`.
- **Manual Vite chunks** — Three.js, Framer Motion, and React are split into separate vendor bundles.
- **API response caching** — Dual‑layer (memory + localStorage) with 12‑hour TTL.
- **Error boundaries** — Graceful degradation for 3D rendering failures and HDR environment map loading.
- **Cached data queries** — Sorted season lists are computed once and memoized.

---

## ⚖️ Legal Disclaimer

> This website is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V. Historical statistics and telemetry are aggregated for non-commercial educational and research purposes.

---

## 📄 License & Security

- **Source Code**: Licensed under the **MIT License**.
- **Data & Assets**: See [LICENSES.md](LICENSES.md) for full upstream attribution and terms.
- **Security Policy**: See [SECURITY.md](SECURITY.md) for vulnerability reporting guidelines.
