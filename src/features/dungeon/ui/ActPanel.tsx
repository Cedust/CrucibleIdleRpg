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
          act.hasContent ? '' : 'opacity-40'
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
          act.hasContent
            ? 'from-background/70 to-background/15'
            : 'from-background/90 to-background/35'
        }`}
      />
      <div className="flex h-full flex-col justify-end gap-1">
        {/* Whitespace-Textknoten trennen Label, Name und Status im Textinhalt des Panels. */}
        <p className={`font-display text-display ${act.hasContent ? 'text-accent' : 'text-text'}`}>
          {act.label}
        </p>{' '}
        <p className="text-sm tracking-wide text-text-muted">{act.name}</p>{' '}
        {!act.hasContent && (
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <Lock aria-hidden="true" className="size-3.5" />
            Locked
          </p>
        )}
      </div>
    </li>
  );
}
