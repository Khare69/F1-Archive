import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Download, ExternalLink, Database, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { useInspectQuery } from '../../contexts/InspectQueryContext';
import { SqlEditorPane } from '../../features/historian/components/SqlEditorPane';
import { sqlClient } from '../../features/historian/sqlClient';
import type { HistorianQueryResult } from '../../features/historian/types';
import {
  serializeResultsToCsv,
  serializeResultsToJson,
  triggerBlobDownload,
} from '../../features/historian/utils/exportResults';

export const InspectQueryDrawer: React.FC = () => {
  const { isOpen, activeQuery, closeQuery } = useInspectQuery();
  const navigate = useNavigate();

  const [sqlText, setSqlText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<HistorianQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeSql = useCallback(async (queryToRun: string) => {
    if (!queryToRun.trim()) return;
    setIsRunning(true);
    setError(null);

    try {
      const res = await sqlClient.executeQuery(queryToRun, [], { maxRows: 50 });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SQL query execution failed');
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Update SQL and execute on drawer open with new activeQuery
  useEffect(() => {
    if (isOpen && activeQuery?.sql) {
      setSqlText(activeQuery.sql);
      executeSql(activeQuery.sql);
    }
  }, [isOpen, activeQuery, executeSql]);

  const handleExportCsv = () => {
    if (!result || !result.columns.length) return;
    const csv = serializeResultsToCsv(result.columns, result.rows);
    const safeTitle = (activeQuery?.title || 'inspect_query')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');
    triggerBlobDownload(csv, `${safeTitle}_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportJson = () => {
    if (!result) return;
    const json = serializeResultsToJson(result);
    const safeTitle = (activeQuery?.title || 'inspect_query')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');
    triggerBlobDownload(json, `${safeTitle}_${Date.now()}.json`, 'application/json;charset=utf-8;');
  };

  const handleOpenInHistorian = () => {
    closeQuery();
    navigate('/historian');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeQuery()}>
      <DialogContent
        data-testid="inspect-query-drawer"
        className="fixed right-0 top-0 bottom-0 left-auto h-full w-full max-w-2xl bg-[#0B0E14] border-l border-white/10 shadow-2xl p-0 flex flex-col z-50 rounded-none sm:rounded-none animate-in slide-in-from-right duration-200"
      >
        <DialogTitle className="sr-only">
          {activeQuery?.title || 'Inspect SQL Query'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          View and execute SQLite queries against browser F1DB database
        </DialogDescription>

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#11151E]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-crimson" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-crimson font-bold uppercase">
                  DEV // SQL INSPECTOR
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/8 text-neutral-400">
                  SQLite-WASM
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                {activeQuery?.title || 'Underlying Database Query'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={closeQuery}
            aria-label="Close inspector drawer"
            className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CodeMirror 6 Editor Container */}
        <div className="border-b border-white/10 bg-[#090B10]">
          <SqlEditorPane
            value={sqlText}
            onChange={setSqlText}
            onRun={executeSql}
            isRunning={isRunning}
            executionTimeMs={result?.executionTimeMs}
            rowCount={result?.rowCount}
            errorMessage={error}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#11151E] text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => executeSql(sqlText)}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-crimson hover:bg-crimson/90 disabled:opacity-50 text-white font-bold transition-colors"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>{isRunning ? 'RUNNING...' : 'EXECUTE'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!result || !result.rows.length}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] bg-[#181D28] hover:bg-white/10 text-neutral-300 disabled:opacity-40 border border-white/8 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              disabled={!result || !result.rows.length}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] bg-[#181D28] hover:bg-white/10 text-neutral-300 disabled:opacity-40 border border-white/8 transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>JSON</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenInHistorian}
            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
          >
            <span>Open in Full Historian</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Results Preview Area */}
        <div className="flex-1 overflow-auto p-4 bg-[#0B0E14] font-mono text-xs">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded bg-red-950/40 border border-red-500/30 text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">SQL Execution Error:</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!error && result && (
            <div>
              <div className="flex items-center justify-between mb-2 text-neutral-400 text-[11px]">
                <span>
                  RETURNED {result.rowCount} {result.rowCount === 1 ? 'ROW' : 'ROWS'}
                  {result.truncated && ' (Capped at 50 for preview)'}
                </span>
                <span>EXECUTION: {result.executionTimeMs}ms</span>
              </div>

              <div className="overflow-x-auto border border-white/8 rounded-[3px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#11151E] border-b border-white/8 text-[10px] uppercase text-neutral-400">
                      {result.columns.map((col) => (
                        <th key={col.key} className="px-3 py-1.5 font-bold tracking-wider">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {result.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-white/[0.02]">
                        {result.columns.map((col) => (
                          <td
                            key={col.key}
                            className="px-3 py-1.5 text-neutral-200 whitespace-nowrap tabular-nums text-[11px]"
                          >
                            {row[col.key] !== null && row[col.key] !== undefined
                              ? String(row[col.key])
                              : 'NULL'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!error && !result && !isRunning && (
            <div className="text-center py-12 text-neutral-500">
              CLICK EXECUTE OR PRESS CTRL+ENTER TO RUN QUERY
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InspectQueryDrawer;
