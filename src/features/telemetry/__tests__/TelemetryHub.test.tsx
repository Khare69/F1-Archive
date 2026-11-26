import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserPreferencesProvider } from '../../../contexts/UserPreferencesContext';
import { TelemetryHub } from '../TelemetryHub';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement, initialUrl = '/telemetry') => {
  const queryClient = createTestQueryClient();
  const search = initialUrl.includes('?') ? initialUrl.slice(initialUrl.indexOf('?')) : '';
  return render(
    <QueryClientProvider client={queryClient}>
      <UserPreferencesProvider>
        <MemoryRouter
          initialEntries={[initialUrl]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <NuqsTestingAdapter searchParams={search} hasMemory>
            {ui}
          </NuqsTestingAdapter>
        </MemoryRouter>
      </UserPreferencesProvider>
    </QueryClientProvider>
  );
};

describe('TelemetryHub', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders verified historical packs by default and hides madrid-2026-sim until Experimental Labs is toggled', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/telemetry" element={<TelemetryHub />} />
        <Route path="/telemetry/:slug" element={<TelemetryHub />} />
      </Routes>,
      '/telemetry'
    );

    // Initial check: Experimental simulation packs should NOT be visible initially
    await waitFor(() => {
      expect(screen.queryByText(/madrid-2026-sim/i)).not.toBeInTheDocument();
    });

    const labsToggle = screen.getByRole('button', { name: /\+ INCLUDE EXPERIMENTAL LABS/i });
    expect(labsToggle).toBeInTheDocument();

    // Click toggle to opt into Experimental Labs
    fireEvent.click(labsToggle);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /✓ EXPERIMENTAL LABS INCLUDED/i })).toBeInTheDocument();
    });
  });

  it('handles Space keydown to toggle play/pause, but ignores it when typing inside an input', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/telemetry" element={<TelemetryHub />} />
      </Routes>,
      '/telemetry'
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Play Ghost Lap/i })).toBeInTheDocument();
    });

    // Press Space on window -> should toggle to Pause
    fireEvent.keyDown(window, { code: 'Space' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Pause Ghost Lap/i })).toBeInTheDocument();
    });

    // Press Space again on window -> should toggle back to Play
    fireEvent.keyDown(window, { code: 'Space' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Play Ghost Lap/i })).toBeInTheDocument();
    });

    // When focused in an input, Space should be ignored
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { code: 'Space' });
    // Still in Play state
    expect(screen.getByRole('button', { name: /Play Ghost Lap/i })).toBeInTheDocument();

    document.body.removeChild(input);
  });

  it('deep link to /telemetry?pack=madrid-2026-sim-alo-vs-sai automatically renders EXPERIMENTAL // SIMULATION disclaimer', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/telemetry" element={<TelemetryHub />} />
      </Routes>,
      '/telemetry?pack=madrid-2026-sim-alo-vs-sai'
    );

    await waitFor(() => {
      expect(screen.getByText('EXPERIMENTAL // SIMULATION')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Theoretical 2026 active aero & manual override simulation for the Circuito de Madrid/i)
    ).toBeInTheDocument();
  });
});
