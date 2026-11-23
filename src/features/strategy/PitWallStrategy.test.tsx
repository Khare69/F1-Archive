import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PitWallStrategy } from './PitWallStrategy';

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

describe('PitWallStrategy Component', () => {
  it('renders headline, circuit selector, and strategy cards', () => {
    renderWithRouter(<PitWallStrategy />);

    expect(screen.getByRole('heading', { level: 1, name: /PIT WALL STRATEGY/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/GRAND PRIX CIRCUIT/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /EXPORT POSTER/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Strategy A/i).length).toBeGreaterThan(0);
  });

  it('allows switching grand prix circuits and recalculating strategy', () => {
    renderWithRouter(<PitWallStrategy />);

    const circuitSelect = screen.getByLabelText(/GRAND PRIX CIRCUIT/i);
    fireEvent.change(circuitSelect, { target: { value: 'monaco' } });

    expect(screen.getByText(/Monaco \(Monte Carlo\)/i)).toBeInTheDocument();
  });

  it('allows adjusting safety car probability slider', () => {
    renderWithRouter(<PitWallStrategy />);

    const scSlider = screen.getByLabelText(/SAFETY CAR \/ VSC INDEX/i);
    fireEvent.change(scSlider, { target: { value: '0.8' } });

    expect(screen.getByText(/80%/i)).toBeInTheDocument();
  });
});
