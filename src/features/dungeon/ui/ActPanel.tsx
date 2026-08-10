import type { ActDisplayMeta } from '@/game/encounters/actMeta';
import { DUNGEON_BACKGROUND_CLASSES } from './dungeonBackgrounds';
import { Lock } from 'lucide-react';

interface ActPanelProps {
  act: ActDisplayMeta;
}

/**
 * Statusanzeige eines Akts in der Dungeon-Auswahl. Solange nur Akt 1 Content hat,
 * ist das Panel bewusst kein Control; mit Akt-2-Content wird die Liste zur Radio-Group.
 */
export function ActPanel({ act }: ActPanelProps) {
  return (
    <li
      aria-current={act.hasContent ? 'true' : undefined}
      className={`relative isolate h-36 rounded-lg p-4 lg:h-auto lg:aspect-video ${
        act.hasContent ? 'shadow-glow-accent' : ''
      }`}
    >
      {/* Aktiver Akt = Frame in voller Stärke plus Glow, gesperrte gedimmt. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 border-image-thin ${
          act.hasContent ? 'shadow-glow-accent' : 'opacity-20'
        }`}
      />
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-20 rounded-md bg-surface bg-cover bg-center ${
          DUNGEON_BACKGROUND_CLASSES[act.backgroundId]
        } ${act.hasContent ? '' : 'opacity-50'}`}
      />
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 rounded-md bg-linear-to-t ${
          act.hasContent ? '' : 'from-background/90 to-background/35'
        }`}
      />
      <div className="flex h-full flex-col justify-end gap-1">
        {/* Whitespace-Textknoten trennen Label, Name und Status im Textinhalt des Panels. */}
        <div className="flex items-center justify-between gap-3">
          <p
            className={`font-display text-display ${act.hasContent ? 'text-accent-strong' : 'text-text'}`}
          >
            {act.label}
          </p>
          {!act.hasContent && (
            <span className="text-text-muted">
              <Lock aria-hidden="true" className="size-4" />
              <span className="sr-only">Locked</span>
            </span>
          )}
        </div>{' '}
        <p className="text-sm tracking-wide text-text-muted">{act.name}</p>{' '}
      </div>
    </li>
  );
}
