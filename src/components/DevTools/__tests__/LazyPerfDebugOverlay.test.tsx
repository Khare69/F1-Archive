import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LazyPerfDebugOverlay } from '../LazyPerfDebugOverlay';

// Mock the heavy PerfDebugOverlay component
vi.mock('../../../features/cars/components/PerfDebugOverlay', () => ({
  PerfDebugOverlay: () => <div data-testid="perf-debug-overlay-mock">PERF DEBUG ACTIVE</div>,
}));

describe('LazyPerfDebugOverlay (C-17, F-37)', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('remains unmounted by default when ?debug=perf is not in the URL', () => {
    render(<LazyPerfDebugOverlay />);
    expect(screen.queryByTestId('perf-debug-overlay-mock')).toBeNull();
  });

  it('mounts immediately if ?debug=perf is in window.location.search', async () => {
    window.history.pushState({}, '', '/cars?debug=perf');
    render(<LazyPerfDebugOverlay />);
    const overlay = await screen.findByTestId('perf-debug-overlay-mock');
    expect(overlay).toBeInTheDocument();
  });

  it('toggles open when Shift+P is pressed outside editable inputs', async () => {
    render(<LazyPerfDebugOverlay />);
    expect(screen.queryByTestId('perf-debug-overlay-mock')).toBeNull();

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'P', shiftKey: true, bubbles: true }));
    });

    expect(await screen.findByTestId('perf-debug-overlay-mock')).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'P', shiftKey: true, bubbles: true }));
    });

    expect(screen.queryByTestId('perf-debug-overlay-mock')).toBeNull();
  });

  it('ignores Shift+P when typed inside an input or textarea', async () => {
    render(
      <div>
        <input data-testid="test-input" />
        <LazyPerfDebugOverlay />
      </div>
    );

    const input = screen.getByTestId('test-input');
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'P', shiftKey: true, bubbles: true }));
    });

    expect(screen.queryByTestId('perf-debug-overlay-mock')).toBeNull();
  });
});
