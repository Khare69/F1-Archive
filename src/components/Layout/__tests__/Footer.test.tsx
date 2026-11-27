import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from '../Footer';

describe('Footer Component', () => {
  it('renders official trademark disclaimers and open-source data attributions', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // Unofficial Formula 1 disclaimer
    expect(
      screen.getByText(/This website is unofficial and is not associated in any way with the Formula 1 companies/i)
    ).toBeInTheDocument();

    // Trademark ownership attribution
    expect(
      screen.getByText(/Formula One Licensing B\.V\./i)
    ).toBeInTheDocument();

    // F1DB and circuits dataset licenses
    expect(
      screen.getByText(/F1DB CC-BY-4\.0/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/bacinger\/f1-circuits MIT/i)
    ).toBeInTheDocument();
  });

  it('renders navigation links across all core archive and engineering hubs', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /^HOME$/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /^STANDINGS$/i })).toHaveAttribute('href', '/standings');
    expect(screen.getByRole('link', { name: /^SEASONS$/i })).toHaveAttribute('href', '/seasons');
    expect(screen.getByRole('link', { name: /^CONSTRUCTORS$/i })).toHaveAttribute('href', '/teams');
    expect(screen.getByRole('link', { name: /^DRIVERS$/i })).toHaveAttribute('href', '/drivers');
    expect(screen.getByRole('link', { name: /^COMPARE$/i })).toHaveAttribute('href', '/drivers/compare');
    expect(screen.getByRole('link', { name: /^CIRCUITS$/i })).toHaveAttribute('href', '/circuits');
    expect(screen.getByRole('link', { name: /^TELEMETRY$/i })).toHaveAttribute('href', '/telemetry');
    expect(screen.getByRole('link', { name: /^PIT WALL$/i })).toHaveAttribute('href', '/pitwall');
    expect(screen.getByRole('link', { name: /^3D LAB$/i })).toHaveAttribute('href', '/lab');
    expect(screen.getByRole('link', { name: /^HISTORIAN$/i })).toHaveAttribute('href', '/historian');
  });
});
