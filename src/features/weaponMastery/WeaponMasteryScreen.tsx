import { useState } from 'react';
import { CHARACTERS, TEAM_ORDER } from '@/game/characters/characters';
import {
  DISCIPLINES,
  investedPoints,
  nodeById,
  nodesFor,
  purchaseFailure,
  respecCost,
  type DisciplineId,
} from '@/game/weaponMastery/mastery';
import type { CharacterId } from '@/game/types';
import { useSaveStore } from '@/features/save/saveStore';
import { Button } from '@/shared/ui/Button';
import { NodeInspector } from './NodeInspector';
import { RespecDialog } from './RespecDialog';

const DISCIPLINE_LABEL: Record<DisciplineId, string> = {
  finesse: 'FINESSE',
  tempest: 'TEMPEST',
  dominance: 'DOMINANCE',
  valor: 'VALOR',
  weapon: 'WEAPON',
};
const RANKS = ['initiate', 'adept', 'expert', 'master', 'grandmaster'] as const;

/** Browser-facing Mastery tree. Buying is explicit; clicking a node only selects it. */
export function WeaponMasteryScreen() {
  const save = useSaveStore((state) => state.data);
  const buy = useSaveStore((state) => state.buyMasteryNode);
  const respec = useSaveStore((state) => state.respecDiscipline);
  const [characterId, setCharacterId] = useState<CharacterId>('korvin');
  const [discipline, setDiscipline] = useState<DisciplineId>('finesse');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmRespec, setConfirmRespec] = useState(false);

  if (save === null) return <p className="text-text-muted">Loading mastery…</p>;
  const progression = save.characters[characterId];
  const nodes = nodesFor(characterId).filter((node) => node.discipline === discipline);
  const selected = nodeById(characterId, selectedId ?? '') ?? nodes[0];
  const refunded = investedPoints(progression.masteryRanks, discipline);
  const cost = respecCost(refunded);
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
    <section className="flex min-h-[calc(100vh-10rem)] min-w-0 gap-4" aria-label="Weapon Mastery">
      <aside
        aria-label="Characters"
        className="flex w-20 shrink-0 flex-col gap-2 border-r border-border pr-3"
      >
        {TEAM_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setCharacterId(id);
              setSelectedId(null);
            }}
            aria-current={id === characterId ? 'true' : undefined}
            className={`rounded-md border px-2 py-3 text-xs font-semibold ${id === characterId ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted'}`}
          >
            {CHARACTERS[id].name}
          </button>
        ))}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Weapon Mastery</h2>
            <p className="text-sm text-text-muted">
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
        <div role="group" aria-label="Disciplines" className="mb-4 flex flex-wrap gap-2">
          {DISCIPLINES.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === discipline}
              onClick={() => {
                setDiscipline(id);
                setSelectedId(null);
              }}
              className={`rounded-md px-3 py-2 text-sm ${id === discipline ? 'bg-accent/15 text-accent' : 'bg-surface text-text-muted'}`}
            >
              {DISCIPLINE_LABEL[id]}
              {investedPoints(progression.masteryRanks, id) > 0
                ? ` [${investedPoints(progression.masteryRanks, id)}]`
                : ''}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-212.5 grid-cols-[minmax(0,1fr)_17rem] gap-4">
            <div
              className="grid grid-cols-5 gap-3"
              aria-label={`${DISCIPLINE_LABEL[discipline]} mastery tree`}
            >
              {RANKS.map((rank) => (
                <div key={rank} className="space-y-2">
                  <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {rank}
                  </h3>
                  {nodes
                    .filter((node) => node.rank === rank)
                    .map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedId(node.id)}
                        className={`w-full rounded-md border p-2 text-left text-xs ${selected?.id === node.id ? 'border-accent bg-accent/10' : 'border-border bg-surface'}`}
                      >
                        <span className="block font-semibold">{node.label}</span>
                        <span className="text-text-muted">
                          {progression.masteryRanks[node.id] ?? 0}/{node.maxRank}
                        </span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
            {selected && (
              <NodeInspector
                node={selected}
                rank={progression.masteryRanks[selected.id] ?? 0}
                lockReason={lockReason}
                onInvest={() => void buy(characterId, selected.id)}
              />
            )}
          </div>
        </div>
      </div>
      {confirmRespec && (
        <RespecDialog
          disciplineLabel={DISCIPLINE_LABEL[discipline]}
          refundedPoints={refunded}
          cost={cost}
          onCancel={() => setConfirmRespec(false)}
          onConfirm={() => {
            void respec(characterId, discipline);
            setConfirmRespec(false);
          }}
        />
      )}
    </section>
  );
}
