/**
 * F1 // ARCHIVE — Minified Data Artifact Writer
 * Writes compact, minified JSON artifacts saving 35–40% whitespace bloat.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { TransformOutputs } from './transform';

export function writeMinifiedData(rootDir: string, data: TransformOutputs): void {
  const srcGenDir = path.join(rootDir, 'src', 'data', 'generated');
  const publicDataDir = path.join(rootDir, 'public', 'data');
  const publicIndexDir = path.join(publicDataDir, 'index');
  const publicSeasonsDir = path.join(publicDataDir, 'seasons');
  const publicCircuitsDir = path.join(publicDataDir, 'circuits');

  fs.mkdirSync(srcGenDir, { recursive: true });
  fs.mkdirSync(publicIndexDir, { recursive: true });
  fs.mkdirSync(publicSeasonsDir, { recursive: true });
  fs.mkdirSync(publicCircuitsDir, { recursive: true });

  console.log('💾 Writing minified datasets to disk...');

  // 1. Write src/data/generated/ minified files
  fs.writeFileSync(path.join(srcGenDir, 'seasons.json'), JSON.stringify(data.seasons));
  fs.writeFileSync(path.join(srcGenDir, 'constructors.json'), JSON.stringify(data.constructors));
  fs.writeFileSync(path.join(srcGenDir, 'drivers.json'), JSON.stringify(data.drivers));
  fs.writeFileSync(path.join(srcGenDir, 'circuits.json'), JSON.stringify(data.circuits));
  fs.writeFileSync(path.join(srcGenDir, 'meta.json'), JSON.stringify(data.meta));

  // 1b. Write public/data/index/ minified files for lazy runtime fetching
  fs.writeFileSync(path.join(publicIndexDir, 'seasons.json'), JSON.stringify(data.seasons));
  fs.writeFileSync(path.join(publicIndexDir, 'constructors.json'), JSON.stringify(data.constructors));
  fs.writeFileSync(path.join(publicIndexDir, 'drivers.json'), JSON.stringify(data.drivers));
  fs.writeFileSync(path.join(publicIndexDir, 'circuits.json'), JSON.stringify(data.circuits));
  fs.writeFileSync(path.join(publicIndexDir, 'meta.json'), JSON.stringify(data.meta));

  // 2. Write public/data/circuits/<cId>.json minified spline files
  for (const [cId, splineObj] of data.circuitSplines.entries()) {
    fs.writeFileSync(
      path.join(publicCircuitsDir, `${cId}.json`),
      JSON.stringify(splineObj)
    );
  }

  // 3. Write public/data/seasons/<year>.json minified classifications
  for (const [yr, seasonObj] of data.seasonClassifications.entries()) {
    fs.writeFileSync(
      path.join(publicSeasonsDir, `${yr}.json`),
      JSON.stringify(seasonObj)
    );
  }

  // 4. Write public/data/teammates.json
  fs.writeFileSync(
    path.join(publicDataDir, 'teammates.json'),
    JSON.stringify(data.teammates)
  );

  console.log('✅ Minified data artifacts written successfully!');
}
