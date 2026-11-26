import { z } from 'zod';

export const CircuitCornerSchema = z.object({
  number: z.number().int().min(1).max(35),
  name: z.string().min(1).max(80),
  t: z.number().min(0).lt(1),
  speedKmh: z.number().int().min(40).max(360),
  gear: z.number().int().min(1).max(8),
  brakingG: z.number().min(0).max(7).nullable(),
  lateralG: z.number().min(0).max(7).nullable(),
  brakingDistanceM: z.number().int().min(0).max(250).nullable(),
  isOvertakingZone: z.boolean(),
  isHighDownforce: z.boolean(),
  notes: z.string().min(10).max(280),
  famousOvertake: z.string().min(5).max(200).optional()
});

export type CircuitCorner = z.infer<typeof CircuitCornerSchema>;

export const CircuitCornersRegistrySchema = z.record(
  z.string(),
  z.array(CircuitCornerSchema).min(3)
);

export type CircuitCornersRegistry = z.infer<typeof CircuitCornersRegistrySchema>;

export interface FallbackCornerMarker {
  number: number;
  name: string;
  t: number;
  isAutoDetected: true;
  speedKmh?: undefined;
  gear?: undefined;
  brakingG?: null;
  lateralG?: null;
  brakingDistanceM?: null;
  isOvertakingZone?: boolean;
  isHighDownforce?: boolean;
  notes?: string;
  famousOvertake?: string;
}
