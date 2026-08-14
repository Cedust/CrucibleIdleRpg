// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      label="Confirm Tree Respec"
      title="Respec Anvil?"
      confirmLabel="Confirm Respec"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    >
      Removes all ranks of this tree.
    </ConfirmDialog>,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('rendert Titel, Text und beide Aktionen im modalen Dialog', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: 'Confirm Tree Respec' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Respec Anvil?' })).toBeInTheDocument();
    expect(screen.getByText('Removes all ranks of this tree.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm Respec' })).toBeInTheDocument();
  });

  it('bestätigt über den primären Button', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Confirm Respec' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('bricht über den Ghost-Button ab', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog({ cancelLabel: 'Keep' });

    await user.click(screen.getByRole('button', { name: 'Keep' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('rendert das optionale Icon-Roundel neben dem Titel', () => {
    renderDialog({ icon: <span data-testid="tree-icon" /> });
    expect(screen.getByTestId('tree-icon')).toBeInTheDocument();
  });
});
