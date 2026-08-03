# AGENTS.md — Crucible Idle RPG

Leitfaden für AI-Agenten und Entwickler, die an diesem Projekt arbeiten.
Diese Datei beschreibt **verbindliche Konventionen**. Interne Dokumentation und
Code-Kommentare sind auf **Deutsch**, sämtliche **Spieltexte (UI + Content) auf Englisch**.

### Weitere Dokumentation (`docs/`)

Diese Datei ist die **lebende Quelle für technische Konventionen**: Stack, Projektstruktur,
Werkzeuge, Arbeitsweise. Das Spiel selbst ist unter [`docs/`](docs/) dokumentiert.

**Einstieg dort: [`docs/README.md`](docs/README.md)** — Landkarte aller Doku-Dateien
(DESIGN, SPEC + [`docs/spec/`](docs/spec/), BALANCING, GLOSSARY, Backlog, ADRs), **Dokumentations-Stil**,
Verweis-/Anker-Konvention und die Pflichten bei Doku-Änderungen. Wer Doku schreibt oder ändert,
liest diese Datei zuerst.

### Präzedenz bei Konflikten

| Frage                                                              | Verbindlich                                                 |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Was das Spiel tut** — Regeln, Formeln, Zustände, Save-Verhalten  | [`docs/SPEC.md`](docs/SPEC.md) + [`docs/spec/`](docs/spec/) |
| **Wie wir es bauen** — Stack, Struktur, Tooling, Workflow, Do-NOTs | **AGENTS.md** (diese Datei)                                 |
| **Welche Zahl** ein Tuning-Wert hat                                | Content unter `src/game/`                                   |

Diese Datei beschreibt Spielverhalten daher **nicht** — sie nennt nur die technische Konvention
und verlinkt die Regel. Steht Spielverhalten trotzdem doppelt, gilt die **SPEC**; Glossar und
ADRs sind der SPEC ebenfalls nachgeordnet.

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

