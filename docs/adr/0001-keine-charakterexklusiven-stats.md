# ADR-0001: Keine charakterexklusiven Stats

- **Status:** Akzeptiert
- **Datum:** 2026-07-25
- **Betrifft:** SPEC.md §3 (Team, Stats, Skilltree), GLOSSARY.md (Stat, Skill, Mitigation, Block), Feature-Ordner `src/features/team/`, `src/features/combat/`, Content unter `src/game/`

---

## Kontext

Das Team besteht aus **drei festen Archetypen** (Korvin/Tank, Rhaya/Melee, Quinn/Ranged).
Einige Kampfwerte sind nur für **einen** Archetyp sinnvoll:

- **Mitigation** bedeutet wörtlich „leite Schaden _auf den Tank_ um" — für einen DD ohne
  Umleitungsziel bedeutungslos.
- **Block** war ursprünglich als Tank-only Party-Gate gedacht (blockt → 0 Schaden fürs ganze
  Team).

Zugleich soll das System einen breiten, lesbaren **Min-Max-Raum** bieten (Incremental-Sog),
und der Content unter `src/game/` soll mit **einheitlichen Interfaces** (`CharacterDefinition`)
typsicher und refactoring-fest bleiben (AGENTS.md §4). Die Frage: Dürfen einzelne Stats an einen
Archetyp gebunden sein — oder braucht es ein durchgängiges Prinzip?

## Betrachtete Alternativen

- **Option A — Charakterexklusive Stats erlauben:** Mitigation (und ggf. Block) bleiben Stats,
  die nur der Tank besitzt.
  - _Pro:_ direkte Modellierung, keine Zusatzsysteme.
  - _Contra:_ uneinheitliche `CharacterDefinition` (Stat-Set je Archetyp verschieden);
    Sonderfälle in Engine, UI und Balancing-Content; „tote" Stats bei falschem Archetyp;
    Block-als-Party-Gate erzeugt einen party-weiten All-or-Nothing-Swing mit hoher
    Zufallsvarianz (im Idle-Kontext schwer zu balancieren).
- **Option B — Alle Stats universell, Archetyp-Spezifisches als Skill kapseln:** Der Stat-Satz
  ist für alle Charaktere identisch; was nur für einen Archetyp gilt, wird ein **freischaltbarer
  Skilltree-Knoten**.
  - _Pro:_ eine einheitliche `CharacterDefinition`; Engine/UI ohne Archetyp-Sonderfälle; Skills
    liefern Freischalt-Momente, Stufung und natürliche Caps (Node-Maxlevel); klarere Identität
    (Signatur-Skill statt Sonder-Stat).
  - _Contra:_ ein zusätzliches Konzept (Skill vs. Stat); frühes Balancing muss ohne den
    Redirect tragen (Tank ist bis zur Freischaltung nur ein zäher Bruiser).

## Entscheidung

Wir nutzen **Option B: keine charakterexklusiven Stats.** Der Stat-Satz ist für alle drei
Charaktere identisch. Ein Wert, der nur für einen Archetyp Sinn ergibt, wird als **Skill** im
jeweiligen Skilltree gekapselt statt als Stat modelliert.

Konkrete Folgeentscheidungen (aus den Braindump-Revisionen R1/R2):

- **Mitigation** ist **kein Stat**, sondern der freischaltbare **Signatur-Skill des Tanks**
  (stufbarer Node; Maxlevel = natürlicher Cap für die Umleitung).
- **Block Chance** wird ein **universeller** Defensiv-Stat mit **partieller** Reduktion
  (`Schaden × (1 − Block%)`) statt eines Tank-only Party-Gates. Die Tank-Block-Identität
  entsteht über den **Shield** im Main-Hand-Slot (hohe Block Chance), nicht über Exklusivität.

## Konsequenzen

- **Positiv:** Eine einheitliche `CharacterDefinition` und ein archetyp-agnostisches
  Stat-Interface; Engine, UI und Balancing-Content ohne Sonderfälle; jeder Stat ist auf jedem
  Charakter potenziell nützlich (kein toter Stat); Signatur-Fähigkeiten werden zu echten,
  freigeschalteten Build-Entscheidungen mit eingebautem Cap.
- **Negativ / Kompromisse:** Zusätzliche konzeptionelle Ebene (Skill neben Stat) samt
  Skilltree-Content; das frühe Balancing muss den Tank **ohne** Mitigation tragfähig machen —
  der Freischalt-Moment ist ein bewusster Power-Spike.
- **Folgt daraus:** In SPEC.md §3 als **Leitprinzip** verankert; die Defensive-Stat-Liste
  enthält **kein** Mitigation mehr. Neue archetyp-spezifische Mechanik wird künftig **immer**
  als Skill, nie als Stat modelliert.
