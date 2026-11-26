import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { CircuitsArchive } from '../CircuitsArchive';
import { fetchCircuitGeometry } from '../circuitGeometryClient';

// Mock Track3DViewer in JSDOM component tests to keep unit tests fast and isolate UI logic from WebGL
vi.mock('../Track3DViewer', () => ({
  Track3DViewer: ({ circuitName }: { circuitName?: string }) => (
    <div data-testid="mock-track-3d-viewer">
      Track3DViewer: {circuitName}
    </div>
  )
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

const renderCircuitsArchive = (initialPath = '/circuits/monza') => {
  const queryClient = createTestQueryClient();
  const search = initialPath.includes('?') ? initialPath.slice(initialPath.indexOf('?')) : '';

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <NuqsTestingAdapter searchParams={search} hasMemory>
          <Routes>
            <Route path="/circuits" element={<CircuitsArchive />} />
            <Route path="/circuits/:circuitId" element={<CircuitsArchive />} />
          </Routes>
        </NuqsTestingAdapter>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('CircuitsArchive & circuitGeometryClient (P5-FIX-02, P5-DEV-04)', () => {
  describe('circuitGeometryClient', () => {
    it('fetches and validates real Spa-Francorchamps geometry with SRTM elevation', async () => {
      const data = await fetchCircuitGeometry('spa-francorchamps');

      expect(data.circuitId).toBe('spa-francorchamps');
      expect(data.geometrySource).toBe('geojson');
      expect(data.elevationSource).toBe('open-meteo-srtm');
      expect(data.elevationDeltaM).toBe(103);
      expect(data.coordinates.length).toBeGreaterThan(50);

      // Verify coordinate tuple format [x, y, z]
      const firstCoord = data.coordinates[0];
      expect(firstCoord).toBeDefined();
      expect(firstCoord?.length).toBe(3);
      expect(typeof firstCoord?.[0]).toBe('number');
      expect(typeof firstCoord?.[1]).toBe('number');
      expect(typeof firstCoord?.[2]).toBe('number');
    });

    it('fetches and validates real Monza geometry with > 50 coordinates', async () => {
      const data = await fetchCircuitGeometry('monza');

      expect(data.circuitId).toBe('monza');
      expect(data.geometrySource).toBe('geojson');
      expect(data.elevationSource).toBe('open-meteo-srtm');
      expect(data.elevationDeltaM).toBe(24);
      expect(data.coordinates.length).toBeGreaterThan(50);
    });

    it('throws when fetching unknown circuit ID', async () => {
      await expect(fetchCircuitGeometry('nonexistent-track-xyz')).rejects.toThrow();
    });
  });

  describe('CircuitsArchive Component Route Sync & 65/35 Split Layout', () => {
    it('renders Monza details and reacts to /circuits/monza route param', async () => {
      renderCircuitsArchive('/circuits/monza');

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /Select Grand Prix Circuit/i })).toHaveValue('monza');
      });

      expect(screen.getByText(/CIRCUIT LENGTH/i)).toBeInTheDocument();
      expect(screen.getByText(/5\.793\s*km/i)).toBeInTheDocument();
      expect(screen.getByText(/PERMANENT TRACK/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Variante del Rettifilo/i).length).toBeGreaterThan(0);
    });

    it('renders Spa-Francorchamps details when navigating to /circuits/spa-francorchamps', async () => {
      renderCircuitsArchive('/circuits/spa-francorchamps');

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /Select Grand Prix Circuit/i })).toHaveValue('spa-francorchamps');
      });

      expect(screen.getByText(/7\.004\s*km/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Eau Rouge \/ Raidillon/i).length).toBeGreaterThan(0);
    });

    it('switches between Past Winners and Layout Eras tabs', async () => {
      renderCircuitsArchive('/circuits/spa-francorchamps');

      const erasTab = screen.getByRole('button', { name: /LAYOUT ERAS/i });
      fireEvent.click(erasTab);

      // Verify layout eras tab switches cleanly
      expect(screen.getByText(/Single historical layout configuration/i)).toBeInTheDocument();

      const winnersTab = screen.getByRole('button', { name: /PAST WINNERS/i });
      fireEvent.click(winnersTab);

      expect(screen.getByRole('table', { name: /Recent winners/i })).toBeInTheDocument();
    });

    it('hydrates nuqs query params (?view=2d&color=elevation&corner=3) cleanly without throwing', async () => {
      renderCircuitsArchive('/circuits/spa-francorchamps?view=2d&color=elevation&corner=3');

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /Select Grand Prix Circuit/i })).toHaveValue('spa-francorchamps');
      });

      expect(screen.getAllByText(/Eau Rouge \/ Raidillon/i).length).toBeGreaterThan(0);
    });

    it('safely renders N/A for null optional fields without emitting null or NaN text', async () => {
      renderCircuitsArchive('/circuits/aintree');

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /Select Grand Prix Circuit/i })).toHaveValue('aintree');
      });

      const containerText = document.body.textContent || '';
      expect(containerText).not.toContain('null km');
      expect(containerText).not.toContain('NaN');
    });
  });
});
