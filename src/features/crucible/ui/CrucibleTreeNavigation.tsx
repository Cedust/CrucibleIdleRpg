import { CRUCIBLE_TREES, type CrucibleTreeId } from '@/game/crucible/crucible';
import { OrnateTab, OrnateTabs } from '@/shared/ui/controls/OrnateTabs';
import { Icon } from '@/shared/ui/icons/Icon';
import { useRovingFocus } from '@/shared/ui/utils/useRovingFocus';
import { CRUCIBLE_TREE_PRESENTATION } from '../cruciblePresentation';

interface CrucibleTreeNavigationProps {
  activeTree: CrucibleTreeId;
  onSelect: (tree: CrucibleTreeId) => void;
}

/** Horizontal tree tabs as segments of the shared ornamental tab bar. */
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
      className="mb-5 min-w-0"
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
              className="gap-2 font-semibold"
              {...rovingProps(tree)}
            >
              <Icon name={presentation.icon} />
              <span className="truncate">{presentation.label}</span>
            </OrnateTab>
          );
        })}
      </OrnateTabs>
    </aside>
  );
}
