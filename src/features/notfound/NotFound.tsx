import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/usePageMeta';
import './NotFound.css';

export const NotFound: React.FC = () => {
  useDocumentTitle('404 // Sector Fault');

  return (
    <div className="notfound-page">
      <div className="notfound-card telemetry-panel corner-bracket">
        <div className="notfound-meta telemetry">
          <span className="fault-dot"></span>
          <span>FIA RACE CONTROL // TELEMETRY LINK SEVERED</span>
        </div>

        <div className="notfound-code-row">
          <span className="notfound-code headline text-gradient-cyan">404</span>
          <span className="notfound-tag telemetry">SIGNAL_NOT_FOUND</span>
        </div>

        <h1 className="notfound-title headline">
          SECTOR OUT OF BOUNDS // <span style={{ color: '#FF1E1E' }}>OFF-TRACK EXCURSION</span>
        </h1>

        <p className="notfound-description">
          The requested aerodynamic telemetry coordinate does not exist in the official F1 archive database.
          Please re-engage race navigation or return to Race Control.
        </p>

        <div className="notfound-quick-links">
          <Link to="/" className="f1-btn">
            <span>RETURN TO RACE CONTROL</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <Link to="/standings" className="f1-btn f1-btn-secondary">
            <span>LIVE STANDINGS</span>
          </Link>

          <Link to="/circuits" className="f1-btn f1-btn-secondary">
            <span>3D CIRCUITS</span>
          </Link>

          <Link to="/cars" className="f1-btn f1-btn-secondary">
            <span>3D CAR LAB</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
