import { describe, it, expect, beforeAll } from 'vitest';
import { HISTORIAN_PRESETS } from '../presets';
import { sqlClient } from '../sqlClient';

describe('Historian Analytical SQL Presets (Zero-Mock Real SQLite)', () => {
  beforeAll(async () => {
    await sqlClient.initDatabase();
  });

  it('contains exactly 16 verified analytical presets', () => {
    expect(HISTORIAN_PRESETS.length).toBe(16);
  });

  for (const preset of HISTORIAN_PRESETS) {
    it(`executes preset "${preset.id}" against real SQLite with rowCount > 0 and 0 errors`, async () => {
      const result = await sqlClient.executeQuery(preset.sql);
      expect(result.status).toBe('ok');
      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.columns.length).toBeGreaterThan(0);
    });
  }

  it('verifies monza-past-winners: Schumacher and Hamilton both lead all-time with 5 wins', async () => {
    const monzaPreset = HISTORIAN_PRESETS.find((p) => p.id === 'monza-past-winners');
    expect(monzaPreset).toBeDefined();
    const result = await sqlClient.executeQuery(monzaPreset!.sql);

    expect(result.status).toBe('ok');
    const schumacher = result.rows.find((r) => String(r.driver).includes('Schumacher'));
    const hamilton = result.rows.find((r) => String(r.driver).includes('Hamilton'));

    expect(schumacher).toBeDefined();
    expect(Number(schumacher?.wins)).toBe(5);
    expect(hamilton).toBeDefined();
    expect(Number(hamilton?.wins)).toBe(5);
  });

  it('verifies most-poles-history: pole_to_win_pct is bounded between 0% and 100%', async () => {
    const polesPreset = HISTORIAN_PRESETS.find((p) => p.id === 'most-poles-history');
    expect(polesPreset).toBeDefined();
    const result = await sqlClient.executeQuery(polesPreset!.sql);

    expect(result.status).toBe('ok');
    expect(result.rows.length).toBeGreaterThan(0);
    for (const row of result.rows) {
      const pct = Number(row.pole_to_win_pct);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it('verifies circuit-elevation-extremes: strictly descending and Spa delta > 80m', async () => {
    const elevPreset = HISTORIAN_PRESETS.find((p) => p.id === 'circuit-elevation-extremes');
    expect(elevPreset).toBeDefined();
    const result = await sqlClient.executeQuery(elevPreset!.sql);

    expect(result.status).toBe('ok');
    expect(result.rows.length).toBeGreaterThan(0);

    let prevDelta = Number.POSITIVE_INFINITY;
    for (const row of result.rows) {
      const delta = Number(row.elevation_change_m);
      expect(delta).toBeLessThanOrEqual(prevDelta);
      prevDelta = delta;
    }

    const spa = result.rows.find((r) => String(r.circuit).includes('Spa'));
    expect(spa).toBeDefined();
    expect(Number(spa?.elevation_change_m)).toBeGreaterThan(80);
  });

  it('verifies seasons-decade-summary: covers decades from 1950s through 2020s', async () => {
    const decadePreset = HISTORIAN_PRESETS.find((p) => p.id === 'seasons-decade-summary');
    expect(decadePreset).toBeDefined();
    const result = await sqlClient.executeQuery(decadePreset!.sql);

    expect(result.status).toBe('ok');
    const decades = result.rows.map((r) => String(r.decade));
    expect(decades).toContain('1950s');
    expect(decades).toContain('2020s');
  });
});
