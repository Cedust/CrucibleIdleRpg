import type { KeyboardEvent } from 'react';
import { CRUCIBLE_TREES, type CrucibleTreeId } from '@/game/crucible/crucible';
import { Panel } from '@/shared/ui/Panel';
import { CRUCIBLE_TREE_PRESENTATION } from './cruciblePresentation';

interface CrucibleTreeNavigationProps {
  activeTree: CrucibleTreeId;
  onSelect: (tree: CrucibleTreeId) => void;
}

/** Horizontal tree tabs with decorative, non-semantic background art. */
export function CrucibleTreeNavigation({ activeTree, onSelect }: CrucibleTreeNavigationProps) {
  const handleTreeKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tree: CrucibleTreeId) => {
    const currentIndex = CRUCIBLE_TREES.indexOf(tree);
    const lastIndex = CRUCIBLE_TREES.length - 1;
    const nextIndex =
      event.key === 'ArrowRight'
        ? (currentIndex + 1) % CRUCIBLE_TREES.length
        : event.key === 'ArrowLeft'
          ? (currentIndex - 1 + CRUCIBLE_TREES.length) % CRUCIBLE_TREES.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? lastIndex
              : null;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextTree = CRUCIBLE_TREES[nextIndex];
    if (nextTree === undefined) return;
    onSelect(nextTree);
    document.getElementById(`crucible-tree-tab-${nextTree}`)?.focus();
  };

  return (
    <Panel
      as="aside"
      variant="ornateCompact"
      padding="none"
      className="min-w-0"
      aria-label="Crucible tree selection"
      data-testid="crucible-tree-navigation"
    >
      <div
        role="tablist"
        aria-label="Trees"
        aria-orientation="horizontal"
        className="grid h-16 grid-cols-3"
      >
        {CRUCIBLE_TREES.map((tree) => {
          const presentation = CRUCIBLE_TREE_PRESENTATION[tree];
          const isActive = tree === activeTree;

          return (
            <button
              key={tree}
              id={`crucible-tree-tab-${tree}`}
              type="button"
              role="tab"
              aria-label={presentation.label}
              aria-selected={isActive}
              aria-controls={`crucible-tree-panel-${tree}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelect(tree)}
              onKeyDown={(event) => handleTreeKeyDown(event, tree)}
              className={`${presentation.tabBackgroundClass} flex min-w-0 items-center justify-center bg-cover bg-center bg-no-repeat px-2 text-center font-display text-xs tracking-wide bg-blend-multiply transition-colors motion-reduce:transition-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
                tree === CRUCIBLE_TREES[0] ? '' : 'border-l border-border'
              } ${
                isActive
                  ? 'bg-background/20 text-accent-strong shadow-[inset_0_-2px_var(--color-accent)]'
                  : 'bg-background/65 text-text hover:bg-background/45 hover:text-accent-strong'
              }`}
            >
              <span className="drop-shadow-[0_1px_3px_rgb(0_0_0/0.95)]">{presentation.label}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
