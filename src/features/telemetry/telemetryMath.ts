/**
 * F1 // ARCHIVE — Telemetry Mathematics Engine
 * Pure mathematical functions for:
 * 1. Sector-anchored distance interpolation (Trap 2)
 * 2. Continuous telemetry signal sampling
 * 3. 107% green-flag outlier filtering (Trap 5)
 * 4. Transparent linear fuel-burn pace correction
 * 5. Ordinary Least Squares (OLS) tyre degradation slope
 * 6. Distance normalization & uniform resampling
 * 7. Multi-driver time delta series computation
 * 8. Telemetry pack provenance inference
 */

import type { TelemetrySample, StintPaceLap } from '../../types/telemetry';

export interface NormalizedTelemetrySample {
  distNorm: number; // strictly monotonic [0, 1]
  timeSec: number;
  speedKmh: number; // clamped [0, 390]
  throttlePct: number; // clamped [0, 100]
  brakePct: number; // clamped [0, 100]
  gear: number; // integer clamped [0, 8]
  drs?: boolean;
}

export type TelemetryPackProvenance =
  | 'historical_verified'
  | 'live_openf1'
  | 'experimental_simulation';

/**
 * Maps elapsed lap time to track distance fraction anchored to official S1 / S2 / S3 sector lines.
 * Guarantees that at the real sector timestamps, the ghost car is exactly on the sector line.
 */
export function getSectorAnchoredDistanceFraction(
  elapsedTime: number,
  s1Time: number,
  s2Time: number,
  totalLapTime: number,
  sectorBoundaries: [number, number, number]
): number {
  if (elapsedTime <= 0) return 0;
  if (elapsedTime >= totalLapTime) return 1.0;

  const [s1Dist, s2Dist, s3Dist] = sectorBoundaries;
  const s3Time = Math.max(0.001, totalLapTime - s1Time - s2Time);

  // Sector 1: [0, s1Time] -> [0, s1Dist]
  if (elapsedTime <= s1Time) {
    const alpha = s1Time > 0 ? elapsedTime / s1Time : 0;
    return Math.max(0, Math.min(s1Dist, alpha * s1Dist));
  }

  // Sector 2: (s1Time, s1Time + s2Time] -> [s1Dist, s2Dist]
  const s2End = s1Time + s2Time;
  if (elapsedTime <= s2End) {
    const alpha = s2Time > 0 ? (elapsedTime - s1Time) / s2Time : 0;
    return Math.max(s1Dist, Math.min(s2Dist, s1Dist + alpha * (s2Dist - s1Dist)));
  }

  // Sector 3: (s2End, totalLapTime] -> [s2Dist, s3Dist]
  const alpha = s3Time > 0 ? (elapsedTime - s2End) / s3Time : 0;
  return Math.max(s2Dist, Math.min(s3Dist, s2Dist + alpha * (s3Dist - s2Dist)));
}

/**
 * Interpolates telemetry channels (speed, throttle, brake, distance) at a specific playback time.
 */
