# F1 // ARCHIVE — Open Source & Data Licensing

This project combines custom frontend software, open-source geospatial/telemetry datasets, and educational Web3D assets. Each component is governed by its respective terms:

---

## 1. Source Code
The core source code of the **F1 // ARCHIVE** web application (React, TypeScript, CSS, shaders, simulation logic, and build scripts) is licensed under the **MIT License**.

```text
Copyright (c) 2026 Khare69

Permission is hereby granted to use, copy, modify, merge, publish, and distribute this software
for personal, educational, or commercial purposes, subject to standard MIT terms.
See LICENSE for full text.
```

---

## 2. Historical Data & Telemetry Sources

| Dataset / Service | Upstream Source | Primary License / Terms | Usage in Project |
| :--- | :--- | :--- | :--- |
| **F1DB** | [f1db/f1db](https://github.com/f1db/f1db) | Creative Commons Attribution 4.0 International (**CC-BY-4.0**) | Historical race classifications, seasons, driver/constructor records, and SVG circuit layouts. |
| **F1 Circuits GeoJSON** | [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) | **MIT License** | Geospatial track geometries, elevation data, and turn coordinates. |
| **Racetrack Database** | [TUMFTM/racetrack-database](https://github.com/TUMFTM/racetrack-database) | Open Academic Data License | Track width reference for 3D ribbon extrusion. |
| **Jolpica / Ergast API** | [api.jolpi.ca](https://api.jolpi.ca) | Creative Commons Attribution-NonCommercial-ShareAlike 4.0 (**CC BY-NC-SA 4.0**) | Live current-season championship standings and race schedule feeds. |
| **OpenF1** | [openf1.org](https://openf1.org) | Creative Commons Attribution-NonCommercial-ShareAlike 4.0 (**CC BY-NC-SA 4.0**) | Downsampled sample telemetry (speed, throttle, brake, RPM) and ghost-lap comparison data. |

---

## 2.1. Telemetry License Firewall (CC BY-NC-SA 4.0 Isolation)

- **Non-Commercial Boundary**: Telemetry data sourced or derived from OpenF1 APIs is strictly distributed for **educational, personal, and non-commercial analytical use** under **CC BY-NC-SA 4.0**.
- **Codebase Isolation**: The underlying web application engine, 3D rendering pipeline, Three.js shaders, calculation utilities, and user interface components remain licensed under the **MIT License**.
- **ShareAlike Compliance**: Any derivative modifications or transformations to the telemetry datasets themselves must be shared under terms compatible with CC BY-NC-SA 4.0, preserving upstream attribution without imposing ShareAlike restrictions on independent frontend components.

---

## 3. 3D Models and Visual Media

- **Chassis 3D Model (`f1_chassis.glb`)**: Provided for educational, non-commercial, and portfolio demonstration purposes. All liveries, materials, and shaders are procedurally generated in-browser using Three.js.
- **Trademarks & Team Identity**: Formula 1, F1, team names, driver names, and related branding remain the exclusive intellectual property of Formula One Licensing B.V. and their respective constructors.

---

## 4. Legal Disclaimer

This project is an independent educational and open-source archive. It is completely unofficial and is not endorsed by, sponsored by, or affiliated with Formula One World Championship Limited, FIA, or any Formula 1 team.
