import { formatRelicShards } from '@/game/crucible/crucible';
import { ConfirmDialog } from '@/shared/ui/overlay/ConfirmDialog';
import { Icon, type IconName } from '@/shared/ui/icons/Icon';

interface CrucibleRespecDialogProps {
  treeLabel: string;
  treeIcon: IconName;
  refundedRelicShards: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Bestätigung des kostenlosen Tree-Respecs (PROGRESSION §3) über das ConfirmDialog-Primitive. */
export function CrucibleRespecDialog({
  treeLabel,
  treeIcon,
  refundedRelicShards,
  onCancel,
  onConfirm,
}: CrucibleRespecDialogProps) {
  return (
    <ConfirmDialog
      label="Confirm Tree Respec"
      title={`Respec ${treeLabel}?`}
      icon={<Icon name={treeIcon} size="lg" className="bg-current" />}
      confirmLabel="Confirm Respec"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      Removes all ranks of this tree and refunds {formatRelicShards(refundedRelicShards)}. Free of
      charge.
    </ConfirmDialog>
  );
}
