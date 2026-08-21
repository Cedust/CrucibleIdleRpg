# Repository Guidelines

## Project

Crucible Idle RPG is a React 19, TypeScript, and Vite single-page app. Read [README.md](README.md) for an overview of the project, its structure, and development commands. Read [README.md](docs/README.md) for game documentation and specifications.

## Tech Stack

| Area             | Selection                           |
| ---------------- | ----------------------------------- |
| Framework        | React 19 with React Compiler        |
| Sprache          | TypeScript 5, strict                |
| Build            | Vite                                |
| Styling          | Tailwind CSS v4, CSS-first `@theme` |
| State            | Zustand                             |
| Zahlen           | native `number`                     |
| Save-Validierung | Zod                                 |
| Package Manager  | npm                                 |
| Node             | ≥ 24 (`package.json`, `.nvmrc`)     |

## Architecture

- Keep domain work close to its feature in `src/features/`.
- Keep balancing declarative and typed in `src/game/`, separate from logic and stores.
- Keep simulation pure: no DOM, timers, stores, `Date.now()`, or `Math.random()`. Playback and catch-up share the state-to-next-step engine and seeded PRNG.
- Use feature-scoped Zustand stores and selective subscriptions. Keep runtime state outside views; navigation is state-based.
- Use `SavePort`. Version and validate saves with Zod; provide fallbacks and error boundaries.
- Pre-release save policy: there is exactly one current save schema. Schema changes replace the default save, schema, and tests atomically; saves in any other format reset to the default on load. Write a save migration only when a spec or task explicitly requires one.
- Do not install new libraries unless asked.

## Writing Style

Apply this to all prose: documentation, specs, comments, commit messages, and PR descriptions.

- Use short sentences. Use the active voice. Give each word one meaning. Cut the clutter.
- Follow Zinsser's four principles: clarity, simplicity, brevity, humanity.
- Write in Simplified Technical English.
- Break long paragraphs into bullet points.
- Keep the writing warm and human. A person wrote it, not a manual.
- Describe the current state. Avoid contrast or negation sentences such as "X no longer does Y". State each fact once and link to it from elsewhere.

## Coding Style & Naming Conventions

- Write TypeScript and TSX with two-space indentation, semicolons, single quotes, trailing commas, and a 100-character line width.
- Prettier is authoritative: use `npm run format` or `npm run format:check`.
- ESLint enforces type-aware rules, React hooks, accessibility, and type-only imports where applicable.
- Keep content identifiers and types explicit and deterministic; do not use `any` unless unavoidable.
- Name React components in `PascalCase` (`CombatScreen.tsx`), hooks with `use` (`useCombatPlayback.ts`), and other modules/functions in `camelCase`.
- Use the `@/` import alias for `src/` modules (for example, `@/game/types`).
- Do not use default exports; use named exports for all modules, functions, and types.
- Use Tailwind tokens from `@theme` and `src/shared/ui/` primitives. Write semantic, keyboard-accessible HTML. Do not use inline styles, `!important` or CSS-in-JS. The only exception is for dynamic styles that cannot be expressed with Tailwind.
- Follow [UI.md](docs/spec/UI.md) for the viewport contract, responsive mechanics, token catalogue, visual state system, and the shared primitives.

## Build, Test, and Development Commands

Use Node 24 or newer, then install with `npm ci`.

- `npm run dev` starts the Vite development server.
- `npm run lint` runs ESLint.
- `npm run typecheck` checks TypeScript.
- `npm test` runs Vitest unit and component tests; `npm run test:e2e` runs Playwright tests.
- `npm run build` type-checks and creates the production bundle.
- `npm run docs:links` validates Markdown links; run it after documentation edits.

## Coding Workflow

- Implement one ticket only.
- Do not implement future-ticket features.
- Do not refactor unrelated systems.
- Do not introduce new architecture unless required.
- Avoid unnecessary dependencies.
- Use strict TypeScript.
- Run build/tests when possible.
- Report files changed, commands run, build results, and manual verification steps.

## Testing Guidelines

- Place unit and component tests next to their subject as `*.test.ts` or `*.test.tsx`; browser tests use `*.spec.ts` under `e2e/`.
- Use Vitest with Testing Library for UI behavior.
- Cover new game logic with deterministic tests, especially seeded combat and progression calculations.
- Run the narrowest relevant test during development, then `npm test` before a PR; add `npm run test:e2e` when user journeys change.

## Commits & Pull Requests

- Only commit or open a Pull Request when explicitly requested.
- Follow Conventional Commits (e.g. `feat(combat): ...`, `fix: ...`, `docs: ...`, `chore: ...`).
- Pre-commit hooks format staged files (`npx lint-staged`), type-check the project (`npm run typecheck`), and validate repository documentation links (`npm run docs:links`). A commit-msg hook enforces Conventional Commits (`commitlint`). A pre-push hook lints the whole repository, runs the production build, and runs the unit tests (`npm run lint`, `npm run build`, `npm test`).
- Before committing, run `npm run test:e2e` for affected flows.
