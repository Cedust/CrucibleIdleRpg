# AGENTS.md — Crucible Idle RPG

Verbindlicher Leitfaden für AI-Agenten und Entwickler in diesem Repository.
Interne Dokumentation und Code-Kommentare sind auf **Deutsch**, sämtliche
**Spieltexte (UI + Content) auf Englisch**.

### Weitere Dokumentation (`docs/`)

Diese Datei ist die lebende Quelle für **technische Konventionen und Arbeitsweise**.
Das Spiel selbst ist unter [`docs/`](docs/) dokumentiert. Einstieg ist
[`docs/README.md`](docs/README.md); wer Dokumentation schreibt oder ändert, liest
dort zuerst Stil-, Verweis- und Pflegepflichten.

### Präzedenz bei Konflikten

| Frage                                                              | Verbindlich                                                 |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Was das Spiel tut** — Regeln, Formeln, Zustände, Save-Verhalten  | [`docs/SPEC.md`](docs/SPEC.md) + [`docs/spec/`](docs/spec/) |
| **Wie wir es bauen** — Stack, Struktur, Tooling, Workflow, Do-NOTs | **AGENTS.md** (diese Datei)                                 |
| **Welche Zahl** ein Tuning-Wert hat                                | Content unter `src/game/`                                   |

DESIGN, BALANCING, GLOSSARY und ADRs liefern Kontext, Begründungen und Historie;
bei Spielverhalten sind sie der SPEC nachgeordnet. Diese Datei wiederholt keine
Spielregeln, sondern nennt die technischen Konsequenzen und verlinkt ihren Wohnort.

---

## 1. Projektüberblick

**Crucible Idle RPG** ist eine client-only React-SPA ohne Backend. Den Spielkern und
die bewussten Produktgrenzen beschreiben [`docs/DESIGN.md`](docs/DESIGN.md) und
[`docs/SPEC.md`](docs/SPEC.md); Agents leiten daraus keine zusätzlichen Features ab.

---

## 2. Tech-Stack

| Bereich          | Wahl                                |
| ---------------- | ----------------------------------- |
| Framework        | React 19 mit React Compiler         |
| Sprache          | TypeScript 5, strict                |
| Build            | Vite                                |
| Styling          | Tailwind CSS v4, CSS-first `@theme` |
| State            | Zustand                             |
| Zahlen           | native `number`                     |
| Save-Validierung | Zod                                 |
| Package Manager  | npm                                 |
| Node             | ≥ 24 (`package.json`, `.nvmrc`)     |

`package.json` und die jeweiligen Konfigurationsdateien sind für Versionen und
konkrete Tool-Einstellungen maßgeblich. Projektbefehle werden über die vorhandenen
npm-Skripte ausgeführt, nicht als abweichende Rohbefehle nachgebaut.

---

## 3. Projektstruktur

Der Code ist feature-basiert geschnitten:

```text
src/
  features/   # Fachliche Features mit Komponenten, Hooks, Stores und Tests
  game/       # Deklarativer, typisierter Balancing-Content
  shared/
    ui/       # Feature-übergreifende UI-Primitives
    ports/    # Austauschbare technische Schnittstellen
    utils/    # Reine, generische Helfer
```

- Verwandter Code lebt gemeinsam im jeweiligen Feature-Ordner.
- Dateien tragen sprechende Namen wie `CombatScreen.tsx`, `combatEngine.ts` oder
  `combatStore.ts`; keine generischen `index.ts`- oder `Component.tsx`-Dateien.
- Pfad-Alias: **`@/` → `src/`**.

---

## 4. Content & Balancing

- Charaktere, Gegner, Formationen und Wachstumskurven werden als deklarative,
  typisierte TypeScript-Module unter `src/game/` definiert, getrennt von Spiellogik
  und Stores.
- Balancing-Änderungen berühren ausschließlich Content unter `src/game/`; Struktur
  und Verhalten der Formeln folgen der SPEC.
- Kein JSON für Balancing-Content. Gemeinsame Interfaces sichern die Typgrenzen.
- Wachstumskurven liegen als vorberechnete Werte je Stufe vor. Keine laufzeitige
  Berechnung dieser Kurven mit `Math.pow`; Begründung und Kurvenmodell stehen in
  [`docs/BALANCING.md`](docs/BALANCING.md).

---

## 5. Architektur des Game-Loops

Verbindliches Verhalten steht in
[`docs/spec/SIMULATION.md`](docs/spec/SIMULATION.md) und
[`docs/spec/COMBAT.md`](docs/spec/COMBAT.md).

