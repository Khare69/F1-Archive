import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConstructorBadge } from '../ConstructorBadge';

describe('ConstructorBadge Component', () => {
  it('renders Ferrari with canonical SF monogram and crimson branding', () => {
    render(<ConstructorBadge teamIdOrName="ferrari" />);
    expect(screen.getByText('SF')).toBeInTheDocument();
    expect(screen.getByText('Scuderia Ferrari')).toBeInTheDocument();
    expect(screen.getByLabelText('Constructor: Scuderia Ferrari')).toBeInTheDocument();
  });

  it('renders 2026 Audi Works constructor with AUD monogram', () => {
    render(<ConstructorBadge teamIdOrName="audi" />);
    expect(screen.getByText('AUD')).toBeInTheDocument();
    expect(screen.getByText('Audi F1 Team')).toBeInTheDocument();
  });

  it('renders 2026 Cadillac constructor with CAD monogram', () => {
    render(<ConstructorBadge teamIdOrName="cadillac" />);
    expect(screen.getByText('CAD')).toBeInTheDocument();
    expect(screen.getByText('Cadillac Formula 1 Team')).toBeInTheDocument();
  });

  it('renders historic Brawn GP with BGP monogram', () => {
    render(<ConstructorBadge teamIdOrName="brawn" />);
    expect(screen.getByText('BGP')).toBeInTheDocument();
    expect(screen.getByText('Brawn GP')).toBeInTheDocument();
  });

  it('renders bar variant with 3px team color bar and monogram', () => {
    const { container } = render(
      <ConstructorBadge teamIdOrName="mclaren" variant="bar" />
    );
    expect(screen.getByText('MCL')).toBeInTheDocument();
    expect(screen.getByText('McLaren F1 Team')).toBeInTheDocument();
    const barEl = container.querySelector('[style*="border-left"]');
    expect(barEl).not.toBeNull();
  });

  it('renders card variant with prominent typography', () => {
    render(<ConstructorBadge teamIdOrName="redbull" variant="card" />);
    expect(screen.getByText('RBR')).toBeInTheDocument();
    expect(screen.getByText('Red Bull Racing')).toBeInTheDocument();
  });

  it('generates deterministic fallback for unknown historical/future teams', () => {
    render(<ConstructorBadge teamIdOrName="Shadow Racing" />);
    expect(screen.getByText('SHA')).toBeInTheDocument();
    expect(screen.getByText('Shadow Racing')).toBeInTheDocument();
  });
});
