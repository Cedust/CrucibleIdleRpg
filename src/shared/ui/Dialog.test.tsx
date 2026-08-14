// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Dialog } from './Dialog';

function renderDialog(onClose: (returnValue: string) => void) {
  return render(
    <Dialog label="Confirm Test" onClose={onClose}>
      {(close) => (
        <>
          <h3>Sicher?</h3>
          <Button variant="ghost" onClick={() => close('cancel')}>
            Cancel
          </Button>
          <Button onClick={() => close('confirm')}>Confirm</Button>
        </>
      )}
    </Dialog>,
  );
}

describe('Dialog', () => {
  it('öffnet modal mit zugänglichem Namen und Panel-thin-Chrome', () => {
    const { container } = renderDialog(vi.fn());

    const dialog = screen.getByRole('dialog', { name: 'Confirm Test' });
    expect(dialog).toHaveClass('backdrop:bg-black/70');
    expect(container.querySelector('.border-image-thin')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sicher?' })).toBeInTheDocument();
  });

  it('reicht den returnValue des schließenden Buttons an onClose durch', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDialog(onClose);

    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onClose).toHaveBeenCalledWith('confirm');
  });

  it('meldet cancel beim Abbrechen', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderDialog(onClose);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledWith('cancel');
  });
});