### Simulation ≠ Rendering (strikt getrennt)

- Die Kampf-Engine ist reine Logik: keine Timer, kein DOM, kein `Date.now()` und
  kein Zugriff auf Stores.
- Sie arbeitet schrittweise als **Zustand → nächster Schritt**. Playback und Catch-up
  verwenden dasselbe Schrittwerk; es gibt keine zweite Simulationsbahn.
- Darstellung, Playback-Geschwindigkeit und View-Wechsel verändern niemals den
  Kampfverlauf.

### Zufall — seedbarer PRNG (Pflicht)

- Spiellogik verwendet ausschließlich den bestehenden seedbaren PRNG unter
  `src/shared/utils/`.
- Strom-Labels werden nur über die zentrale `PRNG_STREAM`-Konstante verwendet, nie
  als verteilte String-Literale.
- Seed-Hierarchie, Ströme und Ziehreihenfolge sind Spielverhalten. Dafür gelten die
  SPEC und ihre Test-Vektoren; zusätzliche oder entfallene Würfe benötigen passende
  deterministische Tests.

### Zeitverhalten

Playback und Catch-up folgen ausschließlich
[`docs/spec/SIMULATION.md`](docs/spec/SIMULATION.md). Die Anzeige-Schicht leitet
fällige Schritte aus real vergangener Zeit ab und gibt bei längeren Batches regelmäßig
an den Browser zurück; sie implementiert keine eigene Kampfberechnung.

### Zahlen

- Spiellogik verwendet native `number`.
- Große Zahlen werden über den gemeinsamen Helper in `src/shared/utils/` formatiert.

---

## 6. State-Management (Zustand)

- Zentraler Spielzustand liegt in fachlich geschnittenen Zustand-Stores.
- Hochfrequente Updates werden über selektive Subscriptions und Selectors konsumiert.
- Ansichtswechsel laufen über einen State-basierten View-Switch, nicht über einen
  Router. Laufzeit-State wie ein aktiver Kampf lebt außerhalb der View-Komponenten und
  bleibt beim Wechsel erhalten.

---

## 7. Persistenz & Robustheit

Wann gespeichert wird und was im Save liegt, regelt
[`docs/spec/PERSISTENCE.md`](docs/spec/PERSISTENCE.md).

- Persistenzzugriff erfolgt ausschließlich über den `SavePort` unter
  `src/shared/ports/`; die aktuelle Implementierung verwendet `localStorage`.
- Saves werden als versioniertes JSON gespeichert und über explizite Migrationen
  weiterentwickelt.
- Für jede Save-Version existiert ein Zod-Schema. Geladene Daten werden vor der
  Übernahme validiert; Fehler führen zu einem definierten Fallback, nicht zu korruptem
  Store-State oder einem unkontrollierten Absturz.
- React Error Boundaries stellen bei Renderfehlern einen brauchbaren Fallback bereit.
  Externe Telemetrie wird nicht eingeführt.

---

## 8. UI, Styling & Accessibility

- Nur Dark Mode. Design-Tokens liegen in Tailwind v4 `@theme`.
- Plain Tailwind und eigene Primitives unter `src/shared/ui/`; keine externe
  Komponentenbibliothek und kein CSS-in-JS.
- Interaktive UI verwendet semantisches HTML, ist per Tastatur bedienbar und wahrt
  ausreichende Farbkontraste.
- Laufzeitberechnete Inline-Styles sind nur in der engen Ausnahme aus §14 erlaubt.

---

## 9. TypeScript-Konfiguration

- Die TypeScript-Konfiguration bleibt strikt; insbesondere gelten `strict` und
  `noUncheckedIndexedAccess`.
- Indexzugriffe werden deshalb als möglicherweise `undefined` behandelt und explizit
  geprüft. Keine Non-Null-Behauptung nur zur Umgehung dieser Prüfung.
- Neue Module unter `src/` verwenden benannte Exports. Konfigurationsdateien dürfen
  den von ihrem Tool erwarteten Default Export verwenden.

---

## 10. Tests

- Vitest und React Testing Library decken Unit- und Component-Verhalten ab;
  Playwright ist für kritische Ende-zu-Ende-Flows vorgesehen.
- Neue oder geänderte Spiellogik erhält deterministische Unit-Tests aus SPEC und
  Akzeptanzkriterien. Zufall wird mit festem Seed oder gestelltem PRNG geprüft.
- UI-Tests prüfen beobachtbares Verhalten aus Benutzersicht und schreiben keine
  unnötigen Implementierungsdetails fest.
