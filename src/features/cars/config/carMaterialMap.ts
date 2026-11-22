/**
 * F1 Archive — 3D Car Mesh Material Mapping
 * Maps raw OBJ/GLB mesh material identifiers to semantic car components.
 */

export type CarMaterialRole =
  | 'bodyPrimary'     // Main monocoque, engine cover, nosecone, cockpit flanks
  | 'bodyAccent'      // Rear wing, aerodynamic endplates
  | 'carbonComposite' // Front wing airfoils, underfloor diffuser, suspension wishbones
  | 'tyreRubber'      // Front and rear Pirelli tyre compounds & wheel rims
  | 'titaniumHalo'    // Titanium Halo safety cell & mirror stems
  | 'mechanicals';    // Brake assemblies, internal radiators & gearbox

export const CAR_MATERIAL_MAP: Record<string, CarMaterialRole> = {
  // Main Monocoque Body & Engine Cover
  'Default_OBJ.003': 'bodyPrimary',
  // Nosecone & Front Crash Structure
  'Default_OBJ.007': 'bodyPrimary',
  // Cockpit Flanks & Upper Body
  'Default_OBJ.008': 'bodyPrimary',

  // Rear Wing & Endplates
  'Default_OBJ.006': 'bodyAccent',

  // Front Wing Multi-Tier Airfoils & Floor Diffuser
  'Default_OBJ.005': 'carbonComposite',
  // Suspension Carbon Wishbones
  'Default_OBJ.009': 'carbonComposite',

  // Front-Left Wheel & Tyre
  'Default_OBJ.011': 'tyreRubber',
  // Front-Right Wheel & Tyre
  'Default_OBJ.013': 'tyreRubber',
  // Rear Driven Axle Wheels & Tyres
  'Default_OBJ.004': 'tyreRubber',

  // Titanium Halo Safety Cell & Mirror Stems
  'Default_OBJ.002': 'titaniumHalo',

  // Brake Discs, Internal Radiators & Gearbox
  'Default_OBJ.001': 'mechanicals',
};

export function getMaterialRole(matName?: string): CarMaterialRole {
  if (!matName) return 'mechanicals';
  return CAR_MATERIAL_MAP[matName] ?? 'mechanicals';
}
