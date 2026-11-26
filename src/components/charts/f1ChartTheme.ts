/**
 * F1 // ARCHIVE — Unified Matte Dark Telemetry & Chart Design Tokens (I-02, I-04)
 */

export const F1_CHART_THEME = {
  bg: '#11151E',
  elevated: '#181D28',
  gridLine: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.08)',
  axisLabel: '#8494AB',
  primaryText: '#F4F6FA',
  crosshair: 'rgba(241, 245, 249, 0.45)',
  mutedContext: 'rgba(148, 163, 184, 0.15)',
  crimson: '#E10600',
  brakeRed: '#EF4444',
  throttleGreen: '#22C55E',
  tyreSoft: '#E10600',
  tyreMedium: '#FFD300',
  tyreHard: '#F0F0F0',
  fontMono: 'JetBrains Mono Variable, monospace',
  fontDisplay: 'Titillium Web, sans-serif',
} as const;

export type F1ChartTheme = typeof F1_CHART_THEME;
