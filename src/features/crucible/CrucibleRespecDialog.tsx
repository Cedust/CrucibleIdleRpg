import { formatRelicShards } from '@/game/crucible/crucible';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { Icon, type IconName } from '@/shared/ui/Icon';

interface CrucibleRespecDialogProps {
  treeLabel: string;
  treeIcon: IconName;
  refundedRelicShards: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Bestätigung des kostenlosen Tree-Respecs (PROGRESSION §3) über das Dialog-Primitive. */
export function CrucibleRespecDialog({
  treeLabel,
  treeIcon,
  refundedRelicShards,
  onCancel,
  onConfirm,
}: CrucibleRespecDialogProps) {
  return (
    <Dialog
      label="Confirm Tree Respec"
      onClose={(returnValue) => (returnValue === 'confirm' ? onConfirm() : onCancel())}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-ornament bg-ember/10 text-ember-bright">
              <Icon name={treeIcon} size="lg" className="bg-current" />
            </span>
            <h3 className="font-display text-display-sm text-accent-strong">Respec {treeLabel}?</h3>
          </div>
          <p className="mt-4 text-sm leading-6 text-text-muted">
            Removes all ranks of this tree and refunds {formatRelicShards(refundedRelicShards)}.
            Free of charge.
          </p>
          <div className="mt-5 flex justify-end gap-2">
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
