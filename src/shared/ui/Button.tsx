import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { focusRing, stateAttrs, transitionState } from './state';

type ButtonVariant = 'primary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Exklusives Highlight (FOUNDATION §5); sichtbar als Gold-Border/Tint auf `ghost`. */
  selected?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'border border-ornament bg-linear-to-b from-accent-strong to-accent text-background hover:to-accent-strong',
  ghost:
    'border border-border bg-transparent text-text hover:border-ornament hover:bg-surface-raised data-selected:border-accent data-selected:bg-state-selected-tint',
  danger: 'border border-danger/50 bg-danger/10 text-danger hover:bg-danger/20',
};

/** Basis-Button-Primitive in „Gilded Ruins“-Optik (Plain Tailwind, siehe AGENTS.md). */
export function Button({
  variant = 'primary',
  selected = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...stateAttrs({ selected })}
      className={cn(
        'cursor-pointer rounded-md px-4 py-2 font-medium',
        transitionState,
        focusRing,
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
