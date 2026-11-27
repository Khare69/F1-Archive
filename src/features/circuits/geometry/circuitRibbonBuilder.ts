import * as THREE from 'three';

export type RibbonColorMode = 'sectors' | 'elevation' | 'speed_drs';

export interface RibbonBuildOptions {
  coordinates: [number, number, number][];
  elevationDeltaM: number | null;
  elevationSource: 'open-meteo-srtm' | 'unavailable';
  trackSpanMeters?: number | null;
  exaggeration: number; // 1 | 2 | 4 | 5 (default 4)
  colorMode: RibbonColorMode;
  trackWidth?: number; // default 0.52 scene units
  sampleCount?: number; // default 360 smooth closed spline samples
}

export interface KerbSegment {
  startIndex: number;
  endIndex: number;
  side: 'left' | 'right';
  peakCurvature: number;
}

export interface BuiltCircuitGeometries {
  ribbonGeometry: THREE.BufferGeometry; // extruded flat asphalt with vertex colors
  leftBorderGeometry: THREE.BufferGeometry; // white outer limit line
  rightBorderGeometry: THREE.BufferGeometry; // white outer limit line
  curtainGeometry: THREE.BufferGeometry; // translucent vertical skirt to y = 0
  dropLinesGeometry: THREE.BufferGeometry; // subtle vertical elevation guide ticks
  groundShadowGeometry: THREE.BufferGeometry; // flat y = 0.01 shadow footprint
  kerbRedGeometry: THREE.BufferGeometry; // auto-generated curvature apex kerbs (red)
  kerbWhiteGeometry: THREE.BufferGeometry; // auto-generated curvature apex kerbs (white)
  sampledPoints: THREE.Vector3[]; // closed loop 3D samples
  pointAtT: (t: number) => THREE.Vector3; // normalized [0, 1) lookup
  tangentAtT: (t: number) => THREE.Vector3;
  kerbSegments: KerbSegment[];
  maxScaledHeight: number;
}

/**
 * Computes the scaled Y coordinate in Three.js scene units.
 * Calibrated directly to ETL normalized coordinates and Open-Meteo elevation deltas.
 */
export function computeScaledElevationY(
  relElevMeters: number,
  trackSpanMeters: number | null | undefined,
  exaggeration: number,
  hasRealElevation: boolean
): number {
  if (!hasRealElevation) {
    return 0.18; // Flat track standard height
  }
  const spanM = trackSpanMeters && trackSpanMeters > 200 ? trackSpanMeters : 2500;
  const sceneUnitsPerMeter = 12.0 / spanM;
  const baseY = 0.25;
  const height = baseY + (Math.max(0, relElevMeters) * sceneUnitsPerMeter) * exaggeration;
  return Math.min(height, 6.0);
}

/**
 * Detects high-curvature corner apexes from a sampled loop.
 */
export function detectCurvatureKerbs(
  points: THREE.Vector3[],
  curvatureThreshold = 0.038
): KerbSegment[] {
  const n = points.length;
  if (n < 6) return [];

  // 1. Compute 2D turning angle (curvature) on the XZ plane between consecutive segments
  const rawCurvatures: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    if (!prev || !curr || !next) continue;

    const v1x = curr.x - prev.x;
    const v1z = curr.z - prev.z;
    const v2x = next.x - curr.x;
    const v2z = next.z - curr.z;

    const len1 = Math.hypot(v1x, v1z);
    const len2 = Math.hypot(v2x, v2z);

    if (len1 > 1e-5 && len2 > 1e-5) {
      // 2D cross product gives signed turn direction (+ = turn left, - = turn right)
      const cross2d = v1x * v2z - v1z * v2x;
      const dot = v1x * v2x + v1z * v2z;
      const angle = Math.atan2(cross2d, dot);
      rawCurvatures[i] = angle;
    }
  }

  // 2. 3-point smoothing
  const curvatures: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const p = rawCurvatures[(i - 1 + n) % n] ?? 0;
    const c = rawCurvatures[i] ?? 0;
    const next = rawCurvatures[(i + 1) % n] ?? 0;
    curvatures[i] = (p + c * 2 + next) / 4;
  }

  // 3. Cluster contiguous regions above threshold into kerb segments
  const segments: KerbSegment[] = [];
  let inKerb = false;
  let startIdx = 0;
  let maxCurv = 0;
  let dominantSign = 0;

  for (let i = 0; i < n; i++) {
    const k = curvatures[i] ?? 0;
    const absK = Math.abs(k);

    if (absK > curvatureThreshold) {
      if (!inKerb) {
        inKerb = true;
        startIdx = i;
        maxCurv = absK;
        dominantSign = Math.sign(k);
      } else {
        if (absK > maxCurv) {
          maxCurv = absK;
          dominantSign = Math.sign(k);
        }
      }
    } else {
      if (inKerb) {
        const segLen = i - startIdx;
        if (segLen >= 2) {
          segments.push({
            startIndex: startIdx,
            endIndex: i - 1,
            side: dominantSign > 0 ? 'left' : 'right',
            peakCurvature: maxCurv
          });
        }
        inKerb = false;
      }
    }
  }

  if (inKerb && n - startIdx >= 2) {
    segments.push({
      startIndex: startIdx,
      endIndex: n - 1,
      side: dominantSign > 0 ? 'left' : 'right',
      peakCurvature: maxCurv
    });
  }

  return segments;
}

