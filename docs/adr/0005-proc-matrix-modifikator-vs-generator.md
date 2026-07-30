# ADR-0005: Proc-Matrix — Crit ist Modifikator, Generatoren koppeln nicht

- **Status:** Akzeptiert
- **Datum:** 2026-07-30
- **Betrifft:** SPEC.md §2.1, §2.4, §3.2; GLOSSARY.md; BALANCING.md §3, §5;
  Feature-Ordner `src/features/combat/`

---

## Kontext

Die vier offensiven Muster **Crit**, **Multi Hit**, **Splash** und **Counter** (SPEC §2.1) waren als
Kaskade beschrieben, aber es war nicht festgelegt, **welches Muster welches auslösen darf**. Die
SPEC kannte nur einen Sammelknoten „Per-Hit-Crit", der Grund-, Multi- und Splash-Treffer gemeinsam
auf Crit prüfen ließ. Offen war damit unter anderem:

- Dürfen Multi-Hit-Treffer splashen? Dürfen Splash-Treffer eine Multi-Hit-Kette starten?
- Darf ein Counter Multi Hit oder Splash auslösen?
- Bemisst sich ein erzeugter Treffer am rohen Grundschaden, am Crit-Ergebnis oder am
  Gesamtschaden des Angriffs?

Randbedingungen:

- **Determinismus ist Pflicht** (SPEC §2.5): Die PRNG-Ziehreihenfolge ist Teil der Spezifikation
  und muss als Invariante testbar bleiben.
- **Lesbarkeit ist Pflicht** (DESIGN §3): „erkennbare Procs" und ein Kampf-Log, in dem ein Zug ein
  Block ist (SPEC §5.1).
- Die vier Muster sind je an einen **Skilltree-Zweig** gekoppelt (Finesse/Tempest/Dominance/Valor,
  SPEC §3.2) — die Zweige sollen unterscheidbare Wetten bleiben.
- Ein Gegner-Angriff trifft **jeden** Charakter (SPEC §2.3): Bei sechs Gegnern entstehen bis zu
  **18 Counter-Würfe pro Runde**, gegen 3 reguläre Charakter-Aktionen.

Die Explosionsrechnung bei freier Kopplung (Multi Hit Chain 5, Splash Radius 3):

| Variante                     | Treffer pro Zug                                               |
| ---------------------------- | ------------------------------------------------------------- |
| Kaskade ohne Kopplung        | 1 Grund + 5 Multi + 3 Splash = **9**                          |
| Multi Hits dürfen splashen   | 6 Primärtreffer × bis zu 3 Nebenziele = **bis 18 zusätzlich** |
| Splash-Treffer dürfen ketten | jeder der 18 kettet bis 5 → **über 100**                      |

## Betrachtete Alternativen

- **Option A — Freie Kopplung (Graph):** Jedes Muster kann jedes auslösen.
  - _Pro:_ spektakuläre Ausreißer-Züge; maximale Synergie zwischen Zweigen.
  - _Contra:_ unbeschränkt tiefe PRNG-Ziehreihenfolge, damit als Determinismus-Invariante
    praktisch untestbar; unlesbares Rundenlog; der stärkste Build wäre immer „alle vier Zweige",
    weil sie sich gegenseitig füttern — die Zweig-Identität verschwindet.
- **Option B — Nur Crit erweiterbar, Generatoren koppeln nicht; erzeugte Treffer erben den
  Gesamtschaden des Primärziels.**
  - _Pro:_ feste Trefferzahl; Tempest und Dominance multiplizieren sich, ohne dass ein Generator
    einen anderen auslöst.
  - _Contra:_ **Crit wird doppelt gezählt** — einmal im geerbten Wert, einmal im eigenen Wurf des
    Splash-Treffers (effektiv ×4 auf den Splash). Und die multiplikative Kopplung widerspricht
    genau der Zweig-Identität, die Option A disqualifiziert hat.
- **Option C — Nur Crit erweiterbar; jeder erzeugte Treffer bemisst sich am rohen Grundschaden
  (vor Crit) und würfelt seinen eigenen Crit.**
  - _Pro:_ Crit wird pro Treffer genau einmal gezählt, ohne jede Vererbung; jeder Zweig skaliert
    aus eigener Kraft; feste Baumtiefe; kürzeste und vollständig festgelegte PRNG-Sequenz.
  - _Contra:_ die Zweige verzahnen sich nicht mehr multiplikativ — Cross-Branch-Synergie muss über
    die Crit-Erweiterungs-Knoten entstehen statt über Schadensweitergabe.

