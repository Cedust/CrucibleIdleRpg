import { describe, expect, it } from 'vitest';
import { CRUCIBLE_IDS } from '@/game/crucible/crucible';
import { nextTick, runCombat, type CombatContext } from './combatEngine';
import type { ActorRef, CombatState } from './combatState';
import { crucibleCombatContext } from './crucibleCombat';
import { distributeTeamDamage } from './damagePipeline';
import { NO_CRIT_NODES } from './outgoingDamage';
import { characterFixture, combatStateFixture, enemyFixture } from './testFixtures';

/**
 * Kampfwirkungen der Crucible-Nodes an ihren Hebeln (docs/spec/SIGNATURES.md): Mitigation in
 * der Verteilung, Sunder am Bulwark, Suppression an der Pending-Queue. Eigene Eingangswerte
 * statt Platzhalter-Content; die Zahlen stammen aus den SPEC-Test-Vektoren.
 */

/** Deterministischer Kontext: Damage-Range 1..1, keine Precision, keine Crit-Knoten. */
function context(overrides: Partial<CombatContext> = {}): CombatContext {
  return {
    contextFor: () => ({ damageRange: { min: 1, max: 1 }, critNodes: NO_CRIT_NODES }),
    mitigation: 0,
    ...overrides,
  };
}

const SUNDER_RANK_5 = { characterId: 'rhaya', perAttack: 0.1, cap: 0.2 } as const;

describe('crucibleCombatContext', () => {
  it('lässt ohne Freischaltung keinen Effekt entstehen (SIGNATURES §1)', () => {
    const ohne = crucibleCombatContext({});

    expect(ohne.mitigation).toBe(0);
    expect(ohne.sunder).toBeUndefined();
    expect(ohne.suppression).toBeUndefined();
  });

  it('bindet die Rangwerte an die tragenden Charaktere', () => {
    const voll = crucibleCombatContext({
      [CRUCIBLE_IDS.mitigation]: 5,
      [CRUCIBLE_IDS.sunder]: 5,
      [CRUCIBLE_IDS.suppression]: 2,
    });

    expect(voll.mitigation).toBe(0.3);
    expect(voll.sunder).toEqual({ characterId: 'rhaya', perAttack: 0.1, cap: 0.2 });
    expect(voll.suppression).toEqual({ characterId: 'quinn', places: 2 });
  });
});

describe('Mitigation — Verteilung des Team-Ticks (SIGNATURES §1.1)', () => {
  const team = [
    characterFixture({ id: 'korvin', role: 'tank', slotIndex: 0 }),
    characterFixture({ id: 'rhaya', role: 'melee', slotIndex: 1 }),
    characterFixture({ id: 'quinn', role: 'ranged', slotIndex: 2 }),
  ];

  it('verteilt 300 auf Rang 1 als 120/90/90 und auf Rang 5 als 160/70/70 (Test-Vektor)', () => {
    const rang1 = distributeTeamDamage(
      team,
      300,
      crucibleCombatContext({ [CRUCIBLE_IDS.mitigation]: 1 }).mitigation,
    );
    const rang5 = distributeTeamDamage(
      team,
      300,
      crucibleCombatContext({ [CRUCIBLE_IDS.mitigation]: 5 }).mitigation,
    );

    expect(rang1.map((share) => share.tick)).toEqual([120, 90, 90]);
    expect(rang5.map((share) => share.tick)).toEqual([160, 70, 70]);
    expect(rang1.reduce((sum, share) => sum + share.tick, 0)).toBe(300);
    expect(rang5.reduce((sum, share) => sum + share.tick, 0)).toBe(300);
  });
});

