import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllCircuits, getCircuitById, getF1DBMetadata } from '../../data/dataService';
import { StatCard } from '../../components/StatCard/StatCard';
import { Track3DViewer } from './Track3DViewer';
import { usePageMeta } from '../../hooks/usePageMeta';
import './CircuitsArchive.css';

export const CircuitsArchive: React.FC = () => {
  const { circuitId } = useParams<{ circuitId?: string }>();
  const navigate = useNavigate();
  const allCircuits = getAllCircuits();
  const meta = getF1DBMetadata();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredCircuits = useMemo(() => {
    if (!searchQuery.trim()) return allCircuits;
    const clean = searchQuery.trim().toLowerCase();
    return allCircuits.filter(c =>
      c.name.toLowerCase().includes(clean) ||
      c.country.toLowerCase().includes(clean) ||
      c.city.toLowerCase().includes(clean) ||
      c.type.toLowerCase().includes(clean)
    );
  }, [allCircuits, searchQuery]);

  const selectedCircuit = getCircuitById(circuitId) || allCircuits[0];

  const getTypeColor = (type: string) => {
    if (type === 'Permanent') return '#00D2FF';
    if (type === 'Street') return '#FF1E1E';
    return '#FFD700';
  };

  const accentColor = getTypeColor(selectedCircuit.type);

  // Dynamic route SEO and structured schema
  usePageMeta({
    title: `${selectedCircuit.name} (${selectedCircuit.country}) — Grand Prix Circuit Archive`,
    description: `Explore ${selectedCircuit.name} circuit map, 3D ribbon geometry, official lap record (${selectedCircuit.lapRecord || 'Benchmark'}), pole-to-win conversion rate, and historical layout configurations.`,
    canonicalPath: `/circuits/${selectedCircuit.id}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: selectedCircuit.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: selectedCircuit.city,
        addressCountry: selectedCircuit.country
      }
    }
  });

  const handleSelectCircuit = (id: string) => {
    navigate(`/circuits/${id}`);
  };

  const poleRateLabel =
    selectedCircuit.poleToWinRate !== null && selectedCircuit.poleToWinRate !== undefined
      ? `${selectedCircuit.poleToWinRate}%`
      : 'N/A';

  const poleRateSubtext =
    selectedCircuit.racesWithRecordedPole && selectedCircuit.racesWithRecordedPole > 0
      ? `${selectedCircuit.poleToWinCount}/${selectedCircuit.racesWithRecordedPole} recorded GPs`
      : 'Sample size pending';

  return (
    <div className="archive-layout circuits-archive-page">
      {/* Left Sidebar */}
      <aside className="archive-sidebar" aria-label="Circuits directory">
        <div className="sidebar-header telemetry">
          <span>// RACE CIRCUITS</span>
          <span className="sidebar-count">{allCircuits.length} VENUES</span>
        </div>

        {/* Quick Search */}
        <div className="driver-search-box" style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border)' }}>
          <input
            type="text"
            className="driver-search-input telemetry"
            placeholder="Search venue or nation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="circuits-scroll-list">
          {filteredCircuits.map(circuit => (
            <button
              key={circuit.id}
              type="button"
              className={`list-button ${selectedCircuit.id === circuit.id ? 'active' : ''}`}
              onClick={() => handleSelectCircuit(circuit.id)}
            >
              <div className="circuit-btn-left">
                <span className="circuit-btn-flag">🏁</span>
                <span className="circuit-btn-name">{circuit.name}</span>
              </div>
              <span className={`circuit-type-pill telemetry type-${circuit.type.toLowerCase()}`}>
                {circuit.type}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="archive-content">
        {/* Circuit Hero Panel */}
        <div
          className="circuit-hero-panel telemetry-panel corner-bracket"
          style={{ '--circuit-brand-color': accentColor } as React.CSSProperties}
        >
          <div className="circuit-hero-bg-glow"></div>

          <div className="circuit-meta-bar telemetry">
            <span>CIRCUIT ID: #{selectedCircuit.id.toUpperCase()}</span>
            <span>FIRST GRAND PRIX: {selectedCircuit.firstGP}</span>
            <span
              className={`circuit-type-badge-large type-${selectedCircuit.type.toLowerCase()}`}
              style={{
                color: accentColor,
                backgroundColor: `${accentColor}22`,
                border: `1px solid ${accentColor}55`
              }}
            >
              {selectedCircuit.type.toUpperCase()} TRACK
            </span>
            <span className="f1db-sync-pill">
              <span>●</span> F1DB SYNCED (v{meta.f1dbVersion})
            </span>
          </div>

          <div className="circuit-title-row">
            <h1 className="circuit-full-name headline">{selectedCircuit.name}</h1>
            <div className="circuit-location-tag telemetry">
              <span>📍 {selectedCircuit.city}, {selectedCircuit.country}</span>
            </div>
          </div>

          <p className="circuit-description">{selectedCircuit.description}</p>
        </div>

        {/* Lap Record Featured Panel */}
        <div className="lap-record-panel telemetry-panel">
          <div className="lap-record-left">
            <span className="telemetry" style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', letterSpacing: '0.12em' }}>
              OFFICIAL GRAND PRIX LAP RECORD
            </span>
            <div className="lap-record-time headline">{selectedCircuit.lapRecord || 'Benchmark Record'}</div>
            <div className="lap-record-holder telemetry">SET BY: <strong>{selectedCircuit.lapRecordHolder || 'FIA Homologation Standard'}</strong></div>
          </div>
          <div className="lap-record-badge headline">
            <span>⚡ ALL-TIME BENCHMARK</span>
          </div>
        </div>

        {/* Circuit Telemetry Metric Cards */}
        <div className="circuit-stats-grid">
          <StatCard
            label="CIRCUIT LENGTH"
            value={selectedCircuit.lengthKm}
            subtext="Lap Distance"
            accentColor={accentColor}
            isPrimary
          />
          <StatCard
            label="TOTAL CORNERS"
            value={selectedCircuit.turns}
            subtext="Numbered Turns"
            accentColor="#00D2FF"
          />
          <StatCard
            label="POLE-TO-WIN RATE"
            value={poleRateLabel}
            subtext={poleRateSubtext}
            accentColor="#FFD700"
          />
          <StatCard
            label="ELEVATION CHANGE"
            value={selectedCircuit.elevation ?? 'N/A'}
            subtext="Altitude Delta"
            accentColor="#C0C0C0"
          />
        </div>

        {/* 3D Topographic Track Ribbon Viewer */}
        <Track3DViewer
          circuit={selectedCircuit}
          accentColor={accentColor}
        />

        {/* Historical Layout Configurations & Eras */}
        {selectedCircuit.layoutEras && selectedCircuit.layoutEras.length > 0 && (
          <section className="circuit-history-panel telemetry-panel corner-bracket">
            <div className="section-title-bar">
              <span className="section-dot" style={{ background: '#00D2FF' }}></span>
              <h2 className="headline">HISTORICAL LAYOUT CONFIGURATIONS & ERAS</h2>
            </div>
            <div className="layouts-grid">
              {selectedCircuit.layoutEras.map(layout => (
                <div
                  key={layout.layoutId}
                  className={`layout-card ${layout.effective ? 'layout-effective' : ''}`}
                >
                  <div className="layout-header">
                    <strong className="headline layout-id-tag">{layout.layoutId}</strong>
                    {layout.effective && (
                      <span className="telemetry layout-active-badge">CURRENT SPEC</span>
                    )}
                  </div>
                  <div className="layout-specs telemetry">
                    <span>LENGTH: <strong>{layout.lengthKm} km</strong></span>
                    <span>TURNS: <strong>{layout.turns}</strong></span>
                    <span>ERAS: <strong>{layout.years}</strong></span>
                    <span>GRANDS PRIX: <strong>{layout.racesCount} GPs</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Grand Prix Winners Table */}
        {selectedCircuit.pastWinners && selectedCircuit.pastWinners.length > 0 && (
          <section className="circuit-history-panel telemetry-panel corner-bracket">
            <div className="section-title-bar">
              <span className="section-dot" style={{ background: '#00E701' }}></span>
              <h2 className="headline">RECENT GRAND PRIX WINNERS AT THIS VENUE</h2>
            </div>
            <div className="table-responsive-wrapper">
              <table className="f1-table" aria-label={`Recent winners at ${selectedCircuit.name}`}>
                <thead>
                  <tr>
                    <th className="telemetry">YEAR</th>
                    <th className="telemetry">RACE WINNER</th>
                    <th className="telemetry">CONSTRUCTOR</th>
                    <th className="telemetry text-center">STARTING GRID</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCircuit.pastWinners.slice(0, 8).map(w => (
                    <tr key={w.year}>
                      <td className="headline" style={{ color: 'var(--color-accent-primary)' }}>
                        {w.year}
                      </td>
                      <td className="headline">{w.driverName}</td>
                      <td className="telemetry text-muted">{w.constructorName}</td>
                      <td className="telemetry text-center">
                        {w.gridPosition === 1 ? (
                          <span style={{ color: '#FFD700', fontWeight: 'bold' }}>POLE (P1)</span>
                        ) : w.gridPosition !== null ? (
                          `P${w.gridPosition}`
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
