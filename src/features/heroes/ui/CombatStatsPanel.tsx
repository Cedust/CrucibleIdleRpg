import { TONE_TEXT_CLASSES, combatStatRows, formatStatValue } from './statsPresentation';

import type { DerivedStats } from '@/game/types';
import { Icon } from '@/shared/ui/icons/Icon';
import { Panel } from '@/shared/ui/layout/Panel';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { cn } from '@/shared/ui/utils/cn';

/**
 * Die drei Derived Stats in derselben Tabellenstruktur wie die übrigen Stat-Panels, nur in
 * großem Maßstab: Medaillon und Label links, Wert rechts über die volle Spaltenbreite. Die
 * Tönung des Stats trägt allein die Glyphe, das Label steht in der Textfarbe der Ansicht und
 * der Wert im Display-Gold der Zwischentitel.
 */
export function CombatStatsPanel({ derived }: { derived: DerivedStats }) {
  return (
    <Panel as="section" padding="md" className="min-w-0" data-testid="heroes-combat-stats">
      <SectionTitle as="h3" size="md">
        Combat
      </SectionTitle>
      <dl className="mt-1.5 divide-y divide-border/50 border-t border-border/50">
        {combatStatRows(derived).map((row) => (
          <div
            key={row.label}
            data-combat-stat={row.label.toLowerCase()}
            className="flex items-center gap-4 px-2 py-5.25"
          >
            <span
              aria-hidden="true"
              className="flex size-portrait-md shrink-0 items-center justify-center rounded-full border border-ornament/60 bg-surface-raised/70"
            >
              <Icon
                name={row.icon}
                size="xl"
                className={cn('bg-current', TONE_TEXT_CLASSES[row.tone])}
              />
            </span>
            <dt className="min-w-0 flex-1 truncate font-display font-semibold text-base text-text">
              {row.label}
            </dt>
            <dd className="font-display text-display-lg tabular-nums text-accent-strong">
              {formatStatValue({ value: row.value })}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