/**
 * Builds all 3D circuit geometries deterministically:
 * - Extruded flat asphalt ribbon with vertex colors,
 * - Outer track limit borders,
 * - Translucent vertical elevation curtain,
 * - Drop lines & ground shadow,
 * - Mathematically derived apex kerbs.
 */
export function buildCircuitGeometries(
  options: RibbonBuildOptions
): BuiltCircuitGeometries {
  const {
    coordinates,
    elevationDeltaM,
    elevationSource,
    trackSpanMeters,
    exaggeration = 4,
    colorMode = 'sectors',
    trackWidth = 0.52,
    sampleCount = 360
  } = options;

  const hasRealElevation = elevationSource === 'open-meteo-srtm' && (elevationDeltaM != null && elevationDeltaM > 0);

  // 1. Deduplicate consecutive identical vertices closer than 1e-4
  const cleanedCoords: [number, number, number][] = [];
  for (let i = 0; i < coordinates.length; i++) {
    const pt = coordinates[i];
    if (!pt) continue;
    if (cleanedCoords.length === 0) {
      cleanedCoords.push(pt);
    } else {
      const prev = cleanedCoords[cleanedCoords.length - 1];
      if (prev) {
        const distSq = (pt[0] - prev[0]) ** 2 + (pt[1] - prev[1]) ** 2 + (pt[2] - prev[2]) ** 2;
        if (distSq > 1e-7) {
          cleanedCoords.push(pt);
        }
      }
    }
  }

  const rawPoints = cleanedCoords.length >= 4 ? cleanedCoords : coordinates;

  // 2. Map coordinates into 3D control points with scaled elevation
  let maxScaledHeight = 0.18;
  const controlPts: THREE.Vector3[] = [];

  for (const p of rawPoints) {
    const storedY = p[1];
    const relElevMeters = hasRealElevation && elevationDeltaM
      ? (Math.max(0, storedY) / 1.8) * elevationDeltaM
      : 0;

    const scaledY = computeScaledElevationY(relElevMeters, trackSpanMeters, exaggeration, hasRealElevation);
    if (scaledY > maxScaledHeight) {
      maxScaledHeight = scaledY;
    }
    controlPts.push(new THREE.Vector3(p[0], scaledY, p[2]));
  }

  // 3. Construct smooth closed Catmull-Rom spline
  const curve = new THREE.CatmullRomCurve3(controlPts, true, 'centripetal');
  const sampledPoints = curve.getSpacedPoints(sampleCount);
  sampledPoints.pop(); // Remove the duplicate wrap-around end point (length is now sampleCount)

  const n = sampledPoints.length;
  const pointAtT = (t: number): THREE.Vector3 => {
    const normalizedT = ((t % 1) + 1) % 1;
    return curve.getPointAt(normalizedT);
  };
  const tangentAtT = (t: number): THREE.Vector3 => {
    const normalizedT = ((t % 1) + 1) % 1;
    return curve.getTangentAt(normalizedT);
  };

  // 4. Compute curvature kerbs
  const kerbSegments = detectCurvatureKerbs(sampledPoints);

  // Pre-calculate turning curvature for speed_drs color mode
  const curvatures: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const prev = sampledPoints[(i - 1 + n) % n];
    const curr = sampledPoints[i];
    const next = sampledPoints[(i + 1) % n];
    if (prev && curr && next) {
      const v1x = curr.x - prev.x;
      const v1z = curr.z - prev.z;
      const v2x = next.x - curr.x;
      const v2z = next.z - curr.z;
      const len1 = Math.hypot(v1x, v1z);
      const len2 = Math.hypot(v2x, v2z);
      if (len1 > 1e-5 && len2 > 1e-5) {
        const dot = Math.min(1, Math.max(-1, (v1x * v2x + v1z * v2z) / (len1 * len2)));
        curvatures[i] = Math.acos(dot);
      }
    }
  }

  // 5. Construct Ribbon (Asphalt), Borders, Curtain, Ground Shadow
  const halfW = trackWidth / 2;
  const UP = new THREE.Vector3(0, 1, 0);

  // Vertex buffers for ribbon
  const ribbonPositions = new Float32Array(n * 2 * 3);
  const ribbonNormals = new Float32Array(n * 2 * 3);
  const ribbonColors = new Float32Array(n * 2 * 3);
  const ribbonIndices: number[] = [];

  // Borders
  const leftBorderPositions = new Float32Array(n * 3);
  const rightBorderPositions = new Float32Array(n * 3);

  // Curtain
  const curtainPositions = new Float32Array(n * 2 * 3);
  const curtainNormals = new Float32Array(n * 2 * 3);
  const curtainColors = new Float32Array(n * 2 * 3);
  const curtainIndices: number[] = [];

  // Drop lines (every 12 samples)
  const dropLinesPositions: number[] = [];

  // Ground shadow
  const shadowPositions = new Float32Array(n * 2 * 3);
  const shadowIndices: number[] = [];

  // Colors Palette
  const colorSec1 = new THREE.Color('#E10600'); // Sector 1 Crimson
  const colorSec2 = new THREE.Color('#38BDF8'); // Sector 2 Cyan
  const colorSec3 = new THREE.Color('#EAB308'); // Sector 3 Gold

  const colorElevLow = new THREE.Color('#38BDF8');
  const colorElevMid = new THREE.Color('#F59E0B');
  const colorElevHigh = new THREE.Color('#E10600');

  const colorDrs = new THREE.Color('#22C55E'); // Green (straight/DRS)
  const colorMedium = new THREE.Color('#94A3B8'); // Slate
  const colorBraking = new THREE.Color('#EF4444'); // Red (heavy braking)

  const minY = Math.min(...sampledPoints.map((p) => p.y));
  const maxY = Math.max(...sampledPoints.map((p) => p.y));
  const elevRange = Math.max(0.001, maxY - minY);

  for (let i = 0; i < n; i++) {
    const t = i / n;
    const P = sampledPoints[i]!;
    const tangent = curve.getTangent(t).normalize();

    // Horizontal right normal
    let right = new THREE.Vector3().crossVectors(tangent, UP).normalize();
    if (right.lengthSq() < 1e-4) {
      right = new THREE.Vector3(1, 0, 0);
    }

    const P_left = new THREE.Vector3().copy(P).addScaledVector(right, -halfW);
    const P_right = new THREE.Vector3().copy(P).addScaledVector(right, halfW);

    // Determine vertex color based on colorMode
    let chosenColor = colorSec1;
    if (colorMode === 'sectors') {
      if (t < 0.333) chosenColor = colorSec1;
      else if (t < 0.666) chosenColor = colorSec2;
      else chosenColor = colorSec3;
    } else if (colorMode === 'elevation') {
      const u = Math.max(0, Math.min(1, (P.y - minY) / elevRange));
      if (u < 0.5) {
        chosenColor = new THREE.Color().lerpColors(colorElevLow, colorElevMid, u * 2);
      } else {
        chosenColor = new THREE.Color().lerpColors(colorElevMid, colorElevHigh, (u - 0.5) * 2);
      }
    } else {
      // speed_drs mode
      const k = curvatures[i] ?? 0;
      if (k < 0.025) chosenColor = colorDrs;
      else if (k > 0.075) chosenColor = colorBraking;
      else chosenColor = colorMedium;
    }

    // --- 5a. Ribbon Geometry ---
    const vLeft = i * 2;
    const vRight = i * 2 + 1;

    ribbonPositions[vLeft * 3] = P_left.x;
    ribbonPositions[vLeft * 3 + 1] = P_left.y;
    ribbonPositions[vLeft * 3 + 2] = P_left.z;

    ribbonPositions[vRight * 3] = P_right.x;
    ribbonPositions[vRight * 3 + 1] = P_right.y;
    ribbonPositions[vRight * 3 + 2] = P_right.z;

    // Normals pointing up
    ribbonNormals[vLeft * 3] = 0;
    ribbonNormals[vLeft * 3 + 1] = 1;
    ribbonNormals[vLeft * 3 + 2] = 0;
    ribbonNormals[vRight * 3] = 0;
    ribbonNormals[vRight * 3 + 1] = 1;
    ribbonNormals[vRight * 3 + 2] = 0;

    // Colors
    ribbonColors[vLeft * 3] = chosenColor.r;
    ribbonColors[vLeft * 3 + 1] = chosenColor.g;
    ribbonColors[vLeft * 3 + 2] = chosenColor.b;
    ribbonColors[vRight * 3] = chosenColor.r;
    ribbonColors[vRight * 3 + 1] = chosenColor.g;
    ribbonColors[vRight * 3 + 2] = chosenColor.b;

    // Indices for ribbon quad
    const nextI = (i + 1) % n;
    const nextLeft = nextI * 2;
    const nextRight = nextI * 2 + 1;

    ribbonIndices.push(vLeft, nextLeft, vRight);
    ribbonIndices.push(vRight, nextLeft, nextRight);

    // --- 5b. Borders (raised +0.004) ---
    leftBorderPositions[i * 3] = P_left.x;
    leftBorderPositions[i * 3 + 1] = P_left.y + 0.004;
    leftBorderPositions[i * 3 + 2] = P_left.z;

    rightBorderPositions[i * 3] = P_right.x;
    rightBorderPositions[i * 3 + 1] = P_right.y + 0.004;
    rightBorderPositions[i * 3 + 2] = P_right.z;

    // --- 5c. Ground Shadow (flat at y = 0.01) ---
    shadowPositions[vLeft * 3] = P_left.x;
    shadowPositions[vLeft * 3 + 1] = 0.01;
    shadowPositions[vLeft * 3 + 2] = P_left.z;

    shadowPositions[vRight * 3] = P_right.x;
    shadowPositions[vRight * 3 + 1] = 0.01;
    shadowPositions[vRight * 3 + 2] = P_right.z;

    shadowIndices.push(vLeft, nextLeft, vRight);
    shadowIndices.push(vRight, nextLeft, nextRight);

    // --- 5d. Elevation Curtain (outer edge down to y = 0.01) ---
    // Outer edge along lap
    const cTop = i * 2;
    const cBottom = i * 2 + 1;

    curtainPositions[cTop * 3] = P_left.x;
    curtainPositions[cTop * 3 + 1] = P_left.y;
    curtainPositions[cTop * 3 + 2] = P_left.z;

    curtainPositions[cBottom * 3] = P_left.x;
    curtainPositions[cBottom * 3 + 1] = 0.01;
    curtainPositions[cBottom * 3 + 2] = P_left.z;

    curtainNormals[cTop * 3] = -right.x;
    curtainNormals[cTop * 3 + 1] = 0;
    curtainNormals[cTop * 3 + 2] = -right.z;
    curtainNormals[cBottom * 3] = -right.x;
    curtainNormals[cBottom * 3 + 1] = 0;
    curtainNormals[cBottom * 3 + 2] = -right.z;

    // Fade vertex colors from chosenColor at top to dark slate at bottom
    curtainColors[cTop * 3] = chosenColor.r * 0.9;
    curtainColors[cTop * 3 + 1] = chosenColor.g * 0.9;
    curtainColors[cTop * 3 + 2] = chosenColor.b * 0.9;

    curtainColors[cBottom * 3] = 0.06;
    curtainColors[cBottom * 3 + 1] = 0.08;
    curtainColors[cBottom * 3 + 2] = 0.12;

    const nextCTop = nextI * 2;
    const nextCBottom = nextI * 2 + 1;

    curtainIndices.push(cTop, nextCTop, cBottom);
    curtainIndices.push(cBottom, nextCTop, nextCBottom);

    // --- 5e. Drop Lines every 12 samples ---
    if (i % 12 === 0) {
      dropLinesPositions.push(P.x, P.y, P.z);
      dropLinesPositions.push(P.x, 0.01, P.z);
    }
  }

  // --- 6. Kerb Geometries (Red and White alternating teeth) ---
  const kerbRedPositions: number[] = [];
  const kerbRedIndices: number[] = [];
  const kerbWhitePositions: number[] = [];
  const kerbWhiteIndices: number[] = [];

  const kerbWidth = 0.12;

  for (const seg of kerbSegments) {
    for (let i = seg.startIndex; i <= seg.endIndex; i++) {
      const idx = i % n;
      const nextIdx = (i + 1) % n;

      const P1 = sampledPoints[idx]!;
      const P2 = sampledPoints[nextIdx]!;

      const t1 = idx / n;
      const t2 = nextIdx / n;

      const right1 = new THREE.Vector3().crossVectors(curve.getTangent(t1).normalize(), UP).normalize();
      const right2 = new THREE.Vector3().crossVectors(curve.getTangent(t2).normalize(), UP).normalize();

      // If turning left, inside apex is on the left; if right, inside is on the right
      const sideDir1 = seg.side === 'left' ? -1 : 1;
      const sideDir2 = seg.side === 'left' ? -1 : 1;

      // Track edge
      const E1 = new THREE.Vector3().copy(P1).addScaledVector(right1, sideDir1 * halfW);
      const E2 = new THREE.Vector3().copy(P2).addScaledVector(right2, sideDir2 * halfW);

      // Kerb outer edge (raised +0.008 to avoid z-fighting)
      const K1 = new THREE.Vector3().copy(E1).addScaledVector(right1, sideDir1 * kerbWidth);
      const K2 = new THREE.Vector3().copy(E2).addScaledVector(right2, sideDir2 * kerbWidth);
      E1.y += 0.008;
      E2.y += 0.008;
      K1.y += 0.008;
      K2.y += 0.008;

      // Alternate red and white every 2 steps
      const isRed = Math.floor(i / 2) % 2 === 0;
      const posArr = isRed ? kerbRedPositions : kerbWhitePositions;
      const idxArr = isRed ? kerbRedIndices : kerbWhiteIndices;

      const baseV = posArr.length / 3;
      posArr.push(E1.x, E1.y, E1.z);
      posArr.push(K1.x, K1.y, K1.z);
      posArr.push(E2.x, E2.y, E2.z);
      posArr.push(K2.x, K2.y, K2.z);

      idxArr.push(baseV, baseV + 2, baseV + 1);
      idxArr.push(baseV + 1, baseV + 2, baseV + 3);
    }
  }

  // Build BufferGeometries
  const ribbonGeometry = new THREE.BufferGeometry();
  ribbonGeometry.setAttribute('position', new THREE.BufferAttribute(ribbonPositions, 3));
  ribbonGeometry.setAttribute('normal', new THREE.BufferAttribute(ribbonNormals, 3));
  ribbonGeometry.setAttribute('color', new THREE.BufferAttribute(ribbonColors, 3));
  ribbonGeometry.setIndex(ribbonIndices);

  const leftBorderGeometry = new THREE.BufferGeometry();
  leftBorderGeometry.setAttribute('position', new THREE.BufferAttribute(leftBorderPositions, 3));

  const rightBorderGeometry = new THREE.BufferGeometry();
  rightBorderGeometry.setAttribute('position', new THREE.BufferAttribute(rightBorderPositions, 3));

  const curtainGeometry = new THREE.BufferGeometry();
  curtainGeometry.setAttribute('position', new THREE.BufferAttribute(curtainPositions, 3));
  curtainGeometry.setAttribute('normal', new THREE.BufferAttribute(curtainNormals, 3));
  curtainGeometry.setAttribute('color', new THREE.BufferAttribute(curtainColors, 3));
  curtainGeometry.setIndex(curtainIndices);

  const dropLinesGeometry = new THREE.BufferGeometry();
  dropLinesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dropLinesPositions, 3));

  const groundShadowGeometry = new THREE.BufferGeometry();
  groundShadowGeometry.setAttribute('position', new THREE.BufferAttribute(shadowPositions, 3));
  groundShadowGeometry.setIndex(shadowIndices);

  const kerbRedGeometry = new THREE.BufferGeometry();
  if (kerbRedPositions.length > 0) {
    kerbRedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(kerbRedPositions, 3));
    kerbRedGeometry.setIndex(kerbRedIndices);
  }

  const kerbWhiteGeometry = new THREE.BufferGeometry();
  if (kerbWhitePositions.length > 0) {
    kerbWhiteGeometry.setAttribute('position', new THREE.Float32BufferAttribute(kerbWhitePositions, 3));
    kerbWhiteGeometry.setIndex(kerbWhiteIndices);
  }

  return {
    ribbonGeometry,
    leftBorderGeometry,
    rightBorderGeometry,
    curtainGeometry,
    dropLinesGeometry,
    groundShadowGeometry,
    kerbRedGeometry,
    kerbWhiteGeometry,
    sampledPoints,
    pointAtT,
    tangentAtT,
    kerbSegments,
    maxScaledHeight
  };
}
