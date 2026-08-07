// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { TEAM_ORDER } from '@/game/characters/characters';
import { FORMATIONS } from '@/game/encounters/formations';
import type { FormationDefinition } from '@/game/types';
import { neutralProgression } from '@/features/combat/engine/characterStats';
import {
  buildCombatState,
  deriveFloorSeed,
  deriveRunSeed,
  type ActorRef,
  type CombatState,
} from '@/features/combat/engine/combatState';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { TurnOrderBar } from './TurnOrderBar';

function combat(formation: FormationDefinition = FORMATIONS.rampBothLanesCrowded): CombatState {
  return buildCombatState({
    floorId: 'A1-D1-11',
    floorIndex: 10,
    floorSeed: deriveFloorSeed(deriveRunSeed(4242, 'A1-D1', 1), 10),
    formation,
    team: TEAM_ORDER.map((id) => ({ id, progression: neutralProgression(20) })),
  });
}

function actorName(state: CombatState, actor: ActorRef): string {
  const participant =
    actor.side === 'character' ? state.characters[actor.index] : state.enemies[actor.index];
  return participant?.name ?? 'Unknown actor';
}

describe('TurnOrderBar', () => {
  beforeEach(() => {
    useCombatStore.getState().clearCombat();
  });

  it('hält alle Akteure stabil in Zugreihenfolge und verschiebt nur die aktive Markierung', () => {
    useCombatStore.getState().startCombat(combat());
    const initialOrder = useCombatStore.getState().turnOrder;
    render(<TurnOrderBar />);

    const order = screen.getByRole('list', { name: 'Combat turn order' });
    const items = within(order).getAllByRole('listitem');
    const initialCombat = useCombatStore.getState().combat;
    if (initialCombat === null) {
      throw new Error('Testkampf fehlt');
    }

    expect(items).toHaveLength(initialOrder.length);
    expect(items.map((item) => item.textContent?.replace('Active: ', '').trim())).toEqual(
      initialOrder.map((actor) => actorName(initialCombat, actor)),
    );
    expect(items[0]).toHaveAttribute('aria-current', 'step');
    const initialActive = items[0]?.textContent ?? '';

    act(() => {
      useCombatStore.getState().advanceTick();
    });

    expect(useCombatStore.getState().turnOrder).toBe(initialOrder);
    expect(within(order).getAllByRole('listitem')).toHaveLength(initialOrder.length);
    const currentCombat = useCombatStore.getState().combat;
    const nextActive = currentCombat?.pending[0];
    if (currentCombat === null || nextActive === undefined) {
      throw new Error('Offener Folgezug fehlt');
    }

    const activeItem = within(order).getByRole('listitem', { current: 'step' });
    expect(activeItem).toHaveTextContent(actorName(currentCombat, nextActive));
    expect(activeItem).not.toHaveTextContent(initialActive);
  });

  it('hält Quinn nach ihrem Zug dauerhaft in der stabilen Reihenfolge sichtbar', () => {
    const state = combat();
    const turnOrder = [
      { side: 'character', index: 2 },
      { side: 'character', index: 0 },
      { side: 'enemy', index: 0 },
    ] as const;
    useCombatStore.setState({
      combat: state,
      outcome: 'ongoing',
      turnOrder,
      lastTick: {
        state,
        actor: { side: 'character', index: 2 },
        events: [],
        outcome: 'ongoing',
      },
    });
    render(<TurnOrderBar />);

    const order = screen.getByRole('list', { name: 'Combat turn order' });
    expect(within(order).getByText('Quinn')).toBeInTheDocument();
    expect(within(order).getAllByRole('listitem')).toHaveLength(turnOrder.length);
  });

  it('entfernt die aktive Markierung am Kampfende', () => {
    const state = combat();
    useCombatStore.getState().startCombat(state);
    useCombatStore.setState({ outcome: 'victory', combat: { ...state, pending: [] } });
    render(<TurnOrderBar />);

    const order = screen.getByRole('list', { name: 'Combat turn order' });
    expect(within(order).queryByRole('listitem', { current: 'step' })).not.toBeInTheDocument();
  });
});
