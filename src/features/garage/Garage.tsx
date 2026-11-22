import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllTeams,
  getAllDrivers,
  getAllCircuits,
  getTeamById,
  getDriverById,
  getCircuitById
} from '../../data/dataService';
import type { CarSetupConfig, SimulatedLapResult } from '../../types/f1';
import { StatCard } from '../../components/StatCard/StatCard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './Garage.css';

const STORAGE_GARAGE_TEAM = 'f1_garage_fav_team';
const STORAGE_GARAGE_DRIVER = 'f1_garage_fav_driver';
const STORAGE_GARAGE_CIRCUIT = 'f1_garage_target_circuit';

export const Garage: React.FC = () => {
  useDocumentTitle('Paddock Telemetry Simulator');
  const teams = getAllTeams();
  const drivers = getAllDrivers();
  const circuits = getAllCircuits();

  // Setup configuration state
  const [setup, setSetup] = useState<CarSetupConfig>(() => {
    try {
      return {
        teamId: localStorage.getItem(STORAGE_GARAGE_TEAM) || 'ferrari',
        driverId: localStorage.getItem(STORAGE_GARAGE_DRIVER) || 'LEC',
        circuitId: localStorage.getItem(STORAGE_GARAGE_CIRCUIT) || 'monza',
        downforce: 'MEDIUM',
        tyreCompound: 'SOFT',
        engineMode: 'QUALIFYING'
      };
    } catch {
      return {
        teamId: 'ferrari',
        driverId: 'LEC',
        circuitId: 'monza',
        downforce: 'MEDIUM',
        tyreCompound: 'SOFT',
        engineMode: 'QUALIFYING'
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GARAGE_TEAM, setup.teamId);
      localStorage.setItem(STORAGE_GARAGE_DRIVER, setup.driverId);
      localStorage.setItem(STORAGE_GARAGE_CIRCUIT, setup.circuitId);
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [setup.teamId, setup.driverId, setup.circuitId]);

  const currentTeam = getTeamById(setup.teamId) || teams[0];
  const currentDriver = getDriverById(setup.driverId) || drivers[0];
  const currentCircuit = getCircuitById(setup.circuitId) || circuits[0];

  // Helper to parse lap record string "1:21.046" into seconds
  const recordSeconds = useMemo(() => {
    const parts = currentCircuit.lapRecord.split(':');
    if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return 80.0;
  }, [currentCircuit]);

  // Dynamic Telemetry & Lap Simulation Formula
  const simulation: SimulatedLapResult = useMemo(() => {
    // Base Top Speed
    const baseTopSpeed = parseInt(currentTeam.specs.topSpeed, 10) || 345;
    let speedDelta = 0;
    if (setup.downforce === 'LOW') speedDelta += 8;
    if (setup.downforce === 'HIGH') speedDelta -= 9;

    if (setup.engineMode === 'OVERTAKE') speedDelta += 6;
    if (setup.engineMode === 'QUALIFYING') speedDelta += 11;

    const topSpeedKmH = baseTopSpeed + speedDelta;

    // Base Lateral G-Force
    let lateralG = 4.4;
    if (setup.downforce === 'HIGH') lateralG += 0.6;
    if (setup.downforce === 'LOW') lateralG -= 0.4;
    if (setup.tyreCompound === 'SOFT') lateralG += 0.3;
    if (setup.tyreCompound === 'HARD') lateralG -= 0.3;
    if (setup.tyreCompound === 'WET') lateralG -= 0.8;

    // Pilot Skill Factor
    const driverBonus = (currentDriver.championships * 0.1) + (currentDriver.wins * 0.005);

    // Lap Delta Calculation vs Circuit Record
    let lapDelta = 0;
    // Downforce matching track type
    const isHighSpeedTrack = ['monza', 'spa', 'silverstone', 'jeddah', 'buddh'].includes(currentCircuit.id);
    const isTwistyTrack = ['monaco', 'hungaroring', 'singapore'].includes(currentCircuit.id);

    if (isHighSpeedTrack) {
      if (setup.downforce === 'LOW') lapDelta -= 0.6;
      if (setup.downforce === 'HIGH') lapDelta += 0.8;
    } else if (isTwistyTrack) {
      if (setup.downforce === 'HIGH') lapDelta -= 0.9;
      if (setup.downforce === 'LOW') lapDelta += 1.2;
    }

    // Tyre compound delta
    if (setup.tyreCompound === 'SOFT') lapDelta -= 0.8;
    if (setup.tyreCompound === 'MEDIUM') lapDelta -= 0.2;
    if (setup.tyreCompound === 'HARD') lapDelta += 0.5;
    if (setup.tyreCompound === 'WET') lapDelta += 4.5;

    // Engine mode delta
    if (setup.engineMode === 'QUALIFYING') lapDelta -= 0.9;
    if (setup.engineMode === 'OVERTAKE') lapDelta -= 0.4;

    lapDelta -= driverBonus;

    const calculatedLapSeconds = Math.max(50, recordSeconds + lapDelta + 0.35);
    const mins = Math.floor(calculatedLapSeconds / 60);
    const secs = (calculatedLapSeconds % 60).toFixed(3);
    const formattedLap = `${mins}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;

    const deltaToRecord = calculatedLapSeconds - recordSeconds;
    const isFaster = deltaToRecord <= 0;
    const formattedDelta = isFaster
      ? `-${Math.abs(deltaToRecord).toFixed(3)}s (PURPLE SECTOR)`
      : `+${deltaToRecord.toFixed(3)}s vs Record`;

    let gripPct = 100;
    if (setup.tyreCompound === 'MEDIUM') gripPct = 95;
    if (setup.tyreCompound === 'HARD') gripPct = 88;
    if (setup.tyreCompound === 'WET') gripPct = 76;

    let dragRating = 'BALANCED';
    if (setup.downforce === 'LOW') dragRating = 'LOW DRAG / SPEED TRAP BIAS';
    if (setup.downforce === 'HIGH') dragRating = 'HIGH CORNERING APEX LOAD';

    return {
      topSpeedKmH,
      lateralGForce: parseFloat(lateralG.toFixed(2)),
      lapTimeSeconds: calculatedLapSeconds,
      lapTimeFormatted: formattedLap,
      deltaToRecordSeconds: deltaToRecord,
      deltaFormatted: formattedDelta,
      isFasterThanRecord: isFaster,
      tyreGripPercent: gripPct,
      aeroDragRating: dragRating
    };
  }, [setup, currentTeam, currentDriver, currentCircuit, recordSeconds]);

  return (
    <div className="garage-page">
      <div className="garage-container">
        {/* Simulator Header */}
        <div className="garage-header-panel telemetry-panel corner-bracket">
          <div className="garage-meta telemetry">
            <span>PADDOCK SIMULATION ENGINE // TELEMETRY TUNING BAY</span>
            <span className="garage-status">STATUS: ONLINE</span>
          </div>

          <h1 className="garage-title headline">
            CAR SETUP & <span className="text-gradient-cyan">TELEMETRY SIMULATOR</span>
          </h1>

          <p className="garage-subtitle">
            Configure your custom aerodynamic package, power unit deployment, and tyre compound.
            Simulate predicted lap times and speed trap velocities across official Grand Prix circuits.
          </p>
        </div>

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
              onChange={(e) => setSetup({ ...setup, teamId: e.target.value })}
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
              onChange={(e) => setSetup({ ...setup, driverId: e.target.value })}
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
              onChange={(e) => setSetup({ ...setup, circuitId: e.target.value })}
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
                  onClick={() => setSetup({ ...setup, downforce: mode })}
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
                  onClick={() => setSetup({ ...setup, tyreCompound: compound })}
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
                  onClick={() => setSetup({ ...setup, engineMode: engine })}
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

        {/* Live Simulation Output Display */}
        <div className="simulation-results-panel telemetry-panel corner-bracket">
          <div className="sim-header">
            <div className="sim-brand telemetry">
              <span className="status-blip"></span>
              <span>LIVE TELEMETRY SIMULATION OUTPUT // {currentCircuit.name.toUpperCase()}</span>
            </div>
            <div className="sim-circuit-record telemetry">
              TRACK LAP RECORD: <strong className="headline">{currentCircuit.lapRecord}</strong> ({currentCircuit.lapRecordHolder})
            </div>
          </div>

          <div className="sim-stats-grid">
            <div className="sim-stat-card primary">
              <span className="telemetry label">SIMULATED LAP TIME</span>
              <div className="headline val-hero" style={{ color: simulation.isFasterThanRecord ? '#00E701' : '#00D2FF' }}>
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
      </div>
    </div>
  );
};
