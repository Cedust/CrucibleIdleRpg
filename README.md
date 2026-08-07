# CRUCIBLE IDLE RPG

A dungeon auto-battle game with RPG elements, where the player can manage a party of three heroes, upgrade their equipment and skills, and explore dungeons.

## Gameplay

_Coming soon!_

---

## Project Structure

For conventions and architecture, see [AGENTS.md](AGENTS.md).

```text
docs/         # Documentation, ADRs, backlog, and design notes
e2e/          # Playwright tests
scripts/      # Build and dev scripts
src/
  app/        # App entry, shell, and navigation
  features/   # Domain features (components, hooks, stores, tests)
  game/       # Declarative, typed balancing content
  shared/     # UI primitives, utils, ports
  test/       # Test setup
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

---

## Remarks

- Contains AI generated code.
