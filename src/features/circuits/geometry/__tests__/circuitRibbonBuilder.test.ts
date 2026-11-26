import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  computeScaledElevationY,
  detectCurvatureKerbs,
  buildCircuitGeometries,
  type RibbonColorMode
} from '../circuitRibbonBuilder';

// Realistic closed loop test coordinates (a rectangle with a hairpin and elevation)
const testCoordinates: [number, number, number][] = [
  [-4, 0.0, -4],
  [0, 0.5, -4],
  [4, 1.2, -4],
  [4, 1.8, 0],
  [4, 1.0, 4],
  [1, 0.6, 4],
  [0, 0.2, 4],
  [-2, 0.1, 2],
  [-4, 0.0, 0],
  [-4, 0.0, -4]
];

describe('circuitRibbonBuilder', () => {
  describe('computeScaledElevationY', () => {
    it('returns flat 0.18 when hasRealElevation is false', () => {
      expect(computeScaledElevationY(103, 2500, 4, false)).toBe(0.18);
      expect(computeScaledElevationY(0, 2500, 1, false)).toBe(0.18);
    });

    it('scales elevation proportionally based on relative elevation and exaggeration', () => {
      const y1x = computeScaledElevationY(103, 2500, 1, true);
      const y4x = computeScaledElevationY(103, 2500, 4, true);

      expect(y4x).toBeGreaterThan(y1x);
      // For Spa (103m) at 4x, lifts visibly between 1.5 and 4.5 scene units above y = 0
      expect(y4x).toBeGreaterThanOrEqual(1.5);
      expect(y4x).toBeLessThanOrEqual(4.5);
    });

    it('clamps scaled elevation to safe maximum ceiling (<= 6.0)', () => {
      const yExtreme = computeScaledElevationY(5000, 1000, 10, true);
      expect(yExtreme).toBeLessThanOrEqual(6.0);
    });
  });

  describe('detectCurvatureKerbs', () => {
    it('detects kerbs on sharp hairpin bends', () => {
      // Loop with a sharp hairpin turn at (4, 4) turning back
      const hairpinLoop: THREE.Vector3[] = [];
      const steps = 60;
      for (let i = 0; i < steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        // Oblong shape with tight corner
        const x = Math.cos(theta) * 5;
        const z = Math.sin(theta) * 1.5;
        hairpinLoop.push(new THREE.Vector3(x, 0, z));
      }

      const kerbs = detectCurvatureKerbs(hairpinLoop, 0.03);
      expect(kerbs.length).toBeGreaterThanOrEqual(1);
      expect(kerbs[0]?.side).toMatch(/^(left|right)$/);
      expect(kerbs[0]?.peakCurvature).toBeGreaterThan(0);
    });

    it('returns 0 kerbs on empty or insufficient points', () => {
      expect(detectCurvatureKerbs([])).toEqual([]);
      expect(detectCurvatureKerbs([new THREE.Vector3(0, 0, 0)])).toEqual([]);
    });
  });

  describe('buildCircuitGeometries', () => {
    const modes: RibbonColorMode[] = ['sectors', 'elevation', 'speed_drs'];

    modes.forEach((mode) => {
      it(`produces valid indexed geometries with zero NaN values in mode "${mode}"`, () => {
        const result = buildCircuitGeometries({
          coordinates: testCoordinates,
          elevationDeltaM: 103,
          elevationSource: 'open-meteo-srtm',
          trackSpanMeters: 2500,
          exaggeration: 4,
          colorMode: mode,
          trackWidth: 0.52,
          sampleCount: 120
        });

        // 1. Check ribbon geometry
        const posAttr = result.ribbonGeometry.getAttribute('position');
        const normAttr = result.ribbonGeometry.getAttribute('normal');
        const colAttr = result.ribbonGeometry.getAttribute('color');
        const index = result.ribbonGeometry.getIndex();

        expect(posAttr).toBeDefined();
        expect(normAttr).toBeDefined();
        expect(colAttr).toBeDefined();
        expect(index).toBeDefined();

        expect(posAttr.count).toBeGreaterThan(0);
        expect(index!.count).toBeGreaterThan(0);

        // Verify zero NaN values
        for (let i = 0; i < posAttr.array.length; i++) {
          expect(Number.isNaN(posAttr.array[i])).toBe(false);
        }
        for (let i = 0; i < normAttr.array.length; i++) {
          expect(Number.isNaN(normAttr.array[i])).toBe(false);
        }
        for (let i = 0; i < colAttr.array.length; i++) {
          expect(Number.isNaN(colAttr.array[i])).toBe(false);
        }

        // 2. Check curtain geometry
        const curtainPos = result.curtainGeometry.getAttribute('position');
        expect(curtainPos.count).toBeGreaterThan(0);
        for (let i = 0; i < curtainPos.array.length; i++) {
          expect(Number.isNaN(curtainPos.array[i])).toBe(false);
        }

        // 3. Check ground shadow geometry
        const shadowPos = result.groundShadowGeometry.getAttribute('position');
        expect(shadowPos.count).toBeGreaterThan(0);

        // 4. Check borders
        expect(result.leftBorderGeometry.getAttribute('position').count).toBeGreaterThan(0);
        expect(result.rightBorderGeometry.getAttribute('position').count).toBeGreaterThan(0);
      });
    });

    it('4x exaggeration produces strictly greater maxScaledHeight than 1x for elevated circuit', () => {
      const g1x = buildCircuitGeometries({
        coordinates: testCoordinates,
        elevationDeltaM: 103,
        elevationSource: 'open-meteo-srtm',
        exaggeration: 1,
        colorMode: 'elevation'
      });

      const g4x = buildCircuitGeometries({
        coordinates: testCoordinates,
        elevationDeltaM: 103,
        elevationSource: 'open-meteo-srtm',
        exaggeration: 4,
        colorMode: 'elevation'
      });

      expect(g4x.maxScaledHeight).toBeGreaterThan(g1x.maxScaledHeight);
      expect(g4x.maxScaledHeight).toBeGreaterThanOrEqual(1.5);
    });

    it('keeps elevation flat (0.18) when elevationSource is unavailable', () => {
      const gFlat = buildCircuitGeometries({
        coordinates: testCoordinates,
        elevationDeltaM: null,
        elevationSource: 'unavailable',
        exaggeration: 4,
        colorMode: 'sectors'
      });

      expect(gFlat.maxScaledHeight).toBe(0.18);
    });

    it('provides valid pointAtT and tangentAtT lookups on the loop', () => {
      const result = buildCircuitGeometries({
        coordinates: testCoordinates,
        elevationDeltaM: 50,
        elevationSource: 'open-meteo-srtm',
        exaggeration: 2,
        colorMode: 'sectors'
      });

      const p0 = result.pointAtT(0);
      const pHalf = result.pointAtT(0.5);
      const pWrap = result.pointAtT(1.0);

      expect(Number.isFinite(p0.x)).toBe(true);
      expect(Number.isFinite(p0.y)).toBe(true);
      expect(Number.isFinite(p0.z)).toBe(true);

      expect(Number.isFinite(pHalf.x)).toBe(true);

      // In a closed loop, pointAtT(0) and pointAtT(1) coincide
      expect(p0.distanceTo(pWrap)).toBeLessThan(1e-3);

      const tan0 = result.tangentAtT(0);
      expect(tan0.length()).toBeCloseTo(1.0, 2);
    });
  });
});
