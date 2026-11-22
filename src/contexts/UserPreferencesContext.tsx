import React, { createContext, useContext, type ReactNode } from 'react';
import { useUserPreferences } from '../hooks/useUserPreferences';

interface PreferencesContextValue {
  isFirstVisit: boolean;
  setFirstVisit: (value: boolean) => void;
  hasReducedMotion: boolean;
  isSlowConnection: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const prefs = useUserPreferences();
  return (
    <PreferencesContext.Provider value={prefs}>
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferencesContext(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferencesContext must be used within UserPreferencesProvider');
  }
  return ctx;
}
