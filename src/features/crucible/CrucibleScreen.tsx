import { useState } from 'react';
import {
  CRUCIBLE_NODES,
  CRUCIBLE_TREES,
  crucibleNodeById,
  investedCrystals,
  purchaseFailure,
  RESPECCABLE_TREES,
  type CrucibleTreeId,
  type RespeccableTreeId,
} from '@/game/crucible/crucible';
import { useSaveStore } from '@/features/save/saveStore';
import { Button } from '@/shared/ui/Button';
import { CrucibleNodeInspector } from './CrucibleNodeInspector';
import { CrucibleRespecDialog } from './CrucibleRespecDialog';

const TREE_LABEL: Record<CrucibleTreeId, string> = {
  anvil: 'ANVIL SPARKS',
  smelting: 'SMELTING FLAMES',
  molten: 'MOLTEN CAST',
  masterwork: 'MASTERWORK',
};

function isRespeccable(tree: CrucibleTreeId): tree is RespeccableTreeId {
  return (RESPECCABLE_TREES as readonly CrucibleTreeId[]).includes(tree);
}

/**
 * Der Crucible-Screen: vier Trees mit Rängen, Kosten, Voraussetzungen und Sperrgründen
 * (docs/spec/PROGRESSION.md#3-crucible-globaler-skilltree). Kaufen ist explizit; ein Klick auf
 * einen Node wählt ihn nur aus. Während eines Runs ist der Screen nicht erreichbar und der
 * Save-Store lehnt Kauf und Respec zusätzlich ab (PROGRESSION §4).
 */
export function CrucibleScreen() {
  const save = useSaveStore((state) => state.data);
  const buy = useSaveStore((state) => state.buyCrucibleNode);
  const respec = useSaveStore((state) => state.respecCrucible);
  const [tree, setTree] = useState<CrucibleTreeId>('anvil');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmRespec, setConfirmRespec] = useState(false);

  if (save === null) return <p className="text-text-muted">Loading crucible…</p>;
  const nodes = CRUCIBLE_NODES.filter((node) => node.tree === tree);
  const selected = crucibleNodeById(selectedId ?? '') ?? nodes[0];
  const refunded = investedCrystals(save.crucible, tree);
  const lockReason = selected
    ? purchaseFailure(save.crucible, save.currencies.crystals, save.completedDungeons, selected.id)
    : 'Select a node.';

  return (
    <section className="min-w-0" aria-label="Crucible">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 lg:pr-80">
        <div>
          <h2 className="text-xl font-semibold">Crucible</h2>
          <p className="text-sm text-text-muted">
            {save.currencies.crystals} Crystals available — each rank costs its rank number.
          </p>
        </div>
        {isRespeccable(tree) && (
          <Button variant="ghost" disabled={refunded === 0} onClick={() => setConfirmRespec(true)}>
            Respec {TREE_LABEL[tree]}
          </Button>
        )}
      </header>
      <div role="group" aria-label="Trees" className="mb-4 flex flex-wrap gap-2">
        {CRUCIBLE_TREES.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === tree}
            onClick={() => {
              setTree(id);
              setSelectedId(null);
            }}
            className={`rounded-md px-3 py-2 text-sm ${id === tree ? 'bg-accent/15 text-accent' : 'bg-surface text-text-muted'}`}
          >
            {TREE_LABEL[id]}
            {investedCrystals(save.crucible, id) > 0
              ? ` [${investedCrystals(save.crucible, id)}]`
              : ''}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_17rem] gap-4">
        <div className="space-y-2" aria-label={`${TREE_LABEL[tree]} tree`}>
          {nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => setSelectedId(node.id)}
              className={`w-full rounded-md border p-2 text-left text-sm ${selected?.id === node.id ? 'border-accent bg-accent/10' : 'border-border bg-surface'} ${node.lockedUntil !== undefined ? 'opacity-60' : ''}`}
            >
              <span className="block font-semibold">
                {node.name}
                {node.lockedUntil !== undefined ? ' 🔒' : ''}
              </span>
              <span className="text-text-muted">
                {save.crucible[node.id] ?? 0}/{node.maxRank}
                {node.lockedUntil !== undefined ? ` — locked until ${node.lockedUntil}` : ''}
              </span>
            </button>
          ))}
        </div>
        {selected && (
          <CrucibleNodeInspector
            node={selected}
            rank={save.crucible[selected.id] ?? 0}
            lockReason={lockReason}
            onInvest={() => void buy(selected.id)}
          />
        )}
      </div>
      {confirmRespec && isRespeccable(tree) && (
        <CrucibleRespecDialog
          treeLabel={TREE_LABEL[tree]}
          refundedCrystals={refunded}
          onCancel={() => setConfirmRespec(false)}
          onConfirm={() => {
            void respec(tree);
            setConfirmRespec(false);
          }}
        />
      )}
    </section>
  );
}
