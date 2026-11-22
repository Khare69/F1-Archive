import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard Component', () => {
  it('renders label and value correctly', () => {
    render(
      <StatCard
        label="RACE WINS"
        value="103"
        subtext="Career Total"
        accentColor="#00D2FF"
      />
    );

    expect(screen.getByText('RACE WINS')).toBeInTheDocument();
    expect(screen.getByText('103')).toBeInTheDocument();
    expect(screen.getByText('Career Total')).toBeInTheDocument();
  });

  it('renders primary status card when isPrimary is true', () => {
    const { container } = render(
      <StatCard
        label="WORLD TITLES"
        value="7"
        isPrimary={true}
        accentColor="#FFD700"
      />
    );

    const card = container.querySelector('.stat-card');
    expect(card).toHaveClass('stat-primary');
  });
});
