import type { HTMLAttributes, ReactNode } from 'react';

type ScreenLayoutElement = 'div' | 'main' | 'section';
type ScreenBackground = 'ashen-depths';

const BACKGROUND_CLASSES: Record<ScreenBackground, string> = {
  'ashen-depths': 'bg-[url(/assets/backgrounds/dungeon-ashen-depths.png)]',
};

interface ScreenLayoutProps extends HTMLAttributes<HTMLElement> {
  as?: ScreenLayoutElement;
  /** Ohne Angabe rendert der Screen auf der reinen Hintergrundfarbe. */
  background?: ScreenBackground;
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
  children,
  ...props
}: ScreenLayoutProps) {
  return (
    <Tag className={`relative isolate flex flex-col bg-background ${className}`} {...props}>
      <div className="relative flex-1">
        {background !== undefined && (
          <>
            <div
              aria-hidden="true"
              className={`absolute inset-0 -z-10 bg-cover bg-[position:center_bottom] ${BACKGROUND_CLASSES[background]}`}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-linear-to-t from-background/90 via-background/70 to-background/45 shadow-[inset_0_0_32px_12px_var(--color-background)]"
            />
          </>
        )}
        <div className="relative p-4 sm:p-6">{children}</div>
      </div>
    </Tag>
  );
}
