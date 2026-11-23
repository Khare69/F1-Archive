import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RaceHistorian } from './RaceHistorian';

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

describe('RaceHistorian Component', () => {
  it('renders the historian headline, Tier 1 status, and inspectable SQL inspector', () => {
    renderWithRouter(<RaceHistorian />);

    expect(screen.getByRole('heading', { level: 1, name: /RACE HISTORIAN/i })).toBeInTheDocument();
    expect(screen.getByText(/TIER 1: CLIENT IN-MEMORY F1DB ACTIVE/i)).toBeInTheDocument();
    expect(screen.getByText(/INSPECTABLE SQL/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /COPY SQL/i })).toBeInTheDocument();
  });

  it('allows selecting an analytical preset and updating the SQL query display', () => {
    renderWithRouter(<RaceHistorian />);

    // Click the "Constructor Championship Leaders" preset chip
    const constructorChip = screen.getByRole('button', { name: /Constructor Championship Leaders/i });
    fireEvent.click(constructorChip);

    expect(screen.getAllByText(/constructors/i).length).toBeGreaterThan(0);
  });

  it('supports custom natural language search input and executes query', () => {
    renderWithRouter(<RaceHistorian />);

    const searchInput = screen.getByLabelText(/Natural language Formula 1 query/i);
    fireEvent.change(searchInput, { target: { value: 'Tell me about Fernando Alonso' } });

    const submitBtn = screen.getByRole('button', { name: /GENERATE & EXECUTE SQL/i });
    fireEvent.click(submitBtn);

    expect(screen.getAllByText(/Alonso/i).length).toBeGreaterThan(0);
  });

  it('toggles between Table view and Bar Chart view', () => {
    renderWithRouter(<RaceHistorian />);

    const barChartBtn = screen.getByRole('button', { name: /^BAR CHART$/i });
    fireEvent.click(barChartBtn);

    expect(barChartBtn).toHaveClass('active');

    const tableBtn = screen.getByRole('button', { name: /^TABLE$/i });
    fireEvent.click(tableBtn);

    expect(tableBtn).toHaveClass('active');
  });
});
