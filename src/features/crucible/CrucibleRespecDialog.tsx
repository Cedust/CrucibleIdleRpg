import { useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/Button';

interface CrucibleRespecDialogProps {
  treeLabel: string;
  refundedCrystals: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Modaler Respec-Dialog auf nativem `<dialog>` + `showModal()`: Der Fokus wandert hinein,
 * Escape schließt, und beim Schließen kehrt der Fokus zum Auslöser zurück. Der Tree-Respec
 * ist kostenlos (PROGRESSION §3).
 */
export function CrucibleRespecDialog({
  treeLabel,
  refundedCrystals,
  onCancel,
  onConfirm,
}: CrucibleRespecDialogProps) {
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
      aria-label="Confirm Tree Respec"
      onClose={handleClose}
      className="m-auto w-full max-w-sm rounded-md border border-border bg-surface-raised p-5 text-text backdrop:bg-black/60"
    >
      <h3 className="font-semibold">Respec {treeLabel}?</h3>
      <p className="mt-2 text-sm text-text-muted">
        Removes all ranks of this tree and refunds {refundedCrystals} Crystals. Free of charge.
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
