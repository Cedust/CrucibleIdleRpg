import type { KeyboardEvent } from 'react';
import type { CharacterId } from '@/game/types';
import { investedPoints, type DisciplineId } from '@/game/weaponMastery/mastery';
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
  return (
    <aside
      aria-label="Discipline selection"
      className="mb-5 min-w-0"
      data-testid="mastery-discipline-navigation"
    >
      <div className="overflow-x-auto py-1">
        <div
          role="tablist"
          aria-label="Disciplines"
          aria-orientation="horizontal"
          className="grid h-16 min-w-200 grid-cols-[1.2fr_repeat(4,minmax(0,1fr))] gap-1"
        >
          {MASTERY_TAB_ORDER.map((discipline) => {
            const active = discipline === activeDiscipline;
            const points = investedPoints(masteryRanks, discipline);
            return (
              <button
                key={discipline}
                id={`mastery-tab-${discipline}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`mastery-tree-panel-${discipline}`}
                tabIndex={active ? 0 : -1}
                data-state={active ? 'active' : 'inactive'}
                onClick={() => onSelect(discipline)}
                onKeyDown={(event) => handleTabKey(event, discipline, onSelect)}
                className={`group relative isolate flex min-w-0 items-center justify-center gap-2 px-5 font-display text-xs font-semibold tracking-wide transition-colors motion-reduce:transition-none focus-visible:z-30 focus-visible:outline-2 focus-visible:outline-offset-[-5px] focus-visible:outline-accent ${active ? 'text-accent-strong' : 'text-text-muted hover:text-text'}`}
              >
                <span
                  aria-hidden="true"
                  data-mastery-tab-surface
                  className={`mastery-tab-surface pointer-events-none z-0 transition-colors motion-reduce:transition-none ${active ? 'bg-linear-to-b from-ember/30 via-ember/20 to-surface/90 shadow-[inset_0_0_20px_rgb(226_88_34/0.42)]' : 'bg-background/85 group-hover:bg-surface/95'}`}
                />
                <span
                  aria-hidden="true"
                  data-mastery-tab-frame
                  className={`border-image-mastery-tab pointer-events-none absolute inset-0 z-10 transition-[opacity,filter] motion-reduce:transition-none ${active ? 'opacity-100 drop-shadow-[0_0_7px_rgb(245_158_11/0.35)]' : 'opacity-50 grayscale-[.25] group-hover:opacity-80'}`}
                />
                <span
                  aria-hidden="true"
                  data-mastery-tab-icon={iconName(discipline, characterId)}
                  className={`mastery-tab-icon relative z-20 size-7 shrink-0 bg-current ${iconClass(discipline, characterId)}`}
                />
                <span className="relative z-20 truncate drop-shadow-[0_1px_3px_rgb(0_0_0/0.95)]">
                  {disciplineLabel(discipline, characterId)}
                  {points > 0 ? ` [${points}]` : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
