export type ColumnType = 'string' | 'number' | 'percentage' | 'boolean' | 'text';

export interface QueryResultColumn {
  key: string;
  label: string;
  type: ColumnType;
}

export type QuerySource = 'sqlite_wasm' | 'tier2_backend' | 'offline_worker';

export interface HistorianQueryResult {
  status: 'ok' | 'unrecognized' | 'error';
  queryTitle: string;
  explanation: string;
  sql: string;
  params?: (string | number)[];
  columns: QueryResultColumn[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
  source: QuerySource;
  chartType: 'bar' | 'table' | 'line';
  suggestions?: string[];
  truncated?: boolean;
}

export interface HistorianPreset {
  id: string;
  title: string;
  naturalPrompt: string;
  category: 'drivers' | 'constructors' | 'circuits' | 'championships' | 'historical_records';
  sql: string;
  explanation: string;
  chartType: 'bar' | 'table' | 'line';
  columns: QueryResultColumn[];
}

export interface DriverEntity {
  id: string;
  name: string;
  surname: string;
  aliases?: string[];
}

export interface ConstructorEntity {
  id: string;
  name: string;
  aliases?: string[];
}

export interface CircuitEntity {
  id: string;
  name: string;
  aliases?: string[];
}

export interface EntityIndex {
  drivers: DriverEntity[];
  constructors: ConstructorEntity[];
  circuits: CircuitEntity[];
}

export interface ParsedNaturalQuery {
  matched: boolean;
  title: string;
  explanation: string;
  sql: string;
  params: (string | number)[];
  category: string;
  chartType: 'bar' | 'table' | 'line';
  suggestions?: string[];
}
