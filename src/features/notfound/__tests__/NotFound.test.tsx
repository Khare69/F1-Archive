import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFound } from '../NotFound';

describe('NotFound Component (404 Sector Fault)', () => {
  it('renders 404 telemetry fault code and sector out of bounds message', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('SIGNAL_NOT_FOUND')).toBeInTheDocument();
    expect(screen.getByText(/FIA RACE CONTROL \/\/ TELEMETRY LINK SEVERED/i)).toBeInTheDocument();
    expect(screen.getByText(/SECTOR OUT OF BOUNDS \/\//i)).toBeInTheDocument();
  });

  it('renders recovery link returning to Race Control root path', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    const returnBtn = screen.getByRole('link', { name: /RETURN TO RACE CONTROL/i });
    expect(returnBtn).toBeInTheDocument();
    expect(returnBtn).toHaveAttribute('href', '/');

    // Quick links
    expect(screen.getByRole('link', { name: /LIVE STANDINGS/i })).toHaveAttribute('href', '/standings');
    expect(screen.getByRole('link', { name: /3D CIRCUITS/i })).toHaveAttribute('href', '/circuits');
    expect(screen.getByRole('link', { name: /3D CAR LAB/i })).toHaveAttribute('href', '/lab');
  });
});
