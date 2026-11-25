/**
 * F1 // ARCHIVE — Modular TypeScript ETL CLI Entrypoint
 * Executed via: npx tsx scripts/etl/index.ts
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractF1Datasets } from './extract';
import { ElevationService } from './elevation';
import { transformF1Data } from './transform';
import { validateTransformedData } from './validate';
import { writeMinifiedData } from './write';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const CACHE_DIR = path.resolve(__dirname, '..', '.cache');

async function runETL() {
  const startTime = Date.now();
  console.log('🚀 Starting F1 // ARCHIVE Modular TypeScript ETL Pipeline...');

  try {
    // Stage 1: Extraction & Provisioning
    const extraction = await extractF1Datasets(CACHE_DIR);

    // Stage 2: Elevation Service
    const elevationService = new ElevationService(CACHE_DIR);

    // Stage 3: Transformation
    const transformed = await transformF1Data(
      extraction.f1dbDir,
      extraction.geoJsonPath,
      elevationService,
      extraction.releaseTag
    );

    // Stage 4: Validation
    validateTransformedData(transformed);

    // Stage 5: Write Minified Artifacts
    writeMinifiedData(ROOT_DIR, transformed);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`🎉 ETL Pipeline completed successfully in ${elapsed}s!`);
  } catch (err) {
    console.error('❌ ETL Pipeline failed:', err);
    process.exit(1);
  }
}

runETL();
