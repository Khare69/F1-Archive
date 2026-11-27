# ADR-0003: Head-to-Head Era Normalization Engine

## Context and Problem Statement
Comparing Formula 1 drivers across eras (e.g. Juan Manuel Fangio in 1954 vs. Ayrton Senna in 1988 vs. Max Verstappen in 2023) is fundamentally distorted by evolving scoring systems. In the 1950s, only the top 5 finishers scored points (8-6-4-3-2), with a point for fastest lap and only best results counting towards the championship. Modern F1 awards points to the top 10 (25-18-15-12-10-8-6-4-2-1), with sprints and longer 24-race calendars.

## Decision
We developed a deterministic mathematical normalization engine (`src/features/drivers/driverMath.ts`) using the **Available Points Share** model.

## Technical Implementation
1. **Available Points Normalization**:
   $$\text{Points Share} = \frac{\text{Points Earned in Season}}{\text{Max Possible Points in Season}}$$
2. **Era Standardization**: Points share is mapped onto a uniform scale (0–100) and weighted against field size, car reliability rates, and teammate dominance.
3. **Statistical Decoupling**: Pure performance metrics (pole conversion rate, win percentage per start, podium rate, lap leadership percentage) are reported independently of points systems.

## Consequences
- **Positive**: Provides fair, mathematically sound cross-era comparisons; eliminates artificial skew favoring modern 24-race seasons over 8-race historic championships.
- **Negative**: No statistical model can completely account for mechanical unreliability variations between 1950s road-course racing and modern hybrid endurance.
