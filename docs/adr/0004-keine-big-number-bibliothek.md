# ADR-0004: Keine Big-Number-Bibliothek — native `number`

- **Status:** Akzeptiert
- **Datum:** 2026-07-30
- **Betrifft:** AGENTS.md §2, §4, §5; SPEC.md §2.5; BALANCING.md; `package.json`;
  `src/shared/utils/bigNumber.ts`

---

## Kontext

Der Stack führte **break_eternity.js** als gesetzte Abhängigkeit für „große Zahlen", mit einem
dünnen Wrapper in `src/shared/utils/bigNumber.ts`. BALANCING §5 hielt dazu eine offene Frage: Da
alle Achsen cappen, sei zu prüfen, ob die steilste Kombination `Number.MAX_SAFE_INTEGER` überhaupt
noch reißt.

Die Rechnung dazu:

- **Grenzwert:** `Number.MAX_SAFE_INTEGER` = 9.007.199.254.740.991 ≈ **9 × 10¹⁵**.
- **Zielgröße laut DESIGN §3:** „Attack von 10 → 10.000 → **100.000.000**", also **10⁸**.
- **Steilster Einzelwert:** Attack 10⁸ × Damage-Range (1,1) × Crit (×5) ≈ 5 × 10⁸;
  Boss-Health muss mithalten, also 10⁹–10¹⁰.
- **Abstand zum Limit: Faktor ~10⁶.** Selbst drei Größenordnungen Überschuss im Balancing bleiben
  gefahrlos.
- Kumulierte Ressourcen bleiben klar darunter (ein Gold-Hort aus zehntausend Farm-Runs ≈ 10¹¹).

Randbedingungen, die die Achsen deckeln: Level 100, Attributpunkte 100, Skillpunkte 100, Item-Level
`+100`, Gem-Level durch die Seltenheit gedeckelt, **kein Prestige** (SPEC §4.7).

Zwei weitere Faktoren:

- **Heißer Pfad:** Mit `Decimal` wird jede Rechenoperation ein Methodenaufruf, der ein Objekt
  anlegt. Die Kampf-Engine rechnet pro Catch-up-Batch tausende Operationen, und zwar innerhalb
  eines Frame-Zeitbudgets (AGENTS §5). Nativer `number` erzeugt dort keinen GC-Druck.
- **Aktueller Stand:** `break_eternity.js` wurde ausschließlich in `bigNumber.ts` importiert und
  sonst nirgends verwendet. Der Ausbau ist heute ein Einzeiler, später eine Operation am ganzen
  Codebestand.

## Betrachtete Alternativen

- **Option A — break_eternity.js behalten.**
  - _Pro:_ vorsorgliche Freiheit, falls später eine unbegrenzte Achse entsteht; keine Migration.
  - _Contra:_ trägt Kosten (Objekt-Allokation im heißesten Pfad, umständlichere Zod-Schemata und
    Migrationen für den Save, unhandlichere Arithmetik) für einen Puffer, der nach der Rechnung um
    sechs Größenordnungen ungenutzt bleibt.
- **Option B — native `number`, Bibliothek streichen.**
  - _Pro:_ deutlich billiger im heißen Pfad; einfacheres Save-Schema; lesbare Arithmetik; heute
    kostenlos umsetzbar.
  - _Contra:_ eine spätere Rückkehr ist teuer, weil Arithmetik dann über den Code verteilt ist.
- **Option C — eigener minimaler Wrapper mit Umschaltoption.**
  - _Pro:_ hielte den Wechsel offen.
  - _Contra:_ Abstraktion auf Vorrat für einen Fall, der laut Non-Goals (kein Prestige, alle Achsen
    gedeckelt) gar nicht eintreten soll. Alle Rechenausdrücke wären dauerhaft umständlich.

## Entscheidung

Wir nutzen **Option B: native `number`. `break_eternity.js` wird entfernt.**

`src/shared/utils/bigNumber.ts` bleibt als reiner **Formatierer** für die UI erhalten — die
Formatierungsregeln sind eine eigene, vom Zahlentyp unabhängige Frage.

**Revisions-Auslöser:** Kommt je eine Progressions-Achse **ohne Cap** hinzu (Prestige-Loop,
Endlos-Modus), ist diese Entscheidung neu zu bewerten.

## Konsequenzen

- **Positiv:** Kein Allokations-Overhead in der Kampf-Engine und im Catch-up-Batch; einfachere
  Zod-Schemata und Save-Migrationen; direkt lesbare Formeln; eine Abhängigkeit weniger.
- **Negativ / Kompromisse:** Eine Rückkehr zu Decimal-Arithmetik wäre invasiv. Wir zahlen diesen
  Preis bewusst, weil die dafür nötige unbegrenzte Achse ein ausdrückliches Non-Goal ist.
- **Folgt daraus:** Ein **Determinismus-Detail** wird mitentschieden: Float64-Arithmetik ist für
  `+ − × ÷` nach IEEE 754 plattformübergreifend bit-identisch, `Math.pow` und verwandte Funktionen
  sind es **nicht** garantiert. Die exponentiellen Kurven (Item-Level, Gegner-Health) werden daher
  als **vorberechnete Werte je Stufe** im Content unter `src/game/` abgelegt statt zur Laufzeit
  gerechnet — was AGENTS §4 ohnehin fordert und die Kurven nebenbei diffbar macht.
- **Folgt daraus:** AGENTS.md §2 (Tech-Stack-Tabelle), §4 (Kurven als Tabellen) und §5 (Abschnitt
  „Zahlen") aktualisiert; SPEC.md §2.5 und BALANCING.md entsprechend; die offene Frage in
  BALANCING §5 entfällt.
- **Hinweis:** ADR-0002 nennt break_eternity.js in seinem Kontext-Abschnitt. Als
  Momentaufnahme bleibt er unverändert; seine Entscheidung (inkrementelle Simulation, kein
  Rundenlimit) ist von dieser hier unberührt.
