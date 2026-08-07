import type { CharacterId, CharacterStats } from '@/game/types';

export const DISCIPLINES = ['finesse', 'tempest', 'dominance', 'valor', 'weapon'] as const;
export type DisciplineId = (typeof DISCIPLINES)[number];
export type MasteryRank = 'initiate' | 'adept' | 'expert' | 'master' | 'grandmaster';

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

const stat = (
  discipline: DisciplineId,
  rank: MasteryRank,
  label: string,
  name: string,
  prerequisites: readonly string[],
  target: NonNullable<MasteryNode['stat']>,
  perRank: number,
  effect: string,
): MasteryNode => ({
  id: `${discipline}.${label.toLowerCase().replaceAll(' ', '-')}`,
  discipline,
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
  discipline: DisciplineId,
  rank: MasteryRank,
  label: string,
  prerequisites: readonly string[],
  effect: string,
  options: Pick<MasteryNode, 'exclusiveWith' | 'sharedCapstone'> = {},
): MasteryNode => ({
  id: `${discipline}.${label.toLowerCase().replaceAll(' ', '-')}`,
  discipline,
  rank,
  label,
  name: label,
  maxRank: 1,
  prerequisites,
  effect,
  ...options,
});

const chain = (
  discipline: DisciplineId,
  label: string,
  effect: string,
  target: MasteryNode['stat'],
  perRank: number,
  count: number,
  ranks: readonly MasteryRank[],
) =>
  Array.from({ length: count }, (_, index) =>
    stat(
      discipline,
      ranks[index] ?? 'master',
      `${label} ${['I', 'II', 'III', 'IV'][index] ?? index + 1}`,
      `${label} ${['I', 'II', 'III', 'IV'][index] ?? index + 1}`,
      index === 0
        ? []
        : [
            `${discipline}.${label.toLowerCase().replaceAll(' ', '-')}-${['i', 'ii', 'iii', 'iv'][index - 1] ?? index}`,
          ],
      target!,
      perRank,
      effect,
    ),
  );

const shared: MasteryNode[] = [
  ...chain('finesse', 'CHC', '+3 pp Crit Hit Chance', 'critChance', 0.03, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]),
  ...chain('finesse', 'CHD', '+10 pp Crit Hit Damage', 'critDamage', 0.1, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]),
  behavior(
    'finesse',
    'expert',
    'Executioner',
    ['finesse.chc-ii', 'finesse.chd-ii'],
    'Critical clean base hits below 25% health gain +50 pp Crit Damage.',
  ),
  behavior(
    'finesse',
    'master',
    'Perfect Exploit',
    ['finesse.executioner'],
    'Clean crits use MAX RNG.',
    { exclusiveWith: 'finesse.surestrike' },
  ),
  behavior(
    'finesse',
    'master',
    'Surestrike',
    ['finesse.executioner'],
    'Clean base hits are guaranteed critical.',
    { exclusiveWith: 'finesse.perfect-exploit' },
  ),
  behavior(
    'finesse',
    'grandmaster',
    'Overcritical',
    ['finesse.perfect-exploit', 'finesse.surestrike'],
    'Crits roll once more for one extra Crit bonus.',
    { sharedCapstone: true },
  ),
  ...chain('tempest', 'MHC', '+5 pp Multi Hit Chance', 'multiHitChance', 0.05, 3, [
    'initiate',
    'adept',
    'expert',
  ]),
  ...chain('tempest', 'MHD', '+3 pp Multi Hit Damage', 'multiHitDamage', 0.03, 2, [
    'initiate',
    'expert',
  ]),
  ...chain('tempest', 'Chain', '+1 Multi Hit Chain', 'multiHitChain', 1, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]).map((node) => ({ ...node, maxRank: 1 as const })),
  ...chain(
    'tempest',
    'Chain Factor',
    '+5 pp Multi Hit Chain Factor',
    'multiHitChainFactor',
    0.05,
    2,
    ['adept', 'master'],
  ),
  behavior(
    'tempest',
    'expert',
    'Converging Strikes',
    ['tempest.mhc-ii', 'tempest.chain-factor-i'],
    'Chain hits may crit.',
  ),
  behavior(
    'tempest',
    'expert',
    'Relentless Pursuit',
    ['tempest.chain-ii'],
    'Chain hits retarget after the primary target dies.',
  ),
  behavior(
    'tempest',
    'master',
    'Echoed Strike',
    ['tempest.converging-strikes'],
    'A clean base hit repeats once for 50% finished damage.',
    { exclusiveWith: 'tempest.storm-surge' },
  ),
  behavior(
    'tempest',
    'master',
    'Storm Surge',
    ['tempest.converging-strikes'],
    'Original-chain crits add up to two chain hits.',
    { exclusiveWith: 'tempest.echoed-strike' },
  ),
  behavior(
    'tempest',
    'grandmaster',
    'Perfect Cadence',
    ['tempest.echoed-strike', 'tempest.storm-surge'],
    'Critical chain hits set the next Chain Factor to 100%.',
    { sharedCapstone: true },
  ),
  ...chain('dominance', 'SHC', '+4 pp Splash Hit Chance', 'splashChance', 0.04, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]),
  ...chain('dominance', 'SHD', '+3 pp Splash Hit Damage', 'splashDamage', 0.03, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]),
  ...chain('dominance', 'Radius', '+1 Splash Radius', 'splashRadius', 1, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]).map((node) => ({ ...node, maxRank: 1 as const })),
  behavior(
    'dominance',
    'expert',
    'Critical Mass',
    ['dominance.shc-ii', 'dominance.shd-ii'],
    'Splash hits may crit.',
  ),
  behavior(
    'dominance',
    'master',
    'Epicenter',
    ['dominance.critical-mass'],
    'Successful splash adds a 50% hit on the primary target.',
    { exclusiveWith: 'dominance.focused-blast' },
  ),
  behavior(
    'dominance',
    'master',
    'Focused Blast',
    ['dominance.critical-mass'],
    'Unused radius adds up to 100% splash damage on the primary target.',
    { exclusiveWith: 'dominance.epicenter' },
  ),
  behavior(
    'dominance',
    'grandmaster',
    'Aftershock',
    ['dominance.epicenter', 'dominance.focused-blast'],
    'Hit secondary targets receive a 50% second wave.',
    { sharedCapstone: true },
  ),
  ...chain('valor', 'CTC', '+4 pp Counter Chance', 'counterChance', 0.04, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]),
  ...chain('valor', 'CTD', '+5 pp Counter Damage', 'counterDamage', 0.05, 4, [
    'initiate',
    'adept',
    'expert',
    'master',
  ]),
  behavior(
    'valor',
    'expert',
    'Vengeful Edge',
    ['valor.ctc-ii', 'valor.ctd-ii'],
    'Counters may crit.',
  ),
  behavior(
    'valor',
    'master',
    'Perfect Riposte',
    ['valor.vengeful-edge'],
    'Evasion may trigger a normal counter.',
    { exclusiveWith: 'valor.guarded-reprisal' },
  ),
  behavior(
    'valor',
    'master',
    'Guarded Reprisal',
    ['valor.vengeful-edge'],
    'Successful blocks guarantee a counter.',
    { exclusiveWith: 'valor.perfect-riposte' },
  ),
  behavior(
    'valor',
    'grandmaster',
    'Escalating Retaliation',
    ['valor.perfect-riposte', 'valor.guarded-reprisal'],
    'Counters gain up to +75 pp damage per round.',
    { sharedCapstone: true },
  ),
];

