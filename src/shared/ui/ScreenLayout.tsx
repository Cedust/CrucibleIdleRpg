import type { HTMLAttributes, ReactNode } from 'react';
import type { DungeonBackgroundId } from '@/game/encounters/actMeta';

type ScreenLayoutElement = 'div' | 'main' | 'section';
const BACKGROUND_CLASSES: Record<DungeonBackgroundId, string> = {
  'ashen-depths': 'bg-[url(/assets/backgrounds/dungeon-ashen-depths.png)]',
  'ember-foundry': 'bg-[url(/assets/backgrounds/dungeon-ember-foundry.png)]',
  'forgotten-citadel': 'bg-[url(/assets/backgrounds/dungeon-forgotten-citadel.png)]',
};

interface ScreenLayoutProps extends HTMLAttributes<HTMLElement> {
  as?: ScreenLayoutElement;
  /** Ohne Angabe rendert der Screen auf der reinen Hintergrundfarbe. */
  background?: DungeonBackgroundId;
  contentClassName?: string;
  children: ReactNode;
}

/**
 * Screen-Primitive mit Hintergrund-Layer und Kontrast-Overlay (DESIGN.md §5).
 * Die Layer leben in einem mitwachsenden inneren Wrapper, damit sie auch dann
 * die volle Inhaltshöhe abdecken, wenn das Root-Element selbst scrollt.
 * Die Rand-Vignette auf dem Kontrast-Overlay lässt das Bild zur Kante hin in
 * den Grundton auslaufen; der Screen schließt dadurch nahtlos an das Gutter
 * des App-Rahmens an.
 */
export function ScreenLayout({
  as: Tag = 'div',
  background,
  className = '',
  contentClassName = '',
  children,
  ...props
}: ScreenLayoutProps) {
  return (
    <Tag className={`relative isolate flex flex-col bg-background ${className}`} {...props}>
      <div className="relative min-h-0 flex-1">
        {background !== undefined && (
          <>
            <div
              aria-hidden="true"
              className={`absolute inset-0 -z-10 bg-cover bg-position-[center_bottom] ${BACKGROUND_CLASSES[background]}`}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-linear-to-t from-background/82 via-background/58 to-background/32 shadow-[inset_0_0_32px_12px_var(--color-background)]"
            />
          </>
        )}
        <div className={`relative p-4 sm:p-6 ${contentClassName}`}>{children}</div>
      </div>
    </Tag>
  );
}
