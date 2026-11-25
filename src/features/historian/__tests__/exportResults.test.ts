import { describe, it, expect } from 'vitest';
import {
  serializeResultsToCsv,
  serializeResultsToJson,
  triggerBlobDownload
} from '../utils/exportResults';
import type { HistorianQueryResult, QueryResultColumn } from '../types';

describe('Query Results Exporter (exportResults)', () => {
  it('serializes results to RFC 4180 compliant CSV', () => {
    const columns: QueryResultColumn[] = [
      { key: 'driver', label: 'DRIVER', type: 'string' },
      { key: 'wins', label: 'WINS', type: 'number' },
      { key: 'notes', label: 'NOTES', type: 'string' }
    ];

    const rows = [
      { driver: 'Lewis Hamilton', wins: 103, notes: 'Great champion, "legend"' },
      { driver: 'Michael Schumacher', wins: 91, notes: 'Seven-time\nChampion' }
    ];

    const csv = serializeResultsToCsv(columns, rows);
    const lines = csv.split('\r\n');

    expect(lines[0]).toBe('"DRIVER","WINS","NOTES"');
    // Double quotes should be escaped as ""
    expect(lines[1]).toBe('"Lewis Hamilton",103,"Great champion, ""legend"""');
    // Multiline entries should be quoted
    expect(lines[2]).toContain('"Seven-time\nChampion"');
  });

  it('neutralizes spreadsheet formula injection in CSV exports', () => {
    const columns: QueryResultColumn[] = [
      { key: 'text', label: 'TEXT', type: 'string' },
      { key: 'num', label: 'NUM', type: 'number' }
    ];

    const rows = [
      { text: '=SUM(1,2)', num: -42 },
      { text: '+cmd|"/c calc"!A0', num: 100 },
      { text: '-exec|"/c notepad"!A0', num: -1.5 },
      { text: '@something', num: 0 }
    ];

    const csv = serializeResultsToCsv(columns, rows);

    // Formula prefix cells should have leading single quote prepended
    expect(csv).toContain('"\'=SUM(1,2)"');
    expect(csv).toContain('"\'+cmd|""/c calc""!A0"');
    expect(csv).toContain('"\' -exec|""/c notepad""!A0"'.replace(' -', '-'));
    expect(csv).toContain('"\'@something"');

    // Negative numbers should NOT be prefixed with a single quote
    expect(csv).toContain(',-42');
    expect(csv).toContain(',-1.5');
  });

  it('serializes results to structured JSON with metadata', () => {
    const mockResult: HistorianQueryResult = {
      status: 'ok',
      queryTitle: 'Top Winners',
      explanation: 'All-time leaders.',
      sql: 'SELECT * FROM driver;',
      params: [],
      source: 'sqlite_wasm',
      chartType: 'table',
      rowCount: 1,
      executionTimeMs: 12.5,
      columns: [{ key: 'name', label: 'NAME', type: 'string' }],
      rows: [{ name: 'Lewis Hamilton' }]
    };

    const jsonStr = serializeResultsToJson(mockResult);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.title).toBe('Top Winners');
    expect(parsed.sql).toBe('SELECT * FROM driver;');
    expect(parsed.rowCount).toBe(1);
    expect(parsed.rows[0].name).toBe('Lewis Hamilton');
  });

  it('triggerBlobDownload runs safely without throwing', () => {
    expect(() => {
      triggerBlobDownload('test,content', 'test.csv', 'text/csv');
    }).not.toThrow();
  });
});
