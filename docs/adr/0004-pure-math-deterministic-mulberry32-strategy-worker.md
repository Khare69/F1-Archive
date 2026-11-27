# ADR-0004: Pure-Math Deterministic Mulberry32 Strategy Worker

## Context and Problem Statement
Formula 1 race strategy simulation involves high-dimensional uncertainty: tyre degradation curves, traffic interactions, pit stop transit times, and safety car probabilities. Running 1,000+ Monte Carlo iterations directly on the React UI thread causes perceptible input lag (frame drops > 100ms). Furthermore, using non-deterministic `Math.random()` prevents reproducible sharing of strategy scenarios across URLs.

## Decision
We separated the strategy simulation into a pure mathematical engine (`src/features/strategy/strategyMath.ts`) powered by a deterministic 32-bit pseudo-random number generator (**Mulberry32**), executed within a dedicated Web Worker (`src/features/strategy/strategyWorker.ts`).

## Technical Implementation
1. **Deterministic PRNG**:
   ```ts
   export function createMulberry32(seed: number): () => number {
     let a = seed >>> 0;
     return function () {
       let t = (a += 0x6d2b79f5);
       t = Math.imul(t ^ (t >>> 15), t | 1);
       t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
       return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
     };
   }
   ```
2. **Worker Offloading**: The Monte Carlo loop runs completely off the main thread.
3. **URL Shareability**: The seed and parameters are encoded directly into query parameters, guaranteeing identical probabilistic distributions when opened by another user.
4. **Validation & Benchmarks**: Simulation parameters are validated by Zod v4 schemas, ensuring zero `NaN` or infinite loops.

## Consequences
- **Positive**: 60fps responsive UI during heavy Monte Carlo execution; 100% deterministic and reproducible results across browsers; easy URL state sharing.
- **Negative**: Worker message passing overhead (~1–3ms per dispatch), which is negligible compared to the 50–200ms compute savings.
