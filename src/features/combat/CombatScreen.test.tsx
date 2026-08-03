import { Profiler } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { TEAM_ORDER } from '@/game/characters/characters';
import { FORMATIONS } from '@/game/encounters/formations';
import type { FormationDefinition } from '@/game/types';
import { neutralProgression } from './characterStats';
import { CombatLog } from './CombatLog';
import { CombatControls, CombatScreen } from './CombatScreen';
import { nextTick, type TickResult } from './combatEngine';
import {
  buildCombatState,
  deriveFloorSeed,
  deriveRunSeed,
  type ActorRef,
  type CombatState,
} from './combatState';
import { useCombatStore } from './combatStore';
import { EnemyFormation } from './EnemyFormation';
import { TeamPanel } from './TeamPanel';
import { TurnOrderBar } from './TurnOrderBar';

function combat(
  formation: FormationDefinition = FORMATIONS.rampBothLanesCrowded as FormationDefinition,
): CombatState {
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

function positionNextActorWithVisibleChange(side: 'character' | 'enemy'): void {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const state = useCombatStore.getState();
    if (state.combat === null) {
      throw new Error('Testkampf fehlt');
    }

    const preview = nextTick(state.combat, state.context);
    const changed =
      side === 'character'
        ? preview.state.enemies.some(
            (enemy, index) => enemy.health !== state.combat?.enemies[index]?.health,
          )
        : preview.state.characters.some(
            (character, index) =>
              character.health !== state.combat?.characters[index]?.health ||
              character.barrier !== state.combat?.characters[index]?.barrier,
          );

    if (preview.actor?.side === side && changed) {
      return;
    }

    state.advanceTick();
  }

  throw new Error(`Kein ${side}-Zug innerhalb des Testlimits`);
}

describe('CombatScreen', () => {
  beforeEach(() => {
    useCombatStore.getState().clearCombat();
    useCombatStore.getState().setPlaybackSpeed(1);
  });

  it('startet A1-D1-01 pausiert und schaltet das Playback zugänglich um', async () => {
    const user = userEvent.setup();
    render(<CombatScreen />);

    await user.click(screen.getByRole('button', { name: 'Start Combat' }));

    expect(screen.getByText('A1-D1-01')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume Combat' })).toBeInTheDocument();
    expect(screen.getAllByText('Korvin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ashen Ghoul').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Resume Combat' }));
    expect(screen.getByRole('button', { name: 'Pause Combat' })).toBeInTheDocument();
    expect(useCombatStore.getState().isPaused).toBe(false);
  });

  it('rendert Steuerung nicht erneut, wenn nur ein offener Takt fortschreitet', () => {
    useCombatStore.getState().startCombat(combat());
    let commits = 0;
    render(
      <Profiler id="combat-controls" onRender={() => (commits += 1)}>
        <CombatControls />
      </Profiler>,
    );
    expect(commits).toBe(1);

    act(() => {
      useCombatStore.getState().advanceTick();
    });

    expect(useCombatStore.getState().outcome).toBe('ongoing');
    expect(commits).toBe(1);
  });

  it('aktualisiert nur das Panel der fachlich veränderten Kampfseite', () => {
    useCombatStore.getState().startCombat(combat());
    positionNextActorWithVisibleChange('character');
    let teamCommits = 0;
    let formationCommits = 0;
    const characterTurn = render(
      <>
        <Profiler id="team-panel" onRender={() => (teamCommits += 1)}>
          <TeamPanel />
        </Profiler>
        <Profiler id="enemy-formation" onRender={() => (formationCommits += 1)}>
          <EnemyFormation />
        </Profiler>
      </>,
    );

    act(() => {
      useCombatStore.getState().advanceTick();
    });
    expect(teamCommits).toBe(1);
    expect(formationCommits).toBe(2);
    characterTurn.unmount();

    useCombatStore.getState().startCombat(combat());
    positionNextActorWithVisibleChange('enemy');
    teamCommits = 0;
    formationCommits = 0;
    render(
      <>
        <Profiler id="team-panel" onRender={() => (teamCommits += 1)}>
          <TeamPanel />
        </Profiler>
        <Profiler id="enemy-formation" onRender={() => (formationCommits += 1)}>
          <EnemyFormation />
        </Profiler>
      </>,
    );

    act(() => {
      useCombatStore.getState().advanceTick();
    });
    expect(teamCommits).toBe(2);
    expect(formationCommits).toBe(1);
  });
});

describe('Kampfbildschirm-Bausteine', () => {
  beforeEach(() => useCombatStore.getState().clearCombat());

  it('zeigt die Gegner als zwei Lanes mit je drei Slots', () => {
    useCombatStore.getState().startCombat(combat());
    render(<EnemyFormation />);

    expect(screen.getByRole('heading', { name: 'Backline' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Frontline' })).toBeInTheDocument();
    expect(screen.getAllByTestId('formation-slot')).toHaveLength(6);
    expect(screen.getByLabelText('Empty backline slot 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scroll formation left' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scroll formation right' })).toBeInTheDocument();
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
    if (currentCombat === null || currentCombat === undefined || nextActive === undefined) {
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
    useCombatStore.setState({ combat: state, outcome: 'ongoing', tickLog: [tick] });
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
    useCombatStore.setState({ combat: state, tickLog: [first] });
    render(<CombatLog />);
    const originalFirstEntry = screen.getByRole('listitem');

    act(() => useCombatStore.setState({ tickLog: [first, second] }));

    const entries = screen.getAllByRole('listitem');
    expect(entries[0]).toHaveTextContent('Round 2 begins');
    expect(entries[1]).toHaveTextContent('Round 1 begins');
    expect(entries[1]).toBe(originalFirstEntry);
  });
});
