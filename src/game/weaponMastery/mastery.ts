import type { CharacterId, CharacterStats } from '@/game/types';

export const DISCIPLINES = ['finesse', 'tempest', 'dominance', 'valor', 'weapon'] as const;
export type DisciplineId = (typeof DISCIPLINES)[number];
export type MasteryRank = 'initiate' | 'adept' | 'expert' | 'master' | 'grandmaster';

/**
 * Save keys of every behavior node the engine references. Node ids are declared explicitly
 * and stay stable when display labels change (pre-release save policy, AGENTS.md).
 */
export const MASTERY_IDS = {
  executioner: 'finesse.executioner',
  perfectExploit: 'finesse.perfect-exploit',
  surestrike: 'finesse.surestrike',
  overcritical: 'finesse.overcritical',
  convergingStrikes: 'tempest.converging-strikes',
  relentlessPursuit: 'tempest.relentless-pursuit',
  echoedStrike: 'tempest.echoed-strike',
  stormSurge: 'tempest.storm-surge',
  perfectCadence: 'tempest.perfect-cadence',
  criticalMass: 'dominance.critical-mass',
  epicenter: 'dominance.epicenter',
  focusedBlast: 'dominance.focused-blast',
  aftershock: 'dominance.aftershock',
  vengefulEdge: 'valor.vengeful-edge',
  perfectRiposte: 'valor.perfect-riposte',
  guardedReprisal: 'valor.guarded-reprisal',
  escalatingRetaliation: 'valor.escalating-retaliation',
  committedImpact: 'weapon.committed-impact',
  titansArc: "weapon.titan's-arc",
  shieldedAdvance: 'weapon.shielded-advance',
  immovableGuard: 'weapon.immovable-guard',
  twinMeasure: 'weapon.twin-measure',
  razorsEdge: "weapon.razor's-edge",
  bladePoise: 'weapon.blade-poise',
  secondWind: 'weapon.second-wind',
  zeroingIn: 'weapon.zeroing-in',
  overdraw: 'weapon.overdraw',
  steadyDraw: 'weapon.steady-draw',
  patientHunter: 'weapon.patient-hunter',
} as const;

export interface MasteryNode {
  id: string;
  discipline: DisciplineId;
  rank: MasteryRank;
  label: string;
  name: string;
  maxRank: 1 | 5;
  prerequisites: readonly string[];
  exclusiveWith?: string;
  /** Only one of the four shared capstones may be active. */
  sharedCapstone?: boolean;
  effect: string;
  stat?:
    | keyof CharacterStats['offensive']
    | keyof CharacterStats['defensive']
    | keyof CharacterStats['utility']
    | 'attack'
    | 'defense'
    | 'precision'
    | 'minRng'
    | 'maxRng';
  perRank?: number;
}

const RANK_LEVEL: Record<MasteryRank, number> = {
  initiate: 1,
  adept: 20,
  expert: 40,
  master: 60,
  grandmaster: 80,
};

export function minimumLevel(node: MasteryNode): number {
  return RANK_LEVEL[node.rank];
}

function disciplineOf(id: string): DisciplineId {
  const prefix = id.slice(0, id.indexOf('.'));
  const discipline = DISCIPLINES.find((candidate) => candidate === prefix);
  if (!discipline) throw new Error(`Mastery node id without discipline prefix: ${id}`);
  return discipline;
}

const stat = (
  id: string,
  rank: MasteryRank,
  label: string,
  name: string,
  prerequisites: readonly string[],
  target: NonNullable<MasteryNode['stat']>,
  perRank: number,
  effect: string,
): MasteryNode => ({
  id,
  discipline: disciplineOf(id),
  rank,
  label,
  name,
  maxRank: 5,
  prerequisites,
  stat: target,
  perRank,
  effect,
});

const behavior = (
  id: string,
  rank: MasteryRank,
  label: string,
  prerequisites: readonly string[],
  effect: string,
  options: Pick<MasteryNode, 'exclusiveWith' | 'sharedCapstone'> = {},
): MasteryNode => ({
  id,
  discipline: disciplineOf(id),
  rank,
  label,
  name: label,
  maxRank: 1,
  prerequisites,
  effect,
  ...options,
});

const ROMAN_UPPER = ['I', 'II', 'III', 'IV'] as const;
const ROMAN_LOWER = ['i', 'ii', 'iii', 'iv'] as const;

