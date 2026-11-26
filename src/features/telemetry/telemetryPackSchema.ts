import { z } from 'zod';
import { inferPackProvenance, type TelemetryPackProvenance } from './telemetryMath';

export const TelemetrySampleSchema = z.object({
  distanceFraction: z.number().min(0).max(1),
  distanceMeters: z.number().min(0),
  elapsedTime: z.number().min(0),
  speed: z.number().min(0).max(390),
  throttle: z.number().min(0).max(100),
  brake: z.number().min(0).max(100),
  gear: z.number().int().min(0).max(8),
  rpm: z.number().optional(),
  drs: z.boolean().optional(),
});

export const DriverShowdownTelemetrySchema = z.object({
  driverId: z.string().min(1),
  driverCode: z.string().min(2).max(4),
  driverName: z.string().min(1),
  teamId: z.string().min(1),
  teamName: z.string().min(1),
  teamColor: z.string().min(4),
  secondaryColor: z.string().optional(),
  lapTime: z.string().min(4),
  lapTimeSeconds: z.number().positive(),
  sector1Time: z.number().positive(),
  sector2Time: z.number().positive(),
  sector3Time: z.number().positive(),
  topSpeed: z.number().positive().max(390),
  avgSpeed: z.number().positive(),
  samples: z.array(TelemetrySampleSchema).min(10),
});

export const MiniSectorSchema = z.object({
  index: z.number(),
  fasterDriver: z.enum(['A', 'B', 'TIE']),
  deltaSeconds: z.number().optional(),
  startFraction: z.number().optional(),
  endFraction: z.number().optional(),
});

export const TelemetryPackSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    year: z.number().int().min(1950).max(2030),
    session: z.string().min(1),
    circuitId: z.string().min(1),
    circuitName: z.string().min(1),
    lapDistanceMeters: z.number().positive(),
    sectorBoundaries: z.tuple([z.number(), z.number(), z.number()]),
    driverA: DriverShowdownTelemetrySchema,
    driverB: DriverShowdownTelemetrySchema,
    miniSectors25: z.array(MiniSectorSchema).optional(),
    provenance: z
      .enum(['historical_verified', 'live_openf1', 'experimental_simulation'])
      .optional(),
  })
  .transform((pack) => {
    const provenance: TelemetryPackProvenance = inferPackProvenance(
      pack.slug,
      pack.provenance
    );
    return {
      ...pack,
      provenance,
    };
  });

export type ValidatedTelemetryPack = z.infer<typeof TelemetryPackSchema>;

export const TelemetryCatalogItemSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    year: z.number().int().min(1950).max(2030),
    session: z.string().min(1),
    circuitId: z.string().min(1),
    circuitName: z.string().min(1),
    driverACode: z.string().min(2).max(4),
    driverBCode: z.string().min(2).max(4),
    driverAName: z.string().min(1),
    driverBName: z.string().min(1),
    driverAColor: z.string().min(4),
    driverBColor: z.string().min(4),
    lapTimeA: z.string().min(4),
    lapTimeB: z.string().min(4),
    delta: z.number(),
    feedAvailability: z.string().min(1),
    provenance: z
      .enum(['historical_verified', 'live_openf1', 'experimental_simulation'])
      .optional(),
  })
  .transform((item) => ({
    ...item,
    provenance: inferPackProvenance(item.slug, item.provenance),
  }));

export type TelemetryCatalogItem = z.infer<typeof TelemetryCatalogItemSchema>;

export const TelemetryCatalogSchema = z.array(TelemetryCatalogItemSchema);

export const StrategyPackSanitySchema = z.object({
  slug: z.string().optional(),
  circuitId: z.string().optional(),
  circuitName: z.string().optional(),
  totalLaps: z.number().positive(),
  sessionFastestLap: z.number().positive(),
  stints: z.array(z.any()).min(1),
});

export type StrategyPackSanity = z.infer<typeof StrategyPackSanitySchema>;
