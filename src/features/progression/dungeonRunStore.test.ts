import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCombatStore } from '@/features/combat/combatStore';
import { createDefaultSave } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { useDungeonRunStore } from './dungeonRunStore';

describe('useDungeonRunStore', () => {
  beforeEach(() => {
    localStorage.clear();
    saveStore.setState({ data: createDefaultSave(42), status: 'ready' });
    useCombatStore.getState().clearCombat();
    useDungeonRunStore.setState({ mode: 'selection', activeDungeonId: null, startError: null });
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

  it('leaves and completes a run only through terminal lifecycle actions', async () => {
    await useDungeonRunStore.getState().startRun('A1-D1');
    useDungeonRunStore.getState().leaveRun();

    expect(useDungeonRunStore.getState().mode).toBe('selection');
    expect(useCombatStore.getState().combat).toBeNull();

    await useDungeonRunStore.getState().startRun('A1-D1');
    useDungeonRunStore.getState().completeRun();
    expect(useDungeonRunStore.getState().mode).toBe('selection');
    expect(useCombatStore.getState().combat).toBeNull();
  });
});
