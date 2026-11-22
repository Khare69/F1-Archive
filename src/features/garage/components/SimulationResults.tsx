import React from 'react';
import { Link } from 'react-router-dom';
import type { SimulatedLapResult, Circuit, Team, CarSetupConfig } from '../../../types/f1';
import { StatCard } from '../../../components/StatCard/StatCard';

interface SimulationResultsProps {
  simulation: SimulatedLapResult;
  currentCircuit: Circuit;
  currentTeam: Team;
  setup: CarSetupConfig;
  onOpenFormulaModal: () => void;
}

export const SimulationResults: React.FC<SimulationResultsProps> = ({
  simulation,
  currentCircuit,
  currentTeam,
  setup,
  onOpenFormulaModal
}) => {
  return (
    <div className="simulation-results-panel telemetry-panel corner-bracket">
      <div className="sim-header">
        <div className="sim-brand telemetry">
          <span className="status-blip"></span>
          <span>LIVE TELEMETRY SIMULATION OUTPUT // {currentCircuit.name.toUpperCase()}</span>
          <span className="illustrative-model-tag telemetry">ILLUSTRATIVE MODEL</span>
        </div>
        <div className="sim-header-right">
          <div className="sim-circuit-record telemetry">
            TRACK LAP RECORD: <strong className="headline">{currentCircuit.lapRecord}</strong> ({currentCircuit.lapRecordHolder})
          </div>
          <button
            type="button"
            className="sim-formula-btn telemetry"
            onClick={onOpenFormulaModal}
            title="Inspect Aerodynamic & Physics Formulas"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>EXPLAIN FORMULA</span>
          </button>
        </div>
      </div>

      <div className="sim-stats-grid">
        <div className="sim-stat-card primary">
          <span className="telemetry label">SIMULATED LAP TIME</span>
          <div
            className="headline val-hero"
            style={{ color: simulation.isFasterThanRecord ? '#00E701' : '#00D2FF' }}
          >
            {simulation.lapTimeFormatted}
          </div>
          <span className={`telemetry delta-badge ${simulation.isFasterThanRecord ? 'faster' : 'slower'}`}>
            {simulation.deltaFormatted}
          </span>
        </div>

        <StatCard
          label="CALCULATED TOP SPEED"
          value={`${simulation.topSpeedKmH} km/h`}
          subtext="Main Straight Radar Velocity"
          accentColor="#FF1E1E"
        />

        <StatCard
          label="APEX LATERAL G-FORCE"
          value={`${simulation.lateralGForce} G`}
          subtext="High-Speed Corner Load"
          accentColor="#FFD700"
        />

        <StatCard
          label="INITIAL TYRE MECHANICAL GRIP"
          value={`${simulation.tyreGripPercent}%`}
          subtext={`Compound: ${setup.tyreCompound}`}
          accentColor="#00E701"
        />
      </div>

      <div className="sim-footer-actions">
        <Link to={`/cars/${currentTeam.id}`} className="f1-btn">
          <span>INSPECT {currentTeam.carName} IN 3D LAB</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>

        <Link to={`/circuits/${currentCircuit.id}`} className="f1-btn f1-btn-secondary">
          <span>VIEW 3D TOPOGRAPHIC TRACK MODEL</span>
        </Link>
      </div>
    </div>
  );
};
