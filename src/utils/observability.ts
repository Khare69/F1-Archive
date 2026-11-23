/**
 * F1 // ARCHIVE — Production Observability & Web Vitals Facade
 * 
 * Safely collects:
 * 1. Native Core Web Vitals (LCP, INP, CLS) via PerformanceObserver
 * 2. WebGL health telemetry (webglcontextlost, GLTFLoader errors)
 * 3. Pluggable, zero-cookie PostHog / Sentry reporting
 * 
 * Guards against:
 * - Ad-blocker network blocks (uBlock, Brave, Pi-hole)
 * - Missing environment tokens (safe no-op in dev/CI)
 * - Non-standard or unsupported browser Performance APIs
 */

export interface WebVitalsMetrics {
  lcp: number | null; // Largest Contentful Paint (ms)
  inp: number | null; // Interaction to Next Paint (ms)
  cls: number | null; // Cumulative Layout Shift
}

export interface WebGLDiagnosticEvent {
  type: 'context_lost' | 'context_restored' | 'loader_error' | 'shader_error';
  timestamp: number;
  message?: string;
  canvasId?: string;
}

class ObservabilityService {
  private vitals: WebVitalsMetrics = { lcp: null, inp: null, cls: null };
  private webglEvents: WebGLDiagnosticEvent[] = [];
  private isInitialized = false;

  constructor() {
    this.initNativeVitals();
  }

  /**
   * Initializes native browser PerformanceObservers for LCP, INP, and CLS.
   */
  private initNativeVitals(): void {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
      return;
    }

    try {
      // 1. Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.vitals.lcp = Math.round(lastEntry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // 2. Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as unknown as LayoutShift[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.vitals.cls = Number(clsValue.toFixed(4));
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // 3. Interaction to Next Paint (INP)
      const inpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.duration) {
            this.vitals.inp = Math.round(entry.duration);
          }
        }
      });
      inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 } as unknown as PerformanceObserverInit);
    } catch {
      // Browser does not support one of the observed entry types; degrade gracefully
    }

    this.isInitialized = true;
  }

  /**
   * Records a WebGL diagnostic or error event.
   */
  public logWebGLEvent(event: Omit<WebGLDiagnosticEvent, 'timestamp'>): void {
    const entry: WebGLDiagnosticEvent = {
      ...event,
      timestamp: Date.now()
    };
    this.webglEvents.push(entry);
    if (this.webglEvents.length > 50) {
      this.webglEvents.shift();
    }

    if (import.meta.env.DEV) {
      console.debug('[Observability] WebGL Diagnostic Event:', entry);
    }

    this.captureEvent('webgl_diagnostic', {
      eventType: entry.type,
      message: entry.message,
      canvasId: entry.canvasId
    });
  }

  /**
   * Captures an arbitrary telemetry event safely (PostHog/Sentry or local log).
   */
  public captureEvent(eventName: string, properties: Record<string, unknown> = {}): void {
    try {
      const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
      if (posthogKey && typeof window !== 'undefined') {
        const win = window as unknown as { posthog?: { capture: (name: string, props: Record<string, unknown>) => void } };
        win.posthog?.capture(eventName, {
          ...properties,
          ...this.vitals,
          timestamp: Date.now()
        });
      }
    } catch {
      // Silent catch for ad-blockers
    }
  }

  /**
   * Reports an unhandled application or WebGL error.
   */
  public reportError(error: unknown, context: Record<string, unknown> = {}): void {
    try {
      const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
      if (sentryDsn && typeof window !== 'undefined') {
        const win = window as unknown as { Sentry?: { captureException: (err: unknown, extra: { extra: Record<string, unknown> }) => void } };
        win.Sentry?.captureException(error, { extra: context });
      }
    } catch {
      // Silent catch for ad-blockers
    }

    if (import.meta.env.DEV) {
      console.warn('[Observability] Captured Error:', error, context);
    }
  }

  /**
   * Returns current Core Web Vitals snapshot.
   */
  public getWebVitals(): WebVitalsMetrics {
    return { ...this.vitals };
  }

  /**
   * Returns captured WebGL diagnostic events.
   */
  public getWebGLEvents(): WebGLDiagnosticEvent[] {
    return [...this.webglEvents];
  }
}

// Minimal interface for LayoutShift performance entry
interface LayoutShift extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

export const observability = new ObservabilityService();
