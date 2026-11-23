import { describe, it, expect } from 'vitest';
import {
  LiveTelemetryRingBuffer,
  MultiCarStreamManager,
  generateSyntheticCarPacket,
  GRAND_PRIX_GRID,
  type LiveCarTelemetryPacket
} from './liveStreamEngine';

describe('Multi-Car Timing Stream & Ring Buffer Engine', () => {
  it('pushes packets to single driver ring buffer and caps at capacity', () => {
    const buffer = new LiveTelemetryRingBuffer(5);

    for (let i = 1; i <= 8; i++) {
      buffer.push({
        timestamp: i * 1000,
        speed: 200 + i * 10,
        throttle: 100,
        brake: 0,
        gear: 7,
        rpm: 11000,
        drs: true,
        activeAero: 'straight',
        overtakeMode: false,
        distanceRatio: i * 0.1,
        sector: 1
      });
    }

    expect(buffer.getCount()).toBe(5);
    const latest = buffer.getLatest();
    expect(latest?.timestamp).toBe(8000);
    expect(latest?.speed).toBe(280);
  });

  it('performs two-sample linear interpolation accurately between discrete telemetry packets', () => {
    const buffer = new LiveTelemetryRingBuffer(10);

    const packetA: LiveCarTelemetryPacket = {
      timestamp: 1000,
      speed: 200,
      throttle: 80,
      brake: 0,
      gear: 6,
      rpm: 10000,
      drs: false,
      activeAero: 'corner',
      overtakeMode: false,
      distanceRatio: 0.1,
      sector: 1
    };

    const packetB: LiveCarTelemetryPacket = {
      timestamp: 2000,
      speed: 300,
      throttle: 100,
      brake: 0,
      gear: 7,
      rpm: 12000,
      drs: true,
      activeAero: 'straight',
      overtakeMode: true,
      distanceRatio: 0.2,
      sector: 1
    };

    buffer.push(packetA);
    buffer.push(packetB);

    // Exact midpoint: alpha = 0.5
    const midpoint = buffer.interpolate(1500);
    expect(midpoint).not.toBeNull();
    expect(midpoint?.speed).toBe(250);
    expect(midpoint?.throttle).toBe(90);
    expect(midpoint?.rpm).toBe(11000);
    expect(midpoint?.distanceRatio).toBeCloseTo(0.15);

    // Quarter point: alpha = 0.25
    const quarter = buffer.interpolate(1250);
    expect(quarter?.speed).toBe(225);
    expect(quarter?.activeAero).toBe('corner');

    // Three-quarter point: alpha = 0.75
    const threeQuarter = buffer.interpolate(1750);
    expect(threeQuarter?.speed).toBe(275);
    expect(threeQuarter?.activeAero).toBe('straight');
    expect(threeQuarter?.overtakeMode).toBe(true);
  });

  it('manages separate isolated ring buffers for each driver number', () => {
    const manager = new MultiCarStreamManager();

    // Driver 1 (Verstappen)
    manager.ingest(1, {
      timestamp: 1000,
      speed: 310,
      throttle: 100,
      brake: 0,
      gear: 8,
      rpm: 12500,
      drs: true,
      activeAero: 'straight',
      overtakeMode: true,
      distanceRatio: 0.55,
      sector: 2
    });

    // Driver 44 (Hamilton)
    manager.ingest(44, {
      timestamp: 1000,
      speed: 305,
      throttle: 98,
      brake: 0,
      gear: 8,
      rpm: 12400,
      drs: true,
      activeAero: 'straight',
      overtakeMode: false,
      distanceRatio: 0.53,
      sector: 2
    });

    const activeDrivers = manager.getActiveDriverNumbers();
    expect(activeDrivers).toContain(1);
    expect(activeDrivers).toContain(44);

    const verLatest = manager.getBuffer(1).getLatest();
    const hamLatest = manager.getBuffer(44).getLatest();

    expect(verLatest?.speed).toBe(310);
    expect(hamLatest?.speed).toBe(305);
    expect(verLatest?.overtakeMode).toBe(true);
    expect(hamLatest?.overtakeMode).toBe(false);
  });

  it('generates valid synthetic packets for full 20-car grid', () => {
    expect(GRAND_PRIX_GRID.length).toBe(20);

    const sampleDriver = GRAND_PRIX_GRID[0]; // Verstappen #1
    const packet = generateSyntheticCarPacket(sampleDriver, 25.4);

    expect(packet.speed).toBeGreaterThanOrEqual(70);
    expect(packet.speed).toBeLessThanOrEqual(350);
    expect(packet.distanceRatio).toBeGreaterThanOrEqual(0);
    expect(packet.distanceRatio).toBeLessThanOrEqual(1);
    expect(['straight', 'corner']).toContain(packet.activeAero);
  });
});
