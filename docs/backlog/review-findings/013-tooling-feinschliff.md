# 013 — Tooling-Feinschliff

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Schwere**      | niedrig |
| **Hängt ab von** | —       |

## Ziel

Die Quality-Gates decken das ganze Repo, die Vitest-Konfiguration entspricht der
tatsächlichen Nutzung, und die Lint-Basis ist auf dem strengen Preset.

## Befund

- **Lint-Lücke in den Gates:** pre-commit lintet gestagte Dateien (lint-staged), pre-push
  läuft `build` + `test` ([.husky/](../../../.husky/)); nach einer ESLint-Konfig-Änderung
  erreichen Verstöße in unberührten Dateien das Remote.
- **Preset:** [eslint.config.js](../../../eslint.config.js) (Z. 15) nutzt
  `recommendedTypeChecked`; `strictTypeChecked` (+ `stylisticTypeChecked`) fängt zusätzlich
  z. B. die unnötigen Assertions aus [010](010-testqualitaet-invarianten.md).
- **Vitest:** [vite.config.ts](../../../vite.config.ts) (Z. 22–23) setzt
  `test.globals: true`, während alle Tests `describe/expect/it` explizit importieren und
  `tsconfig.app.json` keine `vitest/globals`-Types deklariert; `environment: 'jsdom'` gilt
  auch für die reinen `src/game/`-Logiktests (Setup-/Environment-Anteil dominiert die
  Testlaufzeit: 61 s Environment bei 2,4 s Tests).
- **Coverage:** `@vitest/coverage-v8` ist installiert; ein `test:coverage`-Script fehlt.

## Nicht-Ziel

Neue Lint-Regeln jenseits des Preset-Wechsels; Änderungen an der Hook-Struktur aus AGENTS.md.

## Verbindliche Spec-Anker

- [AGENTS.md § Build, Test, and Development Commands](../../../AGENTS.md#build-test-and-development-commands)
- [AGENTS.md § Commits & Pull Requests](../../../AGENTS.md#commits--pull-requests) — dokumentierte Hook-Kette

## Akzeptanzkriterien

- [ ] `npm run lint` läuft in einem Gate über das ganze Repo (pre-push oder CI); AGENTS.md
      beschreibt die Kette danach korrekt.
- [ ] ESLint nutzt `strictTypeChecked`; neue Befunde sind behoben oder begründet
      abgeschaltet.
- [ ] `test.globals` ist entfernt; Logiktests laufen unter `environment: 'node'`,
      Komponententests unter jsdom.
- [ ] `npm run test:coverage` existiert.

## Betroffene Dateien

- `.husky/pre-push`, `package.json`, `eslint.config.js`, `vite.config.ts`
- `AGENTS.md` — Hook-Beschreibung bei Änderung

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
