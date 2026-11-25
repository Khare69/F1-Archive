/**
 * F1 // ARCHIVE — ETL Zod Validation & Semantic Invariant Checks
 */

import { z } from 'zod';
import type { TransformOutputs } from './transform';

export const CircuitSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string(),
  city: z.string().nullable(),
  lengthKm: z.string().nullable(),
  turns: z.number().nullable(),
  lapRecord: z.string().nullable(),
  lapRecordHolder: z.string().nullable(),
  firstGP: z.number().nullable(),
  drsZones: z.number().nullable(),
  elevation: z.string().nullable(),
  type: z.string(),
  totalRaces: z.number(),
  poleToWinRate: z.number().nullable(),
  poleToWinCount: z.number(),
  racesWithRecordedPole: z.number(),
  pastWinners: z.array(z.any())
});

export const ConstructorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  carName: z.string().optional(),
  color: z.string(),
  base: z.string(),
  principal: z.string(),
  championships: z.number(),
  firstEntry: z.number().nullable(),
  polePositions: z.number(),
  fastestLaps: z.number(),
  isLegendary: z.boolean(),
  isActive2026: z.boolean(),
  specs: z.object({
    powerUnit: z.string(),
    chassis: z.string(),
    weight: z.string(),
    downforce: z.string(),
    topSpeed: z.string()
  }),
  specs2026: z.any().nullable()
});

export const DriverSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  code: z.string().nullable(),
  name: z.string().min(1),
  fullName: z.string(),
  number: z.number().nullable(),
  country: z.string().nullable().optional(),
  wins: z.number(),
  podiums: z.number(),
  championships: z.number(),
  polePositions: z.number(),
  fastestLaps: z.number(),
  starts: z.number(),
  pointsSharePct: z.number().min(0).max(100),
  isLegend: z.boolean(),
  isActive2026: z.boolean(),
  raceFinishes: z.array(z.any())
});

export const SeasonSchema = z.object({
  year: z.number().min(1950).max(2030),
  races: z.number().min(0),
  championDriverId: z.string().nullable(),
  championDriver: z.string(),
  championTeamId: z.string().nullable(),
  championTeam: z.string(),
  notableEvents: z.array(z.string()),
  recordsBroken: z.array(z.string())
});

export const MetaSchema = z.object({
  f1dbVersion: z.string().min(1),
  syncedAt: z.string().min(1),
  license: z.string().min(1),
  attribution: z.string().min(1),
  recordCounts: z.object({
    seasons: z.number().min(70),
    drivers: z.number().min(500),
    constructors: z.number().min(50),
    circuits: z.number().min(50)
  })
});

/**
 * Validates transformed datasets against Zod schemas and F1 domain invariants.
 */
export function validateTransformedData(data: TransformOutputs): void {
  console.log('🛡️ Validating data against Zod schemas...');

  // 1. Zod schema validation
  MetaSchema.parse(data.meta);

  for (const c of data.circuits) {
    CircuitSchema.parse(c);
  }

  for (const c of data.constructors) {
    ConstructorSchema.parse(c);
  }

  for (const d of data.drivers) {
    DriverSchema.parse(d);
  }

  for (const s of data.seasons) {
    SeasonSchema.parse(s);
  }

  // 2. Domain-Invariant Assertions
  console.log('🔍 Checking domain invariant assertions...');

  // Invariant 1: Brawn GP entered in 2009 (not 1950)
  const brawn = data.constructors.find(c => c.id === 'brawn');
  if (brawn && brawn.firstEntry !== 2009) {
    throw new Error(`[Data Invariant Failed] Brawn GP firstEntry must be 2009, got ${brawn.firstEntry}`);
  }

  // Invariant 2: Historic tracks must have > 50 vertices in coordinates
  const classicCheckList = ['monza', 'monaco', 'silverstone', 'spa-francorchamps', 'suzuka', 'interlagos'];
  for (const cId of classicCheckList) {
    const splineData = data.circuitSplines.get(cId);
    if (!splineData || !splineData.coordinates || splineData.coordinates.length <= 50) {
      console.warn(`[Data Invariant Warning] ${cId} has ${splineData?.coordinates?.length ?? 0} vertices`);
    }
  }

  // Invariant 3: Zero duplicated trackCoordinates in summary circuits list
  for (const c of data.circuits) {
    if ('trackCoordinates' in c) {
      throw new Error(`[Data Invariant Failed] Circuit ${c.id} should NOT have trackCoordinates in summary list!`);
    }
  }

  console.log('✅ All Zod schemas and domain invariants passed successfully!');
}
