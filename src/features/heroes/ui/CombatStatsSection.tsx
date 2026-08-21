import { TONE_TEXT_CLASSES, combatStatRows, formatStatValue } from './statsPresentation';

import type { DerivedStats } from '@/game/types';
import { Icon } from '@/shared/ui/icons/Icon';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { cn } from '@/shared/ui/utils/cn';

/**
 * Die drei Derived Stats als erste und damit optisch führende Gruppe des linken Spalten-Panels:
 * dieselbe Tabellenstruktur wie die übrigen Stat-Gruppen, nur in großem Maßstab — Medaillon und
 * Label links, Wert rechts über die volle Spaltenbreite. Die Tönung des Stats trägt allein die
 * Glyphe, das Label steht in der Textfarbe der Ansicht und der Wert im Display-Gold der
 * Zwischentitel.
 *
 * Der Ring des Medaillons ist das Asset `medallion-stat.png` als CSS-Background, die Füllung
 * die abgerundete Fläche darunter. Seine Öffnung nimmt 70 % der Bildbreite ein, der Ring die
 * restlichen 15 % je Seite; die Glyphe steht darum eine Stufe kleiner als der Wert daneben in
 * `size-lg` und füllt 57 % des Medaillons (concept/PROMPTS.md §40).
 */
export function CombatStatsSection({ derived }: { derived: DerivedStats }) {
  return (
    <section className="min-w-0" data-testid="heroes-combat-stats">
      <SectionTitle as="h3">Combat</SectionTitle>
      <dl className="mt-1.5 divide-y divide-border/50 border-t border-border/50">
        {combatStatRows(derived).map((row) => (
          <div
            key={row.label}
            data-combat-stat={row.label.toLowerCase()}
            className="flex items-center gap-4 px-2 py-2"
          >
            <span
              aria-hidden="true"
              className="flex size-portrait-sm shrink-0 items-center justify-center rounded-full bg-surface-raised/70 bg-[url(/assets/frames/medallion-stat.png)] bg-cover bg-center"
            >
              <Icon
                name={row.icon}
                size="lg"
                className={cn('bg-current', TONE_TEXT_CLASSES[row.tone])}
              />
            </span>
            <dt className="min-w-0 flex-1 truncate font-display text-base text-text">
              {row.label}
            </dt>
            <dd className="font-display text-display tabular-nums text-accent-strong">
              {formatStatValue({ value: row.value })}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
