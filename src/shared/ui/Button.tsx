import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'border border-ornament bg-linear-to-b from-accent-strong to-accent text-background hover:to-accent-strong',
  ghost:
    'border border-border bg-transparent text-text hover:border-ornament hover:bg-surface-raised',
  danger: 'border border-danger/50 bg-danger/10 text-danger hover:bg-danger/20',
};

/** Basis-Button-Primitive in „Gilded Ruins“-Optik (Plain Tailwind, siehe AGENTS.md). */
export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-md px-4 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
