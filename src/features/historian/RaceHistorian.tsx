import React, { useState, useEffect, useMemo } from 'react';
import {
  HISTORIAN_PRESETS,
  parseAndExecuteNaturalLanguageQuery,
  type HistorianQueryResult
} from './historianEngine';
import { usePageMeta } from '../../hooks/usePageMeta';
import './RaceHistorian.css';

export const RaceHistorian: React.FC = () => {
  const [naturalInput, setNaturalInput] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<'chart' | 'table'>('table');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isProbingBackend, setIsProbingBackend] = useState<boolean>(false);

  // Initial result from preset #1
  const [queryResult, setQueryResult] = useState<HistorianQueryResult>(() => {
    return HISTORIAN_PRESETS[0].run();
  });

  // Tier 2 Backend Detection (Refinement 1)
  // Gated strictly behind VITE_HISTORIAN_API_URL. When unset, skip network probe completely!
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_HISTORIAN_API_URL;
    if (!backendUrl) {
      // Static Cloudflare Pages deployment: remain in pure Tier 1 client mode with 0 errors
      return;
    }

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

  const handleSelectPreset = (presetId: string) => {
    const preset = HISTORIAN_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setNaturalInput(preset.naturalPrompt);
      setQueryResult(preset.run());
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalInput.trim()) return;

    // Execute through Tier 1 in-memory parser and query synthesizer
    const res = parseAndExecuteNaturalLanguageQuery(naturalInput);
    setQueryResult(res);
  };

  const handleCopySql = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(queryResult.sql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  usePageMeta({
    title: 'Explainable AI Race Historian — F1DB Text-to-SQL Analytics',
    description: 'Query 77 seasons of Formula 1 history with natural language. Inspect verified SQL, explore era-normalized statistics, and visualize analytical tables and charts.',
    canonicalPath: '/historian'
  });

  return (
    <div className="historian-page-root">
      {/* Page Header */}
      <header className="historian-header telemetry-panel corner-bracket">
        <div className="historian-title-row">
          <div className="historian-title-box">
            <span className="historian-badge telemetry">// EXPLAINABLE AI CO-PILOT</span>
            <h1 className="historian-title headline">RACE HISTORIAN &amp; SQL LAB</h1>
            <p className="historian-subtitle telemetry">
              NATURAL LANGUAGE QUERY SYNTHESIZER OVER F1DB HISTORICAL REGISTRY (1950–2026)
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
                TIER 1: CLIENT IN-MEMORY F1DB ACTIVE
              </span>
            )}
            {isProbingBackend && <span className="telemetry-hint">PROBING BACKEND...</span>}
          </div>
        </div>

        {/* Natural Language Search Input */}
        <form onSubmit={handleSearchSubmit} className="historian-search-form">
          <div className="historian-search-input-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="historian-text-input telemetry"
              placeholder="Ask any F1 question (e.g., 'Lewis Hamilton career stats', 'Ferrari titles', 'Monza masters', '1988 Senna vs Prost')..."
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
          <button type="submit" className="f1-btn telemetry query-submit-btn">
            <span>GENERATE &amp; EXECUTE SQL</span>
          </button>
        </form>

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
        {/* Left Pane: Inspectable SQL & Translation Logic */}
        <section className="sql-inspector-card telemetry-panel corner-bracket" aria-label="Generated SQL Inspector">
          <div className="card-header-bar">
            <div className="card-header-title telemetry">
              <span className="dot cyan"></span>
              <span>INSPECTABLE SQL // TRANSLATION LOGIC</span>
            </div>
            <button
              type="button"
              className="copy-sql-btn telemetry"
              onClick={handleCopySql}
              title="Copy SQL query to clipboard"
            >
              {copiedSql ? '✓ COPIED' : '📋 COPY SQL'}
            </button>
          </div>

          {/* Formatted Code Block */}
          <div className="sql-code-container">
            <pre className="sql-code-block telemetry">
              <code>{queryResult.sql}</code>
            </pre>
          </div>

          {/* Natural Language Explanation Box */}
          <div className="query-explanation-box">
            <div className="explanation-title telemetry">// TRANSLATION &amp; ERA LOGIC</div>
            <p className="explanation-text">{queryResult.explanation}</p>
          </div>

          {/* Execution Metrics Bar */}
          <div className="query-metrics-bar telemetry">
            <span>ROWS: <strong>{queryResult.rowCount}</strong></span>
            <span>•</span>
            <span>LATENCY: <strong>{queryResult.executionTimeMs} ms</strong></span>
            <span>•</span>
            <span>SOURCE: <strong>{queryResult.source.toUpperCase()}</strong></span>
          </div>
        </section>

        {/* Right Pane: Interactive Result Table & Visualization */}
        <section className="query-results-card telemetry-panel corner-bracket" aria-label="Query Results & Charts">
          <div className="card-header-bar">
            <div className="card-header-title telemetry">
              <span className="dot gold"></span>
              <span>QUERY RESULTS: {queryResult.queryTitle.toUpperCase()}</span>
            </div>

            <div className="view-mode-toggle-group telemetry">
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

          {/* Result Content */}
          <div className="results-content-box">
            {activeViewMode === 'table' ? (
              <div className="results-table-wrapper">
                <table className="historian-table">
                  <thead>
                    <tr>
                      {queryResult.columns.map((col) => (
                        <th key={col.key} className="telemetry">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row, rIdx) => (
                      <tr key={`row_${rIdx}`}>
                        {queryResult.columns.map((col) => {
                          const val = row[col.key];
                          const isNumeric = typeof val === 'number';
                          return (
                            <td key={col.key} className={isNumeric ? 'num-cell telemetry' : 'text-cell'}>
                              {val !== undefined && val !== null ? String(val) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Bar Chart Visualizer */
              <div className="results-chart-wrapper">
                <div className="bar-chart-container">
                  {queryResult.rows.map((row, rIdx) => {
                    const primaryCol = queryResult.columns[0]?.key || 'driver';
                    const numericCol = queryResult.columns.find((c) => c.type === 'number') || queryResult.columns[1];
                    const label = String(row[primaryCol] || `Item #${rIdx + 1}`);
                    const val = typeof row[numericCol.key] === 'number' ? (row[numericCol.key] as number) : 1;

                    // Compute maximum value in column for proportional bars
                    const maxVal = Math.max(
                      1,
                      ...queryResult.rows.map((r) => (typeof r[numericCol.key] === 'number' ? (r[numericCol.key] as number) : 1))
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
                              backgroundColor: rIdx === 0 ? '#FFD700' : rIdx === 1 ? '#00D2FF' : '#00E701'
                            }}
                          ></div>
                        </div>
                        <div className="bar-value telemetry">
                          {val} {numericCol.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
