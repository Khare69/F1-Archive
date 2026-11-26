import { z } from 'zod';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export const CircuitGeometryPayloadSchema = z.object({
  circuitId: z.string(),
  geometrySource: z.enum(['geojson', 'procedural']).default('geojson'),
  coordinates: z.array(z.tuple([z.number(), z.number(), z.number()])),
  elevationMinM: z.number().nullable(),
  elevationMaxM: z.number().nullable(),
  elevationDeltaM: z.number().nullable(),
  elevationSource: z.enum(['open-meteo-srtm', 'unavailable']).default('unavailable'),
  trackSpanMeters: z.number().nullable().optional()
});

export type CircuitGeometryPayload = z.infer<typeof CircuitGeometryPayloadSchema>;

function getOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }
  return 'http://localhost';
}

export async function fetchCircuitGeometry(circuitId: string): Promise<CircuitGeometryPayload> {
  const origin = getOrigin();
  const url = `${origin}/data/circuits/${encodeURIComponent(circuitId)}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load circuit geometry for ${circuitId}: ${response.status} ${response.statusText}`);
  }
  const raw = await response.json();

  // Infer elevationSource based on presence of real SRTM elevation numbers
  const hasRealElevation =
    (raw.elevationMinM != null && raw.elevationMaxM != null) ||
    (raw.elevationDeltaM != null && raw.elevationDeltaM > 0);

  const rawPayload = {
    ...raw,
    geometrySource: raw.geometrySource || 'geojson',
    elevationSource: raw.elevationSource || (hasRealElevation ? 'open-meteo-srtm' : 'unavailable')
  };

  return CircuitGeometryPayloadSchema.parse(rawPayload);
}

export function useCircuitGeometry(circuitId: string | null | undefined): UseQueryResult<CircuitGeometryPayload> {
  return useQuery({
    queryKey: ['circuit-geometry', circuitId],
    queryFn: () => {
      if (!circuitId) {
        throw new Error('Circuit ID is required');
      }
      return fetchCircuitGeometry(circuitId);
    },
    enabled: Boolean(circuitId),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 // 1 hour
  });
}
