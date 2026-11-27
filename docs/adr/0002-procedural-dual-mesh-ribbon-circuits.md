# ADR-0002: Procedural Dual-Mesh Ribbon Generator for 3D Tracks

## Context and Problem Statement
Visualizing Formula 1 circuits in 3D historically required hand-crafted 3D polygon models (.obj or .gltf) for each of the 70+ historical circuits. Maintaining these assets is labor-intensive, results in large download sizes, and prevents dynamic styling (such as real-time elevation heatmaps, sector coloring, or apex highlighting).

## Decision
We built a procedural dual-mesh track generator (`src/features/circuits/circuitRibbonBuilder.ts`) that computes 3D road surfaces, elevation deltas, and kerb geometry on the fly from geo-referenced coordinate splines.

## Technical Implementation
1. **Coordinate Projection**: GPS coordinates (lat, lon, elevation) are projected into local Cartesian coordinates using standard Mercator projection.
2. **Frenet-Serret Frames**: Continuous tangent, normal, and binormal vectors are computed along the smoothed 3D Catmull-Rom spline.
3. **Dual-Mesh Geometry**:
   - **Road Deck**: An extruded strip of configurable track width (12–15m) with smooth banking.
   - **Kerbs & Run-offs**: Secondary extruded ribbons colored with alternating red/white kerbing along corner apexes.
4. **Dynamic Shading**: Vertex attributes encode elevation deltas and sector boundaries, enabling GPU-accelerated heatmaps without mesh regeneration.

## Consequences
- **Positive**: Zero multi-megabyte 3D track model downloads; instant rendering of any circuit from lightweight JSON (~20 kB); interactive sector and elevation visualizers.
- **Negative**: Requires client GPU WebGL support; sharp hairpins require careful spline tension tuning to avoid self-intersecting ribbon geometry.
