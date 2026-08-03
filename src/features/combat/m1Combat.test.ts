import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '@/features/save/saveSchema';
import { M1_COMBAT_CONTEXT, runCombat } from './combatEngine';
import { createM1Combat } from './m1Combat';

function runForCounter(runCounter: number) {
  const save = { ...createDefaultSave(4242), runCounter };
  return runCombat(createM1Combat(save), M1_COMBAT_CONTEXT);
}

describe('createM1Combat', () => {
  it('liefert für zwei Runs verschiedene, je Save-Stand aber exakt reproduzierbare Verläufe', () => {
    const first = runForCounter(1);
    const second = runForCounter(2);
    const reloadedSecond = runForCounter(2);

    expect(first.outcome).toBe('victory');
    expect(second.events).not.toEqual(first.events);
    expect(reloadedSecond).toEqual(second);
  });
});
