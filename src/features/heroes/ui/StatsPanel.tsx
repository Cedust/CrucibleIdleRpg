import { useState } from 'react';
import { CHARACTERS } from '@/game/characters/characters';
import type { AttributePoints, CharacterId } from '@/game/types';
import { deriveCharacterStats, progressionFromSave } from '@/features/combat/engine/characterStats';
import type { SaveData } from '@/features/save/saveSchema';
import { useSaveStore } from '@/features/save/saveStore';
import { AttributesPanel } from './AttributesPanel';
import { CharacterPortal } from './CharacterPortal';
import { CombatStatsPanel } from './CombatStatsPanel';
import { LevelPanel } from './LevelPanel';
import { StatGroupPanel } from './StatGroupPanel';
import { statGroups } from './statsPresentation';

/**
 * Stats-Bereich von Heroes: links Attribute, Combat Stats und Core Stats, in der Mitte das
 * Charakterportal über dem Level-Panel, rechts die Offensive-, Defensive- und Utility-Listen.
 * Portal und Level-Panel sitzen per `mt-auto` am Fuß der Mittelspalte; der Höhenunterschied zu
 * den Stat-Spalten liegt damit als Weißraum über dem Portal.
 * Die Mittelspalte steht im DOM zuerst und wandert erst im dreispaltigen Layout zwischen die
 * Stat-Spalten; sie trägt keine fokussierbaren Elemente, die Tab-Reihenfolge bleibt darum
 * korrekt.
 *
 * Der Respec-Entwurf lebt hier, weil Combat und Core Stats seine Vorschau zeigen. Ein
 * Charakterwechsel verwirft ihn über den `key` der Komponente.
 */
export function StatsPanel({ characterId, save }: { characterId: CharacterId; save: SaveData }) {
  const [draft, setDraft] = useState<AttributePoints | null>(null);
  const spendAttributePoint = useSaveStore((state) => state.spendAttributePoint);
  const redistributeAttributePoints = useSaveStore((state) => state.redistributeAttributePoints);
  const progression = save.characters[characterId];
  const baseProgression = progressionFromSave(save, characterId);
  const stats = deriveCharacterStats(
    CHARACTERS[characterId],
    draft === null ? baseProgression : { ...baseProgression, attributePoints: draft },
  );
  const [core, offensive, defensive, utility] = statGroups(stats);

  return (
    <div
      id="heroes-panel-stats"
      role="tabpanel"
      aria-labelledby="heroes-tab-stats"
      className="min-h-0 flex-1 overflow-y-auto px-3 py-2"
    >
      <div className="grid min-w-0 gap-4 @min-[44rem]:grid-cols-2 @min-[68rem]:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1fr)]">
        <div
          className="flex min-w-0 flex-col gap-4 @min-[44rem]:col-span-2 @min-[68rem]:order-2 @min-[68rem]:col-span-1"
          data-testid="heroes-portal-column"
        >
          <CharacterPortal characterId={characterId} className="mt-auto" />
          <LevelPanel characterId={characterId} progression={progression} />
        </div>
        <div
          className="flex min-w-0 flex-col gap-4 @min-[68rem]:order-1"
          data-testid="heroes-attribute-column"
        >
          <AttributesPanel
            progression={progression}
            gold={save.currencies.gold}
            draft={draft}
            onSpend={(attribute) => {
              void spendAttributePoint(characterId, attribute);
            }}
            onDraftChange={setDraft}
            onStartRespec={() => setDraft(progression.attributePoints)}
            onCancelRespec={() => setDraft(null)}
            onConfirmRespec={() => {
              if (draft === null) {
                return;
              }

              void redistributeAttributePoints(characterId, draft).then((committed) => {
                if (committed) {
                  setDraft(null);
                }
              });
            }}
          />
          <CombatStatsPanel derived={stats.derived} />
          <StatGroupPanel group={core} />
        </div>
        <div
          className="flex min-w-0 flex-col gap-4 @min-[68rem]:order-3"
          data-testid="heroes-detail-column"
        >
          <StatGroupPanel group={offensive} />
          <StatGroupPanel group={defensive} />
          <StatGroupPanel group={utility} />
        </div>
      </div>
    </div>
  );
}
