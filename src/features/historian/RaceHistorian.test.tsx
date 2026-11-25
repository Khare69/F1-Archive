import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RaceHistorian } from './RaceHistorian';
import { sqlClient } from './sqlClient';
import type { HistorianQueryResult } from './types';

// Mock sqlClient for jsdom environment (FND-03 compliant)
vi.mock('./sqlClient', () => {
  return {
    sqlClient: {
      initDatabase: vi.fn().mockResolvedValue(undefined),
      getEntityIndex: vi.fn().mockResolvedValue({
        drivers: [
          { id: 'fernando-alonso', name: 'Fernando Alonso', surname: 'Alonso', aliases: ['alonso'] }
        ],
        constructors: [
          { id: 'ferrari', name: 'Ferrari', aliases: ['scuderia ferrari'] }
        ],
        circuits: [
          { id: 'monza', name: 'Monza', aliases: ['autodromo nazionale di monza'] }
        ]
      }),
      executeQuery: vi.fn().mockImplementation(async (sql: string): Promise<HistorianQueryResult> => {
        if (sql.includes('Fernando Alonso') || sql.includes('fernando-alonso') || sql.includes('Alonso')) {
          return {
            status: 'ok',
            queryTitle: 'Fernando Alonso Profile',
            explanation: 'Driver career statistics for Fernando Alonso.',
            sql,
            params: ['fernando-alonso'],
            source: 'sqlite_wasm',
            rowCount: 1,
            executionTimeMs: 5,
            columns: [
              { key: 'driver', label: 'DRIVER', type: 'string' },
              { key: 'wins', label: 'WINS', type: 'number' }
            ],
            rows: [{ driver: 'Fernando Alonso', wins: 32 }]
          };
        }

        if (sql.includes('constructor')) {
          return {
            status: 'ok',
            queryTitle: 'Constructor Championship Leaders',
            explanation: 'Aggregates all title-winning constructors.',
            sql,
            params: [],
            source: 'sqlite_wasm',
            rowCount: 2,
            executionTimeMs: 4,
            columns: [
              { key: 'name', label: 'NAME', type: 'string' },
              { key: 'titles', label: 'TITLES', type: 'number' }
            ],
            rows: [
              { name: 'Ferrari', titles: 16 },
              { name: 'Williams', titles: 9 }
            ]
          };
        }

        return {
          status: 'ok',
          queryTitle: 'Top 10 All-Time Grand Prix Winners',
          explanation: 'Ranks all-time Grand Prix winners.',
          sql,
          params: [],
          source: 'sqlite_wasm',
          rowCount: 1,
          executionTimeMs: 3,
          columns: [
            { key: 'driver', label: 'DRIVER', type: 'string' },
            { key: 'wins', label: 'WINS', type: 'number' }
          ],
          rows: [{ driver: 'Lewis Hamilton', wins: 103 }]
        };
      })
    }
  };
});

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the historian headline, Tier 1 SQLite status, and live SQL editor', async () => {
    renderWithRouter(<RaceHistorian />);

    expect(screen.getByRole('heading', { level: 1, name: /RACE HISTORIAN/i })).toBeInTheDocument();
    expect(screen.getByText(/SQLITE-WASM \(LOCAL\)/i)).toBeInTheDocument();
    expect(screen.getByText(/LIVE SQL EDITOR/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /COPY SQL/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(sqlClient.executeQuery).toHaveBeenCalled();
    });
  });

  it('allows selecting an analytical preset and updating the SQL query display', async () => {
    renderWithRouter(<RaceHistorian />);

    // Click the "All-Time Constructors Champions" preset chip
    const constructorChip = await screen.findByRole('button', { name: /Constructors Champions/i });
    fireEvent.click(constructorChip);

    await waitFor(() => {
      expect(screen.getAllByText(/constructors/i).length).toBeGreaterThan(0);
    });
  });

  it('supports custom natural language search input and executes query', async () => {
    renderWithRouter(<RaceHistorian />);

    const searchInput = screen.getByLabelText(/Natural language Formula 1 query/i);
    fireEvent.change(searchInput, { target: { value: 'Tell me about Fernando Alonso' } });

    const submitBtn = screen.getByRole('button', { name: /GENERATE & EXECUTE SQL/i });
    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Alonso/i).length).toBeGreaterThan(0);
    });
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
