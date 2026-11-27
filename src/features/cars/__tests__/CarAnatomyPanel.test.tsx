import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CarAnatomyPanel } from '../components/CarAnatomyPanel';
import type { CarHotspot } from '../../../data/carHotspots';

const mockHotspot: CarHotspot = {
  id: 'halo_safety_cell',
  label: 'Halo Safety Cell',
  category: 'safety',
  position: [0.18, 0.72, 0.0],
  cameraTarget: {
    position: [1.2, 1.4, 1.2],
    target: [0.18, 0.65, 0.0],
  },
  applicableEras: ['2024_ground_effect', '2026_active_aero'],
  plainEnglish: 'A protective titanium framework curved around the driver helmet.',
  technicalSpec: 'FIA 8869-2018 Grade 5 Titanium monocoque hoop withstanding 125 kN.',
};

describe('CarAnatomyPanel Component', () => {
  it('renders hotspot title, category badge, and default plain English description', () => {
    const handleClose = vi.fn();
    render(<CarAnatomyPanel hotspot={mockHotspot} onClose={handleClose} />);

    expect(screen.getByText('Halo Safety Cell')).toBeInTheDocument();
    expect(screen.getByText('// SAFETY CELL')).toBeInTheDocument();
    expect(screen.getByText(/protective titanium framework/i)).toBeInTheDocument();
  });

  it('switches between Plain English and Technical Spec tabs', () => {
    const handleClose = vi.fn();
    render(<CarAnatomyPanel hotspot={mockHotspot} onClose={handleClose} />);

    // Default: Plain English tab is active
    expect(screen.getByText(/protective titanium framework/i)).toBeInTheDocument();

    // Click Technical Spec tab
    const specTab = screen.getByRole('tab', { name: /TECHNICAL SPEC/i });
    fireEvent.click(specTab);

    expect(screen.getByText(/FIA 8869-2018 Grade 5 Titanium/i)).toBeInTheDocument();

    // Click back to Plain English tab
    const plainTab = screen.getByRole('tab', { name: /PLAIN ENGLISH/i });
    fireEvent.click(plainTab);

    expect(screen.getByText(/protective titanium framework/i)).toBeInTheDocument();
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<CarAnatomyPanel hotspot={mockHotspot} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /Close anatomy panel/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
