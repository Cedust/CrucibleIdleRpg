# DESIGN.md — Crucible Idle RPG

> **Zweck dieser Datei:** Vision, Design-Pillars und Player Experience.
> Beantwortet **„Warum bauen wir das so?"** und **„Wie soll es sich anfühlen?"**.
> Präzise Regeln und Formeln stehen in [SPEC.md](SPEC.md); verbindliche Begriffe
> in [GLOSSARY.md](GLOSSARY.md). Technische Arbeits-Konventionen in
> [../AGENTS.md](../AGENTS.md).
>
> Interne Doku ist **Deutsch**, Spieltexte (UI + Content) **Englisch** (siehe AGENTS.md §1).

---

## 1. Vision in einem Satz

Crucible Idle RPG ist ein **client-only Idle-/Incremental-Browsergame**, in dem
**aller Fortschritt ausschließlich aus rundenbasierten Auto-Battle-Kämpfen** zwischen
dem eigenen Team und Gegnern entsteht.

---

## 2. Design-Pillars

Die Pillars sind die obersten Leitplanken. Jede Feature-Entscheidung wird an ihnen gemessen.

1. **Kampf ist der einzige Motor des Fortschritts.**
   Belohnungen kommen nur aus Kampfergebnissen. Es gibt **keine** passive
   Ressourcen-Idle-Schicht außerhalb des Kampfes.

2. **Der Kampf wird miterlebt, nicht nur berechnet.**
   Kämpfe werden **live Runde für Runde** abgespielt und vom Spieler mitverfolgt —
   nicht als sofortiges Ergebnis ausgewürfelt.

3. **Determinismus vor Bequemlichkeit.**
   Gleicher Seed + gleicher Input ⇒ exakt gleicher Kampfverlauf. Das ist die
   Grundlage für Nachvollziehbarkeit, Testbarkeit, Catch-up und spätere Replays.

4. **Offen für aktives Eingreifen.**
   Der Kampf startet als reines Auto-Battle, die Architektur bleibt aber bewusst
   offen für spätere Mechaniken, mit denen der Spieler **aktiv in den Kampf eingreift**.

5. **Eigenständiger Look, volle Kontrolle.**
   Nur Dark Mode, eigene UI-Primitives statt Komponentenbibliothek — das Spiel soll
   wie ein eigenständiges Produkt wirken, nicht wie ein Framework-Default.

---

## 3. Player Experience — der Kern-Loop

<!-- TODO: Ausformulieren, sobald die erste spielbare Version steht. -->

Grobe Schleife, die sich für den Spieler ergeben soll:

1. Team stellt sich einem Kampf.
2. Kampf wird Runde für Runde abgespielt und mitverfolgt.
3. Sieg ⇒ Belohnung.
4. Belohnung fließt in Fortschritt (Charaktere, Fähigkeiten, Upgrades …).
5. Stärkeres Team ⇒ härtere Gegner ⇒ zurück zu 1.

**Offene Design-Fragen (noch zu klären):**

- Wie fühlt sich eine einzelne Runde an (Tempo, Feedback, Lesbarkeit)?
- Wodurch entsteht Spannung, wenn der Kampf automatisch läuft?
- Was ist die erste sinnvolle Prestige-/Reset-Schleife?

---

## 4. Zielgefühl & Tonalität

<!-- TODO: Genre-Referenzen, Stimmung, visuelle Richtung festhalten. -->

- **Idle-Anspruch:** Das Spiel läuft angenehm nebenbei, belohnt aber Aufmerksamkeit
  in Schlüsselmomenten.
- **Lesbarkeit:** Der Kampfverlauf muss auf einen Blick verständlich bleiben, auch bei
  großen Zahlen (siehe SPEC — Zahlformatierung).

---

## 5. Bewusste Nicht-Ziele (Design-Perspektive)

Diese Entscheidungen sind **bewusst** getroffen — nicht implementieren, auch nicht
„aus Best-Practice-Reflex". (Technische Liste: [AGENTS.md §13](../AGENTS.md).)

- **Kein Offline-Progress:** Tab geschlossen ⇒ kein Fortschritt. Nur ein
  **Catch-up** bei minimiertem/gedrosseltem Tab.
- **Keine passive Idle-Ressourcengenerierung** außerhalb des Kampfes.
- **Kein Router / keine URL-adressierbaren Views** — Ansichtswechsel über State.
- **Kein Light-/System-Theme** — nur Dark Mode.

---

## 6. Verweise

- Präzise Mechanik & Formeln → [SPEC.md](SPEC.md)
- Verbindliche Begriffe → [GLOSSARY.md](GLOSSARY.md)
- Technischer Leitfaden für Agenten → [../AGENTS.md](../AGENTS.md)
