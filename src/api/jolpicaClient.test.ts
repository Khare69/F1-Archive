import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchDriverStandings,
  fetchConstructorStandings,
  fetchSeasonSchedule
} from './jolpicaClient';

describe('Jolpica F1 API Client & Fallback Resilience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch driver standings with structured data format', async () => {
    const result = await fetchDriverStandings('current');
    expect(result).toBeDefined();
    expect(result.standings.length).toBeGreaterThan(0);
    
    const leader = result.standings[0];
    expect(leader.position).toBe(1);
    expect(leader.driverName).toBeTruthy();
    expect(leader.constructorName).toBeTruthy();
    expect(leader.points).toBeGreaterThanOrEqual(0);
  });

  it('should fetch constructor standings with structured data format', async () => {
    const result = await fetchConstructorStandings('current');
    expect(result).toBeDefined();
    expect(result.standings.length).toBeGreaterThan(0);

    const leader = result.standings[0];
    expect(leader.position).toBe(1);
    expect(leader.constructorName).toBeTruthy();
    expect(leader.points).toBeGreaterThanOrEqual(0);
  });

  it('should fetch race schedule with rounds and circuits', async () => {
    const result = await fetchSeasonSchedule('current');
    expect(result).toBeDefined();
    expect(result.races.length).toBeGreaterThan(0);

    const roundOne = result.races[0];
    expect(roundOne.round).toBe(1);
    expect(roundOne.raceName).toBeTruthy();
    expect(roundOne.circuitName).toBeTruthy();
  });

  it('should gracefully fallback to curated offline data on network error', async () => {
    // Force network fetch to reject
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network Offline')));

    const result = await fetchDriverStandings('forced_error_year');
    expect(result.isFallback).toBe(true);
    expect(result.standings.length).toBeGreaterThan(0);
    expect(result.standings[0].driverName).toBeTruthy();
  });
});
