# CRUCIBLE IDLE RPG

An idle-incremental browser game with round-based auto-battle combat.

## Gameplay

_Coming soon!_

---

## Project Structure

For conventions and architecture, see [AGENTS.md](AGENTS.md).

```
src/
  features/   # Domain features (components, hooks, stores, tests)
  game/       # Declarative, typed balancing content
  shared/     # UI primitives, utils, ports (SavePort)
  test/       # Test setup
e2e/          # Playwright tests
```

---

## Scripts

| Command              | Description                   |
| -------------------- | ----------------------------- |
| `npm run dev`        | Dev server (Vite)             |
| `npm run build`      | Type check + production build |
| `npm run preview`    | Preview the production build  |
| `npm run typecheck`  | TypeScript check without emit |
| `npm run lint`       | ESLint                        |
| `npm run format`     | Prettier (write)              |
| `npm test`           | Unit/component tests (Vitest) |
| `npm run test:watch` | Vitest in watch mode          |
| `npm run test:e2e`   | End-to-end tests (Playwright) |

## Remarks

- Contains AI generated code.