const chain = (
  discipline: DisciplineId,
  slug: string,
  label: string,
  effect: string,
  target: NonNullable<MasteryNode['stat']>,
  perRank: number,
  count: number,
  ranks: readonly MasteryRank[],
) =>
  Array.from({ length: count }, (_, index) =>
    stat(
      `${discipline}.${slug}-${ROMAN_LOWER[index] ?? index + 1}`,
      ranks[index] ?? 'master',
      `${label} ${ROMAN_UPPER[index] ?? index + 1}`,
      `${label} ${ROMAN_UPPER[index] ?? index + 1}`,
      index === 0 ? [] : [`${discipline}.${slug}-${ROMAN_LOWER[index - 1] ?? index}`],
      target,
      perRank,
      effect,
    ),
  );

const shared: MasteryNode[] = [
  ...chain('finesse', 'chc', 'CHC', '+3 pp Crit Hit Chance', 'critChance', 0.03, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]),
  ...chain('finesse', 'chd', 'CHD', '+10 pp Crit Hit Damage', 'critDamage', 0.1, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]),
  behavior(
    MASTERY_IDS.executioner,
    'expert',
    'Executioner',
    ['finesse.chc-ii', 'finesse.chd-ii'],
    'Critical clean base hits below 25% health gain +50 pp Crit Damage.',
  ),
  behavior(
    MASTERY_IDS.perfectExploit,
    'master',
    'Perfect Exploit',
    [MASTERY_IDS.executioner],
    'Clean crits use MAX RNG.',
    { exclusiveWith: MASTERY_IDS.surestrike },
  ),
  behavior(
    MASTERY_IDS.surestrike,
    'master',
    'Surestrike',
    [MASTERY_IDS.executioner],
    'Clean base hits are guaranteed critical.',
    { exclusiveWith: MASTERY_IDS.perfectExploit },
  ),
  behavior(
    MASTERY_IDS.overcritical,
    'grandmaster',
    'Overcritical',
    [MASTERY_IDS.perfectExploit, MASTERY_IDS.surestrike],
    'Crits roll once more for one extra Crit bonus.',
    { sharedCapstone: true },
  ),
  ...chain('tempest', 'mhc', 'MHC', '+5 pp Multi Hit Chance', 'multiHitChance', 0.05, 3, [
    'initiate',
    'adept',
    'expert',
  ]),
  ...chain('tempest', 'mhd', 'MHD', '+3 pp Multi Hit Damage', 'multiHitDamage', 0.03, 2, [
    'initiate',
    'expert',
  ]),
  ...chain('tempest', 'chain', 'Chain', '+1 Multi Hit Chain', 'multiHitChain', 1, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]).map((node) => ({ ...node, maxRank: 1 as const })),
  ...chain(
    'tempest',
    'chain-factor',
    'Chain Factor',
    '+5 pp Multi Hit Chain Factor',
    'multiHitChainFactor',
    0.05,
    2,
    ['adept', 'master'],
  ),
  behavior(
    MASTERY_IDS.convergingStrikes,
    'expert',
    'Converging Strikes',
    ['tempest.mhc-ii', 'tempest.chain-factor-i'],
    'Chain hits may crit.',
  ),
  behavior(
    MASTERY_IDS.relentlessPursuit,
    'expert',
    'Relentless Pursuit',
    ['tempest.chain-ii'],
    'Chain hits retarget after the primary target dies.',
  ),
  behavior(
    MASTERY_IDS.echoedStrike,
    'master',
    'Echoed Strike',
    [MASTERY_IDS.convergingStrikes],
    'A clean base hit repeats once for 50% finished damage.',
    { exclusiveWith: MASTERY_IDS.stormSurge },
  ),
  behavior(
    MASTERY_IDS.stormSurge,
    'master',
    'Storm Surge',
    [MASTERY_IDS.convergingStrikes],
    'Original-chain crits add up to two chain hits.',
    { exclusiveWith: MASTERY_IDS.echoedStrike },
  ),
  behavior(
    MASTERY_IDS.perfectCadence,
    'grandmaster',
    'Perfect Cadence',
    [MASTERY_IDS.echoedStrike, MASTERY_IDS.stormSurge],
    'Critical chain hits set the next Chain Factor to 100%.',
    { sharedCapstone: true },
  ),
  ...chain('dominance', 'shc', 'SHC', '+4 pp Splash Hit Chance', 'splashChance', 0.04, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]),
  ...chain('dominance', 'shd', 'SHD', '+3 pp Splash Hit Damage', 'splashDamage', 0.03, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]),
  ...chain('dominance', 'radius', 'Radius', '+1 Splash Radius', 'splashRadius', 1, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]).map((node) => ({ ...node, maxRank: 1 as const })),
  behavior(
    MASTERY_IDS.criticalMass,
    'expert',
    'Critical Mass',
    ['dominance.shc-ii', 'dominance.shd-ii'],
    'Splash hits may crit.',
  ),
  behavior(
    MASTERY_IDS.epicenter,
    'master',
    'Epicenter',
    [MASTERY_IDS.criticalMass],
    'Successful splash adds a 50% hit on the primary target.',
    { exclusiveWith: MASTERY_IDS.focusedBlast },
  ),
  behavior(
    MASTERY_IDS.focusedBlast,
    'master',
    'Focused Blast',
    [MASTERY_IDS.criticalMass],
    'Unused radius adds up to 100% splash damage on the primary target.',
    { exclusiveWith: MASTERY_IDS.epicenter },
  ),
  behavior(
    MASTERY_IDS.aftershock,
    'grandmaster',
    'Aftershock',
    [MASTERY_IDS.epicenter, MASTERY_IDS.focusedBlast],
    'Hit secondary targets receive a 50% second wave.',
    { sharedCapstone: true },
  ),
  ...chain('valor', 'ctc', 'CTC', '+4 pp Counter Chance', 'counterChance', 0.04, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]),
  ...chain('valor', 'ctd', 'CTD', '+5 pp Counter Damage', 'counterDamage', 0.05, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]),
  behavior(
    MASTERY_IDS.vengefulEdge,
    'expert',
    'Vengeful Edge',
    ['valor.ctc-ii', 'valor.ctd-ii'],
    'Counters may crit.',
  ),
  behavior(
    MASTERY_IDS.perfectRiposte,
    'master',
    'Perfect Riposte',
    [MASTERY_IDS.vengefulEdge],
    'Evasion may trigger a normal counter.',
    { exclusiveWith: MASTERY_IDS.guardedReprisal },
  ),
  behavior(
    MASTERY_IDS.guardedReprisal,
    'master',
    'Guarded Reprisal',
    [MASTERY_IDS.vengefulEdge],
    'Successful blocks guarantee a counter.',
    { exclusiveWith: MASTERY_IDS.perfectRiposte },
  ),
  behavior(
    MASTERY_IDS.escalatingRetaliation,
    'grandmaster',
    'Escalating Retaliation',
    [MASTERY_IDS.perfectRiposte, MASTERY_IDS.guardedReprisal],
    'Counters gain up to +75 pp damage per round.',
    { sharedCapstone: true },
  ),
];