const weaponLayout: Record<
  CharacterId,
  readonly [string, MasteryRank, string, MasteryNode['stat'], readonly string[]][]
> = {
  korvin: [
    ['DMG I', 'initiate', '+1 Damage', 'attack', []],
    ['DEF I', 'initiate', '+1 Mastery Defense', 'defense', []],
    ['PRC I', 'initiate', '+1 pp Precision', 'precision', []],
    ['DMG II', 'adept', '+1 Damage', 'attack', ['weapon.dmg-i']],
    ['DEF II', 'adept', '+1 Mastery Defense', 'defense', ['weapon.def-i']],
    ['PRC II', 'adept', '+1 pp Precision', 'precision', ['weapon.prc-i']],
    ['BLK', 'expert', '+1 pp Block Chance', 'blockChance', ['weapon.def-ii']],
    ['MAX RNG I', 'expert', '+1 pp MAX RNG', 'maxRng', ['weapon.prc-ii']],
    ['MIN RNG', 'master', '+1 pp MIN RNG', 'minRng', ['weapon.max-rng-i']],
    ['MAX RNG II', 'master', '+1 pp MAX RNG', 'maxRng', ['weapon.max-rng-i']],
  ],
  rhaya: [
    ['DMG I', 'initiate', '+1 Damage', 'attack', []],
    ['PRC I', 'initiate', '+1 pp Precision', 'precision', []],
    ['MAX RNG I', 'initiate', '+1 pp MAX RNG', 'maxRng', []],
    ['DMG II', 'adept', '+1 Damage', 'attack', ['weapon.dmg-i']],
    ['MIN RNG I', 'adept', '+1 pp MIN RNG', 'minRng', ['weapon.prc-i', 'weapon.max-rng-i']],
    ['INIT', 'adept', '+1 Initiative', 'initiative', ['weapon.prc-i']],
    ['DMG III', 'expert', '+1 Damage', 'attack', ['weapon.dmg-ii']],
    ['PRC II', 'expert', '+1 pp Precision', 'precision', ['weapon.min-rng-i']],
    ['MIN RNG II', 'master', '+1 pp MIN RNG', 'minRng', ['weapon.prc-ii']],
    ['MAX RNG II', 'master', '+1 pp MAX RNG', 'maxRng', ['weapon.prc-ii']],
  ],
  quinn: [
    ['DMG I', 'initiate', '+1 Damage', 'attack', []],
    ['PRC I', 'initiate', '+1 pp Precision', 'precision', []],
    ['MIN RNG I', 'initiate', '+1 pp MIN RNG', 'minRng', []],
    ['DMG II', 'adept', '+1 Damage', 'attack', ['weapon.dmg-i']],
    ['MIN RNG II', 'adept', '+1 pp MIN RNG', 'minRng', ['weapon.min-rng-i']],
    ['INIT', 'adept', '+1 Initiative', 'initiative', ['weapon.prc-i']],
    ['DMG III', 'expert', '+1 Damage', 'attack', ['weapon.dmg-ii']],
    ['MIN RNG III', 'expert', '+1 pp MIN RNG', 'minRng', ['weapon.min-rng-ii']],
    ['PRC II', 'master', '+1 pp Precision', 'precision', ['weapon.min-rng-iii']],
    ['MAX RNG I', 'master', '+1 pp MAX RNG', 'maxRng', ['weapon.min-rng-iii']],
  ],
};

