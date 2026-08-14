import { CRUCIBLE_TREES, type CrucibleTreeId } from '@/game/crucible/crucible';
import { cn } from '@/shared/ui/utils/cn';
import { OrnateTab, OrnateTabs } from '@/shared/ui/controls/OrnateTabs';
import { transitionState } from '@/shared/ui/utils/state';
import { useRovingFocus } from '@/shared/ui/utils/useRovingFocus';
import { CRUCIBLE_TREE_PRESENTATION } from '../cruciblePresentation';

interface CrucibleTreeNavigationProps {
  activeTree: CrucibleTreeId;
  onSelect: (tree: CrucibleTreeId) => void;
}

/** Horizontal tree tabs with clipped background art and individual ornamental frames. */
export function CrucibleTreeNavigation({ activeTree, onSelect }: CrucibleTreeNavigationProps) {
  const rovingProps = useRovingFocus({
    items: CRUCIBLE_TREES,
    selected: activeTree,
    onSelect,
    itemDomId: (tree) => `crucible-tree-tab-${tree}`,
  });

  return (
    <aside
      aria-label="Crucible tree selection"
      className="min-w-0"
      data-testid="crucible-tree-navigation"
    >
      <OrnateTabs label="Trees" className="min-w-2xl grid-cols-3">
        {CRUCIBLE_TREES.map((tree) => {
          const presentation = CRUCIBLE_TREE_PRESENTATION[tree];

          return (
            <OrnateTab
              key={tree}
              id={`crucible-tree-tab-${tree}`}
              aria-label={presentation.label}
              selected={tree === activeTree}
              controls={`crucible-tree-panel-${tree}`}
              onClick={() => onSelect(tree)}
              surface={
                <span
                  aria-hidden="true"
                  data-crucible-tab-surface
                  className={cn(
                    presentation.tabBackgroundClass,
                    'tab-ornate-surface pointer-events-none z-0 bg-cover bg-center bg-no-repeat',
                    transitionState,
                    'opacity-(--state-deemphasis-weak) brightness-60 saturate-50',
                    'group-hover:opacity-95 group-hover:brightness-85 group-hover:saturate-75',
                    'group-data-selected:opacity-100 group-data-selected:brightness-100 group-data-selected:saturate-100',
                  )}
                />
              }
              {...rovingProps(tree)}
            >
              <span className="relative z-20 truncate drop-shadow-text-contrast">
                {presentation.label}
              </span>
            </OrnateTab>
          );
        })}
      </OrnateTabs>
    </aside>
  );
}
