import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  CIRCUIT_CORNERS_REGISTRY,
  getCuratedCorners,
  buildFallbackApexMarkers
} from '../circuitCorners';
import { CircuitCornersRegistrySchema } from '../circuitCornersSchema';

describe('Circuit Corners Registry (C-30, F-39)', () => {
  it('validates 100% against Zod CircuitCornersRegistrySchema', () => {
    expect(() => CircuitCornersRegistrySchema.parse(CIRCUIT_CORNERS_REGISTRY)).not.toThrow();
  });

  it('contains at least 26 curated circuits', () => {
    const keys = Object.keys(CIRCUIT_CORNERS_REGISTRY);
    expect(keys.length).toBeGreaterThanOrEqual(26);
  });

  it('contains all key iconic marquee circuits', () => {
    const marqueeTracks = [
      'spa-francorchamps',
      'monza',
      'monaco',
      'silverstone',
      'suzuka',
      'interlagos',
      'austin',
      'spielberg',
      'bahrain',
      'jeddah',
      'melbourne',
      'montreal',
      'yas-marina'
    ];

    marqueeTracks.forEach((id) => {
      const corners = getCuratedCorners(id);
      expect(corners.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('asserts 100% of registry keys match real canonical IDs in public/data/index/circuits.json', () => {
    const indexFilePath = path.resolve(process.cwd(), 'public/data/index/circuits.json');
    const indexContent = fs.readFileSync(indexFilePath, 'utf-8');
    const circuits = JSON.parse(indexContent) as Array<{ id: string; name: string }>;
    const validIds = new Set(circuits.map((c) => c.id));

    const registryKeys = Object.keys(CIRCUIT_CORNERS_REGISTRY);

    registryKeys.forEach((key) => {
      expect(validIds.has(key)).toBe(true);
    });
  });

  it('enforces unique corner numbers and strictly normalized t in [0, 1) for every circuit', () => {
    Object.entries(CIRCUIT_CORNERS_REGISTRY).forEach(([circuitId, corners]) => {
      const seenNumbers = new Set<number>();

      corners.forEach((corner) => {
        // Unique numbers
        expect(seenNumbers.has(corner.number)).toBe(false);
        seenNumbers.add(corner.number);

        // Bounded t in [0, 1)
        expect(corner.t).toBeGreaterThanOrEqual(0);
        expect(corner.t).toBeLessThan(1);

        // Valid physical ranges
        expect(corner.speedKmh).toBeGreaterThanOrEqual(40);
        expect(corner.speedKmh).toBeLessThanOrEqual(360);
        expect(corner.gear).toBeGreaterThanOrEqual(1);
        expect(corner.gear).toBeLessThanOrEqual(8);

        if (corner.brakingG != null) {
          expect(corner.brakingG).toBeGreaterThan(0);
          expect(corner.brakingG).toBeLessThanOrEqual(7);
        }
        if (corner.lateralG != null) {
          expect(corner.lateralG).toBeGreaterThan(0);
          expect(corner.lateralG).toBeLessThanOrEqual(7);
        }

        // Clean notes length
        expect(corner.notes.length).toBeGreaterThanOrEqual(10);
      });
    });
  });

  describe('buildFallbackApexMarkers', () => {
    it('generates honest auto-detected markers without fabricating speed or G-forces', () => {
      const sampleCoords: [number, number, number][] = [
        [-5, 0, -5],
        [0, 0, -5],
        [5, 0, -5],
        [5, 0, 0],
        [5, 0, 5],
        [0, 0, 5],
        [-5, 0, 5],
        [-5, 0, 0],
        [-5, 0, -5]
      ];

      const markers = buildFallbackApexMarkers(sampleCoords);
      expect(markers.length).toBeGreaterThan(0);

      markers.forEach((m) => {
        expect(m.isAutoDetected).toBe(true);
        expect(m.speedKmh).toBeUndefined();
        expect(m.gear).toBeUndefined();
        expect(m.brakingG).toBeNull();
        expect(m.lateralG).toBeNull();
        expect(m.brakingDistanceM).toBeNull();
        expect(m.t).toBeGreaterThanOrEqual(0);
        expect(m.t).toBeLessThan(1);
      });
    });
  });
});
