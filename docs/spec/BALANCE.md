# SPEC — Balancing-Leitplanken

> Verbindliche Zielkorridore und Strukturregeln für das Balancing. Konkrete Werte bleiben
> deklarativer Content unter `src/game/`; die Begründung steht in [BALANCING.md](../BALANCING.md).

## 1. Wachstum und Zahlenraum

- Alle Zahlenkurven folgen zwei geometrischen Achsen: **Offense** für Gegner-Health,
  Attack-Quellen sowie Gold/XP; **Defense** für Gegner-Attack, Health, Defense, Barrier und
  Regeneration. Zielwerte sind ungefähr `+3 %` beziehungsweise `+1,8 %` pro Floor.
- Charakterwerte skalieren nur aus ihren eigenen Quellen; Gegner ausschließlich aus
  Akt, Dungeon und Floor. Es gibt kein Gegnerlevel.
- Offensive Magnituden skalieren nur aus Attack, defensive nur aus defensiven Quellen.
  Kein Effekt konvertiert zwischen den Achsen, insbesondere kein Lifesteal oder Reflekt.
- Kurven liegen als vorberechnete Tabellen im Content, nicht als Laufzeit-`Math.pow`.

## 2. Spielbare Korridore

- Zielspielzeit: etwa 30–50 aktive Stunden für 300 Floors.
- Bei Par-Ausbau dauern normale Floors 4–6, Elite-Floors 8–12 und Akt-Bosse 15–25 Runden.
  Elite- und Boss-eHP werden aus diesem Ziel abgeleitet.
- Über einen 20-Floor-Run verliert ein Par-Team netto etwa 60–80 % seiner Health. Barrier und
  Regeneration decken höchstens ungefähr die Hälfte des erwarteten Durchlasses.
- Jeder Pflicht-Encounter, auch ein Boss, hat mindestens **zwei Gegneraktionen pro Runde**.
  Formation und Adds liefern die offensive Textur, ohne die defensive Schwere zu ändern.

## 3. Content-Grenzen

- Chance-Stats sind über endliche Budgets begrenzt; Damage-Stats nicht. Der endliche
  Content-Vorrat begrenzt ihre Gesamtskalierung.
- Item-Level und Gegner-Health verwenden Tabellen. Die Spitzenwerte bleiben im nativen
  `number`-Zahlenraum und deutlich unter `Number.MAX_SAFE_INTEGER`.
- Offene Werte und Kurven stehen ausschließlich in
  [OPEN_ISSUES.md](../backlog/OPEN_ISSUES.md); Tests prüfen Struktur statt Platzhalterwerte.
