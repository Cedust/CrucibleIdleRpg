import { describe, expect, it } from 'vitest';
import type { ActiveRite, EffectRuneId, TriggerRuneId } from '@/game/runes/types';
import type { CombatContext, TickResult } from './combatEngine';
import { nextTick } from './combatEngine';
import { NO_MITIGATION } from './damage/damagePipeline';
import { NO_CRIT_NODES } from './damage/outgoingDamage';
import type { HitEvent } from './combatEvents';
import {
  characterFixture as character,
  combatStateFixture,
  enemyFixture,
  type CharacterFixture,
} from './testFixtures';

const context: CombatContext = {
  contextFor: () => ({ damageRange: { min: 1, max: 1 }, critNodes: NO_CRIT_NODES }),
  mitigation: NO_MITIGATION,
};

function rite(triggerRuneId: TriggerRuneId, effectRuneId: EffectRuneId): ActiveRite {
  return { triggerRuneId, triggerLevel: 5, effectRuneId, effectLevel: 1 };
}

function characterTurn(
  triggerRuneId: TriggerRuneId,
  effectRuneId: EffectRuneId,
  options: Omit<CharacterFixture, 'id' | 'slotIndex'> = {},
): TickResult {
  const source = character({ id: 'rhaya', slotIndex: 0, ...options });
  return nextTick(
    combatStateFixture(
      [source],
      [
        enemyFixture({ formationIndex: 0, health: 100_000 }),
        enemyFixture({ formationIndex: 1, health: 100_000 }),
      ],
      {
        round: 1,
        pending: [{ side: 'character', index: 0 }],
        rites: { rhaya: rite(triggerRuneId, effectRuneId) },
      },
    ),
    context,
  );
}

describe('Rite-Auslösung — eigene Events und einmal je Runde', () => {
  it.each([
    ['rune.trigger.on-crit', { offensive: { critChance: 1 } }],
    ['rune.trigger.on-multi-hit', { offensive: { multiHitChance: 1 } }],
    ['rune.trigger.on-splash', { offensive: { splashChance: 1 } }],
  ] as const)('ordnet %s dem eigenen Angriffs-Event zu', (triggerRuneId, options) => {
    const tick = characterTurn(triggerRuneId, 'rune.effect.heal', options);

    expect(tick.events.filter((event) => event.type === 'riteTrigger')).toHaveLength(1);
    expect(tick.events.filter((event) => event.type === 'riteEffect')).toHaveLength(1);
  });

  it('ordnet Counter, Block und Evade jeweils dem eigenen Ereignis zu', () => {
    const cases = [
      {
        trigger: 'rune.trigger.on-counter' as const,
        defensive: {},
        offensive: { counterChance: 1 },
      },
      { trigger: 'rune.trigger.on-block' as const, defensive: { blockChance: 1 }, offensive: {} },
      { trigger: 'rune.trigger.on-evade' as const, defensive: { evasion: 1 }, offensive: {} },
    ];

    for (const entry of cases) {
      const state = combatStateFixture(
        [
          character({
            id: 'rhaya',
            slotIndex: 0,
            defensive: entry.defensive,
            offensive: entry.offensive,
          }),
        ],
        [enemyFixture({ formationIndex: 0, initiative: 99 })],
        {
          round: 1,
          pending: [{ side: 'enemy', index: 0 }],
          rites: { rhaya: rite(entry.trigger, 'rune.effect.barrier') },
        },
      );
      expect(
        nextTick(state, context).events.filter((event) => event.type === 'riteTrigger'),
      ).toHaveLength(1);
    }
  });

  it('reserviert den ersten qualifizierenden Event bis zum Rundenende', () => {
    const first = characterTurn('rune.trigger.on-multi-hit', 'rune.effect.heal', {
      offensive: { multiHitChance: 1 },
    });
    const second = nextTick(
      { ...first.state, pending: [{ side: 'character', index: 0 }] },
      context,
    );

    expect(first.events.filter((event) => event.type === 'riteTrigger')).toHaveLength(1);
    expect(second.events.filter((event) => event.type === 'riteTrigger')).toHaveLength(0);
  });

  it('lässt fremde Events nicht in einen Rite eines anderen Charakters laufen', () => {
    const state = combatStateFixture(
      [
        character({ id: 'korvin', slotIndex: 0, offensive: { critChance: 1 } }),
        character({ id: 'rhaya', slotIndex: 1 }),
      ],
      [enemyFixture({ formationIndex: 0, health: 100_000 })],
      {
        round: 1,
        pending: [{ side: 'character', index: 0 }],
        rites: { rhaya: rite('rune.trigger.on-crit', 'rune.effect.heal') },
      },
    );

    expect(
      nextTick(state, context).events.filter((event) => event.type === 'riteTrigger'),
    ).toHaveLength(0);
  });
});

