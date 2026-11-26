import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PitWallStrategy } from '../PitWallStrategy';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement, initialUrl = '/pitwall') => {
  const queryClient = createTestQueryClient();
  const search = initialUrl.includes('?') ? initialUrl.slice(initialUrl.indexOf('?')) : '';
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[initialUrl]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <NuqsTestingAdapter searchParams={search} hasMemory>
          {ui}
        </NuqsTestingAdapter>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('PitWallStrategy Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the Monte Carlo strategy engine with Experimental Badge disclaimer', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/pitwall" element={<PitWallStrategy />} />
      </Routes>,
      '/pitwall'
    );

    expect(
      screen.getByText(/MONTE CARLO PIT-WALL STRATEGY ENGINE/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Monte Carlo race strategy model — deterministic seeded projection/i)
    ).toBeInTheDocument();
  });

  it('hydrates custom URL state parameters (pitLoss=24.5, seed=42) and reflects in inputs', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/pitwall" element={<PitWallStrategy />} />
      </Routes>,
      '/pitwall?pitLoss=24.5&seed=42'
    );

    await waitFor(() => {
      const pitLossInput = screen.getByLabelText(/PIT LOSS \(S\)/i) as HTMLInputElement;
      expect(pitLossInput.value).toBe('24.5');
    });

    expect(screen.getByText(/🎲 RE-ROLL SEED \(42\)/i)).toBeInTheDocument();
  });

  it('allows changing parameters and updates optimal strategy calculation', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/pitwall" element={<PitWallStrategy />} />
      </Routes>,
      '/pitwall'
    );

    const circuitSelect = screen.getByLabelText(/CIRCUIT:/i) as HTMLSelectElement;
    expect(circuitSelect).toBeInTheDocument();

    // Change circuit to Monaco
    fireEvent.change(circuitSelect, { target: { value: 'monaco' } });

    await waitFor(() => {
      const lapsInput = screen.getByLabelText(/TOTAL LAPS/i) as HTMLInputElement;
      expect(lapsInput.value).toBe('78');
    });
  });
});
