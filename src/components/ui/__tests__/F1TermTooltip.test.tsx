import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { F1TermTooltip } from '../F1TermTooltip';
import { ExperienceModeProvider } from '../../../contexts/ExperienceModeContext';
import { getGlossaryTerm } from '../../../data/f1Glossary';

describe('F1TermTooltip Component (C-42 25-Term Glossary)', () => {
  it('renders trigger element with accessible label for verified glossary term', () => {
    render(
      <ExperienceModeProvider>
        <F1TermTooltip termKey="undercut">
          <span>Pit Undercut Strategy</span>
        </F1TermTooltip>
      </ExperienceModeProvider>
    );

    const trigger = screen.getByTestId('f1-term-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Pit Undercut Strategy');
    expect(trigger).toHaveAttribute('aria-label', expect.stringContaining('Formula 1 term: Undercut'));
  });

  it('gracefully renders children without trigger wrapper when termKey is unknown', () => {
    render(
      <ExperienceModeProvider>
        <F1TermTooltip termKey="non-existent-f1-term">
          <span>Standard Text</span>
        </F1TermTooltip>
      </ExperienceModeProvider>
    );

    expect(screen.queryByTestId('f1-term-trigger')).not.toBeInTheDocument();
    expect(screen.getByText('Standard Text')).toBeInTheDocument();
  });

  it('contains complete verified glossary data across all 25 F1 terms', () => {
    const termKeys = [
      'undercut', 'overcut', 'drs', 'pole-to-win', 'ground-effect',
      'parc-ferme', 'tyre-deg', 'venturi-tunnels', 'active-aero', 'mgu-k',
      'clean-air', 'dirty-air', 'slipstream', 'delta', 'apex',
      'chicane', 'safety-car', 'vsc', 'stint', 'compound',
      'graining', 'blistering', 'q1-q3', 'constructors-title', 'fastest-lap'
    ];

    expect(termKeys.length).toBe(25);

    for (const key of termKeys) {
      const entry = getGlossaryTerm(key);
      expect(entry).toBeDefined();
      expect(entry?.term).toBeTruthy();
      expect(entry?.shortDef).toBeTruthy();
      expect(entry?.detail).toBeTruthy();
      expect(entry?.category).toBeTruthy();
    }
  });
});
