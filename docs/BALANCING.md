# BALANCING.md — Crucible Idle RPG

> **Zweck dieser Datei:** die **Balancing-Philosophie** und die konkreten Zahlen-,
> Kosten- und Wachstumskurven dokumentieren — also **welche Werte** gelten und
> **warum** sie so gewählt sind.
>
> Abgrenzung zu den Nachbardateien:
>
> - [SPEC.md](SPEC.md) beschreibt die **Struktur** der Formeln („wie wird gerechnet").
> - **BALANCING.md** (diese Datei) beschreibt die **Zahlen darin** und ihre Begründung.
> - Die **umgesetzten Werte** leben als deklarativer, typisierter Content unter
>   `src/game/` (siehe [../AGENTS.md](../AGENTS.md) §4) — **nicht** hier. Diese Datei
>   ist Prosa/Begründung, kein zweiter Quellcode.
>
> Große Zahlen werden über **break_eternity.js** geführt (AGENTS.md §5).
> Interne Doku ist **Deutsch** (AGENTS.md §1).

---

## 1. Balancing-Philosophie

- **Zielspielzeit:** **~30–50 h** aktives Spielen für die 300 Floors (grober Anker für alle
  Kurven).
- **„Bewusster Grind, kein Grind-Wall":** Wiederholen von Dungeons (XP/Gold-Farmen) ist ein
  **eingeplanter** Teil des Fortschritts — aber niemand soll **tagelang** einen Dungeon farmen
  müssen, nur um den nächsten zu bestehen. Ein „einfaches Durchlaufen" ohne Optimierung soll
  ebenfalls **nicht** möglich sein.
- **Incremental-Fantasie:** Der Reiz ist „Numbers go big" (Attack 10 → 10.000 → 100.000.000)
  durch **Min-Maxing** von Stats und Ausrüstung. Die Kurven müssen diesen Sog tragen, ohne den
  Attrition-Anspruch (kein Heilen zwischen Floors) zu untergraben.

## 2. Kern-Wachstumsachsen

Zwei bewusst **getrennte** Skalierungs-Achsen halten den Fokus auf der **Offensive der
Charaktere** (Struktur der Formeln: SPEC §2; Rohwerte: `src/game/`):

| Größe                | Skalierung         | Absicht                                             |
| -------------------- | ------------------ | --------------------------------------------------- |
| **Charakter-Attack** | **exponentiell**   | trägt die Incremental-Fantasie                      |
| **Gegner-Health**    | **exponentiell**   | Gegengewicht zur Attack-Explosion                   |
| **Charakter-Health** | **linear**         | hält das Team verwundbar (Attrition bleibt spürbar) |
| **Gegner-Attack**    | **linear**         | Bedrohung wächst planbar, nicht explosiv            |
| **Gegner-Accuracy**  | **linear (Floor)** | erhöht Druck auf Evasion mit der Tiefe              |

**Wichtig — keine Floor-Skalierung der Charaktere:** Charakterwerte wachsen **nicht** mit der
Floor-Tiefe, sondern nur über die eigenen Quellen (unten). Die Gegner skalieren rein über
**Akt/Dungeon/Floor** (kein separates „Gegnerlevel").

## 3. Wachstumsquellen (woher die Zahlen kommen)

- **Base-Attack (exp.):** primär **Ausrüstung** (Hauptmotor via Crafting/Upgrades) + **Level**
  (fester Per-Level-Sockel) + optional **Crucible/Tempering**. Weitere Quellen TBD.
- **Health / Defense (linear):** **Level** (Sockel) + **Ausrüstung** (u. a. _Armor_ → _Defense_)
  - optional **Crucible/Tempering**. Weitere Quellen TBD.
- **Offensiv-Multiplikatoren** (Crit/Multi/Splash/Counter): **Attribute** (Level-Up) — Chance
  soft-capped bei 100 %, Damage unbegrenzt (SPEC §3.1).
- **Feinschliff:** Skilltree-Knoten (Verhalten/Trigger) und Crucible-Trees.

> **Leitplanke:** Ausrüstung = Hauptmotor, Level/Crucible = garantiertes Grundgerüst. Beim
> Tuning darauf achten, dass ein loot-unabhängiger Sockel existiert (sonst hängt die gesamte
> Kurve an der Loot-Varianz).

## 4. Ökonomie-Anker

- **Crystals (Crucible):** endliche Ressource — **351** gesamt (285 normal + 36 elite + 30 boss),
  nur beim Erstsieg. Ein voll gestufter Node kostet **15** (1+2+3+4+5). ⇒ Der Crucible ist
  **bewusst knapp**; nicht alles ist gleichzeitig maximierbar (Priorisierungs-Entscheidung).
- **Gold:** laufende Währung (Respecs für Attribute/Skills/Crucible, Crafting/Enchant). Muss so
  fließen, dass **Experimentieren** (Respec) erschwinglich bleibt, ohne Entscheidungen zu
  entwerten.
- **XP:** Pool pro Floor, Basisanteil je Charakter + individueller Rest (Schlüssel offen —
  Kandidat: verursachter Schaden).

## 5. Offene Balancing-Fragen / Tuning-Notizen

- [ ] Konkrete Basiswerte & Faktoren der Attribut-Kopplung (pp Chance / pp Damage pro Punkt).
- [ ] Per-Level-Kurven für Core-Stats (Attack exp., Health/Defense linear).
- [ ] Gegner-Kurven pro Akt/Dungeon/Floor (Health exp., Attack/Accuracy linear) + Elite/Boss-
      Multiplikatoren.
- [ ] Bulwark-Prozentwerte (Tank/Melee-Beitrag) und Mitigation-`m` je Node-Stufe.
- [ ] XP-Verteilungsschlüssel; Gold-Drop- und Respec-Kosten-Kurven.
- [ ] Waffen-Damage-Range-Breiten je Seltenheit.

---

## Verweise

- Formel-Struktur → [SPEC.md](SPEC.md)
- Vision & Pillars → [DESIGN.md](DESIGN.md)
- Begriffe → [GLOSSARY.md](GLOSSARY.md)
- Content-Konvention (`src/game/`) → [../AGENTS.md](../AGENTS.md) §4
