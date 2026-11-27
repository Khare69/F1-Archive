/**
 * Formula One Technical Era Definitions & Specification Registry
 * Covers 75+ years of aerodynamic, chassis, and powertrain evolution.
 */

export type CarEraId =
  | '1950s_front_engine'
  | '1988_turbo'
  | '2004_v10'
  | '2024_ground_effect'
  | '2026_active_aero';

export interface CarEraSpec {
  id: CarEraId;
  yearLabel: string;
  title: string;
  subtitle: string;
  modelPath: string;
  isExperimental: boolean;
  hasHalo: boolean;
  hasWings: boolean;
  hasDrsOrActiveAero: boolean;
  requiredMaterialZones: readonly string[];
  specs: {
    engine: string;
    minWeightKg: number | null; // null if unregulated (pre-1961)
    wheelbaseMm: string;
    powerEstimateHp: string;
    aeroConcept: string;
    tyreType: string;
  };
  summaryPlainEnglish: string;
}

export const CAR_ERA_SPECS: readonly CarEraSpec[] = [
  {
    id: '1950s_front_engine',
    yearLabel: '1950s',
    title: 'Front-Engine Grand Prix Era',
    subtitle: 'Streamlined cigar fuselages, supercharged inline engines & zero downforce',
    modelPath: '/models/1950s_front_engine.glb',
    isExperimental: false,
    hasHalo: false,
    hasWings: false,
    hasDrsOrActiveAero: false,
    requiredMaterialZones: [
      'body_primary',
      'body_accent',
      'carbon_exposed',
      'tire_sidewall',
      'brake_disc',
      'cockpit',
    ] as const,
    specs: {
      engine: '2.5L Naturally Aspirated / 1.5L Supercharged',
      minWeightKg: null, // FIA minimum weight regulations began in 1961
      wheelbaseMm: '~2,280 mm',
      powerEstimateHp: '~280 bhp',
      aeroConcept: 'Pure mechanical grip & low-drag cigar fuselage (0 downforce)',
      tyreType: 'Narrow 16" cross-ply spoke/steel tyres',
    },
    summaryPlainEnglish:
      'The romantic pioneer era: drivers sat upright behind a long front engine with no seatbelts, no wings, and no aerodynamic downforce. Cornering was purely a dance of mechanical grip and throttle balance.',
  },
  {
    id: '1988_turbo',
    yearLabel: '1988',
    title: '1.5L Turbo Monster Era',
    subtitle: 'Ultra-low line monocoques, 4.0 bar boost & extreme downforce',
    modelPath: '/models/1988_turbo.glb',
    isExperimental: false,
    hasHalo: false,
    hasWings: true,
    hasDrsOrActiveAero: false,
    requiredMaterialZones: [
      'body_primary',
      'body_accent',
      'carbon_exposed',
      'front_wing',
      'rear_wing',
      'tire_sidewall',
      'brake_disc',
      'cockpit',
    ] as const,
    specs: {
      engine: '1.5L V6 Turbocharged (Honda RA168E)',
      minWeightKg: 500,
      wheelbaseMm: '~2,875 mm',
      powerEstimateHp: '~650–900 bhp (race trim)',
      aeroConcept: 'Stepped flat floor, wide boxy rear wing, high-downforce cascades',
      tyreType: '13" Wide treaded/slick Goodyear tyres',
    },
    summaryPlainEnglish:
      'The zenith of the original turbo explosion: cars featured carbon fiber monocoques, manual gearboxes, flat undertrays, and violent turbo boost without driver aids or safety halos.',
  },
  {
    id: '2004_v10',
    yearLabel: '2004',
    title: '3.0L V10 High-Downforce Pinnacle',
    subtitle: '19,000 RPM screaming V10s, intricate winglets & all-time lap records',
    modelPath: '/models/2004_v10.glb',
    isExperimental: false,
    hasHalo: false,
    hasWings: true,
    hasDrsOrActiveAero: false,
    requiredMaterialZones: [
      'body_primary',
      'body_accent',
      'carbon_exposed',
      'front_wing',
      'rear_wing',
      'tire_sidewall',
      'brake_disc',
      'cockpit',
    ] as const,
    specs: {
      engine: '3.0L Naturally Aspirated 90° V10 (~19,000 RPM)',
      minWeightKg: 605,
      wheelbaseMm: '~3,050 mm',
      powerEstimateHp: '~920–950 bhp',
      aeroConcept: 'Over-body aerodynamic sculpting, flip-ups, chimney ducts & bargeboards',
      tyreType: '13" Grooved Bridgestone/Michelin tyres (4 grooves)',
    },
    summaryPlainEnglish:
      'Widely regarded as the fastest and purest sounding era: ultra-lightweight chassis powered by screaming V10 engines capable of 19,000 RPM, setting track lap records that stood for well over a decade.',
  },
  {
    id: '2024_ground_effect',
    yearLabel: '2024',
    title: '1.6L Turbo-Hybrid Ground Effect',
    subtitle: 'Underfloor Venturi tunnels, 50% thermal efficiency, 18" tyres & Halo safety cell',
    modelPath: '/models/2024_ground_effect.glb',
    isExperimental: false,
    hasHalo: true,
    hasWings: true,
    hasDrsOrActiveAero: true,
    requiredMaterialZones: [
      'body_primary',
      'body_accent',
      'carbon_exposed',
      'front_wing',
      'rear_wing',
      'halo',
      'tire_sidewall',
      'brake_disc',
      'cockpit',
    ] as const,
    specs: {
      engine: '1.6L V6 Turbo-Hybrid (ICE + MGU-K + MGU-H)',
      minWeightKg: 798,
      wheelbaseMm: '3,600 mm (max regulated)',
      powerEstimateHp: '~1,020–1,050 bhp (combined)',
      aeroConcept: 'Venturi ground-effect floor tunnels, beam wing, 3D sweeping front wing',
      tyreType: '18" Low-profile Pirelli P-Zero slicks with aero wheel covers',
    },
    summaryPlainEnglish:
      'Modern technological engineering tour de force: high downforce generated from underbody Venturi tunnels to enable closer wheel-to-wheel racing, protected by a Grade 5 titanium Halo cell.',
  },
  {
    id: '2026_active_aero',
    yearLabel: '2026',
    title: 'Active Aero & 50/50 Hybrid Concept',
    subtitle: 'Nimble car regulations, active wing modes, 100% sustainable e-fuel & Manual Override',
    modelPath: '/models/2026_active_aero.glb',
    isExperimental: true,
    hasHalo: true,
    hasWings: true,
    hasDrsOrActiveAero: true,
    requiredMaterialZones: [
      'body_primary',
      'body_accent',
      'carbon_exposed',
      'front_wing',
      'rear_wing',
      'halo',
      'tire_sidewall',
      'brake_disc',
      'cockpit',
    ] as const,
    specs: {
      engine: '1.6L Turbo 50/50 Hybrid (400 kW ICE + 350 kW MGU-K, MGU-H deleted)',
      minWeightKg: 768,
      wheelbaseMm: '3,400 mm (-200 mm vs 2025)',
      powerEstimateHp: '~1,000 bhp (50% electrical power share)',
      aeroConcept: 'Dual-mode Active Aero (Z-Mode Corner Downforce / X-Mode Low Drag)',
      tyreType: '18" Pirelli tyres (-25mm front / -30mm rear width reduction)',
    },
    summaryPlainEnglish:
      'The future of Grand Prix racing: smaller, lighter, and more agile cars featuring automated active aerodynamics (Z-Mode for corners, X-Mode for straights) and equal split between combustion and electric power.',
  },
];

export const DEFAULT_CAR_ERA: CarEraId = '2024_ground_effect';

export function getCarEraSpec(eraId: string | null | undefined): CarEraSpec {
  if (!eraId) {
    return CAR_ERA_SPECS.find((s) => s.id === DEFAULT_CAR_ERA) || CAR_ERA_SPECS[3];
  }
  const match = CAR_ERA_SPECS.find((s) => s.id === eraId);
  return match || CAR_ERA_SPECS.find((s) => s.id === DEFAULT_CAR_ERA) || CAR_ERA_SPECS[3];
}
