import React, { useState, useEffect } from 'react';
import {
  getAllTeams,
  getAllDrivers,
  getAllCircuits,
  getTeamById,
  getDriverById,
  getCircuitById
} from '../../data/dataService';
import type { CarSetupConfig } from '../../types/f1';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { safeStorage } from '../../utils/safeStorage';
import { useLapSimulation } from './hooks/useLapSimulation';
import { SetupTuningControls } from './components/SetupTuningControls';
import { SimulationResults } from './components/SimulationResults';
import { FormulaExplanationModal } from './components/FormulaExplanationModal';
import './Garage.css';

const STORAGE_GARAGE_TEAM = 'f1_garage_fav_team';
const STORAGE_GARAGE_DRIVER = 'f1_garage_fav_driver';
const STORAGE_GARAGE_CIRCUIT = 'f1_garage_target_circuit';

export const Garage: React.FC = () => {
  useDocumentTitle('Paddock Telemetry Simulator');
  const teams = getAllTeams();
  const drivers = getAllDrivers();
  const circuits = getAllCircuits();

  // Setup configuration state guarded by safeStorage
  const [setup, setSetup] = useState<CarSetupConfig>(() => ({
    teamId: safeStorage.getItem(STORAGE_GARAGE_TEAM) || 'ferrari',
    driverId: safeStorage.getItem(STORAGE_GARAGE_DRIVER) || 'LEC',
    circuitId: safeStorage.getItem(STORAGE_GARAGE_CIRCUIT) || 'monza',
    downforce: 'MEDIUM',
    tyreCompound: 'SOFT',
    engineMode: 'QUALIFYING'
  }));

  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);

  useEffect(() => {
    safeStorage.setItem(STORAGE_GARAGE_TEAM, setup.teamId);
    safeStorage.setItem(STORAGE_GARAGE_DRIVER, setup.driverId);
    safeStorage.setItem(STORAGE_GARAGE_CIRCUIT, setup.circuitId);
  }, [setup.teamId, setup.driverId, setup.circuitId]);

  const currentTeam = getTeamById(setup.teamId) || teams[0];
  const currentDriver = getDriverById(setup.driverId) || drivers[0];
  const currentCircuit = getCircuitById(setup.circuitId) || circuits[0];

  // Dynamic Telemetry & Lap Simulation via extracted hook
  const { simulation } = useLapSimulation(setup, currentTeam, currentDriver, currentCircuit);

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

        {/* Primary Selectors and Tuning Controls */}
        <SetupTuningControls
          setup={setup}
          onChangeSetup={setSetup}
          teams={teams}
          drivers={drivers}
          circuits={circuits}
          currentTeam={currentTeam}
        />

        {/* Live Simulation Output Display */}
        <SimulationResults
          simulation={simulation}
          currentCircuit={currentCircuit}
          currentTeam={currentTeam}
          setup={setup}
          onOpenFormulaModal={() => setIsFormulaModalOpen(true)}
        />
      </div>

      {/* Formula & Aerodynamics Explanation Modal */}
      <FormulaExplanationModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
      />
    </div>
  );
};
