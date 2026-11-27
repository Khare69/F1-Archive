import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  HISTORIAN_PRESETS,
  executePreset,
  executeRawSql,
  executeNaturalLanguageQuery,
  type HistorianQueryResult
} from './historianEngine';
import { formatSqlWithBoundParamsForDisplay } from './nlParser';
import { SqlEditorPane } from './components/SqlEditorPane';
import {
  serializeResultsToCsv,
  serializeResultsToJson,
  triggerBlobDownload
} from './utils/exportResults';
import { usePageMeta } from '../../hooks/usePageMeta';
import { exportPosterAsPng } from '../../utils/posterExport';

const QUICK_RADIO_PROMPTS = [
  'Lewis Hamilton career stats',
  'Ferrari championship history',
  'Monza Temple of Speed masters',
  '1988 Senna vs Prost simulation',
  'Youngest world champions',
  'Top 10 all-time Grand Prix winners'
];

export const RaceHistorian: React.FC = () => {
  const [naturalInput, setNaturalInput] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeViewMode, setActiveViewMode] = useState<'chart' | 'table'>('table');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isProbingBackend, setIsProbingBackend] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial state from preset #1
  const [editorSql, setEditorSql] = useState<string>(HISTORIAN_PRESETS[0].sql);
  const [queryResult, setQueryResult] = useState<HistorianQueryResult>(() => ({
    status: 'ok',
    queryTitle: HISTORIAN_PRESETS[0].title,
    explanation: HISTORIAN_PRESETS[0].explanation,
    sql: HISTORIAN_PRESETS[0].sql,
    columns: HISTORIAN_PRESETS[0].columns,
    rows: [],
    rowCount: 0,
    executionTimeMs: 0,
    source: 'sqlite_wasm',
    chartType: HISTORIAN_PRESETS[0].chartType
  }));

  const latestRequestIdRef = useRef<number>(0);

  // Tier 2 Backend Detection: strictly gated behind VITE_HISTORIAN_API_URL
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_HISTORIAN_API_URL;
    if (!backendUrl) return;

    let isMounted = true;
    setIsProbingBackend(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    fetch(`${backendUrl}/health`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.status === 'ok') {
          setIsBackendConnected(true);
        }
      })
      .catch(() => {
        // Backend offline or unreachable: gracefully remain in Tier 1
      })
      .finally(() => {
        clearTimeout(timeoutId);
        if (isMounted) setIsProbingBackend(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  // Filtered preset chips
  const filteredPresets = useMemo(() => {
    if (activeCategory === 'all') return HISTORIAN_PRESETS;
    return HISTORIAN_PRESETS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const runNaturalQuery = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;
    const reqId = ++latestRequestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await executeNaturalLanguageQuery(queryText);
      if (reqId === latestRequestIdRef.current) {
        setQueryResult(res);
        if (res.status !== 'unrecognized' && res.sql) {
          const displaySql = formatSqlWithBoundParamsForDisplay(res.sql, res.params || []);
          setEditorSql(displaySql);
        }
      }
    } catch (err: unknown) {
      if (reqId === latestRequestIdRef.current) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(msg);
      }
    } finally {
      if (reqId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleSelectPreset = useCallback(async (presetId: string) => {
    const preset = HISTORIAN_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setNaturalInput(preset.naturalPrompt);
    setEditorSql(preset.sql);
    const reqId = ++latestRequestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await executePreset(preset.id);
      if (reqId === latestRequestIdRef.current) {
        setQueryResult(res);
      }
    } catch (err: unknown) {
      if (reqId === latestRequestIdRef.current) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(msg);
      }
    } finally {
      if (reqId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleRunRawSql = useCallback(async (sqlToRun: string) => {
    if (!sqlToRun.trim()) return;
    const reqId = ++latestRequestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await executeRawSql(sqlToRun);
      if (reqId === latestRequestIdRef.current) {
        setQueryResult(res);
      }
    } catch (err: unknown) {
      if (reqId === latestRequestIdRef.current) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(msg);
      }
    } finally {
      if (reqId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initialize with Preset 0 on mount
  useEffect(() => {
    handleSelectPreset(HISTORIAN_PRESETS[0].id);
  }, [handleSelectPreset]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalInput.trim()) return;
    runNaturalQuery(naturalInput);
  };

  const handleQuickRadioPrompt = (prompt: string) => {
    setNaturalInput(prompt);
    runNaturalQuery(prompt);
  };

  const handleExportCsv = useCallback(() => {
    if (!queryResult || queryResult.rows.length === 0) return;
    const csv = serializeResultsToCsv(queryResult.columns, queryResult.rows);
    const filename = `${queryResult.queryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_results.csv`;
    triggerBlobDownload(csv, filename, 'text/csv;charset=utf-8;');
  }, [queryResult]);

  const handleExportJson = useCallback(() => {
    if (!queryResult) return;
    const json = serializeResultsToJson(queryResult);
    const filename = `${queryResult.queryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_results.json`;
    triggerBlobDownload(json, filename, 'application/json;charset=utf-8;');
  }, [queryResult]);

  const handleExportPoster = async () => {
    setIsExporting(true);
    try {
      await exportPosterAsPng({
        title: queryResult.queryTitle.toUpperCase(),
        subtitle: queryResult.explanation,
        rows: queryResult.rows.slice(0, 10).map((row, idx) => {
          const primaryCol = queryResult.columns[0]?.key || 'driver';
          const numericCol =
            queryResult.columns.find((c) => c.type === 'number') ||
            queryResult.columns[1] ||
            queryResult.columns[0];
          const label = String(row[primaryCol] || `Entry #${idx + 1}`);
          const val = numericCol ? row[numericCol.key] : undefined;
          const colLabel = numericCol ? ` ${numericCol.label}` : '';
          return {
            label: `#${idx + 1} ${label}`,
            value: `${val !== undefined ? String(val) : ''}${colLabel}`,
            color: idx === 0 ? '#FFD700' : idx === 1 ? '#00D2FF' : '#00E701'
          };
        }),
        footerNote: 'Generated by F1 Archive Race Historian • Educational and non-commercial research'
      });
    } finally {
      setIsExporting(false);
    }
  };

  usePageMeta({
    title: 'Explainable AI Race Historian & SQL Lab — F1 Archive',
    description:
      'Query 77 seasons of Formula 1 history with natural language and SQL. Inspect verified queries, explore statistics, and export high-DPI telemetry posters.',
    canonicalPath: '/historian'
  });

  return (
    <div className="historian-page-root flex flex-col gap-6 p-4 sm:p-6 max-w-[1400px] mx-auto w-full text-white">
      {/* Page Header */}
      <header className="historian-header flex flex-col gap-5 p-6 bg-[#11151E] border border-white/10 rounded-lg relative shadow-xl">
        <div className="historian-title-row flex justify-between items-start flex-wrap gap-4">
          <div className="historian-title-box flex flex-col gap-1">
            <span className="historian-badge font-mono text-xs text-[#00D2FF] tracking-wider font-bold">// EXPLAINABLE AI RACE ENGINEER</span>
            <h1 className="historian-title font-black text-2xl sm:text-3xl tracking-tight text-white m-0">RACE HISTORIAN &amp; SQL LAB</h1>
            <p className="historian-subtitle font-mono text-xs text-[#94A3B8] tracking-wider">
              NATURAL LANGUAGE &amp; SQL QUERY SYNTHESIZER OVER F1DB HISTORICAL REGISTRY (1950–2026)
            </p>
          </div>

          <div className="historian-status-box flex flex-col items-end gap-1.5">
            {isBackendConnected ? (
              <span className="engine-status-pill online inline-flex items-center gap-2 px-3 py-1.5 bg-[#181E2A] border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-wider rounded-[2px]">
                <span className="status-dot green w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                TIER 2: FASTAPI BACKEND CONNECTED
              </span>
            ) : (
              <span className="engine-status-pill client inline-flex items-center gap-2 px-3 py-1.5 bg-[#181E2A] border border-[#00D2FF]/30 text-[#00D2FF] text-xs font-mono tracking-wider rounded-[2px]">
                <span className="status-dot cyan w-2 h-2 rounded-full bg-[#00D2FF] shadow-[0_0_8px_rgba(0,210,255,0.6)]"></span>
                SQLITE-WASM (LOCAL)
              </span>
            )}
            {isProbingBackend && <span className="telemetry-hint font-mono text-[11px] text-[#6e7681]">PROBING BACKEND...</span>}
            {isLoading && <span className="telemetry-hint font-mono text-[11px] text-[#6e7681]">EXECUTING QUERY...</span>}
          </div>
        </div>

        {/* Natural Language & SQL Search Input */}
        <form onSubmit={handleSearchSubmit} className="historian-search-form flex flex-col md:flex-row gap-3 w-full">
          <div className="historian-search-input-box flex items-center flex-1 bg-[#090B10] border border-white/10 px-3 py-2 rounded-[2px] transition-all focus-within:border-[#00D2FF] focus-within:ring-1 focus-within:ring-[#00D2FF]/40">
            <span className="search-icon mr-2 text-sm opacity-70">🔍</span>
            <input
              type="text"
              className="historian-text-input flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-[#6e7681]"
              placeholder="Ask any F1 question (e.g., 'Lewis Hamilton career stats', 'Ferrari titles', '1988 Senna vs Prost')..."
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              aria-label="Natural language Formula 1 query"
            />
            {naturalInput && (
              <button
                type="button"
                className="clear-input-btn bg-transparent border-none text-[#8b949e] text-lg cursor-pointer px-1 leading-none hover:text-white"
                onClick={() => setNaturalInput('')}
                aria-label="Clear query"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="submit"
            className="query-submit-btn whitespace-nowrap px-5 py-2.5 bg-[#00D2FF] text-[#05070C] font-bold border-none cursor-pointer font-mono text-xs tracking-wider transition-all hover:bg-white hover:shadow-[0_0_12px_rgba(0,210,255,0.6)] rounded-[2px]"
            disabled={isLoading}
            aria-label="Generate & Execute SQL"
          >
            <span>{isLoading ? 'PROCESSING...' : 'GENERATE & EXECUTE SQL'}</span>
          </button>
        </form>

        {/* Suggested Historical Prompts Bar */}
        <div className="quick-radio-bar flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="radio-label text-[11px] font-mono text-[#8494AB]">SUGGESTED PROMPTS:</span>
          {QUICK_RADIO_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="quick-radio-pill px-2.5 py-1 rounded-[2px] bg-white/[0.03] border border-white/10 text-slate-300 font-mono text-xs hover:border-[#00D2FF]/40 hover:text-white hover:bg-white/[0.08] transition-colors"
              onClick={() => handleQuickRadioPrompt(prompt)}
            >
              &quot;{prompt}&quot;
            </button>
          ))}
        </div>

        {/* Category Filter Pills */}
        <div className="historian-categories-row flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="filter-label text-[11px] font-mono text-[#8494AB]">TOPICS:</span>
          {['all', 'drivers', 'constructors', 'circuits', 'championships', 'historical_records'].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill px-3 py-1 rounded-[2px] font-mono text-xs transition-colors border ${
                activeCategory === cat
                  ? 'active bg-[#00D2FF]/20 text-[#00D2FF] border-[#00D2FF]/50 font-bold'
                  : 'bg-white/[0.02] text-[#8494AB] border-white/10 hover:text-white hover:bg-white/[0.06]'
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        {/* Presets Chips Carousel */}
        <div className="presets-chips-container flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filteredPresets.map((preset) => {
            const isSelected = queryResult.queryTitle === preset.title;
            return (
              <button
                key={preset.id}
                type="button"
                className={`preset-chip flex items-center gap-2 whitespace-nowrap rounded-[2px] px-3 py-1.5 font-mono text-xs border transition-all ${
                  isSelected
                    ? 'selected bg-white/15 text-white font-bold ring-1 ring-white/30 border-white/30'
                    : 'bg-white/[0.02] text-[#8494AB] border-white/5 hover:bg-white/[0.06] hover:text-white'
                }`}
                onClick={() => handleSelectPreset(preset.id)}
              >
                <span className="preset-chip-title">{preset.title}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Dual-Pane Lab: SQL Inspector & Result Visualizer */}
      <main className="historian-lab-grid grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Inspectable & Editable CodeMirror SQL Pane */}
        <section
          className="sql-inspector-card flex flex-col bg-[#11151E] border border-white/10 rounded-lg overflow-hidden shadow-xl"
          aria-label="Generated SQL Inspector"
        >
          <div className="card-header-bar flex items-center justify-between p-3.5 bg-[#181E2A] border-b border-white/10 flex-wrap gap-2">
            <div className="card-header-title flex items-center gap-2 font-mono text-xs font-bold text-white tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#00D2FF] shadow-[0_0_8px_rgba(0,210,255,0.6)]"></span>
              <span>LIVE SQL EDITOR // TRANSLATION LOGIC</span>
            </div>
          </div>

          {/* CodeMirror 6 Live Editor */}
          <SqlEditorPane
            value={editorSql}
            onChange={setEditorSql}
            onRun={handleRunRawSql}
            isRunning={isLoading}
            executionTimeMs={queryResult.executionTimeMs}
            rowCount={queryResult.rowCount}
            errorMessage={errorMessage}
            onExportCsv={queryResult.rows.length > 0 ? handleExportCsv : undefined}
            onExportJson={queryResult.rows.length > 0 ? handleExportJson : undefined}
          />

          {/* Natural Language Explanation Box */}
          <div className="query-explanation-box p-4 bg-white/[0.02] border-b border-white/5 flex flex-col gap-1.5">
            <div className="explanation-title font-mono text-[11px] text-[#00D2FF] font-bold tracking-wider">// TRANSLATION &amp; ERA LOGIC</div>
            <p className="explanation-text font-mono text-xs text-[#94A3B8] leading-relaxed m-0">{queryResult.explanation}</p>
          </div>

          {/* Execution Metrics Bar */}
          <div className="query-metrics-bar flex items-center gap-2 px-4 py-2.5 bg-[#090B10] font-mono text-xs text-[#6e7681]">
            <span>
              ROWS: <strong className="text-white">{queryResult.rowCount}</strong>
            </span>
            <span>•</span>
            <span>
              LATENCY: <strong className="text-white">{queryResult.executionTimeMs} ms</strong>
            </span>
            <span>•</span>
            <span>
              SOURCE: <strong className="text-white">{queryResult.source.toUpperCase()}</strong>
            </span>
            {queryResult.truncated && (
              <span className="truncated-badge ml-auto px-2 py-0.5 rounded-[2px] bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-[10px]">TRUNCATED AT 200 ROWS</span>
            )}
          </div>
        </section>

        {/* Right Pane: Interactive Result Table & Visualization */}
        <section
          className="query-results-card flex flex-col bg-[#11151E] border border-white/10 rounded-lg overflow-hidden shadow-xl"
          aria-label="Query Results & Charts"
        >
          <div className="card-header-bar flex items-center justify-between p-3.5 bg-[#181E2A] border-b border-white/10 flex-wrap gap-2">
            <div className="card-header-title flex items-center gap-2 font-mono text-xs font-bold text-white tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
              <span>QUERY RESULTS: {queryResult.queryTitle.toUpperCase()}</span>
            </div>

            <div className="view-mode-toggle-group flex items-center gap-2 font-mono text-xs">
              <button
                type="button"
                className="export-poster-pill px-2.5 py-1 rounded-[2px] bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors font-mono text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleExportPoster}
                disabled={isExporting || queryResult.rows.length === 0}
                title="Export high-resolution telemetry poster"
              >
                {isExporting ? 'EXPORTING...' : '📸 POSTER (PNG)'}
              </button>
              <button
                type="button"
                className={`view-toggle-btn px-2.5 py-1 rounded-[2px] font-mono text-xs border ${
                  activeViewMode === 'table' ? 'active bg-white/15 text-white border-white/30 font-bold' : 'bg-transparent text-[#8494AB] border-white/10 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setActiveViewMode('table')}
              >
                TABLE
              </button>
              <button
                type="button"
                className={`view-toggle-btn px-2.5 py-1 rounded-[2px] font-mono text-xs border ${
                  activeViewMode === 'chart' ? 'active bg-white/15 text-white border-white/30 font-bold' : 'bg-transparent text-[#8494AB] border-white/10 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setActiveViewMode('chart')}
              >
                BAR CHART
              </button>
            </div>
          </div>

          {/* Unrecognized Query Suggestion Banner */}
          {queryResult.status === 'unrecognized' && (
            <div className="unrecognized-banner p-4 m-4 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col gap-2 font-mono text-xs">
              <div className="unrecognized-title flex items-center gap-2">
                <span className="status-dot gold w-2 h-2 rounded-full bg-amber-400"></span>
                <strong>QUERY NOT UNDERSTOOD</strong>
              </div>
              <p className="unrecognized-explanation text-slate-300 leading-relaxed">{queryResult.explanation}</p>
              {queryResult.suggestions && queryResult.suggestions.length > 0 && (
                <div className="unrecognized-suggestions flex flex-col gap-1.5 mt-2">
                  <span className="suggestions-label font-mono text-[11px] text-[#8494AB]">SUGGESTED HISTORICAL QUERIES:</span>
                  <div className="suggestion-pills-row flex flex-wrap gap-2">
                    {queryResult.suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        className="suggestion-pill px-2.5 py-1 rounded-[2px] bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white hover:border-[#00D2FF]/40 hover:bg-white/[0.08] transition-colors font-mono text-xs"
                        onClick={() => {
                          setNaturalInput(sug);
                          runNaturalQuery(sug);
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result Content */}
          <div className="results-content-box p-4">
            {activeViewMode === 'table' ? (
              <div className="results-table-wrapper overflow-x-auto max-h-[500px] border border-white/5 rounded">
                <table className="historian-table w-full border-collapse font-mono text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400">
                      {queryResult.columns.map((col) => (
                        <th key={col.key} className="p-3">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={Math.max(1, queryResult.columns.length)}
                          style={{ textAlign: 'center', padding: '2rem', color: '#6e7681' }}
                        >
                          {isLoading ? 'Executing query against SQLite-WASM...' : '0 rows returned.'}
                        </td>
                      </tr>
                    ) : (
                      queryResult.rows.map((row, rIdx) => (
                        <tr key={`row_${rIdx}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          {queryResult.columns.map((col) => {
                            const val = row[col.key];
                            const isNumeric = typeof val === 'number';
                            return (
                              <td
                                key={col.key}
                                className={`p-3 ${isNumeric ? 'text-right font-bold text-white' : 'text-slate-300'}`}
                              >
                                {val !== undefined && val !== null ? String(val) : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Bar Chart Visualizer */
              <div className="results-chart-wrapper max-h-[500px] overflow-y-auto">
                {queryResult.rows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6e7681' }}>
                    {isLoading ? 'Executing query against SQLite-WASM...' : 'No data to chart.'}
                  </div>
                ) : (
                  <div className="bar-chart-container flex flex-col gap-2">
                    {queryResult.rows.map((row, rIdx) => {
                      const primaryCol = queryResult.columns[0]?.key || 'driver';
                      const numericCol =
                        queryResult.columns.find((c) => c.type === 'number') ||
                        queryResult.columns[1] ||
                        queryResult.columns[0];
                      const label = String(row[primaryCol] || `Item #${rIdx + 1}`);
                      const val =
                        numericCol && typeof row[numericCol.key] === 'number'
                          ? (row[numericCol.key] as number)
                          : 1;

                      // Compute maximum value in column for proportional bars
                      const maxVal = Math.max(
                        1,
                        ...queryResult.rows.map((r) =>
                          numericCol && typeof r[numericCol.key] === 'number'
                            ? (r[numericCol.key] as number)
                            : 1
                        )
                      );
                      const pct = Math.min(100, Math.round((val / maxVal) * 100));

                      return (
                        <div key={`chart_bar_${rIdx}`} className="bar-chart-row flex items-center gap-3 py-1 font-mono text-xs">
                          <div className="bar-label-box w-36 sm:w-44 truncate text-right text-slate-300 font-mono text-xs shrink-0" title={label}>
                            {label}
                          </div>
                          <div className="bar-track flex-1 h-5 bg-white/5 rounded-[2px] overflow-hidden">
                            <div
                              className="bar-fill h-full transition-all duration-300 rounded-[2px]"
                              style={{
                                width: `${pct}%`,
                                backgroundColor:
                                  rIdx === 0 ? '#FFD700' : rIdx === 1 ? '#00D2FF' : '#00E701'
                              }}
                            ></div>
                          </div>
                          <div className="bar-value w-28 text-left text-slate-400 font-mono text-xs shrink-0">
                            {numericCol && typeof row[numericCol.key] === 'number'
                              ? `${val} ${numericCol.label}`
                              : label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
