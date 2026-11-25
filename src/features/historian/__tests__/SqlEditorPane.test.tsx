import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SqlEditorPane } from '../components/SqlEditorPane';

describe('SqlEditorPane Component', () => {
  it('mounts the CodeMirror 6 editor surface and toolbar', () => {
    const onRun = vi.fn();
    const onChange = vi.fn();

    render(
      <SqlEditorPane
        value="SELECT * FROM driver LIMIT 10;"
        onChange={onChange}
        onRun={onRun}
        executionTimeMs={15}
        rowCount={10}
      />
    );

    const editorEl = screen.getByTestId('sql-editor');
    expect(editorEl).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /RUN SQL/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /COPY SQL/i })).toBeInTheDocument();
    expect(screen.getByText(/15 ms/i)).toBeInTheDocument();
    expect(screen.getByText(/ROWS:/i)).toHaveTextContent('10');
  });

  it('invokes onRun when the Run SQL button is clicked', () => {
    const onRun = vi.fn();
    const onChange = vi.fn();
    const sql = 'SELECT COUNT(*) FROM race;';

    render(
      <SqlEditorPane
        value={sql}
        onChange={onChange}
        onRun={onRun}
      />
    );

    const runBtn = screen.getByRole('button', { name: /RUN SQL/i });
    fireEvent.click(runBtn);

    expect(onRun).toHaveBeenCalledWith(sql);
  });

  it('renders inline error message when errorMessage prop is provided', () => {
    render(
      <SqlEditorPane
        value="SELECT invalid"
        onChange={vi.fn()}
        onRun={vi.fn()}
        errorMessage="no such table: invalid"
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/no such table: invalid/i);
  });

  it('destroys CodeMirror instance cleanly on unmount', () => {
    const { unmount } = render(
      <SqlEditorPane
        value="SELECT 1;"
        onChange={vi.fn()}
        onRun={vi.fn()}
      />
    );

    expect(() => unmount()).not.toThrow();
  });
});
