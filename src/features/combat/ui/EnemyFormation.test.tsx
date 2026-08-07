import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { TEAM_ORDER } from '@/game/characters/characters';
import { FORMATIONS } from '@/game/encounters/formations';
import type { FormationDefinition } from '@/game/types';
import { neutralProgression } from '@/features/combat/engine/characterStats';
import {
  buildCombatState,
  deriveFloorSeed,
  deriveRunSeed,
  type CombatState,
} from '@/features/combat/engine/combatState';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { EnemyFormation } from './EnemyFormation';

function combat(formation: FormationDefinition = FORMATIONS.rampBothLanesCrowded): CombatState {
  return buildCombatState({
    floorId: 'A1-D1-11',
    floorIndex: 10,
    floorSeed: deriveFloorSeed(deriveRunSeed(4242, 'A1-D1', 1), 10),
    formation,
    team: TEAM_ORDER.map((id) => ({ id, progression: neutralProgression(20) })),
  });
}

describe('EnemyFormation', () => {
  beforeEach(() => {
    useCombatStore.getState().clearCombat();
  });

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
});