| Bereich          | Wahl                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Framework        | React 19 **mit React Compiler** (automatische Memoisierung)                                |
| Sprache          | TypeScript 5, **strict mode** (siehe [§9](#9-typescript-konfiguration))                    |
| Build-Tool       | Vite                                                                                       |
| Styling          | **Tailwind CSS v4** (CSS-first `@theme`, `@tailwindcss/vite`)                              |
| State-Management | **Zustand**                                                                                |
| Zahlen           | native `number` — **keine** Big-Number-Lib ([§5](#5-architektur-des-game-loops), ADR-0004) |
| Validierung      | **Zod** (nur Save-Laufzeitvalidierung, siehe [§7](#7-persistenz--robustheit))              |
| Package Manager  | **npm**                                                                                    |
| Node             | **≥ 24** (`engines` in `package.json`, `.nvmrc`)                                           |

### Tooling

- **Lint/Format**: ESLint (Flat Config) + Prettier
  - aktive Plugins u. a.: `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`
  - Prettier = reine Formatierung, ESLint = Code-Qualität
- **Tests**: Vitest + React Testing Library (Unit/Component), Playwright (E2E)
- **Doku**: `npm run docs:links` prüft alle relativen Markdown-Links auf tote Dateien und Anker
  ([`scripts/check-doc-links.js`](scripts/check-doc-links.js), dependency-frei). Die Doku lebt von
  dichten Querverweisen — ohne den Check verrotten Anker still, sobald eine Überschrift umbenannt
  wird. Läuft über das **ganze** Repo, nicht nur über geänderte Dateien.
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
  garantiert und würde den Determinismus über Browser hinweg aufweichen
  ([§5](#5-architektur-des-game-loops)).

---

## 5. Architektur des Game-Loops

Wie sich der Kampf **verhält**, steht in
[`docs/spec/SIMULATION.md`](docs/spec/SIMULATION.md) und
[`docs/spec/COMBAT.md`](docs/spec/COMBAT.md). Hier stehen die **Bauvorschriften**, die dieses
Verhalten überhaupt erreichbar machen.

### Simulation ≠ Rendering (strikt getrennt)

- Die **Kampf-Engine** (`src/features/combat/combatEngine.ts` o. ä.) ist **reine Logik**: keine
  Timer, kein DOM, kein `Date.now()`, kein Zugriff auf Stores. Nur so ist sie deterministisch
  testbar.
- Sie exponiert eine **„Zustand → nächster Schritt"-Funktion** und rechnet **keinen** Kampf
  vorab durch. **Dasselbe Schrittwerk** bedient Playback und Catch-up — es gibt keine zweite
  Code-Bahn für den Schnelldurchlauf.
- Das **Playback** liegt in der Anzeige-Schicht und darf den Kampfverlauf nicht berühren:
  Geschwindigkeitsstufen ändern die Darstellung, nie das Ergebnis.
- Diese Trennung ist Voraussetzung für Catch-up, Testbarkeit und spätere interaktive
  Eingriffsmechaniken.

### Zufall — seedbarer PRNG (Pflicht)

- **Aller** Zufall der Spiellogik läuft über den **seedbaren PRNG** (`mulberry32`, klein und
  dependency-frei in `src/shared/utils/`). **Kein** `Math.random()` in Spiellogik
  ([§14](#14-do-not)).
- Die Seed-Hierarchie und die **getrennten Ströme** (`combat`, `init`, `loot`) sind
  Spielverhalten und in
  [Seeds und Zufalls-Ströme](docs/spec/SIMULATION.md#4-seeds-und-zufalls-ströme) festgelegt. Konvention hier:
  Die **Strom-Label sind Konstanten an genau einer Stelle** — sie gehören zum Determinismus, ein
  Tippfehler im Label ist ein stiller Verhaltensbruch.
- **Die Ziehreihenfolge ist Teil der Spezifikation**
  ([Charakter-Zug](docs/spec/COMBAT.md#21-charakter-zug-ausgehender-schaden)). Ein zusätzlicher oder
  entfallener Wurf ändert jeden Folgekampf — beim Umbau der Kampfformel sind die
  Test-Vektoren der SPEC die Referenz.

### Zeitverhalten

- Tragend ist ein **Zeit-Akkumulator** (aus real vergangener Zeit die fälligen Takte ableiten);
  die **Page Visibility API** ist nur Beschleuniger, nicht Grundlage. Ein Catch-up-Batch arbeitet
  in einem **Zeitbudget pro Frame** und gibt dazwischen an den Browser ab.
- Takt-Länge, Geschwindigkeitsstufen und der Catch-up-Deckel sind Spielverhalten:
  [Playback](docs/spec/SIMULATION.md#2-playback--takt-und-geschwindigkeit) /
  [Catch-up](docs/spec/SIMULATION.md#3-zeitverhalten--catch-up).
- **Offline-Progress ist ein Non-Goal** ([§13](#13-non-goals-bewusst-nicht-umsetzen)) — nicht implementieren, auch nicht „aus
  Best-Practice-Reflex".

### Zahlen

- Alle Werte laufen über native `number`; eine Big-Number-Bibliothek wird bewusst **nicht**
  eingesetzt (ADR-0004). Die Progressions-Achsen sind gedeckelt, die Spitzenwerte liegen bei
  ~10⁶–10⁷ (ADR-0007) und damit weit unter `Number.MAX_SAFE_INTEGER` (~9×10¹⁵).
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

**Wann** gespeichert wird und **was** im Save liegt, steht in
[Persistenz](docs/spec/PERSISTENCE.md). Hier steht, **womit**.

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

### Woher die Arbeit kommt

- Die **Reihenfolge** steht in [`docs/backlog/ROADMAP.md`](docs/backlog/ROADMAP.md), der
  einzelne Auftrag in [`docs/backlog/tasks/`](docs/backlog/tasks/). Ein Task = eine
  Agenten-Session = ein PR; Format, Status-Vokabular und Arbeitsweise stehen in
  [`docs/backlog/README.md`](docs/backlog/README.md).
- Ein Task **verlinkt** die Regeln, gegen die er gebaut wird — er ist keine Regelquelle. Bei
  Widerspruch gilt die SPEC ([§ Präzedenz](#präzedenz-bei-konflikten)).
- Innerhalb eines Tasks wird **von unten nach oben** gebaut: reine, seedbare Logik mit
  Unit-Tests, dann Store, dann UI ([§5](#5-architektur-des-game-loops), [§10](#10-tests)).
- Fehlt eine Regel, wird sie nicht erfunden: Eintrag in
  [`docs/backlog/OPEN_ISSUES.md`](docs/backlog/OPEN_ISSUES.md), Task auf `blocked`.

### Umsetzungs- und Review-Ablauf

- Roadmap-Tasks folgen dem projektlokalen
  [`next-task`-Workflow](.agents/skills/next-task/SKILL.md): Auftrag und Quellen klären,
  passende Teststrategie festlegen, von unten nach oben implementieren, selbst validieren,
  unabhängig reviewen und erst danach abschließen.
- Der Review wird risikobasiert skaliert: triviale verhaltensneutrale Änderungen erhalten einen
  fokussierten Selbstreview, nicht triviale Codeänderungen mindestens einen unabhängigen
  read-only Review und risikoreiche oder querschnittliche Änderungen mehrere spezialisierte
  read-only Reviews.
- Der Main Agent prüft jedes Finding selbst gegen Task, SPEC, Code und Tests. Bestätigte Findings
  werden vor Abschluss bearbeitet und die betroffenen Checks danach erneut ausgeführt; Findings
  werden nie ungeprüft übernommen.

### Definition of Done

Bevor eine Aufgabe als **erledigt** gilt, müssen lokal **grün** sein:

1. **Lint** (ESLint)
2. **Typecheck** (`tsc --noEmit`)
3. **Tests** (Vitest; relevante Suites)
4. **Build** (Vite) - bei Änderungen mit Build-Relevanz
5. **Doc-Links** (`npm run docs:links`) - bei Änderungen an `*.md` (läuft auch im pre-commit-Hook)
6. **Browser Smoke Test** (Playwright) - optional, aber empfohlen

### Weiteres

- Commits im **Conventional-Commits**-Format.
- Neue/geänderte Spiellogik ⇒ zugehörige Tests aktualisieren/ergänzen.
- Balancing-Änderungen nur unter `src/game/`, ohne Logik-Dateien zu berühren.
- Spieltexte **Englisch**, Kommentare/Doku **Deutsch**.

---

## 12. CI/CD

- **GitHub Actions** bei Push/PR: **Doc-Links · Lint · Typecheck · Vitest · Build**.
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