const weaponBehaviors: Record<
  CharacterId,
  readonly [MasteryRank, string, readonly string[], string, string?][]
> = {
  korvin: [
    [
      'expert',
      'Committed Impact',
      ['weapon.dmg-ii', 'weapon.prc-ii'],
      'Clean rolls below 100% become 100%.',
    ],
    [
      'master',
      "Titan's Arc",
      ['weapon.committed-impact'],
      '+5 Damage, +15 pp MAX RNG, -10 pp Precision.',
      'Shielded Advance',
    ],
    [
      'master',
      'Shielded Advance',
      ['weapon.committed-impact'],
      '+5 Damage, +10 pp MIN RNG, +10 pp Precision, -15 pp MAX RNG.',
      "Titan's Arc",
    ],
    [
      'grandmaster',
      'Immovable Guard',
      ["weapon.titan's-arc", 'weapon.shielded-advance'],
      '+15 pp Block Chance and Guarded after blocks.',
    ],
  ],
  rhaya: [
    [
      'expert',
      'Twin Measure',
      ['weapon.min-rng-i', 'weapon.init'],
      'Clean hits roll range twice and use the higher value.',
    ],
    [
      'master',
      "Razor's Edge",
      ['weapon.twin-measure'],
      '+3 Damage, -10 pp MIN RNG, +15 pp MAX RNG, -5 pp Precision.',
      'Blade Poise',
    ],
    [
      'master',
      'Blade Poise',
      ['weapon.twin-measure'],
      '+3 Damage, +10 pp MIN RNG, -5 pp MAX RNG, +5 pp Precision.',
      "Razor's Edge",
    ],
    [
      'grandmaster',
      'Second Wind',
      ["weapon.razor's-edge", 'weapon.blade-poise'],
      'Clean hits add the lower Twin Measure roll as a 25% separate hit.',
    ],
  ],
  quinn: [
    [
      'expert',
      'Zeroing In',
      ['weapon.min-rng-ii', 'weapon.init'],
      'Consecutive regular attacks gain up to three +5 pp range stacks.',
    ],
    [
      'master',
      'Overdraw',
      ['weapon.zeroing-in'],
      '+3 Damage, +20 pp MAX RNG, -15 pp Precision.',
      'Steady Draw',
    ],
    [
      'master',
      'Steady Draw',
      ['weapon.zeroing-in'],
      '+3 Damage, +5 pp MIN RNG, +5 pp MAX RNG.',
      'Overdraw',
    ],
    [
      'grandmaster',
      'Patient Hunter',
      ['weapon.overdraw', 'weapon.steady-draw'],
      'Zeroing In reaches five stacks; stacks 4-5 use MAX RNG.',
    ],
  ],
};

export function nodesFor(characterId: CharacterId): readonly MasteryNode[] {
  const weaponNodes = weaponLayout[characterId].map(
    ([label, rank, effect, target, prerequisites]) =>
      stat('weapon', rank, label, label, prerequisites, target ?? 'attack', 1, effect),
  );
  return [
    ...shared,
    ...weaponNodes,
    ...weaponBehaviors[characterId].map(([rank, label, prerequisites, effect, other]) =>
      behavior(
        'weapon',
        rank,
        label,
        prerequisites,
        effect,
        other ? { exclusiveWith: `weapon.${other.toLowerCase().replaceAll(' ', '-')}` } : {},
      ),
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