const weaponLayout: Record<
  CharacterId,
  readonly [
    string,
    string,
    MasteryRank,
    string,
    NonNullable<MasteryNode['stat']>,
    readonly string[],
  ][]
> = {
  korvin: [
    ['weapon.dmg-i', 'DMG I', 'initiate', '+1 Damage', 'attack', []],
    ['weapon.def-i', 'DEF I', 'initiate', '+1 Mastery Defense', 'defense', []],
    ['weapon.prc-i', 'PRC I', 'initiate', '+1 pp Precision', 'precision', []],
    ['weapon.dmg-ii', 'DMG II', 'adept', '+1 Damage', 'attack', ['weapon.dmg-i']],
    ['weapon.def-ii', 'DEF II', 'adept', '+1 Mastery Defense', 'defense', ['weapon.def-i']],
    ['weapon.prc-ii', 'PRC II', 'adept', '+1 pp Precision', 'precision', ['weapon.prc-i']],
    ['weapon.blk', 'BLK', 'expert', '+1 pp Block Chance', 'blockChance', ['weapon.def-ii']],
    ['weapon.max-rng-i', 'MAX RNG I', 'expert', '+1 pp MAX RNG', 'maxRng', ['weapon.prc-ii']],
    ['weapon.min-rng', 'MIN RNG', 'master', '+1 pp MIN RNG', 'minRng', ['weapon.max-rng-i']],
    ['weapon.max-rng-ii', 'MAX RNG II', 'master', '+1 pp MAX RNG', 'maxRng', ['weapon.max-rng-i']],
  ],
  rhaya: [
    ['weapon.dmg-i', 'DMG I', 'initiate', '+1 Damage', 'attack', []],
    ['weapon.prc-i', 'PRC I', 'initiate', '+1 pp Precision', 'precision', []],
    ['weapon.max-rng-i', 'MAX RNG I', 'initiate', '+1 pp MAX RNG', 'maxRng', []],
    ['weapon.dmg-ii', 'DMG II', 'adept', '+1 Damage', 'attack', ['weapon.dmg-i']],
    [
      'weapon.min-rng-i',
      'MIN RNG I',
      'adept',
      '+1 pp MIN RNG',
      'minRng',
      ['weapon.prc-i', 'weapon.max-rng-i'],
    ],
    ['weapon.init', 'INIT', 'adept', '+1 Initiative', 'initiative', ['weapon.prc-i']],
    ['weapon.dmg-iii', 'DMG III', 'expert', '+1 Damage', 'attack', ['weapon.dmg-ii']],
    ['weapon.prc-ii', 'PRC II', 'expert', '+1 pp Precision', 'precision', ['weapon.min-rng-i']],
    ['weapon.min-rng-ii', 'MIN RNG II', 'master', '+1 pp MIN RNG', 'minRng', ['weapon.prc-ii']],
    ['weapon.max-rng-ii', 'MAX RNG II', 'master', '+1 pp MAX RNG', 'maxRng', ['weapon.prc-ii']],
  ],
  quinn: [
    ['weapon.dmg-i', 'DMG I', 'initiate', '+1 Damage', 'attack', []],
    ['weapon.prc-i', 'PRC I', 'initiate', '+1 pp Precision', 'precision', []],
    ['weapon.min-rng-i', 'MIN RNG I', 'initiate', '+1 pp MIN RNG', 'minRng', []],
    ['weapon.dmg-ii', 'DMG II', 'adept', '+1 Damage', 'attack', ['weapon.dmg-i']],
    ['weapon.min-rng-ii', 'MIN RNG II', 'adept', '+1 pp MIN RNG', 'minRng', ['weapon.min-rng-i']],
    ['weapon.init', 'INIT', 'adept', '+1 Initiative', 'initiative', ['weapon.prc-i']],
    ['weapon.dmg-iii', 'DMG III', 'expert', '+1 Damage', 'attack', ['weapon.dmg-ii']],
    [
      'weapon.min-rng-iii',
      'MIN RNG III',
      'expert',
      '+1 pp MIN RNG',
      'minRng',
      ['weapon.min-rng-ii'],
    ],
    ['weapon.prc-ii', 'PRC II', 'master', '+1 pp Precision', 'precision', ['weapon.min-rng-iii']],
    ['weapon.max-rng-i', 'MAX RNG I', 'master', '+1 pp MAX RNG', 'maxRng', ['weapon.min-rng-iii']],
  ],
};

