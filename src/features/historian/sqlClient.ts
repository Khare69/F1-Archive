/**
 * F1 // ARCHIVE — SQLite Client Interface
 * Coordinates Web Worker execution (Tier 1 SQLite-WASM), 3-second query timeout,
 * and optional Tier 2 FastAPI microservice routing.
 */

import type { EntityIndex, HistorianQueryResult, QueryResultColumn, QuerySource } from './types';
import type { WorkerInMessage, WorkerOutMessage } from './sqliteWorker';
import { DEFAULT_ENTITY_INDEX } from './nlParser';

export interface SqlQueryOptions {
  mode?: 'sqlite_wasm' | 'tier2_backend';
  maxRows?: number;
  naturalPrompt?: string;
}

class SqlClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: WorkerOutMessage) => void;
      reject: (reason: Error) => void;
      timeoutId: ReturnType<typeof setTimeout>;
    }
  >();
  private requestCounter = 0;
  private cachedEntities: EntityIndex | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private nodeDbInstance: any = null;
  private nodeInitPromise: Promise<void> | null = null;

  private isNodeEnv(): boolean {
    return typeof Worker === 'undefined';
  }

  private async initNodeEnvironment(): Promise<void> {
    if (this.nodeDbInstance) return;
    if (this.nodeInitPromise) return this.nodeInitPromise;

    this.nodeInitPromise = (async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const sqlite3Init = (await import('@sqlite.org/sqlite-wasm')).default;
      const sqlite3 = await sqlite3Init();

      const possiblePaths = [
        path.resolve(process.cwd(), 'public', 'data', 'f1db-browser.sqlite'),
        path.resolve(process.cwd(), '..', 'public', 'data', 'f1db-browser.sqlite')
      ];

      let dbFile = '';
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          dbFile = p;
          break;
        }
      }

      if (!dbFile) {
        throw new Error(`f1db-browser.sqlite not found for Node test runner in ${possiblePaths.join(' or ')}`);
      }

      const buf = fs.readFileSync(dbFile);
      const u8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      const ptr = sqlite3.wasm.allocFromTypedArray(u8);
      const db = new sqlite3.oo1.DB();

      const rc = sqlite3.capi.sqlite3_deserialize(
        db,
        'main',
        ptr,
        u8.byteLength,
        u8.byteLength,
        sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_READONLY
      );

      if (rc !== 0) {
        throw new Error(`sqlite3_deserialize failed in Node with code ${rc}`);
      }

      db.exec('PRAGMA query_only = ON;');
      this.nodeDbInstance = db;
    })();

    return this.nodeInitPromise;
  }

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./sqliteWorker.ts', import.meta.url), {
        type: 'module'
      });

      this.worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
        const msg = event.data;
        if ('requestId' in msg && msg.requestId) {
          const pending = this.pendingRequests.get(msg.requestId);
          if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingRequests.delete(msg.requestId);
            if (msg.type === 'ERROR') {
              pending.reject(new Error(msg.error));
            } else {
              pending.resolve(msg);
            }
          }
        }
      };

      this.worker.onerror = (err) => {
        console.error('[SqlClient] Web Worker error:', err);
        this.terminateWorker('Web Worker encountered an unexpected error.');
      };

      // Trigger eager initialization
      this.worker.postMessage({ type: 'INIT', dbUrl: '/data/f1db-browser.sqlite' } satisfies WorkerInMessage);
    }
    return this.worker;
  }

  private terminateWorker(reason: string) {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    for (const [, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error(reason));
    }
    this.pendingRequests.clear();
  }

  public async initDatabase(): Promise<void> {
    if (this.isNodeEnv()) {
      await this.initNodeEnvironment();
      return;
    }
    this.getWorker();
  }

  public async executeQuery(
    sql: string,
    params: (string | number)[] = [],
    options: SqlQueryOptions = {}
  ): Promise<HistorianQueryResult> {
    const { mode = 'sqlite_wasm', maxRows = 200, naturalPrompt } = options;

    // Optional Tier-2 Backend Execution
    if (mode === 'tier2_backend') {
      const backendUrl = import.meta.env?.VITE_HISTORIAN_API_URL;
      if (backendUrl) {
        try {
          return await this.executeTier2Query(backendUrl, sql, naturalPrompt, maxRows);
        } catch (err) {
          console.warn('[SqlClient] Tier 2 backend failed, falling back to SQLite-WASM:', err);
        }
      }
    }

    // Direct in-process execution in Node / Vitest environment (Strictly unmocked)
    if (this.isNodeEnv()) {
      return this.executeNodeQuery(sql, params, maxRows, naturalPrompt);
    }

    // Web Worker Execution with 3,000 ms execution cap
    const worker = this.getWorker();
    const requestId = `req_${++this.requestCounter}_${Date.now()}`;

    return new Promise<HistorianQueryResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        this.terminateWorker('Query execution timed out (exceeded 3,000 ms execution cap).');
        reject(new Error('Query execution timed out (exceeded 3,000 ms execution cap).'));
      }, 3000);

      this.pendingRequests.set(requestId, {
        resolve: (msg) => {
          if (msg.type === 'RESULT') {
            resolve({
              status: 'ok',
              queryTitle: naturalPrompt || 'Custom SQL Query',
              explanation: 'Executed verbatim in browser via SQLite-WASM Web Worker.',
              sql,
              params,
              columns: msg.columns,
              rows: msg.rows,
              rowCount: msg.rowCount,
              executionTimeMs: msg.executionTimeMs,
              source: 'sqlite_wasm',
              chartType: 'table',
              truncated: msg.truncated
            });
          } else {
            reject(new Error(`Unexpected worker message: ${msg.type}`));
          }
        },
        reject,
        timeoutId
      });

      worker.postMessage({
        type: 'QUERY',
        requestId,
        sql,
        params,
        maxRows
      } satisfies WorkerInMessage);
    });
  }

  private async executeNodeQuery(
    sql: string,
    params: (string | number)[],
    maxRows: number,
    naturalPrompt?: string
  ): Promise<HistorianQueryResult> {
    await this.initNodeEnvironment();
    const startTime = performance.now();
    const cleanSql = sql.trim();
    const stmt = this.nodeDbInstance.prepare(cleanSql);

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
        status: 'ok',
        queryTitle: naturalPrompt || 'Custom SQL Query',
        explanation: 'Executed verbatim via SQLite-WASM.',
        sql,
        params,
        columns,
        rows,
        rowCount: rows.length,
        executionTimeMs,
        source: 'sqlite_wasm',
        chartType: 'table',
        truncated
      };
    } finally {
      stmt.finalize();
    }
  }

  private async executeTier2Query(
    backendUrl: string,
    sql: string,
    naturalPrompt?: string,
    maxRows: number = 200
  ): Promise<HistorianQueryResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`${backendUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          query: sql,
          natural_prompt: naturalPrompt,
          max_rows: maxRows
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || `Backend returned HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        status: 'ok',
        queryTitle: naturalPrompt || 'Backend SQL Query',
        explanation: 'Executed via FastAPI microservice over F1DB SQLite.',
        sql,
        columns: data.columns,
        rows: data.rows,
        rowCount: data.rowCount,
        executionTimeMs: data.executionTimeMs,
        source: 'tier2_backend' as QuerySource,
        chartType: 'table',
        truncated: data.truncated
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async getEntityIndex(): Promise<EntityIndex> {
    if (this.cachedEntities) {
      return this.cachedEntities;
    }

    if (this.isNodeEnv()) {
      this.cachedEntities = DEFAULT_ENTITY_INDEX;
      return this.cachedEntities;
    }

    const worker = this.getWorker();
    const requestId = `ent_${++this.requestCounter}_${Date.now()}`;

    try {
      const entities = await new Promise<EntityIndex>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this.pendingRequests.delete(requestId);
          resolve(DEFAULT_ENTITY_INDEX);
        }, 2000);

        this.pendingRequests.set(requestId, {
          resolve: (msg) => {
            if (msg.type === 'ENTITIES_RESULT') {
              resolve(msg.entities);
            } else {
              resolve(DEFAULT_ENTITY_INDEX);
            }
          },
          reject,
          timeoutId
        });

        worker.postMessage({ type: 'ENTITIES', requestId } satisfies WorkerInMessage);
      });

      this.cachedEntities = entities;
      return entities;
    } catch {
      return DEFAULT_ENTITY_INDEX;
    }
  }
}

export const sqlClient = new SqlClient();
