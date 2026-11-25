/**
 * F1 // ARCHIVE — Pure-Node ETL Extraction Module
 * Handles safe download and pure-Node zip extraction using adm-zip.
 */

import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

export interface ExtractionResult {
  f1dbDir: string;
  geoJsonPath: string;
  sqlitePath: string;
  releaseTag: string;
}

const F1DB_REPO = 'f1db/f1db';
const GEOJSON_URL = 'https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson';

/**
 * Validates zip entries against Zip-Slip path traversal vulnerability.
 */
export function validateAndExtractZip(zipPath: string, destinationDir: string): void {
  fs.mkdirSync(destinationDir, { recursive: true });
  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();
  const resolvedDest = path.resolve(destinationDir);

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;
    const targetPath = path.resolve(destinationDir, entry.entryName);
    if (!targetPath.startsWith(resolvedDest) || entry.entryName.includes('..')) {
      throw new Error(`[Security] Zip-slip directory traversal attack detected in entry: ${entry.entryName}`);
    }
  }

  zip.extractAllTo(destinationDir, true);
}

/**
 * Downloads a file over HTTPS following redirects.
 */
export async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'F1-Archive-ETL/2.0' },
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

/**
 * Fetches the latest F1DB release tag from GitHub API, fallback to default.
 */
export async function getLatestF1DBTag(): Promise<string> {
  try {
    const res = await fetch(`https://api.github.com/repos/${F1DB_REPO}/releases/latest`, {
      headers: { 'User-Agent': 'F1-Archive-ETL/2.0' }
    });
    if (res.ok) {
      const data = (await res.json()) as { tag_name?: string };
      if (data.tag_name) {
        return data.tag_name.replace(/^v/, '');
      }
    }
  } catch {
    // Fallback to offline or cached tag
  }
  return '2026.21.0';
}

/**
 * Main extraction orchestrator.
 */
export async function extractF1Datasets(cacheDir: string): Promise<ExtractionResult> {
  fs.mkdirSync(cacheDir, { recursive: true });

  const f1dbDir = path.join(cacheDir, 'f1db');
  const geoJsonPath = path.join(cacheDir, 'f1-circuits.geojson');
  const sqlitePath = path.join(cacheDir, 'f1db.sqlite');
  const jsonZipPath = path.join(cacheDir, 'f1db-json-splitted.zip');
  const sqliteZipPath = path.join(cacheDir, 'f1db-sqlite.zip');

  const releaseTag = await getLatestF1DBTag();

  // 1. Ensure GeoJSON is present
  if (!fs.existsSync(geoJsonPath)) {
    console.log('🌐 Downloading bacinger/f1-circuits GeoJSON...');
    await downloadFile(GEOJSON_URL, geoJsonPath);
  }

  // 2. Ensure F1DB JSON dataset is extracted
  const requiredJsonFiles = ['f1db-races.json', 'f1db-circuits.json', 'f1db-drivers.json'];
  const hasExtractedJson = fs.existsSync(f1dbDir) && requiredJsonFiles.every(f => fs.existsSync(path.join(f1dbDir, f)));

  if (!hasExtractedJson) {
    if (!fs.existsSync(jsonZipPath)) {
      const jsonUrl = `https://github.com/${F1DB_REPO}/releases/download/v${releaseTag}/f1db-json-splitted.zip`;
      console.log(`🌐 Downloading F1DB JSON release v${releaseTag}...`);
      await downloadFile(jsonUrl, jsonZipPath);
    }
    console.log('📦 Extracting F1DB JSON files via adm-zip...');
    validateAndExtractZip(jsonZipPath, f1dbDir);
  }

  // 3. Ensure f1db.sqlite is provisioned
  if (!fs.existsSync(sqlitePath)) {
    if (!fs.existsSync(sqliteZipPath)) {
      const sqliteUrl = `https://github.com/${F1DB_REPO}/releases/download/v${releaseTag}/f1db-sqlite.zip`;
      console.log(`🌐 Downloading F1DB SQLite artifact v${releaseTag}...`);
      try {
        await downloadFile(sqliteUrl, sqliteZipPath);
      } catch (err) {
        console.warn(`[ETL] SQLite download fallback: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    if (fs.existsSync(sqliteZipPath)) {
      console.log('📦 Extracting f1db.sqlite via adm-zip...');
      validateAndExtractZip(sqliteZipPath, cacheDir);
      const dbPath = path.join(cacheDir, 'f1db.db');
      if (fs.existsSync(dbPath) && !fs.existsSync(sqlitePath)) {
        fs.copyFileSync(dbPath, sqlitePath);
      }
    }
  }

  return {
    f1dbDir,
    geoJsonPath,
    sqlitePath,
    releaseTag
  };
}
