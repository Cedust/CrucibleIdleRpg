import type { ActDisplayMeta, ActId, DungeonBackgroundId } from '@/game/encounters/actMeta';
import { stateAttrs, transitionState } from '@/shared/ui/utils/state';

import { DUNGEON_BACKGROUND_CLASSES } from './dungeonBackgrounds';
import { Lock } from 'lucide-react';
import { cn } from '@/shared/ui/utils/cn';

/**
 * Panel-Framing der Akt-Szenerien: Der breite Querformat-Ausschnitt zeigt das
 * Weg-Motiv des Bildes mittig (Ashen Depths: Glut-Treppe bei ~75 %,
 * Ember Foundry: Lava-Weg bei ~55 % der Bildbreite).
 */
const ART_POSITION_CLASSES: Record<DungeonBackgroundId, string> = {
  'ashen-depths': 'bg-position-[center_55%]',
  'ember-foundry': 'bg-position-[center_35%]',
  'forgotten-citadel': 'bg-position-[center_45%]',
};

/** Akt-Numerale im Medaillon; die Akt-IDs sind statisch (actMeta.ts). */
const ACT_NUMERALS: Record<ActId, string> = {
  'act-1': 'I',
  'act-2': 'II',
  'act-3': 'III',
};

interface ActPanelProps {
  act: ActDisplayMeta;
  /** Exklusives Highlight des aktiven Akts; mit Akt-2-Content wird die Liste zur Radio-Group. */
  selected: boolean;
}

/**
 * Breites Akt-Panel der Dungeon-Auswahl
 * (concept/ui-draft-3/ui-dungeons-selection-v1.png + v2.png): Layer-Stack aus
 * Akt-Szenerie, Scrim und 9-Slice-Goldrahmen (border-image-standard, index.css).
 * Links trägt das Stachel-Medaillon die Akt-Numerale, mittig oben stehen
 * Akt-Label und Akt-Name. Die Höhe kommt aus --spacing-act-panel, die Breite
 * aus dem 3er-Grid des Screens. `selected` trägt vollen Rahmen und Glow;
 * Akte ohne Content sind `locked`: gedimmte Art, reduzierter Rahmen,
 * Lock-Indikator am Label.
 */
export function ActPanel({ act, selected }: ActPanelProps) {
  const locked = !act.hasContent;

  return (
    <li
      {...stateAttrs({ selected, semantic: locked ? 'locked' : 'normal' })}
      aria-current={selected ? 'true' : undefined}
      className="relative isolate h-act-panel min-w-0"
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 -z-20 bg-surface bg-cover',
          DUNGEON_BACKGROUND_CLASSES[act.backgroundId],
          ART_POSITION_CLASSES[act.backgroundId],
          transitionState,
          locked && 'opacity-(--state-deemphasis-medium) grayscale-50',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 -z-10',
          transitionState,
          selected
            ? 'bg-linear-to-b from-background/55 via-background/25 to-transparent'
            : 'bg-linear-to-b from-background/78 via-background/50 to-background/25',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 z-10 border-image-standard',
          transitionState,
          selected
            ? 'drop-shadow-glow-accent'
            : locked
              ? 'opacity-(--state-deemphasis-strong)'
              : 'opacity-(--state-deemphasis-weak)',
        )}
      />
      {/* Inhalt auf der Panelfläche: Medaillon links, Textblock mittig oben;
          der unsichtbare Spacer rechts hält den Textblock in der Panelmitte.
          Whitespace-Textknoten trennen die Spans im Textinhalt des Panels. */}
      <div className="absolute inset-0 flex items-center gap-3 px-5 drop-shadow-text-contrast">
        <span aria-hidden="true" className="relative shrink-0">
          <img src="/assets/frames/medallion-act.png" alt="" className="size-medallion-sm" />
          <span className="absolute inset-0 flex items-center justify-center font-display text-display text-accent-strong">
            {ACT_NUMERALS[act.id]}
          </span>
        </span>{' '}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 self-start pt-2.5 text-center">
          <p
            className={cn(
              'flex items-center gap-1.5 font-display text-display',
              transitionState,
              selected ? 'text-accent-strong' : locked ? 'text-text-muted' : 'text-text',
            )}
          >
            <span>{act.label}</span>
            {locked && (
              <>
                <Lock aria-hidden="true" className="size-4" />
                <span className="sr-only">Locked</span>
              </>
            )}
          </p>{' '}
          <p className="text-sm tracking-wide text-text-muted">{act.name}</p>
        </div>{' '}
        <span aria-hidden="true" className="w-medallion-sm shrink-0" />
      </div>
    </li>
  );
}
