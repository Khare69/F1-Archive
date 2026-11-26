import React, { useEffect, useRef } from 'react';
import { echarts, type ECOption, type EChartsType } from './echartsCore';

export interface EChartsWrapperProps {
  option: ECOption;
  height?: number | string;
  width?: number | string;
  className?: string;
  ariaLabel?: string;
  onEvents?: Record<string, (params: unknown) => void>;
  theme?: string | object;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  loading?: boolean;
}

function getSupportedRenderer(): 'canvas' | 'svg' {
  if (typeof document === 'undefined') return 'svg';
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return ctx ? 'canvas' : 'svg';
  } catch {
    return 'svg';
  }
}

export const EChartsWrapper: React.FC<EChartsWrapperProps> = ({
  option,
  height = '100%',
  width = '100%',
  className = '',
  ariaLabel = 'Telemetry analysis chart',
  onEvents,
  theme,
  notMerge = false,
  lazyUpdate = false,
  loading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = getSupportedRenderer();
    const clientWidth = containerRef.current.clientWidth;
    const clientHeight = containerRef.current.clientHeight;
    const initOpts: { renderer: 'canvas' | 'svg'; width?: number; height?: number } = { renderer };

    // In JSDOM / headless testing environments clientWidth/clientHeight are 0
    if (clientWidth === 0 || clientHeight === 0) {
      if (typeof width === 'number') initOpts.width = width;
      if (typeof height === 'number') initOpts.height = height;
      if (!initOpts.width) initOpts.width = 600;
      if (!initOpts.height) initOpts.height = 300;
    }

    let chart: EChartsType | null = null;
    try {
      chart = echarts.init(containerRef.current, theme, initOpts);
      chartRef.current = chart;
    } catch (err) {
      console.warn('[EChartsWrapper] Init failed:', err);
    }

    if (chart && onEvents) {
      for (const [eventName, handler] of Object.entries(onEvents)) {
        chart.on(eventName, handler);
      }
    }

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (chartRef.current && !chartRef.current.isDisposed()) {
              chartRef.current.resize();
            }
          })
        : null;

    ro?.observe(containerRef.current);

    return () => {
      ro?.disconnect();
      if (chartRef.current && !chartRef.current.isDisposed()) {
        chartRef.current.dispose();
      }
      chartRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    if (chartRef.current && !chartRef.current.isDisposed()) {
      try {
        chartRef.current.setOption(option, notMerge, lazyUpdate);
      } catch (err) {
        console.warn('[EChartsWrapper] setOption failed:', err);
      }
    }
  }, [option, notMerge, lazyUpdate]);

  useEffect(() => {
    if (chartRef.current && !chartRef.current.isDisposed()) {
      if (loading) {
        chartRef.current.showLoading('default', {
          text: '',
          color: '#E10600',
          textColor: '#8494AB',
          maskColor: 'rgba(17, 21, 30, 0.75)',
        });
      } else {
        chartRef.current.hideLoading();
      }
    }
  }, [loading]);

  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      className={`relative w-full ${className}`}
      style={{ height: heightStyle, width: widthStyle, minHeight: typeof height === 'number' ? height : undefined }}
    />
  );
};

export default EChartsWrapper;
