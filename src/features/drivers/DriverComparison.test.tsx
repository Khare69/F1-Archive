import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
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

const renderWithRouter = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </BrowserRouter>
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

  it('allows changing compared drivers and updates telemetry metrics', () => {
    renderWithRouter(<DriverComparison />);

    const driverASelect = screen.getByLabelText(/PRIMARY PILOT/i);
    fireEvent.change(driverASelect, { target: { value: 'HAM' } });

    const driverBSelect = screen.getByLabelText(/OPPONENT PILOT/i);
    fireEvent.change(driverBSelect, { target: { value: 'VER' } });

    expect(screen.getAllByText(/Lewis Hamilton/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Max Verstappen/i).length).toBeGreaterThan(0);
  });
});
