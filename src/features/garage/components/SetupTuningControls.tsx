import React from 'react';
import type { CarSetupConfig, Team, Driver, Circuit } from '../../../types/f1';

interface SetupTuningControlsProps {
  setup: CarSetupConfig;
  onChangeSetup: (newSetup: CarSetupConfig) => void;
  teams: Team[];
  drivers: Driver[];
  circuits: Circuit[];
  currentTeam: Team;
}

export const SetupTuningControls: React.FC<SetupTuningControlsProps> = ({
  setup,
  onChangeSetup,
  teams,
  drivers,
  circuits,
  currentTeam
}) => {
  return (
    <>
      {/* Primary Configuration Controls */}
      <div className="garage-selector-row">
        {/* Constructor Selector */}
        <div className="selector-card telemetry-panel">
          <label className="selector-label telemetry" htmlFor="team-select">
            1. CONSTRUCTOR CHASSIS:
          </label>
          <select
            id="team-select"
            value={setup.teamId}
            onChange={(e) => onChangeSetup({ ...setup, teamId: e.target.value })}
            className="f1-select headline"
            style={{ color: currentTeam.color }}
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id} style={{ color: '#F5F7FA', background: '#0D1322' }}>
                {t.name} ({t.carName})
              </option>
            ))}
          </select>
        </div>

        {/* Pilot Selector */}
        <div className="selector-card telemetry-panel">
          <label className="selector-label telemetry" htmlFor="driver-select">
            2. LEAD PILOT:
          </label>
          <select
            id="driver-select"
            value={setup.driverId}
            onChange={(e) => onChangeSetup({ ...setup, driverId: e.target.value })}
            className="f1-select headline"
            style={{ color: '#00D2FF' }}
          >
            {drivers.map((d) => (
              <option key={d.id} value={d.id} style={{ color: '#F5F7FA', background: '#0D1322' }}>
                #{d.number} {d.name} ({d.country})
              </option>
            ))}
          </select>
        </div>

        {/* Circuit Selector */}
        <div className="selector-card telemetry-panel">
          <label className="selector-label telemetry" htmlFor="circuit-select">
            3. TARGET GRAND PRIX CIRCUIT:
          </label>
          <select
            id="circuit-select"
            value={setup.circuitId}
            onChange={(e) => onChangeSetup({ ...setup, circuitId: e.target.value })}
            className="f1-select headline"
            style={{ color: '#FFD700' }}
          >
            {circuits.map((c) => (
              <option key={c.id} value={c.id} style={{ color: '#F5F7FA', background: '#0D1322' }}>
                {c.name} ({c.country})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Setup Tuning Controls (Wings, Tyres, Power Unit) */}
      <div className="tuning-controls-grid">
        {/* Aerodynamic Downforce */}
        <div className="tuning-panel telemetry-panel">
          <div className="tuning-panel-header telemetry">
            <span>// AERODYNAMIC DOWNFORCE</span>
            <span className="tuning-badge">{setup.downforce} WING</span>
          </div>
          <div className="tuning-buttons-row">
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`tuning-btn ${setup.downforce === mode ? 'active' : ''}`}
                onClick={() => onChangeSetup({ ...setup, downforce: mode })}
              >
                <span className="headline">{mode}</span>
                <span className="btn-subtext telemetry">
                  {mode === 'LOW' ? 'Speed Trap Bias' : mode === 'HIGH' ? 'Maximum Apex Grip' : 'Balanced Aero'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tyre Compound Selection */}
        <div className="tuning-panel telemetry-panel">
          <div className="tuning-panel-header telemetry">
            <span>// PIRELLI TYRE COMPOUND</span>
            <span className="tuning-badge">{setup.tyreCompound}</span>
          </div>
          <div className="tuning-buttons-row tyre-row">
            {(['SOFT', 'MEDIUM', 'HARD', 'WET'] as const).map((compound) => (
              <button
                key={compound}
                type="button"
                className={`tuning-btn tyre-btn tyre-${compound.toLowerCase()} ${
                  setup.tyreCompound === compound ? 'active' : ''
                }`}
                onClick={() => onChangeSetup({ ...setup, tyreCompound: compound })}
              >
                <span className="headline">{compound}</span>
                <span className="btn-subtext telemetry">
                  {compound === 'SOFT'
                    ? '100% Grip (Red)'
                    : compound === 'MEDIUM'
                    ? '95% Grip (Yellow)'
                    : compound === 'HARD'
                    ? '88% Grip (White)'
                    : 'Rain Tread (Blue)'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Power Unit Engine Mode */}
        <div className="tuning-panel telemetry-panel">
          <div className="tuning-panel-header telemetry">
            <span>// POWER UNIT ENERGY DEPLOYMENT</span>
            <span className="tuning-badge">{setup.engineMode}</span>
          </div>
          <div className="tuning-buttons-row">
            {(['BALANCED', 'OVERTAKE', 'QUALIFYING'] as const).map((engine) => (
              <button
                key={engine}
                type="button"
                className={`tuning-btn ${setup.engineMode === engine ? 'active' : ''}`}
                onClick={() => onChangeSetup({ ...setup, engineMode: engine })}
              >
                <span className="headline">{engine}</span>
                <span className="btn-subtext telemetry">
                  {engine === 'QUALIFYING'
                    ? 'Max Battery Dump'
                    : engine === 'OVERTAKE'
                    ? 'Electric Boost (+12 km/h)'
                    : 'GP Race Pace Mode'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
