// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';
import { createDefaultSave } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { createDungeonEntryCombat } from '@/features/dungeon/dungeonCombat';
import { useCombatStore } from '@/features/combat/state/combatStore';
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
    await user.click(screen.getByRole('button', { name: 'LEAVE DUNGEON' }));
    expect(screen.getByRole('button', { name: 'Confirm Leave Dungeon' })).toBeInTheDocument();
    expect(useDungeonRunStore.getState().mode).toBe('run');

    await user.click(screen.getByRole('button', { name: 'Confirm Leave Dungeon' }));
    expect(useDungeonRunStore.getState().mode).toBe('selection');
  });

  it('keeps the run open for a failed reward commit retry', () => {
    useCombatStore.setState({ outcome: 'victory', completionStatus: 'failed' });
    render(<DungeonRunScreen />);

    expect(screen.getByRole('alert')).toHaveTextContent('Reward save failed.');
    expect(screen.getByRole('button', { name: 'Retry Save' })).toBeInTheDocument();
    expect(useDungeonRunStore.getState().mode).toBe('run');
  });

  it('keeps 2× playback locked without helper copy and enables it after completion', async () => {
    const user = userEvent.setup();
    render(<DungeonRunScreen />);

    expect(screen.getByRole('button', { name: '2×' })).toBeDisabled();
    expect(
      screen.queryByText('Complete this dungeon once to unlock 2× playback.'),
    ).not.toBeInTheDocument();

    const save = saveStore.getState().data;
    if (save === null) throw new Error('expected save data');
    act(() =>
      saveStore.setState({
        data: { ...save, completedDungeons: { ...save.completedDungeons, 'A1-D1': true } },
      }),
    );

    await user.click(screen.getByRole('button', { name: '2×' }));

    await waitFor(() => expect(useCombatStore.getState().playbackSpeed).toBe(2));
  });

  it('keeps a saved floor 20 open for manual dungeon completion', () => {
    const combat = useCombatStore.getState().combat;
    if (combat === null) throw new Error('expected dungeon combat');
    useCombatStore.setState({
      combat: { ...combat, floorId: 'A1-D1-20' },
      outcome: 'victory',
      completionStatus: 'saved',
      lastReward: { gold: 10, xp: 15, crystals: 1 },
    });

    render(<DungeonRunScreen />);

    expect(screen.getByRole('button', { name: 'Complete Dungeon' })).toBeInTheDocument();
    expect(useDungeonRunStore.getState().mode).toBe('run');
  });

  it('shows the dungeon title and successfully committed rewards from this run', () => {
    render(<DungeonRunScreen />);

    expect(
      screen.getByRole('heading', { name: 'The Ashen Depths — Cinder Gate' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Floor 1, Round 1')).toHaveTextContent('Floor 1 · Round 1');
    expect(screen.getByLabelText('Floor 1, Round 1').closest('h2')).not.toBeNull();
    expect(screen.getByTestId('combat-main-area')).toHaveClass(
      '-mx-2',
      'overflow-y-auto',
      'px-2',
      'py-2',
    );
    expect(screen.getByTestId('run-status-bar')).toBeInTheDocument();
    const rewards = within(screen.getByLabelText('Run rewards'));
    expect(rewards.getAllByText('0')).toHaveLength(2);
    expect(rewards.getByLabelText('Gold amount')).toHaveTextContent('0');
    expect(rewards.getByLabelText('Crystals amount')).toHaveTextContent('0');
    expect(rewards.getByText('Gold')).toHaveClass('sr-only');
    expect(rewards.getByText('Crystals')).toHaveClass('sr-only');
    expect(rewards.getByText('Runedust')).toHaveClass('sr-only');
    expect(screen.getByLabelText('Runedust amount')).toHaveTextContent('—');

    const save = saveStore.getState().data;
    if (save === null) throw new Error('expected save data');
    act(() =>
      saveStore.setState({
        data: {
          ...save,
          currencies: { gold: save.currencies.gold + 12, crystals: save.currencies.crystals + 3 },
        },
      }),
    );

    expect(rewards.getByText('12')).toBeInTheDocument();
    expect(rewards.getByText('3')).toBeInTheDocument();
  });
});
