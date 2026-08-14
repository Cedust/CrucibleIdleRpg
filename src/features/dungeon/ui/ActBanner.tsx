import type { ActDisplayMeta, DungeonBackgroundId } from '@/game/encounters/actMeta';
import { stateAttrs, transitionState } from '@/shared/ui/utils/state';

import { DUNGEON_BACKGROUND_CLASSES } from './dungeonBackgrounds';
import { Lock } from 'lucide-react';
import { cn } from '@/shared/ui/utils/cn';

/**
 * Banner-Framing der Akt-Szenerien: Der schmale Hochformat-Ausschnitt zeigt
 * das Weg-Motiv des Bildes mittig (Ashen Depths: Glut-Treppe bei ~75 %,
 * Ember Foundry: Lava-Weg bei ~55 % der Bildbreite).
 */
const ART_POSITION_CLASSES: Record<DungeonBackgroundId, string> = {
  'ashen-depths': 'bg-position-[80%_50%]',
  'ember-foundry': 'bg-position-[58%_50%]',
  'forgotten-citadel': 'bg-center',
};

interface ActBannerProps {
  act: ActDisplayMeta;
  /** Exklusives Highlight des aktiven Akts; mit Akt-2-Content wird die Liste zur Radio-Group. */
  selected: boolean;
}

/**
 * Hängendes Akt-Banner der Dungeon-Auswahl
 * (concept/ui-draft-2/ui-dungeon-selection-v5.png): Layer-Stack aus Akt-Szenerie,
 * Scrim und 9-Slice-Bannerrahmen. Die Breite kommt aus --spacing-banner, weil
 * der Rahmen horizontal asset-gebunden skaliert (border-image-banner,
 * index.css); die Höhe streckt allein das Schienenband. `selected` trägt
 * Höhengewicht, vollen Rahmen und Glow; Akte ohne Content sind `locked`:
 * gedimmte Art, reduzierter Rahmen, Schloss-Medaillon im Kopf-Slot.
 */
export function ActBanner({ act, selected }: ActBannerProps) {
  const locked = !act.hasContent;

  return (
    <li
      {...stateAttrs({ selected, semantic: locked ? 'locked' : 'normal' })}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'relative isolate w-banner',
        'not-first:-mt-2',
        'h-[calc(var(--spacing-banner)*0.95)] data-selected:h-[calc(var(--spacing-banner)*1.2)]',
        '@min-[42rem]:h-auto @min-[42rem]:basis-0 @min-[42rem]:grow @min-[42rem]:data-selected:grow-[1.2]',
        '@min-[42rem]:min-h-[calc(var(--spacing-banner)*0.95)] @min-[42rem]:max-h-[calc(var(--spacing-banner)*1.2)]',
        '@min-[42rem]:data-selected:min-h-[calc(var(--spacing-banner)*1.2)] @min-[42rem]:data-selected:max-h-[calc(var(--spacing-banner)*1.5)]',
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'banner-act-surface -z-20 bg-surface bg-cover',
          DUNGEON_BACKGROUND_CLASSES[act.backgroundId],
          ART_POSITION_CLASSES[act.backgroundId],
          transitionState,
          locked && 'opacity-(--state-deemphasis-medium) grayscale-50',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'banner-act-surface -z-10',
          transitionState,
          selected
            ? 'bg-linear-to-b from-background/55 via-background/25 to-transparent'
            : 'bg-linear-to-b from-background/78 via-background/50 to-background/25',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 z-10 border-image-banner',
          transitionState,
          selected
            ? 'drop-shadow-glow-accent'
            : locked
              ? 'opacity-(--state-deemphasis-strong)'
              : 'opacity-(--state-deemphasis-weak)',
        )}
      />
      {/* Inhalt auf der Bannerfläche: Insets folgen der Rahmen-Innenkontur,
          die Unterkante bleibt über der V-Schulter. Whitespace-Textknoten
          trennen Status, Label und Name im Textinhalt des Banners. */}
      <div className="absolute inset-[calc(var(--spacing-banner)*0.16)_calc(var(--spacing-banner)*0.2)_calc(var(--spacing-banner)*0.27)] flex flex-col items-center justify-start gap-1 text-center drop-shadow-text-contrast">
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-full',
            locked && 'border border-ornament/50 bg-background/70 text-text-muted',
          )}
        >
          {locked && (
            <>
              <Lock aria-hidden="true" className="size-4" />
              <span className="sr-only">Locked</span>
            </>
          )}
        </span>{' '}
        <p
          className={cn(
            'font-display text-display',
            transitionState,
            selected ? 'text-accent-strong' : 'text-text',
          )}
        >
          {act.label}
        </p>{' '}
        <p className="text-sm tracking-wide text-text-muted">{act.name}</p>
      </div>
    </li>
  );
}
