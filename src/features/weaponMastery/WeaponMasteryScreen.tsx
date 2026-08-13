import { useState, type KeyboardEvent } from 'react';
import { CHARACTERS } from '@/game/characters/characters';
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
import { MasteryTreeGraph } from './MasteryTreeGraph';
import { disciplineLabel, MASTERY_TAB_ORDER } from './masteryPresentation';
import { NodeInspector } from './NodeInspector';
import { RespecDialog } from './RespecDialog';

function handleTabKey(
  event: KeyboardEvent<HTMLButtonElement>,
  discipline: DisciplineId,
  select: (id: DisciplineId) => void,
) {
  const index = MASTERY_TAB_ORDER.indexOf(discipline);
  const next =
    event.key === 'ArrowRight'
      ? (index + 1) % MASTERY_TAB_ORDER.length
      : event.key === 'ArrowLeft'
        ? (index - 1 + MASTERY_TAB_ORDER.length) % MASTERY_TAB_ORDER.length
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? MASTERY_TAB_ORDER.length - 1
            : null;
  if (next === null) return;
  event.preventDefault();
  const target = MASTERY_TAB_ORDER[next];
  if (target === undefined) return;
  select(target);
  document.getElementById(`mastery-tab-${target}`)?.focus();
}

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
    <ScreenLayout background="weapon-mastery" className="min-h-full">
      <section className="@container min-w-0 max-w-384" aria-label="Weapon Mastery">
        <div className="min-w-0">
          <header className="mb-5 flex flex-wrap items-start justify-between gap-3 @min-[1280px]:pr-80">
            <div>
              <h2 className="font-display text-display-lg text-accent-strong">Weapon Mastery</h2>
              <p className="mt-1 text-sm text-text-muted">
                {CHARACTERS[characterId].name}: {progression.freeMasteryPoints} Mastery Points
                available
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Level {progression.level}</span>
              <Button
                variant="ghost"
                disabled={refunded === 0 || save.currencies.gold < cost}
                onClick={() => setConfirmRespec(true)}
              >
                Respec {cost} Gold
              </Button>
            </div>
          </header>
          <div
            role="tablist"
            aria-label="Disciplines"
            aria-orientation="horizontal"
            className="mb-5 flex overflow-x-auto border-b border-border/70 pb-2"
          >
            {MASTERY_TAB_ORDER.map((id, index) => {
              const active = id === discipline;
              const weapon = id === 'weapon';
              return (
                <div
                  key={id}
                  className={`flex shrink-0 ${index === 1 ? 'ml-3 border-l border-ornament/60 pl-3' : ''}`}
                >
                  <button
                    id={`mastery-tab-${id}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`mastery-tree-panel-${id}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => selectDiscipline(id)}
                    onKeyDown={(event) => handleTabKey(event, id, selectDiscipline)}
                    className={`rounded-md px-3 py-2 text-xs font-semibold tracking-wide transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${weapon ? 'border border-ornament bg-ember/10 text-accent-strong shadow-glow-accent' : active ? 'bg-accent/15 text-accent-strong' : 'text-text-muted hover:text-text'}`}
                  >
                    {disciplineLabel(id, characterId)}
                    {investedPoints(progression.masteryRanks, id) > 0
                      ? ` [${investedPoints(progression.masteryRanks, id)}]`
                      : ''}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="grid min-w-0 gap-5 @min-[1280px]:grid-cols-[minmax(0,1fr)_19rem] @min-[1280px]:items-start">
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
              <div className="min-w-0 @min-[1280px]:sticky @min-[1280px]:top-5">
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
