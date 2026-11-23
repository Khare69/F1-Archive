/**
 * F1 // ARCHIVE — Telemetry & Strategy Analytics Type Definitions
 * Covers 3D Ghost-Lap replay traces, 25-segment mini-sectors,
 * and fuel-corrected tyre degradation stint pace analytics.
 */

export interface TelemetrySample {
  /** Distance fraction along track circuit spline (0.0 to 1.0) */
  distanceFraction: number;
  /** Cumulative track distance in meters */
  distanceMeters: number;
  /** Elapsed seconds from lap start */
  elapsedTime: number;
  /** Velocity in km/h */
  speed: number;
  /** Throttle application (0 to 100%) */
  throttle: number;
  /** Brake application (0 to 100%, or 0/1 for binary sensors) */
  brake: number;
  /** Transmission gear (1 to 8, or null if telemetry channel missing) */
  gear: number | null;
  /** Engine revolutions per minute (or null if unavailable) */
  rpm?: number | null;
  /** Drag Reduction System active status */
  drs?: boolean;
}

export interface GhostLapDriverTelemetry {
  driverId: string;
  driverCode: string;
  driverName: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  /** Distinct secondary color for colorblind / same-team contrast (e.g. #FFFFFF or #FFD700 T-cam) */
  secondaryColor: string;
  lapTime: string;
  lapTimeSeconds: number;
  sector1Time: number;
  sector2Time: number;
  sector3Time: number;
  topSpeed: number;
  avgSpeed: number;
  /** Downsampled telemetry samples (150-250 points per lap) */
  samples: TelemetrySample[];
}

export interface MiniSector {
  index: number;
  startDistanceFraction: number;
  endDistanceFraction: number;
  fasterDriver: 'A' | 'B' | 'TIE';
  deltaSeconds: number;
  speedDeltaKmh: number;
}

export type TelemetryFeedAvailability = 'full' | 'partial' | 'estimated';

export interface TelemetryShowdown {
  slug: string;
  title: string;
  subtitle: string;
  year: number;
  session: 'Q3' | 'Race';
  circuitId: string;
  circuitName: string;
  lapDistanceMeters: number;
  /** Normalized track distance fractions for S1, S2, and S3 endpoints */
  sectorBoundaries: [number, number, number];
  driverA: GhostLapDriverTelemetry;
  driverB: GhostLapDriverTelemetry;
  /** 25 equally-divided track mini-sectors */
  miniSectors25: MiniSector[];
  feedAvailability: TelemetryFeedAvailability;
}

export type TyreCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';

export interface StintPaceLap {
  lapNumber: number;
  driverCode: string;
  compound: TyreCompound;
  tyreAgeLaps: number;
  rawLapTimeSeconds: number;
  fuelLoadKg: number;
  fuelCorrectionSeconds: number;
  correctedLapTimeSeconds: number;
  isPitLap: boolean;
  isSafetyCar: boolean;
  isOutlier: boolean;
}

export interface DriverStintSummary {
  driverCode: string;
  driverName: string;
  teamColor: string;
  compound: TyreCompound;
  startLap: number;
  endLap: number;
  totalLaps: number;
  cleanLapsCount: number;
  avgRawPace: number;
  avgFuelCorrectedPace: number;
  /** Linear regression degradation slope in seconds per lap */
  degradationSlopeSecPerLap: number;
  laps: StintPaceLap[];
}

export interface StrategySessionData {
  showdownSlug: string;
  circuitId: string;
  sessionFastestLap: number;
  totalLaps: number;
  fuelBurnRatePerLapKg: number;
  fuelEffectPerKgSec: number;
  stints: DriverStintSummary[];
}
