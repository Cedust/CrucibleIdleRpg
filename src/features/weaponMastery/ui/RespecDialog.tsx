import { ConfirmDialog } from '@/shared/ui/overlay/ConfirmDialog';

interface RespecDialogProps {
  disciplineLabel: string;
  refundedPoints: number;
  cost: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Bestätigung des Disziplin-Respecs gegen Gold über das ConfirmDialog-Primitive. */
export function RespecDialog({
  disciplineLabel,
  refundedPoints,
  cost,
  onCancel,
  onConfirm,
}: RespecDialogProps) {
  return (
    <ConfirmDialog
      label="Confirm Discipline Respec"
      title={`Respec ${disciplineLabel}?`}
      confirmLabel="Confirm Respec"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      Refund {refundedPoints} Mastery Points for {cost} Gold.
    </ConfirmDialog>
  );
}
