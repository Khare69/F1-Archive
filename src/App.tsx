import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { UserPreferencesProvider, usePreferencesContext } from './contexts/UserPreferencesContext';
import { Navigation } from './components/Navigation/Navigation';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { PageTransition } from './components/PageTransition/PageTransition';
import { WelcomeExperience } from './features/welcome/WelcomeExperience';
import { SearchPalette } from './features/search/SearchPalette';
import { Home } from './features/home/Home';
import { SeasonsArchive } from './features/seasons/SeasonsArchive';
import { TeamsArchive } from './features/teams/TeamsArchive';
import { DriversArchive } from './features/drivers/DriversArchive';
import { DriverComparison } from './features/drivers/DriverComparison';
import { CircuitsArchive } from './features/circuits/CircuitsArchive';
import { Garage } from './features/garage/Garage';
import { LiveStandings } from './features/standings/LiveStandings';
import { NotFound } from './features/notfound/NotFound';
import './App.css';

// Code-split / lazy-load the heavy 3D Cars module for optimal initial performance
const CarsArchive = lazy(() => import('./features/cars/CarsArchive'));

const AppContent: React.FC = () => {
  const {
    isFirstVisit,
    setFirstVisit,
    hasReducedMotion,
    isSlowConnection
  } = usePreferencesContext();

  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isWelcomeComplete, setIsWelcomeComplete] = useState<boolean>(() => {
    // If returning visitor, reduced motion, or slow network detected, skip intro automatically
    return !isFirstVisit || hasReducedMotion || isSlowConnection;
  });

  const handleWelcomeComplete = () => {
    setIsWelcomeComplete(true);
    setFirstVisit(false);
  };

  // Keyboard shortcut for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="f1-app-root">
      {/* Background Visual Layers */}
      <div className="bg-grid-overlay"></div>
      <div className="carbon-texture"></div>

      {/* Cinematic Welcome Intro Overlay */}
      {!isWelcomeComplete && (
        <WelcomeExperience onComplete={handleWelcomeComplete} />
      )}

      {/* Global Navigation Header with Command Palette Trigger */}
      <Navigation onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Global Command Palette / Search Modal */}
      <SearchPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Main Application Routes with Animated Page Transitions */}
      <div className={`main-viewport ${isWelcomeComplete ? 'viewport-visible' : 'viewport-hidden'}`}>
        <ErrorBoundary fallbackTitle="Archive Module Render Fault">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <PageTransition>
                    <Home isVisible={isWelcomeComplete} />
                  </PageTransition>
                }
              />
              <Route
                path="/seasons/:year?"
                element={
                  <PageTransition>
                    <SeasonsArchive />
                  </PageTransition>
                }
              />
              <Route
                path="/teams/:teamId?"
                element={
                  <PageTransition>
                    <TeamsArchive />
                  </PageTransition>
                }
              />
              <Route
                path="/circuits/:circuitId?"
                element={
                  <PageTransition>
                    <CircuitsArchive />
                  </PageTransition>
                }
              />
              <Route
                path="/drivers/compare"
                element={
                  <PageTransition>
                    <DriverComparison />
                  </PageTransition>
                }
              />
              <Route
                path="/drivers/:driverId?"
                element={
                  <PageTransition>
                    <DriversArchive />
                  </PageTransition>
                }
              />

              {/* Lazy-loaded 3D Cars Archive */}
              <Route
                path="/cars/:teamId?"
                element={
                  <ErrorBoundary fallbackTitle="3D Vehicle Lab Render Fault">
                    <Suspense
                      fallback={
                        <div className="lazy-3d-loading telemetry-panel">
                          <div className="loading-spinner"></div>
                          <div className="headline">INITIALIZING 3D VEHICLE LAB...</div>
                          <div className="telemetry">[ LOADING CAD SHADERS & MODELS ]</div>
                        </div>
                      }
                    >
                      <PageTransition>
                        <CarsArchive />
                      </PageTransition>
                    </Suspense>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/garage"
                element={
                  <PageTransition>
                    <Garage />
                  </PageTransition>
                }
              />
              <Route
                path="/standings"
                element={
                  <PageTransition>
                    <LiveStandings />
                  </PageTransition>
                }
              />
              <Route
                path="*"
                element={
                  <PageTransition>
                    <NotFound />
                  </PageTransition>
                }
              />
            </Routes>
          </AnimatePresence>
        </ErrorBoundary>
      </div>

      {/* Footer with Legal & Full Navigation Links */}
      <footer className="f1-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="headline">F1 // ARCHIVE</span>
            <span className="telemetry">V1.0 // TELEMETRY ENGINE</span>
          </div>

          <p className="footer-disclaimer telemetry">
            F1 // ARCHIVE is an independent historical tribute and portfolio project. Formula 1, F1,
            constructors, and driver marks are registered trademarks of their respective owners.
            No official association or endorsement is implied.
          </p>

          <div className="footer-links telemetry">
            <Link to="/standings">STANDINGS</Link>
            <span>•</span>
            <Link to="/seasons">SEASONS</Link>
            <span>•</span>
            <Link to="/teams">CONSTRUCTORS</Link>
            <span>•</span>
            <Link to="/cars">3D CAD LAB</Link>
            <span>•</span>
            <Link to="/circuits">CIRCUITS</Link>
            <span>•</span>
            <Link to="/drivers">DRIVERS</Link>
            <span>•</span>
            <Link to="/drivers/compare">COMPARE</Link>
            <span>•</span>
            <Link to="/garage">PADDOCK GARAGE</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <UserPreferencesProvider>
        <AppContent />
      </UserPreferencesProvider>
    </BrowserRouter>
  );
};

export default App;
