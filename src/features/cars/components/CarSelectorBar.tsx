import React from 'react';
import type { Team } from '../../../types/f1';
import { CAR_ERA_SPECS, type CarEraId } from '../carEraRegistry';
import { ExperimentalBadge } from '../../../components/ui/ExperimentalBadge';

interface CarSelectorBarProps {
  currentEra: CarEraId;
  selectedTeam: Team;
  teams: Team[];
  onSelectEra: (eraId: CarEraId) => void;
  onSelectTeam: (teamId: string) => void;
}

export const CarSelectorBar: React.FC<CarSelectorBarProps> = ({
  currentEra,
  selectedTeam,
  teams,
  onSelectEra,
  onSelectTeam,
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#11151E] p-4 text-white shadow-xl">
      {/* Era Selection Row */}
      <div className="flex flex-col gap-1.5 border-b border-white/5 pb-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#8494AB]">
            SELECT TECHNICAL ERA (1950–2026):
          </span>
          <span className="font-mono text-[10px] text-emerald-400">
            5 DISTINCT HISTORIC CHASSIS
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CAR_ERA_SPECS.map((era) => {
            const isSelected = era.id === currentEra;
            return (
              <button
                key={era.id}
                type="button"
                onClick={() => onSelectEra(era.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded px-3 py-1.5 font-mono text-xs transition-all ${
                  isSelected
                    ? 'bg-white/15 text-white font-bold ring-1 ring-white/30'
                    : 'bg-white/[0.03] text-[#8494AB] hover:bg-white/[0.08] hover:text-white border border-white/5'
                }`}
                aria-pressed={isSelected}
              >
                <span>{era.yearLabel}</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  {era.title.split(' ')[0]}
                </span>
                {era.isExperimental && <ExperimentalBadge compact />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Constructor Team Selection Row */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#8494AB]">
            SELECT CONSTRUCTOR LIVERY:
          </span>
          <span className="font-mono text-[10px] text-neutral-400">
            {selectedTeam.carName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {teams.map((t) => {
            const isSelected = t.id === selectedTeam.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTeam(t.id)}
                aria-label={`Select ${t.name}`}
                className={`flex items-center gap-2 whitespace-nowrap rounded px-2.5 py-1 font-mono text-xs transition-all ${
                  isSelected
                    ? 'bg-white/15 text-white font-bold ring-1 ring-white/30'
                    : 'bg-white/[0.02] text-[#8494AB] hover:bg-white/[0.06] hover:text-white border border-white/5'
                }`}
                aria-pressed={isSelected}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: t.color,
                    boxShadow: isSelected ? `0 0 8px ${t.color}` : undefined,
                  }}
                />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
