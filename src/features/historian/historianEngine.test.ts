import { describe, it, expect } from 'vitest';
import {
  HISTORIAN_PRESETS,
  parseAndExecuteNaturalLanguageQuery
} from './historianEngine';

describe('Explainable Race Historian Engine (Tier 1 Client Engine)', () => {
  it('contains at least 15 verified analytical presets with valid SQL and execution routines', () => {
    expect(HISTORIAN_PRESETS.length).toBeGreaterThanOrEqual(15);

    HISTORIAN_PRESETS.forEach(preset => {
      expect(preset.id).toBeTruthy();
      expect(preset.title).toBeTruthy();
      expect(preset.sql.trim().startsWith('SELECT')).toBe(true);
      expect(preset.explanation).toBeTruthy();

      const result = preset.run();
      expect(result.source).toBe('tier1_client');
      expect(result.columns.length).toBeGreaterThan(0);
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Natural Language & Entity Parser', () => {
    it('detects driver entities and synthesizes valid SQL profile queries', () => {
      const res = parseAndExecuteNaturalLanguageQuery('Tell me about Lewis Hamilton career stats');
      expect(res.sql).toContain('SELECT');
      expect(res.sql).toContain('Hamilton');
      expect(res.rows[0].driver).toContain('Hamilton');
      expect(res.columns.some(c => c.key === 'wins')).toBe(true);
    });

    it('detects constructor entities and synthesizes valid SQL heritage queries', () => {
      const res = parseAndExecuteNaturalLanguageQuery('Show me Ferrari championship history');
      expect(res.sql).toContain('SELECT');
      expect(res.sql).toContain('constructors');
      expect(res.rows[0].constructor).toContain('Ferrari');
      expect(Number(res.rows[0].championships)).toBeGreaterThanOrEqual(16);
    });

    it('detects circuit entities and synthesizes valid track dimension queries', () => {
      const res = parseAndExecuteNaturalLanguageQuery('How long is the Monza circuit?');
      expect(res.sql).toContain('circuits');
      expect(res.rows[0].circuit).toContain('Monza');
    });

    it('detects specific championship year entities', () => {
      const res = parseAndExecuteNaturalLanguageQuery('Who won the championship in 1988?');
      expect(res.sql).toContain('1988');
      expect(res.rows[0].year).toBe(1988);
    });

    it('falls back gracefully to verified presets on general or ambiguous queries without throwing', () => {
      const res = parseAndExecuteNaturalLanguageQuery('quantum mechanics of aerodynamics');
      expect(res).toBeDefined();
      expect(res.sql).toContain('SELECT');
      expect(res.rows.length).toBeGreaterThan(0);
    });
  });
});
