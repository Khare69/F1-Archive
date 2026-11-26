import type { ECOption } from '../../components/charts/echartsCore';
import { F1_CHART_THEME } from '../../components/charts/f1ChartTheme';
import type { StrategySimulationResult } from './strategyMath';

/**
 * 1. Lap-by-Lap Stint Pace Chart (ECharts Line Series with Pit-Stop Markers)
 */
export function buildStintPaceOptions(result: StrategySimulationResult): ECOption {
  if (!result || !result.strategies || result.strategies.length === 0) {
    return {
      title: {
        text: '// NO SIMULATION RESULTS',
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

  const maxLaps = Math.max(...result.strategies.map((s) => s.lapByLapPaceSec.length), 1);
  const lapCategories = Array.from({ length: maxLaps }, (_, i) => `L${i + 1}`);

  const series = result.strategies.map((strat) => {
    return {
      name: strat.name,
      type: 'line' as const,
      data: strat.lapByLapPaceSec,
      smooth: true,
      showSymbol: false,
      lineStyle: {
        color: strat.color,
        width: 2.2,
      },
      itemStyle: {
        color: strat.color,
      },
    };
  });

  return {
    backgroundColor: 'transparent',
    grid: {
      left: 45,
      right: 25,
      top: 30,
      bottom: 25,
      containLabel: true,
    },
    legend: {
      show: true,
      top: 0,
      right: 10,
      textStyle: {
        color: F1_CHART_THEME.primaryText,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 11,
      },
      icon: 'circle',
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: F1_CHART_THEME.elevated,
      borderColor: F1_CHART_THEME.border,
      textStyle: {
        color: F1_CHART_THEME.primaryText,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 11,
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
        const title = `<div style="font-weight:700;margin-bottom:4px;color:#F4F6FA;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:2px;">Lap ${first.axisValueLabel || ''}</div>`;
        const rows = (params as Array<{ seriesName: string; value: number; color: string }>).map((p) => {
          return `<div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;line-height:1.5;">
            <span style="color:${p.color};font-weight:600;">● ${p.seriesName}</span>
            <span style="font-family:'JetBrains Mono Variable',monospace;color:#F4F6FA;">${Number(p.value).toFixed(3)}s</span>
          </div>`;
        });
        return title + rows.join('');
      },
    },
    xAxis: {
      type: 'category',
      data: lapCategories,
      boundaryGap: false,
      axisLine: { lineStyle: { color: F1_CHART_THEME.border } },
      axisTick: { lineStyle: { color: F1_CHART_THEME.border } },
      axisLabel: {
        color: F1_CHART_THEME.axisLabel,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 10,
        interval: Math.max(1, Math.floor(maxLaps / 10)),
      },
    },
    yAxis: {
      type: 'value',
      name: 'LAP SEC',
      nameTextStyle: {
        color: F1_CHART_THEME.axisLabel,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 10,
        align: 'left',
      },
      scale: true,
      splitLine: { lineStyle: { color: F1_CHART_THEME.gridLine } },
      axisLabel: {
        color: F1_CHART_THEME.axisLabel,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 10,
        formatter: (val: number) => `${val.toFixed(1)}s`,
      },
    },
    series,
  };
}

/**
 * 2. Monte Carlo Probability Distribution Chart (Win Rates & Time Percentiles)
 */
export function buildMonteCarloDistributionOptions(result: StrategySimulationResult): ECOption {
  if (!result || !result.strategies || result.strategies.length === 0) {
    return {
      title: {
        text: '// NO MONTE CARLO DISTRIBUTION',
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

  const names = result.strategies.map((s) => s.name);
  const winRates = result.strategies.map((s) => ({
    value: s.winRatePct,
    itemStyle: { color: s.color },
  }));

  return {
    backgroundColor: 'transparent',
    grid: {
      left: 10,
      right: 40,
      top: 15,
      bottom: 10,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: F1_CHART_THEME.elevated,
      borderColor: F1_CHART_THEME.border,
      textStyle: {
        color: F1_CHART_THEME.primaryText,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 11,
      },
      formatter: (params: unknown) => {
        if (!Array.isArray(params) || params.length === 0) return '';
        const item = params[0] as { name: string; value: number; dataIndex: number };
        const strat = result.strategies[item.dataIndex];
        return `<div style="font-weight:700;margin-bottom:4px;color:#F4F6FA;">${item.name}</div>
          <div style="font-size:11px;line-height:1.5;">
            <div>Win Probability: <b style="color:#22C55E;">${strat?.winRatePct}%</b> (${strat?.wins} / ${result.iterations} sims)</div>
            <div>P50 Median Time: <span style="font-family:monospace;">${strat?.p50Sec}s</span></div>
            <div>P10 Fast / P90 Slow: <span style="font-family:monospace;">${strat?.p10Sec}s / ${strat?.p90Sec}s</span></div>
          </div>`;
      },
    },
    xAxis: {
      type: 'value',
      name: 'WIN %',
      nameTextStyle: {
        color: F1_CHART_THEME.axisLabel,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 10,
      },
      max: 100,
      splitLine: { lineStyle: { color: F1_CHART_THEME.gridLine } },
      axisLabel: {
        color: F1_CHART_THEME.axisLabel,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 10,
        formatter: '{value}%',
      },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: F1_CHART_THEME.border } },
      axisTick: { show: false },
      axisLabel: {
        color: F1_CHART_THEME.primaryText,
        fontFamily: F1_CHART_THEME.fontMono,
        fontSize: 11,
      },
    },
    series: [
      {
        name: 'Win Rate',
        type: 'bar',
        data: winRates,
        barWidth: 16,
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: F1_CHART_THEME.primaryText,
          fontFamily: F1_CHART_THEME.fontMono,
          fontSize: 10,
          fontWeight: 600,
        },
      },
    ],
  };
}
