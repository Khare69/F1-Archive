import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import type { LiveDriverStanding, LiveConstructorStanding } from '../../types/f1';
import { getTeamById, getDriverById } from '../../data/dataService';
import { TelemetryDataTable } from '../../components/ui/TelemetryDataTable';

interface DriversTableProps {
  type: 'wdc';
  standings: LiveDriverStanding[];
  maxPoints: number;
}

interface ConstructorsTableProps {
  type: 'wcc';
  standings: LiveConstructorStanding[];
  maxPoints: number;
}

type StandingsTableProps = DriversTableProps | ConstructorsTableProps;

export const StandingsTable: React.FC<StandingsTableProps> = (props) => {
  if (props.type === 'wdc') {
    const { standings, maxPoints } = props;

    const columns: ColumnDef<LiveDriverStanding, any>[] = useMemo(
      () => [
        {
          accessorKey: 'position',
          header: 'POS',
          size: 70,
          cell: (info) => {
            const pos = Number(info.getValue());
            const badgeColor =
              pos === 1 ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' :
              pos === 2 ? 'text-slate-200 bg-slate-300/10 border-slate-300/30' :
              pos === 3 ? 'text-amber-600 bg-amber-600/10 border-amber-600/30' :
              'text-slate-400 bg-slate-900 border-white/5';

            return (
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-telemetry font-bold border ${badgeColor}`}>
                P{pos}
              </span>
            );
          },
        },
        {
          accessorKey: 'driverName',
          header: 'PILOT & CONSTRUCTOR',
          cell: (info) => {
            const driver = info.row.original;
            const localTeam = getTeamById(driver.constructorId);
            const teamColor = localTeam?.color || '#00D2FF';
            const localDriver = getDriverById(driver.driverCode);

            return (
              <div className="flex flex-col">
                <span className="font-bold text-slate-100 text-sm">
                  {localDriver ? (
                    <Link to={`/drivers/${localDriver.id}`} className="hover:text-cyan-400 transition-colors">
                      {driver.driverName}
                    </Link>
                  ) : (
                    driver.driverName
                  )}
                </span>
                <span className="font-telemetry text-[11px] font-semibold tracking-wider uppercase" style={{ color: teamColor }}>
                  {driver.constructorName}
                </span>
              </div>
            );
          },
        },
        {
          accessorKey: 'wins',
          header: 'WINS',
          size: 90,
          cell: (info) => {
            const wins = Number(info.getValue());
            return (
              <span className="font-telemetry font-bold text-xs text-slate-300">
                {wins > 0 ? `${wins} W` : '—'}
              </span>
            );
          },
        },
        {
          id: 'pointsShare',
          header: 'POINTS SHARE',
          cell: (info) => {
            const driver = info.row.original;
            const localTeam = getTeamById(driver.constructorId);
            const teamColor = localTeam?.color || '#00D2FF';
            const pct = Math.min(100, Math.max(0, (driver.points / Math.max(maxPoints, 1)) * 100));

            return (
              <div className="w-full max-w-[140px] bg-slate-950/60 rounded h-1.5 overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: teamColor }}
                />
              </div>
            );
          },
        },
        {
          accessorKey: 'points',
          header: 'PTS',
          size: 90,
          cell: (info) => (
            <span className="font-telemetry font-black text-sm text-slate-100 tabular-nums">
              {Number(info.getValue())}
            </span>
          ),
        },
      ],
      [maxPoints]
    );

    return (
      <TelemetryDataTable
        data={standings}
        columns={columns}
        getRowTeamColor={(d) => getTeamById(d.constructorId)?.color || '#00D2FF'}
        maxHeightPx={600}
        emptyMessage="NO DRIVER STANDINGS DATA CURRENTLY AVAILABLE FOR THIS ROUND."
        ariaLabel="Drivers World Championship Standings"
      />
    );
  }

  // Constructors (WCC)
  const { standings, maxPoints } = props;

  const constructorColumns: ColumnDef<LiveConstructorStanding, any>[] = useMemo(
    () => [
      {
        accessorKey: 'position',
        header: 'POS',
        size: 70,
        cell: (info) => {
          const pos = Number(info.getValue());
          const badgeColor =
            pos === 1 ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' :
            pos === 2 ? 'text-slate-200 bg-slate-300/10 border-slate-300/30' :
            pos === 3 ? 'text-amber-600 bg-amber-600/10 border-amber-600/30' :
            'text-slate-400 bg-slate-900 border-white/5';

          return (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-telemetry font-bold border ${badgeColor}`}>
              P{pos}
            </span>
          );
        },
      },
      {
        accessorKey: 'constructorName',
        header: 'CONSTRUCTOR',
        cell: (info) => {
          const team = info.row.original;
          const localTeam = getTeamById(team.constructorId);
          const teamColor = localTeam?.color || '#00D2FF';

          return (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-tight">
                {localTeam ? (
                  <Link to={`/teams/${localTeam.id}`} className="hover:text-cyan-400 transition-colors">
                    {team.constructorName}
                  </Link>
                ) : (
                  team.constructorName
                )}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'wins',
        header: 'WINS',
        size: 90,
        cell: (info) => {
          const wins = Number(info.getValue());
          return (
            <span className="font-telemetry font-bold text-xs text-slate-300">
              {wins > 0 ? `${wins} W` : '—'}
            </span>
          );
        },
      },
      {
        id: 'progress',
        header: 'PROGRESS',
        cell: (info) => {
          const team = info.row.original;
          const localTeam = getTeamById(team.constructorId);
          const teamColor = localTeam?.color || '#00D2FF';
          const pct = Math.min(100, Math.max(0, (team.points / Math.max(maxPoints, 1)) * 100));

          return (
            <div className="w-full max-w-[140px] bg-slate-950/60 rounded h-1.5 overflow-hidden">
              <div
                className="h-full rounded transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: teamColor }}
              />
            </div>
          );
        },
      },
      {
        accessorKey: 'points',
        header: 'PTS',
        size: 90,
        cell: (info) => (
          <span className="font-telemetry font-black text-sm text-slate-100 tabular-nums">
            {Number(info.getValue())}
          </span>
        ),
      },
    ],
    [maxPoints]
  );

  return (
    <TelemetryDataTable
      data={standings}
      columns={constructorColumns}
      getRowTeamColor={(t) => getTeamById(t.constructorId)?.color || '#00D2FF'}
      maxHeightPx={600}
      emptyMessage="NO CONSTRUCTOR STANDINGS DATA CURRENTLY AVAILABLE FOR THIS ROUND."
      ariaLabel="Constructors World Championship Standings"
    />
  );
};
