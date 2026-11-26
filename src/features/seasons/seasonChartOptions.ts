import type { ECOption } from '../../components/charts/echartsCore';
import { F1_CHART_THEME } from '../../components/charts/f1ChartTheme';
import { getTeamById } from '../../data/dataService';
import type { RoundStandingsProgression, SeasonRoundClassification } from '../../types/f1';

export interface DriverProgressionMeta {
  driverId: string;
  driverCode: string;
  driverName: string;
  constructorId: string;
  teamColor: string;
  finalPosition: number;
  finalPoints: number;
}

const FALLBACK_PALETTE = [
  '#00D2FF', '#FF1E1E', '#FF8000', '#229971', '#0093CC',
  '#FFD700', '#B6BABD', '#6692FF', '#900000', '#E8002D',
];

/**
 * Extracts and ranks unique drivers from the season standings progression.
 */
export function extractSeasonDrivers(
  standingsProgression: RoundStandingsProgression[]
): DriverProgressionMeta[] {
  if (!standingsProgression || standingsProgression.length === 0) return [];

  const finalRound = standingsProgression[standingsProgression.length - 1];
  const driverMap = new Map<string, DriverProgressionMeta>();

  // Collect final round positions first
  if (finalRound?.standings) {
    for (const d of finalRound.standings) {
      const team = getTeamById(d.constructorId);
      const teamColor = team?.color || FALLBACK_PALETTE[driverMap.size % FALLBACK_PALETTE.length];
      driverMap.set(d.driverId, {
        driverId: d.driverId,
        driverCode: d.driverCode || d.driverName.slice(0, 3).toUpperCase(),
        driverName: d.driverName,
        constructorId: d.constructorId,
        teamColor,
        finalPosition: d.position,
        finalPoints: d.points,
      });
    }
  }

  // Also collect any driver present in earlier rounds if not in final round
  for (const round of standingsProgression) {
    for (const d of round.standings) {
      if (!driverMap.has(d.driverId)) {
        const team = getTeamById(d.constructorId);
        const teamColor = team?.color || FALLBACK_PALETTE[driverMap.size % FALLBACK_PALETTE.length];
        driverMap.set(d.driverId, {
          driverId: d.driverId,
          driverCode: d.driverCode || d.driverName.slice(0, 3).toUpperCase(),
          driverName: d.driverName,
          constructorId: d.constructorId,
          teamColor,
          finalPosition: d.position || 99,
          finalPoints: d.points || 0,
        });
      }
    }
  }

  return Array.from(driverMap.values()).sort((a, b) => {
    if (a.finalPosition !== b.finalPosition) return a.finalPosition - b.finalPosition;
    return b.finalPoints - a.finalPoints;
  });
}

/**
 * Builds ECharts options adhering strictly to I-04 Focus-Plus-Context guidelines:
 * - Direct end-of-line labels for focused drivers ({a} driver code)
 * - Muted context lines (rgba(148, 163, 184, 0.15)) for unfocused drivers
 * - No cluttered legend boxes
 * - Dark matte telemetry theme styling
 */
