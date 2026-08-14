import type { ReactNode } from 'react';
import { cn } from './cn';

interface SectionTitleProps {
  as?: 'h2' | 'h3';
  align?: 'center' | 'start';
  id?: string;
  className?: string;
  children: ReactNode;
}

/** Gold-Kapitälchen-Zwischentitel für Panel-Gruppen (Heroes, Combat Log, Lanes). */
export function SectionTitle({
  as: Tag = 'h2',
  align = 'center',
  id,
  className,
  children,
}: SectionTitleProps) {
  return (
    <Tag
      id={id}
      className={cn(
        'font-display text-display-sm text-accent-strong',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
