# AGENTS.md — Crucible Idle RPG

Leitfaden für AI-Agenten und Entwickler, die an diesem Projekt arbeiten.
Diese Datei beschreibt **verbindliche Konventionen**. Interne Dokumentation und
Code-Kommentare sind auf **Deutsch**, sämtliche **Spieltexte (UI + Content) auf Englisch**.

### Doku-Stil (verbindlich)

- **Beschreibe den Ist-Zustand.** Schreib, was gilt — nicht, was nicht (mehr) gilt oder
  wovon etwas unabhängig ist. Kontrast zu früheren Entwürfen gehört in die Diskussion,
  nicht ins Dokument.
- **Ein Fakt an genau einer Stelle.** Punkte nicht über Abschnitte/Dateien wiederholen —
  stattdessen verweisen (`§x`).
- **Knapp.** Kein rhetorisches Framing; Begründungen gehören nach DESIGN/BALANCING, nicht
  ins SPEC.

### Weitere Dokumentation (`docs/`)

Diese Datei ist die **lebende Quelle für Regeln & Konventionen**. Das Spiel selbst
und Entscheidungen sind ergänzend dokumentiert:

- [`docs/DESIGN.md`](docs/DESIGN.md) — Vision, Design-Pillars, Player Experience („Warum / Wie soll es sich anfühlen?").
- [`docs/SPEC.md`](docs/SPEC.md) — präzise Mechanik-Regeln, Formeln, Zustände („Wie verhält es sich exakt?").
- [`docs/BALANCING.md`](docs/BALANCING.md) — Balancing-Philosophie & Begründung der Kurven/Werte. Umgesetzte Zahlen leben als Content unter `src/game/` (§4).
- [`docs/GLOSSARY.md`](docs/GLOSSARY.md) — verbindliche Begriffe (DE interne Prosa ↔ EN Code/UI).
- [`docs/adr/`](docs/adr/) — Architecture Decision Records: unveränderliches „Wann & warum"-Logbuch. Bei Konflikt gilt **AGENTS.md**; ADRs erklären nur das Warum dahinter.

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
| Zahlen           | native `number` — **keine** Big-Number-Lib (§5, ADR-0004)     |
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
    blacksmith/
    jeweler/
    crucible/
    ...
  game/              # Deklarativer, typisierter Balancing-Content (siehe §4)
    characters/
    enemies/
    curves/          # Vorberechnete Wachstumskurven je Stufe (siehe §5)
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

Aller Balancing-Content (Charaktere, Gegner, Kosten-/Wachstumskurven) wird als
**deklarative, typisierte TypeScript-Module** unter `src/game/` definiert — **getrennt von der
Spiellogik**.

- Gemeinsame Interfaces (`CharacterDefinition`, `EnemyDefinition`, …) garantieren Typsicherheit,
  Autovervollständigung und Refactoring-Sicherheit.
- Balancing-Änderungen dürfen **keine** Logik-Dateien (Kampf-Engine, Stores) berühren.
- Kein JSON — volle TS-Typsicherheit hat Vorrang.
- **Wachstumskurven liegen als vorberechnete Werte je Stufe** im Content, nicht als
  `Math.pow`-Aufrufe zur Laufzeit. Grund: `Math.pow` ist zwischen JS-Engines nicht bit-identisch
  garantiert und würde den Determinismus über Browser hinweg aufweichen (§5).

---

## 5. Game-Loop & Kampf

### Simulation ≠ Rendering (strikt getrennt)

- Die **Kampf-Engine** (`src/features/combat/combatEngine.ts` o. ä.) ist **reine,
  deterministische Logik**: gleicher Seed + gleicher Input ⇒ exakt gleicher Kampfverlauf.
  Sie hat **keinen** Bezug zu Timern, DOM oder Echtzeit.
- Das **Rendering/Playback** spielt die simulierten Runden mit visueller Verzögerung ab.
- Die Simulation läuft **inkrementell/auf Abruf** (reine „Zustand → nächste Runde"-Funktion),
  **nicht** als Vorab-Komplettberechnung des Kampfes. **Dasselbe Schrittwerk** treibt Playback
  (ein Schritt pro Anzeige-Takt) und Catch-up (Schritte ohne Animation) — daher kein Vorab-Wait
  beim Floor-Einstieg. Ein **Rundenlimit** ist nicht nötig: Jeder Kampf ist endlich (Gegner
  heilen nicht, Gegner-Health sinkt monoton), und die Simulation ist an Echtzeit gebunden
  (eine Runde pro Takt).
- Diese Trennung ist Voraussetzung für Catch-up (siehe unten), Testbarkeit und spätere
  interaktive Eingriffsmechaniken.

### Zufall - seedbarer PRNG (Pflicht)

- **Aller** Zufall im Spiel (Trefferchance, Krit, Schadensstreuung, …) läuft über einen
  **seedbaren PRNG** (`mulberry32`, klein und dependency-frei in `src/shared/utils/`).
  **Kein** `Math.random()` in Spiellogik.
- **Getrennte Ströme, hierarchisch abgeleitet** (SPEC §5.3):
  `saveSeed → runSeed(dungeonId, runCounter) → floorSeed(floorIndex)` mit je einem Strom für
  `combat`, `init` und `loot`. Grund: Bei einem gemeinsamen Strom verschiebt jede Änderung an der
  Kampfformel alle Loot-Ergebnisse und koppelt damit unabhängige Testsuiten aneinander.
  Die Strom-Label sind Teil des Determinismus und liegen als Konstanten an einer Stelle.
- Der `runCounter` wird **beim Run-Start persistiert** — daraus folgen frische Drops beim Farmen
  **und** die Unmöglichkeit von Save-Scumming.
- Vorteile: reproduzierbare Kämpfe (deterministische Tests statt Wertebereich-Asserts),
  aussagekräftige Bug-Reports (`saveSeed, dungeonId, runCounter, floorIndex`), spätere
  Replay-Fähigkeit.

### Zeitverhalten / Catch-up

- **Tab geschlossen ⇒ kein Fortschritt.** Offline-Progress ist ein ausdrückliches **Non-Goal**
  (nicht implementieren, auch nicht "aus Best-Practice-Reflex").
- **Anzeigeeinheit ist der Takt: ein Akteur am Zug**, Grundtakt **1000 ms** (SPEC §5.1). Die
  Geschwindigkeitsstufen (Pause, 2×) leben ausschließlich in der Anzeige-Schicht und dürfen den
  Kampfverlauf nicht berühren.
- **Tab offen, aber minimiert/vom Browser gedrosselt** ⇒ beim Wiederöffnen wird **aufgeholt**.
  Tragend ist ein **Zeit-Akkumulator** (aus real vergangener Zeit die fälligen Takte ableiten);
  die **Page Visibility API** löst das Aufholen nur sofort aus und unterdrückt die Animation.
  Ein Batch arbeitet in einem **Zeitbudget pro Frame** und gibt dazwischen an den Browser ab.
- **Deckel: höchstens 5 Minuten** real vergangener Zeit werden nachgeholt, darüber verfällt sie —
  sonst wäre ein über Nacht minimierter Tab faktisch Offline-Progress.
- **Der laufende Kampfzustand wird nie persistiert** (SPEC §5.4): Ein Reload beendet den Run,
  bereits committete Belohnungen bleiben erhalten.

### Zahlen

- Alle Werte laufen über native `number`. Die Progressions-Achsen sind gedeckelt (Level 100,
  Item-Level `+100`, kein Prestige); die Spitzenwerte liegen bei ~10⁸–10¹⁰ und damit weit unter
  `Number.MAX_SAFE_INTEGER` (~9×10¹⁵). Eine Big-Number-Bibliothek wird bewusst **nicht**
  eingesetzt (ADR-0004).
- **Revisions-Auslöser:** Kommt je eine Progressions-Achse **ohne Cap** hinzu (Prestige,
  Endlos-Modus), ist diese Entscheidung neu zu bewerten.
- Ein Helper in `src/shared/utils/` kapselt die **Formatierung** großer Zahlen für die UI.

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