const weaponBehaviors: Record<
  CharacterId,
  readonly [string, MasteryRank, string, readonly string[], string, string?][]
> = {
  korvin: [
    [
      MASTERY_IDS.committedImpact,
      'expert',
      'Committed Impact',
      ['weapon.dmg-ii', 'weapon.prc-ii'],
      'Clean rolls below 100% become 100%.',
    ],
    [
      MASTERY_IDS.titansArc,
      'master',
      "Titan's Arc",
      [MASTERY_IDS.committedImpact],
      '+5 Damage, +15 pp MAX RNG, -10 pp Precision.',
      MASTERY_IDS.shieldedAdvance,
    ],
    [
      MASTERY_IDS.shieldedAdvance,
      'master',
      'Shielded Advance',
      [MASTERY_IDS.committedImpact],
      '+5 Damage, +10 pp MIN RNG, +10 pp Precision, -15 pp MAX RNG.',
      MASTERY_IDS.titansArc,
    ],
    [
      MASTERY_IDS.immovableGuard,
      'grandmaster',
      'Immovable Guard',
      [MASTERY_IDS.titansArc, MASTERY_IDS.shieldedAdvance],
      '+15 pp Block Chance and Guarded after blocks.',
    ],
  ],
  rhaya: [
    [
      MASTERY_IDS.twinMeasure,
      'expert',
      'Twin Measure',
      ['weapon.min-rng-i', 'weapon.init'],
      'Clean hits roll range twice and use the higher value.',
    ],
    [
      MASTERY_IDS.razorsEdge,
      'master',
      "Razor's Edge",
      [MASTERY_IDS.twinMeasure],
      '+3 Damage, -10 pp MIN RNG, +15 pp MAX RNG, -5 pp Precision.',
      MASTERY_IDS.bladePoise,
    ],
    [
      MASTERY_IDS.bladePoise,
      'master',
      'Blade Poise',
      [MASTERY_IDS.twinMeasure],
      '+3 Damage, +10 pp MIN RNG, -5 pp MAX RNG, +5 pp Precision.',
      MASTERY_IDS.razorsEdge,
    ],
    [
      MASTERY_IDS.secondWind,
      'grandmaster',
      'Second Wind',
      [MASTERY_IDS.razorsEdge, MASTERY_IDS.bladePoise],
      'Clean hits add the lower Twin Measure roll as a 25% separate hit.',
    ],
  ],
  quinn: [
    [
      MASTERY_IDS.zeroingIn,
      'expert',
      'Zeroing In',
      ['weapon.min-rng-ii', 'weapon.init'],
      'Consecutive regular attacks gain up to three +5 pp range stacks.',
    ],
    [
      MASTERY_IDS.overdraw,
      'master',
      'Overdraw',
      [MASTERY_IDS.zeroingIn],
      '+3 Damage, +20 pp MAX RNG, -15 pp Precision.',
      MASTERY_IDS.steadyDraw,
    ],
    [
      MASTERY_IDS.steadyDraw,
      'master',
      'Steady Draw',
      [MASTERY_IDS.zeroingIn],
      '+3 Damage, +5 pp MIN RNG, +5 pp MAX RNG.',
      MASTERY_IDS.overdraw,
    ],
    [
      MASTERY_IDS.patientHunter,
      'grandmaster',
      'Patient Hunter',
      [MASTERY_IDS.overdraw, MASTERY_IDS.steadyDraw],
      'Zeroing In reaches five stacks; stacks 4-5 use MAX RNG.',
    ],
  ],
};

