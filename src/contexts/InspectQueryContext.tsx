import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface InspectQueryPayload {
  title: string;
  description?: string;
  sql: string;
  presetId?: string;
}

export interface InspectQueryContextValue {
  isOpen: boolean;
  activeQuery: InspectQueryPayload | null;
  openQuery: (payload: InspectQueryPayload) => void;
  closeQuery: () => void;
}

const InspectQueryContext = createContext<InspectQueryContextValue | undefined>(undefined);

export const InspectQueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState<InspectQueryPayload | null>(null);

  const openQuery = useCallback((payload: InspectQueryPayload) => {
    setActiveQuery(payload);
    setIsOpen(true);
  }, []);

  const closeQuery = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      activeQuery,
      openQuery,
      closeQuery,
    }),
    [isOpen, activeQuery, openQuery, closeQuery]
  );

  return <InspectQueryContext.Provider value={value}>{children}</InspectQueryContext.Provider>;
};

export function useInspectQuery(): InspectQueryContextValue {
  const context = useContext(InspectQueryContext);
  if (!context) {
    throw new Error('useInspectQuery must be used within an InspectQueryProvider');
  }
  return context;
}
