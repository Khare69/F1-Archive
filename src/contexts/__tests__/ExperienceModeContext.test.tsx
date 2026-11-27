import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ExperienceModeProvider,
  useExperienceMode,
} from '../ExperienceModeContext';
import { safeStorage } from '../../utils/safeStorage';

const TestConsumer: React.FC = () => {
  const { mode, setMode, cycleMode, isBeginner, isEnthusiast, isDeveloper } =
    useExperienceMode();

  return (
    <div>
      <span data-testid="current-mode">{mode}</span>
      <span data-testid="is-beginner">{String(isBeginner)}</span>
      <span data-testid="is-enthusiast">{String(isEnthusiast)}</span>
      <span data-testid="is-developer">{String(isDeveloper)}</span>
      <button onClick={() => setMode('beginner')}>Set Beginner</button>
      <button onClick={() => setMode('developer')}>Set Developer</button>
      <button onClick={() => setMode('enthusiast')}>Set Enthusiast</button>
      <button onClick={cycleMode}>Cycle Mode</button>
    </div>
  );
};

describe('ExperienceModeContext (C-42 Audience Depth Layer)', () => {
  beforeEach(() => {
    safeStorage.removeItem('f1_archive_experience_mode');
    document.documentElement.dataset.experienceMode = '';
  });

  it('defaults to enthusiast mode and updates dataset on documentElement', () => {
    render(
      <ExperienceModeProvider>
        <TestConsumer />
      </ExperienceModeProvider>
    );

    expect(screen.getByTestId('current-mode')).toHaveTextContent('enthusiast');
    expect(screen.getByTestId('is-enthusiast')).toHaveTextContent('true');
    expect(screen.getByTestId('is-beginner')).toHaveTextContent('false');
    expect(screen.getByTestId('is-developer')).toHaveTextContent('false');
    expect(document.documentElement.dataset.experienceMode).toBe('enthusiast');
  });

  it('allows explicit mode updates and persists to safeStorage', async () => {
    const user = userEvent.setup();

    render(
      <ExperienceModeProvider>
        <TestConsumer />
      </ExperienceModeProvider>
    );

    await user.click(screen.getByRole('button', { name: /Set Beginner/i }));

    expect(screen.getByTestId('current-mode')).toHaveTextContent('beginner');
    expect(screen.getByTestId('is-beginner')).toHaveTextContent('true');
    expect(safeStorage.getItem('f1_archive_experience_mode')).toBe('beginner');
    expect(document.documentElement.dataset.experienceMode).toBe('beginner');

    await user.click(screen.getByRole('button', { name: /Set Developer/i }));

    expect(screen.getByTestId('current-mode')).toHaveTextContent('developer');
    expect(screen.getByTestId('is-developer')).toHaveTextContent('true');
    expect(safeStorage.getItem('f1_archive_experience_mode')).toBe('developer');
    expect(document.documentElement.dataset.experienceMode).toBe('developer');
  });

  it('cycles mode sequentially: enthusiast -> developer -> beginner -> enthusiast', async () => {
    const user = userEvent.setup();

    render(
      <ExperienceModeProvider>
        <TestConsumer />
      </ExperienceModeProvider>
    );

    // Initial is enthusiast
    expect(screen.getByTestId('current-mode')).toHaveTextContent('enthusiast');

    // Cycle 1: developer
    await user.click(screen.getByRole('button', { name: /Cycle Mode/i }));
    expect(screen.getByTestId('current-mode')).toHaveTextContent('developer');

    // Cycle 2: beginner
    await user.click(screen.getByRole('button', { name: /Cycle Mode/i }));
    expect(screen.getByTestId('current-mode')).toHaveTextContent('beginner');

    // Cycle 3: enthusiast
    await user.click(screen.getByRole('button', { name: /Cycle Mode/i }));
    expect(screen.getByTestId('current-mode')).toHaveTextContent('enthusiast');
  });

  it('restores persisted mode from safeStorage upon mount', () => {
    safeStorage.setItem('f1_archive_experience_mode', 'developer');

    render(
      <ExperienceModeProvider>
        <TestConsumer />
      </ExperienceModeProvider>
    );

    expect(screen.getByTestId('current-mode')).toHaveTextContent('developer');
    expect(screen.getByTestId('is-developer')).toHaveTextContent('true');
    expect(document.documentElement.dataset.experienceMode).toBe('developer');
  });
});
