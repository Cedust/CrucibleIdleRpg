// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultCompletedDungeons } from '@/features/save/saveSchema';
import { DungeonSelector } from './DungeonSelector';

describe('DungeonSelector', () => {
  it('allows unlocked and locked checkpoints to be selected', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DungeonSelector
        unlockedDungeonIds={['A1-D1', 'A1-D3']}
        completedDungeons={createDefaultCompletedDungeons()}
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
    expect(radios.every((radio) => !(radio as HTMLInputElement).disabled)).toBe(true);
    expect(radios[0]?.closest('label')).toHaveClass('h-74', 'w-40');

    await user.click(radios[1] as HTMLInputElement);
    expect(onSelect).toHaveBeenCalledWith('A1-D2');
  });

  it('reflowt die Karten in einem auto-fill-Grid statt horizontal zu scrollen', () => {
    render(
      <DungeonSelector
        unlockedDungeonIds={['A1-D1']}
        completedDungeons={createDefaultCompletedDungeons()}
        selectedDungeonId="A1-D1"
        onSelect={vi.fn()}
      />,
    );

    const grid = screen.getByRole('group', { name: 'Dungeon selection' });
    expect(grid).toHaveClass('grid', 'grid-cols-[repeat(auto-fill,10rem)]');
    expect(grid).not.toHaveClass('overflow-x-auto');
  });

  it('exponiert Karten-States über data-selected und data-semantic', () => {
    render(
      <DungeonSelector
        unlockedDungeonIds={['A1-D1', 'A1-D2']}
        completedDungeons={createDefaultCompletedDungeons()}
        selectedDungeonId="A1-D1"
        onSelect={vi.fn()}
      />,
    );

    const radios = screen.getAllByRole('radio');
    const selectedCard = radios[0]?.closest('label');
    expect(selectedCard).toHaveAttribute('data-selected');
    expect(selectedCard).not.toHaveAttribute('data-semantic');

    const lockedCard = radios[2]?.closest('label');
    expect(lockedCard).toHaveAttribute('data-semantic', 'locked');
    expect(lockedCard).not.toHaveAttribute('data-selected');
    expect(lockedCard?.querySelector('.border-image-thin')).toHaveClass(
      'opacity-(--state-deemphasis-strong)',
    );
  });

  it('names each card with its display label, name and status', () => {
    const completedDungeons = {
      ...createDefaultCompletedDungeons(),
      'A1-D1': true,
    };
    render(
      <DungeonSelector
        unlockedDungeonIds={['A1-D1', 'A1-D2']}
        completedDungeons={completedDungeons}
        selectedDungeonId="A1-D1"
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('radio', { name: /DUNGEON I\b.*Cinder Gate.*COMPLETED/ }),
    ).toBeChecked();
    expect(
      screen.getByRole('radio', { name: /DUNGEON II\b.*The Charred Vaults.*AVAILABLE/ }),
    ).toBeEnabled();
    expect(
      screen.getByRole('radio', { name: /DUNGEON III\b.*Ashfall Causeway.*LOCKED/ }),
    ).toBeEnabled();
  });
});
