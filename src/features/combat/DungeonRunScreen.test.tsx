import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDungeonRunStore } from '@/features/progression/dungeonRunStore';
import { createDefaultSave } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { createDungeonEntryCombat } from './dungeonCombat';
import { useCombatStore } from './combatStore';
import { DungeonRunScreen } from './DungeonRunScreen';

describe('DungeonRunScreen', () => {
  beforeEach(() => {
    saveStore.setState({ data: createDefaultSave(42), status: 'ready' });
    useCombatStore.getState().startCombat(createDungeonEntryCombat(createDefaultSave(42), 'A1-D1'));
    useDungeonRunStore.setState({ mode: 'run', activeDungeonId: 'A1-D1', startError: null });
  });

  it('requires confirmation before leaving the isolated run', async () => {
    const user = userEvent.setup();
    render(<DungeonRunScreen />);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Leave Dungeon' }));
    expect(screen.getByRole('button', { name: 'Confirm Leave Dungeon' })).toBeInTheDocument();
    expect(useDungeonRunStore.getState().mode).toBe('run');

    await user.click(screen.getByRole('button', { name: 'Confirm Leave Dungeon' }));
    expect(useDungeonRunStore.getState().mode).toBe('selection');
  });

  it('treats a wipe as a terminal run result', async () => {
    render(<DungeonRunScreen />);
    act(() => useCombatStore.setState({ outcome: 'wipe' }));

    await waitFor(() => expect(useDungeonRunStore.getState().mode).toBe('selection'));
    expect(useCombatStore.getState().combat).toBeNull();
  });

  it('keeps the run open for a failed reward commit retry', () => {
    useCombatStore.setState({ outcome: 'victory', completionStatus: 'failed' });
    render(<DungeonRunScreen />);

    expect(screen.getByRole('alert')).toHaveTextContent('Reward save failed.');
    expect(screen.getByRole('button', { name: 'Retry Save' })).toBeInTheDocument();
    expect(useDungeonRunStore.getState().mode).toBe('run');
  });
});
