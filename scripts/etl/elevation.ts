/**
 * F1 // ARCHIVE — Open-Meteo Real Elevation Enrichment
 * Enriches WGS84 circuit coordinates with real meters-above-sea-level elevation.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface ElevationCache {
  [coordKey: string]: number; // key: "lat,lng" rounded to 5 decimal places -> elevation in meters
}

const BATCH_SIZE = 80;

function makeKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export class ElevationService {
  private cachePath: string;
  private cache: ElevationCache = {};
  private dirty = false;

  constructor(cacheDir: string) {
    this.cachePath = path.join(cacheDir, 'elevations.json');
    this.loadCache();
  }

  private loadCache(): void {
    if (fs.existsSync(this.cachePath)) {
      try {
        const raw = fs.readFileSync(this.cachePath, 'utf-8');
        this.cache = JSON.parse(raw);
      } catch (err) {
        console.warn(`[ElevationService] Failed to parse ${this.cachePath}, starting fresh:`, err);
        this.cache = {};
      }
    }
  }

  public saveCache(): void {
    if (this.dirty) {
      try {
        fs.writeFileSync(this.cachePath, JSON.stringify(this.cache));
        this.dirty = false;
      } catch (err) {
        console.warn(`[ElevationService] Failed to write cache:`, err);
      }
    }
  }

  /**
   * Fetches real elevations (in meters) for an array of [lng, lat] coordinates.
   */
  public async getElevationsForPoints(points: [number, number][]): Promise<number[]> {
    const results: number[] = new Array(points.length).fill(0);
    const missingIndices: number[] = [];
    const missingCoords: [number, number][] = [];

    for (let i = 0; i < points.length; i++) {
      const [lng, lat] = points[i];
      const key = makeKey(lat, lng);
      if (this.cache[key] !== undefined) {
        results[i] = this.cache[key];
      } else {
        missingIndices.push(i);
        missingCoords.push([lng, lat]);
      }
    }

    if (missingCoords.length === 0) {
      return results;
    }

    // Query in batches
    for (let b = 0; b < missingCoords.length; b += BATCH_SIZE) {
      const batchIndices = missingIndices.slice(b, b + BATCH_SIZE);
      const batchCoords = missingCoords.slice(b, b + BATCH_SIZE);

      const lats = batchCoords.map(c => c[1].toFixed(5)).join(',');
      const lngs = batchCoords.map(c => c[0].toFixed(5)).join(',');
      const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`;

      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'F1-Archive-ETL/2.0' }
        });
        if (res.ok) {
          const json = (await res.json()) as { elevation?: number[] };
          if (Array.isArray(json.elevation)) {
            for (let k = 0; k < json.elevation.length; k++) {
              const elevM = Number((json.elevation[k] ?? 0).toFixed(1));
              const originalIdx = batchIndices[k];
              const [lng, lat] = batchCoords[k];
              const key = makeKey(lat, lng);
              this.cache[key] = elevM;
              results[originalIdx] = elevM;
              this.dirty = true;
            }
          }
        }
      } catch (err) {
        console.warn(`[ElevationService] Network error fetching batch (${missingCoords.length} pts):`, err);
        // Fallback to 0 if unreachable
        for (const idx of batchIndices) {
          results[idx] = results[idx] || 0;
        }
      }
    }

    this.saveCache();
    return results;
  }
}