describe('Sunder — Bulwark-Abbau je Angriff (SIGNATURES §1.2)', () => {
  const rhaya = (overrides: Parameters<typeof characterFixture>[0]['offensive'] = {}) =>
    characterFixture({
      id: 'rhaya',
      role: 'melee',
      slotIndex: 0,
      utility: { initiative: 10, multiHitChain: 4 },
      offensive: overrides,
    });

  it('senkt b = 0,30 auf Rang 5 nach zwei getrennten Angriffen auf 0,10 und stoppt am Cap (Test-Vektor)', () => {
    let state: CombatState = combatStateFixture(
      [rhaya()],
      [enemyFixture({ formationIndex: 0, health: 100000, bulwarkContribution: 0.3 })],
      { round: 0 },
    );
    const combat = context({ sunder: SUNDER_RANK_5 });

    // Runde 1: Rhaya (Initiative 10) vor dem Gegner (5).
    state = nextTick(state, combat).state;
    expect(state.enemies[0]?.bulwarkContribution).toBeCloseTo(0.2, 10);

    state = nextTick(state, combat).state; // Gegner-Zug
    state = nextTick(state, combat).state; // Runde 2: Rhayas zweiter Angriff
    expect(state.enemies[0]?.bulwarkContribution).toBeCloseTo(0.1, 10);

    state = nextTick(state, combat).state; // Gegner-Zug
    state = nextTick(state, combat).state; // Runde 3: Cap erreicht
    expect(state.enemies[0]?.bulwarkContribution).toBeCloseTo(0.1, 10);
    expect(state.enemies[0]?.sunderedBulwark).toBeCloseTo(0.2, 10);
  });

  it('senkt bei fünf Treffern derselben Multi-Hit-Kette nur einmal auf 0,20 (Test-Vektor)', () => {
    const state = combatStateFixture(
      [rhaya({ multiHitChance: 1 })],
      [enemyFixture({ formationIndex: 0, health: 100000, bulwarkContribution: 0.3 })],
      { round: 1, pending: [{ side: 'character', index: 0 }] },
    );

    const tick = nextTick(state, context({ sunder: SUNDER_RANK_5 }));

    expect(tick.events.filter((event) => event.type === 'hit')).toHaveLength(5);
    expect(tick.state.enemies[0]?.bulwarkContribution).toBeCloseTo(0.2, 10);
  });

  it('senkt beide Frontline-Ziele desselben Angriffs jeweils einmal um 0,10 (Test-Vektor)', () => {
    const state = combatStateFixture(
      [rhaya({ splashChance: 1 })],
      [
        enemyFixture({
          formationIndex: 0,
          health: 100000,
          initiative: 9,
          bulwarkContribution: 0.3,
        }),
        enemyFixture({
          formationIndex: 1,
          health: 100000,
          initiative: 5,
          bulwarkContribution: 0.3,
        }),
      ],
      { round: 1, pending: [{ side: 'character', index: 0 }] },
    );

    const tick = nextTick(state, context({ sunder: SUNDER_RANK_5 }));

    expect(tick.state.enemies[0]?.bulwarkContribution).toBeCloseTo(0.2, 10);
    expect(tick.state.enemies[1]?.bulwarkContribution).toBeCloseTo(0.2, 10);
  });

  it('wirkt erst auf nachfolgende Angriffe: die eigenen Treffer nutzen den Bulwark-Stand zu Angriffsbeginn', () => {
    // Splash trifft die Backline, während derselbe Angriff die Frontline sundert.
    const state = combatStateFixture(
      [rhaya({ splashChance: 1, splashDamage: 0.4 })],
      [
        enemyFixture({ formationIndex: 0, health: 100000, bulwarkContribution: 0.3 }),
        enemyFixture({ formationIndex: 3, health: 1000 }),
      ],
      { round: 1, pending: [{ side: 'character', index: 0 }] },
    );

    const tick = nextTick(state, context({ sunder: SUNDER_RANK_5 }));

    // Splash-Schaden 100 × 0,4 gegen den alten Malus 0,30 → 28, nicht gegen 0,20 → 32.
    expect(tick.state.enemies[1]?.health).toBeCloseTo(1000 - 28, 10);
    expect(tick.state.enemies[0]?.bulwarkContribution).toBeCloseTo(0.2, 10);
  });

  it('wendet einen Counter als eigenständigen Angriff an', () => {
    const state = combatStateFixture(
      [rhaya({ counterChance: 1 })],
      [
        enemyFixture({
          formationIndex: 0,
          health: 100000,
          attack: 30,
          accuracy: 1,
          bulwarkContribution: 0.3,
        }),
      ],
      { round: 1, pending: [{ side: 'enemy', index: 0 }] },
    );

    const tick = nextTick(state, context({ sunder: SUNDER_RANK_5 }));

    expect(tick.events.some((event) => event.type === 'hit' && event.kind === 'counter')).toBe(
      true,
    );
    expect(tick.state.enemies[0]?.bulwarkContribution).toBeCloseTo(0.2, 10);
  });

  it('lässt b nie unter 0 fallen', () => {
    const state = combatStateFixture(
      [rhaya()],
      [enemyFixture({ formationIndex: 0, health: 100000, bulwarkContribution: 0.05 })],
      { round: 1, pending: [{ side: 'character', index: 0 }] },
    );

    const tick = nextTick(state, context({ sunder: SUNDER_RANK_5 }));

    expect(tick.state.enemies[0]?.bulwarkContribution).toBe(0);
    expect(tick.state.enemies[0]?.sunderedBulwark).toBeCloseTo(0.05, 10);
  });

  it('wirkt nur für den tragenden Charakter', () => {
    const state = combatStateFixture(
      [characterFixture({ id: 'korvin', role: 'tank', slotIndex: 0 })],
      [enemyFixture({ formationIndex: 0, health: 100000, bulwarkContribution: 0.3 })],
      { round: 1, pending: [{ side: 'character', index: 0 }] },
    );

    const tick = nextTick(state, context({ sunder: SUNDER_RANK_5 }));

    expect(tick.state.enemies[0]?.bulwarkContribution).toBeCloseTo(0.3, 10);
  });
});

