import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { weld, dedup, resample, draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import validator from 'gltf-validator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const EXPORTS_DIR = path.join(rootDir, 'assets', 'blender', 'exports');
const PUBLIC_MODELS_DIR = path.join(rootDir, 'public', 'models');

const ERA_MODELS = [
  '1950s_front_engine',
  '1988_turbo',
  '2004_v10',
  '2024_ground_effect',
  '2026_active_aero',
];

const MAX_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB strict budget

export async function optimizeEraModels() {
  console.log('🏎️ [optimize-car-models] Starting 5-Era F1 Chassis Draco Optimization Pipeline...');

  if (!fs.existsSync(PUBLIC_MODELS_DIR)) {
    fs.mkdirSync(PUBLIC_MODELS_DIR, { recursive: true });
  }

  const dracoEncoder = await draco3d.createEncoderModule();
  const dracoDecoder = await draco3d.createDecoderModule();

  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.encoder': dracoEncoder,
      'draco3d.decoder': dracoDecoder,
    });

  const results = [];

  for (const era of ERA_MODELS) {
    const rawPath = path.join(EXPORTS_DIR, `${era}_raw.glb`);
    const optPath = path.join(PUBLIC_MODELS_DIR, `${era}.glb`);

    if (!fs.existsSync(rawPath)) {
      throw new Error(`Raw master asset not found: ${rawPath}. Run scripts/blender/build_era_cars.py first.`);
    }

    const rawStats = fs.statSync(rawPath);
    const rawKB = (rawStats.size / 1024).toFixed(1);

    console.log(`\n⏳ Optimizing [${era}] (raw: ${rawKB} KB)...`);

    const document = await io.read(rawPath);

    // Geometry optimization (non-destructive: no join to preserve material zones & named flaps)
    await document.transform(
      weld({ tolerance: 0.0001 }),
      dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.TEXTURE] }),
      resample(),
      draco({
        encoder: dracoEncoder,
        method: 'edgebreaker',
        quantizationBits: {
          POSITION: 14,
          NORMAL: 10,
          TEX_COORD: 12,
          COLOR: 8,
          GENERIC: 12,
        },
      })
    );

    const glbBuffer = await io.writeBinary(document);

    // Validate with gltf-validator
    const validationReport = await validator.validateBytes(glbBuffer, {
      maxIssues: 50,
      ignoredIssues: ['UNSUPPORTED_EXTENSION'],
    });

    const errors = validationReport.issues.messages.filter((msg) => msg.severity === 0);
    if (errors.length > 0) {
      console.error(`❌ Validation failed for ${era}:`, errors);
      throw new Error(`gltf-validator failed for ${era} with ${errors.length} errors!`);
    }

    fs.writeFileSync(optPath, Buffer.from(glbBuffer));
    const optStats = fs.statSync(optPath);
    const optKB = (optStats.size / 1024).toFixed(1);
    const ratio = ((1 - optStats.size / rawStats.size) * 100).toFixed(1);

    if (optStats.size > MAX_SIZE_BYTES) {
      throw new Error(`Model ${era}.glb (${optKB} KB) exceeds 1.5 MB budget!`);
    }

    console.log(`✅ [${era}] Optimized: ${rawKB} KB -> ${optKB} KB (${ratio}% reduction)`);
    results.push({ era, rawKB, optKB, bytes: optStats.size });
  }

  console.log('\n======================================================');
  console.log('🎉 ALL 5 ERA CHASSIS MODELS OPTIMIZED & VALIDATED!');
  console.table(results);
  console.log('======================================================');
  return results;
}

// Execute when invoked directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  optimizeEraModels().catch((err) => {
    console.error('❌ [optimize-car-models] Optimization failed:', err);
    process.exit(1);
  });
}
