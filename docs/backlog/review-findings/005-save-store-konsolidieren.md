# 005 — Save-Store konsolidieren

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Schwere**      | mittel |
| **Hängt ab von** | —      |

## Ziel

Der Save-Store persistiert über einen gemeinsamen, serialisierten Helper, ist frei von
Spielregeln und von Import-Zyklen zu Laufzeit-Stores.

## Befund

- **7× dupliziertes Persist-Muster** in
  [saveStore.ts](../../../src/features/save/saveStore.ts) (Z. 76–86, 91–100, 113–123,
  140–149, 181–189, 214–222, 237–246, 253–260): `set({status:'saving'})` → `service.save` →
  `set({data, status:'ready'})` / `catch` → `set({status:'error'})`.
- **Lost-Update-Fenster:** Jede Action liest `get().data`, rechnet `next` und awaited den
  Save. Zwei überlappende Aufrufe (z. B. Speed-Toggle während eines Victory-Commits) basieren
  auf demselben veralteten `data`; der letzte Write gewinnt. Mit localStorage ein
  Microtask-Fenster, mit einem späteren Cloud-Port real.
- **Zirkulärer Import:** [saveStore.ts](../../../src/features/save/saveStore.ts) (Z. 13, 194)
  importiert `useDungeonRunStore`, [dungeonRunStore.ts](../../../src/features/dungeon/state/dungeonRunStore.ts)
  (Z. 9) importiert `saveStore`. Die Regel „kein Respec während eines Runs" lebt damit in der
  Save-Schicht.
- **Spielregeln im Store:** `buyMasteryNode` (Z. 152–190) und `respecDiscipline` (Z. 192–223)
  rechnen Rang-Inkrement, Refund und Rank-Filterung inline — `spendAttributePoint`,
  `respecAttributes` und `commitVictory` delegieren an pure Funktionen.

## Nicht-Ziel

Änderungen am Save-Schema oder am SavePort-Kontrakt (Schema-Härtung:
[009](009-typ-und-schema-haertung.md)).

## Verbindliche Spec-Anker

- [PERSISTENCE.md](../../spec/PERSISTENCE.md) — Save-Verhalten
- [AGENTS.md § Architecture](../../../AGENTS.md#architecture) — SavePort, feature-scoped Stores

## Akzeptanzkriterien

- [x] Ein privater `persist(next)`-Helper trägt Status-Übergänge und Fehlerpfad; alle Actions
      nutzen ihn.
- [x] Schreibvorgänge sind serialisiert (Promise-Queue/Mutex); ein Test belegt, dass zwei
      überlappende Actions beide Änderungen erhalten.
- [x] Der Respec-Guard kommt als injiziertes Prädikat oder liegt im Aufrufer; der
      Import-Zyklus ist aufgelöst.
- [x] Rang-/Refund-Regeln sind pure Funktionen neben `mastery.ts` mit eigenen Unit-Tests.

## Betroffene Dateien

- `src/features/save/saveStore.ts`, `saveStore.test.ts`
- `src/game/weaponMastery/mastery.ts` (oder Nachbarmodul) — pure Kauf-/Respec-Helper
- `src/features/dungeon/state/dungeonRunStore.ts` — Guard-Verdrahtung

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
