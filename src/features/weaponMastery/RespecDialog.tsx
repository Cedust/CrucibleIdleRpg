import { useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/Button';

interface RespecDialogProps {
  disciplineLabel: string;
  refundedPoints: number;
  cost: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Modaler Respec-Dialog auf nativem `<dialog>` + `showModal()`: Der Fokus wandert hinein,
 * Escape schließt, und beim Schließen kehrt der Fokus zum Auslöser zurück.
 */
export function RespecDialog({
  disciplineLabel,
  refundedPoints,
  cost,
  onCancel,
  onConfirm,
}: RespecDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const handleClose = () => {
    if (dialog.current?.returnValue === 'confirm') {
      onConfirm();
    } else {
      onCancel();
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-label="Confirm Discipline Respec"
      onClose={handleClose}
      className="m-auto w-full max-w-sm rounded-md border border-border bg-background p-5 text-text backdrop:bg-black/60"
    >
      <h3 className="font-semibold">Respec {disciplineLabel}?</h3>
      <p className="mt-2 text-sm text-text-muted">
        Refund {refundedPoints} Mastery Points for {cost} Gold.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => dialog.current?.close('cancel')}>
          Cancel
        </Button>
        <Button onClick={() => dialog.current?.close('confirm')}>Confirm Respec</Button>
      </div>
    </dialog>
  );
}
