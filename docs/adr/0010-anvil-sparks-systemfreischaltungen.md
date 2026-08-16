# ADR-0010: Anvil Sparks bündelt alle Systemfreischaltungen

- **Status:** Akzeptiert
- **Datum:** 2026-08-13
- **Betrifft:** `docs/spec/PROGRESSION.md` §3; `docs/spec/RUNES.md` §1/§8;
  `src/game/crucible/`; Blacksmith-Terminologie

---

## Kontext

Der Crucible trennte permanente Freischaltungen bislang auf zwei Trees: Anvil Sparks enthielt
Checkpoints, Ausrüstung und Handwerk, während Masterwork ausschließlich die späteren
Runen-Systeme freischalten sollte. Beide Trees erfüllten damit denselben strukturellen Zweck.
Zugleich hieß die Blacksmith-Aktion auf Seltenheit bisher Refine, obwohl Masterwork ihren
handwerklichen Charakter präziser bezeichnet und der Begriff durch die Tree-Konsolidierung frei
wird.

## Betrachtete Alternativen

- **Getrennte Trees beibehalten:** Bewahrt die bisherige Darstellung, dupliziert aber dauerhaft
  die Verantwortung für Systemfreischaltungen und reserviert einen ganzen Tree für vier M5-Nodes.
- **Runen nach Anvil Sparks verschieben und technische IDs behalten:** Reduziert die sichtbaren
  Trees, hinterlässt aber irreführende `masterwork.*`-IDs im Anvil-Katalog.
- **Runen vollständig in Anvil Sparks integrieren:** Bündelt alle dauerhaften Freischaltungen in
  einem Tree und gibt Masterwork als klaren Blacksmith-Begriff frei.

## Entscheidung

Wir integrieren Rune Grimoire, Talisman, Runic Focus und Rune Mastery als eigenen, von Armory und
Handwerk unabhängigen Ast in **Anvil Sparks**. Ihre IDs wechseln auf `anvil.*`; Kosten, Wirkungen,
interne Voraussetzungen und M5-Sperren bleiben unverändert. Der Crucible besteht damit aus drei
Trees. Anvil Sparks ist der verbindliche Wohnort aller jetzigen und zukünftigen dauerhaften
Spielinhalts- und Systemfreischaltungen.

Der Begriff **Masterwork** ersetzt beim Blacksmith vollständig **Refine** als Aktion auf der
Seltenheit. Kosten, Ergebnis und RNG-freies Verhalten dieser Aktion ändern sich nicht.

## Konsequenzen

- **Positiv:** Jeder Crucible-Tree hat eine eindeutige Verantwortung; zukünftige Systeme erhalten
  einen klaren Freischaltungsort; die Blacksmith-Aktionen heißen Temper, Masterwork und Brand.
- **Negativ / Kompromisse:** Anvil Sparks wird größer und benötigt in der UI mehrere unabhängige
  Wurzeln. Die noch nicht kaufbaren Runen-Nodes erhalten neue technische IDs.
- **Folgt daraus:** Der Masterwork-Tree und sein Tab entfallen. Aktuell gültige Saves benötigen
  keine Migration, weil gesperrte Nodes nicht gespeichert werden können; alte `masterwork.*`-IDs
  bleiben nach der Pre-Release-Save-Policy ungültig.
