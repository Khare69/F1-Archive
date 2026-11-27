import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { safeStorage } from '../utils/safeStorage';

export type ExperienceMode = 'beginner' | 'enthusiast' | 'developer';

export interface ExperienceModeContextValue {
  mode: ExperienceMode;
  setMode: (mode: ExperienceMode) => void;
  cycleMode: () => void;
  isBeginner: boolean;
  isEnthusiast: boolean;
  isDeveloper: boolean;
}

const STORAGE_KEY = 'f1_archive_experience_mode';
const DEFAULT_MODE: ExperienceMode = 'enthusiast';

const ExperienceModeContext = createContext<ExperienceModeContextValue | undefined>(undefined);

function isValidMode(val: string | null): val is ExperienceMode {
  return val === 'beginner' || val === 'enthusiast' || val === 'developer';
}

export const ExperienceModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ExperienceMode>(() => {
    const saved = safeStorage.getItem(STORAGE_KEY);
    return isValidMode(saved) ? saved : DEFAULT_MODE;
  });

  const setMode = useCallback((newMode: ExperienceMode) => {
    setModeState(newMode);
    safeStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const cycleMode = useCallback(() => {
    setModeState((current) => {
      const next: ExperienceMode =
        current === 'beginner' ? 'enthusiast' : current === 'enthusiast' ? 'developer' : 'beginner';
      safeStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.experienceMode = mode;
    }
  }, [mode]);

  const value = useMemo<ExperienceModeContextValue>(
    () => ({
      mode,
      setMode,
      cycleMode,
      isBeginner: mode === 'beginner',
      isEnthusiast: mode === 'enthusiast',
      isDeveloper: mode === 'developer',
    }),
    [mode, setMode, cycleMode]
  );

  return <ExperienceModeContext.Provider value={value}>{children}</ExperienceModeContext.Provider>;
};

export function useExperienceMode(): ExperienceModeContextValue {
  const context = useContext(ExperienceModeContext);
  if (!context) {
    throw new Error('useExperienceMode must be used within an ExperienceModeProvider');
  }
  return context;
}
