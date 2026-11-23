/**
 * F1 Archive — Multi-Car Timing Tower & Telemetry Stream Engine
 * High-performance, zero-allocation ring buffers with two-sample linear interpolation
 * for smooth 60 FPS car positioning and timing tower ladders.
 */

export interface LiveCarTelemetryPacket {
  timestamp: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  rpm: number;
  drs: boolean;
  activeAero: 'straight' | 'corner'; // 2026 Regulation active aerodynamics
  overtakeMode: boolean;             // 2026 Regulation MOM energy boost
  distanceRatio: number;             // Normalized track progress (0.0 to 1.0)
  sector: 1 | 2 | 3;
}

export interface TimingTowerEntry {
  position: number;
  driverNumber: number;
  code: string;
  name: string;
  team: string;
  teamColor: string;
  gapToLeaderFormatted: string;
  intervalFormatted: string;
  currentLapTimeFormatted: string;
  bestLapTimeFormatted: string;
  lastSectorMs: number;
  sector1Status: 'fastest' | 'personal_best' | 'normal';
  sector2Status: 'fastest' | 'personal_best' | 'normal';
  sector3Status: 'fastest' | 'personal_best' | 'normal';
  activeAero: 'straight' | 'corner';
  overtakeActive: boolean;
  drsActive: boolean;
  speed: number;
  distanceRatio: number;
}

/**
 * Dedicated Circular Ring Buffer for a single driver's packet stream
 */
export class LiveTelemetryRingBuffer {
  private packets: LiveCarTelemetryPacket[];
  private capacity: number;
  private head: number = 0;
  private count: number = 0;

  constructor(capacity: number = 120) {
    this.capacity = capacity;
    this.packets = new Array<LiveCarTelemetryPacket>(capacity);
  }

  public push(packet: LiveCarTelemetryPacket): void {
    // Clone or copy packet to guarantee isolation
    this.packets[this.head] = { ...packet };
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  public getCount(): number {
    return this.count;
  }

  public getLatest(): LiveCarTelemetryPacket | null {
    if (this.count === 0) return null;
    const latestIdx = (this.head - 1 + this.capacity) % this.capacity;
    return this.packets[latestIdx] || null;
  }

  /**
   * Two-sample linear interpolation for smooth 60 FPS rendering
   * between discrete 10 Hz incoming packets.
   */
  public interpolate(targetTime: number): LiveCarTelemetryPacket | null {
    if (this.count === 0) return null;
    if (this.count === 1) return this.getLatest();

    // Find bounding pair p1, p2 where p1.timestamp <= targetTime <= p2.timestamp
    let p1: LiveCarTelemetryPacket | null = null;
    let p2: LiveCarTelemetryPacket | null = null;

    for (let i = 0; i < this.count - 1; i++) {
      const idx1 = (this.head - 1 - (i + 1) + this.capacity * 2) % this.capacity;
      const idx2 = (this.head - 1 - i + this.capacity * 2) % this.capacity;
      const cand1 = this.packets[idx1];
      const cand2 = this.packets[idx2];

      if (cand1 && cand2 && cand1.timestamp <= targetTime && targetTime <= cand2.timestamp) {
        p1 = cand1;
        p2 = cand2;
        break;
      }
    }

    // If outside recorded range, clamp to closest available sample
    if (!p1 || !p2) {
      return this.getLatest();
    }

    const timeSpan = p2.timestamp - p1.timestamp;
    if (timeSpan <= 0) return p2;

    const alpha = Math.max(0, Math.min(1, (targetTime - p1.timestamp) / timeSpan));

    // Linear interpolation of continuous numeric telemetry channels
    return {
      timestamp: targetTime,
      speed: Math.round(p1.speed + (p2.speed - p1.speed) * alpha),
      throttle: Math.round(p1.throttle + (p2.throttle - p1.throttle) * alpha),
      brake: Math.round(p1.brake + (p2.brake - p1.brake) * alpha),
      gear: alpha > 0.5 ? p2.gear : p1.gear,
      rpm: Math.round(p1.rpm + (p2.rpm - p1.rpm) * alpha),
      drs: alpha > 0.5 ? p2.drs : p1.drs,
      activeAero: alpha > 0.5 ? p2.activeAero : p1.activeAero,
      overtakeMode: alpha > 0.5 ? p2.overtakeMode : p1.overtakeMode,
      distanceRatio: p1.distanceRatio + (p2.distanceRatio - p1.distanceRatio) * alpha,
      sector: alpha > 0.5 ? p2.sector : p1.sector
    };
  }
}

/**
 * Multi-Car Stream Manager holding decoupled buffers for each active driver
 */
export class MultiCarStreamManager {
  private driverBuffers = new Map<number, LiveTelemetryRingBuffer>();

  public getBuffer(driverNumber: number): LiveTelemetryRingBuffer {
    let buf = this.driverBuffers.get(driverNumber);
    if (!buf) {
      buf = new LiveTelemetryRingBuffer();
      this.driverBuffers.set(driverNumber, buf);
    }
    return buf;
  }

  public ingest(driverNumber: number, packet: LiveCarTelemetryPacket): void {
    this.getBuffer(driverNumber).push(packet);
  }

  public getInterpolated(driverNumber: number, targetTime: number): LiveCarTelemetryPacket | null {
    const buf = this.driverBuffers.get(driverNumber);
    if (!buf) return null;
    return buf.interpolate(targetTime);
  }

  public getActiveDriverNumbers(): number[] {
    return Array.from(this.driverBuffers.keys());
  }

