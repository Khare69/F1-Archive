import React from 'react';
import { Html } from '@react-three/drei';
import type { CarHotspot, CarHotspotCategory } from '../../../data/carHotspots';

interface CarHotspotPinsProps {
  hotspots: CarHotspot[];
  selectedHotspotId?: string | null;
  onSelectHotspot: (hotspot: CarHotspot) => void;
}

const CATEGORY_COLORS: Record<CarHotspotCategory, string> = {
  aero: '#38BDF8',
  powertrain: '#EF4444',
  safety: '#F59E0B',
  chassis: '#10B981',
  tyres: '#A855F7',
};

export const CarHotspotPins: React.FC<CarHotspotPinsProps> = ({
  hotspots,
  selectedHotspotId,
  onSelectHotspot,
}) => {
  return (
    <group name="car-hotspot-pins-group">
      {hotspots.map((hotspot) => {
        const isSelected = selectedHotspotId === hotspot.id;
        const color = CATEGORY_COLORS[hotspot.category] || '#38BDF8';

        return (
          <Html
            key={hotspot.id}
            position={hotspot.position}
            center
            distanceFactor={7}
            zIndexRange={[10, 0]}
          >
            <button
              type="button"
              aria-label={`Inspect ${hotspot.label}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectHotspot(hotspot);
              }}
              className="group relative flex items-center justify-center p-2 focus:outline-none"
            >
              {/* Outer pulsing beacon ring */}
              <span
                style={{ borderColor: color }}
                className={`absolute h-6 w-6 rounded-full border opacity-75 animate-ping pointer-events-none ${
                  isSelected ? 'scale-125' : ''
                }`}
              />

              {/* Central pinpoint node */}
              <span
                style={{ backgroundColor: color }}
                className={`relative flex h-3.5 w-3.5 items-center justify-center rounded-full border border-black shadow-lg transition-transform ${
                  isSelected ? 'scale-125 ring-2 ring-white' : 'group-hover:scale-110'
                }`}
              />

              {/* Floating label pill */}
              <span className="pointer-events-none absolute left-6 whitespace-nowrap rounded border border-white/10 bg-[#090B10]/90 px-2 py-0.5 font-mono text-[10px] font-bold text-white opacity-0 shadow-xl backdrop-blur-md transition-opacity group-hover:opacity-100">
                {hotspot.label}
              </span>
            </button>
          </Html>
        );
      })}
    </group>
  );
};
