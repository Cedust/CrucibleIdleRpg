import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface TooltipTriggerProps {
  'aria-describedby': string;
  tabIndex: 0;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

interface TooltipProps {
  content: ReactNode;
  /** Render-Prop: die Trigger-Props gehören auf das fokussierbare Element. */
  children: (trigger: TooltipTriggerProps) => ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

const ALIGN_CLASS = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
} as const;

/**
 * Handgerollter Tooltip nach dem WAI-ARIA-Tooltip-Pattern: öffnet bei Hover
 * und Fokus, schließt bei Escape. Der Tooltip-Knoten bleibt immer im DOM,
 * damit aria-describedby zuverlässig auflöst; Positionierung ist rein CSS
 * (oberhalb zentriert, ohne Kollisionserkennung).
 */
export function Tooltip({ content, children, className = '', align = 'center' }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  const trigger: TooltipTriggerProps = {
    'aria-describedby': id,
    tabIndex: 0,
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    onKeyDown: (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    },
  };

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children(trigger)}
      <span
        role="tooltip"
        id={id}
        className={`pointer-events-none absolute bottom-full z-10 mb-2 w-max max-w-56 rounded-md border border-ornament bg-surface-raised px-2.5 py-1.5 text-xs text-text shadow-panel transition-opacity ${ALIGN_CLASS[align]} ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        {content}
      </span>
    </span>
  );
}
