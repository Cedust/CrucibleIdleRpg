import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { createNextDungeonCombat } from '@/features/dungeon/dungeonCombat';
import { createDefaultSave } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { useDungeonRunStore } from './dungeonRunStore';

describe('useDungeonRunStore', () => {
  beforeEach(() => {
    localStorage.clear();
    saveStore.setState({ data: createDefaultSave(42), status: 'ready' });
    useCombatStore.getState().clearCombat();
    useDungeonRunStore.setState({
      mode: 'selection',
      activeDungeonId: null,
      startError: null,
      completionError: null,
    });
  });

  it('persists one run start before entering the isolated run mode', async () => {
    const first = useDungeonRunStore.getState().startRun('A1-D1');
    const duplicate = useDungeonRunStore.getState().startRun('A1-D1');

    await expect(first).resolves.toBe(true);
    await expect(duplicate).resolves.toBe(false);
    expect(saveStore.getState().data?.runCounter).toBe(1);
    expect(useDungeonRunStore.getState().mode).toBe('run');
    expect(useDungeonRunStore.getState().activeDungeonId).toBe('A1-D1');
    expect(useCombatStore.getState().combat?.floorId).toBe('A1-D1-01');
  });

  it('keeps the selection visible when persisting the run start fails', async () => {
    const beginRun = saveStore.getState().beginRun;
    saveStore.setState({ beginRun: vi.fn(() => Promise.reject(new Error('save failed'))) });

    await expect(useDungeonRunStore.getState().startRun('A1-D1')).resolves.toBe(false);

    expect(useDungeonRunStore.getState().mode).toBe('selection');
    expect(useCombatStore.getState().combat).toBeNull();
    expect(saveStore.getState().data?.runCounter).toBe(0);
    saveStore.setState({ beginRun });
  });

  it('rejects a locked dungeon without persisting a run', async () => {
    await expect(useDungeonRunStore.getState().startRun('A1-D2')).resolves.toBe(false);

    expect(saveStore.getState().data?.runCounter).toBe(0);
    expect(useDungeonRunStore.getState().startError).toBe('This dungeon is not available.');
  });

  it('leaves a run only through its terminal lifecycle action', async () => {
    await useDungeonRunStore.getState().startRun('A1-D1');
    useDungeonRunStore.getState().leaveRun();

    expect(useDungeonRunStore.getState().mode).toBe('selection');
    expect(useCombatStore.getState().combat).toBeNull();
  });

  it('advances automatically only after the saved reward and keeps carried health', async () => {
    await useDungeonRunStore.getState().startRun('A1-D1');
    const first = useCombatStore.getState().combat;
    if (first === null) throw new Error('expected first dungeon floor');
    const victorious = {
      ...first,
      characters: first.characters.map((character, index) => ({
        ...character,
        health: index === 2 ? 0 : character.health - 10,
      })),
    };

    // Ein Sieg ohne gespeicherten Reward schaltet nicht weiter.
    useCombatStore.setState({
      combat: victorious,
      outcome: 'victory',
      completionStatus: 'saving',
    });
    expect(useCombatStore.getState().combat?.floorId).toBe('A1-D1-01');

    // Der gespeicherte Reward startet den nächsten Floor ohne View-Beteiligung.
    useCombatStore.setState({ completionStatus: 'saved' });
    expect(useCombatStore.getState().combat?.floorId).toBe('A1-D1-02');
    expect(useCombatStore.getState().outcome).toBe('ongoing');
    expect(
      useCombatStore.getState().combat?.characters.map((character) => character.health),
    ).toEqual(victorious.characters.map((character) => character.health));
    expect(useDungeonRunStore.getState().startNextFloor()).toBe(false);
  });

  it('ends the run terminally on a wipe', async () => {
    await useDungeonRunStore.getState().startRun('A1-D1');

    useCombatStore.setState({ outcome: 'wipe' });

    expect(useDungeonRunStore.getState().mode).toBe('selection');
    expect(useCombatStore.getState().combat).toBeNull();
  });

  it('keeps a saved final floor open instead of auto-advancing', async () => {
    await useDungeonRunStore.getState().startRun('A1-D1');
    const initial = useCombatStore.getState().combat;
    if (initial === null) throw new Error('expected first dungeon floor');
    let finalFloor = initial;
    for (let index = 0; index < 19; index += 1) {
      finalFloor = createNextDungeonCombat(
        saveStore.getState().data ?? createDefaultSave(42),
        finalFloor,
      );
    }

    useCombatStore.setState({
      combat: finalFloor,
      outcome: 'victory',
      completionStatus: 'saved',
    });

    expect(useCombatStore.getState().combat?.floorId).toBe('A1-D1-20');
    expect(useDungeonRunStore.getState().mode).toBe('run');
  });

  it('allows 2× playback only after the active dungeon has been completed', async () => {
    await useDungeonRunStore.getState().startRun('A1-D1');

    await expect(useDungeonRunStore.getState().setRunPlaybackSpeed(2)).resolves.toBe(false);
    expect(useCombatStore.getState().playbackSpeed).toBe(1);

    useDungeonRunStore.getState().leaveRun();
    await saveStore.getState().completeDungeon('A1-D1');
    await useDungeonRunStore.getState().startRun('A1-D1');

    await expect(useDungeonRunStore.getState().setRunPlaybackSpeed(2)).resolves.toBe(true);
    expect(useCombatStore.getState().playbackSpeed).toBe(2);
    expect(saveStore.getState().data?.playbackSpeed).toBe(2);
  });

  it('starts an incomplete dungeon at 1× even when 2× is saved for a completed dungeon', async () => {
    await saveStore.getState().completeDungeon('A1-D1');
    await saveStore.getState().setPlaybackSpeed(2);

    await useDungeonRunStore.getState().startRun('A1-D2');

    expect(useCombatStore.getState().playbackSpeed).toBe(1);
  });

  it('completes only a saved final floor and persists the dungeon checkpoint', async () => {
    await useDungeonRunStore.getState().startRun('A1-D1');
    const initial = useCombatStore.getState().combat;
    if (initial === null) throw new Error('expected first dungeon floor');
    let finalFloor = initial;
    for (let index = 0; index < 19; index += 1) {
      finalFloor = createNextDungeonCombat(
        saveStore.getState().data ?? createDefaultSave(42),
        finalFloor,
      );
    }
    useCombatStore.setState({
      combat: finalFloor,
      outcome: 'victory',
      completionStatus: 'saved',
    });

    await expect(useDungeonRunStore.getState().completeRun()).resolves.toBe(true);

    expect(saveStore.getState().data?.completedDungeons['A1-D1']).toBe(true);
    expect(saveStore.getState().data?.unlockedDungeonIds).toEqual(['A1-D1', 'A1-D2']);
    expect(useDungeonRunStore.getState().mode).toBe('selection');
  });
});
