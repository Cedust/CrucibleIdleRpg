# 011a — Dungeon-Auswahl & isolierte Run-Ansicht

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | M2     |
| **Hängt ab von** | 010    |
| **Entblockt**    | 011    |

## Kontext

[011](011-dungeon-run-und-attrition.md) ist blockiert, weil pro Floor bereits in den Save
committete XP, Gold und Relic Shards bis zum Ende eines Runs nicht ausgebbar sein dürfen. Die
Entscheidung hierfür ist eine UX- und Bildschirmgrenze: Ein aktiver Dungeon-Run wird nicht in der
normalen Dungeon-View fortgesetzt. Er hat eine eigene, vollständige Ansicht ohne
Primärnavigation und ohne Progressions- oder Ausgabefunktionen; die lesende Kopfzeile bleibt
sichtbar.

Der verbindliche visuelle Ausgangspunkt ist der UI-Draft: Die
Overview-Karte **DUNGEONS** führt zur Akt-/Dungeon-Auswahl; **ENTER DUNGEON** wechselt in die
separate Battle-Arena. Die Draft-Arena hat bewusst keine Seitenleiste. Ihre kompakte Kopfzeile
zeigt Ressourcen nur lesend an; sie ist keine App-Navigation.

## Ziel

Die normale Dungeons-Ansicht wird zur Auswahl eines freigeschalteten Akts und Dungeons. Nach
**Enter Dungeon** nutzt der Run den vollständigen Dungeon-View-Bereich unter der weiter sichtbaren
Kopfzeile. Solange der Run aktiv ist, kann er weder zu Crucible, Blacksmith, Jeweler noch zu Team,
Runen oder anderen Progressions- und Ausgabefunktionen wechseln. Erst ein terminales Run-Ergebnis
bringt ihn in die Auswahl zurück.

## UX-Flow

1. Außerhalb eines Runs bleibt die normale App-Shell mit Kopfzeile und Primärnavigation sichtbar.
   Der Eintrag **DUNGEONS** öffnet die Akt-/Dungeon-Auswahl.
2. Der Spieler wählt einen freigeschalteten Akt und einen freigeschalteten Dungeon. Nicht
   freigeschaltete Inhalte sind erkennbar gesperrt und nicht auswählbar.
3. **Enter Dungeon** persistiert zunächst den Run-Start (`runCounter`) und wechselt erst bei
   Erfolg in die Run-Ansicht auf Floor 1 des gewählten Dungeons.
4. Die Run-Ansicht belegt den verfügbaren Dungeon-View-Bereich und enthält nur kampfrelevante
   Informationen und Aktionen: Dungeon/Floor, Team, Gegnerformation, Zugreihenfolge, Kampf-Log,
   Playback und die während des Runs erlaubte Beenden-/Abbruchaktion. Die Kopfzeile bleibt als
   reine Ressourcenanzeige sichtbar. Es gibt keinen Zurück-Link, keine Seitenleiste und keine
   Verknüpfung zu einer normalen App-View.
5. Wipe, erfolgreicher Abschluss des letzten Floors oder ein ausdrücklich bestätigter
   **Leave Dungeon**-Abbruch beenden den kompletten Run. Erst danach wird die normale
   Dungeon-Auswahl wieder gerendert. Ein manueller Abbruch ist damit ein terminales
   Run-Ergebnis, kein Navigationsweg.

## Funktionaler Scope

- Die Auswahl löst die heutige, im `CombatScreen` eingebettete Radio-Auswahl ab und stellt
  Akt-/Dungeon-Zustand und Freischaltungen zugänglich dar. M2 zeigt den vorhandenen Akt-1-Content;
  spätere Akte erweitern ausschließlich die datengetriebene Auswahl.
- Die bisherige Kampfansicht wird in eine Auswahlansicht und eine isolierte Run-Ansicht getrennt.
  Das Arena-Layout des UI-Drafts ist die visuelle Referenz, nicht dessen Prototyp-Code.
- Während eines aktiven Runs werden Primärnavigation und alle normalen Views nicht gerendert. Die
  normale Kopfzeile bleibt sichtbar; Ressourcen darin sind nicht interaktiv und führen nicht zu
  einer Ausgabefunktion.
- Die Laufzeit-Run-Ansicht akzeptiert nur Übergänge, die der Run-Lifecycle auslöst. Ein paralleler
  Wechsel im Navigation-Store darf die normale View nicht sichtbar machen.
