import { z } from 'zod';

export type UpstreamErrorCode = 'TIMEOUT' | 'RATE_LIMITED' | 'HTTP_ERROR' | 'SCHEMA_DRIFT' | 'NETWORK';

export class UpstreamApiError extends Error {
  public readonly code: UpstreamErrorCode;
  public readonly status?: number;
  public readonly url?: string;
  public readonly details?: unknown;

  constructor(message: string, code: UpstreamErrorCode, options?: { status?: number; url?: string; details?: unknown }) {
    super(message);
    this.name = 'UpstreamApiError';
    this.code = code;
    this.status = options?.status;
    this.url = options?.url;
    this.details = options?.details;
  }
}

// ── Jolpica F1 Schemas ──

export const JolpicaDriverSchema = z.object({
  driverId: z.string(),
  permanentNumber: z.coerce.number().finite().optional().nullable(),
  code: z.string().optional().nullable(),
  givenName: z.string(),
  familyName: z.string(),
  dateOfBirth: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
});

export const JolpicaConstructorSchema = z.object({
  constructorId: z.string(),
  name: z.string(),
  nationality: z.string().optional().nullable(),
});

export const JolpicaDriverStandingSchema = z.object({
  position: z.coerce.number().finite(),
  positionText: z.string().optional().nullable(),
  points: z.coerce.number().finite(),
  wins: z.coerce.number().finite(),
  Driver: JolpicaDriverSchema,
  Constructors: z.array(JolpicaConstructorSchema).optional().default([]),
});

export const JolpicaConstructorStandingSchema = z.object({
  position: z.coerce.number().finite(),
  positionText: z.string().optional().nullable(),
  points: z.coerce.number().finite(),
  wins: z.coerce.number().finite(),
  Constructor: JolpicaConstructorSchema,
});

export const JolpicaCircuitSchema = z.object({
  circuitId: z.string(),
  circuitName: z.string(),
  Location: z.object({
    locality: z.string(),
    country: z.string(),
    lat: z.string().optional().nullable(),
    long: z.string().optional().nullable(),
  }),
});

export const JolpicaRaceSchema = z.object({
  season: z.string(),
  round: z.string(),
  raceName: z.string(),
  Circuit: JolpicaCircuitSchema,
  date: z.string(),
  time: z.string().optional().nullable(),
});

export const JolpicaDriverStandingsEnvelopeSchema = z.object({
  MRData: z.object({
    limit: z.string().optional().nullable(),
    offset: z.string().optional().nullable(),
    total: z.string().optional().nullable(),
    StandingsTable: z.object({
      season: z.string().optional().nullable(),
      round: z.string().optional().nullable(),
      StandingsLists: z
        .array(
          z.object({
            season: z.string(),
            round: z.string(),
            DriverStandings: z.array(JolpicaDriverStandingSchema).default([]),
          })
        )
        .default([]),
    }),
  }),
});

export const JolpicaConstructorStandingsEnvelopeSchema = z.object({
  MRData: z.object({
    limit: z.string().optional().nullable(),
    offset: z.string().optional().nullable(),
    total: z.string().optional().nullable(),
    StandingsTable: z.object({
      season: z.string().optional().nullable(),
      round: z.string().optional().nullable(),
      StandingsLists: z
        .array(
          z.object({
            season: z.string(),
            round: z.string(),
            ConstructorStandings: z.array(JolpicaConstructorStandingSchema).default([]),
          })
        )
        .default([]),
    }),
  }),
});

export const JolpicaRaceScheduleEnvelopeSchema = z.object({
  MRData: z.object({
    limit: z.string().optional().nullable(),
    offset: z.string().optional().nullable(),
    total: z.string().optional().nullable(),
    RaceTable: z.object({
      season: z.string().optional().nullable(),
      Races: z.array(JolpicaRaceSchema).default([]),
    }),
  }),
});

// ── OpenF1 Telemetry Schemas ──

export const OpenF1CarDataPointSchema = z.object({
  date: z.string(),
  driver_number: z.coerce.number().finite(),
  rpm: z.coerce.number().finite(),
  speed: z.coerce.number().finite(),
  n_gear: z.coerce.number().finite(),
  throttle: z.coerce.number().finite(),
  brake: z.coerce.number().finite(),
  drs: z.coerce.number().finite(),
});

export const OpenF1LocationPointSchema = z.object({
  date: z.string(),
  driver_number: z.coerce.number().finite(),
  x: z.coerce.number().finite(),
  y: z.coerce.number().finite(),
  z: z.coerce.number().finite(),
});

export type JolpicaDriverStanding = z.infer<typeof JolpicaDriverStandingSchema>;
export type JolpicaConstructorStanding = z.infer<typeof JolpicaConstructorStandingSchema>;
export type JolpicaRace = z.infer<typeof JolpicaRaceSchema>;
export type OpenF1CarDataPointValidated = z.infer<typeof OpenF1CarDataPointSchema>;
export type OpenF1LocationPointValidated = z.infer<typeof OpenF1LocationPointSchema>;
