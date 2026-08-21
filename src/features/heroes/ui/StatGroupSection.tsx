import { Icon } from '@/shared/ui/icons/Icon';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { cn } from '@/shared/ui/utils/cn';
import { formatStatValue, TONE_TEXT_CLASSES, type StatGroup } from './statsPresentation';

/**
 * Liste einer Stat-Gruppe innerhalb des Spalten-Panels: Glyphe und Label links, Werte rechts. Die
 * Glyphe trägt die Tönung ihrer Zeile, sonst die der Gruppe — so tönen die Core Stats je Zeile
 * nach Achse, während die übrigen Gruppen geschlossen bleiben.
 *
 * Die Liste ist ein Grid, jede Zeile ein `grid-cols-subgrid`-Kind; Kopfzeile und Zeilen teilen
 * damit dieselben Spuren, und `divide-y` trennt weiter zeilenweise. Gruppen mit `valueColumns`
 * tragen zwei Wertspalten und beschriften sie einmal klein im Kopf — die Offensive Stats stehen
 * so paarweise als Chance und Damage je Muster. Der Kopf ist rein visuell; für Screenreader
 * trägt jede `dd` ihren Qualifier selbst.
 */
export function StatGroupSection({ group, className }: { group: StatGroup; className?: string }) {
  const { valueColumns } = group;

  return (
    <section className={cn('min-w-0', className)} data-stat-group={group.label}>
      <SectionTitle as="h3" tone={group.tone}>
        {group.label}
      </SectionTitle>
      <dl
        className={cn(
          'mt-1 grid gap-x-3 divide-y divide-border/50 border-t border-border/50',
          valueColumns === undefined
            ? 'grid-cols-[auto_minmax(0,1fr)_auto]'
            : 'grid-cols-[auto_minmax(0,1fr)_auto_auto]',
        )}
      >
        {valueColumns === undefined ? null : (
          <div
            aria-hidden="true"
            data-stat-columns=""
            className="col-span-full grid grid-cols-subgrid pb-0.5 text-2xs uppercase tracking-wider text-text-muted"
          >
            <span />
            <span />
            <span className="text-right">{valueColumns[0]}</span>
            <span className="text-right">{valueColumns[1]}</span>
          </div>
        )}
        {group.stats.map((stat) => (
          <div
            key={stat.label}
            className="col-span-full grid grid-cols-subgrid items-center py-1"
            data-stat-row={stat.label}
          >
            <Icon
              name={stat.icon}
              size="lg"
              className={cn('bg-current', TONE_TEXT_CLASSES[stat.tone ?? group.tone])}
            />
            <dt className="min-w-0 truncate text-text-muted">{stat.label}</dt>
            <dd className="text-right font-medium tabular-nums text-text">
              {valueColumns === undefined ? null : (
                <span className="sr-only">{valueColumns[0]} </span>
              )}
              {formatStatValue(stat)}
            </dd>
            {stat.pairedValue === undefined || valueColumns === undefined ? null : (
              <dd className="text-right font-medium tabular-nums text-text">
                <span className="sr-only">{valueColumns[1]} </span>
                {formatStatValue({ value: stat.pairedValue, format: stat.format })}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
