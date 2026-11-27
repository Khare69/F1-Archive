import { z } from 'zod';
import type { CarEraId } from '../features/cars/carEraRegistry';

export const CarHotspotCategorySchema = z.enum([
  'aero',
  'powertrain',
  'safety',
  'chassis',
  'tyres',
]);
export type CarHotspotCategory = z.infer<typeof CarHotspotCategorySchema>;

export const CarHotspotSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: CarHotspotCategorySchema,
  position: z.tuple([z.number(), z.number(), z.number()]),
  cameraTarget: z.object({
    position: z.tuple([z.number(), z.number(), z.number()]),
    target: z.tuple([z.number(), z.number(), z.number()]),
  }),
  applicableEras: z.array(z.string()),
  plainEnglish: z.string(),
  technicalSpec: z.string(),
});
export type CarHotspot = z.infer<typeof CarHotspotSchema>;

export const CAR_HOTSPOTS: readonly CarHotspot[] = [
  {
    id: 'front_wing',
    label: 'Front Wing Assembly',
    category: 'aero',
    position: [2.2, 0.28, 0.0],
    cameraTarget: {
      position: [3.2, 1.1, 1.3],
      target: [2.2, 0.28, 0.0],
    },
    applicableEras: ['1988_turbo', '2004_v10', '2024_ground_effect', '2026_active_aero'],
    plainEnglish:
      'Directs incoming turbulent air around the front tyres and produces crucial downforce to press the front axle into the tarmac during high-speed cornering.',
    technicalSpec:
      'Multi-element carbon composite airfoils with adjustable flap angle. In 2026, features active dual-mode flap articulation between high-downforce cornering and low-drag straight modes.',
  },
  {
    id: 'halo_safety_cell',
    label: 'Halo Safety Cell',
    category: 'safety',
    position: [0.18, 0.72, 0.0],
    cameraTarget: {
      position: [1.2, 1.4, 1.2],
      target: [0.18, 0.65, 0.0],
    },
    applicableEras: ['2024_ground_effect', '2026_active_aero'],
    plainEnglish:
      "A protective titanium framework curved around the driver's helmet, designed to shield the cockpit from heavy flying debris and withstand the crushing weight of two double-decker buses.",
    technicalSpec:
      'FIA 8869-2018 Grade 5 Titanium monocoque hoop capable of withstanding 125 kN of lateral and longitudinal crush impact without structural failure (12 tonnes static load).',
  },
  {
    id: 'cockpit_cell',
    label: 'Cockpit & Survival Cell',
    category: 'chassis',
    position: [0.12, 0.5, 0.0],
    cameraTarget: {
      position: [0.9, 1.2, 1.1],
      target: [0.12, 0.45, 0.0],
    },
    applicableEras: [
      '1950s_front_engine',
      '1988_turbo',
      '2004_v10',
      '2024_ground_effect',
      '2026_active_aero',
    ],
    plainEnglish:
      'The high-strength monocoque where the driver is secured by a six-point harness, operating the custom carbon fiber steering wheel.',
    technicalSpec:
      'Carbon-honeycomb composite impact structure incorporating fire suppression, six-point safety harness, molded carbon seat insert, and quick-release telemetry steering wheel.',
  },
  {
    id: 'power_unit',
    label: 'Power Unit & Engine Cowl',
    category: 'powertrain',
    position: [-0.6, 0.58, 0.0],
    cameraTarget: {
      position: [-0.6, 1.5, 2.2],
      target: [-0.6, 0.45, 0.0],
    },
    applicableEras: [
      '1950s_front_engine',
      '1988_turbo',
      '2004_v10',
      '2024_ground_effect',
      '2026_active_aero',
    ],
    plainEnglish:
      'The beating heart of the race car, evolving from 1950s front-mounted supercharged engines to screaming 19,000 RPM V10s and modern 50/50 electric turbo-hybrids.',
    technicalSpec:
      'Era-dependent powertrain architecture: 1950s 2.5L NA, 1988 1.5L Turbo, 2004 3.0L V10 NA, 2024 1.6L MGU-H/K Turbo-Hybrid, and 2026 50/50 400 kW ICE + 350 kW MGU-K on 100% e-fuel.',
  },
  {
    id: 'sidepod_cooling',
    label: 'Sidepod Aerodynamics & Radiators',
    category: 'aero',
    position: [-0.3, 0.38, 0.65],
    cameraTarget: {
      position: [0.6, 1.1, 2.2],
      target: [-0.3, 0.35, 0.45],
    },
    applicableEras: ['1988_turbo', '2004_v10', '2024_ground_effect', '2026_active_aero'],
    plainEnglish:
      'Sculpted side bodywork that funnels cooling airflow to internal engine radiators while shaping clean airflow around the car toward the rear diffuser.',
    technicalSpec:
      'Engineered intake undercut channels cooling air to high-efficiency liquid-to-air heat exchangers before feeding downwash vortices over the floor edge.',
  },
  {
    id: 'underfloor_venturi',
    label: 'Venturi Underfloor Tunnels',
    category: 'aero',
    position: [-0.1, 0.12, 0.65],
    cameraTarget: {
      position: [0.5, 0.6, 2.4],
      target: [-0.1, 0.1, 0.3],
    },
    applicableEras: ['2024_ground_effect', '2026_active_aero'],
    plainEnglish:
      'Twin contoured tunnels sculpted beneath the floor that accelerate airflow under the car, creating powerful suction that glues the chassis to the track.',
    technicalSpec:
      "Ground effect Venturi channels engineered to Bernoulli's principle, accelerating underbody airflow to generate over 60% of total vehicle downforce with minimal induced drag.",
  },
  {
    id: 'rear_wing_drs',
    label: 'Rear Wing & Active Aerodynamics',
    category: 'aero',
    position: [-2.2, 0.82, 0.0],
    cameraTarget: {
      position: [-3.2, 1.4, 1.2],
      target: [-2.2, 0.75, 0.0],
    },
    applicableEras: ['1988_turbo', '2004_v10', '2024_ground_effect', '2026_active_aero'],
    plainEnglish:
      'Generates massive rear-axle downforce for cornering grip. Features DRS flap opening in 2024 and full dual-mode active wing articulation in 2026.',
    technicalSpec:
      'Carbon composite dual-tier aerofoil. 2024 spec features hydraulically actuated Drag Reduction System (DRS). 2026 spec introduces automated dual-mode active aero (Corner Z-Mode / Straight X-Mode).',
  },
  {
    id: 'tyres_brakes',
    label: 'Tyre Compound & Carbon Ceramic Brakes',
    category: 'tyres',
    position: [1.45, 0.36, 0.82],
    cameraTarget: {
      position: [2.2, 0.8, 1.6],
      target: [1.45, 0.36, 0.7],
    },
    applicableEras: [
      '1950s_front_engine',
      '1988_turbo',
      '2004_v10',
      '2024_ground_effect',
      '2026_active_aero',
    ],
    plainEnglish:
      "The car's sole contact patch with the circuit, operating alongside carbon disc brakes that stop the car from 300 km/h in under 60 meters while glowing red-hot at 1,000°C.",
    technicalSpec:
      'Bespoke compound racing tyres with carbon-carbon brake discs and 6-piston monobloc aluminium calipers producing deceleration forces exceeding 5.0G.',
  },
];

/**
 * Returns the filtered list of anatomical hotspots applicable to a specific era.
 */
export function getHotspotsForEra(eraId: CarEraId): CarHotspot[] {
  return CAR_HOTSPOTS.filter((h) => h.applicableEras.includes(eraId));
}
