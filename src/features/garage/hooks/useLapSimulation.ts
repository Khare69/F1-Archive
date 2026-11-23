import { useMemo } from 'react';
import type { CarSetupConfig, SimulatedLapResult, Team, Driver, Circuit } from '../../../types/f1';

export interface UseLapSimulationResult {
  simulation: SimulatedLapResult;
  recordSeconds: number;
}

/**
 * useLapSimulation
 * Computes an illustrative physics and aerodynamic lap simulation based on
 * team specs, driver performance, target circuit characteristics, and car setup tuning.
 */
export function useLapSimulation(
  setup: CarSetupConfig,
  currentTeam: Team,
  currentDriver: Driver,
  currentCircuit: Circuit
): UseLapSimulationResult {
  // Helper to parse lap record string "1:21.046" into seconds
  const recordSeconds = useMemo(() => {
    if (!currentCircuit.lapRecord) return 80.0;
    const parts = currentCircuit.lapRecord.split(':');
    if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return 80.0;
  }, [currentCircuit.lapRecord]);

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

  return { simulation, recordSeconds };
}
