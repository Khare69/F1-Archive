/**
 * F1 // ARCHIVE — CodeMirror 6 Live SQL Editor Pane
 * Features:
 * - CodeMirror 6 basicSetup + @codemirror/lang-sql SQLite dialect
 * - Dark matte telemetry theme matching F1 Archive UI tokens
 * - Mod-Enter (Ctrl+Enter / Cmd+Enter) execution keymap
 * - Run SQL, Copy SQL, Export CSV, and Export JSON toolbar actions
 * - Real-time execution metrics and inline SQL error banner
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { sql, SQLite } from '@codemirror/lang-sql';

export interface SqlEditorPaneProps {
  value: string;
  onChange: (nextSql: string) => void;
  onRun: (sql: string) => void;
  isRunning?: boolean;
  executionTimeMs?: number | null;
  rowCount?: number | null;
  errorMessage?: string | null;
  onExportCsv?: () => void;
  onExportJson?: () => void;
  readOnly?: boolean;
}

const f1Theme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#090B10',
      color: '#e6edf3',
      fontSize: '13px',
      fontFamily: 'JetBrains Mono, monospace',
      height: '100%'
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: 'inherit',
      minHeight: '160px',
      maxHeight: '260px'
    },
    '.cm-content': {
      caretColor: '#00D2FF',
      padding: '8px 4px'
    },
    '&.cm-focused': {
      outline: 'none'
    },
    '.cm-gutters': {
      backgroundColor: '#11151E',
      color: '#6e7681',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      paddingRight: '6px'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(0, 210, 255, 0.1)',
      color: '#00D2FF'
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)'
    }
  },
  { dark: true }
);

export const SqlEditorPane: React.FC<SqlEditorPaneProps> = ({
  value,
  onChange,
  onRun,
  isRunning = false,
  executionTimeMs = null,
  rowCount = null,
  errorMessage = null,
  onExportCsv,
  onExportJson,
  readOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onRunRef = useRef(onRun);
  const onChangeRef = useRef(onChange);
  const [copied, setCopied] = useState(false);

  // Keep callback refs fresh for event closures
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize CodeMirror 6 EditorView
  useEffect(() => {
    if (!containerRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        sql({ dialect: SQLite }),
        f1Theme,
        EditorView.editable.of(!readOnly),
        keymap.of([
          {
            key: 'Mod-Enter',
            run: (v) => {
              onRunRef.current(v.state.doc.toString());
              return true;
            }
          }
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Initialize once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize external value updates without resetting cursor
  useEffect(() => {
    const view = viewRef.current;
    if (view) {
      const currentDoc = view.state.doc.toString();
      if (value !== currentDoc) {
        view.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: value }
        });
      }
    }
  }, [value]);

  const handleRunClick = useCallback(() => {
    const currentSql = viewRef.current ? viewRef.current.state.doc.toString() : value;
    onRun(currentSql);
  }, [onRun, value]);

  const handleCopyClick = useCallback(() => {
    const currentSql = viewRef.current ? viewRef.current.state.doc.toString() : value;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [value]);

  return (
    <div className="sql-editor-wrapper flex flex-col bg-[#090B10] border-b border-white/10 w-full">
      {/* Editor Action Toolbar */}
      <div className="sql-editor-toolbar flex items-center justify-between flex-wrap gap-2 px-3 py-2 bg-[#11151E] border-b border-white/10">
        <div className="sql-editor-actions flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="sql-run-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00D2FF] text-[#05070C] font-bold font-mono text-xs tracking-wider rounded-[2px] transition-all hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            onClick={handleRunClick}
            disabled={isRunning}
            title="Execute query against SQLite database (Ctrl+Enter)"
          >
            {isRunning ? 'RUNNING...' : '▶ RUN SQL (Ctrl+Enter)'}
          </button>

          <button
            type="button"
            className="sql-tool-btn copy-sql-btn bg-transparent border border-white/15 text-[#8b949e] px-2.5 py-1 font-mono text-[11px] rounded-[2px] transition-all hover:text-white hover:border-[#00D2FF] hover:bg-[#00D2FF]/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            onClick={handleCopyClick}
            title="Copy SQL to clipboard"
          >
            {copied ? '✓ COPIED' : '📋 COPY SQL'}
          </button>

          {onExportCsv && (
            <button
              type="button"
              className="sql-tool-btn bg-transparent border border-white/15 text-[#8b949e] px-2.5 py-1 font-mono text-[11px] rounded-[2px] transition-all hover:text-white hover:border-[#00D2FF] hover:bg-[#00D2FF]/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              onClick={onExportCsv}
              title="Export query results as CSV"
            >
              📊 EXPORT CSV
            </button>
          )}

          {onExportJson && (
            <button
              type="button"
              className="sql-tool-btn bg-transparent border border-white/15 text-[#8b949e] px-2.5 py-1 font-mono text-[11px] rounded-[2px] transition-all hover:text-white hover:border-[#00D2FF] hover:bg-[#00D2FF]/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              onClick={onExportJson}
              title="Export query results as JSON"
            >
              📄 EXPORT JSON
            </button>
          )}
        </div>

        {/* Live Execution Metrics */}
        {(executionTimeMs !== null || rowCount !== null) && (
          <div className="sql-editor-metrics flex items-center gap-2 font-mono text-[11px] text-[#6e7681]">
            {rowCount !== null && (
              <span>
                ROWS: <strong className="text-white">{rowCount}</strong>
              </span>
            )}
            {rowCount !== null && executionTimeMs !== null && <span>•</span>}
            {executionTimeMs !== null && (
              <span>
                LATENCY: <strong className="text-white">{executionTimeMs} ms</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* CodeMirror Surface */}
      <div
        ref={containerRef}
        className="sql-editor-container sql-code-block min-h-[160px] max-h-[260px] overflow-hidden relative"
        data-testid="sql-editor"
      />

      {/* Inline Error Banner */}
      {errorMessage && (
        <div className="sql-editor-error-banner telemetry p-2.5 bg-red-500/10 border-t border-red-500/40 text-red-400 font-mono text-xs flex items-center gap-2" role="alert">
          <span>⚠️</span> {errorMessage}
        </div>
      )}
    </div>
  );
};
