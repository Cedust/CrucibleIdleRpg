import type { ActDisplayMeta } from '@/game/encounters/actMeta';
import { cn } from '@/shared/ui/cn';
import { FramedCard } from '@/shared/ui/FramedCard';
import { DUNGEON_BACKGROUND_CLASSES } from './dungeonBackgrounds';
import { Lock } from 'lucide-react';

interface ActPanelProps {
  act: ActDisplayMeta;
}

/**
 * Statusanzeige eines Akts in der Dungeon-Auswahl. Solange nur Akt 1 Content hat,
 * ist das Panel bewusst kein Control; mit Akt-2-Content wird die Liste zur Radio-Group.
 * „current" zeigt sich über vollen Frame, Gold-Titel und Glow (FOUNDATION §6);
 * gesperrte Akte tragen ein Lock-Medaillon unten-mittig.
 */
export function ActPanel({ act }: ActPanelProps) {
  return (
    <FramedCard
      as="li"
      aria-current={act.hasContent ? 'true' : undefined}
      artClassName={DUNGEON_BACKGROUND_CLASSES[act.backgroundId]}
      semantic={act.hasContent ? 'normal' : 'locked'}
      highlight={act.hasContent}
      interactive={false}
      className="h-36 rounded-lg p-4 @min-[42rem]:h-auto @min-[42rem]:aspect-video"
    >
      <div className="flex h-full flex-col items-center justify-between gap-1 text-center">
        {/* Whitespace-Textknoten trennen Label, Name und Status im Textinhalt des Panels. */}
        <div>
          <p
            className={cn(
              'font-display text-display',
              act.hasContent ? 'text-accent-strong' : 'text-text',
            )}
          >
            {act.label}
          </p>{' '}
          <p className="text-sm tracking-wide text-text-muted">{act.name}</p>{' '}
        </div>
        {!act.hasContent && (
          <span className="flex size-9 items-center justify-center rounded-full border border-ornament/50 bg-background/70 text-text-muted">
            <Lock aria-hidden="true" className="size-4" />
            <span className="sr-only">Locked</span>
          </span>
        )}
      </div>
    </FramedCard>
  );
}
