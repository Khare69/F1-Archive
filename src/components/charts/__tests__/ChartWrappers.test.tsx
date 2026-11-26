import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { EChartsWrapper } from '../EChartsWrapper';
import { UPlotWrapper } from '../UPlotWrapper';
import type { ECOption } from '../echartsCore';
import type uPlot from 'uplot';

describe('ChartWrappers (EChartsWrapper & UPlotWrapper)', () => {
  describe('EChartsWrapper', () => {
    it('mounts cleanly in JSDOM with SVG fallback renderer and sets accessible aria-label', () => {
      const option: ECOption = {
        grid: { left: 10, right: 10, top: 10, bottom: 10 },
        xAxis: { type: 'category', data: ['Lap 1', 'Lap 2', 'Lap 3'] },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: [88.5, 88.2, 88.0] }],
      };

      const { container } = render(
        <EChartsWrapper
          option={option}
          height={300}
          ariaLabel="Telemetry Pace Graph"
        />
      );

      const chartEl = screen.getByRole('img', { name: 'Telemetry Pace Graph' });
      expect(chartEl).toBeInTheDocument();
      expect(chartEl.style.height).toBe('300px');
      expect(container.querySelector('[role="img"]')).not.toBeNull();
    });

    it('updates options and disposes on unmount without throwing errors', () => {
      const initialOption: ECOption = {
        xAxis: { type: 'category', data: ['A', 'B', 'C'] },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: [1, 2, 3] }],
      };
      const updatedOption: ECOption = {
        xAxis: { type: 'category', data: ['A', 'B', 'C'] },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: [4, 5, 6] }],
      };

      const { rerender, unmount } = render(
        <EChartsWrapper option={initialOption} ariaLabel="Dynamic Chart" />
      );

      rerender(<EChartsWrapper option={updatedOption} ariaLabel="Dynamic Chart" />);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('UPlotWrapper', () => {
    it('mounts cleanly in JSDOM, using headless/SVG fallback when 2D canvas is unavailable', () => {
      const opts: uPlot.Options = {
        title: 'Speed Trace',
        width: 500,
        height: 160,
        series: [
          {},
          { label: 'VER', stroke: '#3671C6' },
          { label: 'NOR', stroke: '#FF8000' },
        ],
        scales: { x: { time: false } },
      };

      const data: uPlot.AlignedData = [
        [0, 0.5, 1.0],
        [280, 310, 325],
        [278, 308, 324],
      ];

      render(
        <UPlotWrapper
          options={opts}
          data={data}
          heightPx={160}
          ariaLabel="VER vs NOR Speed Trace"
        />
      );

      const chartEl = screen.getByRole('img', { name: 'VER vs NOR Speed Trace' });
      expect(chartEl).toBeInTheDocument();
      // Should show sample count in fallback or trace container
      expect(chartEl).toHaveTextContent(/3 aligned points/i);
    });

    it('cleans up without error on unmount', () => {
      const opts: uPlot.Options = {
        width: 400,
        height: 120,
        series: [{}, { stroke: 'red' }],
      };
      const data: uPlot.AlignedData = [[0, 1], [100, 200]];

      const { unmount } = render(
        <UPlotWrapper options={opts} data={data} heightPx={120} ariaLabel="Test Cleanup" />
      );

      expect(() => unmount()).not.toThrow();
    });
  });
});
