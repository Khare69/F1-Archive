import { describe, it, expect, vi } from 'vitest';
import { exportPosterAsPng } from './posterExport';

describe('High-DPI Poster Export Utility', () => {
  it('creates canvas and triggers direct PNG file download without throwing', async () => {
    // Mock canvas context
    const mockContext = {
      scale: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      })),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn()
    };

    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as unknown as CanvasRenderingContext2D);
    const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback: BlobCallback) => {
      const mockBlob = new Blob(['fake-png-data'], { type: 'image/png' });
      callback(mockBlob);
    });

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/fake-poster');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    await exportPosterAsPng({
      title: 'DRIVER HEAD-TO-HEAD',
      subtitle: 'VERSTAPPEN VS HAMILTON',
      rows: [
        { label: 'WINS', value: 'VER 61 - HAM 105', color: '#00D2FF' },
        { label: 'POLES', value: 'VER 40 - HAM 104', color: '#FFD700' }
      ]
    });

    expect(getContextSpy).toHaveBeenCalledWith('2d');
    expect(toBlobSpy).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();

    getContextSpy.mockRestore();
    toBlobSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });
});
