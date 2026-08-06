# DESIGN.md — Crucible Idle RPG

> Produktabsicht und Spielerlebnis. Verbindliche Regeln stehen in [spec/](spec/), nicht hier.

## 1. Vision

Crucible Idle RPG ist ein client-only Idle-/Incremental-Browsergame: Ein festes Trio steigt durch
gefährliche Dungeons, und jeder Fortschritt entsteht aus gewonnenen rundenbasierten Auto-Battles.

## 2. Design-Pillars

1. **Kampf ist der Fortschrittsmotor.** Es gibt keine passive Ressourcen-Idle-Schicht außerhalb
   gewonnener Kämpfe.
2. **Der Kampf wird miterlebt.** Das Ergebnis entsteht sichtbar Zug für Zug; Lesbarkeit und
   Nachvollziehbarkeit sind wichtiger als sofortiges Auswürfeln.
3. **Determinismus vor Bequemlichkeit.** Gleicher Seed und gleicher Input sollen denselben
   Verlauf liefern, damit Builds, Fehler und spätere Replays nachvollziehbar bleiben.
4. **Build-Entscheidungen erzeugen Spannung.** Der Spieler optimiert vor dem Kampf; das
   Auto-Battle zeigt die Konsequenzen dieses Builds.
5. **Eigenständiger Look, volle Kontrolle.** Dark Mode und eigene UI-Primitives lassen das Spiel
   wie ein Produkt wirken, nicht wie eine Komponentenbibliothek.

## 3. Player Experience — der Kern-Loop

Der Kern-Loop ist: Dungeon wählen, sichtbaren Kampf verfolgen, Belohnungen erhalten, das Team
zwischen Runs verbessern und tiefere Floors angehen. Der interessante Teil ist nicht der einzelne
Klick, sondern die Frage, wie weit ein vorbereiteter Build trägt.

Attrition macht einen Dungeon zum Überlebens-Run: Verluste bleiben spürbar, und ein Wipe lädt zum
Nachbessern ein statt zum endlosen Wiederholen. Power-Spikes — neue Weapon-Mastery-Verhalten,
Refine-Stufen, Signatur-Skills und Runen — sollen deutlich erkennbar sein, ohne die Kampfzahlen
unlesbar zu machen.

Die drei Rollen sollen sich ergänzen: Der Tank hält das Team, Melee bricht gegnerische Deckung auf,
Ranged verwertet offene Gelegenheiten. Signaturwaffen und ihre individuellen Disciplines stärken
diese Identitäten, ohne die vier gemeinsamen Kampfstile vorzuschreiben. Die Mechanik steht in
[WEAPON-MASTERY.md](spec/WEAPON-MASTERY.md) und [SIGNATURES.md](spec/SIGNATURES.md); hier ist nur
die Designabsicht verbindlich.

## 4. Zielgefühl und Tonalität

**Crucible of Ashes** ist ein Abstieg durch die Ruinen eines einst prächtigen Reiches:
_The Ashen Depths_, _The Ember Foundry_ und _The Forgotten Citadel_. Die Stimmung ist
„Gilded Ruins“ — schwere Steinarchitektur, warmes Gold und klare Lesbarkeit; edel und
geheimnisvoll, aber nie hoffnungslos.

Das Trio vermittelt Found-Family: Korvin ist ruhig und beschützend, Rhaya impulsiv, Quinn trocken
und analytisch. Spieltexte sind englisch, kurz, atmosphärisch und eindeutig.

## 5. Bewusste Nicht-Ziele (Design-Perspektive)

Kein unendlicher Prestige-Treadmill, keine passive Offline-Fortschrittsmaschine und keine
Framework-Default-Optik. Die genauen Produkt- und Technikgrenzen stehen in
[PROGRESSION.md](spec/PROGRESSION.md) und [AGENTS.md](../AGENTS.md).
