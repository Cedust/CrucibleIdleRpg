import { useEffect, useRef } from 'react';
import { formatRelicShards } from '@/game/crucible/crucible';
import { Button } from '@/shared/ui/Button';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Panel } from '@/shared/ui/Panel';

interface CrucibleRespecDialogProps {
  treeLabel: string;
  treeIcon: IconName;
  refundedRelicShards: number;
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
  treeIcon,
  refundedRelicShards,
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
      className="m-auto w-full max-w-sm overflow-visible bg-transparent p-3 text-text backdrop:bg-black/70"
    >
      <Panel variant="thin" padding="none">
        <div className="relative p-5">
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
            <Button variant="ghost" onClick={() => dialog.current?.close('cancel')}>
              Cancel
            </Button>
            <Button onClick={() => dialog.current?.close('confirm')}>Confirm Respec</Button>
          </div>
        </div>
      </Panel>
    </dialog>
  );
}
