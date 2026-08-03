# ADR-0006: Multi-Hit-Kette — garantierte Länge mit abklingendem Schaden

- **Status:** Akzeptiert
- **Datum:** 2026-07-31
- **Betrifft:** SPEC spec/COMBAT.md §2.1; spec/CHARACTERS.md §2, §4; spec/ITEMS.md §8;
  BALANCING.md §3; DESIGN.md §3.2; GLOSSARY.md; ergänzt ADR-0005 in der PRNG-Ziehreihenfolge;
  Feature-Ordner `src/features/combat/`

---

## Kontext

Die Multi-Hit-Kette (SPEC spec/COMBAT.md §2.1, Schritt 3) war als wiederholter Wurf modelliert:
Mit _Multi Hit Chance_ `p` wird auf einen Zusatztreffer geprüft, bei Erfolg erneut, bis zu
_Multi Hit Chain_ `C`-mal, Abbruch beim ersten Fehlwurf. Alle Kettentreffer waren gleich stark
(_Multi Hit Damage_ als Anteil des rohen Grundschadens).

Der Erwartungswert der Kette ist damit `Σₖ₌₁..C pᵏ`, der Grenzertrag eines zusätzlichen
Chain-Punktes `p^(C+1)`:

| `p`  | Chain 1→2 | 2→3    | 3→4    | 4→5    |
| ---- | --------- | ------ | ------ | ------ |
| 0.30 | +0.09     | +0.027 | +0.008 | +0.002 |
| 0.60 | +0.36     | +0.216 | +0.130 | +0.078 |
| 0.90 | +0.81     | +0.729 | +0.656 | +0.590 |

Bei `p = 0.30` tragen die Chain-Stufen 3, 4 und 5 zusammen **3,7 %** des Zweigertrags. Der Zweig
enthält damit eine Investition, deren Wert um mehr als zwei Größenordnungen schwankt, ohne dass
der Spieler den Zusammenhang sieht: Die Anzeige nennt „Chain 5", das Kampflog zeigt fast nie mehr
als einen Zusatztreffer. Skillpunkte sind frei im Baum verteilbar (SPEC spec/CHARACTERS.md §4),
die Reihenfolge also nicht erzwungen.

Randbedingungen:

- **Determinismus ist Pflicht** (SPEC spec/COMBAT.md §2.5): Die PRNG-Ziehreihenfolge ist Teil der
  Spezifikation. Im Wurf-Modell hängt die **Anzahl** der Züge eines Angriffs vom Ergebnis der
  vorherigen Züge ab (`1` bis `2C` Züge, je nach Kettenverlauf).
- **Lesbarkeit ist Pflicht** (DESIGN.md §3): erkennbare Procs, ein Zug als Log-Block.
- Die Reihenfolge-Entscheidung im Zweig ist **erwünscht** (DESIGN.md §3.2) — sie soll eine
  sichtbare Progression sein, keine verdeckte Fehlinvestition.
- Der Kampf läuft vollständig automatisch ab (SPEC spec/COMBAT.md §1): Der Spieler löst keine
  Angriffe aus und verfolgt keine Einzelwürfe.

## Betrachtete Alternativen

- **Option A — Wurf-Modell beibehalten, Chain-Knoten hinter Chance-Schwellen im Baumpfad.**
  Chain 3 erfordert _Multi Hit Chance_ ≥ 50 %, Chain 5 ≥ 75 %.
  - _Pro:_ keine Formeländerung; die Fehlinvestition ist strukturell ausgeschlossen.
  - _Contra:_ löst die Sichtbarkeit nicht, sondern nimmt die Entscheidung weg — die
    Reihenfolge-Entscheidung aus DESIGN.md §3.2 entfällt. Die datenabhängige Zuglänge bleibt.
- **Option B — Chance-Verfall über einen eigenen Stat.** Erster Zusatztreffer mit
  _Multi Hit Chance_, jeder weitere mit _Multi Hit Chain Factor_ `f`. Kette endet beim ersten
  Fehlwurf. Ertrag `p × (1 − f^C)/(1 − f)`.
  - _Pro:_ Der Chain-Wert wird über einen eigenen, im Skilltree steuerbaren Stat entkoppelt.
  - _Contra:_ Die Kettenlänge bleibt zufällig, die Zuglänge datenabhängig (`1` bis `2C` Züge), die
    Varianz hoch. Der Grenzertrag `p·f^(C−1)` bleibt bei niedrigem `f` unsichtbar klein.
- **Option C — Schadens-Verfall bei garantierter Länge.** Ein Wurf mit _Multi Hit Chance_; bei
  Erfolg entsteht die Kette in voller Länge `C`, Kettentreffer `k` verursacht
  `Grundschaden × Multi Hit Damage × f^(k−1)`.
  - _Pro:_ identischer Erwartungswert wie Option B; **ein** PRNG-Zug für die Kette statt bis zu
    `C`; die Zahl der `Crit (Multi Hit)`-Würfe ist nach dem einen Wurf bekannt; die Kettenlänge hat
    keine Varianz; der Abklingfaktor ist im Kampflog direkt ablesbar.
  - _Contra:_ Die Spannung „läuft die Kette weiter?" pro Kettenstufe entfällt. Der Grenzertrag
    eines Chain-Punktes bleibt `f^(C−1)`, die Fehlinvestition ist also weiterhin möglich —
    sichtbar statt verdeckt.

