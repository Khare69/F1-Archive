import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePreferencesContext } from '../../contexts/UserPreferencesContext';
import './Navigation.css';

interface NavigationProps {
  onOpenSearch?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onOpenSearch }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { path: '/', label: 'HOME' },
    { path: '/standings', label: 'STANDINGS' },
    { path: '/seasons', label: 'SEASONS' },
    { path: '/teams', label: 'TEAMS' },
    { path: '/cars', label: 'CARS (3D)' },
    { path: '/circuits', label: 'CIRCUITS' },
    { path: '/drivers', label: 'DRIVERS' },
    { path: '/garage', label: 'GARAGE' }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="f1-navbar">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-logo-box">
            <span className="brand-f1">F1</span>
            <span className="brand-slash">//</span>
          </div>
          <div className="brand-text-box">
            <span className="brand-title headline">ARCHIVE</span>
            <span className="brand-subtitle telemetry">THE EVOLUTION OF SPEED</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className={`navbar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Main Navigation">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link headline ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-dot"></span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Controls & Indicators */}
        <div className="navbar-actions">
          {/* Quick Search Button */}
          {onOpenSearch && (
            <button
              type="button"
              className="search-nav-btn"
              onClick={onOpenSearch}
              aria-label="Search database (Ctrl+K)"
              title="Search Archive (Ctrl+K)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span className="search-nav-label telemetry">SEARCH</span>
              <kbd className="search-shortcut-kbd telemetry">⌘K</kbd>
            </button>
          )}

          {/* System Live Status */}
          <div className="live-status-pill telemetry">
            <span className="status-blip"></span>
            <span>RACE CONTROL // ONLINE</span>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={`bar ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`bar ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>
    </header>
  );
};
