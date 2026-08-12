// @vitest-environment jsdom
import { Profiler } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { TEAM_ORDER } from '@/game/characters/characters';
import { FORMATIONS } from '@/game/encounters/formations';
import type { FormationDefinition } from '@/game/types';
import { neutralProgression } from '@/features/combat/engine/characterStats';
import { nextTick } from '@/features/combat/engine/combatEngine';
import {
  buildCombatState,
  deriveFloorSeed,
  deriveRunSeed,
  type CombatState,
} from '@/features/combat/engine/combatState';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { createDefaultSave } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { EnemyFormation } from './EnemyFormation';
import { TeamPanel } from './TeamPanel';

/**
 * Profiler-Test des Selective-Subscription-Musters: Nur das Panel der fachlich veränderten
 * Kampfseite committet (AGENTS.md § Architecture).
 */

function combat(formation: FormationDefinition = FORMATIONS.rampBothLanesCrowded): CombatState {
  return buildCombatState({
    floorId: 'A1-D1-11',
    floorIndex: 10,
    floorSeed: deriveFloorSeed(deriveRunSeed(4242, 'A1-D1', 1), 10),
    formation,
    team: TEAM_ORDER.map((id) => ({ id, progression: neutralProgression(20) })),
  });
}

/** Fährt den Kampf vor bis zum nächsten Zug der gewünschten Seite mit sichtbarer Änderung. */
function positionNextActorWithVisibleChange(side: 'character' | 'enemy'): void {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const state = useCombatStore.getState();
    const combat = state.combat;
    if (combat === null) {
      throw new Error('Testkampf fehlt');
    }

    const preview = nextTick(combat, state.context);
    const changed =
      side === 'character'
        ? preview.state.enemies.some(
            (enemy, index) => enemy.health !== combat.enemies[index]?.health,
          )
        : preview.state.characters.some(
            (character, index) =>
              character.health !== combat.characters[index]?.health ||
              character.barrier !== combat.characters[index]?.barrier,
          );

    if (preview.actor?.side === side && changed) {
      return;
    }

    state.advanceTick();
  }

  throw new Error(`Kein ${side}-Zug innerhalb des Testlimits`);
}

describe('TeamPanel & EnemyFormation — selektive Subscriptions', () => {
  beforeEach(() => {
    useCombatStore.getState().clearCombat();
    saveStore.setState({ data: createDefaultSave(42), status: 'ready' });
  });

  it('shows portraits, fixed roles and the three-part level progression for the party', () => {
    const save = createDefaultSave(42);
    saveStore.setState({
      data: {
        ...save,
        characters: {
          ...save.characters,
          korvin: { ...save.characters.korvin, xp: 18 },
        },
      },
      status: 'ready',
    });
    useCombatStore.getState().startCombat(combat());
    render(<TeamPanel />);

    expect(screen.getByRole('region', { name: 'Party' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Party' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Heroes' })).toHaveClass('text-accent-strong');
    expect(screen.getByTestId('character-portrait-korvin')).toBeInTheDocument();
    expect(screen.getByTestId('character-portrait-rhaya')).toBeInTheDocument();
    expect(screen.getByTestId('character-portrait-quinn')).toBeInTheDocument();
    expect(screen.queryByText('Tank')).not.toBeInTheDocument();
    expect(screen.queryByText('Melee')).not.toBeInTheDocument();
    expect(screen.queryByText('Ranged')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Tank role' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Melee role' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ranged role' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Korvin health' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Korvin barrier' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Korvin experience' })).toBeInTheDocument();
    const korvinCard = screen.getByTestId('character-portrait-korvin').closest('article');
    if (korvinCard === null) throw new Error('Korvin card missing');
    expect(screen.getByTestId('character-portrait-korvin')).toHaveClass('size-36');
    expect(screen.getByTestId('korvin-details')).toHaveClass('flex-1');
    expect(screen.getByTestId('korvin-details')).not.toHaveClass('w-36');
    expect(within(korvinCard).getByText('Level 1')).toBeInTheDocument();
    expect(within(korvinCard).getByText('18/75 XP')).toBeInTheDocument();
    expect(within(korvinCard).getByText('2')).toBeInTheDocument();
    expect(screen.queryByText(/ATK|DEF/)).not.toBeInTheDocument();
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
