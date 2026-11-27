/**
 * F1 // ARCHIVE — ETL Domain Invariant & Security Unit Tests
 */

import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import AdmZip from 'adm-zip';
import { validateAndExtractZip } from '../extract';
import { TEAM_CONFIGS, normalizeTeamId } from '../transform';
import { CircuitSchema, DriverSchema, ConstructorSchema } from '../validate';

describe('ETL Security & Zip-Slip Protection', () => {
  it('should detect and reject zip entries with path traversal (zip-slip)', () => {
    const tempZipPath = path.join(__dirname, 'test-malicious.zip');
    const extractDest = path.join(__dirname, 'test-extract-dest');

    try {
      // Build a test zip with malicious entry
      const zip = new AdmZip();
      zip.addFile('normal.txt', Buffer.from('malicious payload'));
      zip.getEntries()[0].entryName = '../evil.txt';
      zip.writeZip(tempZipPath);

      expect(() => {
        validateAndExtractZip(tempZipPath, extractDest);
      }).toThrow(/Zip-slip directory traversal attack detected/);
    } finally {
      if (fs.existsSync(tempZipPath)) fs.unlinkSync(tempZipPath);
      if (fs.existsSync(extractDest)) fs.rmSync(extractDest, { recursive: true, force: true });
    }
  });
});

describe('TEAM_CONFIGS Registry Integrity', () => {
  it('should have strictly unique canonical team keys with no duplicates or aliases', () => {
    const keys = Object.keys(TEAM_CONFIGS);
    const keySet = new Set(keys);
    expect(keys.length).toBe(keySet.size);

    // Verify alias duplicates are gone
    expect(keys).not.toContain('red-bull');
    expect(keys).not.toContain('aston-martin');
    expect(keys).not.toContain('racing-bulls');
  });

  it('should canonicalize all legacy team alias strings cleanly', () => {
    expect(normalizeTeamId('red-bull')).toBe('redbull');
    expect(normalizeTeamId('aston-martin')).toBe('astonmartin');
    expect(normalizeTeamId('racing-bulls')).toBe('rb');
    expect(normalizeTeamId('stake-f1')).toBe('sauber');
  });
});

describe('Zod Schema Boundary Checks', () => {
  it('should validate standard circuit objects and reject invalid types', () => {
    const validCircuit = {
      id: 'spa-francorchamps',
      name: 'Circuit de Spa-Francorchamps',
      country: 'BEL',
      city: 'Stavelot',
      lengthKm: '7.004 km',
      turns: 19,
      lapRecord: '1:46.286',
      lapRecordHolder: 'Valtteri Bottas',
      firstGP: 1950,
      drsZones: 2,
      elevation: '+102.5m',
      type: 'Permanent',
      totalRaces: 56,
      poleToWinRate: 41.2,
      poleToWinCount: 23,
      racesWithRecordedPole: 56,
      pastWinners: []
    };

    expect(() => CircuitSchema.parse(validCircuit)).not.toThrow();

    const invalidCircuit = { ...validCircuit, poleToWinCount: 'not-a-number' };
    expect(() => CircuitSchema.parse(invalidCircuit)).toThrow();
  });

  it('should validate driver models with pointsSharePct boundaries [0, 100]', () => {
    const validDriver = {
      id: 'VER',
      slug: 'max-verstappen',
      code: 'VER',
      name: 'Max Verstappen',
      fullName: 'Max Verstappen',
      number: 1,
      country: 'NLD',
      wins: 63,
      podiums: 111,
      championships: 4,
      polePositions: 40,
      fastestLaps: 33,
      starts: 209,
      pointsSharePct: 78.5,
      isLegend: true,
      isActive2026: true,
      raceFinishes: []
    };

    expect(() => DriverSchema.parse(validDriver)).not.toThrow();

    const invalidDriver = { ...validDriver, pointsSharePct: 150 };
    expect(() => DriverSchema.parse(invalidDriver)).toThrow();
  });
});
