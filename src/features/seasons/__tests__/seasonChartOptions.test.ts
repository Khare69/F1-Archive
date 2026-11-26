import { describe, it, expect } from 'vitest';
import {
  buildFocusPlusContextSeasonOptions,
  extractSeasonDrivers,
} from '../seasonChartOptions';
import type { RoundStandingsProgression } from '../../../types/f1';

describe('seasonChartOptions (I-04 Focus-Plus-Context)', () => {
  const sampleProgression: RoundStandingsProgression[] = [
    {
      round: 1,
      standings: [
        { driverId: 'max_verstappen', driverCode: 'VER', driverName: 'Max Verstappen', constructorId: 'red_bull', points: 25, position: 1 },
        { driverId: 'sergio_perez', driverCode: 'PER', driverName: 'Sergio Perez', constructorId: 'red_bull', points: 18, position: 2 },
        { driverId: 'charles_leclerc', driverCode: 'LEC', driverName: 'Charles Leclerc', constructorId: 'ferrari', points: 15, position: 3 },
        { driverId: 'carlos_sainz', driverCode: 'SAI', driverName: 'Carlos Sainz', constructorId: 'ferrari', points: 12, position: 4 },
        { driverId: 'lando_norris', driverCode: 'NOR', driverName: 'Lando Norris', constructorId: 'mclaren', points: 10, position: 5 },
      ],
    },
    {
      round: 2,
      standings: [
        { driverId: 'max_verstappen', driverCode: 'VER', driverName: 'Max Verstappen', constructorId: 'red_bull', points: 51, position: 1 },
        { driverId: 'charles_leclerc', driverCode: 'LEC', driverName: 'Charles Leclerc', constructorId: 'ferrari', points: 33, position: 2 },
        { driverId: 'sergio_perez', driverCode: 'PER', driverName: 'Sergio Perez', constructorId: 'red_bull', points: 30, position: 3 },
        { driverId: 'lando_norris', driverCode: 'NOR', driverName: 'Lando Norris', constructorId: 'mclaren', points: 25, position: 4 },
        { driverId: 'carlos_sainz', driverCode: 'SAI', driverName: 'Carlos Sainz', constructorId: 'ferrari', points: 20, position: 5 },
      ],
    },
  ];

  it('extracts unique drivers and ranks them by final round position and points', () => {
    const drivers = extractSeasonDrivers(sampleProgression);
    expect(drivers.length).toBe(5);
    expect(drivers[0].driverId).toBe('max_verstappen');
    expect(drivers[1].driverId).toBe('charles_leclerc');
    expect(drivers[2].driverId).toBe('sergio_perez');
  });

  it('enforces I-04 rules: legend is hidden, endLabel shown on focused series, and muted color on unfocused', () => {
    // Default focus to VER and LEC
    const options = buildFocusPlusContextSeasonOptions(sampleProgression, ['max_verstappen', 'charles_leclerc']);

    expect(options.legend).toEqual({ show: false });

    const series = options.series as Array<{
      name: string;
      lineStyle?: { color?: string; width?: number };
      endLabel?: { show?: boolean };
      z?: number;
    }>;

    expect(series).toBeDefined();
    expect(series.length).toBe(5);

    const verSeries = series.find((s) => s.name === 'VER')!;
    const lecSeries = series.find((s) => s.name === 'LEC')!;
    const norSeries = series.find((s) => s.name === 'NOR')!;

    // Focused series have endLabel show: true and high z-index
    expect(verSeries.endLabel?.show).toBe(true);
    expect(verSeries.z).toBe(10);
    expect(verSeries.lineStyle?.width).toBe(2.2);

    expect(lecSeries.endLabel?.show).toBe(true);
    expect(lecSeries.z).toBe(10);

    // Unfocused series have muted context color, endLabel show: false, and low z-index
    expect(norSeries.endLabel?.show).toBe(false);
    expect(norSeries.z).toBe(1);
    expect(norSeries.lineStyle?.color).toBe('rgba(148, 163, 184, 0.15)');
    expect(norSeries.lineStyle?.width).toBe(1);
  });

  it('handles sparse or 1-round seasons (e.g. 1950s data) without crashing', () => {
    const singleRound: RoundStandingsProgression[] = [
      {
        round: 1,
        standings: [
          { driverId: 'farina', driverCode: 'FAR', driverName: 'Giuseppe Farina', constructorId: 'alfa_romeo', points: 9, position: 1 },
        ],
      },
    ];

    const options = buildFocusPlusContextSeasonOptions(singleRound, []);
    expect(options.series).toBeDefined();
    expect((options.series as unknown[]).length).toBe(1);
  });

  it('returns graceful fallback title when progression array is empty', () => {
    const emptyOptions = buildFocusPlusContextSeasonOptions([], []);
    expect(emptyOptions.title).toBeDefined();
  });
});
