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
import './RaceHistorian.css';

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
    <div className="historian-page-root">
      {/* Page Header */}
      <header className="historian-header telemetry-panel corner-bracket">
        <div className="historian-title-row">
          <div className="historian-title-box">
            <span className="historian-badge telemetry">// EXPLAINABLE AI RACE ENGINEER</span>
            <h1 className="historian-title headline">RACE HISTORIAN &amp; SQL LAB</h1>
            <p className="historian-subtitle telemetry">
              NATURAL LANGUAGE &amp; SQL QUERY SYNTHESIZER OVER F1DB HISTORICAL REGISTRY (1950–2026)
            </p>
          </div>

          <div className="historian-status-box">
            {isBackendConnected ? (
              <span className="engine-status-pill online telemetry">
                <span className="status-dot green"></span>
                TIER 2: FASTAPI BACKEND CONNECTED
              </span>
            ) : (
              <span className="engine-status-pill client telemetry">
                <span className="status-dot cyan"></span>
                SQLITE-WASM (LOCAL)
              </span>
            )}
            {isProbingBackend && <span className="telemetry-hint">PROBING BACKEND...</span>}
            {isLoading && <span className="telemetry-hint">EXECUTING QUERY...</span>}
          </div>
        </div>

        {/* Natural Language & SQL Search Input */}
        <form onSubmit={handleSearchSubmit} className="historian-search-form">
          <div className="historian-search-input-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="historian-text-input telemetry"
              placeholder="Ask any F1 question (e.g., 'Lewis Hamilton career stats', 'Ferrari titles', '1988 Senna vs Prost')..."
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              aria-label="Natural language Formula 1 query"
            />
            {naturalInput && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => setNaturalInput('')}
                aria-label="Clear query"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="submit"
            className="f1-btn telemetry query-submit-btn"
            disabled={isLoading}
            aria-label="Generate & Execute SQL"
          >
            <span>{isLoading ? 'PROCESSING...' : 'GENERATE & EXECUTE SQL'}</span>
          </button>
        </form>

        {/* Suggested Historical Prompts Bar */}
        <div className="quick-radio-bar">
          <span className="radio-label telemetry">SUGGESTED PROMPTS:</span>
          {QUICK_RADIO_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="quick-radio-pill telemetry"
              onClick={() => handleQuickRadioPrompt(prompt)}
            >
              &quot;{prompt}&quot;
            </button>
          ))}
        </div>

        {/* Category Filter Pills */}
        <div className="historian-categories-row">
          <span className="filter-label telemetry">TOPICS:</span>
          {['all', 'drivers', 'constructors', 'circuits', 'championships', 'historical_records'].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill telemetry ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        {/* Presets Chips Carousel */}
        <div className="presets-chips-container">
          {filteredPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-chip telemetry ${queryResult.queryTitle === preset.title ? 'selected' : ''}`}
              onClick={() => handleSelectPreset(preset.id)}
            >
              <span className="preset-chip-title">{preset.title}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Dual-Pane Lab: SQL Inspector & Result Visualizer */}
      <main className="historian-lab-grid">
        {/* Left Pane: Inspectable & Editable CodeMirror SQL Pane */}
        <section
          className="sql-inspector-card telemetry-panel corner-bracket"
          aria-label="Generated SQL Inspector"
        >
          <div className="card-header-bar">
            <div className="card-header-title telemetry">
              <span className="dot cyan"></span>
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
          <div className="query-explanation-box">
            <div className="explanation-title telemetry">// TRANSLATION &amp; ERA LOGIC</div>
            <p className="explanation-text">{queryResult.explanation}</p>
          </div>

          {/* Execution Metrics Bar */}
          <div className="query-metrics-bar telemetry">
            <span>
              ROWS: <strong>{queryResult.rowCount}</strong>
            </span>
            <span>•</span>
            <span>
              LATENCY: <strong>{queryResult.executionTimeMs} ms</strong>
            </span>
            <span>•</span>
            <span>
              SOURCE: <strong>{queryResult.source.toUpperCase()}</strong>
            </span>
            {queryResult.truncated && (
              <span className="truncated-badge telemetry">TRUNCATED AT 200 ROWS</span>
            )}
          </div>
        </section>

        {/* Right Pane: Interactive Result Table & Visualization */}
        <section
          className="query-results-card telemetry-panel corner-bracket"
          aria-label="Query Results & Charts"
        >
          <div className="card-header-bar">
            <div className="card-header-title telemetry">
              <span className="dot gold"></span>
              <span>QUERY RESULTS: {queryResult.queryTitle.toUpperCase()}</span>
            </div>

            <div className="view-mode-toggle-group telemetry">
              <button
                type="button"
                className="export-poster-pill telemetry"
                onClick={handleExportPoster}
                disabled={isExporting || queryResult.rows.length === 0}
                title="Export high-resolution telemetry poster"
              >
                {isExporting ? 'EXPORTING...' : '📸 POSTER (PNG)'}
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${activeViewMode === 'table' ? 'active' : ''}`}
                onClick={() => setActiveViewMode('table')}
              >
                TABLE
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${activeViewMode === 'chart' ? 'active' : ''}`}
                onClick={() => setActiveViewMode('chart')}
              >
                BAR CHART
              </button>
            </div>
          </div>

          {/* Unrecognized Query Suggestion Banner */}
          {queryResult.status === 'unrecognized' && (
            <div className="unrecognized-banner telemetry-panel">
              <div className="unrecognized-title">
                <span className="status-dot gold"></span>
                <strong>QUERY NOT UNDERSTOOD</strong>
              </div>
              <p className="unrecognized-explanation">{queryResult.explanation}</p>
              {queryResult.suggestions && queryResult.suggestions.length > 0 && (
                <div className="unrecognized-suggestions">
                  <span className="suggestions-label telemetry">SUGGESTED HISTORICAL QUERIES:</span>
                  <div className="suggestion-pills-row">
                    {queryResult.suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        className="suggestion-pill telemetry"
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
          <div className="results-content-box">
            {activeViewMode === 'table' ? (
              <div className="results-table-wrapper">
                <table className="historian-table">
                  <thead>
                    <tr>
                      {queryResult.columns.map((col) => (
                        <th key={col.key} className="telemetry">
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
                        <tr key={`row_${rIdx}`}>
                          {queryResult.columns.map((col) => {
                            const val = row[col.key];
                            const isNumeric = typeof val === 'number';
                            return (
                              <td
                                key={col.key}
                                className={isNumeric ? 'num-cell telemetry' : 'text-cell'}
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
              <div className="results-chart-wrapper">
                {queryResult.rows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6e7681' }}>
                    {isLoading ? 'Executing query against SQLite-WASM...' : 'No data to chart.'}
                  </div>
                ) : (
                  <div className="bar-chart-container">
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
                        <div key={`chart_bar_${rIdx}`} className="bar-chart-row">
                          <div className="bar-label-box telemetry" title={label}>
                            {label}
                          </div>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${pct}%`,
                                backgroundColor:
                                  rIdx === 0 ? '#FFD700' : rIdx === 1 ? '#00D2FF' : '#00E701'
                              }}
                            ></div>
                          </div>
                          <div className="bar-value telemetry">
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
