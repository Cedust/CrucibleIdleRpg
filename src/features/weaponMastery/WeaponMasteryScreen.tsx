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
import { ScreenLayout } from '@/shared/ui/ScreenLayout';
import { MasteryDisciplineNavigation } from './MasteryDisciplineNavigation';
import { MasteryTreeGraph } from './MasteryTreeGraph';
import { disciplineLabel } from './masteryPresentation';
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
        <p className="text-text-muted">Loading mastery…</p>
      </ScreenLayout>
    );

  const progression = save.characters[characterId];
  const nodes = nodesFor(characterId).filter((node) => node.discipline === discipline);
  const selected = nodeById(characterId, selectedId ?? '') ?? nodes[0];
  const refunded = investedPoints(progression.masteryRanks, discipline);
  const cost = respecCost(refunded);
  const label = disciplineLabel(discipline, characterId);
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
    <ScreenLayout
      background="weapon-mastery"
      className="h-full min-h-0"
      contentClassName="flex min-h-0 flex-1 flex-col"
    >
      <section
        className="@container flex min-h-0 min-w-0 max-w-384 flex-1 flex-col"
        aria-label="Weapon Mastery"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="mb-2">
            <div>
              <h2 className="font-display text-display-lg text-accent-strong">Weapon Mastery</h2>
              <p className="mt-1 font-intro text-sm leading-6 text-text-muted">
                Every weapon remembers the battles it has survived. Hone its nature through
                different disciplines and forge a fighting style worthy of the depths.
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="flex items-center gap-1.5 text-sm font-medium text-text">
                  <span
                    aria-hidden="true"
                    className="font-display text-base leading-none text-accent-strong"
                  >
                    ✦
                  </span>
                  {progression.freeMasteryPoints} Mastery Points
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
            </div>
          </header>
          <MasteryDisciplineNavigation
            activeDiscipline={discipline}
            characterId={characterId}
            masteryRanks={progression.masteryRanks}
            onSelect={selectDiscipline}
          />
          <div className="grid min-w-0 gap-5 @min-[1280px]:min-h-0 @min-[1280px]:flex-1 @min-[1280px]:grid-cols-[minmax(0,1fr)_19rem] @min-[1280px]:grid-rows-[minmax(0,1fr)]">
            <MasteryTreeGraph
              nodes={nodes}
              ranks={progression.masteryRanks}
              selectedId={selected?.id ?? null}
              label={label}
              purchaseFailure={(node) =>
                purchaseFailure(
                  characterId,
                  progression.level,
                  progression.masteryRanks,
                  progression.freeMasteryPoints,
                  node.id,
                )
              }
              onSelect={setSelectedId}
            />
            {selected ? (
              <div className="min-w-0 @min-[1280px]:sticky @min-[1280px]:top-5 @min-[1280px]:self-start">
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
