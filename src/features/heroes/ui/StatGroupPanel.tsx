import { Icon } from '@/shared/ui/icons/Icon';
import { Panel } from '@/shared/ui/layout/Panel';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { cn } from '@/shared/ui/utils/cn';
import { formatStatValue, TONE_TEXT_CLASSES, type StatGroup } from './statsPresentation';

/**
 * Listen-Panel einer Stat-Gruppe: Glyphe und Label links, Wert rechts. Die Glyphe trägt die
 * Tönung ihrer Zeile, sonst die der Gruppe — so tönen die Core Stats je Zeile nach Achse,
 * während die übrigen Gruppen geschlossen bleiben.
 */
export function StatGroupPanel({ group, className }: { group: StatGroup; className?: string }) {
  return (
    <Panel
      as="section"
      padding="md"
      className={cn('min-w-0', className)}
      data-stat-group={group.label}
    >
      <SectionTitle as="h3" tone={group.tone}>
        {group.label}
      </SectionTitle>
      <dl className="mt-1 divide-y divide-border/50 border-t border-border/50">
        {group.stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 py-1">
            <Icon
              name={stat.icon}
              size="lg"
              className={cn('bg-current', TONE_TEXT_CLASSES[stat.tone ?? group.tone])}
            />
            <dt className="min-w-0 flex-1 truncate text-text-muted">{stat.label}</dt>
            <dd className="font-medium tabular-nums text-text">{formatStatValue(stat)}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
