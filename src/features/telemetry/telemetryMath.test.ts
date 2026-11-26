import { describe, it, expect } from 'vitest';
import {
  getSectorAnchoredDistanceFraction,
  interpolateTelemetryAtTime,
  filterGreenFlagLaps,
  calculateFuelCorrection,
  calculateTyreDegradationSlope,
  normalizeDistanceSeries,
  resampleTelemetryChannel,
  computeDeltaTimeSeries,
  inferPackProvenance,
  type NormalizedTelemetrySample
} from './telemetryMath';
import type { TelemetrySample, StintPaceLap } from '../../types/telemetry';

describe('Telemetry Mathematics Engine', () => {
  describe('getSectorAnchoredDistanceFraction', () => {
    const s1Time = 25.0;
    const s2Time = 35.0;
    const totalTime = 90.0;
    const boundaries: [number, number, number] = [0.30, 0.70, 1.0];

    it('returns 0 at lap start and 1.0 at or past finish line', () => {
      expect(getSectorAnchoredDistanceFraction(0, s1Time, s2Time, totalTime, boundaries)).toBe(0);
      expect(getSectorAnchoredDistanceFraction(totalTime, s1Time, s2Time, totalTime, boundaries)).toBe(1.0);
      expect(getSectorAnchoredDistanceFraction(totalTime + 5, s1Time, s2Time, totalTime, boundaries)).toBe(1.0);
    });

    it('crosses official sector lines at exact sector timestamps', () => {
      // At t = 25.0s, should be exactly at S1 boundary 0.30
      const dS1 = getSectorAnchoredDistanceFraction(25.0, s1Time, s2Time, totalTime, boundaries);
      expect(dS1).toBeCloseTo(0.30, 4);

      // At t = 60.0s (25 + 35), should be exactly at S2 boundary 0.70
      const dS2 = getSectorAnchoredDistanceFraction(60.0, s1Time, s2Time, totalTime, boundaries);
      expect(dS2).toBeCloseTo(0.70, 4);
    });

    it('smoothly scales within intermediate sector segments', () => {
      // Halfway through S1 (t = 12.5s): should be 0.15
      const dMidS1 = getSectorAnchoredDistanceFraction(12.5, s1Time, s2Time, totalTime, boundaries);
      expect(dMidS1).toBeCloseTo(0.15, 4);

      // Halfway through S2 (t = 25 + 17.5 = 42.5s): should be 0.50
      const dMidS2 = getSectorAnchoredDistanceFraction(42.5, s1Time, s2Time, totalTime, boundaries);
      expect(dMidS2).toBeCloseTo(0.50, 4);
    });
  });

  describe('interpolateTelemetryAtTime', () => {
    const samples: TelemetrySample[] = [
      {
        distanceFraction: 0.0,
        distanceMeters: 0,
        elapsedTime: 0.0,
        speed: 100,
        throttle: 100,
        brake: 0,
        gear: 3,
        rpm: 10000,
        drs: false
      },
      {
        distanceFraction: 0.5,
        distanceMeters: 2500,
        elapsedTime: 40.0,
        speed: 300,
        throttle: 100,
        brake: 0,
        gear: 7,
        rpm: 12000,
        drs: true
      },
      {
        distanceFraction: 1.0,
        distanceMeters: 5000,
        elapsedTime: 80.0,
        speed: 200,
        throttle: 50,
        brake: 40,
        gear: 5,
        rpm: 11000,
        drs: false
      }
    ];

    it('correctly clamps before start and after end', () => {
      expect(interpolateTelemetryAtTime(samples, -5).speed).toBe(100);
      expect(interpolateTelemetryAtTime(samples, 100).speed).toBe(200);
    });

    it('linearly interpolates continuous channels between samples', () => {
      const mid = interpolateTelemetryAtTime(samples, 20.0);
      expect(mid.elapsedTime).toBe(20.0);
      expect(mid.distanceFraction).toBeCloseTo(0.25, 2);
      expect(mid.distanceMeters).toBe(1250);
      expect(mid.speed).toBe(200); // halfway between 100 and 300
    });
  });

  describe('filterGreenFlagLaps', () => {
    const sessionFastest = 80.0;

    const laps: StintPaceLap[] = [
      {
        lapNumber: 1,
        driverCode: 'VER',
        compound: 'MEDIUM',
        tyreAgeLaps: 1,
        rawLapTimeSeconds: 81.2,
        fuelLoadKg: 90,
        fuelCorrectionSeconds: 3.0,
        correctedLapTimeSeconds: 78.2,
        isPitLap: false,
        isSafetyCar: false,
        isOutlier: false
      },
      {
        lapNumber: 2,
        driverCode: 'VER',
        compound: 'MEDIUM',
        tyreAgeLaps: 2,
        rawLapTimeSeconds: 105.0, // Pit in-lap
        fuelLoadKg: 88,
        fuelCorrectionSeconds: 2.9,
        correctedLapTimeSeconds: 102.1,
        isPitLap: true,
        isSafetyCar: false,
        isOutlier: true
      },
      {
        lapNumber: 3,
        driverCode: 'VER',
        compound: 'MEDIUM',
        tyreAgeLaps: 3,
        rawLapTimeSeconds: 120.0, // Safety car lap
        fuelLoadKg: 86,
        fuelCorrectionSeconds: 2.8,
        correctedLapTimeSeconds: 117.2,
        isPitLap: false,
        isSafetyCar: true,
        isOutlier: true
      },
      {
        lapNumber: 4,
        driverCode: 'VER',
        compound: 'MEDIUM',
        tyreAgeLaps: 4,
        rawLapTimeSeconds: 88.0, // > 107% threshold (85.6s)
        fuelLoadKg: 84,
        fuelCorrectionSeconds: 2.7,
        correctedLapTimeSeconds: 85.3,
        isPitLap: false,
        isSafetyCar: false,
        isOutlier: true
      },
      {
        lapNumber: 5,
        driverCode: 'VER',
        compound: 'MEDIUM',
        tyreAgeLaps: 5,
        rawLapTimeSeconds: 81.5,
        fuelLoadKg: 82,
        fuelCorrectionSeconds: 2.6,
        correctedLapTimeSeconds: 78.9,
        isPitLap: false,
        isSafetyCar: false,
        isOutlier: false
      }
    ];

    it('excludes pit laps, safety cars, and laps slower than 107%', () => {
      const clean = filterGreenFlagLaps(laps, sessionFastest);
      expect(clean.length).toBe(2);
      expect(clean.map(l => l.lapNumber)).toEqual([1, 5]);
    });
  });

  describe('calculateFuelCorrection & calculateTyreDegradationSlope', () => {
    it('computes transparent fuel correction proportionally to fuel load', () => {
      const { fuelCorrection, correctedTime } = calculateFuelCorrection(85.0, 10, 50, 1.65, 0.038);
      expect(fuelCorrection).toBeGreaterThan(0);
      expect(correctedTime).toBeLessThan(85.0);
    });

    it('accurately derives positive tyre degradation slope via OLS', () => {
      const testLaps: StintPaceLap[] = [
        { lapNumber: 1, driverCode: 'HAM', compound: 'HARD', tyreAgeLaps: 1, rawLapTimeSeconds: 80.0, fuelLoadKg: 50, fuelCorrectionSeconds: 1.5, correctedLapTimeSeconds: 80.0, isPitLap: false, isSafetyCar: false, isOutlier: false },
        { lapNumber: 2, driverCode: 'HAM', compound: 'HARD', tyreAgeLaps: 2, rawLapTimeSeconds: 80.1, fuelLoadKg: 48, fuelCorrectionSeconds: 1.4, correctedLapTimeSeconds: 80.1, isPitLap: false, isSafetyCar: false, isOutlier: false },
        { lapNumber: 3, driverCode: 'HAM', compound: 'HARD', tyreAgeLaps: 3, rawLapTimeSeconds: 80.2, fuelLoadKg: 46, fuelCorrectionSeconds: 1.3, correctedLapTimeSeconds: 80.2, isPitLap: false, isSafetyCar: false, isOutlier: false },
        { lapNumber: 4, driverCode: 'HAM', compound: 'HARD', tyreAgeLaps: 4, rawLapTimeSeconds: 80.3, fuelLoadKg: 44, fuelCorrectionSeconds: 1.2, correctedLapTimeSeconds: 80.3, isPitLap: false, isSafetyCar: false, isOutlier: false }
      ];

      const slope = calculateTyreDegradationSlope(testLaps);
      expect(slope).toBeCloseTo(0.1, 3);
    });
  });

  describe('Distance Normalization, Resampling & Deltas', () => {
    it('normalizes distance series monotonically between 0 and 1', () => {
      const norm = normalizeDistanceSeries([0, 1500, 3000, 6000]);
      expect(norm[0]).toBe(0);
      expect(norm[norm.length - 1]).toBe(1);
      expect(norm[1]).toBeCloseTo(0.25, 2);
      expect(norm[2]).toBeCloseTo(0.50, 2);
    });

    it('resamples channels to uniform sample count and clamps physical bounds', () => {
      const raw: NormalizedTelemetrySample[] = [
        { distNorm: 0, timeSec: 0, speedKmh: 420, throttlePct: 150, brakePct: -10, gear: 9 },
        { distNorm: 1, timeSec: 90, speedKmh: -20, throttlePct: -5, brakePct: 120, gear: -1 }
      ];
      const resampled = resampleTelemetryChannel(raw, 10);
      expect(resampled.length).toBe(10);
      expect(resampled[0].speedKmh).toBe(390); // clamped to 390
      expect(resampled[0].throttlePct).toBe(100);
      expect(resampled[0].brakePct).toBe(0);
      expect(resampled[0].gear).toBe(8);
      expect(resampled[9].speedKmh).toBe(0);
      expect(resampled[9].gear).toBe(0);
    });

    it('computes delta time series where negative means Driver A is ahead', () => {
      const a: NormalizedTelemetrySample[] = [
        { distNorm: 0, timeSec: 0, speedKmh: 200, throttlePct: 100, brakePct: 0, gear: 5 },
        { distNorm: 1, timeSec: 75.2, speedKmh: 300, throttlePct: 100, brakePct: 0, gear: 8 }
      ];
      const b: NormalizedTelemetrySample[] = [
        { distNorm: 0, timeSec: 0, speedKmh: 200, throttlePct: 100, brakePct: 0, gear: 5 },
        { distNorm: 1, timeSec: 75.8, speedKmh: 300, throttlePct: 100, brakePct: 0, gear: 8 }
      ];
      const delta = computeDeltaTimeSeries(a, b);
      expect(delta).toEqual([0, -0.6]);
    });

    it('infers pack provenance accurately', () => {
      expect(inferPackProvenance('madrid-2026-sim-alo-vs-sai')).toBe('experimental_simulation');
      expect(inferPackProvenance('silverstone-2024-ham-vs-ver')).toBe('historical_verified');
      expect(inferPackProvenance('live-openf1-spa')).toBe('live_openf1');
    });
  });
});
