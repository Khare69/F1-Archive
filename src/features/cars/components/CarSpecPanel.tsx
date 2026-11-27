import React from 'react';
import type { Team } from '../../../types/f1';
import type { CarEraSpec } from '../carEraRegistry';
import { ExperimentalBadge } from '../../../components/ui/ExperimentalBadge';

interface CarSpecPanelProps {
  eraSpec: CarEraSpec;
  selectedTeam: Team;
}

export const CarSpecPanel: React.FC<CarSpecPanelProps> = ({ eraSpec, selectedTeam }) => {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-[#11151E] p-4 text-white shadow-xl">
      {/* Era Header */}
      <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#E10600]">
              // TECHNICAL REGULATION SPECIFICATION
            </span>
            <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-300">
              {eraSpec.yearLabel} ERA
            </span>
          </div>

          {eraSpec.isExperimental && (
            <ExperimentalBadge
              compact
              label="2026 REGULATION SIMULATION"
            />
          )}
        </div>

        <h3 className="font-display text-lg font-bold tracking-wide text-white">
          {eraSpec.title}
        </h3>
        <p className="font-mono text-xs text-[#8494AB]">
          {eraSpec.subtitle}
        </p>
      </div>

      {/* Experimental Disclaimer Banner if active */}
      {eraSpec.isExperimental && (
        <ExperimentalBadge
          label="EXPERIMENTAL // 2026 SIMULATION"
          disclaimer="Active aerodynamics, 50-50 electric power split, and nimble chassis dimensions represent theoretical FIA 2026 technical regulations."
        />
      )}

      {/* Technical Specifications Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
        <div className="rounded border border-white/5 bg-[#181D28] p-2.5">
          <span className="block text-[9px] uppercase tracking-wider text-[#8494AB]">
            ENGINE ARCHITECTURE
          </span>
          <span className="font-bold text-white leading-snug">
            {eraSpec.specs.engine}
          </span>
        </div>

        <div className="rounded border border-white/5 bg-[#181D28] p-2.5">
          <span className="block text-[9px] uppercase tracking-wider text-[#8494AB]">
            MINIMUM WEIGHT
          </span>
          <span className="font-bold text-white">
            {eraSpec.specs.minWeightKg != null
              ? `${eraSpec.specs.minWeightKg} KG`
              : 'N/A (Unregulated)'}
          </span>
        </div>

        <div className="rounded border border-white/5 bg-[#181D28] p-2.5">
          <span className="block text-[9px] uppercase tracking-wider text-[#8494AB]">
            WHEELBASE
          </span>
          <span className="font-bold text-white">
            {eraSpec.specs.wheelbaseMm}
          </span>
        </div>

        <div className="rounded border border-white/5 bg-[#181D28] p-2.5">
          <span className="block text-[9px] uppercase tracking-wider text-[#8494AB]">
            POWER OUTPUT
          </span>
          <span className="font-bold text-[#38BDF8]">
            {eraSpec.specs.powerEstimateHp}
          </span>
        </div>

        <div className="rounded border border-white/5 bg-[#181D28] p-2.5">
          <span className="block text-[9px] uppercase tracking-wider text-[#8494AB]">
            HALO SAFETY CELL
          </span>
          <span className="font-bold text-white">
            {eraSpec.hasHalo ? 'Titanium Grade 5' : 'None (Pre-2018)'}
          </span>
        </div>

        <div className="rounded border border-white/5 bg-[#181D28] p-2.5">
          <span className="block text-[9px] uppercase tracking-wider text-[#8494AB]">
            AERO WINGS
          </span>
          <span className="font-bold text-white">
            {eraSpec.hasWings ? 'Front & Rear Wings' : 'None (Cigar Fuselage)'}
          </span>
        </div>
      </div>

      {/* Aerodynamic Concept Note */}
      <div className="rounded border border-white/5 bg-[#181D28] p-3 font-mono text-xs">
        <span className="block text-[10px] uppercase tracking-wider text-[#8494AB] mb-1">
          AERODYNAMIC CONCEPT
        </span>
        <p className="text-slate-200">
          {eraSpec.specs.aeroConcept}
        </p>
      </div>

      {/* Plain English Summary */}
      <div className="rounded border border-white/5 bg-[#181D28]/60 p-3 text-xs leading-relaxed text-slate-300">
        <span className="block font-mono text-[10px] uppercase tracking-wider text-[#8494AB] mb-1">
          ERA SUMMARY // PLAIN ENGLISH
        </span>
        <p>{eraSpec.summaryPlainEnglish}</p>
      </div>

      {/* Active Team Livery Note */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3 font-mono text-xs text-[#8494AB]">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: selectedTeam.color }}
          />
          <span className="text-white font-bold">{selectedTeam.name}</span>
          <span>({selectedTeam.carName})</span>
        </div>
        <span className="text-[10px] text-neutral-500 uppercase">
          {selectedTeam.base}
        </span>
      </div>
    </div>
  );
};
