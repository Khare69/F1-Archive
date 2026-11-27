# ADR-0005: Blender MCP Procedural 5-Era Car Pipeline

## Context and Problem Statement
3D models of Formula 1 cars from different eras (1950 Front-Engine, 1967 Cigar Era, 1988 Turbo Era, 2014 Hybrid Era, and 2026 Active Aerodynamics) often come from inconsistent 3D sources with differing coordinate orientations, missing material zones, arbitrary scales, and heavy polygon counts (10–50 MB each).

## Decision
We established an automated procedural generation and export pipeline using the **Blender MCP Server** (`scripts/blender/build_era_cars.py`) paired with Draco compression.

## Technical Implementation
1. **Standardized Native Coordinates**:
   - Blender: Nose = `+X`, Tail = `-X`, Roof = `+Z`, Width symmetric on `Y`, Tires grounded at `Z = 0.0`.
   - glTF 2.0 Export: Nose = `+X`, Tail = `-X`, Roof = `+Y`, Tires grounded at `Y = 0.0`.
2. **Real-World Dimensional Scaling**: Length 4.2m–5.5m, Width 1.8m–2.0m, Height ~1.0m.
3. **Canonical Material Hierarchy**: 9 standardized material zones (`Body`, `FrontWing`, `RearWing`, `Cockpit`, `Halo`, `Floor`, `TireTread`, `WheelRim`, `Suspension`).
4. **Draco Geometry Compression**: Applied Draco geometry encoding to achieve file sizes under 1 MB per era car.
5. **Dynamic Livery Engine**: `carMaterialMapper.ts` dynamically tints the canonical material slots at runtime to match constructor color palettes.

## Consequences
- **Positive**: Consistent 3D inspection camera behavior across all 5 eras; zero rotation workarounds in Three.js; sub-second asset download times; dynamic runtime team livery recoloring.
- **Negative**: Procedural models have stylized geometries rather than high-density CAD meshes.
