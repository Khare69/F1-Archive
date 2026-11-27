import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_MODELS_DIR = path.resolve(__dirname, '../../../public/models');

const EXPECTED_ERA_MODELS = [
  '1950s_front_engine.glb',
  '1988_turbo.glb',
  '2004_v10.glb',
  '2024_ground_effect.glb',
  '2026_active_aero.glb',
];

const GLTF_MAGIC = 0x46546c67; // 'glTF' in little-endian uint32
const MAX_BUDGET_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

describe('Car Models Asset Validation Gate (P7-DEV-02, C-39, F-38, F-03)', () => {
  it.each(EXPECTED_ERA_MODELS)(
    'ensures %s exists, is under 1.5 MB, and has valid glTF 2.0 binary header',
    (filename) => {
      const filePath = path.join(PUBLIC_MODELS_DIR, filename);

      // 1. File existence
      expect(fs.existsSync(filePath), `Model file ${filename} must exist`).toBe(true);

      const stats = fs.statSync(filePath);

      // 2. File size budget (< 1.5 MB)
      expect(stats.size).toBeGreaterThan(1000);
      expect(stats.size).toBeLessThan(MAX_BUDGET_BYTES);

      // 3. glTF binary header validation
      const buffer = fs.readFileSync(filePath);
      expect(buffer.length).toBeGreaterThanOrEqual(12);

      const magic = buffer.readUInt32LE(0);
      expect(magic).toBe(GLTF_MAGIC);

      const version = buffer.readUInt32LE(4);
      expect(version).toBe(2);

      const totalLength = buffer.readUInt32LE(8);
      expect(totalLength).toBe(stats.size);
    }
  );
});
