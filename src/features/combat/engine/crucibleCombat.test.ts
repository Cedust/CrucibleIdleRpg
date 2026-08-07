import { describe, expect, it } from 'vitest';
import { CRUCIBLE_IDS } from '@/game/crucible/crucible';
import { resumePrng } from '@/shared/utils/prng';
import { nextTick, runCombat, type CombatContext, type TickResult } from './combatEngine';
import type { ActorRef, CombatState } from './combatState';
import type { HitEvent } from './combatEvents';
import { crucibleCombatContext } from './crucibleCombat';
import { distributeTeamDamage, menacedAccuracy, resolveEnemyAttack } from './damagePipeline';
import { NO_CRIT_NODES, type MasteryEffects } from './outgoingDamage';
import { momentumBonus } from './turnOrder';
import { characterFixture, combatStateFixture, enemyFixture, scriptedPrng } from './testFixtures';

/**
 * Kampfwirkungen der Crucible-Nodes an ihren Hebeln (docs/spec/SIGNATURES.md): Mitigation in
 * der Verteilung, Sunder am Bulwark, Suppression an der Pending-Queue, dazu die vier
 * Molten-Vertiefungen an Schadensabschluss, Trefferchance, Queue-Erzeugung und Todesauflösung.
 * Eigene Eingangswerte statt Platzhalter-Content; die Zahlen stammen aus den
 * SPEC-Test-Vektoren.
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
  it('lässt ohne Freischaltung keinen Effekt entstehen (SIGNATURES §1, §2)', () => {
    const ohne = crucibleCombatContext({});

    expect(ohne.mitigation).toBe(0);
    expect(ohne.sunder).toBeUndefined();
    expect(ohne.suppression).toBeUndefined();
    expect(ohne.ambush).toBeUndefined();
    expect(ohne.menace).toBeUndefined();
    expect(ohne.momentum).toBeUndefined();
    expect(ohne.secondWind).toBeUndefined();
  });

  it('bindet die Rangwerte an die tragenden Charaktere', () => {
    const voll = crucibleCombatContext({
      [CRUCIBLE_IDS.mitigation]: 5,
      [CRUCIBLE_IDS.sunder]: 5,
      [CRUCIBLE_IDS.suppression]: 2,
      [CRUCIBLE_IDS.ambush]: 5,
      [CRUCIBLE_IDS.menace]: 5,
      [CRUCIBLE_IDS.momentum]: 3,
      [CRUCIBLE_IDS.secondWind]: 3,
    });

    expect(voll.mitigation).toBe(0.3);
    expect(voll.sunder).toEqual({ characterId: 'rhaya', perAttack: 0.1, cap: 0.2 });
    expect(voll.suppression).toEqual({ characterId: 'quinn', places: 2 });
    expect(voll.ambush).toEqual({ bonus: 0.25 });
    expect(voll.menace).toEqual({ reduction: 0.1 });
    expect(voll.momentum).toEqual({ cap: 3 });
    expect(voll.secondWind).toEqual({ share: 0.2 });
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

describe('Ambush — Runde-1-Bonus auf den finalen Schaden (SIGNATURES §2.1)', () => {
  const AMBUSH_RANK_5 = { bonus: 0.25 } as const;
  const hitEvents = (tick: TickResult) =>
    tick.events.filter((event): event is HitEvent => event.type === 'hit');

  // Multi Hit und Splash garantiert; der Splash trifft die Backline durch den Bulwark-Malus.
  const attackerState = (round: number) =>
    combatStateFixture(
      [
        characterFixture({
          id: 'rhaya',
          role: 'melee',
          slotIndex: 0,
          offensive: { multiHitChance: 1, splashChance: 1 },
        }),
      ],
      [
        enemyFixture({ formationIndex: 0, health: 100000, bulwarkContribution: 0.3 }),
        enemyFixture({ formationIndex: 3, health: 100000 }),
      ],
      { round, pending: [{ side: 'character', index: 0 }] },
    );

  it('erhöht in Runde 1 Grundtreffer, Multi Hit und Splash nach Bulwark um den Rangbonus', () => {
    const basis = nextTick(attackerState(1), context());
    const ambush = nextTick(attackerState(1), context({ ambush: AMBUSH_RANK_5 }));

    const basisHits = hitEvents(basis);
    const ambushHits = hitEvents(ambush);

    expect(new Set(basisHits.map((hit) => hit.kind))).toEqual(
      new Set(['base', 'multiHit', 'splash']),
    );
    expect(ambushHits).toHaveLength(basisHits.length);
    ambushHits.forEach((hit, index) => {
      expect(hit.damage).toBeCloseTo((basisHits[index]?.damage ?? 0) * 1.25, 10);
    });
    // Attack 100 × Damage-Range 1 ohne Malus → 125 finaler Grundtreffer auf Rang 5.
    expect(ambushHits[0]?.damage).toBeCloseTo(125, 10);
  });

  it('erhöht in Runde 1 auch Mastery-Treffer wie Echoed Strike', () => {
    const masteryEffects: MasteryEffects = {
      executioner: false,
      perfectExploit: false,
      surestrike: false,
      overcritical: false,
      relentlessPursuit: false,
      echoedStrike: true,
      stormSurge: false,
      perfectCadence: false,
      epicenter: false,
      focusedBlast: false,
      aftershock: false,
      perfectRiposte: false,
      guardedReprisal: false,
      escalatingRetaliation: false,
      committedImpact: false,
      immovableGuard: false,
      twinMeasure: false,
      secondWind: false,
      zeroingIn: false,
      patientHunter: false,
      guarded: false,
      counterStacks: 0,
    };
    const masteryContext = (overrides: Partial<CombatContext> = {}): CombatContext => ({
      contextFor: () => ({
        damageRange: { min: 1, max: 1 },
        critNodes: NO_CRIT_NODES,
        mastery: masteryEffects,
      }),
      mitigation: 0,
      ...overrides,
    });
    const echoState = () =>
      combatStateFixture(
        [characterFixture({ id: 'rhaya', role: 'melee', slotIndex: 0 })],
        [enemyFixture({ formationIndex: 0, health: 100000 })],
        { round: 1, pending: [{ side: 'character', index: 0 }] },
      );

    const basis = hitEvents(nextTick(echoState(), masteryContext()));
    const ambush = hitEvents(nextTick(echoState(), masteryContext({ ambush: AMBUSH_RANK_5 })));

    const basisEcho = basis.find((hit) => hit.kind === 'echo');
    const ambushEcho = ambush.find((hit) => hit.kind === 'echo');

    expect(basisEcho).toBeDefined();
    expect(ambushEcho?.damage).toBeCloseTo((basisEcho?.damage ?? 0) * 1.25, 10);
  });

  it('erhöht in Runde 1 auch den Counter als charaktererzeugten Treffer', () => {
    const counterState = () =>
      combatStateFixture(
        [
          characterFixture({
            id: 'rhaya',
            role: 'melee',
            slotIndex: 0,
            offensive: { counterChance: 1 },
          }),
        ],
        [enemyFixture({ formationIndex: 0, health: 100000, attack: 30, accuracy: 1 })],
        { round: 1, pending: [{ side: 'enemy', index: 0 }] },
      );

    const basis = hitEvents(nextTick(counterState(), context()));
    const ambush = hitEvents(nextTick(counterState(), context({ ambush: AMBUSH_RANK_5 })));

    const basisCounter = basis.find((hit) => hit.kind === 'counter');
    const ambushCounter = ambush.find((hit) => hit.kind === 'counter');

    expect(basisCounter).toBeDefined();
    expect(ambushCounter?.damage).toBeCloseTo((basisCounter?.damage ?? 0) * 1.25, 10);
  });

  it('ist ab Runde 2 neutral', () => {
    const basis = nextTick(attackerState(2), context());
    const ambush = nextTick(attackerState(2), context({ ambush: AMBUSH_RANK_5 }));

    expect(ambush).toEqual(basis);
  });
});

describe('Menace — Accuracy-Minderung vor Evasion (SIGNATURES §2.2)', () => {
  const team = (korvinHealth = 1000) => [
    characterFixture({ id: 'korvin', role: 'tank', slotIndex: 0, health: korvinHealth }),
    characterFixture({ id: 'rhaya', role: 'melee', slotIndex: 1 }),
  ];

  it('reduziert Accuracy 0,80 auf Rang 5 vor Evasion zu 0,72 (Test-Vektor)', () => {
    expect(menacedAccuracy(team(), 0.8, 0.1)).toBeCloseTo(0.72, 10);
  });

  it('wendet die Reihenfolge Accuracy × (1 − Menace) × (1 − Evasion) an', () => {
    const characters = [
      characterFixture({ id: 'korvin', role: 'tank', slotIndex: 0, defensive: { evasion: 0.5 } }),
    ];

    const attack = resolveEnemyAttack(
      characters,
      { attack: 100, accuracy: menacedAccuracy(characters, 0.8, 0.1) },
      scriptedPrng([0.99]),
    );

    expect(attack.results[0]?.hitChance).toBeCloseTo(0.72 * 0.5, 10);
  });

  it('wirkt nur, solange der Tank zu Angriffsbeginn lebt', () => {
    expect(menacedAccuracy(team(0), 0.8, 0.1)).toBeCloseTo(0.8, 10);
    expect(menacedAccuracy([], 0.8, 0.1)).toBe(0.8);
  });

  it('entscheidet an der Engine über Treffer oder Ausweichen des Angriffs', () => {
    // Erster Zug des combat-Stroms in [0,9; 1): Accuracy 1 trifft, menaced 0,9 weicht aus.
    let prngState = 1;
    while (resumePrng(prngState).next() < 0.9) prngState += 1;

    const menacedState = (korvinHealth = 1000) =>
      combatStateFixture(
        team(korvinHealth),
        [enemyFixture({ formationIndex: 0, health: 100000, accuracy: 1 })],
        { round: 1, pending: [{ side: 'enemy', index: 0 }], combatPrngState: prngState },
      );
    const firstEvaded = (tick: TickResult) =>
      tick.events.find((event) => event.type === 'damageTaken')?.evaded;

    expect(firstEvaded(nextTick(menacedState(), context()))).toBe(false);
    expect(firstEvaded(nextTick(menacedState(), context({ menace: { reduction: 0.1 } })))).toBe(
      true,
    );

    // Toter Tank zu Angriffsbeginn: Menace bleibt ohne jede Wirkung auf den Takt.
    const ohneTank = nextTick(menacedState(0), context());
    const menacedOhneTank = nextTick(menacedState(0), context({ menace: { reduction: 0.1 } }));
    expect(menacedOhneTank).toEqual(ohneTank);
  });
});

describe('Momentum — Initiative bei der Queue-Erzeugung (SIGNATURES §2.3)', () => {
  it('liefert auf Rang 3 in den Runden 1–7 die Boni 0/1/2/3/3/3/3 (Test-Vektor)', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((round) => momentumBonus(round, 3))).toEqual([
      0, 1, 2, 3, 3, 3, 3,
    ]);
  });

  it('hebt Charaktere temporär in der Queue, cappt am Rang und lässt die Stats unverändert', () => {
    const stateAtRound = (round: number) =>
      combatStateFixture(
        [
          characterFixture({
            id: 'korvin',
            role: 'tank',
            slotIndex: 0,
            utility: { initiative: 5 },
          }),
        ],
        [enemyFixture({ formationIndex: 0, health: 100000, initiative: 6 })],
        { round, pending: [] },
      );
    const momentum = context({ momentum: { cap: 3 } });

    // Runde 1 ohne Bonus, Runde 2 Gleichstand (Gegner zuerst), Runde 4 Charakter voraus.
    expect(nextTick(stateAtRound(0), momentum).actor).toEqual({ side: 'enemy', index: 0 });
    expect(nextTick(stateAtRound(1), momentum).actor).toEqual({ side: 'enemy', index: 0 });
    expect(nextTick(stateAtRound(3), momentum).actor).toEqual({ side: 'character', index: 0 });
    // Cap: weit spätere Runden bleiben bei +3 statt unbegrenzt zu wachsen.
    expect(nextTick(stateAtRound(9), momentum).actor).toEqual({ side: 'character', index: 0 });
    // Ohne Momentum bleibt der Gegner in Runde 4 vorn.
    expect(nextTick(stateAtRound(3), context()).actor).toEqual({ side: 'enemy', index: 0 });

    const tick = nextTick(stateAtRound(3), momentum);
    expect(tick.state.characters[0]?.stats.utility.initiative).toBe(5);
  });
});

describe('Second Wind — einmal je Dungeon-Run (SIGNATURES §2.4)', () => {
  const ENEMY: ActorRef = { side: 'enemy', index: 0 };
  const SECOND_WIND_RANK_3 = { share: 0.2 } as const;

  const korvin = (overrides: Parameters<typeof characterFixture>[0]['offensive'] = {}) =>
    characterFixture({
      id: 'korvin',
      role: 'tank',
      slotIndex: 0,
      maxHealth: 200,
      health: 10,
      offensive: overrides,
    });

  it('hält den zuerst tödlich Getroffenen mit 200 Max-Health einmalig bei 40 (Test-Vektor)', () => {
    const state = combatStateFixture(
      [korvin()],
      [enemyFixture({ formationIndex: 0, health: 100000, attack: 300, accuracy: 1 })],
      { round: 1, pending: [ENEMY] },
    );

    const tick = nextTick(state, context({ secondWind: SECOND_WIND_RANK_3 }));

    expect(tick.state.characters[0]?.health).toBeCloseTo(40, 10);
    expect(tick.state.secondWindConsumed).toBe(true);
    expect(tick.outcome).toBe('ongoing');
    expect(tick.events.some((event) => event.type === 'defeat')).toBe(false);

    const secondWindEvents = tick.events.filter((event) => event.type === 'secondWind');
    expect(secondWindEvents).toHaveLength(1);
    expect(secondWindEvents[0]?.actor).toEqual({ side: 'character', index: 0 });
    expect(secondWindEvents[0]?.health).toBeCloseTo(40, 10);
  });

  it('verbraucht bei mehreren tödlichen Ergebnissen den ersten Charakter in fester Team-Reihenfolge', () => {
    const state = combatStateFixture(
      [
        korvin(),
        characterFixture({ id: 'rhaya', role: 'melee', slotIndex: 1, health: 10 }),
        characterFixture({ id: 'quinn', role: 'ranged', slotIndex: 2, health: 10 }),
      ],
      [enemyFixture({ formationIndex: 0, health: 100000, attack: 900, accuracy: 1 })],
      { round: 1, pending: [ENEMY] },
    );

    const tick = nextTick(state, context({ secondWind: SECOND_WIND_RANK_3 }));

    expect(tick.state.characters[0]?.health).toBeCloseTo(40, 10);
    expect(tick.state.characters[1]?.health).toBe(0);
    expect(tick.state.characters[2]?.health).toBe(0);
    expect(
      tick.events.filter((event) => event.type === 'defeat').map((event) => event.actor),
    ).toEqual([
      { side: 'character', index: 1 },
      { side: 'character', index: 2 },
    ]);
    expect(tick.events.filter((event) => event.type === 'secondWind')).toHaveLength(1);
  });

  it('verhindert nur den ersten tödlichen Treffer — der nächste bleibt tödlich', () => {
    const state = combatStateFixture(
      [korvin()],
      [enemyFixture({ formationIndex: 0, health: 100000, attack: 300, accuracy: 1 })],
      { round: 1, pending: [ENEMY] },
    );
    const combat = context({ secondWind: SECOND_WIND_RANK_3 });

    const first = nextTick(state, combat);
    const second = nextTick({ ...first.state, pending: [ENEMY] }, combat);

    expect(second.state.characters[0]?.health).toBe(0);
    expect(second.state.secondWindConsumed).toBe(true);
    expect(second.events.some((event) => event.type === 'secondWind')).toBe(false);
    expect(second.events.some((event) => event.type === 'defeat')).toBe(true);
  });

  it('löst mit übernommenem Run-Verbrauch aus dem vorigen Floor nicht mehr aus', () => {
    const state = combatStateFixture(
      [korvin()],
      [enemyFixture({ formationIndex: 0, health: 100000, attack: 300, accuracy: 1 })],
      { round: 1, pending: [ENEMY], secondWindConsumed: true },
    );

    const tick = nextTick(state, context({ secondWind: SECOND_WIND_RANK_3 }));

    expect(tick.state.characters[0]?.health).toBe(0);
    expect(tick.events.some((event) => event.type === 'secondWind')).toBe(false);
    expect(tick.events.some((event) => event.type === 'defeat')).toBe(true);
  });

  it('lässt den Geretteten als getroffenen Lebenden countern', () => {
    const state = combatStateFixture(
      [korvin({ counterChance: 1 })],
      [enemyFixture({ formationIndex: 0, health: 100000, attack: 300, accuracy: 1 })],
      { round: 1, pending: [ENEMY] },
    );

    const tick = nextTick(state, context({ secondWind: SECOND_WIND_RANK_3 }));

    expect(tick.events.some((event) => event.type === 'hit' && event.kind === 'counter')).toBe(
      true,
    );
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
      [CRUCIBLE_IDS.ambush]: 2,
      [CRUCIBLE_IDS.menace]: 3,
      [CRUCIBLE_IDS.momentum]: 2,
      [CRUCIBLE_IDS.secondWind]: 1,
    });

    const erster = runCombat(state, combat);
    const zweiter = runCombat(state, combat);

    expect(zweiter.events).toEqual(erster.events);
    expect(zweiter.outcome).toBe(erster.outcome);
    expect(zweiter.state).toEqual(erster.state);
  });
});
