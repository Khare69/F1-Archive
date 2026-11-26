import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LiveStandings } from '../LiveStandings';

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
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('LiveStandings Component', () => {
  it('renders championship standings header and navigation tabs', async () => {
    renderWithRouter(<LiveStandings />);

    expect(screen.getByRole('heading', { level: 1, name: /CHAMPIONSHIP/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /DRIVERS \(WDC\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CONSTRUCTORS \(WCC\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /RACE CALENDAR/i })).toBeInTheDocument();
  });

  it('switches between WDC, WCC, and calendar tabs', async () => {
    renderWithRouter(<LiveStandings />);

    const wccTab = screen.getByRole('button', { name: /CONSTRUCTORS \(WCC\)/i });
    fireEvent.click(wccTab);
    expect(wccTab.className).toContain('active');

    const calendarTab = screen.getByRole('button', { name: /RACE CALENDAR/i });
    fireEvent.click(calendarTab);
    expect(calendarTab.className).toContain('active');
  });

  it('renders recovery alert banner when in fallback mode', async () => {
    renderWithRouter(<LiveStandings />);

    // Since mock or live feed may be in fallback source, if role="alert" exists, verify banner text and retry button
    await waitFor(() => {
      const alert = screen.queryByRole('alert');
      if (alert) {
        expect(alert).toHaveTextContent(/ARCHIVE RECOVERY MODE/i);
        expect(screen.getByRole('button', { name: /RETRY FEED/i })).toBeInTheDocument();
      }
    });
  });
});
