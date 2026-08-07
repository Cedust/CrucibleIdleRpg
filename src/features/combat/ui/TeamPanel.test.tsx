import { Profiler } from 'react';
import { act, render } from '@testing-library/react';
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

describe('TeamPanel & EnemyFormation — selektive Subscriptions', () => {
  beforeEach(() => {
    useCombatStore.getState().clearCombat();
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
