import { describe, it, expect } from 'vitest';
import {
  parseNaturalLanguageQuery,
  formatSqlWithBoundParamsForDisplay,
  DEFAULT_ENTITY_INDEX
} from '../nlParser';

describe('Natural Language Query Parser (nlParser)', () => {
  it('does not match common English words like best, long, hill, king as drivers', () => {
    const result = parseNaturalLanguageQuery('best race at silverstone', DEFAULT_ENTITY_INDEX);
    expect(result.matched).toBe(true);
    // Should match the circuit 'silverstone' rather than misinterpreting 'best' as a driver
    expect(result.params).toContain('silverstone');
    expect(result.params).not.toContain('graham-hill');
    expect(result.params).not.toContain('damon-hill');
  });

  it('extracts multiple entities simultaneously: driver, circuit, and year', () => {
    const query = 'How many times did Hamilton win at Silverstone in 2020?';
    const result = parseNaturalLanguageQuery(query, DEFAULT_ENTITY_INDEX);

    expect(result.matched).toBe(true);
    expect(result.sql).toContain('WHERE');
    expect(result.params).toContain('lewis-hamilton');
    expect(result.params).toContain('silverstone');
    expect(result.params).toContain(2020);
  });

  it('handles apostrophe and accented driver names safely with parameterized bindings', () => {
    const customIndex = {
      ...DEFAULT_ENTITY_INDEX,
      drivers: [
        ...DEFAULT_ENTITY_INDEX.drivers,
        {
          id: 'jerome-dambrosio',
          name: "Jérôme d'Ambrosio",
          surname: "d'Ambrosio",
          aliases: ["d'ambrosio", 'jerome dambrosio']
        }
      ]
    };

    const query = "Jérôme d'Ambrosio career stats";
    const result = parseNaturalLanguageQuery(query, customIndex);

    expect(result.matched).toBe(true);
    expect(result.params).toContain('jerome-dambrosio');
    // Ensure the generated SQL uses parameter placeholders, not raw unescaped string injection
    expect(result.sql).toContain('WHERE d.id = ?');
  });

  it('returns explicit unrecognized state with suggestions for nonsense queries', () => {
    const result = parseNaturalLanguageQuery('xyzzy gibberish 99999', DEFAULT_ENTITY_INDEX);

    expect(result.matched).toBe(false);
    expect(result.category).toBe('unrecognized');
    expect(result.title).toBe('Query Not Understood');
    expect(result.sql).toBe('');
    expect(result.params).toEqual([]);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions!.length).toBeGreaterThan(0);
  });

  it('formats SQL with bound parameters safely for display, escaping single quotes', () => {
    const sql = 'SELECT * FROM driver WHERE name = ? AND year = ?;';
    const params = ["O'Connor", 1995];
    const formatted = formatSqlWithBoundParamsForDisplay(sql, params);

    expect(formatted).toBe("SELECT * FROM driver WHERE name = 'O''Connor' AND year = 1995;");
  });
});
