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

    await user.click(radios[1] as HTMLInputElement);
    expect(onSelect).toHaveBeenCalledWith('A1-D2');
  });

  it('reflowt die Tor-Kacheln in einem auto-fill-Grid statt horizontal zu scrollen', () => {
    render(
      <DungeonSelector
        unlockedDungeonIds={['A1-D1']}
        completedDungeons={createDefaultCompletedDungeons()}
        selectedDungeonId="A1-D1"
        onSelect={vi.fn()}
      />,
    );

    const grid = screen.getByRole('group', { name: 'Dungeon selection' });
    expect(grid).toHaveClass('grid', 'grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]');
    expect(grid).not.toHaveClass('overflow-x-auto');
  });

  it('exponiert Kachel-States über data-selected und data-semantic', () => {
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
    expect(selectedCard?.querySelector('img')).toHaveClass('drop-shadow-glow-accent');

    const lockedCard = radios[2]?.closest('label');
    expect(lockedCard).toHaveAttribute('data-semantic', 'locked');
    expect(lockedCard).not.toHaveAttribute('data-selected');
    expect(lockedCard?.querySelector('img')).toHaveClass('opacity-(--state-deemphasis-weak)');
  });

  it('zeigt pro Zustand und Variante die passende Tor-Illustration', () => {
    render(
      <DungeonSelector
        unlockedDungeonIds={['A1-D1', 'A1-D2', 'A1-D5']}
        completedDungeons={createDefaultCompletedDungeons()}
        selectedDungeonId="A1-D1"
        onSelect={vi.fn()}
      />,
    );

    const radios = screen.getAllByRole('radio');
    const gateSrc = (index: number) =>
      radios[index]?.closest('label')?.querySelector('img')?.getAttribute('src');

    expect(gateSrc(0)).toBe('/assets/gates/gate-open.png');
    expect(gateSrc(2)).toBe('/assets/gates/gate-locked.png');
    expect(gateSrc(4)).toBe('/assets/gates/gate-boss-open.png');
  });

  it('zeigt das gesperrte Boss-Tor für den gesperrten fünften Dungeon', () => {
    render(
      <DungeonSelector
        unlockedDungeonIds={['A1-D1']}
        completedDungeons={createDefaultCompletedDungeons()}
        selectedDungeonId="A1-D1"
        onSelect={vi.fn()}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios[4]?.closest('label')?.querySelector('img')).toHaveAttribute(
      'src',
      '/assets/gates/gate-boss-locked.png',
    );
  });

  it('verbindet die Tore über Pfadsegmente und Status-Medaillons', () => {
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

    const labels = screen.getAllByRole('radio').map((radio) => radio.closest('label'));
    expect(labels[0]?.querySelectorAll('.h-px')).toHaveLength(1);
    expect(labels[1]?.querySelectorAll('.h-px')).toHaveLength(2);
    expect(labels[4]?.querySelectorAll('.h-px')).toHaveLength(1);

    expect(labels[0]?.querySelector('.rounded-full')).toHaveClass('text-success');
    expect(labels[1]?.querySelector('.rounded-full')).toHaveClass('text-accent');
    expect(labels[2]?.querySelector('.rounded-full')).toHaveClass('text-text-muted');
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
