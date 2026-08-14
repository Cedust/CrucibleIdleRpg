import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';

interface RespecDialogProps {
  disciplineLabel: string;
  refundedPoints: number;
  cost: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Bestätigung des Disziplin-Respecs gegen Gold über das Dialog-Primitive. */
export function RespecDialog({
  disciplineLabel,
  refundedPoints,
  cost,
  onCancel,
  onConfirm,
}: RespecDialogProps) {
  return (
    <Dialog
      label="Confirm Discipline Respec"
      onClose={(returnValue) => (returnValue === 'confirm' ? onConfirm() : onCancel())}
    >
      {(close) => (
        <>
          <h3 className="font-display text-display-sm text-accent-strong">
            Respec {disciplineLabel}?
          </h3>
          <p className="mt-2 text-sm text-text-muted">
            Refund {refundedPoints} Mastery Points for {cost} Gold.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => close('cancel')}>
              Cancel
            </Button>
            <Button onClick={() => close('confirm')}>Confirm Respec</Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
