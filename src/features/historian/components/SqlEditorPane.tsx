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
import './SqlEditorPane.css';

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
    <div className="sql-editor-wrapper">
      {/* Editor Action Toolbar */}
      <div className="sql-editor-toolbar">
        <div className="sql-editor-actions">
          <button
            type="button"
            className="sql-run-btn"
            onClick={handleRunClick}
            disabled={isRunning}
            title="Execute query against SQLite database (Ctrl+Enter)"
          >
            {isRunning ? 'RUNNING...' : '▶ RUN SQL (Ctrl+Enter)'}
          </button>

          <button
            type="button"
            className="sql-tool-btn copy-sql-btn"
            onClick={handleCopyClick}
            title="Copy SQL to clipboard"
          >
            {copied ? '✓ COPIED' : '📋 COPY SQL'}
          </button>

          {onExportCsv && (
            <button
              type="button"
              className="sql-tool-btn"
              onClick={onExportCsv}
              title="Export query results as CSV"
            >
              📊 EXPORT CSV
            </button>
          )}

          {onExportJson && (
            <button
              type="button"
              className="sql-tool-btn"
              onClick={onExportJson}
              title="Export query results as JSON"
            >
              📄 EXPORT JSON
            </button>
          )}
        </div>

        {/* Live Execution Metrics */}
        {(executionTimeMs !== null || rowCount !== null) && (
          <div className="sql-editor-metrics">
            {rowCount !== null && (
              <span>
                ROWS: <strong>{rowCount}</strong>
              </span>
            )}
            {rowCount !== null && executionTimeMs !== null && <span>•</span>}
            {executionTimeMs !== null && (
              <span>
                LATENCY: <strong>{executionTimeMs} ms</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* CodeMirror Surface */}
      <div
        ref={containerRef}
        className="sql-editor-container sql-code-block"
        data-testid="sql-editor"
      />

      {/* Inline Error Banner */}
      {errorMessage && (
        <div className="sql-editor-error-banner telemetry" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
