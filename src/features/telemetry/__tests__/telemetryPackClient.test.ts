import { describe, it, expect } from 'vitest';
import {
  TELEMETRY_PACK_CATALOG,
  getVisibleTelemetryPacks,
  fetchTelemetryCatalog,
  fetchTelemetryPack,
} from '../telemetryPackClient';

describe('Telemetry Pack Client & Provenance Quarantine', () => {
  it('hides experimental_simulation packs by default when includeExperimental is false', () => {
    const visible = getVisibleTelemetryPacks(TELEMETRY_PACK_CATALOG, false);
    expect(visible.some((p) => p.slug.includes('sim') || p.slug.includes('2026'))).toBe(false);
    expect(visible.every((p) => p.provenance === 'historical_verified')).toBe(true);
    expect(visible.length).toBe(5);
  });

  it('reveals experimental_simulation packs when includeExperimental is true', () => {
    const visible = getVisibleTelemetryPacks(TELEMETRY_PACK_CATALOG, true);
    expect(visible.some((p) => p.slug.includes('sim'))).toBe(true);
    const simPack = visible.find((p) => p.slug.includes('madrid-2026-sim'));
    expect(simPack).toBeDefined();
    expect(simPack?.provenance).toBe('experimental_simulation');
    expect(visible.length).toBe(6);
  });

  it('fetches real catalog via MSW and validates catalog schema', async () => {
    const catalog = await fetchTelemetryCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(6);
    const historical = getVisibleTelemetryPacks(catalog, false);
    expect(historical.length).toBe(5);
  });

  it('fetches real historical showdown pack via MSW with verified provenance', async () => {
    const pack = await fetchTelemetryPack('silverstone-2024-ham-vs-ver');
    expect(pack.slug).toBe('silverstone-2024-ham-vs-ver');
    expect((pack as Record<string, unknown>).driverACode).toBeUndefined(); // top-level has driverA object
    expect(pack.driverA.driverCode).toBe('HAM');
    expect(pack.driverB.driverCode).toBe('VER');
    expect(pack.provenance).toBe('historical_verified');
    expect(pack.driverA.samples.length).toBeGreaterThan(100);
  });

  it('fetches simulated 2026 showdown pack and tags with experimental_simulation', async () => {
    const pack = await fetchTelemetryPack('madrid-2026-sim-alo-vs-sai');
    expect(pack.slug).toBe('madrid-2026-sim-alo-vs-sai');
    expect(pack.driverA.driverCode).toBe('ALO');
    expect(pack.driverB.driverCode).toBe('SAI');
    expect(pack.provenance).toBe('experimental_simulation');
  });

  it('throws a descriptive error when pack does not exist', async () => {
    await expect(fetchTelemetryPack('non-existent-pack')).rejects.toThrow(
      /Failed to load telemetry pack 'non-existent-pack'/
    );
  });
});
