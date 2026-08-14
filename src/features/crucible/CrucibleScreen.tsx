import { useState } from 'react';
import { Stone } from 'lucide-react';
import {
  CRUCIBLE_NODES,
  crucibleNodeById,
  formatRelicShards,
  investedRelicShards,
  purchaseFailure,
  RESPECCABLE_TREES,
  type CrucibleTreeId,
  type RespeccableTreeId,
} from '@/game/crucible/crucible';
import { useSaveStore } from '@/features/save/saveStore';
import { ScreenLayout } from '@/shared/ui/ScreenLayout';
import { CrucibleNodeInspector } from './CrucibleNodeInspector';
import { CrucibleRespecDialog } from './CrucibleRespecDialog';
import { CrucibleTreeGraph } from './CrucibleTreeGraph';
import { CrucibleTreeNavigation } from './CrucibleTreeNavigation';
import { CRUCIBLE_TREE_PRESENTATION } from './cruciblePresentation';

function isRespeccable(tree: CrucibleTreeId): tree is RespeccableTreeId {
  return (RESPECCABLE_TREES as readonly CrucibleTreeId[]).includes(tree);
}

/**
 * Crucible pilot for Task 020: presentation is a keyboard-accessible top-down graph while all
 * purchase, respec and persistence rules stay in the existing game and save modules.
 */
export function CrucibleScreen() {
  const save = useSaveStore((state) => state.data);
  const buy = useSaveStore((state) => state.buyCrucibleNode);
  const respec = useSaveStore((state) => state.respecCrucible);
  const [tree, setTree] = useState<CrucibleTreeId>('anvil');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmRespec, setConfirmRespec] = useState(false);

  if (save === null) {
    return (
      <ScreenLayout background="crucible" className="min-h-full">
        <p aria-live="polite" className="text-text-muted">
          Loading crucible…
        </p>
      </ScreenLayout>
    );
  }

  const nodes = CRUCIBLE_NODES.filter((node) => node.tree === tree);
  const selected = crucibleNodeById(selectedId ?? '') ?? nodes[0];
  const refunded = investedRelicShards(save.crucible, tree);
  const lockReason = selected
    ? purchaseFailure(
        save.crucible,
        save.currencies.relicShards,
        save.completedDungeons,
        selected.id,
      )
    : 'Select a node.';

  return (
    <ScreenLayout background="crucible" className="min-h-full">
      <section className="@container min-w-0 max-w-384" aria-label="Crucible">
        <header className="mb-6">
          <h2 className="font-display text-display-lg text-accent-strong">Crucible</h2>
          <p className="mt-1 font-intro text-sm leading-6 text-text-muted">
            Beneath the ruined kingdom, the ancient Crucible still burns. Relic Shards reclaimed
            from conquered depths can be melted down and forged into new strength.
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-text">
            <Stone aria-hidden="true" className="size-4 text-info" />
            {formatRelicShards(save.currencies.relicShards)}
          </p>
        </header>

        <div
          data-testid="crucible-layout"
          className="grid min-w-0 gap-5 @min-[1200px]:grid-cols-[minmax(0,1fr)_19rem] @min-[1200px]:items-start"
        >
          <div className="min-w-0 @min-[1200px]:col-start-1">
            <CrucibleTreeNavigation
              activeTree={tree}
              onSelect={(treeId) => {
                setTree(treeId);
                setSelectedId(null);
              }}
            />
          </div>
          <div className="min-w-0 @min-[1200px]:col-start-1 @min-[1200px]:row-start-2">
            <CrucibleTreeGraph
              tree={tree}
              nodes={nodes}
              ranks={save.crucible}
              relicShards={save.currencies.relicShards}
              completedDungeons={save.completedDungeons}
              selectedId={selected?.id ?? null}
              respecDisabled={refunded === 0}
              onRequestRespec={isRespeccable(tree) ? () => setConfirmRespec(true) : undefined}
              onSelect={setSelectedId}
            />
          </div>
          {selected ? (
            <div className="min-w-0 @min-[1200px]:col-start-2 @min-[1200px]:row-start-2 @min-[1200px]:sticky @min-[1200px]:top-5">
              <CrucibleNodeInspector
                node={selected}
                rank={save.crucible[selected.id] ?? 0}
                lockReason={lockReason}
                onInvest={() => void buy(selected.id)}
              />
            </div>
          ) : null}
        </div>

        {confirmRespec && isRespeccable(tree) ? (
          <CrucibleRespecDialog
            treeLabel={CRUCIBLE_TREE_PRESENTATION[tree].label}
            treeIcon={CRUCIBLE_TREE_PRESENTATION[tree].icon}
            refundedRelicShards={refunded}
            onCancel={() => setConfirmRespec(false)}
            onConfirm={() => {
              void respec(tree);
              setConfirmRespec(false);
            }}
          />
        ) : null}
      </section>
    </ScreenLayout>
  );
}
