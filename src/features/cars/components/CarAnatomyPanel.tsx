import React, { useState } from 'react';
import { X, Sparkles, Cpu } from 'lucide-react';
import type { CarHotspot, CarHotspotCategory } from '../../../data/carHotspots';

interface CarAnatomyPanelProps {
  hotspot: CarHotspot;
  onClose: () => void;
}

const CATEGORY_METADATA: Record<
  CarHotspotCategory,
  { label: string; badgeColor: string; borderColor: string }
> = {
  aero: {
    label: 'AERODYNAMICS',
    badgeColor: 'bg-cyan-500/10 text-cyan-400',
    borderColor: 'border-cyan-500/30',
  },
  powertrain: {
    label: 'POWER UNIT',
    badgeColor: 'bg-red-500/10 text-red-400',
    borderColor: 'border-red-500/30',
  },
  safety: {
    label: 'SAFETY CELL',
    badgeColor: 'bg-amber-500/10 text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  chassis: {
    label: 'CHASSIS MONOCOQUE',
    badgeColor: 'bg-emerald-500/10 text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  tyres: {
    label: 'TYRES & BRAKES',
    badgeColor: 'bg-purple-500/10 text-purple-400',
    borderColor: 'border-purple-500/30',
  },
};

export const CarAnatomyPanel: React.FC<CarAnatomyPanelProps> = ({ hotspot, onClose }) => {
  const [activeTab, setActiveTab] = useState<'plain' | 'spec'>('plain');
  const meta = CATEGORY_METADATA[hotspot.category];

  return (
    <div
      role="region"
      aria-label={`Anatomy Inspector: ${hotspot.label}`}
      className={`relative flex flex-col gap-3 rounded-lg border ${meta.borderColor} bg-[#11151E]/95 p-4 text-white shadow-2xl backdrop-blur-md`}
    >
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded border border-white/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${meta.badgeColor}`}
            >
              // {meta.label}
            </span>
          </div>
          <h4 className="font-display text-base font-bold tracking-wide text-white">
            {hotspot.label}
          </h4>
        </div>

        <button
          type="button"
          aria-label="Close anatomy panel"
          onClick={onClose}
          className="rounded p-1 text-[#8494AB] hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 font-mono text-xs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'plain'}
          onClick={() => setActiveTab('plain')}
          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 transition-all ${
            activeTab === 'plain'
              ? 'bg-white/10 text-white font-bold'
              : 'text-[#8494AB] hover:text-white'
          }`}
        >
          <Sparkles className="h-3 w-3 text-cyan-400" />
          <span>PLAIN ENGLISH</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'spec'}
          onClick={() => setActiveTab('spec')}
          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 transition-all ${
            activeTab === 'spec'
              ? 'bg-white/10 text-white font-bold'
              : 'text-[#8494AB] hover:text-white'
          }`}
        >
          <Cpu className="h-3 w-3 text-amber-400" />
          <span>TECHNICAL SPEC</span>
        </button>
      </div>

      {/* Tab Panel Content */}
      <div className="text-xs leading-relaxed text-slate-200">
        {activeTab === 'plain' ? (
          <p className="font-sans text-slate-300">{hotspot.plainEnglish}</p>
        ) : (
          <p className="font-mono text-slate-300">{hotspot.technicalSpec}</p>
        )}
      </div>
    </div>
  );
};