export function nodesFor(characterId: CharacterId): readonly MasteryNode[] {
  const weaponNodes = weaponLayout[characterId].map(
    ([id, label, rank, effect, target, prerequisites]) =>
      stat(id, rank, label, label, prerequisites, target, 1, effect),
  );
  return [
    ...shared,
    ...weaponNodes,
    ...weaponBehaviors[characterId].map(([id, rank, label, prerequisites, effect, exclusiveWith]) =>
      behavior(id, rank, label, prerequisites, effect, exclusiveWith ? { exclusiveWith } : {}),
    ),
  ];
}

export function nodeById(characterId: CharacterId, nodeId: string): MasteryNode | undefined {
  return nodesFor(characterId).find((node) => node.id === nodeId);
}

export function investedPoints(
  ranks: Readonly<Record<string, number>>,
  discipline?: DisciplineId,
): number {
  return Object.entries(ranks).reduce(
    (total, [id, rank]) => total + (!discipline || id.startsWith(`${discipline}.`) ? rank : 0),
    0,
  );
}

/** Maximum legal spend: each mutually exclusive Master pair contributes one rank. */
export function maximumInvestableCapacity(characterId: CharacterId): number {
  return nodesFor(characterId).reduce((total, node) => total + node.maxRank, 0) - 5;
}

export function purchaseFailure(
  characterId: CharacterId,
  level: number,
  ranks: Readonly<Record<string, number>>,
  freePoints: number,
  nodeId: string,
): string | null {
  const node = nodeById(characterId, nodeId);
  if (!node) return 'Unknown mastery node.';
  if (freePoints < 1) return 'No Mastery Points available.';
  if (level < minimumLevel(node)) return `Requires level ${minimumLevel(node)}.`;
  if ((ranks[node.id] ?? 0) >= node.maxRank) return 'Node is already at maximum rank.';
  if (node.prerequisites.length > 0 && !node.prerequisites.some((id) => (ranks[id] ?? 0) > 0))
    return 'A connected prerequisite is required.';
  if (node.exclusiveWith && (ranks[node.exclusiveWith] ?? 0) > 0)
    return 'The alternative Master choice is active.';
  if (
    node.sharedCapstone &&
    Object.entries(ranks).some(
      ([id, rank]) =>
        rank > 0 &&
        id !== node.id &&
        nodesFor(characterId).some((other) => other.id === id && other.sharedCapstone),
    )
  )
    return 'Another shared Discipline Capstone is active.';
  return null;
}

export function respecCost(refundedPoints: number): number {
  // Explicit balancing placeholders; replace only after OPEN_ISSUES decision.
  return refundedPoints === 0 ? 0 : 100 + 25 * refundedPoints;
}
