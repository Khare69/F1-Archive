import { http, HttpResponse } from 'msw';
import fs from 'node:fs';
import path from 'node:path';
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
  }),

  // Intercept local /data/ requests in test environment and read from public/data
  http.get('*/data/index/:filename', ({ params }) => {
    const filename = String(params.filename);
    const filePath = path.resolve(process.cwd(), 'public/data/index', filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return HttpResponse.json(JSON.parse(content));
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.get('*/data/seasons/:filename', ({ params }) => {
    const filename = String(params.filename);
    const filePath = path.resolve(process.cwd(), 'public/data/seasons', filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return HttpResponse.json(JSON.parse(content));
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.get('*/data/circuits/:filename', ({ params }) => {
    const filename = String(params.filename);
    const filePath = path.resolve(process.cwd(), 'public/data/circuits', filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return HttpResponse.json(JSON.parse(content));
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.get('*/data/telemetry/:filename', ({ params }) => {
    const filename = String(params.filename);
    const filePath = path.resolve(process.cwd(), 'public/data/telemetry', filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return HttpResponse.json(JSON.parse(content));
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.get('*/data/:filename', ({ params }) => {
    const filename = String(params.filename);
    const filePath = path.resolve(process.cwd(), 'public/data', filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return HttpResponse.json(JSON.parse(content));
    }
    return new HttpResponse(null, { status: 404 });
  })
];
