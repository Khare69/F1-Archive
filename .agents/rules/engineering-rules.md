# F1 Archive — Engineering Rules

These rules govern ALL code changes in this project. No exceptions without explicit user approval.

## Code Quality

1. **Don't duplicate logic.** If something exists, reuse it. Before writing a new function, check if a similar one already exists in `utils/`, `hooks/`, or `dataService.ts`. Extract shared logic into helpers rather than copy-pasting.

2. **Don't create unnecessary libraries.** Only add a dependency if it saves significant complexity. Always explain WHY a new package is needed and what the alternative would be without it. Prefer native browser APIs and built-in React features over third-party packages.

3. **Don't rewrite working code unnecessarily.** If existing code works and meets requirements, leave it alone. Refactoring is only justified when it fixes a bug, improves performance measurably, or is required for a new feature.

## Architecture

4. **Don't change the architecture without explaining why.** Any structural change (new folders, moved files, changed data flow, new patterns) must include a written explanation of WHY the change is needed and what problem it solves. Get user approval before making architectural changes.

5. **Keep components modular.** Each component should do ONE thing well. If a component file exceeds ~150 lines, consider splitting it. Components should be independently testable and reusable where possible.

6. **Keep API/database logic separated.** All data access goes through `dataService.ts` — components NEVER import raw data directly. This separation allows swapping the data source (hardcoded → JSON → API) without touching any component.

7. **Write reusable components.** Shared UI patterns (FallbackImage, team color badges, stat cards) live in `src/components/` and are used everywhere. Feature-specific components live in `src/features/`. Don't create a one-off component in a feature folder if it could be useful elsewhere.

## Security & Configuration

8. **Validate all user input.** Any value from URL params (`useParams`), query strings, or user interaction must be validated before use. Check that team IDs, driver IDs, and season years actually exist in the dataset before rendering.

9. **Never expose secrets in frontend code.** No API keys, tokens, or credentials in source code, even in environment variables prefixed with `VITE_` (these are embedded in the bundle). If a future API requires keys, proxy through a serverless function.

10. **Use environment variables.** Configuration that changes between environments (API base URLs, feature flags, analytics IDs) goes in `.env` files, accessed via `import.meta.env.VITE_*`. Never hardcode environment-specific values.

## Communication

11. **Explain important decisions.** When making a non-obvious choice (why this library over another, why this pattern, why this file structure), add a brief comment in the code AND mention it in the commit/response. The user is learning — explanations are part of the deliverable.
