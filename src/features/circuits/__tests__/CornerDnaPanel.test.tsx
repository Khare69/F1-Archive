import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CornerDnaPanel } from '../CornerDnaPanel';
import type { CornerMarkerItem } from '../Track2DMap';

const mockCorners: CornerMarkerItem[] = [
  {
    number: 1,
    name: 'La Source',
    t: 0.05,
    speedKmh: 68,
    gear: 2,
    brakingG: 5.2,
    lateralG: 2.1,
    brakingDistanceM: 118,
    isOvertakingZone: true,
    isHighDownforce: false,
    notes: 'Tight hairpin after start straight.',
    famousOvertake: 'Grosjean multi-car pileup (2012)'
  },
  {
    number: 3,
    name: 'Eau Rouge',
    t: 0.18,
    speedKmh: 305,
    gear: 8,
    brakingG: null,
    lateralG: 4.8,
    brakingDistanceM: null,
    isOvertakingZone: false,
    isHighDownforce: true,
    notes: 'Steep 17% uphill compression taken flat out.',
    famousOvertake: 'Webber pass on Alonso (2011)'
  },
  {
    number: 5,
    name: 'Les Combes',
    t: 0.36,
    speedKmh: 142,
    gear: 3,
    brakingG: 5.4,
    lateralG: 3.2,
    brakingDistanceM: 125,
    isOvertakingZone: true,
    isHighDownforce: false,
    notes: 'Heavy braking chicane after Kemmel Straight.'
  }
];

describe('CornerDnaPanel Component', () => {
  it('renders active corner telemetry metrics, notes, and famous overtake callout', () => {
    const handleSelect = vi.fn();
    const handleFilterChange = vi.fn();

    render(
      <CornerDnaPanel
        circuitName="Spa-Francorchamps"
        corners={mockCorners}
        selectedCornerNumber={1}
        onSelectCorner={handleSelect}
        filterMode="all"
        onFilterModeChange={handleFilterChange}
      />
    );

    expect(screen.getAllByText('T1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: /La Source/i })).toBeInTheDocument();
    expect(screen.getByText('68 km/h')).toBeInTheDocument();
    expect(screen.getByText('G2')).toBeInTheDocument();
    expect(screen.getByText(/5\.2 G · 118m/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.1 G/i)).toBeInTheDocument();
    expect(screen.getByText(/Tight hairpin after start straight/i)).toBeInTheDocument();
    expect(screen.getByText(/Grosjean multi-car pileup/i)).toBeInTheDocument();
  });

  it('filters corners by Overtaking Zones vs High Downforce', () => {
    const handleFilterChange = vi.fn();

    const { rerender } = render(
      <CornerDnaPanel
        circuitName="Spa-Francorchamps"
        corners={mockCorners}
        selectedCornerNumber={1}
        onSelectCorner={vi.fn()}
        filterMode="all"
        onFilterModeChange={handleFilterChange}
      />
    );

    const overtakeBtn = screen.getByRole('button', { name: /Overtake \(2\)/i });
    fireEvent.click(overtakeBtn);
    expect(handleFilterChange).toHaveBeenCalledWith('overtaking');

    // Rerender in overtaking filter mode
    rerender(
      <CornerDnaPanel
        circuitName="Spa-Francorchamps"
        corners={mockCorners}
        selectedCornerNumber={1}
        onSelectCorner={vi.fn()}
        filterMode="overtaking"
        onFilterModeChange={handleFilterChange}
      />
    );

    // Turn 1 and Turn 5 are overtaking, Turn 3 is not
    expect(screen.getByRole('button', { name: /La Source/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Les Combes/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Eau Rouge/i })).not.toBeInTheDocument();
  });

  it('steps between corners using next and previous buttons', () => {
    const handleSelect = vi.fn();

    render(
      <CornerDnaPanel
        circuitName="Spa-Francorchamps"
        corners={mockCorners}
        selectedCornerNumber={1}
        onSelectCorner={handleSelect}
        filterMode="all"
        onFilterModeChange={vi.fn()}
      />
    );

    const nextBtn = screen.getByRole('button', { name: /Next Corner/i });
    fireEvent.click(nextBtn);

    expect(handleSelect).toHaveBeenCalledWith(3);
  });

  it('renders honest state without fake numbers when isAutoDetected is true', () => {
    const autoCorners: CornerMarkerItem[] = [
      {
        number: 1,
        name: 'Geometric Apex T1',
        t: 0.12,
        isAutoDetected: true,
        notes: 'Auto-detected geometric apex'
      }
    ];

    render(
      <CornerDnaPanel
        circuitName="1950s Classic Track"
        corners={autoCorners}
        isAutoDetected={true}
        selectedCornerNumber={1}
        onSelectCorner={vi.fn()}
        filterMode="all"
        onFilterModeChange={vi.fn()}
      />
    );

    expect(screen.getByText(/Auto-detected geometric apex — historical telemetry unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/MIN SPEED/i)).not.toBeInTheDocument();
  });
});
