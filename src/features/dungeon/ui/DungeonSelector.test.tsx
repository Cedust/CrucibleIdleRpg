// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DungeonSelector } from './DungeonSelector';

describe('DungeonSelector', () => {
  it('shows only unlocked checkpoints and reports the accessible selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DungeonSelector
        unlockedDungeonIds={['A1-D1', 'A1-D3']}
        selectedDungeonId="A1-D1"
        onSelect={onSelect}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual([
      'A1-D1',
      'A1-D2',
      'A1-D3',
      'A1-D4',
      'A1-D5',
    ]);
    expect(radios[0]).toBeChecked();
    expect(radios[1]).toBeDisabled();
    expect(radios[2]).not.toBeDisabled();

    await user.click(radios[2] as HTMLInputElement);
    expect(onSelect).toHaveBeenCalledWith('A1-D3');
  });

  it('names each card with its display label, name and open/locked status', () => {
    render(
      <DungeonSelector
        unlockedDungeonIds={['A1-D1']}
        selectedDungeonId="A1-D1"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: /DUNGEON I\b.*Cinder Gate.*Open/ })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: /DUNGEON II\b.*The Charred Vaults.*Locked/ }),
    ).toBeDisabled();
  });
});
