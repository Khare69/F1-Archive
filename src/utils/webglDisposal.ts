import * as THREE from 'three';

export interface DisposalStats {
  geometries: number;
  materials: number;
  textures: number;
}

export interface DisposalOptions {
  skipGeometries?: boolean;
  skipTextures?: boolean;
}

const TEXTURE_PROPERTIES: (keyof THREE.Material | string)[] = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'alphaMap',
  'bumpMap',
  'displacementMap',
  'clearcoatMap',
  'clearcoatNormalMap',
  'clearcoatRoughnessMap',
  'lightMap',
  'specularMap',
  'gradientMap',
  'transmissionMap',
  'sheenColorMap',
  'sheenRoughnessMap',
  'thicknessMap',
  'specularColorMap',
  'specularIntensityMap',
  'iridescenceMap',
  'iridescenceThicknessMap',
  'anisotropyMap'
];

export function disposeMaterial(
  material: THREE.Material | THREE.Material[] | null | undefined,
  options?: DisposalOptions,
  disposedMaterials?: Set<unknown>,
  disposedTextures?: Set<unknown>
): { materials: number; textures: number } {
  const materialsSet = disposedMaterials ?? new Set<unknown>();
  const texturesSet = disposedTextures ?? new Set<unknown>();
  let matCount = 0;
  let texCount = 0;

  if (!material) {
    return { materials: 0, textures: 0 };
  }

  const matList = Array.isArray(material) ? material : [material];

  for (const mat of matList) {
    if (!mat || materialsSet.has(mat)) continue;
    materialsSet.add(mat);

    if (!options?.skipTextures) {
      for (const prop of TEXTURE_PROPERTIES) {
        const val = (mat as unknown as Record<string, unknown>)[prop];
        if (
          val &&
          typeof val === 'object' &&
          'dispose' in val &&
          typeof (val as { dispose: unknown }).dispose === 'function' &&
          !texturesSet.has(val)
        ) {
          texturesSet.add(val);
          try {
            (val as { dispose: () => void }).dispose();
            texCount++;
          } catch {
            // Silently handle if already destroyed
          }
        }
      }
    }

    try {
      if (typeof mat.dispose === 'function') {
        mat.dispose();
        matCount++;
      }
    } catch {
      // Silently handle
    }
  }

  return { materials: matCount, textures: texCount };
}

export function disposeObject3D(
  root: THREE.Object3D | null | undefined,
  options?: DisposalOptions
): DisposalStats {
  if (!root) {
    return { geometries: 0, materials: 0, textures: 0 };
  }

  const disposedGeometries = new Set<unknown>();
  const disposedMaterials = new Set<unknown>();
  const disposedTextures = new Set<unknown>();

  root.traverse((obj) => {
    // 1. Dispose geometry
    if (!options?.skipGeometries) {
      const meshObj = obj as unknown as { geometry?: THREE.BufferGeometry };
      if (
        meshObj.geometry &&
        typeof meshObj.geometry.dispose === 'function' &&
        !disposedGeometries.has(meshObj.geometry)
      ) {
        disposedGeometries.add(meshObj.geometry);
        try {
          meshObj.geometry.dispose();
        } catch {
          // Ignore
        }
      }
    }

    // 2. Dispose materials and textures
    const matObj = obj as unknown as { material?: THREE.Material | THREE.Material[] };
    if (matObj.material) {
      disposeMaterial(matObj.material, options, disposedMaterials, disposedTextures);
    }
  });

  return {
    geometries: disposedGeometries.size,
    materials: disposedMaterials.size,
    textures: disposedTextures.size
  };
}

export function attachWebGLContextLossGuard(
  canvas: HTMLCanvasElement,
  onLost: () => void,
  onRestored?: () => void
): () => void {
  if (!canvas || typeof canvas.addEventListener !== 'function') {
    return () => {};
  }

  const handleLost = (event: Event) => {
    event.preventDefault();
    onLost();
  };

  const handleRestored = () => {
    onRestored?.();
  };

  canvas.addEventListener('webglcontextlost', handleLost, false);
  canvas.addEventListener('webglcontextrestored', handleRestored, false);

  return () => {
    canvas.removeEventListener('webglcontextlost', handleLost, false);
    canvas.removeEventListener('webglcontextrestored', handleRestored, false);
  };
}
