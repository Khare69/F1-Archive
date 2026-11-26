import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DriverComparison } from '../DriverComparison';
import { DriversArchive } from '../DriversArchive';
import { CopyShareLinkButton } from '../../../components/ui/CopyShareLinkButton';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement, initialUrl = '/') => {
  const queryClient = createTestQueryClient();
  const search = initialUrl.includes('?') ? initialUrl.slice(initialUrl.indexOf('?')) : '';
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[initialUrl]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <NuqsTestingAdapter searchParams={search} hasMemory>
          {ui}
        </NuqsTestingAdapter>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('UrlStateHydration & Shareable State', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrates Ayrton Senna, Alain Prost, and Era-Normalized mode from query params and sets matching og:title', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/drivers/compare" element={<DriverComparison />} />
      </Routes>,
      '/drivers/compare?d1=SEN&d2=PRO&mode=normalized'
    );

    // Verify drivers hydrated
    await waitFor(() => {
      expect(screen.getAllByText(/Ayrton Senna/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Alain Prost/i).length).toBeGreaterThan(0);
    });

    // Verify mode button is toggled to normalized
    const normalizedBtn = screen.getByRole('button', { name: /Era-Normalized/i });
    expect(normalizedBtn.className).toContain('font-bold');

    // Verify OpenGraph title
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    expect(ogTitle).toContain('Ayrton Senna');
    expect(ogTitle).toContain('Alain Prost');
  });

  it('safely falls back to valid defaults (VER, HAM, raw) with malformed params with zero crashes', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/drivers/compare" element={<DriverComparison />} />
      </Routes>,
      '/drivers/compare?d1=INVALID&d2=9999&mode=bogus'
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Max Verstappen/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Lewis Hamilton/i).length).toBeGreaterThan(0);
    });

    const rawBtn = screen.getByRole('button', { name: /Raw Totals/i });
    expect(rawBtn.className).toContain('font-bold');
  });

  it('hydrates filtered champion results from /drivers?filter=champions&q=prost', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/drivers" element={<DriversArchive />} />
      </Routes>,
      '/drivers?filter=champions&q=prost'
    );

    await waitFor(() => {
      expect(screen.getByText(/Alain Prost/i)).toBeInTheDocument();
    });

    // Check search input value
    const searchInput = screen.getByPlaceholderText(/Search pilot/i) as HTMLInputElement;
    expect(searchInput.value).toBe('prost');

    // Check Champions tab is active
    const championsTab = screen.getByRole('button', { name: /CHAMPIONS/i });
    expect(championsTab.className).toContain('active');
  });

  it('invokes clipboard write cleanly when clicking CopyShareLinkButton', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    renderWithProviders(<CopyShareLinkButton label="Share View" copiedLabel="Link Copied" />);

    const button = screen.getByRole('button', { name: /Share View/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      expect(screen.getByText(/Link Copied/i)).toBeInTheDocument();
    });
  });
});
