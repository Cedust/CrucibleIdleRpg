# 032 — Imprint-Begriff & Brand-Schwelle

| Feld             | Wert    |
| ---------------- | ------- |
| **Status**       | `ready` |
| **Meilenstein**  | M4      |
| **Hängt ab von** | 026     |

## Ziel

Schicht 5 heißt im Code `imprint`, und die Item-Invariante lässt ein Imprint ab **Magic** zu —
Code und Tests stimmen damit wieder mit [ITEMS](../../spec/ITEMS.md#2-item-anatomie-fünf-schichten)
überein.

## Nicht-Ziel

Brand selbst entsteht in [031](031-blacksmith-brand.md); dieser Task setzt kein Imprint und
liefert keine Kampfwirkung. Der Sigil-Katalog entsteht in
[030](030-sigil-drops-und-sigil-codex.md).

## Verbindliche Spec-Anker

- [Item-Anatomie](../../spec/ITEMS.md#2-item-anatomie-fünf-schichten) — Schicht 5 heißt
  **Imprint**
- [Sigils & Sigil Codex](../../spec/ITEMS.md#5-sigils--sigil-codex) — das Imprint kommt per Brand
  auf ein Item **ab Magic**
- [Blacksmith](../../spec/ITEMS.md#7-blacksmith--temper-masterwork--brand) — Brand-Ziel ist ein
  Item ab Magic-Seltenheit
- [Begriffe](../../GLOSSARY.md) — `Imprint` ist der verbindliche Begriff für Prosa, UI und Code
- [Save-Inhalt](../../spec/PERSISTENCE.md#2-save-inhalt) — das Feld ist persistenter Save-Inhalt

## Akzeptanzkriterien

- [ ] `ArmorImplicit` heißt `ArmorImprint`, das Item-Feld `implicit` heißt `imprint`, und
      `armorImplicitSchema` heißt `armorImprintSchema`; der Begriff `Implicit` kommt in `src/`
      nicht mehr vor
- [ ] Die Item-Invariante in `src/game/items/itemLayers.ts` erlaubt ein Imprint auf jeder
      Seltenheit **ab Magic** und lehnt es auf `common` ab; das Save-Schema erzwingt dieselbe
      Invariante
- [ ] Der Default-Save, das Schema und die Schema-Tests wandern atomar mit; Saves im alten Format
      fallen beim Laden auf den Default zurück (Pre-Release-Save-Policy,
      [AGENTS.md](../../../AGENTS.md)) — es entsteht **keine** Migration
- [ ] `npm run lint`, `npm run typecheck` und `npm test` laufen grün

## Betroffene Dateien

- `src/game/types.ts` — `ArmorImprint`, Feldname, Kommentare
- `src/game/items/itemLayers.ts`, `src/game/items/itemLayers.test.ts` — Invariante und Tests
- `src/features/save/saveSchema.ts`, `src/features/save/saveSchema.test.ts` — Schema, Default-Save
  und Tests
- `src/features/heroes/ui/LoadoutPanel.test.tsx` — Textzusicherung

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
