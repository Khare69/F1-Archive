import * as THREE from 'three';
import type { Team } from '../../types/f1';
import type { CarEraSpec } from './carEraRegistry';
import type { GeneratedLiveryTextures, TeamLike } from './carLiveryGenerator';
import {
  resolveCanonicalTeamId,
  CONSTRUCTOR_EMBLEMS,
  type ConstructorEmblemConfig,
} from '../../components/FallbackImage/constructorEmblems';

export type CanonicalMaterialZone =
  | 'body_primary'
  | 'body_accent'
  | 'carbon_exposed'
  | 'front_wing'
  | 'rear_wing'
  | 'halo'
  | 'tire_sidewall'
  | 'brake_disc'
  | 'cockpit';

export const CANONICAL_MATERIAL_ZONES: readonly CanonicalMaterialZone[] = [
  'body_primary',
  'body_accent',
  'carbon_exposed',
  'front_wing',
  'rear_wing',
  'halo',
  'tire_sidewall',
  'brake_disc',
  'cockpit',
] as const;

// Fallback legacy OBJ/GLB mesh material map for backwards compatibility
export const LEGACY_OBJ_MATERIAL_MAP: Record<string, CanonicalMaterialZone> = {
  // Main Monocoque Body & Engine Cover
  'Default_OBJ.003': 'body_primary',
  'Default_OBJ.007': 'body_primary',
  'Default_OBJ.008': 'body_primary',

  // Rear Wing & Endplates
  'Default_OBJ.006': 'body_accent',

  // Front Wing Multi-Tier Airfoils & Floor Diffuser
  'Default_OBJ.005': 'carbon_exposed',
  'Default_OBJ.009': 'carbon_exposed',

  // Wheels & Tyres
  'Default_OBJ.011': 'tire_sidewall',
  'Default_OBJ.013': 'tire_sidewall',
  'Default_OBJ.004': 'tire_sidewall',

  // Titanium Halo Safety Cell
  'Default_OBJ.002': 'halo',

  // Brake Discs & Mechanicals
  'Default_OBJ.001': 'brake_disc',
};

/**
 * Resolves a mesh material name to a canonical Blender material zone.
 * Matches canonical zone names directly, then checks legacy Default_OBJ aliases,
 * then falls back to fuzzy substring matching, and finally defaults to carbon_exposed.
 */
export function getCanonicalMaterialZone(matName?: string | null): CanonicalMaterialZone {
  if (!matName) return 'carbon_exposed';

  const normalized = matName.trim().toLowerCase();

  // 1. Direct canonical name check
  if (CANONICAL_MATERIAL_ZONES.includes(normalized as CanonicalMaterialZone)) {
    return normalized as CanonicalMaterialZone;
  }

  // 2. Exact match in legacy map
  if (LEGACY_OBJ_MATERIAL_MAP[matName]) {
    return LEGACY_OBJ_MATERIAL_MAP[matName];
  }

  // 3. Substring / fuzzy heuristic (order matters: cockpit before wheel)
  if (normalized.includes('cockpit') || normalized.includes('interior') || normalized.includes('steering')) {
    return 'cockpit';
  }
  if (normalized.includes('body_primary') || normalized.includes('paint') || normalized.includes('chassis')) {
    return 'body_primary';
  }
  if (normalized.includes('body_accent') || normalized.includes('accent')) {
    return 'body_accent';
  }
  if (normalized.includes('front_wing') || normalized.includes('wing_front')) {
    return 'front_wing';
  }
  if (normalized.includes('rear_wing') || normalized.includes('wing_rear')) {
    return 'rear_wing';
  }
  if (normalized.includes('halo')) {
    return 'halo';
  }
  if (normalized.includes('tire') || normalized.includes('wheel') || normalized.includes('tyre')) {
    return 'tire_sidewall';
  }
  if (normalized.includes('brake') || normalized.includes('disc') || normalized.includes('caliper')) {
    return 'brake_disc';
  }
  if (normalized.includes('carbon')) {
    return 'carbon_exposed';
  }

  return 'carbon_exposed';
}

/**
 * Backward compatibility alias for getCanonicalMaterialZone
 */
export function getMaterialRole(matName?: string): CanonicalMaterialZone {
  return getCanonicalMaterialZone(matName);
}

function resolveColors(team: TeamLike): { primary: string; secondary: string; accent: string } {
  const id = typeof team === 'string' ? team : team.id;
  const canonicalId = resolveCanonicalTeamId(id) ?? id.toLowerCase().replace(/[^a-z0-9]/g, '');
  const emblem: ConstructorEmblemConfig | undefined = CONSTRUCTOR_EMBLEMS[canonicalId];

  if (emblem) {
    return {
      primary: emblem.primaryColor,
      secondary: emblem.secondaryColor,
      accent: emblem.accentColor ?? '#00D2FF',
    };
  }

  if (typeof team !== 'string' && team.color) {
    return {
      primary: team.color,
      secondary: '#FFFFFF',
      accent: '#00D2FF',
    };
  }

  return {
    primary: '#E10600',
    secondary: '#FFFFFF',
    accent: '#0A0E18',
  };
}

export interface EraCarMaterialsConfig {
  team: TeamLike;
  eraSpec?: CarEraSpec;
  liveryTextures?: GeneratedLiveryTextures;
}

/**
 * Factory creating authentic PBR clearcoat materials for all 9 canonical zones.
 * Each caller owns the returned materials and must dispose them upon teardown.
 */
export function createEraCarMaterials({
  team,
  liveryTextures,
}: EraCarMaterialsConfig): Record<CanonicalMaterialZone, THREE.Material> {
  const colors = resolveColors(team);

  const bodyPrimary = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colors.primary),
    metalness: 0.78,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
    map: liveryTextures?.liveryMap ?? null,
  });

  const bodyAccent = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colors.secondary),
    metalness: 0.8,
    roughness: 0.2,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
  });

  const carbonExposed = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#10131A'),
    metalness: 0.18,
    roughness: 0.65,
    roughnessMap: liveryTextures?.carbonRoughnessMap ?? null,
  });

  const frontWing = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colors.primary),
    metalness: 0.65,
    roughness: 0.2,
    clearcoat: 0.7,
    clearcoatRoughness: 0.1,
  });

  const rearWing = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colors.secondary),
    metalness: 0.7,
    roughness: 0.2,
    clearcoat: 0.7,
    clearcoatRoughness: 0.1,
  });

  const halo = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#282C35'),
    metalness: 0.9,
    roughness: 0.32,
  });

  const tireSidewall = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#16181D'),
    metalness: 0.04,
    roughness: 0.88,
  });

  const brakeDisc = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#383C44'),
    metalness: 0.65,
    roughness: 0.62,
  });

  const cockpit = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#12141A'),
    metalness: 0.15,
    roughness: 0.78,
  });

  return {
    body_primary: bodyPrimary,
    body_accent: bodyAccent,
    carbon_exposed: carbonExposed,
    front_wing: frontWing,
    rear_wing: rearWing,
    halo: halo,
    tire_sidewall: tireSidewall,
    brake_disc: brakeDisc,
    cockpit: cockpit,
  };
}

/**
 * Deterministically disposes all 9 materials in a material set.
 */
export function disposeCarMaterials(materials: Record<CanonicalMaterialZone, THREE.Material>): void {
  for (const mat of Object.values(materials)) {
    mat.dispose();
  }
}
