import type { HTMLAttributes, ReactNode } from 'react';

import type { DungeonBackgroundId } from '@/game/encounters/actMeta';
import { cn } from '../utils/cn';

type ScreenLayoutElement = 'div' | 'main' | 'section';
type ScreenBackgroundId =
  | DungeonBackgroundId
  | 'dungeons'
  | 'heroes'
  | 'crucible'
  | 'weapon-mastery'
  | 'blacksmith'
  | 'jeweler'
  | 'sigil-codex';

const BACKGROUND_CLASSES: Record<ScreenBackgroundId, string> = {
  'ashen-depths': 'bg-[url(/assets/backgrounds/dungeon-ashen-depths.png)]',
  'ember-foundry': 'bg-[url(/assets/backgrounds/dungeon-ember-foundry.png)]',
  'forgotten-citadel': 'bg-[url(/assets/backgrounds/dungeon-forgotten-citadel.png)]',
  dungeons: 'bg-[url(/assets/backgrounds/dungeons-view.png)]',
  heroes: 'bg-[url(/assets/backgrounds/heroes-view.png)]',
  crucible: 'bg-[url(/assets/backgrounds/crucible-view.png)]',
  'weapon-mastery': 'bg-[url(/assets/backgrounds/weapon-mastery-view.png)]',
  blacksmith: 'bg-[url(/assets/backgrounds/blacksmith-view.png)]',
  jeweler: 'bg-[url(/assets/backgrounds/jeweler-view.png)]',
  'sigil-codex': 'bg-[url(/assets/backgrounds/sigil-codex-view.png)]',
};

const BACKGROUND_OVERLAY_CLASSES: Record<ScreenBackgroundId, string> = {
  'ashen-depths': 'bg-linear-to-t from-background/82 via-background/58 to-background/32',
  'ember-foundry': 'bg-linear-to-t from-background/82 via-background/58 to-background/32',
  'forgotten-citadel': 'bg-linear-to-t from-background/82 via-background/58 to-background/32',
  dungeons: 'bg-background/28',
  heroes: 'bg-background/28',
  crucible: 'bg-background/28',
  'weapon-mastery': 'bg-background/28',
  blacksmith: 'bg-background/28',
  jeweler: 'bg-background/28',
  'sigil-codex': 'bg-background/28',
};

interface ScreenLayoutProps extends HTMLAttributes<HTMLElement> {
  as?: ScreenLayoutElement;
  /** Ohne Angabe rendert der Screen auf der reinen Hintergrundfarbe. */
  background?: ScreenBackgroundId;
  contentClassName?: string;
  /**
   * `true` (Default): der Content-Wrapper ist der Scroller des Screens.
   * `false`: der Screen managt eigene Scroll-Areas.
   */
  scroll?: boolean;
  children: ReactNode;
}

/**
 * Screen-Primitive mit Hintergrund-Layer und Kontrast-Overlay (DESIGN.md §5)
 * nach dem Viewport-Contract: full-height, `@container`
 * am Content-Wrapper, Scrollen nur in dafür vorgesehenen Containern.
 * Hintergrund und Overlay bluten um das Frame-Gutter nach außen bis unter
 * die Goldlinie des App-Rahmens (frame-bleed); die Rand-Vignette auf dem
 * Kontrast-Overlay lässt das Bild dort in den Grundton auslaufen.
 */
export function ScreenLayout({
  as: Tag = 'div',
  background,
  className = '',
  contentClassName = '',
  scroll = true,
  children,
  ...props
}: ScreenLayoutProps) {
  return (
    <Tag
      className={cn('relative isolate flex h-full min-h-0 flex-col bg-background', className)}
      {...props}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        {background !== undefined ? (
          <>
            <div
              aria-hidden="true"
              data-screen-background={background}
              className={cn(
                'absolute -inset-frame-bleed -z-10 bg-cover bg-position-[center_bottom]',
                BACKGROUND_CLASSES[background],
              )}
            />
            <div
              aria-hidden="true"
              className={cn(
                'absolute -inset-frame-bleed -z-10 shadow-[inset_0_0_32px_12px_var(--color-background)]',
                BACKGROUND_OVERLAY_CLASSES[background],
              )}
            />
          </>
        ) : null}
        <div
          className={cn(
            '@container relative flex min-h-0 flex-1 flex-col px-4 py-3 sm:px-page-pad',
            scroll && 'overflow-y-auto',
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </Tag>
  );
}
