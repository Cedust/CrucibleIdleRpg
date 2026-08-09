// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip } from './Tooltip';

function renderTooltip() {
  return render(
    <Tooltip content="Gold">
      {(trigger) => (
        <button type="button" {...trigger}>
          12,450
        </button>
      )}
    </Tooltip>,
  );
}

describe('Tooltip', () => {
  it('verknüpft den Trigger per aria-describedby und ist initial unsichtbar', () => {
    renderTooltip();

    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveClass('invisible');
  });

  it('öffnet bei Tastatur-Fokus und schließt mit Escape', async () => {
    renderTooltip();
    const user = userEvent.setup();

    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveClass('visible');

    await user.keyboard('{Escape}');
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveClass('invisible');
  });

  it('öffnet bei Hover und schließt beim Verlassen', async () => {
    renderTooltip();
    const user = userEvent.setup();

    await user.hover(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toHaveClass('visible');

    await user.unhover(screen.getByRole('button'));
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveClass('invisible');
  });
});