export function interpolateTelemetryAtTime(
  samples: TelemetrySample[],
  targetTime: number
): TelemetrySample {
  if (!samples.length) {
    return {
      distanceFraction: 0,
      distanceMeters: 0,
      elapsedTime: 0,
      speed: 0,
      throttle: 0,
      brake: 0,
      gear: 1,
      rpm: 0,
      drs: false
    };
  }

  if (targetTime <= samples[0].elapsedTime) {
    return samples[0];
  }

  const last = samples[samples.length - 1];
  if (targetTime >= last.elapsedTime) {
    return last;
  }

  // Binary search for surrounding bracket [i, i+1]
  let low = 0;
  let high = samples.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (samples[mid].elapsedTime <= targetTime) {
      if (mid === samples.length - 1 || samples[mid + 1].elapsedTime > targetTime) {
        const s0 = samples[mid];
        const s1 = samples[mid + 1];
        const span = s1.elapsedTime - s0.elapsedTime;
        const ratio = span > 0 ? (targetTime - s0.elapsedTime) / span : 0;

        return {
          distanceFraction: s0.distanceFraction + ratio * (s1.distanceFraction - s0.distanceFraction),
          distanceMeters: Math.round(s0.distanceMeters + ratio * (s1.distanceMeters - s0.distanceMeters)),
          elapsedTime: targetTime,
          speed: Math.round(s0.speed + ratio * (s1.speed - s0.speed)),
          throttle: Math.round(s0.throttle + ratio * (s1.throttle - s0.throttle)),
          brake: Math.round(s0.brake + ratio * (s1.brake - s0.brake)),
          gear: ratio > 0.5 ? s1.gear : s0.gear,
          rpm: Math.round((s0.rpm || 0) + ratio * ((s1.rpm || 0) - (s0.rpm || 0))),
          drs: ratio > 0.5 ? Boolean(s1.drs) : Boolean(s0.drs)
        };
      }
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return samples[0];
}

/**
 * Filters green-flag racing laps by strictly excluding pit in/out laps,
 * safety-car / VSC periods, and laps slower than 107% of session fastest.
 */
export function filterGreenFlagLaps(
  laps: StintPaceLap[],
  sessionFastestLap: number
): StintPaceLap[] {
  const threshold107 = sessionFastestLap * 1.07;
  return laps.filter(
    lap => !lap.isPitLap && !lap.isSafetyCar && lap.rawLapTimeSeconds <= threshold107
  );
}

/**
 * Transparent linear fuel-burn pace correction model.
 * Early laps (heavy fuel load) are corrected relative to late empty-tank laps.
 */
export function calculateFuelCorrection(
  rawLapTime: number,
  lapNumber: number,
  totalLaps: number,
  fuelBurnPerLapKg = 1.65,
  fuelEffectPerKgSec = 0.038
): { fuelCorrection: number; correctedTime: number } {
  const startFuel = totalLaps * fuelBurnPerLapKg;
  const currentFuel = Math.max(5, startFuel - (lapNumber * fuelBurnPerLapKg));

  // The lap is penalised by remaining fuel relative to empty tank;
  // to normalize to empty-tank pace:
  const fuelCorrection = Number((currentFuel * fuelEffectPerKgSec).toFixed(3));
  const correctedTime = Number((rawLapTime - fuelCorrection).toFixed(3));

  return {
    fuelCorrection,
    correctedTime
  };
}

/**
 * Ordinary Least Squares (OLS) regression slope measuring tyre degradation rate (seconds per lap).
 * Positive slope = performance dropping / tyres degrading.
 */
export function calculateTyreDegradationSlope(cleanLaps: StintPaceLap[]): number {
  if (cleanLaps.length < 2) return 0;

  const n = cleanLaps.length;
  const x = cleanLaps.map(l => l.tyreAgeLaps);
  const y = cleanLaps.map(l => l.correctedLapTimeSeconds);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denominator += dx * dx;
  }

  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(4));
}

/**
 * Normalizes an arbitrary sequence of track distance values to strictly monotonic [0, 1].
 */
export function normalizeDistanceSeries(distances: number[]): number[] {
  if (!distances || distances.length === 0) return [];
  if (distances.length === 1) return [0];

  const min = distances[0];
  const max = distances[distances.length - 1];
  const span = max - min;

  if (span <= 0) {
    return distances.map(() => 0);
  }

  let prev = 0;
  return distances.map((d, idx) => {
    if (idx === 0) return 0;
    if (idx === distances.length - 1) return 1;
    const val = (d - min) / span;
    const clamped = Math.max(prev, Math.min(1, Math.max(0, Number(val.toFixed(6)))));
    prev = clamped;
    return clamped;
  });
}

/**
 * Resamples telemetry samples onto a uniform normalized distance grid [0, 1].
 */
