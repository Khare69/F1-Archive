import * as THREE from 'three';
import type { Team } from '../../types/f1';

// Texture cache to avoid re-generating canvas textures on every render
const liveryTextureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates an authentic high-resolution procedural livery texture for each F1 team.
 * Includes official dual-tone color blocking, racing gradients, carbon fiber weave texture,
 * and team crest emblems without any commercial sponsor logos.
 */
export function getTeamLiveryTexture(team: Team): THREE.CanvasTexture {
  if (liveryTextureCache.has(team.id)) {
    return liveryTextureCache.get(team.id)!;
  }

  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Base Carbon / Team Background
  ctx.fillStyle = '#0D111A';
  ctx.fillRect(0, 0, width, height);

  // Carbon fiber micro-weave pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  for (let x = 0; x < width; x += 8) {
    for (let y = 0; y < height; y += 8) {
      if ((x + y) % 16 === 0) {
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }

  // 2. Apply Team-Specific Authentic Livery Patterns
  switch (team.id) {
    case 'redbull': {
      // Deep Matte Navy Blue Body
      ctx.fillStyle = '#0600EF';
      ctx.fillRect(0, 200, width, 624);

      // Yellow Nose Cone & Intake Tip (#FCD116)
      ctx.fillStyle = '#FCD116';
      ctx.beginPath();
      ctx.moveTo(1700, 300);
      ctx.lineTo(2048, 450);
      ctx.lineTo(2048, 574);
      ctx.lineTo(1700, 724);
      ctx.closePath();
      ctx.fill();

      // Bold Crimson Red Racing Swooshes (#DC0000)
      ctx.fillStyle = '#DC0000';
      ctx.beginPath();
      ctx.moveTo(400, 320);
      ctx.bezierCurveTo(900, 280, 1400, 360, 1800, 480);
      ctx.lineTo(1750, 544);
      ctx.bezierCurveTo(1350, 440, 850, 360, 400, 380);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(400, 644);
      ctx.bezierCurveTo(850, 664, 1350, 584, 1750, 480);
      ctx.lineTo(1800, 544);
      ctx.bezierCurveTo(1400, 664, 900, 744, 400, 704);
      ctx.closePath();
      ctx.fill();

      // Red Bull Sun / Emblem Graphic on Engine Cover
      ctx.fillStyle = '#FCD116';
      ctx.beginPath();
      ctx.arc(700, 512, 110, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#DC0000';
      ctx.beginPath();
      ctx.arc(700, 512, 85, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'ferrari': {
      // Iconic Rosso Corsa Primary Base (#EE0000)
      ctx.fillStyle = '#E8002D';
      ctx.fillRect(0, 0, width, height);

      // Modena Yellow & Italian White Racing Pinstripes
      ctx.fillStyle = '#FFE500';
      ctx.fillRect(200, 360, 1648, 16);
      ctx.fillRect(200, 648, 1648, 16);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(200, 380, 1648, 10);
      ctx.fillRect(200, 634, 1648, 10);

      // Scuderia Shield Background on Shark Fin
      ctx.fillStyle = '#FFE500';
      ctx.beginPath();
      ctx.moveTo(650, 430);
      ctx.lineTo(750, 430);
      ctx.lineTo(750, 540);
      ctx.lineTo(700, 590);
      ctx.lineTo(650, 540);
      ctx.closePath();
      ctx.fill();

      // Italian Tricolore Flag Accent on Nose
      ctx.fillStyle = '#009246';
      ctx.fillRect(1750, 470, 100, 25);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(1750, 495, 100, 25);
      ctx.fillStyle = '#CE2B37';
      ctx.fillRect(1750, 520, 100, 25);
      break;
    }

    case 'mercedes': {
      // High-sheen Silver arrow fading into obsidian carbon black rear
      const grad = ctx.createLinearGradient(0, 512, width, 512);
      grad.addColorStop(0, '#0A0E17');
      grad.addColorStop(0.45, '#1A2233');
      grad.addColorStop(0.75, '#C0C8D8');
      grad.addColorStop(1, '#E8EDF5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Electric Petronas Turquoise Pinstripes (#00A19B)
      ctx.fillStyle = '#00A19B';
      ctx.fillRect(100, 340, 1800, 24);
      ctx.fillRect(100, 660, 1800, 24);
      ctx.fillRect(100, 370, 1800, 8);
      ctx.fillRect(100, 646, 1800, 8);

      // Mercedes Star Crest on Engine Cowl
      ctx.strokeStyle = '#00A19B';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(700, 512, 80, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(700, 435);
      ctx.lineTo(700, 512);
      ctx.lineTo(635, 555);
      ctx.moveTo(700, 512);
      ctx.lineTo(765, 555);
      ctx.stroke();
      break;
    }

    case 'mclaren': {
      // Exposed Anthracite Carbon Base
      ctx.fillStyle = '#10141D';
      ctx.fillRect(0, 0, width, height);

      // Papaya Orange Aerodynamic Panels (#FF8000)
      ctx.fillStyle = '#FF8000';
      ctx.beginPath();
      ctx.moveTo(300, 200);
      ctx.bezierCurveTo(800, 150, 1400, 220, 2048, 380);
      ctx.lineTo(2048, 644);
      ctx.bezierCurveTo(1400, 804, 800, 874, 300, 824);
      ctx.closePath();
      ctx.fill();

      // Anthracite Center Section
      ctx.fillStyle = '#151922';
      ctx.fillRect(500, 440, 1100, 144);

      // Cyan Accent Highlights (#00D2FF)
      ctx.fillStyle = '#00D2FF';
      ctx.fillRect(400, 420, 1200, 12);
      ctx.fillRect(400, 592, 1200, 12);

      // McLaren Speedmark Kiwi Crescent
      ctx.fillStyle = '#FF8000';
      ctx.beginPath();
      ctx.arc(700, 512, 70, -Math.PI / 3, Math.PI / 1.5);
      ctx.lineTo(750, 480);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'aston': {
      // British Racing Metallic Green (#00594F)
      ctx.fillStyle = '#00594F';
      ctx.fillRect(0, 0, width, height);

      // Racing Acid Lime / Yellow Accent Lines (#CEDC00)
      ctx.fillStyle = '#CEDC00';
      ctx.fillRect(100, 310, 1848, 18);
      ctx.fillRect(100, 696, 1848, 18);
      ctx.fillRect(800, 490, 900, 8);
      ctx.fillRect(800, 526, 900, 8);

      // Dark Racing Emerald Inset
      ctx.fillStyle = '#004038';
      ctx.fillRect(400, 340, 1100, 130);
      ctx.fillRect(400, 554, 1100, 130);

      // Winged Emblem on Engine Cover
      ctx.strokeStyle = '#CEDC00';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.ellipse(700, 512, 90, 40, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'alpine': {
      // Carbon Black with Alpine French Blue & BWT Pink
      ctx.fillStyle = '#0E131F';
      ctx.fillRect(0, 0, width, height);

      // Alpine Metallic Blue (#0078D0)
      ctx.fillStyle = '#0078D0';
      ctx.beginPath();
      ctx.moveTo(300, 150);
      ctx.lineTo(1900, 320);
      ctx.lineTo(1900, 512);
      ctx.lineTo(300, 512);
      ctx.closePath();
      ctx.fill();

      // BWT Bubblegum Pink (#FF87BC)
      ctx.fillStyle = '#FF87BC';
      ctx.beginPath();
      ctx.moveTo(300, 512);
      ctx.lineTo(1900, 512);
      ctx.lineTo(1900, 704);
      ctx.lineTo(300, 874);
      ctx.closePath();
      ctx.fill();

      // Alpine "A" Arrow Crest on Shark Fin
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('A', 700, 512);
      break;
    }

    case 'williams': {
      // Heritage Blue (#005AFF) & Deep Navy (#041E42)
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#041E42');
      grad.addColorStop(0.5, '#005AFF');
      grad.addColorStop(1, '#003399');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Bright Cyan Chevron Arrow & Orange Red Accent
      ctx.fillStyle = '#00D2FF';
      ctx.beginPath();
      ctx.moveTo(400, 250);
      ctx.lineTo(1800, 450);
      ctx.lineTo(1800, 574);
      ctx.lineTo(400, 774);
      ctx.lineTo(500, 512);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#E4002B';
      ctx.fillRect(300, 504, 1500, 16);
      break;
    }

    case 'rb': {
      // VCARB Royal Metallic Blue (#1534CC)
      ctx.fillStyle = '#1534CC';
      ctx.fillRect(0, 0, width, height);

      // Crisp White Sidepod Racing Stripes (#FFFFFF)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(200, 340);
      ctx.lineTo(1900, 460);
      ctx.lineTo(1900, 564);
      ctx.lineTo(200, 684);
      ctx.closePath();
      ctx.fill();

      // Red Racing Pinstripes (#D90026)
      ctx.fillStyle = '#D90026';
      ctx.fillRect(200, 492, 1700, 40);
      break;
    }

    case 'sauber': {
      // Raw Carbon Black (#080B10) Base
      ctx.fillStyle = '#080B10';
      ctx.fillRect(0, 0, width, height);

      // Electric Fluorescent Neon Green (#00E701)
      ctx.fillStyle = '#00E701';
      ctx.beginPath();
      ctx.moveTo(300, 200);
      ctx.lineTo(2048, 380);
      ctx.lineTo(1900, 460);
      ctx.lineTo(300, 350);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(300, 824);
      ctx.lineTo(2048, 644);
      ctx.lineTo(1900, 564);
      ctx.lineTo(300, 674);
      ctx.closePath();
      ctx.fill();

      // Neon Green Side Intake Box
      ctx.fillRect(600, 460, 600, 104);
      break;
    }

    case 'haas': {
      // Stealth Carbon & White Sidepod Contrast with Haas Red
      ctx.fillStyle = '#0D1117';
      ctx.fillRect(0, 0, width, height);

      // Crisp White Sidepods
      ctx.fillStyle = '#F0F3F6';
      ctx.beginPath();
      ctx.moveTo(400, 300);
      ctx.lineTo(1800, 420);
      ctx.lineTo(1800, 604);
      ctx.lineTo(400, 724);
      ctx.closePath();
      ctx.fill();

      // Haas Red Racing Stripes (#E6002B)
      ctx.fillStyle = '#E6002B';
      ctx.fillRect(300, 480, 1600, 64);
      break;
    }

    case 'lotus': {
      // Classic John Player Special Piano Gloss Black & Gold (#FFB800)
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, width, height);

      // Royal Gold Triple Pinstripes
      ctx.fillStyle = '#FFB800';
      ctx.fillRect(100, 320, 1848, 14);
      ctx.fillRect(100, 350, 1848, 8);
      ctx.fillRect(100, 656, 1848, 8);
      ctx.fillRect(100, 680, 1848, 14);

      // Gold Roundel Emblem on Shark Fin
      ctx.strokeStyle = '#FFB800';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(700, 512, 90, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#FFB800';
      ctx.font = 'bold 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LOTUS', 700, 512);
      break;
    }

    case 'benetton': {
      // United Colors of Benetton: Cyan Blue, Green & White
      ctx.fillStyle = '#0088CE';
      ctx.fillRect(0, 0, width, 512);
      ctx.fillStyle = '#009E49';
      ctx.fillRect(0, 512, width, 512);

      // White Center Band
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(300, 420);
      ctx.lineTo(1800, 460);
      ctx.lineTo(1800, 564);
      ctx.lineTo(300, 604);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'brawn': {
      // Pure Pearl White (#FFFFFF) Base
      ctx.fillStyle = '#F8F9FA';
      ctx.fillRect(0, 0, width, height);

      // Signature Brawn High-Voltage Fluorescent Neon Lime (#BDFE00)
      ctx.fillStyle = '#BDFE00';
      ctx.beginPath();
      ctx.moveTo(300, 260);
      ctx.lineTo(1900, 400);
      ctx.lineTo(1900, 624);
      ctx.lineTo(300, 764);
      ctx.closePath();
      ctx.fill();

      // Deep Charcoal Black Aero Trim Lines
      ctx.fillStyle = '#11151F';
      ctx.fillRect(200, 480, 1700, 64);
      break;
    }

    default: {
      ctx.fillStyle = team.color || '#00D2FF';
      ctx.fillRect(0, 200, width, 624);
    }
  }

  // Create Three.js Texture with anisotropic filtering
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  liveryTextureCache.set(team.id, texture);
  return texture;
}
