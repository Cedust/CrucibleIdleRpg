// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';
import { createDefaultSave } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { DungeonSelectionScreen } from './DungeonSelectionScreen';

describe('DungeonSelectionScreen', () => {
  beforeEach(() => {
    saveStore.setState({ data: createDefaultSave(42), status: 'ready' });
    useDungeonRunStore.setState({ mode: 'selection', activeDungeonId: null, startError: null });
  });

  it('shows the act stack with only act 1 unlocked', () => {
    render(<DungeonSelectionScreen />);

    expect(screen.getByRole('heading', { name: 'Dungeons' })).toBeInTheDocument();

    const acts = within(screen.getByRole('list', { name: 'Acts' })).getAllByRole('listitem');
    expect(acts).toHaveLength(3);
    expect(acts[0]).toHaveTextContent(/ACT I\b.*The Ashen Depths/);
    expect(acts[0]).toHaveAttribute('aria-current', 'true');
    expect(acts[1]).toHaveTextContent(/ACT II\b.*The Ember Foundry.*Locked/);
    expect(acts[2]).toHaveTextContent(/ACT III\b.*The Forgotten Citadel.*Locked/);
  });

  it('offers the dungeon cards with the fresh-save unlock state', () => {
    render(<DungeonSelectionScreen />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(radios[0]).toBeChecked();
    expect(radios.slice(1).every((radio) => (radio as HTMLInputElement).disabled)).toBe(true);
    expect(screen.getByRole('button', { name: 'Enter Dungeon' })).toBeEnabled();
  });

  it('reports loading progress before the save is available', () => {
    saveStore.setState({ data: null, status: 'loading' });
    render(<DungeonSelectionScreen />);

    expect(screen.getByText('Loading saved progress...')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});
