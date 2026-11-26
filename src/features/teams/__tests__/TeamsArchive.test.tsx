import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamsArchive } from '../TeamsArchive';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

const renderWithRouter = (ui: React.ReactElement, initialEntries = ['/teams/ferrari']) => {
  const queryClient = createTestQueryClient();
  const initialUrl = initialEntries[0] || '/';
  const search = initialUrl.includes('?') ? initialUrl.slice(initialUrl.indexOf('?')) : '';
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <NuqsTestingAdapter searchParams={search} hasMemory>
          {ui}
        </NuqsTestingAdapter>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('TeamsArchive Component', () => {
  it('renders constructors archive header and category filters', () => {
    renderWithRouter(<TeamsArchive />);

    expect(screen.getAllByText(/CONSTRUCTORS/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /ACTIVE 2026/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /HISTORIC/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^ALL$/i })).toBeInTheDocument();
  });

  it('switches between active and historic grid filters', () => {
    renderWithRouter(<TeamsArchive />);

    const historicBtn = screen.getByRole('button', { name: /HISTORIC/i });
    fireEvent.click(historicBtn);

    expect(historicBtn.className).toContain('active');
  });

  it('displays team specs and overview for selected constructor', () => {
    renderWithRouter(<TeamsArchive />);

    expect(screen.getByText(/TECHNICAL SPECIFICATIONS/i)).toBeInTheDocument();
    expect(screen.getByText(/WORLD CHAMPIONSHIPS/i)).toBeInTheDocument();
  });
});
