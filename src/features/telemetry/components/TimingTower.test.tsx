import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimingTower } from './TimingTower';

describe('TimingTower Component', () => {
  it('renders the live timing tower header, controls, and pilot ladder', () => {
    render(<TimingTower />);

    expect(screen.getByText(/LIVE TIMING TOWER/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PAUSE/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SPEED/i })).toBeInTheDocument();

    // Check presence of top drivers
    expect(screen.getByText('VER')).toBeInTheDocument();
    expect(screen.getByText('NOR')).toBeInTheDocument();
    expect(screen.getByText('LEC')).toBeInTheDocument();
    expect(screen.getByText('HAM')).toBeInTheDocument();
  });

  it('allows toggling play/pause transport state', () => {
    render(<TimingTower />);

    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseBtn);

    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
  });

  it('cycles through speed multipliers on click', () => {
    render(<TimingTower />);

    const speedBtn = screen.getByRole('button', { name: /1x SPEED/i });
    fireEvent.click(speedBtn);

    expect(screen.getByRole('button', { name: /2x SPEED/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /2x SPEED/i }));
    expect(screen.getByRole('button', { name: /4x SPEED/i })).toBeInTheDocument();
  });

  it('renders 2026 Active Aero tags', () => {
    render(<TimingTower />);

    const aeroTags = screen.getAllByText(/STR|CNR/);
    expect(aeroTags.length).toBeGreaterThan(0);
  });
});
