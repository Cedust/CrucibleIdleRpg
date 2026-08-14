import { useState } from 'react';
import {
  investedPoints,
  nodeById,
  nodesFor,
  purchaseFailure,
  respecCost,
  type DisciplineId,
} from '@/game/weaponMastery/mastery';
import { useNavigationStore } from '@/app/navigationStore';
import { useSaveStore } from '@/features/save/saveStore';
import { Button } from '@/shared/ui/Button';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { ScreenLayout } from '@/shared/ui/ScreenLayout';
import { MasteryDisciplineNavigation } from './MasteryDisciplineNavigation';
import { MasteryTreeGraph } from './MasteryTreeGraph';
import { disciplineLabel, masteryNodeAvailability } from './masteryPresentation';
import { NodeInspector } from './NodeInspector';
import { RespecDialog } from './RespecDialog';

/** Browser-facing Mastery tree. Purchases remain explicit inspector actions. */
export function WeaponMasteryScreen() {
  const save = useSaveStore((state) => state.data);
  const buy = useSaveStore((state) => state.buyMasteryNode);
  const respec = useSaveStore((state) => state.respecDiscipline);
  const characterId = useNavigationStore((state) => state.activeCharacterId);
  const [discipline, setDiscipline] = useState<DisciplineId>('weapon');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmRespec, setConfirmRespec] = useState(false);
  const [previousCharacterId, setPreviousCharacterId] = useState(characterId);

  if (characterId !== previousCharacterId) {
    setPreviousCharacterId(characterId);
    setSelectedId(null);
    setConfirmRespec(false);
  }
  if (save === null)
    return (
      <ScreenLayout background="weapon-mastery">
        <p aria-live="polite" className="text-text-muted">
          Loading mastery…
        </p>
      </ScreenLayout>
    );

  const progression = save.characters[characterId];
  const nodes = nodesFor(characterId).filter((node) => node.discipline === discipline);
  const selected = nodeById(characterId, selectedId ?? '') ?? nodes[0];
  const refunded = investedPoints(progression.masteryRanks, discipline);
  const cost = respecCost(refunded);
  const label = disciplineLabel(discipline, characterId);
  const masteryPointLabel =
    progression.freeMasteryPoints === 1 ? 'Mastery Point' : 'Mastery Points';
  const selectDiscipline = (id: DisciplineId) => {
    setDiscipline(id);
    setSelectedId(null);
  };
  const lockReason = selected
    ? purchaseFailure(
        characterId,
        progression.level,
        progression.masteryRanks,
        progression.freeMasteryPoints,
        selected.id,
      )
    : 'Select a node.';

  return (
    <ScreenLayout background="weapon-mastery">
      <section
        className="mx-auto flex min-h-0 w-full min-w-0 max-w-page flex-1 flex-col"
        aria-label="Weapon Mastery"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <ScreenHeader
            title="Weapon Mastery"
            intro="Every weapon remembers the battles it has survived. Hone its nature through different disciplines and forge a fighting style worthy of the depths."
            className="mb-2"
          >
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="flex items-center gap-1.5 text-sm font-medium text-text">
                <span
                  aria-hidden="true"
                  className="font-display text-base leading-none text-accent-strong"
                >
                  ✦
                </span>
                {progression.freeMasteryPoints} {masteryPointLabel}
              </p>
              <Button
                variant="ghost"
                className="shrink-0 px-3 py-1.5 text-sm"
                aria-label={`Respec ${label} for ${cost} Gold`}
                disabled={refunded === 0 || save.currencies.gold < cost}
                onClick={() => setConfirmRespec(true)}
              >
                Respec <span aria-hidden="true">&middot;</span> {cost} Gold
              </Button>
            </div>
          </ScreenHeader>
          <MasteryDisciplineNavigation
            activeDiscipline={discipline}
            characterId={characterId}
            masteryRanks={progression.masteryRanks}
            onSelect={selectDiscipline}
          />
          <div className="grid min-w-0 gap-5 @tree-cols:min-h-0 @tree-cols:flex-1 @tree-cols:grid-cols-[minmax(0,1fr)_var(--spacing-inspector)] @tree-cols:grid-rows-[minmax(0,1fr)]">
            <MasteryTreeGraph
              nodes={nodes}
              ranks={progression.masteryRanks}
              selectedId={selected?.id ?? null}
              label={label}
              availabilityFor={(node) =>
                masteryNodeAvailability(
                  characterId,
                  node,
                  progression.level,
                  progression.masteryRanks,
                  progression.freeMasteryPoints,
                )
              }
              onSelect={setSelectedId}
            />
            {selected ? (
              <div className="min-w-0 @tree-cols:sticky @tree-cols:top-5 @tree-cols:self-start">
                <NodeInspector
                  characterId={characterId}
                  node={selected}
                  rank={progression.masteryRanks[selected.id] ?? 0}
                  lockReason={lockReason}
                  onInvest={() => void buy(characterId, selected.id)}
                />
              </div>
            ) : null}
          </div>
        </div>
        {confirmRespec ? (
          <RespecDialog
            disciplineLabel={label}
            refundedPoints={refunded}
            cost={cost}
            onCancel={() => setConfirmRespec(false)}
            onConfirm={() => {
              void respec(characterId, discipline);
              setConfirmRespec(false);
            }}
          />
        ) : null}
      </section>
    </ScreenLayout>
  );
}
