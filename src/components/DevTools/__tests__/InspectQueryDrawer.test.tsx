import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InspectQueryButton } from '../InspectQueryButton';
import { InspectQueryDrawer } from '../InspectQueryDrawer';
import {
  InspectQueryProvider,
  useInspectQuery,
} from '../../../contexts/InspectQueryContext';
import { ExperienceModeProvider } from '../../../contexts/ExperienceModeContext';
import { sqlClient } from '../../../features/historian/sqlClient';

const SAMPLE_QUERY = {
  title: 'Top 10 All-Time Grand Prix Winners',
  sql: 'SELECT d.name, d.abbreviation, COUNT(*) AS wins FROM race_result rr JOIN driver d ON rr.driver_id = d.id WHERE rr.position_number = 1 GROUP BY d.id ORDER BY wins DESC LIMIT 10;',
};

function renderWithProviders(
  ui: React.ReactNode,
  mode: 'beginner' | 'enthusiast' | 'developer' = 'developer'
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  localStorage.setItem('f1_archive_experience_mode', mode);

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ExperienceModeProvider>
          <InspectQueryProvider>{ui}</InspectQueryProvider>
        </ExperienceModeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('InspectQueryButton Component', () => {
  it('is completely hidden in beginner mode to keep newcomer UI clean', () => {
    renderWithProviders(
      <InspectQueryButton query={SAMPLE_QUERY} />,
      'beginner'
    );

    expect(screen.queryByTestId('inspect-query-btn-dev')).not.toBeInTheDocument();
    expect(screen.queryByTestId('inspect-query-btn-subtle')).not.toBeInTheDocument();
  });

  it('renders subtle ghost button in enthusiast mode', () => {
    renderWithProviders(
      <InspectQueryButton query={SAMPLE_QUERY} />,
      'enthusiast'
    );

    expect(screen.getByTestId('inspect-query-btn-subtle')).toBeInTheDocument();
    expect(screen.queryByTestId('inspect-query-btn-dev')).not.toBeInTheDocument();
  });

  it('renders prominent monospace trigger button in developer mode', () => {
    renderWithProviders(
      <InspectQueryButton query={SAMPLE_QUERY} label="Inspect Standings SQL" />,
      'developer'
    );

    const btn = screen.getByTestId('inspect-query-btn-dev');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Inspect Standings SQL');
  });
});

describe('InspectQueryDrawer Live SQLite Verification', () => {
  it('executes real F1DB SQLite queries successfully with 0 errors and returns valid rows', async () => {
    // 1. Home / Standings top winners query
    const res1 = await sqlClient.executeQuery(SAMPLE_QUERY.sql);
    expect(res1.status).toBe('ok');
    expect(res1.rowCount).toBeGreaterThan(0);
    expect(res1.rows[0]).toHaveProperty('name');
    expect(res1.rows[0]).toHaveProperty('wins');

    // 2. Season driver standings query
    const res2 = await sqlClient.executeQuery(
      'SELECT sds.position_number, d.name AS driver_name, d.abbreviation, sds.points FROM season_driver_standing sds JOIN driver d ON sds.driver_id = d.id WHERE sds.year = (SELECT MAX(year) FROM season_driver_standing) ORDER BY sds.position_number ASC LIMIT 20;'
    );
    expect(res2.status).toBe('ok');
    expect(res2.rowCount).toBeGreaterThan(0);

    // 3. Season race winners query
    const res3 = await sqlClient.executeQuery(
      'SELECT r.round, r.official_name, d.name AS winner, rr.laps FROM race r JOIN race_result rr ON r.id = rr.race_id JOIN driver d ON rr.driver_id = d.id WHERE r.year = 2024 AND rr.position_number = 1 ORDER BY r.round ASC;'
    );
    expect(res3.status).toBe('ok');
    expect(res3.rowCount).toBeGreaterThan(0);

    // 4. Head-to-head career query
    const res4 = await sqlClient.executeQuery(
      "SELECT d.name, d.abbreviation, COUNT(CASE WHEN rr.position_number = 1 THEN 1 END) AS wins, COUNT(*) AS total_races FROM driver d JOIN race_result rr ON d.id = rr.driver_id WHERE d.id IN ('max-verstappen', 'lewis-hamilton') GROUP BY d.id;"
    );
    expect(res4.status).toBe('ok');
    expect(res4.rowCount).toBeGreaterThan(0);

    // 5. Circuit winners query
    const res5 = await sqlClient.executeQuery(
      "SELECT r.year, r.round, r.official_name, d.name AS winner FROM race r JOIN race_result rr ON r.id = rr.race_id JOIN driver d ON rr.driver_id = d.id WHERE r.circuit_id = 'monza' AND rr.position_number = 1 ORDER BY r.year DESC LIMIT 20;"
    );
    expect(res5.status).toBe('ok');
    expect(res5.rowCount).toBeGreaterThan(0);
  });

  it('renders drawer and executes query when trigger button is clicked', async () => {
    const user = userEvent.setup();

    const TestPage: React.FC = () => {
      return (
        <div>
          <InspectQueryButton query={SAMPLE_QUERY} />
          <InspectQueryDrawer />
        </div>
      );
    };

    renderWithProviders(<TestPage />, 'developer');

    // Click to open drawer
    await user.click(screen.getByTestId('inspect-query-btn-dev'));

    // Drawer should now be visible
    expect(screen.getByTestId('inspect-query-drawer')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /Top 10 All-Time Grand Prix Winners/i })
    ).toBeInTheDocument();

    // Close button dismisses drawer
    const closeBtn = screen.getByRole('button', { name: /Close inspector drawer/i });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('inspect-query-drawer')).not.toBeInTheDocument();
    });
  });
});