Zahlenvergleich (Grundschaden 100, Crit ×2, Chain 5, Multi Hit Damage 50 %, Splash Damage 30 %,
Radius 3, alles crittet):

| Variante                             | Splash-Basis | Splash-Ausstoß | Angriff gesamt    |
| ------------------------------------ | ------------ | -------------- | ----------------- |
| B (Gesamtschaden inkl. Multi + Crit) | 700          | 1260           | **1960** (19,6 ×) |
| Grundtreffer **inkl.** Crit          | 200          | 360            | **1060** (10,6 ×) |
| C (Grundtreffer **vor** Crit)        | 100          | 180            | **880** (8,8 ×)   |

## Entscheidung

Wir nutzen **Option C**, formuliert als zwei verbindliche Regeln plus eine Einheitsregel:

1. **Crit ist ein Modifikator** — es multipliziert einen Treffer und erzeugt keinen. **Multi Hit**,
   **Splash** und **Counter** sind **Generatoren** — sie erzeugen Treffer.
2. **Generatoren lösen einander nie aus.** Die Treffererzeugung ist ein Baum **fester Tiefe**.
3. **Jeder erzeugte Treffer bemisst sich am rohen Grundschaden vor Crit** und würfelt **seinen
   eigenen** Crit-Wurf, sofern der zugehörige Knoten freigeschaltet ist.

Daraus folgen vier konkrete Festlegungen:

- Der Sammelknoten „Per-Hit-Crit" wird durch **drei getrennte Knoten** ersetzt, je im Zweig des
  **Generators**: Multi-Hit-Crit in **Tempest**, Splash-Crit in **Dominance**, Counter-Crit in
  **Valor**. Damit zieht jeder Zweig aus eigener Kraft zu Finesse hin, statt Finesse für alle
  Builds zur Pflicht zu machen.
- **Crit Damage ist ein Gesamt-Multiplikator** (`200 %` = `× 2,0`), neutral bei `100 %`.
- Die **Waffen-Damage-Range wird einmal pro Angriff** gewürfelt (nicht pro Treffer) — es gibt genau
  einen rohen Grundschaden pro Zug, an dem sich alles bemisst.
- **Der Counter ist ein Flat-Hit** auf den auslösenden Gegner (ignoriert Frontline-Lock und Taunt),
  ohne Multi Hit und ohne Splash, crittbar per Valor-Knoten, aufgelöst gesammelt nach der
  Team-Pipeline in Slot-Reihenfolge.

## Konsequenzen

- **Positiv:** Die PRNG-Ziehreihenfolge ist vollständig festgelegt und flach (`Damage-Range` →
  `Crit` → je Kettenstufe `Multi Hit Chance` → `Crit` → `Splash Chance` → je Nebenziel `Crit`) und
  damit als Invariante testbar. Ein Zug bleibt ein lesbarer Log-Block. Jeder Zweig behält ein
  eigenes Profil, und Valor bekommt mit dem Backline-Zugriff eine Rolle, die kein anderer Zweig
  bietet. Crit ist nirgends doppelt gezählt.
- **Negativ / Kompromisse:** Keine spektakulären Kettenreaktionen; die Zweige verzahnen sich
  schwächer. Die verbleibende Multiplikation liegt **innerhalb** eines Zweigs (in Tempest z. B.
  Multi Hit Chance × Chain, was eine Reihenfolge-Entscheidung im Zweig erzeugt).
- **Folgt daraus:** Der Klammersatz in SPEC §2.1, nach dem der Bulwark-Malus vom Primärziel
  „indirekt vererbt" wird, entfällt. **Jeder Treffer wendet den Bulwark-Malus seines eigenen Ziels
  an** — einfacher und sachlich richtiger, weil ein Splash auf ein Backline-Ziel von dessen Deckung
  gemindert werden soll. Sunder (SPEC §3.5) wirkt dadurch pro Ziel korrekt.
- **Folgt daraus:** Ebenfalls entschieden, dass der Counter **kein Sustain** auslöst — der Stat
  wurde in derselben Runde gestrichen (SPEC §2.6, Sapphire-Pool auf vier Affixe), womit die Frage
  entfällt.
- **Folgt daraus:** SPEC.md §2.1 (neu strukturiert), §2.4, §3.2 sowie GLOSSARY.md und BALANCING.md
  entsprechend aktualisiert.