export function buildFocusPlusContextSeasonOptions(
  standingsProgression: RoundStandingsProgression[],
  focusedDriverIds: string[] = [],
  rounds?: SeasonRoundClassification[]
): ECOption {
  if (!standingsProgression || standingsProgression.length === 0) {
    return {
      title: {
        text: '// NO PROGRESSION DATA AVAILABLE',
        left: 'center',
        top: 'middle',
        textStyle: {
          color: F1_CHART_THEME.axisLabel,
          fontFamily: F1_CHART_THEME.fontMono,
          fontSize: 12,
        },
      },
    };
  }

  const allDrivers = extractSeasonDrivers(standingsProgression);

  // If focusedDriverIds is empty, default to top 3 championship finishers
  const activeFocus =
    focusedDriverIds.length > 0
      ? focusedDriverIds.slice(0, 4)
      : allDrivers.slice(0, 3).map((d) => d.driverId);

  const focusSet = new Set(activeFocus);

  // X-axis categories (Rounds: R1, R2, etc. or circuit/round names)
  const roundCategories = standingsProgression.map((prog, idx) => {
    if (rounds && rounds[idx]) {
      const r = rounds[idx];
      return `R${r.round} ${r.name ? r.name.replace(/(Grand Prix|GP)/i, '').trim() : ''}`.trim();
    }
    return `R${prog.round}`;
  });

  // Calculate cumulative trajectory series for each driver
  const series = allDrivers.map((driver) => {
    const isFocused = focusSet.has(driver.driverId);

    const data: number[] = [];
    let lastKnownPts = 0;

    for (const prog of standingsProgression) {
      const match = prog.standings.find((s) => s.driverId === driver.driverId);
      if (match) {
        lastKnownPts = match.points;
      }
      data.push(lastKnownPts);
    }

    if (isFocused) {
      return {
        name: driver.driverCode,
        type: 'line' as const,
        data,
        z: 10,
        showSymbol: true,
        symbolSize: 4,
        lineStyle: {
          color: driver.teamColor,
          width: 2.2,
        },
        itemStyle: {
          color: driver.teamColor,
        },
        endLabel: {
          show: true,
          formatter: '{a}',
          color: driver.teamColor,
          fontFamily: F1_CHART_THEME.fontMono,
          fontSize: 11,
          fontWeight: 600,
          offset: [8, 0],
        },
      };
    }

    return {
      name: driver.driverCode,
      type: 'line' as const,
      data,
      z: 1,
      showSymbol: false,
      lineStyle: {
        color: F1_CHART_THEME.mutedContext, // 'rgba(148, 163, 184, 0.15)'
        width: 1,
      },
      itemStyle: {
        color: F1_CHART_THEME.mutedContext,
      },
      endLabel: {
        show: false,
      },
    };
  });

  return {
    backgroundColor: 'transparent',
    grid: {
      left: 45,
      right: 76,
      top: 24,
      bottom: 30,
      containLabel: true,
    },
    legend: {
      show: false, // Strict I-04 requirement: direct end-of-line labels replace legends
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: F1_CHART_THEME.elevated,
      borderColor: F1_CHART_THEME.border,
      textStyle: {
        color: F1_CHART_THEME.primaryText,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 12,
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: F1_CHART_THEME.crosshair,
          width: 1,
          type: 'dashed',
        },
      },
      formatter: (params: unknown) => {
        if (!Array.isArray(params) || params.length === 0) return '';
        const first = params[0] as { axisValueLabel?: string };
        const title = `<div style="font-weight:700;margin-bottom:4px;color:#F4F6FA;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:2px;">${first.axisValueLabel || 'Round'}</div>`;

        // Sort tooltip by points descending
        const sorted = (params as Array<{ seriesName: string; value: number; color: string }>)
          .slice()
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

        // Show focused drivers first or top 5
        const rows = sorted.slice(0, 6).map((p) => {
          return `<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;line-height:1.5;">
            <span style="color:${p.color};font-weight:600;">● ${p.seriesName}</span>
            <span style="font-family:'JetBrains Mono Variable',monospace;color:#F4F6FA;">${p.value} pts</span>
          </div>`;
        });

        return title + rows.join('');
      },
    },
    xAxis: {
      type: 'category',
      data: roundCategories,
      boundaryGap: false,
      axisLine: {
        lineStyle: { color: F1_CHART_THEME.border },
      },
      axisTick: {
        lineStyle: { color: F1_CHART_THEME.border },
      },
      axisLabel: {
        color: F1_CHART_THEME.axisLabel,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      name: 'PTS',
      nameTextStyle: {
        color: F1_CHART_THEME.axisLabel,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 10,
        align: 'left',
      },
      splitLine: {
        lineStyle: { color: F1_CHART_THEME.gridLine },
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: F1_CHART_THEME.axisLabel,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 10,
      },
    },
    series,
  };
}
