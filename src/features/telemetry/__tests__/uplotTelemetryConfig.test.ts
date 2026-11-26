import { describe, it, expect } from 'vitest';
import {
  buildAlignedTelemetryData,
  buildSpeedChartOptions,
  buildDeltaChartOptions,
  buildPedalChartOptions,
  buildGearChartOptions,
  type AnyTelemetryPack,
} from '../uplotTelemetryConfig';

describe('uplotTelemetryConfig', () => {
  const mockPack: AnyTelemetryPack = {
    slug: 'spa-2024-ver-vs-nor',
    title: 'Spa 2024: Verstappen vs Norris',
    subtitle: 'Q3 Pole Shootout',
    year: 2024,
    session: 'Q3',
    circuitId: 'spa-francorchamps',
    circuitName: 'Circuit de Spa-Francorchamps',
    lapDistanceMeters: 7004,
    provenance: 'historical_verified',
    sectorBoundaries: [0.33, 0.66, 1.0],
    driverA: {
      driverId: 'max_verstappen',
      driverCode: 'VER',
      driverName: 'Max Verstappen',
      teamId: 'red_bull',
      teamName: 'Red Bull Racing',
      teamColor: '#3671C6',
      secondaryColor: '#FFD700',
      lapTime: '1:43.665',
      lapTimeSeconds: 103.665,
      sector1Time: 30.1,
      sector2Time: 43.2,
      sector3Time: 30.365,
      topSpeed: 334,
      avgSpeed: 243.2,
      samples: [
        { distanceFraction: 0.0, distanceMeters: 0, elapsedTime: 0.0, speed: 280, throttle: 100, brake: 0, gear: 7 },
        { distanceFraction: 0.05, distanceMeters: 350, elapsedTime: 4.5, speed: 70, throttle: 10, brake: 100, gear: 2 },
        { distanceFraction: 0.2, distanceMeters: 1400, elapsedTime: 18.2, speed: 310, throttle: 100, brake: 0, gear: 8 },
        { distanceFraction: 0.5, distanceMeters: 3500, elapsedTime: 52.0, speed: 120, throttle: 20, brake: 80, gear: 3 },
        { distanceFraction: 1.0, distanceMeters: 7004, elapsedTime: 103.665, speed: 295, throttle: 100, brake: 0, gear: 7 },
      ],
    },
    driverB: {
      driverId: 'lando_norris',
      driverCode: 'NOR',
      driverName: 'Lando Norris',
      teamId: 'mclaren',
      teamName: 'McLaren',
      teamColor: '#FF8000',
      secondaryColor: '#47C7FC',
      lapTime: '1:44.250',
      lapTimeSeconds: 104.25,
      sector1Time: 30.3,
      sector2Time: 43.4,
      sector3Time: 30.55,
      topSpeed: 332,
      avgSpeed: 241.8,
      samples: [
        { distanceFraction: 0.0, distanceMeters: 0, elapsedTime: 0.0, speed: 278, throttle: 100, brake: 0, gear: 7 },
        { distanceFraction: 0.05, distanceMeters: 350, elapsedTime: 4.6, speed: 72, throttle: 15, brake: 95, gear: 2 },
        { distanceFraction: 0.2, distanceMeters: 1400, elapsedTime: 18.5, speed: 308, throttle: 100, brake: 0, gear: 8 },
        { distanceFraction: 0.5, distanceMeters: 3500, elapsedTime: 52.4, speed: 118, throttle: 25, brake: 75, gear: 3 },
        { distanceFraction: 1.0, distanceMeters: 7004, elapsedTime: 104.25, speed: 292, throttle: 100, brake: 0, gear: 7 },
      ],
    },
  };

  describe('buildAlignedTelemetryData', () => {
    it('produces equal-length columnar arrays for all telemetry channels', () => {
      const data = buildAlignedTelemetryData(mockPack);

      const expectedLength = 5;
      expect(data.distNorm.length).toBe(expectedLength);
      expect(data.speedA.length).toBe(expectedLength);
      expect(data.speedB.length).toBe(expectedLength);
      expect(data.deltaSec.length).toBe(expectedLength);
      expect(data.throttleA.length).toBe(expectedLength);
      expect(data.brakeA.length).toBe(expectedLength);
      expect(data.throttleB.length).toBe(expectedLength);
      expect(data.brakeB.length).toBe(expectedLength);
      expect(data.gearA.length).toBe(expectedLength);
      expect(data.gearB.length).toBe(expectedLength);
    });

    it('guarantees strictly monotonic ascending distNorm values without duplicates', () => {
      const data = buildAlignedTelemetryData(mockPack);
      for (let i = 1; i < data.distNorm.length; i++) {
        expect(data.distNorm[i]).toBeGreaterThan(data.distNorm[i - 1]);
      }
    });

    it('contains zero NaN or Infinity values', () => {
      const data = buildAlignedTelemetryData(mockPack);
      const allArrays = Object.values(data);
      for (const arr of allArrays) {
        for (const val of arr) {
          expect(Number.isFinite(val)).toBe(true);
          expect(Number.isNaN(val)).toBe(false);
        }
      }
    });

    it('follows delta sign convention: negative when Driver A is ahead (faster)', () => {
      const data = buildAlignedTelemetryData(mockPack);
      // At index 1: Driver A elapsed 4.5s, Driver B elapsed 4.6s -> A is faster, delta is -0.1s
      expect(data.deltaSec[1]).toBe(-0.1);
      // At index 4 (finish): Driver A 103.665s, Driver B 104.250s -> delta -0.585s
      expect(data.deltaSec[4]).toBeCloseTo(-0.585, 3);
    });
  });

  describe('Chart Options and Sync Key', () => {
    it('wires cursor sync key to f1-telemetry across all 4 channels', () => {
      const speed = buildSpeedChartOptions(mockPack);
      const delta = buildDeltaChartOptions(mockPack);
      const pedal = buildPedalChartOptions(mockPack);
      const gear = buildGearChartOptions(mockPack);

      expect(speed.cursor?.sync?.key).toBe('f1-telemetry');
      expect(delta.cursor?.sync?.key).toBe('f1-telemetry');
      expect(pedal.cursor?.sync?.key).toBe('f1-telemetry');
      expect(gear.cursor?.sync?.key).toBe('f1-telemetry');
    });

    it('configures draw hooks on speed and delta charts', () => {
      const speed = buildSpeedChartOptions(mockPack);
      const delta = buildDeltaChartOptions(mockPack);

      expect(speed.hooks?.draw).toBeDefined();
      expect(speed.hooks!.draw!.length).toBeGreaterThan(0);

      expect(delta.hooks?.draw).toBeDefined();
      expect(delta.hooks!.draw!.length).toBeGreaterThan(0);
    });
  });
});
