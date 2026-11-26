import React, { useEffect, useRef, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

export interface UPlotWrapperProps {
  options: uPlot.Options;
  data: uPlot.AlignedData;
  heightPx?: number;
  className?: string;
  ariaLabel?: string;
  syncKey?: string;
  onCursorIndexChange?: (idx: number | null) => void;
}

function isCanvas2dSupported(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('2d');
  } catch {
    return false;
  }
}

export const UPlotWrapper: React.FC<UPlotWrapperProps> = ({
  options,
  data,
  heightPx = 160,
  className = '',
  ariaLabel = 'High frequency telemetry trace',
  onCursorIndexChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);
  const [canRenderCanvas] = useState<boolean>(() => isCanvas2dSupported());

  useEffect(() => {
    if (!canRenderCanvas || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const resolvedOpts: uPlot.Options = {
      ...options,
      width,
      height: heightPx,
    };

    let plot: uPlot | null = null;
    try {
      plot = new uPlot(resolvedOpts, data, containerRef.current);
      uplotRef.current = plot;

      if (onCursorIndexChange) {
        plot.hooks.setCursor = plot.hooks.setCursor || [];
        plot.hooks.setCursor.push((u) => {
          onCursorIndexChange(u.cursor.idx ?? null);
        });
      }
    } catch (err) {
      console.warn('[UPlotWrapper] Failed to initialize uPlot, using fallback:', err);
    }

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver((entries) => {
            for (const entry of entries) {
              const newWidth = Math.floor(entry.contentRect.width);
              if (newWidth > 0 && uplotRef.current) {
                uplotRef.current.setSize({ width: newWidth, height: heightPx });
              }
            }
          })
        : null;

    ro?.observe(containerRef.current);

    return () => {
      ro?.disconnect();
      if (uplotRef.current) {
        uplotRef.current.destroy();
        uplotRef.current = null;
      }
    };
  }, [options, heightPx, canRenderCanvas]);

  useEffect(() => {
    if (uplotRef.current && canRenderCanvas) {
      try {
        uplotRef.current.setData(data);
      } catch (err) {
        console.warn('[UPlotWrapper] setData error:', err);
      }
    }
  }, [data, canRenderCanvas]);

  // JSDOM / headless fallback when Canvas 2D is unavailable
  if (!canRenderCanvas) {
    const sampleCount = data[0]?.length || 0;
    return (
      <div
        role="img"
        aria-label={ariaLabel}
        className={`relative w-full rounded border border-white/5 bg-[#11151E] flex flex-col justify-center items-center px-4 ${className}`}
        style={{ height: `${heightPx}px` }}
      >
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
          {options.title || ariaLabel}
        </span>
        <span className="font-mono text-[10px] text-neutral-600 mt-1">
          [Telemetry Trace: {sampleCount} aligned points]
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      className={`uplot-f1-container relative w-full overflow-hidden ${className}`}
      style={{ height: `${heightPx}px`, minHeight: `${heightPx}px` }}
    />
  );
};

export default UPlotWrapper;
