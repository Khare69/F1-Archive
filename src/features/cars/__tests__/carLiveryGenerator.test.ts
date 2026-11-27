import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  createCarbonWeaveTexture,
  getTeamLiveryTextures,
  getTeamLiveryTexture,
} from '../carLiveryGenerator';

describe('carLiveryGenerator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('createCarbonWeaveTexture', () => {
    it('returns texture with dispose method or safe fallback in JSDOM', () => {
      const result = createCarbonWeaveTexture(256);
      expect(result).toBeDefined();
      expect(typeof result.dispose).toBe('function');
      // Execute disposal without throwing
      expect(() => result.dispose()).not.toThrow();
    });

    it('returns null texture and safe dispose when 2D canvas context is unavailable', () => {
      const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

      const result = createCarbonWeaveTexture(128);
      expect(result.texture).toBeNull();
      expect(() => result.dispose()).not.toThrow();

      getContextSpy.mockRestore();
    });
  });

  describe('getTeamLiveryTextures', () => {
    it('generates textures for canonical teams and cleans up via dispose()', () => {
      const fakeCtx = {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        font: '',
        textAlign: '',
        textBaseline: '',
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fillText: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      const getContextSpy = vi
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(fakeCtx);

      const result = getTeamLiveryTextures('ferrari', { raceNumber: 16 });

      expect(result.liveryMap).toBeInstanceOf(THREE.CanvasTexture);
      expect(result.carbonRoughnessMap).toBeInstanceOf(THREE.CanvasTexture);
      expect(typeof result.dispose).toBe('function');

      // Verify canvas drawing calls occurred
      expect(fakeCtx.fillRect).toHaveBeenCalled();
      expect(fakeCtx.fillText).toHaveBeenCalledWith('16', expect.any(Number), expect.any(Number));
      expect(fakeCtx.fillText).toHaveBeenCalledWith('SF', expect.any(Number), expect.any(Number));

      // Verify disposal cleans up both textures
      const liveryDisposeSpy = vi.spyOn(result.liveryMap!, 'dispose');
      const carbonDisposeSpy = vi.spyOn(result.carbonRoughnessMap!, 'dispose');

      result.dispose();
      expect(liveryDisposeSpy).toHaveBeenCalled();
      expect(carbonDisposeSpy).toHaveBeenCalled();

      getContextSpy.mockRestore();
    });

    it('handles legacy team object input and alias resolution', () => {
      const fakeCtx = {
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fillText: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx);

      const teamObj = {
        id: 'mclaren',
        name: 'McLaren',
        color: '#FF8000',
      };

      const result = getTeamLiveryTextures(teamObj);
      expect(result.liveryMap).toBeInstanceOf(THREE.CanvasTexture);
      expect(fakeCtx.fillText).toHaveBeenCalledWith('MCL', expect.any(Number), expect.any(Number));

      result.dispose();
    });

    it('falls back safely to null textures when getContext returns null (JSDOM environment)', () => {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

      const result = getTeamLiveryTextures('redbull');
      expect(result.liveryMap).toBeNull();
      expect(result.carbonRoughnessMap).toBeNull();
      expect(() => result.dispose()).not.toThrow();

      const compatResult = getTeamLiveryTexture({ id: 'redbull', color: '#0600EF' } as any);
      expect(compatResult).toBeNull();
    });
  });

  describe('Trademark Safety Audits', () => {
    it('source code contains zero trademarked crest descriptions or brand emblems', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const source = fs.readFileSync(
        path.resolve(__dirname, '../carLiveryGenerator.ts'),
        'utf8'
      );

      // Verify trademarked brand logo outlines are absent
      expect(source.toLowerCase()).not.toContain('mercedes star');
      expect(source.toLowerCase()).not.toContain('mclaren speedmark');
      expect(source.toLowerCase()).not.toContain('winged emblem');
      expect(source.toLowerCase()).not.toContain('prancing horse');
      expect(source.toLowerCase()).not.toContain('cavallino');
    });
  });
});