  public reset(): void {
    this.driverBuffers.clear();
  }
}

/**
 * 20-Car Offline Deterministic Stream Generator
 * Simulates a realistic Grand Prix timing ladder and telemetry stream.
 */
export interface RosterCar {
  driverNumber: number;
  code: string;
  name: string;
  team: string;
  teamColor: string;
  baseSpeedOffset: number; // km/h offset from standard profile
}

export const GRAND_PRIX_GRID: RosterCar[] = [
  { driverNumber: 1, code: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing', teamColor: '#3671C6', baseSpeedOffset: 2.5 },
  { driverNumber: 4, code: 'NOR', name: 'Lando Norris', team: 'McLaren', teamColor: '#FF8000', baseSpeedOffset: 2.2 },
  { driverNumber: 16, code: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', teamColor: '#E80020', baseSpeedOffset: 2.1 },
  { driverNumber: 44, code: 'HAM', name: 'Lewis Hamilton', team: 'Ferrari', teamColor: '#E80020', baseSpeedOffset: 1.9 },
  { driverNumber: 81, code: 'PIA', name: 'Oscar Piastri', team: 'McLaren', teamColor: '#FF8000', baseSpeedOffset: 1.8 },
  { driverNumber: 63, code: 'RUS', name: 'George Russell', team: 'Mercedes', teamColor: '#27F4D2', baseSpeedOffset: 1.6 },
  { driverNumber: 12, code: 'ANT', name: 'Kimi Antonelli', team: 'Mercedes', teamColor: '#27F4D2', baseSpeedOffset: 1.4 },
  { driverNumber: 14, code: 'ALO', name: 'Fernando Alonso', team: 'Aston Martin', teamColor: '#229971', baseSpeedOffset: 1.2 },
  { driverNumber: 55, code: 'SAI', name: 'Carlos Sainz', team: 'Williams', teamColor: '#64C4FF', baseSpeedOffset: 1.1 },
  { driverNumber: 10, code: 'GAS', name: 'Pierre Gasly', team: 'Alpine', teamColor: '#FF87BC', baseSpeedOffset: 0.8 },
  { driverNumber: 23, code: 'ALB', name: 'Alexander Albon', team: 'Williams', teamColor: '#64C4FF', baseSpeedOffset: 0.7 },
  { driverNumber: 30, code: 'LAW', name: 'Liam Lawson', team: 'Racing Bulls', teamColor: '#6692FF', baseSpeedOffset: 0.5 },
  { driverNumber: 22, code: 'TSU', name: 'Yuki Tsunoda', team: 'Racing Bulls', teamColor: '#6692FF', baseSpeedOffset: 0.4 },
  { driverNumber: 18, code: 'STR', name: 'Lance Stroll', team: 'Aston Martin', teamColor: '#229971', baseSpeedOffset: 0.2 },
  { driverNumber: 27, code: 'HUL', name: 'Nico Hulkenberg', team: 'Audi', teamColor: '#00E701', baseSpeedOffset: 0.1 },
  { driverNumber: 5, code: 'BOR', name: 'Gabriel Bortoleto', team: 'Audi', teamColor: '#00E701', baseSpeedOffset: -0.2 },
  { driverNumber: 31, code: 'OCO', name: 'Esteban Ocon', team: 'Haas', teamColor: '#B6BABD', baseSpeedOffset: -0.4 },
  { driverNumber: 87, code: 'BEA', name: 'Oliver Bearman', team: 'Haas', teamColor: '#B6BABD', baseSpeedOffset: -0.5 },
  { driverNumber: 7, code: 'DOO', name: 'Jack Doohan', team: 'Alpine', teamColor: '#FF87BC', baseSpeedOffset: -0.8 },
  { driverNumber: 2, code: 'SAR', name: 'Logan Sargeant', team: 'Cadillac Racing', teamColor: '#C0C0C0', baseSpeedOffset: -1.2 }
];

/**
 * Generate a synthetic live packet for a driver at elapsed race time in seconds
 */
export function generateSyntheticCarPacket(
  driver: RosterCar,
  elapsedSec: number,
  lapDurationSec: number = 88.0
): LiveCarTelemetryPacket {
  // Speed variations based on track position (straights vs corners)
  const cycleProgress = (elapsedSec % lapDurationSec) / lapDurationSec;
  const isStraight = cycleProgress < 0.25 || (cycleProgress > 0.45 && cycleProgress < 0.65) || cycleProgress > 0.85;

  const baseSpeed = isStraight ? 295 + driver.baseSpeedOffset * 4 : 115 + driver.baseSpeedOffset * 2;
  const speed = Math.max(70, Math.min(345, Math.round(baseSpeed + Math.sin(elapsedSec * 1.5) * 15)));

  const throttle = isStraight ? 100 : Math.round(35 + Math.sin(elapsedSec * 3) * 25);
  const brake = !isStraight && speed < 140 ? Math.round(75 + Math.cos(elapsedSec * 4) * 20) : 0;
  const gear = isStraight ? (speed > 280 ? 8 : 7) : (speed < 110 ? 3 : 4);
  const rpm = Math.round(9500 + (speed / 345) * 4500);

  // 2026 Active Aero & Overtake Mode
  const activeAero: 'straight' | 'corner' = isStraight ? 'straight' : 'corner';
  const overtakeMode = isStraight && driver.driverNumber <= 4;
  const drs = isStraight;

  // Sector assignment
  const sector: 1 | 2 | 3 = cycleProgress < 0.33 ? 1 : cycleProgress < 0.66 ? 2 : 3;

  return {
    timestamp: Math.round(elapsedSec * 1000),
    speed,
    throttle,
    brake,
    gear,
    rpm,
    drs,
    activeAero,
    overtakeMode,
    distanceRatio: Number(cycleProgress.toFixed(4)),
    sector
  };
}
