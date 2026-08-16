import type { ReactNode } from 'react';
import { Button } from '../controls/Button';
import { Dialog } from './Dialog';

interface ConfirmDialogProps {
  /** aria-label des Dialogs. */
  label: string;
  title: string;
  /** Optionales Glut-Roundel-Icon neben dem Titel. */
  icon?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Dialog-Text; erhält die gemeinsame Body-Typografie. */
  children: ReactNode;
}

/** Bestätigungs-Dialog mit Ghost-Abbruch und primärer Bestätigung. */
export function ConfirmDialog({
  label,
  title,
  icon,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const heading = <h3 className="font-display text-display-sm text-accent-strong">{title}</h3>;

  return (
    <Dialog
      label={label}
      onClose={(returnValue) => (returnValue === 'confirm' ? onConfirm() : onCancel())}
    >
      {(close) => (
        <>
          {icon === undefined ? (
            heading
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-ornament bg-ember/10 text-ember-bright">
                {icon}
              </span>
              {heading}
            </div>
          )}
          <div className="mt-4 text-sm leading-6 text-text-muted">{children}</div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => close('cancel')}>
              {cancelLabel}
            </Button>
            <Button onClick={() => close('confirm')}>{confirmLabel}</Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
