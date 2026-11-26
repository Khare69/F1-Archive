import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DriverComparison } from './DriverComparison';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

const renderWithRouter = (ui: React.ReactElement, initialEntries = ['/drivers/compare']) => {
  const queryClient = createTestQueryClient();
  const initialUrl = initialEntries[0] || '/';
  const search = initialUrl.includes('?') ? initialUrl.slice(initialUrl.indexOf('?')) : '';
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NuqsTestingAdapter searchParams={search} hasMemory>
          {ui}
        </NuqsTestingAdapter>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('DriverComparison Component', () => {
  it('renders head-to-head comparison title and driver selectors', () => {
    renderWithRouter(<DriverComparison />);

    expect(screen.getByRole('heading', { level: 1, name: /HEAD-TO-HEAD/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/PRIMARY PILOT/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/OPPONENT PILOT/i)).toBeInTheDocument();
  });

  it('allows changing compared drivers and updates telemetry metrics', async () => {
    renderWithRouter(<DriverComparison />);

    const driverASelect = screen.getByLabelText(/PRIMARY PILOT/i);
    fireEvent.change(driverASelect, { target: { value: 'HAM' } });

    const driverBSelect = screen.getByLabelText(/OPPONENT PILOT/i);
    fireEvent.change(driverBSelect, { target: { value: 'VER' } });

    await waitFor(() => {
      expect(screen.getAllByText(/Lewis Hamilton/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Max Verstappen/i).length).toBeGreaterThan(0);
    });
  });

  it('toggles between raw and era-normalized mode', () => {
    renderWithRouter(<DriverComparison />);

    const normalizedBtn = screen.getByRole('button', { name: /Era-Normalized/i });
    fireEvent.click(normalizedBtn);

    expect(screen.getByText(/ERA-NORMALIZED CAREER TELEMETRY MATRIX/i)).toBeInTheDocument();

    const rawBtn = screen.getByRole('button', { name: /Raw Totals/i });
    fireEvent.click(rawBtn);

    expect(screen.getByText(/RAW CAREER TELEMETRY MATRIX/i)).toBeInTheDocument();
  });

  it('swaps drivers when swap button is clicked', async () => {
    renderWithRouter(<DriverComparison />);

    const swapBtn = screen.getByLabelText(/Swap Drivers/i);
    fireEvent.click(swapBtn);

    await waitFor(() => {
      const driverASelect = screen.getByLabelText(/PRIMARY PILOT/i) as HTMLSelectElement;
      const driverBSelect = screen.getByLabelText(/OPPONENT PILOT/i) as HTMLSelectElement;

      // Originally VER (A) and HAM (B), after swap HAM should be A and VER should be B
      expect(driverASelect.value).toBe('HAM');
      expect(driverBSelect.value).toBe('VER');
    });
  });
});
