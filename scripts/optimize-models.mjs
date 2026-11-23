import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { weld, dedup, resample, draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import validator from 'gltf-validator';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const MODEL_DIR = path.join(rootDir, 'public', 'models');
const RAW_MODEL_PATH = path.join(MODEL_DIR, 'f1_chassis.raw.glb');
const OPT_MODEL_PATH = path.join(MODEL_DIR, 'f1_chassis.glb');

// Every material required by carMaterialMap.ts
const REQUIRED_MATERIALS = [
  'Default_OBJ.001',
  'Default_OBJ.002',
  'Default_OBJ.003',
  'Default_OBJ.004',
  'Default_OBJ.005',
  'Default_OBJ.006',
  'Default_OBJ.007',
  'Default_OBJ.008',
  'Default_OBJ.009',
  'Default_OBJ.011',
  'Default_OBJ.013'
];

async function main() {
  console.log('🏁 [optimize-models] Starting F1 Chassis 3D Optimization Pipeline...');

  // 1. Guard against accidental double compression: create / ensure .raw.glb master exists
  if (!fs.existsSync(RAW_MODEL_PATH)) {
    if (!fs.existsSync(OPT_MODEL_PATH)) {
      throw new Error(`Neither ${RAW_MODEL_PATH} nor ${OPT_MODEL_PATH} exists!`);
    }
    console.log('📦 Preserving uncompressed master as f1_chassis.raw.glb...');
    fs.copyFileSync(OPT_MODEL_PATH, RAW_MODEL_PATH);
  }

  const rawStats = fs.statSync(RAW_MODEL_PATH);
  const rawSizeMB = (rawStats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Input Master Size (${RAW_MODEL_PATH}): ${rawSizeMB} MB`);

  // 2. Read Document
  const dracoEncoder = await draco3d.createEncoderModule();
  const dracoDecoder = await draco3d.createDecoderModule();
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.encoder': dracoEncoder,
      'draco3d.decoder': dracoDecoder
    });
  const document = await io.read(RAW_MODEL_PATH);

  // Check if already compressed with Draco
  const root = document.getRoot();
  const existingExtensions = root.listExtensionsUsed().map((ext) => ext.extensionName);
  if (existingExtensions.includes('KHR_draco_mesh_compression')) {
    console.log('ℹ️ Master is already Draco-compressed. Proceeding with caution.');
  }

  // 3. Downscale / optimize embedded textures to 512x512 WebP/PNG using sharp
  const textures = root.listTextures();
  console.log(`🖼️ Processing ${textures.length} embedded textures...`);
  for (const texture of textures) {
    const imgBuffer = texture.getImage();
    if (imgBuffer && imgBuffer.length > 0) {
      try {
        const resized = await sharp(imgBuffer)
          .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 75 })
          .toBuffer();
        texture.setImage(new Uint8Array(resized));
        texture.setMimeType('image/jpeg');
      } catch (err) {
        console.warn(`⚠️ Could not resize texture ${texture.getName()}:`, err.message);
      }
    }
  }

  // 4. Geometry Optimization (NON-DESTRUCTIVE: NO join / flatten passes to preserve materials)
  console.log('🔧 Running non-destructive geometry optimizations: weld, dedup, resample...');
  await document.transform(
    weld({ tolerance: 0.0001 }),
    dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.TEXTURE] }),
    resample()
  );

  // 5. Apply Draco Compression
  console.log('⚡ Applying Draco Geometry Compression...');
  await document.transform(
    draco({
      encoder: dracoEncoder,
      method: 'edgebreaker',
      quantizationBits: {
        POSITION: 14,
        NORMAL: 10,
        TEX_COORD: 12,
        COLOR: 8,
        GENERIC: 12
      }
    })
  );

  // 6. Programmatically assert that every material required by carMaterialMap.ts exists
  console.log('🔍 Validating semantic material names for carMaterialMap.ts...');
  const preservedMaterials = new Set(root.listMaterials().map((m) => m.getName()));
  for (const reqMat of REQUIRED_MATERIALS) {
    if (!preservedMaterials.has(reqMat)) {
      throw new Error(`CRITICAL: Material "${reqMat}" was stripped during compression! Aborting.`);
    }
  }
  console.log(`✅ All ${REQUIRED_MATERIALS.length} required materials successfully preserved!`);

  // 7. Write to buffer & Validate with gltf-validator
  console.log('📝 Writing optimized GLB buffer and validating with Khronos gltf-validator...');
  const glbBuffer = await io.writeBinary(document);

  const validationReport = await validator.validateBytes(glbBuffer, {
    maxIssues: 50,
    ignoredIssues: ['UNSUPPORTED_EXTENSION']
  });

  const errors = validationReport.issues.messages.filter((msg) => msg.severity === 0);
  if (errors.length > 0) {
    console.error('❌ gltf-validator errors:', errors);
    throw new Error(`gltf-validator failed with ${errors.length} errors!`);
  }
  console.log(`✅ Khronos glTF Validation passed (0 errors, ${validationReport.issues.numWarnings} warnings).`);

  // 8. Output to OPT_MODEL_PATH
  fs.writeFileSync(OPT_MODEL_PATH, Buffer.from(glbBuffer));
  const optStats = fs.statSync(OPT_MODEL_PATH);
  const optSizeMB = (optStats.size / (1024 * 1024)).toFixed(2);
  const reductionPct = ((1 - optStats.size / rawStats.size) * 100).toFixed(1);

  console.log('──────────────────────────────────────────────────────');
  console.log(`🎉 SUCCESS! Model compressed from ${rawSizeMB} MB -> ${optSizeMB} MB (${reductionPct}% reduction)`);
  console.log(`📍 Saved to: ${OPT_MODEL_PATH}`);
  console.log('──────────────────────────────────────────────────────');

  if (optStats.size > 1.5 * 1024 * 1024) {
    console.warn(`⚠️ Warning: Output size ${optSizeMB} MB exceeds 1.5 MB target!`);
  } else {
    console.log(`🏆 Target met: Output is under 1.5 MB!`);
  }
}

main().catch((err) => {
  console.error('❌ [optimize-models] Failed:', err);
  process.exit(1);
});
