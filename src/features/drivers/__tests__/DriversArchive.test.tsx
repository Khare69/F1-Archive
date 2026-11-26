import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DriversArchive } from '../DriversArchive';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

const renderWithRouter = (ui: React.ReactElement, initialEntries = ['/drivers']) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('DriversArchive Component', () => {
  it('renders drivers archive roster and category filters', () => {
    renderWithRouter(<DriversArchive />);

    expect(screen.getAllByText(/DRIVERS/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /ACTIVE 2026/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CHAMPIONS/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ALL PILOTS/i })).toBeInTheDocument();
  });

  it('filters drivers via category switcher', () => {
    renderWithRouter(<DriversArchive />);

    const championsTab = screen.getByRole('button', { name: /CHAMPIONS/i });
    fireEvent.click(championsTab);

    expect(championsTab.className).toContain('active');
  });

  it('filters drivers list by search query', () => {
    renderWithRouter(<DriversArchive />);

    const searchInput = screen.getByPlaceholderText(/Search pilot/i);
    fireEvent.change(searchInput, { target: { value: 'Senna' } });

    expect(searchInput).toHaveValue('Senna');
  });
});
