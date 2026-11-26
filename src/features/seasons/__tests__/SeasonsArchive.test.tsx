import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SeasonsArchive } from '../SeasonsArchive';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

const renderWithRouter = (ui: React.ReactElement, initialEntries = ['/seasons/2024']) => {
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

describe('SeasonsArchive Component', () => {
  it('renders season championship details and timeline selector', () => {
    renderWithRouter(<SeasonsArchive />);

    expect(screen.getByText(/FIA FORMULA ONE WORLD CHAMPIONSHIP/i)).toBeInTheDocument();
    expect(screen.getByText(/2020s/i)).toBeInTheDocument();
  });

  it('renders mode switch navigation tabs', () => {
    renderWithRouter(<SeasonsArchive />);

    expect(screen.getByRole('button', { name: /OVERVIEW/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PROGRESSION/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /WHAT-IF/i })).toBeInTheDocument();
  });
});