- Die Regel wird in [PROGRESSION](../../spec/PROGRESSION.md#4-checkpoints-wipe--abbruch)
  präzisiert: Floor-Rewards werden weiter sofort committet, sind aber bis zum terminalen
  Run-Ergebnis nur sichtbar, nicht ausgebbar. [PERSISTENCE](../../spec/PERSISTENCE.md#2-save-inhalt)
  hält fest, dass dafür kein Pending-Currency- oder aktives-Run-Feld gespeichert wird; Reload
  beendet den Run und stellt die normale Shell mit allen bereits committeten Rewards wieder her.

## Technischer Ansatz

- `AppShell` erhält einen expliziten Laufzeitmodus für `selection` und `run`; im Run-Modus rendert
  sie `DungeonRunScreen` statt Navigation und normalem Main-Content, behält aber die Kopfzeile.
  Der Modus wird aus einem einzelnen feature-eigenen Run-Lifecycle abgeleitet, nicht aus
  verstreuten Sichtbarkeits-Flags oder CSS.
- `DungeonSelectionScreen` kapselt Akt-/Dungeon-Auswahl und den Start. Der Startablauf bleibt
  atomar: `beginRun()` persistiert zuerst, danach wird der Floor-1-Kampf erzeugt und erst dann der
  Run-Modus aktiviert. Der gewählte Dungeon wird beim Start eingefroren.
- `DungeonRunScreen` komponiert die vorhandenen Kampfbausteine (Team, Gegnerformation,
  Zugreihenfolge, Log und Playback) in der Arena. Sie erhält nur explizite Lifecycle-Callbacks
  für `leave`, `wipe` und `complete`; sie kennt keine allgemeine Navigation.
- [011](011-dungeon-run-und-attrition.md) erweitert diesen Lifecycle um Floor-Kette, Attrition,
  Reward-Commits und Completion. 011a definiert und baut die Präsentationsgrenze sowie deren
  Übergabepunkte, aber keine dieser Spielregeln doppelt.
- Bestehende Zustandshaltung bleibt nicht persistiert, soweit sie einen laufenden Run beschreibt.
  Die vorhandene Reload-Regel bleibt deshalb unverändert: Runtime-Kampf löschen, Save laden,
  Auswahl zeigen.

## Akzeptanzkriterien

- [ ] Die normale **DUNGEONS**-View zeigt eine zugängliche Akt-/Dungeon-Auswahl; nur
      freigeschaltete Dungeons lassen sich wählen, und **Enter Dungeon** ist bei fehlendem oder
      gesperrtem Ziel nicht ausführbar.
- [ ] Nach erfolgreich persistiertem Run-Start ersetzt die Run-Ansicht den normalen
      Dungeon-View-Bereich. Die Kopfzeile bleibt sichtbar, die Run-Ansicht enthält aber keine
      Primärnavigation, keinen Back-Link und keine Interaktion für Crucible, Blacksmith, Jeweler,
      Team oder Runen.
- [ ] Ein während eines Runs ausgelöster Wechsel im Navigation-Store kann keine normale View
      sichtbar machen; versteckte Navigation bleibt auch per Tastatur nicht fokussierbar.
- [ ] Wipe, bestätigtes **Leave Dungeon** und der von 011 gemeldete Dungeon-Abschluss beenden den
      Run und bringen erst danach zurück zur Auswahl. Ein fehlgeschlagener Reward-Commit hält die
      Run-Ansicht mit Retry-Möglichkeit offen.
- [ ] Ein fehlgeschlagener oder doppelt ausgelöster Run-Start öffnet keine Run-Ansicht und erhöht
      den Run nicht mehrfach. Ein Reload während eines Runs zeigt wieder die Auswahl und behält
      vorher committete Rewards.
- [ ] Component-/Store-Tests decken Auswahl, erfolgreichen und fehlgeschlagenen Start,
      Navigationsisolation, alle terminalen Übergänge und Keyboard-Fokus ab; der E2E-Flow deckt
      Auswahl → Enter Dungeon → Run-Ansicht ohne Navigation → Run-Ende → Auswahl ab.
- [ ] `npm run docs:links` besteht nach der Spec- und Task-Dokumentation.

## Edge Cases

- Wird ein zuvor gewählter Dungeon vor dem Start durch Rehydration ungültig, fällt die Auswahl auf
  den ersten freigeschalteten Dungeon zurück; **Enter Dungeon** startet nie einen gesperrten
  Dungeon.
- Ist der Save beim Start nicht bereit oder scheitert dessen Persistenz, bleibt der Spieler in der
  Auswahl mit verständlichem Fehlerzustand; es existiert kein halber Run-Modus.
- Ressourcen- und XP-Anzeigen dürfen während eines Runs aktualisierte, bereits committete Werte
  widerspiegeln, erhalten aber keine Links, Buttons oder Shortcuts zum Ausgeben.
- Der Abbruch ist nur in der Run-Ansicht erreichbar und beendet den kompletten Run nach der Regel
  aus 011; Browser-Reload und Tab-Schließen sind weiterhin gleichwertig zum Abbruch.
- Auf kleinen Viewports bleibt die Arena scrollbar bzw. responsiv, ohne die fehlende Navigation
  durch eine alternative Menü-Schaltfläche wieder einzuführen.

## Nicht-Ziele

- Keine Implementierung der Floor-Kette, Attrition, Checkpoints, Rally, Dungeon-Completion oder
  Reward-Berechnung aus 011.
- Keine Auto-Progression, 2×-Freischaltung oder zusätzliche Optimierungsregeln aus 012.
- Kein neuer persistierter Pending-Balance-Mechanismus, keine neue Save-Version allein für die
  UI-Isolation und keine serverseitige Sperre.
- Kein Akt-2-/Akt-3-Content und keine Übernahme des HTML-Prototyp-Codes in die Produktions-App.

## Abhängigkeit zu 011

011a ist die vorgeschaltete UI- und Spec-Entscheidung für
[011](011-dungeon-run-und-attrition.md): Sie macht die bereits in
[PROGRESSION](../../spec/PROGRESSION.md#2-belohnungen-aus-einem-sieg) vorgesehene sofortige
Reward-Persistenz ohne vorzeitige Ausgabe möglich. Nach Abschluss von 011a implementiert 011 den
eigentlichen Run-Lifecycle innerhalb dieser Grenze; erst dann ist der vollständige Dungeon-Run
fachlich fertig.

## Betroffene Dateien

- `src/features/shell/AppShell.tsx`, `navigationStore.ts` + Tests
- `src/features/progression/DungeonSelector.tsx` bzw. neue Auswahlansicht + Tests
- `src/features/combat/CombatScreen.tsx`, `combatStore.ts` bzw. neue Run-Ansicht + Tests
- `e2e/smoke.spec.ts`
- `docs/spec/PROGRESSION.md`, `docs/spec/PERSISTENCE.md`,
  `docs/backlog/tasks/011-dungeon-run-und-attrition.md`

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
