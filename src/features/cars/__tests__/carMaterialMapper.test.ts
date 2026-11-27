import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import {
  CANONICAL_MATERIAL_ZONES,
  getCanonicalMaterialZone,
  getMaterialRole,
  createEraCarMaterials,
  disposeCarMaterials,
} from '../carMaterialMapper';

describe('carMaterialMapper (P7-FIX-03, F-38, F-08)', () => {
  describe('Canonical Zone Resolution', () => {
    it('resolves direct canonical zone names identically', () => {
      for (const zone of CANONICAL_MATERIAL_ZONES) {
        expect(getCanonicalMaterialZone(zone)).toBe(zone);
        expect(getCanonicalMaterialZone(`  ${zone.toUpperCase()}  `)).toBe(zone);
      }
    });

    it('resolves legacy Default_OBJ aliases correctly', () => {
      expect(getCanonicalMaterialZone('Default_OBJ.003')).toBe('body_primary');
      expect(getCanonicalMaterialZone('Default_OBJ.007')).toBe('body_primary');
      expect(getCanonicalMaterialZone('Default_OBJ.008')).toBe('body_primary');
      expect(getCanonicalMaterialZone('Default_OBJ.006')).toBe('body_accent');
      expect(getCanonicalMaterialZone('Default_OBJ.005')).toBe('carbon_exposed');
      expect(getCanonicalMaterialZone('Default_OBJ.009')).toBe('carbon_exposed');
      expect(getCanonicalMaterialZone('Default_OBJ.011')).toBe('tire_sidewall');
      expect(getCanonicalMaterialZone('Default_OBJ.013')).toBe('tire_sidewall');
      expect(getCanonicalMaterialZone('Default_OBJ.004')).toBe('tire_sidewall');
      expect(getCanonicalMaterialZone('Default_OBJ.002')).toBe('halo');
      expect(getCanonicalMaterialZone('Default_OBJ.001')).toBe('brake_disc');
    });

    it('resolves fuzzy substring names and safe fallback', () => {
      expect(getCanonicalMaterialZone('chassis_paint_front')).toBe('body_primary');
      expect(getCanonicalMaterialZone('front_wing_flap')).toBe('front_wing');
      expect(getCanonicalMaterialZone('rear_wing_mainplane')).toBe('rear_wing');
      expect(getCanonicalMaterialZone('titanium_halo_spar')).toBe('halo');
      expect(getCanonicalMaterialZone('wheel_tyre_compound')).toBe('tire_sidewall');
      expect(getCanonicalMaterialZone('brake_caliper_carbon')).toBe('brake_disc');
      expect(getCanonicalMaterialZone('cockpit_steering_wheel')).toBe('cockpit');
      expect(getCanonicalMaterialZone('unmapped_mystery_part')).toBe('carbon_exposed');
      expect(getCanonicalMaterialZone(null)).toBe('carbon_exposed');
      expect(getCanonicalMaterialZone(undefined)).toBe('carbon_exposed');
    });

    it('backward compatibility helper getMaterialRole returns exact same result', () => {
      expect(getMaterialRole('Default_OBJ.003')).toBe('body_primary');
      expect(getMaterialRole('body_accent')).toBe('body_accent');
    });
  });

  describe('createEraCarMaterials & disposeCarMaterials', () => {
    it('creates all 9 canonical PBR materials with clearcoat and correct physical properties', () => {
      const materials = createEraCarMaterials({
        team: 'ferrari',
      });

      // Verify all 9 zones exist
      for (const zone of CANONICAL_MATERIAL_ZONES) {
        expect(materials[zone]).toBeDefined();
        expect(materials[zone]).toBeInstanceOf(THREE.Material);
      }

      // Verify body_primary clearcoat PBR properties
      const bodyPrimary = materials.body_primary as THREE.MeshPhysicalMaterial;
      expect(bodyPrimary.isMeshPhysicalMaterial).toBe(true);
      expect(bodyPrimary.clearcoat).toBeGreaterThanOrEqual(0.8);
      expect(bodyPrimary.clearcoatRoughness).toBeLessThanOrEqual(0.1);
      expect(bodyPrimary.metalness).toBeGreaterThan(0.5);

      // Verify body_accent clearcoat PBR properties
      const bodyAccent = materials.body_accent as THREE.MeshPhysicalMaterial;
      expect(bodyAccent.isMeshPhysicalMaterial).toBe(true);
      expect(bodyAccent.clearcoat).toBeGreaterThanOrEqual(0.7);

      // Verify halo titanium properties
      const halo = materials.halo as THREE.MeshStandardMaterial;
      expect(halo.metalness).toBeGreaterThanOrEqual(0.85);

      // Verify tire sidewall high-roughness rubber properties
      const tire = materials.tire_sidewall as THREE.MeshStandardMaterial;
      expect(tire.roughness).toBeGreaterThanOrEqual(0.8);
      expect(tire.metalness).toBeLessThan(0.1);
    });

    it('attaches livery textures when provided and disposes cleanly', () => {
      const fakeTexture = new THREE.Texture();
      const liveryTextures = {
        liveryMap: fakeTexture as unknown as THREE.CanvasTexture,
        carbonRoughnessMap: fakeTexture as unknown as THREE.CanvasTexture,
        dispose: vi.fn(),
      };

      const materials = createEraCarMaterials({
        team: 'mclaren',
        liveryTextures,
      });

      const bodyPrimary = materials.body_primary as THREE.MeshPhysicalMaterial;
      expect(bodyPrimary.map).toBe(fakeTexture);

      const carbonExposed = materials.carbon_exposed as THREE.MeshStandardMaterial;
      expect(carbonExposed.roughnessMap).toBe(fakeTexture);

      // Test deterministic disposal
      const disposeSpies = Object.values(materials).map((m) => vi.spyOn(m, 'dispose'));
      disposeCarMaterials(materials);

      for (const spy of disposeSpies) {
        expect(spy).toHaveBeenCalled();
      }
    });
  });
});
