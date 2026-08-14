import type { KeyboardEvent } from 'react';
import { CRUCIBLE_TREES, type CrucibleTreeId } from '@/game/crucible/crucible';
import { CRUCIBLE_TREE_PRESENTATION } from './cruciblePresentation';

interface CrucibleTreeNavigationProps {
  activeTree: CrucibleTreeId;
  onSelect: (tree: CrucibleTreeId) => void;
}

/** Horizontal tree tabs with clipped background art and individual ornamental frames. */
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
    <aside
      aria-label="Crucible tree selection"
      className="min-w-0"
      data-testid="crucible-tree-navigation"
    >
      <div className="overflow-x-auto py-1">
        <div
          role="tablist"
          aria-label="Trees"
          aria-orientation="horizontal"
          className="grid h-16 min-w-168 grid-cols-3 gap-1"
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
                data-state={isActive ? 'active' : 'inactive'}
                onClick={() => onSelect(tree)}
                onKeyDown={(event) => handleTreeKeyDown(event, tree)}
                className={`group relative isolate flex min-w-0 items-center justify-center px-5 text-center font-display text-xs tracking-wide transition-colors motion-reduce:transition-none focus-visible:z-30 focus-visible:outline-2 focus-visible:outline-offset-[-5px] focus-visible:outline-accent ${
                  isActive ? 'text-accent-strong' : 'text-text-muted hover:text-text'
                }`}
              >
                <span
                  aria-hidden="true"
                  data-crucible-tab-surface
                  className={`${presentation.tabBackgroundClass} tab-ornate-surface pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-[filter,opacity] motion-reduce:transition-none ${
                    isActive
                      ? 'opacity-100 brightness-100 saturate-100'
                      : 'opacity-75 brightness-60 saturate-50 group-hover:opacity-95 group-hover:brightness-85 group-hover:saturate-75'
                  }`}
                />
                <span
                  aria-hidden="true"
                  data-ornate-tab-frame
                  className={`border-image-tab-ornate pointer-events-none absolute inset-0 z-10 transition-[opacity,filter] motion-reduce:transition-none ${
                    isActive
                      ? 'opacity-100 drop-shadow-[0_0_7px_rgb(245_158_11/0.35)]'
                      : 'opacity-50 grayscale-[.25] group-hover:opacity-80'
                  }`}
                />
                <span className="relative z-20 truncate drop-shadow-[0_1px_3px_rgb(0_0_0/0.95)]">
                  {presentation.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
