import * as THREE from 'three';
import type { Team } from '../../types/f1';
import {
  resolveCanonicalTeamId,
  CONSTRUCTOR_EMBLEMS,
  type ConstructorEmblemConfig,
} from '../../components/FallbackImage/constructorEmblems';

export type TeamLike =
  | Team
  | { id: string; color?: string; name?: string; [key: string]: unknown }
  | string;

export interface GeneratedLiveryTextures {
  liveryMap: THREE.CanvasTexture | null;
  carbonRoughnessMap: THREE.CanvasTexture | null;
  dispose: () => void;
}

export interface LiveryGeneratorOptions {
  raceNumber?: number;
  width?: number;
  height?: number;
}

/**
 * Creates a seamless procedural 2x2 twill carbon fiber weave texture
 * to serve as a roughness / micro-bump map for exposed carbon elements.
 */
export function createCarbonWeaveTexture(size = 256): {
  texture: THREE.CanvasTexture | null;
  dispose: () => void;
} {
  if (typeof document === 'undefined') {
    return { texture: null, dispose: () => {} };
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return { texture: null, dispose: () => {} };
  }

  // Dark baseline composite
  ctx.fillStyle = '#14171E';
  ctx.fillRect(0, 0, size, size);

  // 2x2 Twill Weave procedural simulation
  const tileSize = 8;
  const halfTile = tileSize / 2;

  for (let y = 0; y < size; y += tileSize) {
    for (let x = 0; x < size; x += tileSize) {
      const isAltRow = (y / tileSize) % 2 === 0;
      const isAltCol = (x / tileSize) % 2 === 0;

      // Weave thread highlight & shadow
      if ((isAltRow && isAltCol) || (!isAltRow && !isAltCol)) {
        ctx.fillStyle = '#222733';
        ctx.fillRect(x, y, tileSize, halfTile);
        ctx.fillStyle = '#101319';
        ctx.fillRect(x, y + halfTile, tileSize, halfTile);
      } else {
        ctx.fillStyle = '#1B1F2A';
        ctx.fillRect(x, y, halfTile, tileSize);
        ctx.fillStyle = '#0E1117';
        ctx.fillRect(x + halfTile, y, halfTile, tileSize);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return {
    texture,
    dispose: () => {
      texture.dispose();
    },
  };
}

/**
 * Resolves color palette and typographic monogram for any team
 */
function resolveTeamPalette(teamIdOrTeam: TeamLike): {
  id: string;
  primary: string;
  secondary: string;
  accent: string;
  monogram: string;
} {
  const id = typeof teamIdOrTeam === 'string' ? teamIdOrTeam : teamIdOrTeam.id;
  const canonicalId = resolveCanonicalTeamId(id) ?? id.toLowerCase().replace(/[^a-z0-9]/g, '');

  const emblem: ConstructorEmblemConfig | undefined = CONSTRUCTOR_EMBLEMS[canonicalId];

  if (emblem) {
    return {
      id: canonicalId,
      primary: emblem.primaryColor,
      secondary: emblem.secondaryColor,
      accent: emblem.accentColor ?? '#FFFFFF',
      monogram: emblem.monogram,
    };
  }

  // Fallback to team object colors if available
  if (typeof teamIdOrTeam !== 'string' && teamIdOrTeam.color) {
    return {
      id: canonicalId,
      primary: teamIdOrTeam.color,
      secondary: '#FFFFFF',
      accent: '#00D2FF',
      monogram: id.slice(0, 3).toUpperCase(),
    };
  }

  return {
    id: canonicalId,
    primary: '#E10600',
    secondary: '#FFFFFF',
    accent: '#0A0E18',
    monogram: 'F1',
  };
}

/**
 * Generates trademark-safe procedural geometric liveries for F1 vehicles.
 * Purged of all manufacturer trademarked emblems and registered logos.
 * Uses strictly geometric racing stripes, contrast color blocking, number roundels,
 * and typographic team monograms.
 */
export function getTeamLiveryTextures(
  teamIdOrTeam: TeamLike,
  options: LiveryGeneratorOptions = {}
): GeneratedLiveryTextures {
  const { raceNumber = 1, width = 2048, height = 1024 } = options;

  if (typeof document === 'undefined') {
    return {
      liveryMap: null,
      carbonRoughnessMap: null,
      dispose: () => {},
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      liveryMap: null,
      carbonRoughnessMap: null,
      dispose: () => {},
    };
  }

  const palette = resolveTeamPalette(teamIdOrTeam);
  const carbonWeave = createCarbonWeaveTexture(256);

  // 1. Deep Carbon Fiber Foundation (Chassis / Underbody)
  ctx.fillStyle = '#0B0E14';
  ctx.fillRect(0, 0, width, height);

  // Subtle micro-pattern on base
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let x = 0; x < width; x += 16) {
    for (let y = 0; y < height; y += 16) {
      if ((x + y) % 32 === 0) {
        ctx.fillRect(x, y, 8, 8);
      }
    }
  }

  // 2. Primary Team Color Coat
  ctx.fillStyle = palette.primary;
  ctx.beginPath();
  // Sleek tapered aerodynamic body panels
  ctx.moveTo(100, 180);
  ctx.lineTo(width - 150, 260);
  ctx.lineTo(width, 420);
  ctx.lineTo(width, height - 420);
  ctx.lineTo(width - 150, height - 260);
  ctx.lineTo(100, height - 180);
  ctx.closePath();
  ctx.fill();

  // 3. Secondary Dynamic Color Block / Chevrons
  ctx.fillStyle = palette.secondary;
  // Sidepod dynamic sweep
  ctx.beginPath();
  ctx.moveTo(350, 320);
  ctx.lineTo(width - 300, 400);
  ctx.lineTo(width - 450, 480);
  ctx.lineTo(300, 440);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(350, height - 320);
  ctx.lineTo(width - 300, height - 400);
  ctx.lineTo(width - 450, height - 480);
  ctx.lineTo(300, height - 440);
  ctx.closePath();
  ctx.fill();

  // 4. Accent Pinstripes (Pure geometric aero lines)
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 14;

  // Upper pinstripe
  ctx.beginPath();
  ctx.moveTo(200, 280);
  ctx.lineTo(width - 200, 360);
  ctx.stroke();

  // Lower pinstripe
  ctx.beginPath();
  ctx.moveTo(200, height - 280);
  ctx.lineTo(width - 200, height - 360);
  ctx.stroke();

  // 5. Center Exposed Carbon Spine
  ctx.fillStyle = '#080A0F';
  ctx.fillRect(400, 470, width - 800, 84);

  // 6. Trademark-Safe Racing Roundel on Shark Fin / Engine Cover
  const roundelX = 680;
  const roundelY = height / 2;
  const roundelRadius = 110;

  // Outer border
  ctx.fillStyle = palette.secondary;
  ctx.beginPath();
  ctx.arc(roundelX, roundelY, roundelRadius, 0, Math.PI * 2);
  ctx.fill();

  // Inner field
  ctx.fillStyle = '#0A0D14';
  ctx.beginPath();
  ctx.arc(roundelX, roundelY, roundelRadius - 14, 0, Math.PI * 2);
  ctx.fill();

  // Racing Number or Monogram inside roundel
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 100px "Titillium Web", "Arial Black", sans-serif';
  ctx.fillText(String(raceNumber), roundelX, roundelY - 8);

  // Monogram badge on nosecone section
  const noseX = width - 280;
  const noseY = height / 2;
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(noseX, noseY, 56, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#090B10';
  ctx.beginPath();
  ctx.arc(noseX, noseY, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px "Titillium Web", sans-serif';
  ctx.fillText(palette.monogram, noseX, noseY + 2);

  // Wrap in Three.js CanvasTexture
  const liveryMap = new THREE.CanvasTexture(canvas);
  liveryMap.wrapS = THREE.RepeatWrapping;
  liveryMap.wrapT = THREE.RepeatWrapping;
  liveryMap.generateMipmaps = true;
  liveryMap.minFilter = THREE.LinearMipmapLinearFilter;
  liveryMap.magFilter = THREE.LinearFilter;
  liveryMap.anisotropy = 8;
  liveryMap.needsUpdate = true;

  return {
    liveryMap,
    carbonRoughnessMap: carbonWeave.texture,
    dispose: () => {
      liveryMap.dispose();
      carbonWeave.dispose();
    },
  };
}

/**
 * Backward compatibility helper returning only the livery texture.
 */
export function getTeamLiveryTexture(team: Team): THREE.CanvasTexture | null {
  return getTeamLiveryTextures(team).liveryMap;
}
