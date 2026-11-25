/**
 * F1 // ARCHIVE — Dedicated SQLite-WASM Web Worker
 * Executes real, read-only SQL queries over public/data/f1db-browser.sqlite in background thread.
 */

import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { QueryResultColumn } from './types';

export type WorkerInMessage =
  | { type: 'INIT'; dbUrl?: string }
  | { type: 'QUERY'; requestId: string; sql: string; params?: (string | number)[]; maxRows?: number }
  | { type: 'ENTITIES'; requestId?: string };

export type WorkerOutMessage =
  | { type: 'READY'; tableCount: number; loadTimeMs: number }
  | {
      type: 'RESULT';
      requestId: string;
      columns: QueryResultColumn[];
      rows: Record<string, unknown>[];
      rowCount: number;
      truncated: boolean;
      executionTimeMs: number;
    }
  | { type: 'ERROR'; requestId: string; error: string }
  | {
      type: 'ENTITIES_RESULT';
      requestId?: string;
      entities: {
        drivers: Array<{ id: string; name: string; surname: string; aliases?: string[] }>;
        constructors: Array<{ id: string; name: string; aliases?: string[] }>;
        circuits: Array<{ id: string; name: string; aliases?: string[] }>;
      };
    };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlite3Instance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbInstance: any = null;
let initPromise: Promise<void> | null = null;

async function initDatabase(dbUrl: string = '/data/f1db-browser.sqlite'): Promise<{ tableCount: number; loadTimeMs: number }> {
  const startTime = performance.now();

  if (!sqlite3Instance) {
    sqlite3Instance = await sqlite3InitModule();
  }

  const response = await fetch(dbUrl);
  if (!response.ok) {
    throw new Error(`Failed to download database from ${dbUrl}: HTTP ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const u8Array = new Uint8Array(arrayBuffer);

  const ptr = sqlite3Instance.wasm.allocFromTypedArray(u8Array);
  const db = new sqlite3Instance.oo1.DB();

  const rc = sqlite3Instance.capi.sqlite3_deserialize(
    db,
    'main',
    ptr,
    u8Array.byteLength,
    u8Array.byteLength,
    sqlite3Instance.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3Instance.capi.SQLITE_DESERIALIZE_READONLY
  );

  if (rc !== 0) {
    throw new Error(`sqlite3_deserialize failed with code ${rc}`);
  }

  // Security Pragma
  db.exec('PRAGMA query_only = ON;');
  dbInstance = db;

  let tableCount = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db.exec({
    sql: "SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type = 'table';",
    rowMode: 'object',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (row: any) => {
      tableCount = Number(row.cnt || 0);
    }
  });

  const loadTimeMs = Math.round(performance.now() - startTime);
  return { tableCount, loadTimeMs };
}

function executeQuery(
  sql: string,
  params: (string | number)[] = [],
  maxRows: number = 200
): {
  columns: QueryResultColumn[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
  executionTimeMs: number;
} {
  if (!dbInstance) {
    throw new Error('Database is not initialized.');
  }

  const cleanSql = sql.trim();
  const normalizedStart = cleanSql.toUpperCase();
  if (!normalizedStart.startsWith('SELECT') && !normalizedStart.startsWith('WITH')) {
    throw new Error('Only read-only SELECT or WITH statements are permitted.');
  }

  const startTime = performance.now();
  const stmt = dbInstance.prepare(cleanSql);

  try {
    if (params.length > 0) {
      stmt.bind(params);
    }

    const columnNames: string[] = stmt.getColumnNames();
    const columns: QueryResultColumn[] = columnNames.map((name: string) => ({
      key: name,
      label: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      type: 'text'
    }));

    const rows: Record<string, unknown>[] = [];
    let count = 0;
    const fetchLimit = maxRows + 1;

    while (stmt.step()) {
      count++;
      if (count > maxRows) {
        break;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rowObj: Record<string, any> = stmt.get({});
      for (const col of columns) {
        const val = rowObj[col.key];
        if (val !== undefined && val !== null) {
          if (typeof val === 'boolean') {
            col.type = 'boolean';
          } else if (typeof val === 'number' && col.type !== 'boolean') {
            col.type = 'number';
          }
        }
      }
      rows.push(rowObj);
    }

    const truncated = count > maxRows;
    const executionTimeMs = Math.round(performance.now() - startTime);

    return {
      columns,
      rows,
      rowCount: rows.length,
      truncated,
      executionTimeMs
    };
  } finally {
    stmt.finalize();
  }
}

function getEntityIndex(): {
  drivers: Array<{ id: string; name: string; surname: string; aliases?: string[] }>;
  constructors: Array<{ id: string; name: string; aliases?: string[] }>;
  circuits: Array<{ id: string; name: string; aliases?: string[] }>;
} {
  if (!dbInstance) {
    throw new Error('Database is not initialized.');
  }

  const drivers: Array<{ id: string; name: string; surname: string; aliases?: string[] }> = [];
  dbInstance.exec({
    sql: 'SELECT id, name, last_name AS surname FROM driver ORDER BY total_race_wins DESC;',
    rowMode: 'object',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (r: any) => {
      drivers.push({
        id: r.id,
        name: r.name,
        surname: r.surname || r.name.split(' ').pop() || '',
        aliases: [r.id]
      });
    }
  });

  const constructors: Array<{ id: string; name: string; aliases?: string[] }> = [];
  dbInstance.exec({
    sql: 'SELECT id, name FROM constructor ORDER BY total_race_wins DESC;',
    rowMode: 'object',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (r: any) => {
      constructors.push({ id: r.id, name: r.name, aliases: [r.id] });
    }
  });

  const circuits: Array<{ id: string; name: string; aliases?: string[] }> = [];
  dbInstance.exec({
    sql: 'SELECT id, name FROM circuit ORDER BY total_races_held DESC;',
    rowMode: 'object',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (r: any) => {
      circuits.push({ id: r.id, name: r.name, aliases: [r.id] });
    }
  });

  return { drivers, constructors, circuits };
}

self.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const data = event.data;

  try {
    if (data.type === 'INIT') {
      if (!initPromise) {
        initPromise = (async () => {
          const res = await initDatabase(data.dbUrl);
          self.postMessage({
            type: 'READY',
            tableCount: res.tableCount,
            loadTimeMs: res.loadTimeMs
          } satisfies WorkerOutMessage);
        })();
      }
      await initPromise;
    } else if (data.type === 'QUERY') {
      if (!dbInstance) {
        if (!initPromise) {
          initPromise = (async () => {
            await initDatabase();
          })();
        }
        await initPromise;
      }

      const res = executeQuery(data.sql, data.params, data.maxRows || 200);
      self.postMessage({
        type: 'RESULT',
        requestId: data.requestId,
        columns: res.columns,
        rows: res.rows,
        rowCount: res.rowCount,
        truncated: res.truncated,
        executionTimeMs: res.executionTimeMs
      } satisfies WorkerOutMessage);
    } else if (data.type === 'ENTITIES') {
      if (!dbInstance) {
        if (!initPromise) {
          initPromise = (async () => {
            await initDatabase();
          })();
        }
        await initPromise;
      }

      const entities = getEntityIndex();
      self.postMessage({
        type: 'ENTITIES_RESULT',
        requestId: data.requestId,
        entities
      } satisfies WorkerOutMessage);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const reqId = 'requestId' in data && data.requestId ? data.requestId : 'init';
    self.postMessage({
      type: 'ERROR',
      requestId: reqId,
      error: errorMsg
    } satisfies WorkerOutMessage);
  }
};
