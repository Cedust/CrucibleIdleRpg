# SPEC.md — Crucible Idle RPG

> **Zweck dieser Datei:** präzise, umsetzbare Mechanik-Regeln, Formeln und Zustände.
> Beantwortet **„Wie verhält sich das Spiel exakt?"**. Vision & Begründungen stehen
> in [DESIGN.md](DESIGN.md), Begriffe in [GLOSSARY.md](GLOSSARY.md), technische
> Konventionen in [../AGENTS.md](../AGENTS.md).
>
> Diese Datei beschreibt das **Verhalten**, nicht die **Balancing-Zahlen** —
> konkrete Kurven, Kosten und Werte gehören als deklarativer Content unter
> `src/game/` (siehe AGENTS.md §4). Offene Punkte sind mit `TODO` markiert.

---

## 1. Kampf — Grundmodell

- Kampf ist **rundenbasiert** zwischen **eigenem Team** und **Gegner(n)**.
- Der Kampf wird **vollständig simuliert** (deterministisch) und danach vom
  Rendering Runde für Runde **abgespielt** — Simulation ≠ Rendering (siehe §5).
- Ergebnis eines Kampfes ist **Sieg** oder **Niederlage**; ein Sieg erzeugt eine
  **Belohnung** (einziger Fortschrittsweg, siehe DESIGN §2).

### 1.1 Rundenablauf

<!-- TODO: verbindlich festlegen -->

- [ ] Initiative-/Reihenfolge-Regel (wer handelt in welcher Reihenfolge?)
- [ ] Was passiert pro Aktion (Ziehen einer Ability, Zielauswahl, Anwendung)?
- [ ] Abbruchbedingungen (ein Team vollständig besiegt / Rundenlimit?)

### 1.2 Zielauswahl

<!-- TODO: verbindlich festlegen -->

- [ ] Standard-Zielregel (z. B. niedrigste HP, Front zuerst, zufällig via PRNG?)
- [ ] Sonderfälle (Taunt, AoE, Mehrfachziele?)

---

## 2. Kampfwerte & Formeln

> Formeln beschreiben die **Struktur** der Berechnung. Die einzelnen
> **Faktoren/Konstanten** stammen aus dem Balancing-Content (`src/game/`).

<!-- TODO: Formeln festlegen, sobald die Werte-Interfaces stehen -->

- [ ] **Schaden:** `Schaden = f(Angriff, Verteidigung, Ability-Faktor, …)`
- [ ] **Trefferchance:** `p_treffer = f(…)`
- [ ] **Kritischer Treffer:** `p_krit`, `krit_multiplikator`
- [ ] **Schadensstreuung:** Streubereich um den Basiswert
- [ ] **Heilung / Schilde / Statuseffekte:** falls vorgesehen

**Regeln, die schon feststehen:**

- **Aller Zufall** in diesen Formeln (Treffer, Krit, Streuung) läuft über den
  **seedbaren PRNG** — **kein** `Math.random()` (AGENTS.md §5, §14).
- Werte, die `Number.MAX_SAFE_INTEGER` überschreiten können (Schaden, Ressourcen,
  Prestige-Skalen), werden über **break_eternity.js** geführt, nicht über native
  `number` (AGENTS.md §5).

---

## 3. Team

<!-- TODO: verbindlich festlegen -->

- [ ] Teamgröße / Slots
- [ ] Charakter-Attribute (welche Werte hat eine `CharacterDefinition`?)
- [ ] Fähigkeiten pro Charakter (`AbilityDefinition`)
- [ ] Umgang mit leeren/besiegten Slots (Index-Zugriffe liefern `| undefined`,
      AGENTS.md §9)

---

## 4. Fortschritt & Belohnungen

<!-- TODO: verbindlich festlegen -->

- [ ] Belohnungsarten aus einem Sieg
- [ ] Wofür werden Belohnungen ausgegeben (Charaktere, Fähigkeiten, Upgrades)?
- [ ] Kosten-/Wachstumskurven (Struktur hier, Zahlen unter `src/game/`)
- [ ] Prestige-/Reset-Mechanik (falls vorgesehen)

---

## 5. Simulation & Zeitverhalten (verbindlich)

Diese Punkte sind bereits durch AGENTS.md §5 festgelegt und hier als Spec-Kontext gespiegelt:

- **Simulation ≠ Rendering:** Die Kampf-Engine ist **reine, deterministische Logik**
  ohne Bezug zu Timern, DOM oder Echtzeit. Das Playback spielt die simulierten Runden
  mit visueller Verzögerung ab.
- **Determinismus:** gleicher Seed + gleicher Input ⇒ exakt gleicher Verlauf.
- **Catch-up:** Tab minimiert/gedrosselt ⇒ beim Wiederöffnen werden fehlende Runden
  **ohne Animation** nachgerechnet (Page Visibility API), danach Anzeige synchronisiert.
- **Kein Offline-Progress:** Tab geschlossen ⇒ kein Fortschritt.

---

## 6. Persistenz (Save-Verhalten)

Festgelegt durch AGENTS.md §7, hier als Verhaltens-Referenz:

- Save in **`localStorage`** mit **Versionsfeld** und **Migrations-Mechanismus**,
  Zugriff nur über den **`SavePort`-Adapter**.
- Beim **Laden** Validierung gegen ein **Zod-Schema** (pro Save-Version eines).
- Bei Validierungsfehler: **kontrollierter Fallback** (Migration oder definierter
  Reset auf Default) — **kein** Absturz mit korruptem State.

**Zu spezifizieren:**

- [ ] Welche Felder umfasst der Save (Save-State-Form pro Version)?
- [ ] Auslöser für ein Speichern (nach Reward? in Intervallen?)

---

## 7. Verweise

- Vision & Design-Begründungen → [DESIGN.md](DESIGN.md)
- Verbindliche Begriffe → [GLOSSARY.md](GLOSSARY.md)
- Technischer Leitfaden für Agenten → [../AGENTS.md](../AGENTS.md)
