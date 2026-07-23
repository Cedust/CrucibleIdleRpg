# AGENTS.md — Crucible Idle RPG

Leitfaden für AI-Agenten und Entwickler, die an diesem Projekt arbeiten.
Diese Datei beschreibt **verbindliche Konventionen**. Interne Dokumentation und
Code-Kommentare sind auf **Deutsch**, sämtliche **Spieltexte (UI + Content) auf Englisch**.

---

## 1. Projektüberblick

**Crucible Idle RPG** ist ein Idle-/Incremental-Browsergame als **client-only Single-Page-App**
(kein Backend). Der gesamte Spielfortschritt entsteht **ausschließlich aus rundenbasierten
Auto-Battle-Kämpfen** zwischen dem eigenen Team und Gegnern.

- **Kampf**: rundenbasiert, wird **live Runde für Runde simuliert** und vom Spieler mitverfolgt.
  Die Architektur bleibt bewusst offen für spätere Mechaniken, mit denen der Spieler **aktiv
  in den Kampf eingreifen** kann.
- **Fortschritt**: nur über Kampfergebnisse (Belohnungen). Es gibt keine passive Ressourcen-Idle-Schicht.

---

## 2. Tech-Stack

| Bereich          | Wahl                                                          |
| ---------------- | ------------------------------------------------------------- |
| Framework        | React 19 **mit React Compiler** (automatische Memoisierung)   |
| Sprache          | TypeScript 5, **strict mode** (siehe §9)                      |
| Build-Tool       | Vite                                                          |
| Styling          | **Tailwind CSS v4** (CSS-first `@theme`, `@tailwindcss/vite`) |
| State-Management | **Zustand**                                                   |
| Große Zahlen     | **break_eternity.js**                                         |
| Validierung      | **Zod** (nur Save-Laufzeitvalidierung, siehe §7)              |
| Package Manager  | **npm**                                                       |
| Node             | **≥ 24** (`engines` in `package.json`, `.nvmrc`)              |

### Tooling

- **Lint/Format**: ESLint (Flat Config) + Prettier
  - aktive Plugins u. a.: `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`
  - Prettier = reine Formatierung, ESLint = Code-Qualität
- **Tests**: Vitest + React Testing Library (Unit/Component), Playwright (E2E)
- **Git-Hooks**: Husky + lint-staged (Lint/Format auf gestagte Dateien vor jedem Commit)
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`, …)

---

## 3. Projektstruktur

Der Code ist **feature-basiert** geschnitten. Verwandter Code (Komponenten, Hooks, Stores,
Tests) lebt gemeinsam im jeweiligen Feature-Ordner.

```
src/
  features/          # Fachliche Features (je Feature: Components, Hooks, Stores, Tests)
    combat/
    team/
    upgrades/
    ...
  game/              # Deklarativer, typisierter Balancing-Content (siehe §4)
    characters/
    enemies/
    abilities/
  shared/            # Generische, feature-übergreifende Bausteine
    ui/              # Eigene UI-Primitives (Button, Panel, ProgressBar, Tooltip, …)
    ports/           # Austauschbare Schnittstellen (z. B. SavePort, siehe §7)
    utils/           # Reine Helfer (PRNG, Zahlformatierung, …)
