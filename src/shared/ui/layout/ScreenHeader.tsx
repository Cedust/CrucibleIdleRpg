import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  title: string;
  intro?: string;
  /** `h1` für Screens ohne App-Navigation (Dungeon-Run). */
  headingLevel?: 'h1' | 'h2';
  className?: string;
  /** Zusätzliche Kopf-Zeilen (Ressourcen-Stände, Aktionen). */
  children?: ReactNode;
}

/** Gemeinsames Titel-/Intro-Muster der Screens. */
export function ScreenHeader({
  title,
  intro,
  headingLevel: Heading = 'h2',
  className,
  children,
}: ScreenHeaderProps) {
  return (
    <header className={className}>
      <Heading className="font-display text-display-lg text-accent-strong">{title}</Heading>
      {intro !== undefined ? (
        <p className="mt-1 font-intro text-sm leading-6 text-text-muted">{intro}</p>
      ) : null}
      {children}
    </header>
  );
}
