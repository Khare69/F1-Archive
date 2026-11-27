import React, { useState } from 'react';
import { AppProviders } from './components/Layout/AppProviders';
import { Navigation } from './components/Navigation/Navigation';
import { Footer } from './components/Layout/Footer';
import { AppRoutes } from './routes/AppRoutes';
import { SearchPalette } from './features/search/SearchPalette';
import { KeyboardShortcutsModal } from './components/Layout/KeyboardShortcutsModal';
import { LazyPerfDebugOverlay } from './components/DevTools/LazyPerfDebugOverlay';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useInspectQuery } from './contexts/InspectQueryContext';
import './App.css';

const LazyInspectQueryDrawer = React.lazy(() =>
  import('./components/DevTools/InspectQueryDrawer').then((m) => ({ default: m.InspectQueryDrawer }))
);

const InspectQueryDrawerMount: React.FC = () => {
  const { isOpen } = useInspectQuery();
  if (!isOpen) return null;
  return (
    <React.Suspense fallback={null}>
      <LazyInspectQueryDrawer />
    </React.Suspense>
  );
};

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
      <InspectQueryDrawerMount />
      <SearchPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenShortcuts={() => {
          setIsSearchOpen(false);
          setIsShortcutsOpen(true);
        }}
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
  <AppProviders>
    <AppContent />
  </AppProviders>
);

export default App;
