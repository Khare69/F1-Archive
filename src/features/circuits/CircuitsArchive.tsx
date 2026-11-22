import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllCircuits, getCircuitById } from '../../data/dataService';
import { StatCard } from '../../components/StatCard/StatCard';
import { Track3DViewer } from './Track3DViewer';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './CircuitsArchive.css';

export const CircuitsArchive: React.FC = () => {
  const { circuitId } = useParams<{ circuitId?: string }>();
  const navigate = useNavigate();
  const circuits = getAllCircuits();

  const selectedCircuit = getCircuitById(circuitId) || circuits[0];
  useDocumentTitle(selectedCircuit ? selectedCircuit.name : 'Race Circuits');

  const handleSelectCircuit = (id: string) => {
    navigate(`/circuits/${id}`);
  };

  const getTypeColor = (type: string) => {
    if (type === 'Permanent') return '#00D2FF';
    if (type === 'Street') return '#FF1E1E';
    return '#FFD700';
  };

  const accentColor = getTypeColor(selectedCircuit.type);

  return (
    <div className="archive-layout circuits-archive-page">
      {/* Left Sidebar */}
      <aside className="archive-sidebar" aria-label="Circuits directory">
        <div className="sidebar-header telemetry">
          <span>// RACE CIRCUITS</span>
          <span className="sidebar-count">{circuits.length} VENUES</span>
        </div>
        {circuits.map(circuit => (
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
            <div className="lap-record-time headline">{selectedCircuit.lapRecord}</div>
            <div className="lap-record-holder telemetry">SET BY: <strong>{selectedCircuit.lapRecordHolder}</strong></div>
          </div>
          <div className="lap-record-badge headline">
            <span>⚡ ALL-TIME BENCHMARK</span>
          </div>
        </div>

        {/* 3D Topographic Track Elevation Visualizer */}
        <Track3DViewer circuit={selectedCircuit} accentColor={accentColor} />

        {/* Circuit Stats Grid */}
        <div className="circuit-stats-grid">
          <StatCard
            label="CIRCUIT LENGTH"
            value={selectedCircuit.lengthKm}
            subtext="Single Lap Distance"
            accentColor="#00D2FF"
            isPrimary
          />
          <StatCard
            label="TOTAL CORNERS"
            value={`${selectedCircuit.turns} Turns`}
            subtext="Technical Apex Count"
            accentColor="#FF1E1E"
          />
          <StatCard
            label="DRS OVERTAKE ZONES"
            value={`${selectedCircuit.drsZones} Zones`}
            subtext="Drag Reduction Straights"
            accentColor="#00E701"
          />
          <StatCard
            label="ELEVATION CHANGE"
            value={selectedCircuit.elevation}
            subtext="Topographic Delta"
            accentColor="#FFD700"
          />
        </div>
      </main>
    </div>
  );
};
