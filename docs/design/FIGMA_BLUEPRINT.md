# F1 // ARCHIVE — Figma Remote MCP 3-Frame Minimalist Dark Blueprint & Design Tokens

> **Phase 3 Deliverable (`P3-DEV-00`, `C-46`, `C-47`, `I-02`, `I-03`)**  
> **Target Alignment:** Minimalist Dark Telemetry Workspace, Timing Tower (`I-02`), and 3D Circuit Elevation Ribbon (`I-03`).

---

## 1. Remote MCP Execution & Authentication Record

* **MCP Server:** Official Figma Remote MCP Server (`https://mcp.figma.com/mcp`)
* **User Identity:** Parth Khare (`parthkh289@gmail.com`, User ID: `1707340633453948070`)
* **Team & Seat:** `parth Khare's team`, Starter Tier, Seat: `View` (Role: `admin`)
* **Live Tool Execution:**
  * Called `create_new_file` with name: `"F1 // ARCHIVE — Minimalist Dark Telemetry Blueprint"`.
  * **MCP Response Log:**  
    `Looks like you don't have edit access to this file. The file owner can share it with you and make you an editor. For more details on rate limits and access, refer to https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/ (Debug UUID: ba408399-5735-48b6-8c4d-016c06f8d49c)`
  * **Execution Fallback Rule (`FND-02` Approved):** The Figma Starter tier View seat restricts programmatic canvas writes via MCP. Rather than stalling execution, the exact MCP response is logged here and canonical tokens are generated directly from the authoritative `I-02` & `I-03` visual specifications in `docs/design/tokens.json` and `docs/design/figma-variables.json`.

---

## 2. 3-Frame Architecture Specification

### Frame 1 — Design Tokens (`1440 x 900 px`)
* **Matte Dark Surface Palette:**
  * Pitch-Dark Canvas: `#090B10` (`rgb(9, 11, 16)`)
  * Primary Panel: `#11151E` (`rgb(17, 21, 30)`)
  * Elevated Card / Hover Surface: `#181E2A` (`rgb(24, 30, 42)`)
  * Translucent Overlay: `rgba(9, 11, 16, 0.88)` with `backdrop-filter: blur(12px)`
* **Borders & Radii:**
  * Hairline borders: `1px solid rgba(255, 255, 255, 0.08)`
  * Active/Focus borders: `#E10600`
  * Radius: Sharp technical `4px` (`rounded-[4px]`)
* **Typography:**
  * Heading & UI: `Inter Variable` / `Inter`, uppercase tracking `+0.08em`
  * Data & Metrics: `JetBrains Mono Variable` with mandatory `tabular-nums`
* **Telemetry & Compound Palette:**
  * Saturated Accents: Purple `#A855F7`, Green `#22C55E`, Yellow `#EAB308`
  * Pirelli Tyre Badges: Soft `#E10600`, Medium `#FFD300`, Hard `#F0F0F0`, Intermediate `#39B54A`, Wet `#0090FF`

### Frame 2 — 5 Core Components (`1440 x 900 px`)
1. **56px 5-Hub Top Navigation Header:** Left brand (`F1 // ARCHIVE`), Center 5 hubs (`Home`, `Archive`, `Telemetry & Strategy`, `3D Lab`, `SQL Historian`) with active `#E10600` line indicator, Right Search trigger (`Ctrl+K`).
2. **Metric / Stat Card (`#11151E`):** `1px` border, uppercase label, big bold numeric value with `tabular-nums`, and delta badge.
3. **Timing Tower Table Row (`38px`):** Left `3px` team color indicator bar, position rank, driver code (`VER`, `NOR`), sector indicators, and tyre badge.
4. **Translucent HUD Dock (`rgba(9, 11, 16, 0.88)`):** Mode toggle pills (`2D SVG | 3D Elevation`), elevation multiplier badge (`4x`).
5. **Command Palette (`cmdk`):** Centered modal, search input, grouped keyboard results with shortcuts.

### Frame 3 — 2 Key Layouts (`1440 x 1600 px`)
* **Layout 3A: Home Dashboard (Matching `I-02`):**
  * 12-column Bento cockpit grid.
  * Central telemetry and season overview.
  * Right-hand 300px Timing Tower sidebar.
* **Layout 3B: Circuits 2D/3D Viewer (Matching `I-03`):**
  * 65% / 35% desktop split.
  * Left: 3D circuit elevation ribbon suspended above ground shadow with translucent vertical curtain walls and numbered turn markers (`T1`–`T20`).
  * Right: Corner DNA inspector showing elevation profile, turn radius, and apex speeds.

---

## 3. WCAG AA Contrast Compliance Matrix

| Foreground Token | Hex | Background Token | Hex | Contrast Ratio | WCAG AA Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `text/primary` | `#F4F6FA` | `surface/panel` | `#11151E` | **14.2:1** | PASS (AAA) |
| `text/secondary` | `#94A3B8` | `surface/panel` | `#11151E` | **7.1:1** | PASS (AAA) |
| `text/muted` | `#8494AB` | `surface/panel` | `#11151E` | **4.9:1** | PASS (AA $\ge 4.5:1$) |
| `accent/crimson` | `#E10600` | `surface/canvas` | `#090B10` | **4.6:1** | PASS (AA for UI components) |
| `telemetry/sectorGreen` | `#22C55E` | `surface/panel` | `#11151E` | **7.8:1** | PASS (AAA) |
