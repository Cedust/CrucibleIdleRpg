# 011 — Cleanup & Style-Guide

| Feld             | Wert   |
| ---------------- | ------ |
| **Status**       | `done` |
| **Meilenstein**  | UIF    |
| **Hängt ab von** | 010    |

## Ziel

Die während des Refactors abgelösten Altlasten sind entfernt, und [FOUNDATION.md](FOUNDATION.md)
ist als dauerhafter Style-Guide der UI-Foundation konsolidiert.

## Nicht-Ziel

Der vollständige Politur-Pass über alle Screens bleibt in M6
([ROADMAP](../ROADMAP.md#m6--endgame--politur)); die Re-Verortung der Ressourcen-Anzeige ist
M4-Scope.

## Blockiert durch

[010](010-ultrawide-polish-und-responsive-e2e.md) — Feintuning und Validierung müssen
abgeschlossen sein.

## Verbindliche Spec-Anker

- [FOUNDATION §10](FOUNDATION.md#10-bewusste-sonderfälle) — bleibende Sonderfälle, die im
  Style-Guide dokumentiert sein müssen
- [FOUNDATION §11](FOUNDATION.md#11-teststrategie) — Assertions-Politik als bleibende Konvention
- [DESIGN §5](../../DESIGN.md#5-visuelle-umsetzung) — Manifest-Pflicht je Asset
- [AGENTS.md](../../../AGENTS.md) — Doku-Links nach Änderungen validieren

## Akzeptanzkriterien

- [ ] Ein Repo-Sweep bestätigt: keine verbliebenen `lg:`-/`sm:`-Layout-Wechsel innerhalb des
      Mainviews, keine verwaisten `min-h-full`-Reste auf ScreenLayout-Callern, keine
      Ad-hoc-Akzent-Glows außerhalb der Tokens
- [ ] Die abgelösten Assets sind entfernt (`dungeon-ashen-depths_1.png`, `button-ornate.png`,
      `panel-thin-alt.png`, `slot-ornate.png`, `nav-selection_old.png`) und
      `public/assets/MANIFEST.md` führt exakt die vorhandenen Dateien
- [ ] `motion-reduce:transition-none` liegt auf allen state-tragenden Ebenen (Sweep über
      `transition-state`-Nutzung)
- [ ] FOUNDATION.md ist konsolidiert: finale Token-Werte, Sonderfall-Liste, Screen-Contract für
      M3+-Screens, Hinweis auf die M4-Re-Verortung der Ressourcen-Anzeige
- [ ] `npm run docs:links`, `npm test` und `npm run test:e2e` sind grün

## Betroffene Dateien

- `public/assets/` — abgelöste Assets, `MANIFEST.md`
- `src/` — Sweep-Funde (erwartet klein)
- `FOUNDATION.md`, `README.md` (Status-Pflege)

## Definition of Done

[AGENTS.md](../../../AGENTS.md).
