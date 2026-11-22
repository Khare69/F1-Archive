import { http, HttpResponse } from 'msw';
import {
  mockDriverStandingsResponse2026,
  mockConstructorStandingsResponse2026,
  mockRaceScheduleResponse2026
} from './fixtures';

export const handlers = [
  // Driver Standings
  http.get('https://api.jolpi.ca/ergast/f1/:year/driverStandings.json', () => {
    return HttpResponse.json(mockDriverStandingsResponse2026);
  }),

  // Constructor Standings
  http.get('https://api.jolpi.ca/ergast/f1/:year/constructorStandings.json', () => {
    return HttpResponse.json(mockConstructorStandingsResponse2026);
  }),

  // Season Race Schedule
  http.get('https://api.jolpi.ca/ergast/f1/:year.json', () => {
    return HttpResponse.json(mockRaceScheduleResponse2026);
  })
];
