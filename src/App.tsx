import React, { useState, useEffect } from 'react';
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
import { LazyPerfDebugOverlay } from './components/DevTools/LazyPerfDebugOverlay';
import './App.css';

const AppContent: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="f1-app-root">
      <Navigation onOpenSearch={() => setIsSearchOpen(true)} />
      <LazyPerfDebugOverlay />
      <SearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <main id="main-content" className="main-viewport">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
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
          <AppContent />
        </UserPreferencesProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  );
};

export default App;
