/**
 * F1 // ARCHIVE — Build Browser SQLite Database Orchestrator
 * Spawns scripts/etl/build_browser_sqlite.py and verifies successful creation
 * of public/data/f1db-browser.sqlite.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

export function buildBrowserSqlite(): void {
  const scriptPath = path.resolve(__dirname, 'build_browser_sqlite.py');
  const venvPythonWin = path.resolve(ROOT_DIR, 'backend', '.venv', 'Scripts', 'python.exe');
  const venvPythonPosix = path.resolve(ROOT_DIR, 'backend', '.venv', 'bin', 'python');

  let pythonBin = 'python';
  if (fs.existsSync(venvPythonWin)) {
    pythonBin = venvPythonWin;
  } else if (fs.existsSync(venvPythonPosix)) {
    pythonBin = venvPythonPosix;
  }

  console.log(`[buildBrowserSqlite] Running ${scriptPath} using ${pythonBin}...`);

  const result = spawnSync(pythonBin, [scriptPath], {
    stdio: 'inherit',
    cwd: ROOT_DIR
  });

  if (result.error) {
    throw new Error(`Failed to spawn Python process: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`build_browser_sqlite.py exited with non-zero code: ${result.status}`);
  }

  const destDb = path.resolve(ROOT_DIR, 'public', 'data', 'f1db-browser.sqlite');
  if (!fs.existsSync(destDb)) {
    throw new Error(`Target database not found at expected path: ${destDb}`);
  }

  const stat = fs.statSync(destDb);
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
  console.log(`[buildBrowserSqlite] Browser database ready: ${destDb} (${sizeMb} MB)`);
}

// Direct execution CLI support
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  try {
    buildBrowserSqlite();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during browser SQLite generation:', err);
    process.exit(1);
  }
}