- Für reine Doku-, Formatierungs- oder mechanische Änderungen werden keine
  künstlichen Verhaltenstests erzeugt.

---

## 11. Entwicklungs-Workflow (für Agenten verbindlich)

### Woher die Arbeit kommt

- Reihenfolge und Status stehen in [`docs/backlog/ROADMAP.md`](docs/backlog/ROADMAP.md),
  der konkrete Auftrag in [`docs/backlog/tasks/`](docs/backlog/tasks/). Format und
  Status-Vokabular erklärt [`docs/backlog/README.md`](docs/backlog/README.md).
- [`docs/backlog/OPEN_ISSUES.md`](docs/backlog/OPEN_ISSUES.md) enthält unentschiedene
  Fragen, keine Arbeitsaufträge. Nichts daraus wird ohne konkrete Entscheidung und
  priorisierten Task implementiert.
- Ein Task verlinkt seine verbindlichen Regeln, ist aber selbst keine Regelquelle. Bei
  Widerspruch gilt die SPEC.
- Fehlt eine Regel, wird sie nicht erfunden: offene Frage dokumentieren und Task auf
  `blocked` setzen.
- Innerhalb eines Tasks wird von unten nach oben gebaut: reine Logik und Unit-Tests,
  danach Store und Integration, zuletzt UI.

### Umsetzungs- und Review-Ablauf

- Roadmap-Tasks folgen vollständig dem projektlokalen
  [`next-task`-Workflow](.agents/skills/next-task/SKILL.md).
- Vorbestehende staged, unstaged und ungetrackte Änderungen werden nicht überschrieben
  oder ungefragt in den Task aufgenommen.
- Review-Findings werden vom Main Agent gegen Task, SPEC, Code und Tests verifiziert;
  bestätigte Findings werden vor Abschluss behoben und erneut geprüft.
- Ohne ausdrücklichen Auftrag wird weder gepusht noch ein Pull Request geöffnet.

### Definition of Done

Vor Abschluss laufen alle für die Änderung anwendbaren Checks über die vorhandenen
npm-Skripte:

| Änderung                      | Pflichtcheck         |
| ----------------------------- | -------------------- |
| alle Codeänderungen           | `npm run lint`       |
| TypeScript, Config oder Build | `npm run typecheck`  |
| Verhalten oder Spiellogik     | `npm test`           |
| Build-relevante Änderungen    | `npm run build`      |
| Änderungen an `*.md`          | `npm run docs:links` |
| kritischer Browser-Flow       | `npm run test:e2e`   |

Ein fokussierter Browser-Smoke-Test ist bei sichtbaren UI-Änderungen zusätzlich
empfohlen. Ein Task gilt erst als abgeschlossen, wenn Akzeptanzkriterien, anwendbare
Checks und bestätigte Review-Findings erledigt sind. Commits verwenden Conventional
Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`, …).

---

## 12. CI/CD

Die aktuelle Pipeline liegt unter `.github/workflows/` und ist für ihre konkrete
Konfiguration maßgeblich. Deployment wird nur über einen dafür vorgesehenen
Roadmap-Task eingeführt; ein GitHub-Pages-Deploy berücksichtigt den Repository-`base`-Pfad
in Vite.

---

## 13. Non-Goals (bewusst nicht umsetzen)

Die autoritativen Produkt-Non-Goals stehen in
[`docs/DESIGN.md`](docs/DESIGN.md) und der SPEC. Ohne ausdrückliche Änderung dieser
Quellen und einen passenden Task führen Agents insbesondere Folgendes nicht ein:

- Offline-Progress oder passive Ressourcengenerierung außerhalb des Kampfes
- Router oder URL-adressierbare Views
- externe Fehler-Telemetrie
- i18n-Infrastruktur
- Light- oder System-Theme

---

## 14. Do NOT

- Kein `any`, kein Abschwächen der TypeScript-Strenge und keine pauschalen
  Type-/Lint-Unterdrückungen.
- Keine neuen Dependencies ohne vorherige Abstimmung.
- Kein `Math.random()` in Spiellogik; den seedbaren PRNG verwenden.
- Keine Default Exports in Anwendungscode unter `src/`.
- Keine Inline-Styles oder CSS-in-JS. Einzige Ausnahme ist genau eine kontinuierliche,
  zur Laufzeit berechnete Eigenschaft ohne endliche Klassenmenge, beispielsweise die
  Breite eines Health-Bars von 0–100 %. Alle übrigen Eigenschaften des Elements bleiben
  Tailwind-Klassen.
