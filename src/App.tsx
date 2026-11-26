import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { defaultShouldDehydrateQuery } from '@tanstack/react-query';
import { queryClient, queryPersister, QUERY_PERSIST_BUSTER } from './lib/queryClient';
import { shouldPersistQueryKey } from './lib/idbPersister';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { Navigation } from './components/Navigation/Navigation';
import { Footer } from './components/Layout/Footer';
import { AppRoutes } from './routes/AppRoutes';
import { SearchPalette } from './features/search/SearchPalette';
import { KeyboardShortcutsModal } from './components/Layout/KeyboardShortcutsModal';
import { LazyPerfDebugOverlay } from './components/DevTools/LazyPerfDebugOverlay';
import { TooltipProvider } from './components/ui/tooltip';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import './App.css';

const AppContent: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useGlobalShortcuts({
    onToggleSearch: () => setIsSearchOpen((prev) => !prev),
    onOpenShortcuts: () => setIsShortcutsOpen(true),
    isModalOpen: isSearchOpen || isShortcutsOpen,
  });

  return (
    <div className="f1-app-root">
      <Navigation onOpenSearch={() => setIsSearchOpen(true)} onOpenShortcuts={() => setIsShortcutsOpen(true)} />
      <LazyPerfDebugOverlay />
      <SearchPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenShortcuts={() => { setIsSearchOpen(false); setIsShortcutsOpen(true); }}
      />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <main id="main-content" className="main-viewport">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister: queryPersister,
      buster: QUERY_PERSIST_BUSTER,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) =>
          shouldPersistQueryKey(query.queryKey) && defaultShouldDehydrateQuery(query),
      },
    }}
  >
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <UserPreferencesProvider>
        <TooltipProvider delayDuration={200}>
          <AppContent />
        </TooltipProvider>
      </UserPreferencesProvider>
    </BrowserRouter>
  </PersistQueryClientProvider>
);

export default App;
