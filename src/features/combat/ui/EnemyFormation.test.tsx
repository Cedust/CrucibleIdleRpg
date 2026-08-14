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

  it('zeigt gleich hohe Gegner-Slots mit Bulwark und effektiver Backline-Reduktion', () => {
    useCombatStore.getState().startCombat(combat(FORMATIONS.rampWithTank));
    render(<EnemyFormation />);

    expect(screen.getByRole('region', { name: 'Enemy Formation' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Enemy Formation' })).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(['Frontline', 'Backline']);
    for (const heading of screen.getAllByRole('heading', { level: 3 })) {
      expect(heading).toHaveClass('text-accent-strong');
    }
    expect(screen.getAllByTestId('formation-slot')).toHaveLength(6);
    for (const slot of screen.getAllByTestId('formation-slot')) {
      expect(slot).toHaveClass('min-h-44');
    }
    expect(screen.getByRole('article', { name: 'Empty backline slot 3' })).toBeInTheDocument();
    for (const emptySlot of screen.getAllByRole('article', { name: /^Empty/ })) {
      expect(emptySlot).toHaveAttribute('data-semantic', 'empty');
      expect(emptySlot).toHaveClass('border-dashed', 'border-state-empty-border');
    }
    expect(
      screen.getByRole('article', { name: 'Slag Bulwark frontline slot 1' }),
    ).not.toHaveAttribute('data-semantic');
    for (const portrait of screen.getAllByTestId('enemy-portrait-placeholder')) {
      expect(portrait).toHaveClass('size-portrait-lg');
    }
    const slagCard = screen.getByRole('article', { name: 'Slag Bulwark frontline slot 1' });
    const slagName = within(slagCard).getByRole('heading', { name: 'Slag Bulwark' });
    const slagPortrait = within(slagCard).getByTestId('enemy-portrait-placeholder');
    expect(slagName).toHaveClass('w-full', 'text-left');
    expect(
      slagName.compareDocumentPosition(slagPortrait) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    for (const health of screen.getAllByTestId('enemy-health')) {
      expect(health).toHaveClass('w-full');
    }
    expect(screen.queryByText('Health')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Slag Bulwark health' })).toBeInTheDocument();
    expect(screen.getByLabelText('Slag Bulwark Bulwark')).toHaveTextContent('25%');
    for (const value of screen.getAllByLabelText('Cinder Wretch Bulwark damage reduction')) {
      expect(value).toHaveTextContent('39.25%');
    }

    const current = useCombatStore.getState().combat;
    if (current === null) throw new Error('Testkampf fehlt');
    act(() => {
      useCombatStore.setState({
        combat: {
          ...current,
          enemies: current.enemies.map((enemy) =>
            enemy.definitionId === 'slagBulwark' ? { ...enemy, bulwarkContribution: 0.05 } : enemy,
          ),
        },
      });
    });

    expect(screen.getByLabelText('Slag Bulwark Bulwark')).toHaveTextContent('5%');
    for (const value of screen.getAllByLabelText('Cinder Wretch Bulwark damage reduction')) {
      expect(value).toHaveTextContent('23.05%');
    }
    expect(screen.queryByRole('button', { name: 'Scroll formation left' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Scroll formation right' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('enemy-formation-grid')).not.toHaveClass('overflow-x-auto');
  });

  it('marks a defeated enemy without removing its formation slot', () => {
    const state = combat();
    useCombatStore.getState().startCombat({
      ...state,
      enemies: state.enemies.map((enemy, index) => (index === 0 ? { ...enemy, health: 0 } : enemy)),
    });
    render(<EnemyFormation />);

    expect(screen.getAllByTestId('formation-slot')).toHaveLength(6);
    expect(screen.getByText('FALLEN')).toBeInTheDocument();
    expect(screen.getAllByTestId('enemy-portrait-placeholder')[0]).toHaveAttribute('data-defeated');
    expect(screen.queryByText(`0 / ${state.enemies[0]?.maxHealth ?? 0}`)).not.toBeInTheDocument();
  });
});
