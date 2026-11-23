/**
 * F1 // ARCHIVE — Telemetry Mathematics Engine
 * Pure mathematical functions for:
 * 1. Sector-anchored distance interpolation (Trap 2)
 * 2. Continuous telemetry signal sampling
 * 3. 107% green-flag outlier filtering (Trap 5)
 * 4. Transparent linear fuel-burn pace correction
 * 5. Ordinary Least Squares (OLS) tyre degradation slope
 */

import type { TelemetrySample, StintPaceLap } from '../../types/telemetry';

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