export function resampleTelemetryChannel(
  samples: NormalizedTelemetrySample[],
  targetCount: number
): NormalizedTelemetrySample[] {
  if (!samples || samples.length === 0 || targetCount <= 0) return [];

  const clampSample = (s: NormalizedTelemetrySample, distNorm: number): NormalizedTelemetrySample => ({
    distNorm: Number(distNorm.toFixed(6)),
    timeSec: Number(s.timeSec.toFixed(3)),
    speedKmh: Math.max(0, Math.min(390, Math.round(s.speedKmh))),
    throttlePct: Math.max(0, Math.min(100, Math.round(s.throttlePct))),
    brakePct: Math.max(0, Math.min(100, Math.round(s.brakePct))),
    gear: Math.max(0, Math.min(8, Math.round(s.gear))),
    drs: Boolean(s.drs)
  });

  if (targetCount === 1 || samples.length === 1) {
    const base = samples[0];
    return Array.from({ length: targetCount }, (_, i) =>
      clampSample(base, targetCount === 1 ? 0 : i / (targetCount - 1))
    );
  }

  const result: NormalizedTelemetrySample[] = [];
  let sampleIdx = 0;

  for (let i = 0; i < targetCount; i++) {
    const targetDist = i / (targetCount - 1);

    while (sampleIdx < samples.length - 2 && samples[sampleIdx + 1].distNorm <= targetDist) {
      sampleIdx++;
    }

    const s0 = samples[sampleIdx];
    const s1 = samples[sampleIdx + 1] || s0;
    const span = s1.distNorm - s0.distNorm;
    const ratio = span > 0 ? Math.max(0, Math.min(1, (targetDist - s0.distNorm) / span)) : 0;

    const timeSec = s0.timeSec + ratio * (s1.timeSec - s0.timeSec);
    const speed = s0.speedKmh + ratio * (s1.speedKmh - s0.speedKmh);
    const throttle = s0.throttlePct + ratio * (s1.throttlePct - s0.throttlePct);
    const brake = s0.brakePct + ratio * (s1.brakePct - s0.brakePct);
    const gear = ratio > 0.5 ? s1.gear : s0.gear;
    const drs = ratio > 0.5 ? Boolean(s1.drs) : Boolean(s0.drs);

    result.push({
      distNorm: Number(targetDist.toFixed(6)),
      timeSec: Number(timeSec.toFixed(3)),
      speedKmh: Math.max(0, Math.min(390, Math.round(speed))),
      throttlePct: Math.max(0, Math.min(100, Math.round(throttle))),
      brakePct: Math.max(0, Math.min(100, Math.round(brake))),
      gear: Math.max(0, Math.min(8, Math.round(gear))),
      drs
    });
  }

  return result;
}

/**
 * Computes time delta series (Driver A elapsed time - Driver B elapsed time).
 * Signed convention: negative delta = Driver A is faster / ahead in lap time.
 */
export function computeDeltaTimeSeries(
  driverA: NormalizedTelemetrySample[],
  driverB: NormalizedTelemetrySample[]
): number[] {
  if (!driverA || !driverB || driverA.length === 0 || driverB.length === 0) return [];
  const len = Math.min(driverA.length, driverB.length);
  const deltas: number[] = new Array(len);

  for (let i = 0; i < len; i++) {
    const timeA = driverA[i].timeSec;
    const timeB = driverB[i].timeSec;
    deltas[i] = Number((timeA - timeB).toFixed(3));
  }

  return deltas;
}

/**
 * Categorizes telemetry pack provenance based on slug or explicit metadata.
 * Flags any slug containing 'sim' or '2026' as 'experimental_simulation'.
 */
export function inferPackProvenance(
  slug: string,
  explicit?: string
): TelemetryPackProvenance {
  if (
    explicit === 'historical_verified' ||
    explicit === 'live_openf1' ||
    explicit === 'experimental_simulation'
  ) {
    return explicit;
  }
  const s = (slug || '').toLowerCase();
  if (s.includes('sim') || s.includes('2026')) {
    return 'experimental_simulation';
  }
  if (s.includes('live') || s.includes('openf1')) {
    return 'live_openf1';
  }
  return 'historical_verified';
}
