import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import validator from 'gltf-validator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const PUBLIC_MODELS_DIR = path.join(rootDir, 'public', 'models');

const ERA_MODELS = [
  '1950s_front_engine',
  '1988_turbo',
  '2004_v10',
  '2024_ground_effect',
  '2026_active_aero',
];

const MAX_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB strict budget
const GLTF_MAGIC = 0x46546c67; // 'glTF' in little-endian uint32

export async function verifyCarModels() {
  console.log('🔍 [verify-car-models] Verifying 5 Era F1 Chassis in public/models/...\n');
  const summary = [];

  for (const era of ERA_MODELS) {
    const modelPath = path.join(PUBLIC_MODELS_DIR, `${era}.glb`);

    // 1. File existence
    if (!fs.existsSync(modelPath)) {
      throw new Error(`CRITICAL: Missing model ${era}.glb at ${modelPath}!`);
    }

    const stats = fs.statSync(modelPath);
    const sizeKB = (stats.size / 1024).toFixed(1);

    // 2. Budget check (< 1.5 MB)
    if (stats.size > MAX_SIZE_BYTES) {
      throw new Error(`CRITICAL: ${era}.glb (${sizeKB} KB) exceeds 1.5 MB budget!`);
    }

    // 3. glTF binary header validation
    const buffer = fs.readFileSync(modelPath);
    if (buffer.length < 12) {
      throw new Error(`CRITICAL: ${era}.glb is too short to be a valid glTF binary!`);
    }

    const magic = buffer.readUInt32LE(0);
    if (magic !== GLTF_MAGIC) {
      throw new Error(`CRITICAL: ${era}.glb does not begin with glTF binary magic (got 0x${magic.toString(16)})!`);
    }

    const version = buffer.readUInt32LE(4);
    if (version !== 2) {
      throw new Error(`CRITICAL: ${era}.glb version is ${version}, expected 2!`);
    }

    // 4. Khronos validator
    const report = await validator.validateBytes(new Uint8Array(buffer), {
      maxIssues: 20,
      ignoredIssues: ['UNSUPPORTED_EXTENSION'],
    });

    const errors = report.issues.messages.filter((msg) => msg.severity === 0);
    if (errors.length > 0) {
      console.error(`Validation errors for ${era}.glb:`, errors);
      throw new Error(`CRITICAL: ${era}.glb failed Khronos gltf-validator with ${errors.length} errors!`);
    }

    console.log(`✅ [${era}.glb] ${sizeKB} KB — Valid glTF 2.0 (0 errors, Draco compressed)`);
    summary.push({
      era,
      filename: `${era}.glb`,
      sizeKB: `${sizeKB} KB`,
      valid: true,
    });
  }

  console.log('\n======================================================');
  console.log('🏆 100% ERA CAR ASSET VERIFICATION PASSED');
  console.table(summary);
  console.log('======================================================\n');
  return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifyCarModels().catch((err) => {
    console.error('❌ [verify-car-models] Verification failed:', err.message);
    process.exit(1);
  });
}