describe('Rite-Basis-Effects', () => {
  it('heilt, baut Barrier auf und speichert Empower nur im Kampfzustand', () => {
    const heal = characterTurn('rune.trigger.on-crit', 'rune.effect.heal', {
      health: 900,
      maxHealth: 1_000,
      offensive: { critChance: 1 },
    });
    const barrier = characterTurn('rune.trigger.on-crit', 'rune.effect.barrier', {
      offensive: { critChance: 1 },
    });
    const empower = characterTurn('rune.trigger.on-crit', 'rune.effect.empower', {
      offensive: { critChance: 1 },
    });

    expect(heal.state.characters[0]?.health).toBeGreaterThan(900);
    expect(barrier.state.characters[0]?.barrier).toBeGreaterThan(0);
    expect(empower.state.characters[0]?.empower).toEqual({
      attackBonus: 0.15,
      expiresAfterRound: 2,
    });
  });

  it('lässt Bolt Bulwark ignorieren und zeigt Effect und Treffer getrennt im Playback', () => {
    const tick = nextTick(
      combatStateFixture(
        [
          character({
            id: 'rhaya',
            slotIndex: 0,
            offensive: { splashChance: 1 },
          }),
        ],
        [
          enemyFixture({ formationIndex: 0, health: 100_000, bulwarkContribution: 0.5 }),
          enemyFixture({ formationIndex: 3, health: 100_000 }),
        ],
        {
          round: 1,
          pending: [{ side: 'character', index: 0 }],
          rites: { rhaya: rite('rune.trigger.on-splash', 'rune.effect.bolt') },
        },
      ),
      context,
    );
    const bolt = tick.events.find(
      (event): event is HitEvent => event.type === 'hit' && event.kind === 'riteBolt',
    );

    expect(tick.events.some((event) => event.type === 'riteEffect')).toBe(true);
    // Der Splash trifft mit Bulwark nur für 20; der Bolt referenziert den rohen Splash (40)
    // und bleibt deshalb bei 22 statt ebenfalls halbiert zu werden.
    expect(bolt?.damage).toBe(22);
  });

  it('legt und verbraucht Mark beim nächsten Angriff eines anderen Charakters', () => {
    const marked = characterTurn('rune.trigger.on-crit', 'rune.effect.mark', {
      offensive: { critChance: 1 },
    });
    const rhaya = marked.state.characters[0];
    if (rhaya === undefined) throw new Error('Rhaya fehlt nach der Mark-Auslösung');
    const withAlly = {
      ...marked.state,
      characters: [rhaya, character({ id: 'quinn', slotIndex: 1, attack: 100 })],
      pending: [{ side: 'character' as const, index: 1 }],
    };
    const consumed = nextTick(withAlly, context);

    expect(consumed.events.some((event) => event.type === 'hit' && event.kind === 'mark')).toBe(
      true,
    );
    expect(consumed.state.enemies[0]?.mark).toBeUndefined();
  });

  it('führt Reprisal als zweite Basisangriff-Handlung ohne Regeneration aus', () => {
    const tick = characterTurn('rune.trigger.on-crit', 'rune.effect.reprisal', {
      offensive: { critChance: 1 },
      defensive: { regeneration: 50 },
      health: 900,
      maxHealth: 1_000,
    });

    expect(
      tick.events.filter((event) => event.type === 'hit' && event.kind === 'base'),
    ).toHaveLength(2);
    expect(tick.events.filter((event) => event.type === 'regeneration')).toHaveLength(1);
  });
});
