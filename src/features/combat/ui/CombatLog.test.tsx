// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { TEAM_ORDER } from '@/game/characters/characters';
import { FORMATIONS } from '@/game/encounters/formations';
import type { FormationDefinition } from '@/game/types';
import { neutralProgression } from '@/features/combat/engine/characterStats';
import { type TickResult } from '@/features/combat/engine/combatEngine';
import {
  buildCombatState,
  deriveFloorSeed,
  deriveRunSeed,
  type CombatState,
} from '@/features/combat/engine/combatState';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { CombatLog } from './CombatLog';

function combat(formation: FormationDefinition = FORMATIONS.rampBothLanesCrowded): CombatState {
  return buildCombatState({
    floorId: 'A1-D1-11',
    floorIndex: 10,
    floorSeed: deriveFloorSeed(deriveRunSeed(4242, 'A1-D1', 1), 10),
    formation,
    team: TEAM_ORDER.map((id) => ({ id, progression: neutralProgression(20) })),
  });
}

describe('CombatLog', () => {
  beforeEach(() => {
    useCombatStore.getState().clearCombat();
  });

  it('stellt Crit, Multi Hit, Splash, Block, Evade und Counter in einem Zugblock dar', () => {
    const state = combat();
    const tick: TickResult = {
      state,
      actor: { side: 'character', index: 0 },
      outcome: 'ongoing',
      events: [
        { type: 'turnStart', round: 1, actor: { side: 'character', index: 0 } },
        {
          type: 'hit',
          source: { side: 'character', index: 0 },
          target: { side: 'enemy', index: 0 },
          kind: 'base',
          damage: 20,
          crit: true,
          targetHealth: 50,
        },
        {
          type: 'hit',
          source: { side: 'character', index: 0 },
          target: { side: 'enemy', index: 0 },
          kind: 'multiHit',
          damage: 10,
          crit: false,
          targetHealth: 40,
          chainIndex: 1,
        },
        {
          type: 'hit',
          source: { side: 'character', index: 0 },
          target: { side: 'enemy', index: 1 },
          kind: 'splash',
          damage: 8,
          crit: false,
          targetHealth: 62,
        },
        {
          type: 'damageTaken',
          source: { side: 'enemy', index: 0 },
          target: { side: 'character', index: 0 },
          evaded: false,
          blocked: true,
          barrierAbsorbed: 2,
          healthLost: 3,
          health: 317,
        },
        {
          type: 'damageTaken',
          source: { side: 'enemy', index: 0 },
          target: { side: 'character', index: 1 },
          evaded: true,
          blocked: false,
          barrierAbsorbed: 0,
          healthLost: 0,
          health: 220,
        },
        {
          type: 'hit',
          source: { side: 'character', index: 2 },
          target: { side: 'enemy', index: 0 },
          kind: 'counter',
          damage: 6,
          crit: false,
          targetHealth: 34,
        },
      ],
    };
    useCombatStore.setState({ combat: state, outcome: 'ongoing', tickLog: [{ id: 0, tick }] });
    render(<CombatLog />);

    const entries = screen.getAllByRole('listitem');
    expect(entries).toHaveLength(1);
    const entry = entries[0] as HTMLElement;
    expect(entry).toHaveTextContent('Critical');
    expect(entry).toHaveTextContent('Multi Hit');
    expect(entry).toHaveTextContent('Splash');
    expect(entry).toHaveTextContent('Blocked');
    expect(entry).toHaveTextContent('Evaded');
    expect(entry).toHaveTextContent('Counter');
  });

  it('zeigt den neuesten Zugblock im gedeckelten Log zuerst', () => {
    const state = combat();
    const first: TickResult = {
      state,
      actor: { side: 'character', index: 0 },
      events: [{ type: 'roundStart', round: 1 }],
      outcome: 'ongoing',
    };
    const second: TickResult = {
      state,
      actor: { side: 'character', index: 1 },
      events: [{ type: 'roundStart', round: 2 }],
      outcome: 'ongoing',
    };
    useCombatStore.setState({ combat: state, tickLog: [{ id: 0, tick: first }] });
    render(<CombatLog />);
    const originalFirstEntry = screen.getByRole('listitem');

    act(() =>
      useCombatStore.setState({
        tickLog: [
          { id: 0, tick: first },
          { id: 1, tick: second },
        ],
      }),
    );

    const entries = screen.getAllByRole('listitem');
    expect(entries[0]).toHaveTextContent('Round 2 begins');
    expect(entries[1]).toHaveTextContent('Round 1 begins');
    expect(entries[1]).toBe(originalFirstEntry);
  });
});
