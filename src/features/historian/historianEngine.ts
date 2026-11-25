/**
 * F1 // ARCHIVE — Race Historian Query Engine Facade
 * Provides clean async query execution over authentic SQLite-WASM and Tier 2 backend.
 * Zero hardcoded JSON datasets, zero mock results.
 */

import { HISTORIAN_PRESETS } from './presets';
import { parseNaturalLanguageQuery } from './nlParser';
import { sqlClient, type SqlQueryOptions } from './sqlClient';
import type { HistorianPreset, HistorianQueryResult, ParsedNaturalQuery, QueryResultColumn } from './types';

export { HISTORIAN_PRESETS };
export type { HistorianPreset, HistorianQueryResult, ParsedNaturalQuery, QueryResultColumn, SqlQueryOptions };

export async function executePreset(
  presetId: string,
  options: SqlQueryOptions = {}
): Promise<HistorianQueryResult> {
  const preset = HISTORIAN_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    throw new Error(`Historian preset '${presetId}' not found.`);
  }

  const result = await sqlClient.executeQuery(preset.sql, [], {
    ...options,
    naturalPrompt: preset.naturalPrompt
  });

  return {
    ...result,
    queryTitle: preset.title,
    explanation: preset.explanation,
    chartType: preset.chartType,
    columns: result.columns.length > 0 ? result.columns : preset.columns
  };
}

export async function executeRawSql(
  sql: string,
  options: SqlQueryOptions = {}
): Promise<HistorianQueryResult> {
  return sqlClient.executeQuery(sql, [], options);
}

export async function executeNaturalLanguageQuery(
  input: string,
  options: SqlQueryOptions = {}
): Promise<HistorianQueryResult> {
  const entities = await sqlClient.getEntityIndex();
  const parsed = parseNaturalLanguageQuery(input, entities);

  if (!parsed.matched || !parsed.sql) {
    return {
      status: 'unrecognized',
      queryTitle: parsed.title,
      explanation: parsed.explanation,
      sql: '',
      params: [],
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: 0,
      source: options.mode === 'tier2_backend' ? 'tier2_backend' : 'sqlite_wasm',
      chartType: 'table',
      suggestions: parsed.suggestions
    };
  }

  const result = await sqlClient.executeQuery(parsed.sql, parsed.params, {
    ...options,
    naturalPrompt: input
  });

  return {
    ...result,
    queryTitle: parsed.title,
    explanation: parsed.explanation,
    chartType: parsed.chartType
  };
}

// Backwards-compatible async alias
export const parseAndExecuteNaturalLanguageQuery = executeNaturalLanguageQuery;
