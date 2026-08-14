import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { cn } from './cn';
import { Panel } from './Panel';

interface DialogProps {
  /** Zugänglicher Name des Dialogs. */
  label: string;
  /** Erhält beim Schließen `dialog.returnValue` (z. B. 'confirm' | 'cancel'). */
  onClose: (returnValue: string) => void;
  className?: string;
  /** Render-Prop: `close(returnValue)` schließt den Dialog. */
  children: (close: (returnValue: string) => void) => ReactNode;
}

/**
 * Modaler Dialog auf nativem `<dialog>` + `showModal()` mit Panel-thin-Chrome
 * (FOUNDATION §7): Der Fokus wandert hinein, Escape schließt, und beim
 * Schließen kehrt der Fokus zum Auslöser zurück. `overflow-visible` lässt die
 * Ornamentspitzen des 9-Slice-Rahmens über die Fläche ragen.
 */
export function Dialog({ label, onClose, className, children }: DialogProps) {
  const [element, setElement] = useState<HTMLDialogElement | null>(null);

  useEffect(() => {
    element?.showModal();
  }, [element]);

  const close = useCallback(
    (returnValue: string) => {
      element?.close(returnValue);
    },
    [element],
  );

  return (
    <dialog
      ref={setElement}
      aria-label={label}
      onClose={(event) => onClose(event.currentTarget.returnValue)}
      className={cn(
        'm-auto w-full max-w-sm overflow-visible bg-transparent p-3 text-text backdrop:bg-black/70',
        className,
      )}
    >
      <Panel variant="thin" padding="none">
        <div className="relative p-5">{children(close)}</div>
      </Panel>
    </dialog>
  );
}
