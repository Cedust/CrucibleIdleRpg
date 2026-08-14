import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  title: string;
  intro?: string;
  className?: string;
  /** Zusätzliche Kopf-Zeilen (Ressourcen-Stände, Aktionen). */
  children?: ReactNode;
}

/** Gemeinsames Titel-/Intro-Muster der Screens (FOUNDATION §1). */
export function ScreenHeader({ title, intro, className, children }: ScreenHeaderProps) {
  return (
    <header className={className}>
      <h2 className="font-display text-display-lg text-accent-strong">{title}</h2>
      {intro !== undefined ? (
        <p className="mt-1 font-intro text-sm leading-6 text-text-muted">{intro}</p>
      ) : null}
      {children}
    </header>
  );
}