Erwartungswert-Vergleich (`p = 0.5`, `C = 5`, _Multi Hit Damage_ `0.5`, Ertrag in Grundschäden):

| Variante             | `f = 0.40` | `f = 0.90` |
| -------------------- | ---------- | ---------- |
| B (Chance-Verfall)   | 0.413      | 1.025      |
| C (Schadens-Verfall) | 0.413      | 1.025      |

## Entscheidung

Wir nutzen **Option C** und führen dafür den Stat **_Multi Hit Chain Factor_** ein
(Kategorie Utility, Zweig Tempest, Quelle ausschließlich Skilltree — kein Gem-Pool, wie schon
_Multi Hit Chain_ und _Splash Radius_).

```
Kettentreffer k  (k = 1 … Multi Hit Chain):
  Schaden = roher Grundschaden × Multi Hit Damage × Multi Hit Chain Factor^(k−1)
```

Der Faktor ist **echt kleiner als 100 %** und wird auf diese Obergrenze geklemmt: Bei `f = 1`
klingt die Kette nicht mehr ab (Ertrag `C × Multi Hit Damage`), bei `f > 1` eskaliert sie.
Startvorschlag für das Balancing: **Basiswert 40 %, Skilltree-Maximum 90 %.**

Begründung gegenüber Option B: Bei identischem Erwartungswert liefert Option C die kürzere und
strukturell festere PRNG-Sequenz — das Hauptargument, mit dem ADR-0005 die Proc-Matrix
geschnitten hat — und macht den Abklingfaktor im Kampflog sichtbar. Gegenüber Option A bleibt die
Reihenfolge-Entscheidung im Zweig als Entscheidung erhalten, statt durch eine Pfad-Bedingung
ersetzt zu werden.

Die drei Regeln aus ADR-0005 (Crit ist Modifikator, Generatoren lösen einander nie aus, jeder
erzeugte Treffer bemisst sich am rohen Grundschaden vor Crit) gelten unverändert. Geändert wird
allein, **wie** der Generator Multi Hit seine Treffer erzeugt, und damit die Ziehreihenfolge:

```
vorher: … → Crit (Grundtreffer) → je Kettenstufe: Multi Hit Chance → Crit (Multi Hit) → …
nachher: … → Crit (Grundtreffer) → Multi Hit Chance → je Kettentreffer: Crit (Multi Hit) → …
```

## Konsequenzen

- **Positiv:** Ein Angriff zieht für die Kette genau einen Chance-Wurf; die Zahl der folgenden
  Crit-Würfe ist `Multi Hit Chain` oder `0`. Die Varianz des Zug-Schadens sinkt deutlich, was die
  Kurven-Kalibrierung gegen den Zwei-Charakter-Fall (BALANCING.md §2) berechenbarer macht. Das
  Kampflog zeigt jede ausgelöste Kette vollständig, der Abklingfaktor ist an den fallenden Zahlen
  ablesbar.
- **Negativ / Kompromisse:** Ein zusätzlicher Stat und ein zusätzlicher Balancing-Wert. Die
  Fehlinvestition „Chain-Knoten bei niedrigem Chain Factor" bleibt möglich — sie ist jetzt
  sichtbar, statt ausgeschlossen. Die Kettenlänge trägt keine Spannung mehr bei; der gesamte
  Zufall des Multi-Hit-Zweigs liegt im Auslösewurf.
- **Folgt daraus:** Tempest wird damit zum **Produkt dreier wachsender Stats** (Chance × Damage ×
  Kettenlänge/-stärke) und liegt in derselben Wachstumsklasse wie Dominance
  (Chance × Damage × Radius). Das war der Anlass, _Crit Damage_ **ohne** Soft-Cap zu belassen:
  Der Vorsprung des Crit-Faktors stammt aus dem festen Summanden `1` in der Klammer
  `[1 + Multi-Anteil + Splash-Anteil]` und schmilzt, sobald die Generator-Anteile groß werden. Der
  Ausgleich liegt damit in den Zweig-Kurven statt in einem Cap. Die Rechnung dazu steht in
  BALANCING.md §3.
- **Folgt daraus:** Der Test-Vektor in SPEC spec/COMBAT.md §2.1 wurde neu gerechnet; er sichert
  jetzt zusätzlich ab, dass die Kettenlänge nach einem einzigen Wurf feststeht und der Chain
  Factor pro Kettenstufe **einmal** getragen wird.
- **Folgt daraus:** SPEC spec/COMBAT.md §2.1, spec/CHARACTERS.md §2 und §4, spec/ITEMS.md §8,
  BALANCING.md §3, DESIGN.md §3.2 und GLOSSARY.md wurden entsprechend aktualisiert.
