import React from 'react';
import { Link } from 'react-router-dom';
import { getArchiveStats } from '../../data/dataService';
import { StatCard } from '../../components/StatCard/StatCard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './Home.css';

interface HomeProps {
  isVisible?: boolean;
}

export const Home: React.FC<HomeProps> = ({ isVisible = true }) => {
  useDocumentTitle('The Evolution of Speed');
  const stats = getArchiveStats();

  return (
    <div className={`f1-home-page ${isVisible ? 'fade-in' : ''}`}>
      {/* Background Gradients */}
      <div className="home-hero-glow"></div>

      <div className="home-container">
        {/* Top Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge telemetry">
              <span className="badge-pulse"></span>
              HISTORICAL TELEMETRY VAULT // 1950 - 2026
            </div>
            
            <h1 className="hero-title headline">
              THE EVOLUTION <br />
              <span className="text-gradient-cyan">OF SPEED.</span>
            </h1>
            
            <p className="hero-description">
              Step into the pinnacle of motorsport heritage. 75 years of aerodynamic evolution,
              legendary championship rivalries, technical regulations, and telemetry-grade archives.
            </p>

            <div className="hero-actions">
              <Link to="/seasons" className="f1-btn">
                <span>ENTER ARCHIVE</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              
              <Link to="/cars" className="f1-btn f1-btn-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                <span>3D VEHICLE LAB</span>
              </Link>

              <Link to="/drivers/compare" className="f1-btn f1-btn-secondary" style={{ borderColor: 'rgba(0, 210, 255, 0.4)' }}>
                <span>VS DRIVER COMPARATOR</span>
              </Link>
            </div>
          </div>

          {/* Hero Car Silhouette Artwork */}
          <div className="hero-visual">
            <div className="car-visual-container">
              <svg 
                className="hero-car-svg" 
                viewBox="0 0 600 200" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="heroCarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.2"/>
                    <stop offset="50%" stopColor="#00D2FF" stopOpacity="0.9"/>
                    <stop offset="100%" stopColor="#FF1E1E" stopOpacity="0.8"/>
                  </linearGradient>
                  <filter id="heroCarGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                  </filter>
                </defs>

                {/* Car Silhouette Body */}
                <path 
                  d="M 60 130 L 110 110 L 220 100 L 320 85 L 440 95 L 530 130 L 510 140 L 460 145 L 340 145 L 200 145 L 90 140 Z" 
                  fill="#0D1322" 
                  stroke="url(#heroCarGrad)" 
                  strokeWidth="3"
                  filter="url(#heroCarGlow)"
                />
                {/* Front Wing */}
                <path d="M 510 130 L 570 135 L 570 150 L 500 148 Z" fill="#00D2FF" opacity="0.8"/>
                {/* Rear Wing */}
                <path d="M 50 130 L 30 80 L 80 80 L 70 130 Z" fill="#FF1E1E" opacity="0.8"/>
                {/* Halo Cockpit */}
                <path d="M 280 90 L 320 70 L 360 85 Z" stroke="#FFFFFF" strokeWidth="2.5" fill="none"/>
                {/* Wheels */}
                <circle cx="120" cy="145" r="28" fill="#05070C" stroke="#00D2FF" strokeWidth="3"/>
                <circle cx="120" cy="145" r="12" fill="#FF1E1E"/>
                <circle cx="450" cy="145" r="28" fill="#05070C" stroke="#00D2FF" strokeWidth="3"/>
                <circle cx="450" cy="145" r="12" fill="#FF1E1E"/>
                {/* Speed Aero Lines */}
                <line x1="20" y1="110" x2="580" y2="110" stroke="#00D2FF" strokeWidth="1" strokeDasharray="8 8" opacity="0.3"/>
                <line x1="80" y1="60" x2="520" y2="60" stroke="#00D2FF" strokeWidth="1" strokeDasharray="4 6" opacity="0.2"/>
              </svg>
              <div className="hero-floor-reflection"></div>
            </div>
          </div>
        </section>

        {/* Telemetry Stats Bar */}
        <section className="stats-bar-section">
          <div className="stats-grid">
            <StatCard 
              label="CHAMPIONSHIP SEASONS" 
              value={stats.seasonsCount} 
              subtext={stats.yearSpan}
              isPrimary
            />
            <StatCard 
              label="CONSTRUCTORS ARCHIVED" 
              value={stats.teamsCount} 
              subtext="Current & Legendary"
              accentColor="#FF1E1E"
            />
            <StatCard 
              label="WORLD DRIVERS" 
              value={stats.driversCount} 
              subtext="Champions & Contenders"
              accentColor="#00E701"
            />
            <StatCard 
              label="GRAND PRIX CIRCUITS" 
              value={stats.circuitsCount} 
              subtext="Historic Venues"
              accentColor="#FF8000"
            />
            <StatCard 
              label="GRAND PRIX WINS" 
              value={stats.totalWins} 
              subtext="Indexed in Database"
              accentColor="#FFD700"
            />
          </div>
        </section>

        {/* Feature Navigation Modules */}
        <section className="modules-section">
          <div className="section-header">
            <h2 className="section-title headline">ARCHIVE DIRECTORY</h2>
            <span className="telemetry">[ SELECT SYSTEM MODULE ]</span>
          </div>

          <div className="modules-grid">
            <Link to="/seasons" className="module-card corner-bracket">
              <div className="module-icon">🏁</div>
              <h3 className="module-title headline">SEASONS VAULT</h3>
              <p className="module-desc">
                From the 1972 Lotus ground-effect revolution to modern 24-race championship records.
              </p>
              <span className="module-link-label telemetry">EXPLORE SEASONS →</span>
            </Link>

            <Link to="/teams" className="module-card corner-bracket">
              <div className="module-icon">🏎️</div>
              <h3 className="module-title headline">CONSTRUCTORS</h3>
              <p className="module-desc">
                Technical headquarters, engineering specs, power unit partnerships, and legacy titles.
              </p>
              <span className="module-link-label telemetry">VIEW CONSTRUCTORS →</span>
            </Link>

            <Link to="/cars" className="module-card corner-bracket">
              <div className="module-icon">📐</div>
              <h3 className="module-title headline">3D VEHICLE LAB</h3>
              <p className="module-desc">
                Interactive real-time 3D chassis inspection, aerodynamic airflow simulation, and livery mapping.
              </p>
              <span className="module-link-label telemetry">LAUNCH 3D VIEWER →</span>
            </Link>

            <Link to="/circuits" className="module-card corner-bracket">
              <div className="module-icon">🗺️</div>
              <h3 className="module-title headline">RACE CIRCUITS</h3>
              <p className="module-desc">
                Track profiles, technical turn data, elevation metrics, and all-time Grand Prix lap records.
              </p>
              <span className="module-link-label telemetry">EXPLORE CIRCUITS →</span>
            </Link>

            <Link to="/drivers" className="module-card corner-bracket">
              <div className="module-icon">🏆</div>
              <h3 className="module-title headline">DRIVERS ROSTER</h3>
              <p className="module-desc">
                Career statistics, podium tallies, race-by-race finishes, and Hall of Fame profiles.
              </p>
              <span className="module-link-label telemetry">INSPECT DRIVERS →</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
