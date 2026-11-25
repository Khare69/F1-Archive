/**
 * F1 // ARCHIVE — Query Result Exporter
 * RFC 4180 CSV serializer with formula-injection neutralization, and formatted JSON export.
 */

import type { HistorianQueryResult, QueryResultColumn } from '../types';

/**
 * Sanitizes a cell value for CSV export, preventing formula injection in spreadsheets
 * while preserving valid numeric and text data.
 */
function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  let str = String(value);

  // Formula injection neutralization: prefix leading =, +, -, @ with a single quote
  // Note: Only prefix if it's a string, not a negative number (handled above)
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function serializeResultsToCsv(
  columns: QueryResultColumn[],
  rows: Record<string, unknown>[]
): string {
  const headerRow = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');
  const dataRows = rows.map((row) =>
    columns.map((col) => sanitizeCsvCell(row[col.key])).join(',')
  );

  return [headerRow, ...dataRows].join('\r\n');
}

export function serializeResultsToJson(result: HistorianQueryResult): string {
  const exportPayload = {
    title: result.queryTitle,
    explanation: result.explanation,
    sql: result.sql,
    source: result.source,
    rowCount: result.rowCount,
    executionTimeMs: result.executionTimeMs,
    columns: result.columns,
    rows: result.rows
  };

  return JSON.stringify(exportPayload, null, 2);
}

export function triggerBlobDownload(
  content: string,
  filename: string,
  mimeType: string = 'text/plain;charset=utf-8;'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
