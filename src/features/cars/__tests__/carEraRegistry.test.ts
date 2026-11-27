import { describe, it, expect } from 'vitest';
import {
  CAR_ERA_SPECS,
  DEFAULT_CAR_ERA,
  getCarEraSpec,
  type CarEraId,
} from '../carEraRegistry';

describe('carEraRegistry', () => {
  it('defines exactly 5 distinct F1 technical eras', () => {
    expect(CAR_ERA_SPECS).toHaveLength(5);
    const ids = CAR_ERA_SPECS.map((s) => s.id);
    expect(ids).toEqual([
      '1950s_front_engine',
      '1988_turbo',
      '2004_v10',
      '2024_ground_effect',
      '2026_active_aero',
    ]);
  });

  it('preserves historical accuracy invariants across eras', () => {
    const era1950s = getCarEraSpec('1950s_front_engine');
    expect(era1950s.specs.minWeightKg).toBeNull(); // FIA min weight rules began in 1961
    expect(era1950s.hasHalo).toBe(false);
    expect(era1950s.hasWings).toBe(false);
    expect(era1950s.hasDrsOrActiveAero).toBe(false);
    expect(era1950s.isExperimental).toBe(false);

    const era1988 = getCarEraSpec('1988_turbo');
    expect(era1988.specs.minWeightKg).toBe(500);
    expect(era1988.hasHalo).toBe(false);
    expect(era1988.hasWings).toBe(true);
    expect(era1988.hasDrsOrActiveAero).toBe(false);
    expect(era1988.isExperimental).toBe(false);

    const era2004 = getCarEraSpec('2004_v10');
    expect(era2004.specs.minWeightKg).toBe(605);
    expect(era2004.hasHalo).toBe(false);
    expect(era2004.hasWings).toBe(true);
    expect(era2004.hasDrsOrActiveAero).toBe(false);
    expect(era2004.isExperimental).toBe(false);

    const era2024 = getCarEraSpec('2024_ground_effect');
    expect(era2024.specs.minWeightKg).toBe(798);
    expect(era2024.hasHalo).toBe(true);
    expect(era2024.hasWings).toBe(true);
    expect(era2024.hasDrsOrActiveAero).toBe(true);
    expect(era2024.isExperimental).toBe(false);

    const era2026 = getCarEraSpec('2026_active_aero');
    expect(era2026.specs.minWeightKg).toBe(768);
    expect(era2026.hasHalo).toBe(true);
    expect(era2026.hasWings).toBe(true);
    expect(era2026.hasDrsOrActiveAero).toBe(true);
    expect(era2026.isExperimental).toBe(true);
  });

  it('guarantees required material zone names exist for each era', () => {
    for (const era of CAR_ERA_SPECS) {
      expect(era.requiredMaterialZones.length).toBeGreaterThanOrEqual(6);
      expect(era.requiredMaterialZones).toContain('body_primary');
      expect(era.requiredMaterialZones).toContain('body_accent');
      expect(era.requiredMaterialZones).toContain('carbon_exposed');
      expect(era.requiredMaterialZones).toContain('tire_sidewall');
      expect(era.requiredMaterialZones).toContain('brake_disc');
      expect(era.requiredMaterialZones).toContain('cockpit');

      if (era.hasWings) {
        expect(era.requiredMaterialZones).toContain('front_wing');
        expect(era.requiredMaterialZones).toContain('rear_wing');
      } else {
        expect(era.requiredMaterialZones).not.toContain('front_wing');
      }

      if (era.hasHalo) {
        expect(era.requiredMaterialZones).toContain('halo');
      } else {
        expect(era.requiredMaterialZones).not.toContain('halo');
      }
    }
  });

  it('falls back to DEFAULT_CAR_ERA on missing, null, or unknown eraId', () => {
    expect(DEFAULT_CAR_ERA).toBe('2024_ground_effect');
    expect(getCarEraSpec(null).id).toBe('2024_ground_effect');
    expect(getCarEraSpec(undefined).id).toBe('2024_ground_effect');
    expect(getCarEraSpec('non_existent_era' as CarEraId).id).toBe('2024_ground_effect');
  });
});
