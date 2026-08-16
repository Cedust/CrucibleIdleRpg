// @vitest-environment jsdom
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useRovingFocus } from './useRovingFocus';

const ITEMS = ['a', 'b', 'c'] as const;
type Item = (typeof ITEMS)[number];

function Probe({ orientation }: { orientation?: 'horizontal' | 'both' }) {
  const [selected, setSelected] = useState<Item>('a');
  const rovingProps = useRovingFocus({
    items: ITEMS,
    selected,
    onSelect: setSelected,
    itemDomId: (item) => `probe-${item}`,
    orientation,
  });

  return (
    <div>
      {ITEMS.map((item) => (
        <button
          key={item}
          id={`probe-${item}`}
          type="button"
          aria-pressed={item === selected}
          onClick={() => setSelected(item)}
          {...rovingProps(item)}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

describe('useRovingFocus', () => {
  it('macht genau das selektierte Item tabbbar', () => {
    render(<Probe />);

    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('button', { name: 'C' })).toHaveAttribute('tabindex', '-1');
  });

  it('bewegt Selektion und Fokus mit Pfeiltasten inklusive Wrap', async () => {
    const user = userEvent.setup();
    render(<Probe />);

    const first = screen.getByRole('button', { name: 'A' });
    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'B' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'true');

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'C' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'C' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('springt mit Home und End an die Enden', async () => {
    const user = userEvent.setup();
    render(<Probe />);

    const first = screen.getByRole('button', { name: 'A' });
    first.focus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'C' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'A' })).toHaveFocus();
  });

  it('reagiert nur mit orientation both auf vertikale Pfeile', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Probe />);
    const horizontal = screen.getByRole('button', { name: 'A' });
    horizontal.focus();
    await user.keyboard('{ArrowDown}');
    expect(horizontal).toHaveFocus();
    unmount();

    render(<Probe orientation="both" />);
    const vertical = screen.getByRole('button', { name: 'A' });
    vertical.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'B' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: 'A' })).toHaveFocus();
  });
});