describe('Suppression — Verschiebung in der Pending-Queue (SIGNATURES §1.3)', () => {
  const QUINN: ActorRef = { side: 'character', index: 2 };
  const KORVIN: ActorRef = { side: 'character', index: 0 };
  const RHAYA: ActorRef = { side: 'character', index: 1 };
  const E2: ActorRef = { side: 'enemy', index: 0 };
  const E1: ActorRef = { side: 'enemy', index: 1 };
  const E4: ActorRef = { side: 'enemy', index: 2 };

  const team = () => [
    characterFixture({ id: 'korvin', role: 'tank', slotIndex: 0, utility: { initiative: 3 } }),
    characterFixture({ id: 'rhaya', role: 'melee', slotIndex: 1, utility: { initiative: 7 } }),
    characterFixture({ id: 'quinn', role: 'ranged', slotIndex: 2, utility: { initiative: 12 } }),
  ];

  const enemies = () => [
    enemyFixture({ formationIndex: 0, health: 100000, initiative: 9 }),
    enemyFixture({ formationIndex: 1, health: 100000, initiative: 8 }),
    enemyFixture({ formationIndex: 3, health: 100000, initiative: 4 }),
  ];

  it('verschiebt das primäre Ziel um L = 2 offene Plätze (Test-Vektor)', () => {
    const state = combatStateFixture(team(), enemies(), {
      round: 1,
      pending: [QUINN, E2, E1, RHAYA, E4, KORVIN],
    });

    const tick = nextTick(state, context({ suppression: { characterId: 'quinn', places: 2 } }));

    expect(tick.state.pending).toEqual([E1, RHAYA, E2, E4, KORVIN]);
    expect(tick.state.enemies[0]?.suppressedRound).toBe(1);
  });

  it('supprimiert jedes Ziel höchstens einmal pro Runde', () => {
    const state = combatStateFixture(team(), enemies(), {
      round: 1,
      pending: [QUINN, QUINN, E2, E1],
    });
    const combat = context({ suppression: { characterId: 'quinn', places: 1 } });

    const erster = nextTick(state, combat);
    expect(erster.state.pending).toEqual([QUINN, E1, E2]);

    const zweiter = nextTick(erster.state, combat);
    expect(zweiter.state.pending).toEqual([E1, E2]);
  });

  it('wirkt nur für den tragenden Charakter', () => {
    const state = combatStateFixture(team(), enemies(), {
      round: 1,
      pending: [RHAYA, E2, E1],
    });

    const tick = nextTick(state, context({ suppression: { characterId: 'quinn', places: 2 } }));

    expect(tick.state.pending).toEqual([E2, E1]);
    expect(tick.state.enemies[0]?.suppressedRound).toBeUndefined();
  });
});

describe('Determinismus mit aktiven Signatur-Skills', () => {
  it('liefert für denselben Zustand zweimal denselben Kampfverlauf', () => {
    const state = combatStateFixture(
      [
        characterFixture({ id: 'korvin', role: 'tank', slotIndex: 0, utility: { initiative: 3 } }),
        characterFixture({
          id: 'rhaya',
          role: 'melee',
          slotIndex: 1,
          offensive: { critChance: 0.3, multiHitChance: 0.4, counterChance: 0.5 },
          utility: { initiative: 7 },
        }),
        characterFixture({
          id: 'quinn',
          role: 'ranged',
          slotIndex: 2,
          utility: { initiative: 12 },
        }),
      ],
      [
        enemyFixture({ formationIndex: 0, health: 900, attack: 40, bulwarkContribution: 0.3 }),
        enemyFixture({ formationIndex: 3, health: 700, attack: 35 }),
      ],
      { round: 0, combatPrngState: 0xdeadbeef },
    );
    const combat = crucibleCombatContext({
      [CRUCIBLE_IDS.mitigation]: 3,
      [CRUCIBLE_IDS.sunder]: 2,
      [CRUCIBLE_IDS.suppression]: 4,
    });

    const erster = runCombat(state, combat);
    const zweiter = runCombat(state, combat);

    expect(zweiter.events).toEqual(erster.events);
    expect(zweiter.outcome).toBe(erster.outcome);
    expect(zweiter.state).toEqual(erster.state);
  });
});
