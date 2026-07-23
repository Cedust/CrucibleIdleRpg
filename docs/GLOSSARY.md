# GLOSSARY.md — Crucible Idle RPG

> **Zweck dieser Datei:** verbindliche Begriffe für Code, UI und Doku.
> Ziel ist **ein Wort pro Konzept** — damit Agenten und Menschen dieselbe Sprache
> sprechen. Besonders wichtig wegen der Trennung: interne Doku/Code-Kommentare
> **Deutsch**, Spieltexte (UI + Content) **Englisch** (AGENTS.md §1).
>
> Für jeden Begriff sind — wo relevant — **DE** (interne Bezeichnung) und
> **EN** (Spieltext/Code-Identifier) angegeben. `TODO` = noch nicht final.

---

## Konvention

- **Code-Identifier** (Typen, Funktionen, Variablen) folgen dem **englischen** Begriff
  (z. B. `EnemyDefinition`, `combatEngine`), passend zu `src/game/` und `src/features/`.
- **Interne Prosa** (diese Docs, Kommentare) nutzt den **deutschen** Begriff.
- Wenn ein Konzept nur einen sinnvollen Namen hat, steht er einmal.

---

## Begriffe

### Kampf (EN: _Combat_)

Rundenbasierte Auto-Battle-Auseinandersetzung zwischen eigenem Team und Gegner(n).
Einziger Weg zu Fortschritt. — Feature-Ordner: `src/features/combat/`.

### Kampf-Engine (EN: _combat engine_, Code: `combatEngine`)

Reine, deterministische, seedbare Logik, die einen Kampf vollständig simuliert.
Kein Bezug zu Timern, DOM oder Echtzeit. Gegenstück: **Playback**.

### Playback / Abspielen (EN: _playback_)

Das Rendering, das die von der Engine simulierten Runden mit visueller Verzögerung
für den Spieler abspielt. Klar getrennt von der Simulation.

### Runde (EN: _Round_)

<!-- TODO: gegen "Turn"/"Tick" abgrenzen, sobald der Rundenablauf steht -->

Eine Simulations-Einheit des Kampfes. **Nicht** mit einem Render-„Tick" oder Frame
verwechseln — die Runde ist eine reine Simulations-Größe.

### Team

Die vom Spieler kontrollierte Gruppe von Charakteren. — Feature: `src/features/team/`.

### Charakter (EN: _Character_, Code: `CharacterDefinition`)

Ein Mitglied des Teams. Deklarativer Content unter `src/game/characters/`.

### Gegner (EN: _Enemy_, Code: `EnemyDefinition`)

Gegnerische Einheit im Kampf. Deklarativer Content unter `src/game/enemies/`.

### Fähigkeit (EN: _Ability_, Code: `AbilityDefinition`)

Aktion, die ein Charakter oder Gegner im Kampf ausführt. Content unter
`src/game/abilities/`. — **Nicht** synonym „Skill" verwenden; verbindlich ist _Ability_.

### Belohnung (EN: _Reward_)

Ergebnis eines gewonnenen Kampfes; einziger Fortschritts-Input.

### Upgrade

Dauerhafte Verbesserung, die mit Belohnungen erworben wird. — Feature:
`src/features/upgrades/`.

### PRNG (seedbarer Zufallszahlengenerator)

Einzige erlaubte Zufallsquelle in der Spiellogik (z. B. `mulberry32`/`sfc32`),
dependency-frei in `src/shared/utils/`. **Kein** `Math.random()` in Spiellogik.

### Seed

Startwert des PRNG. Gleicher Seed + gleicher Input ⇒ exakt gleicher Kampfverlauf.
Grundlage für Tests, Bug-Reports („Seed 12345") und spätere Replays.

### Catch-up / Aufholen

Nachrechnen fehlender Runden **ohne Animation**, wenn ein minimierter/gedrosselter Tab
wieder sichtbar wird (Page Visibility API). Abzugrenzen von **Offline-Progress**.

### Offline-Progress

Fortschritt bei **geschlossenem** Tab. **Bewusstes Nicht-Ziel** — existiert nicht.

### Save / Speicherstand

Persistierter Spielzustand in `localStorage`, mit Versionsfeld und Migration.
Zugriff nur über den **SavePort**.

### SavePort

Abstrahierter Persistenz-Adapter (`src/shared/ports/`) mit `load()` / `save()` /
`clear()`. Aktuelle Implementierung: `localStorage`; später gegen ein Cloud-Backend
austauschbar, ohne Spiellogik anzufassen.

### Große Zahl (EN: _big number_)

Wert, der `Number.MAX_SAFE_INTEGER` überschreiten kann; wird über **break_eternity.js**
geführt, nie über native `number`.

### Prestige

<!-- TODO: definieren, sobald die Reset-Mechanik existiert -->

Reset-Schleife für langfristigen Fortschritt (Details noch offen, siehe SPEC §4).

---

## Verweise

- Vision & Design → [DESIGN.md](DESIGN.md)
- Präzise Mechanik & Formeln → [SPEC.md](SPEC.md)
- Technischer Leitfaden für Agenten → [../AGENTS.md](../AGENTS.md)
