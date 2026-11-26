import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="f1-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="headline">F1 // ARCHIVE</span>
          <span className="telemetry">V1.0 // TELEMETRY ENGINE</span>
        </div>

        <p className="footer-disclaimer telemetry">
          This website is unofficial and is not associated in any way with the Formula 1 companies.
          F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks
          are trade marks of Formula One Licensing B.V. Historical statistics and telemetry are aggregated for
          educational and non-commercial research purposes under F1DB CC-BY-4.0 &amp; bacinger/f1-circuits MIT.
        </p>

        <div className="footer-links telemetry">
          <Link to="/">HOME</Link>
          <span>•</span>
          <Link to="/standings">STANDINGS</Link>
          <span>•</span>
          <Link to="/seasons">SEASONS</Link>
          <span>•</span>
          <Link to="/teams">CONSTRUCTORS</Link>
          <span>•</span>
          <Link to="/drivers">DRIVERS</Link>
          <span>•</span>
          <Link to="/drivers/compare">COMPARE</Link>
          <span>•</span>
          <Link to="/circuits">CIRCUITS</Link>
          <span>•</span>
          <Link to="/telemetry">TELEMETRY</Link>
          <span>•</span>
          <Link to="/pitwall">PIT WALL</Link>
          <span>•</span>
          <Link to="/lab">3D LAB</Link>
          <span>•</span>
          <Link to="/historian">HISTORIAN</Link>
        </div>
      </div>
    </footer>
  );
};
