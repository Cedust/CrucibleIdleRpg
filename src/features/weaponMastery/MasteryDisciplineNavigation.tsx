import type { CharacterId } from '@/game/types';
import { investedPoints, type DisciplineId } from '@/game/weaponMastery/mastery';
import { cn } from '@/shared/ui/cn';
import { OrnateTab, OrnateTabs } from '@/shared/ui/OrnateTabs';
import { transitionState } from '@/shared/ui/state';
import { useRovingFocus } from '@/shared/ui/useRovingFocus';
import { disciplineLabel, MASTERY_TAB_ORDER } from './masteryPresentation';

const WEAPON_ICON_CLASS: Record<CharacterId, string> = {
  korvin: 'mastery-tab-icon-warhammer',
  rhaya: 'mastery-tab-icon-twin-blades',
  quinn: 'mastery-tab-icon-longbow',
};

const DISCIPLINE_ICON_CLASS: Record<Exclude<DisciplineId, 'weapon'>, string> = {
  finesse: 'mastery-tab-icon-finesse',
  tempest: 'mastery-tab-icon-tempest',
  dominance: 'mastery-tab-icon-dominance',
  valor: 'mastery-tab-icon-valor',
};

function iconClass(discipline: DisciplineId, characterId: CharacterId): string {
  return discipline === 'weapon'
    ? WEAPON_ICON_CLASS[characterId]
    : DISCIPLINE_ICON_CLASS[discipline];
}

function iconName(discipline: DisciplineId, characterId: CharacterId): string {
  return discipline === 'weapon' ? `weapon-${characterId}` : `discipline-${discipline}`;
}

interface MasteryDisciplineNavigationProps {
  activeDiscipline: DisciplineId;
  characterId: CharacterId;
  masteryRanks: Readonly<Record<string, number>>;
  onSelect: (discipline: DisciplineId) => void;
}

/** Five live, keyboard-operated tabs with individual ornamental frames. */
export function MasteryDisciplineNavigation({
  activeDiscipline,
  characterId,
  masteryRanks,
  onSelect,
}: MasteryDisciplineNavigationProps) {
  const rovingProps = useRovingFocus({
    items: MASTERY_TAB_ORDER,
    selected: activeDiscipline,
    onSelect,
    itemDomId: (discipline) => `mastery-tab-${discipline}`,
  });

  return (
    <aside
      aria-label="Discipline selection"
      className="mb-5 min-w-0"
      data-testid="mastery-discipline-navigation"
    >
      <OrnateTabs
        label="Disciplines"
        className="min-w-200 grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]"
      >
        {MASTERY_TAB_ORDER.map((discipline) => {
          const points = investedPoints(masteryRanks, discipline);

          return (
            <OrnateTab
              key={discipline}
              id={`mastery-tab-${discipline}`}
              selected={discipline === activeDiscipline}
              controls={`mastery-tree-panel-${discipline}`}
              onClick={() => onSelect(discipline)}
              className="gap-2 font-semibold"
              surface={
                <span
                  aria-hidden="true"
                  data-ornate-tab-surface
                  className={cn(
                    'tab-ornate-surface pointer-events-none z-0',
                    transitionState,
                    'bg-background/85 group-hover:bg-surface/95',
                    'group-data-selected:bg-transparent group-data-selected:bg-linear-to-b group-data-selected:from-ember/30 group-data-selected:via-ember/20 group-data-selected:to-surface/90 group-data-selected:shadow-glow-ember-inset',
                  )}
                />
              }
              {...rovingProps(discipline)}
            >
              <span
                aria-hidden="true"
                data-mastery-tab-icon={iconName(discipline, characterId)}
                className={`mastery-tab-icon relative z-20 size-7 shrink-0 bg-current ${iconClass(discipline, characterId)}`}
              />
              <span className="relative z-20 truncate drop-shadow-[0_1px_3px_rgb(0_0_0/0.95)]">
                {disciplineLabel(discipline, characterId)}
                {points > 0 ? ` [${points}]` : ''}
              </span>
            </OrnateTab>
          );
        })}
      </OrnateTabs>
    </aside>
  );
}
