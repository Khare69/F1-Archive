import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Track2DMap, type CornerMarkerItem } from '../Track2DMap';

const mockCoords: [number, number, number][] = [
  [-4, 0.0, -4],
  [0, 0.5, -4],
  [4, 1.2, -4],
  [4, 1.8, 0],
  [4, 1.0, 4],
  [1, 0.6, 4],
  [0, 0.2, 4],
  [-2, 0.1, 2],
  [-4, 0.0, 0],
  [-4, 0.0, -4]
];

const mockCorners: CornerMarkerItem[] = [
  { number: 1, name: 'La Source', t: 0.08, isOvertakingZone: true, isHighDownforce: false },
  { number: 3, name: 'Eau Rouge', t: 0.22, isOvertakingZone: false, isHighDownforce: true },
  { number: 5, name: 'Les Combes', t: 0.38, isOvertakingZone: true, isHighDownforce: false }
];

describe('Track2DMap Component', () => {
  it('renders SVG track map and mounts ZERO WebGL canvas elements', () => {
    const { container } = render(
      <Track2DMap
        circuitName="Spa-Francorchamps"
        coordinates={mockCoords}
        corners={mockCorners}
        colorMode="sectors"
      />
    );

    const svg = screen.getByTestId('track-2d-svg');
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute('viewBox')).toBe('0 0 800 560');

    // Zero <canvas> elements mounted!
    const canvasElements = container.querySelectorAll('canvas');
    expect(canvasElements.length).toBe(0);
  });

  it('renders numbered corner markers (T1, T3, T5) and handles click selection', () => {
    const handleSelectCorner = vi.fn();

    render(
      <Track2DMap
        circuitName="Spa-Francorchamps"
        coordinates={mockCoords}
        corners={mockCorners}
        selectedCornerNumber={null}
        onSelectCorner={handleSelectCorner}
      />
    );

    expect(screen.getByText('T1')).toBeInTheDocument();
    expect(screen.getByText('T3')).toBeInTheDocument();
    expect(screen.getByText('T5')).toBeInTheDocument();

    const t3Marker = screen.getByRole('button', { name: /Turn 3: Eau Rouge/i });
    fireEvent.click(t3Marker);

    expect(handleSelectCorner).toHaveBeenCalledTimes(1);
    expect(handleSelectCorner).toHaveBeenCalledWith(3);
  });

  it('dims corners that do not match the active filterMode', () => {
    render(
      <Track2DMap
        circuitName="Spa-Francorchamps"
        coordinates={mockCoords}
        corners={mockCorners}
        filterMode="overtaking"
      />
    );

    const t1Group = screen.getByRole('button', { name: /Turn 1/i });
    const t3Group = screen.getByRole('button', { name: /Turn 3/i });

    // Turn 1 is an overtaking zone -> full opacity
    expect(t1Group.getAttribute('opacity')).toBe('1');
    // Turn 3 is NOT an overtaking zone -> dimmed opacity
    expect(t3Group.getAttribute('opacity')).toBe('0.22');
  });

  it('highlights the selected corner marker', () => {
    render(
      <Track2DMap
        circuitName="Spa-Francorchamps"
        coordinates={mockCoords}
        corners={mockCorners}
        selectedCornerNumber={3}
      />
    );

    const t3Group = screen.getByRole('button', { name: /Turn 3/i });
    expect(t3Group).toBeInTheDocument();
    // In selected state, circle has fill="#E10600"
    const circles = t3Group.querySelectorAll('circle');
    const fillRed = Array.from(circles).some(c => c.getAttribute('fill') === '#E10600');
    expect(fillRed).toBe(true);
  });
});