```

### Namenskonventionen

- **Sprechende Dateinamen** innerhalb von Feature-Ordnern — keine generischen
  `index.ts`/`Component.tsx`. Beispiele:
  - `combat/CombatScreen.tsx`
  - `combat/useCombatSimulation.ts`
  - `combat/combatStore.ts`
  - `combat/combatEngine.ts`
- Pfad-Alias: **`@/` → `src/`** (in `tsconfig.json` und Vite konfiguriert).

---

## 4. Content & Balancing

Aller Balancing-Content (Charaktere, Gegner, Fähigkeiten, Kosten-/Wachstumskurven) wird als
**deklarative, typisierte TypeScript-Module** unter `src/game/` definiert — **getrennt von der
Spiellogik**.

- Gemeinsame Interfaces (`CharacterDefinition`, `EnemyDefinition`, `AbilityDefinition`, …)
  garantieren Typsicherheit, Autovervollständigung und Refactoring-Sicherheit.
- Balancing-Änderungen dürfen **keine** Logik-Dateien (Kampf-Engine, Stores) berühren.
- Kein JSON — volle TS-Typsicherheit hat Vorrang.

---

## 5. Game-Loop & Kampf

### Simulation ≠ Rendering (strikt getrennt)

- Die **Kampf-Engine** (`src/features/combat/combatEngine.ts` o. ä.) ist **reine,
  deterministische Logik**: gleicher Seed + gleicher Input ⇒ exakt gleicher Kampfverlauf.
  Sie hat **keinen** Bezug zu Timern, DOM oder Echtzeit.
- Das **Rendering/Playback** spielt die simulierten Runden mit visueller Verzögerung ab.
- Diese Trennung ist Voraussetzung für Catch-up (siehe unten), Testbarkeit und spätere
  interaktive Eingriffsmechaniken.

### Zufall - seedbarer PRNG (Pflicht)

- **Aller** Zufall im Spiel (Trefferchance, Krit, Schadensstreuung, …) läuft über einen
  **seedbaren PRNG** (z. B. `mulberry32`/`sfc32`, klein und dependency-frei in
  `src/shared/utils/`). **Kein** `Math.random()` in Spiellogik.
- Vorteile: reproduzierbare Kämpfe (deterministische Tests statt Wertebereich-Asserts),
  aussagekräftige Bug-Reports ("Seed 12345"), spätere Replay-Fähigkeit.

### Zeitverhalten / Catch-up

- **Tab geschlossen ⇒ kein Fortschritt.** Offline-Progress ist ein ausdrückliches **Non-Goal**
  (nicht implementieren, auch nicht "aus Best-Practice-Reflex").
- **Tab offen, aber minimiert/vom Browser gedrosselt** ⇒ beim Wiederöffnen wird **aufgeholt**:
  über die **Page Visibility API** erkennen, wenn der Tab wieder sichtbar/nicht gedrosselt ist,
  und die fehlenden Runden **ohne Animation** nachrechnen (Simulation nachziehen, dann Anzeige
  synchronisieren).

### Große Zahlen

- Werte, die `Number.MAX_SAFE_INTEGER` überschreiten können (Schaden, Ressourcen, Prestige-Skalen),
  werden konsequent über **break_eternity.js** geführt — nicht über native `number`. Ein dünner
  Wrapper/Helper in `src/shared/utils/` kapselt Formatierung und häufige Operationen.

---

## 6. State-Management (Zustand)

- Zentraler Spielzustand in **Zustand**-Stores, pro Feature geschnitten (Store-Slice im
  Feature-Ordner).
- **Selektive Subscriptions** nutzen (Selectors), damit hochfrequente Kampf-Updates nur die
  tatsächlich betroffenen Komponenten neu rendern — nicht die ganze UI.
- **Kein Router**: Ansichtswechsel über einen State-basierten View-Switch (z. B. `activeView`),
  kein URL-Sync. Kampf-State bleibt beim Wechseln erhalten (kein Unmount/Remount).

---

## 7. Persistenz & Robustheit

### Speicherstand

- **`localStorage`** mit JSON-Serialisierung, **Versionsfeld** und **Migrations-Mechanismus**.
- Zugriff **ausschließlich** über einen abstrahierten **`SavePort`-Adapter**
  (`src/shared/ports/`, z. B. `load()` / `save()` / `clear()`). Aktuelle Implementierung:
  `localStorage`. Ziel: später ohne Anfassen der Spiellogik gegen ein **Cloud-Backend
  (z. B. Firebase)** austauschbar.

### Laufzeit-Validierung (Zod)

- Beim **Laden** eines Saves wird der geparste Inhalt gegen ein **Zod-Schema** validiert, bevor
  er in den Store übernommen wird (Saves sind potenziell veraltet, manipuliert oder korrupt —
  TS-Typen garantieren zur Laufzeit nichts).
- **Pro Save-Version ein Schema**, kombiniert mit dem Migrations-Mechanismus. Bei Fehlschlag:
  **kontrollierter Fallback** (Migration anstoßen oder definiert auf Default zurücksetzen),
  **kein** Absturz mit korruptem State.

### Fehlerbehandlung

- **React Error Boundary(s)** fangen Render-Crashes ab und zeigen einen brauchbaren Fallback
  (kein weißer Bildschirm; z. B. Hinweis + Save-Export als Option).
- **Keine externe Telemetrie** (kein Sentry o. ä.). Optionales Zukunftsthema, sobald echte
  Spieler das Spiel nutzen.

---

## 8. UI, Styling & Accessibility

- **Nur Dark Mode** (kein Theme-Toggle). Design-Tokens via Tailwind v4 `@theme`.
- **Plain Tailwind + eigene UI-Primitives** in `src/shared/ui/` — keine externe
  Komponentenbibliothek. Volle Kontrolle über den Look eines eigenständigen Spiels.
- **Accessibility - Basis-Anspruch** (kein formaler WCAG-Prozess):
  - semantisches HTML wo möglich
  - Tastaturbedienbarkeit für interaktive Elemente
  - ausreichende Farbkontraste (Tailwind-Palette darauf prüfen)
  - `eslint-plugin-jsx-a11y` aktiv im Lint-Setup
  - **keine** förmlichen WCAG-Konformitätstests / kein A11y-CI-Gate

---

## 9. TypeScript-Konfiguration

- `"strict": true` (aktiviert u. a. `strictNullChecks`, `noImplicitAny`,
  `strictFunctionTypes`, `strictPropertyInitialization`, …).
- Zusätzlich `"noUncheckedIndexedAccess": true` — Index-Zugriffe (z. B. auf Team-Slots und
  Gegner-Arrays im Kampf) liefern `| undefined` und erzwingen eine Prüfung.

---

## 10. Tests

- **Vitest + React Testing Library** für Unit-/Component-Tests, **Playwright** für kritische
  End-to-End-Flows (z. B. "Kampf starten → Runden spielen ab → Sieg → Reward → Save persistiert").
- **Pflicht**: Die Kampf-Engine und übrige `src/game/`-nahe Spiellogik sind reine,
  deterministische, seedbare Logik und **müssen bei jeder Änderung mit Unit-Tests abgesichert
  sein** (deterministische Assertions dank festem Seed).

---

## 11. Entwicklungs-Workflow (für Agenten verbindlich)

### Definition of Done

Bevor eine Aufgabe als **erledigt** gilt, müssen lokal **grün** sein:

1. **Lint** (ESLint)
2. **Typecheck** (`tsc --noEmit`)
3. **Tests** (Vitest; relevante Suites)
4. **Build** (Vite) - bei Änderungen mit Build-Relevanz
5. **Browser Smoke Test** (Playwright) - optional, aber empfohlen

### Weiteres

- Commits im **Conventional-Commits**-Format.
- Neue/geänderte Spiellogik ⇒ zugehörige Tests aktualisieren/ergänzen.
- Balancing-Änderungen nur unter `src/game/`, ohne Logik-Dateien zu berühren.
- Spieltexte **Englisch**, Kommentare/Doku **Deutsch**.

---

## 12. CI/CD

- **GitHub Actions** bei Push/PR: **Lint · Typecheck · Vitest · Build**.
- **GitHub-Pages-Deploy** wird **erst mit der ersten spielbaren Version** eingeführt
  (dann inkl. korrektem `base`-Pfad in `vite.config.ts`, z. B. `/CrucibleIdleRpg/`).

---

## 13. Non-Goals (bewusst nicht umsetzen)

- **Offline-Progress** bei geschlossenem Tab.
- Passive Idle-Ressourcengenerierung außerhalb des Kampfes.
- Router / URL-adressierbare Views.
- Externe Fehler-Telemetrie.
- i18n-Infrastruktur (Spieltexte vorerst hartcodiert Englisch; dank Content-Trennung später
  nachrüstbar).
- Light-/System-Theme.

---

## 14. Do NOT

- **Do NOT** use `any` or disable TypeScript strict mode.
- **Do NOT** skip writing tests for new game logic.
- **Do NOT** add new dependencies without discussing first.
- **Do NOT** use inline styles or CSS-in-JS; use Tailwind classes or shared UI primitives.
  > **Exception:** a continuous, runtime-computed value with no fixed set of steps (e.g. a health-bar fill width, any percentage 0–100%) can't be expressed as a static Tailwind class, since the JIT compiler only generates classes it can see literally in source — for that single computed property (and only that property), inline `style` is allowed. Everything else on the element still uses Tailwind classes.
- **Do NOT** use `Math.random()` in game logic; use the seedable PRNG instead.
- **Do NOT** use default exports; always use named exports for better tree-shaking and clarity.
