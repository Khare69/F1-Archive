import { describe, it, expect } from 'vitest';
import {
  CAR_HOTSPOTS,
  CarHotspotSchema,
  getHotspotsForEra,
} from '../carHotspots';

describe('carHotspots Registry', () => {
  it('validates 100% of registry entries against CarHotspotSchema', () => {
    expect(CAR_HOTSPOTS.length).toBeGreaterThanOrEqual(8);

    for (const hotspot of CAR_HOTSPOTS) {
      const parsed = CarHotspotSchema.safeParse(hotspot);
      expect(parsed.success, `Hotspot ${hotspot.id} must be valid Zod schema`).toBe(true);

      // Verify coordinate tuple integrity
      expect(hotspot.position.length).toBe(3);
      expect(hotspot.cameraTarget.position.length).toBe(3);
      expect(hotspot.cameraTarget.target.length).toBe(3);

      for (const val of hotspot.position) {
        expect(Number.isFinite(val)).toBe(true);
      }
      for (const val of hotspot.cameraTarget.position) {
        expect(Number.isFinite(val)).toBe(true);
      }
      for (const val of hotspot.cameraTarget.target) {
        expect(Number.isFinite(val)).toBe(true);
      }
    }
  });

  describe('Era-Specific Filtering (getHotspotsForEra)', () => {
    it('1950s front-engine car has zero wing and zero halo hotspots', () => {
      const hotspots = getHotspotsForEra('1950s_front_engine');
      const ids = hotspots.map((h) => h.id);

      expect(ids).not.toContain('halo_safety_cell');
      expect(ids).not.toContain('front_wing');
      expect(ids).not.toContain('rear_wing_drs');
      expect(ids).not.toContain('underfloor_venturi');

      // But has powertrain, cockpit, tyres
      expect(ids).toContain('power_unit');
      expect(ids).toContain('cockpit_cell');
      expect(ids).toContain('tyres_brakes');
    });

    it('1988 turbo era has front and rear wings but no halo', () => {
      const hotspots = getHotspotsForEra('1988_turbo');
      const ids = hotspots.map((h) => h.id);

      expect(ids).toContain('front_wing');
      expect(ids).toContain('rear_wing_drs');
      expect(ids).toContain('power_unit');
      expect(ids).not.toContain('halo_safety_cell');
      expect(ids).not.toContain('underfloor_venturi');
    });

    it('2024 ground effect era has Halo, Venturi underfloor, and wings', () => {
      const hotspots = getHotspotsForEra('2024_ground_effect');
      const ids = hotspots.map((h) => h.id);

      expect(ids).toContain('halo_safety_cell');
      expect(ids).toContain('underfloor_venturi');
      expect(ids).toContain('front_wing');
      expect(ids).toContain('rear_wing_drs');
      expect(ids).toContain('power_unit');
    });

    it('2026 active aero era includes active wings, halo, and powertrain', () => {
      const hotspots = getHotspotsForEra('2026_active_aero');
      const ids = hotspots.map((h) => h.id);

      expect(ids).toContain('front_wing');
      expect(ids).toContain('rear_wing_drs');
      expect(ids).toContain('halo_safety_cell');
      expect(ids).toContain('underfloor_venturi');
    });
  });
});
