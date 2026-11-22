import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DriverComparison } from './DriverComparison';

describe('DriverComparison Component', () => {
  it('renders head-to-head comparison title and driver selectors', () => {
    render(
      <BrowserRouter>
        <DriverComparison />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /HEAD-TO-HEAD/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/PRIMARY PILOT/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/OPPONENT PILOT/i)).toBeInTheDocument();
  });

  it('allows changing compared drivers and updates telemetry metrics', () => {
    render(
      <BrowserRouter>
        <DriverComparison />
      </BrowserRouter>
    );

    const driverASelect = screen.getByLabelText(/PRIMARY PILOT/i);
    fireEvent.change(driverASelect, { target: { value: 'HAM' } });

    const driverBSelect = screen.getByLabelText(/OPPONENT PILOT/i);
    fireEvent.change(driverBSelect, { target: { value: 'VER' } });

    expect(screen.getAllByText(/Lewis Hamilton/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Max Verstappen/i).length).toBeGreaterThan(0);
  });
});
