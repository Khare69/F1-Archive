import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from '../Home';
import { ExperienceModeProvider } from '../../../contexts/ExperienceModeContext';

function renderHome(initialMode: 'beginner' | 'enthusiast' | 'developer' = 'enthusiast') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  localStorage.setItem('f1_archive_experience_mode', initialMode);

  return render(
    <QueryClientProvider client={queryClient}>
      <ExperienceModeProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </ExperienceModeProvider>
    </QueryClientProvider>
  );
}

describe('Home Component (I-02 Minimalist Dark Bento Dashboard)', () => {
  it('renders the Season Pulse hero with official headline and archive statistics', () => {
    renderHome();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/THE EVOLUTION OF SPEED/i);
    expect(
      screen.getByText(/HISTORICAL TELEMETRY VAULT \/\/ 1950–2026/i)
    ).toBeInTheDocument();
  });

  it('renders quick action hub launcher links', () => {
    renderHome();

    expect(screen.getByRole('link', { name: /Explore Seasons/i })).toHaveAttribute('href', '/seasons');
    expect(screen.getByRole('link', { name: /3D Vehicle Lab/i })).toHaveAttribute('href', '/lab');
    expect(screen.getByRole('link', { name: /Ghost Telemetry/i })).toHaveAttribute('href', '/telemetry');
    expect(screen.getByRole('link', { name: /Pit-Wall Strategy/i })).toHaveAttribute('href', '/pitwall');
    expect(screen.getByRole('link', { name: /SQL Historian/i })).toHaveAttribute('href', '/historian');
  });

  it('renders the 3 Guided Starter Story cards', () => {
    renderHome();

    expect(screen.getByText('1988 McLaren MP4/4')).toBeInTheDocument();
    expect(screen.getByText('Verstappen vs. Hamilton')).toBeInTheDocument();
    expect(screen.getByText('2026 Active Aerodynamics')).toBeInTheDocument();
  });

  it('renders Timing Tower / Standings preview sidebar card', () => {
    renderHome();

    expect(screen.getByText(/Timing Tower \/\/ Standings/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Full Championship Standings/i })).toHaveAttribute(
      'href',
      '/standings'
    );
  });

  it('displays the beginner insight banner when in beginner mode', () => {
    renderHome('beginner');

    expect(screen.getByText(/New to Formula 1\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Look for dotted underlines/i)).toBeInTheDocument();
  });
});
