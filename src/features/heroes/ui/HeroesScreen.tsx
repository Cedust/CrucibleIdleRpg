import { Heart, RotateCcw, Shield, Sword, type LucideIcon } from 'lucide-react';
import type {
  AttributePoints,
  CharacterId,
  CharacterProgressionState,
  CharacterStats,
} from '@/game/types';
import { useNavigationStore } from '@/app/navigationStore';
import { CHARACTERS } from '@/game/characters/characters';
import { effectiveStatsFromSave } from '@/features/combat/engine/characterStats';
import { useSaveStore } from '@/features/save/saveStore';
import { xpRequiredForNextLevel } from '@/game/rewards/xpRewards';
import { Button } from '@/shared/ui/controls/Button';
import { OrnateTab, OrnateTabs } from '@/shared/ui/controls/OrnateTabs';
import { ROLE_ICON } from '@/shared/ui/icons/roleIcons';
import { ProgressBar } from '@/shared/ui/feedback/ProgressBar';
import { Panel } from '@/shared/ui/layout/Panel';
import { ScreenHeader } from '@/shared/ui/layout/ScreenHeader';
import { ScreenLayout } from '@/shared/ui/layout/ScreenLayout';
import { cn } from '@/shared/ui/utils/cn';
import { useRovingFocus } from '@/shared/ui/utils/useRovingFocus';
import { formatNumber } from '@/shared/utils/formatNumber';
import { HERO_AREAS, useHeroesStore, type HeroesArea } from '../heroesStore';

interface StatRow {
  label: string;
  value: number;
  format?: 'number' | 'percent';
}

interface StatCategory {
  label: string;
  stats: readonly StatRow[];
}

interface AttributeAxis {
  attribute: keyof AttributePoints;
  attributeLabel: string;
  derived: keyof CharacterStats['derived'];
  derivedLabel: string;
  icon: LucideIcon;
}

const ATTRIBUTE_AXES = [
  {
    attribute: 'ferocity',
    attributeLabel: 'Ferocity',
    derived: 'attack',
    derivedLabel: 'Attack',
    icon: Sword,
  },
  {
    attribute: 'resilience',
    attributeLabel: 'Resilience',
    derived: 'defense',
    derivedLabel: 'Defense',
    icon: Shield,
  },
  {
    attribute: 'vigor',
    attributeLabel: 'Vigor',
    derived: 'health',
    derivedLabel: 'Health',
    icon: Heart,
  },
] as const satisfies readonly AttributeAxis[];

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function formatStatValue({ value, format = 'number' }: StatRow): string {
  return format === 'percent'
    ? `${numberFormatter.format(value * 100)}%`
    : numberFormatter.format(value);
}

function categoriesFor(
  stats: CharacterStats,
): readonly [StatCategory, StatCategory, StatCategory, StatCategory, StatCategory] {
  return [
    {
      label: 'Core',
      stats: [
        { label: 'Might', value: stats.core.might },
        { label: 'Toughness', value: stats.core.toughness },
        { label: 'Vitality', value: stats.core.vitality },
      ],
    },
    {
      label: 'Derived',
      stats: [
        { label: 'Attack', value: stats.derived.attack },
        { label: 'Defense', value: stats.derived.defense },
        { label: 'Health', value: stats.derived.health },
      ],
    },
    {
      label: 'Offensive',
      stats: [
        { label: 'Crit Chance', value: stats.offensive.critChance, format: 'percent' },
        { label: 'Crit Damage', value: stats.offensive.critDamage, format: 'percent' },
        { label: 'Multi Hit Chance', value: stats.offensive.multiHitChance, format: 'percent' },
        { label: 'Multi Hit Damage', value: stats.offensive.multiHitDamage, format: 'percent' },
        { label: 'Splash Chance', value: stats.offensive.splashChance, format: 'percent' },
        { label: 'Splash Damage', value: stats.offensive.splashDamage, format: 'percent' },
        { label: 'Counter Chance', value: stats.offensive.counterChance, format: 'percent' },
        { label: 'Counter Damage', value: stats.offensive.counterDamage, format: 'percent' },
      ],
    },
    {
      label: 'Defensive',
      stats: [
        { label: 'Barrier', value: stats.defensive.barrier },
        { label: 'Block Chance', value: stats.defensive.blockChance, format: 'percent' },
        { label: 'Evasion', value: stats.defensive.evasion, format: 'percent' },
        { label: 'Regeneration', value: stats.defensive.regeneration },
      ],
    },
    {
      label: 'Utility',
      stats: [
        { label: 'Initiative', value: stats.utility.initiative },
        { label: 'Multi Hit Chain', value: stats.utility.multiHitChain },
        {
          label: 'Multi Hit Chain Factor',
          value: stats.utility.multiHitChainFactor,
          format: 'percent',
        },
        { label: 'Splash Radius', value: stats.utility.splashRadius },
      ],
    },
  ];
}

function HeroesTabs({
  activeArea,
  onSelect,
}: {
  activeArea: HeroesArea;
  onSelect: (area: HeroesArea) => void;
}) {
  const rovingProps = useRovingFocus({
    items: HERO_AREAS,
    selected: activeArea,
    onSelect,
    itemDomId: (area) => `heroes-tab-${area}`,
  });

  return (
    <OrnateTabs label="Heroes sections" className="grid-cols-2">
      {HERO_AREAS.map((area) => (
        <OrnateTab
          key={area}
          id={`heroes-tab-${area}`}
          selected={area === activeArea}
          controls={`heroes-panel-${area}`}
          onClick={() => onSelect(area)}
          {...rovingProps(area)}
        >
          {area === 'stats' ? 'Stats' : 'Loadout'}
        </OrnateTab>
      ))}
    </OrnateTabs>
  );
}

function StatCategoryPanel({
  category,
  variant = 'ornate',
  layout = 'rows',
}: {
  category: StatCategory;
  variant?: 'ornate' | 'thin';
  layout?: 'rows' | 'columns';
}) {
  const isThin = variant === 'thin';
  const usesColumns = layout === 'columns';

  return (
    <Panel
      as="section"
      variant={variant}
      padding="none"
      className={cn('min-w-0', isThin ? 'px-4 py-3' : 'px-2 py-1')}
    >
      <h3 className="font-display text-display-sm text-accent-strong">{category.label}</h3>
      <dl
        className={cn(
          usesColumns ? 'grid grid-cols-3 divide-x divide-border/50' : 'divide-y divide-border/50',
          isThin ? 'mt-3' : 'mt-1.5',
        )}
      >
        {category.stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'flex gap-4',
              usesColumns
                ? 'items-baseline justify-between px-4 py-2'
                : 'items-baseline justify-between',
              !usesColumns && (isThin ? 'py-2' : 'py-1.5'),
            )}
          >
            <dt className="text-sm text-text-muted">{stat.label}</dt>
            <dd className="font-medium tabular-nums text-text">{formatStatValue(stat)}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function HeroIdentityPanel({ characterId }: { characterId: CharacterId }) {
  const character = CHARACTERS[characterId];
  const RoleIcon = ROLE_ICON[character.role];

  return (
    <aside className="min-w-0" data-testid="heroes-identity">
      <div
        className="relative mx-auto aspect-2/3 w-full max-w-52 overflow-visible"
        data-testid="heroes-portrait-frame"
      >
        <span className="absolute inset-x-[15.5%] top-[17%] bottom-[20.5%] overflow-hidden rounded-t-[999px] bg-surface-raised">
          <img
            src={`/assets/portraits/${characterId}.png`}
            alt={`${character.name} portrait`}
            data-character-part="portrait"
            className="size-full object-cover object-center"
          />
          <span className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background/90 to-transparent" />
        </span>
        <img
          src="/assets/frames/character-portrait-frame.png"
          alt=""
          aria-hidden="true"
          data-character-part="frame"
          className="pointer-events-none absolute inset-0 z-10 size-full object-fill drop-shadow-glow-accent"
        />
        <RoleIcon
          role="img"
          aria-label={`${character.role} role`}
          data-character-part="role-icon"
          className="pointer-events-none absolute left-1/2 top-[5.5%] z-20 size-9 -translate-x-1/2 text-accent-strong drop-shadow-text-contrast"
        />
        <span
          data-character-part="name"
          className="pointer-events-none absolute inset-x-[17%] top-[78.3%] z-20 flex h-[10%] items-center justify-center truncate px-1 font-display text-display font-semibold leading-none text-accent-strong"
        >
          {character.name}
        </span>
      </div>
    </aside>
  );
}

function CharacterProgressPanel({
  characterId,
  progression,
}: {
  characterId: CharacterId;
  progression: CharacterProgressionState;
}) {
  const character = CHARACTERS[characterId];
  const { level, xp } = progression;
  const xpRequired = xpRequiredForNextLevel(level);

  return (
    <Panel
      as="section"
      variant="thin"
      padding="none"
      className="flex min-h-16 min-w-0 items-center px-4 py-2"
      data-testid="heroes-progression"
    >
      <div className="grid w-full min-w-0 items-center gap-4 @min-[42rem]:grid-cols-[auto_minmax(0,1fr)]">
        <p className="whitespace-nowrap text-center font-display text-display text-accent-strong">
          Level {level}
        </p>
        <ProgressBar
          label="XP"
          ariaLabel={`${character.name} experience`}
          value={xp}
          max={xpRequired}
          valueText={
            xpRequired === 0 ? 'MAX' : `${formatNumber(xp)} / ${formatNumber(xpRequired)} XP`
          }
          endLabel={xpRequired === 0 ? 'MAX' : `Level ${level + 1}`}
          tone="xp"
          size="sm"
          labelSize="sm"
        />
      </div>
    </Panel>
  );
}

function CharacterAttributesPanel({
  progression,
  derived,
  onSpendAttributePoint,
}: {
  progression: CharacterProgressionState;
  derived: CharacterStats['derived'];
  onSpendAttributePoint: (attribute: keyof AttributePoints) => void;
}) {
  const { attributePoints, freeAttributePoints } = progression;

  return (
    <Panel
      as="section"
      variant="thin"
      padding="none"
      className="h-full w-full px-4 py-2"
      data-testid="heroes-attributes"
    >
      <h3 className="text-center font-display text-display-sm text-accent-strong">Attributes</h3>
      <dl className="mt-1.5 divide-y divide-border/50 border-y border-border/50">
        {ATTRIBUTE_AXES.map((axis) => {
          const AxisIcon = axis.icon;

          return (
            <div
              key={axis.attribute}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-1.5"
              data-attribute-axis={axis.attribute}
            >
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-md bg-surface-raised/60 text-accent-strong"
              >
                <AxisIcon
                  aria-hidden="true"
                  className="size-4"
                  data-attribute-icon={axis.attribute}
                />
              </span>
              <div className="min-w-0">
                <div
                  className="flex items-baseline justify-between gap-3"
                  data-derived-stat={axis.derived}
                >
                  <dt className="text-base font-medium text-text">{axis.derivedLabel}</dt>
                  <dd className="font-display text-display-sm tabular-nums text-accent-strong">
                    {numberFormatter.format(derived[axis.derived])}
                  </dd>
                </div>
                <div
                  className="mt-1.5 flex items-center justify-between gap-3 border-t border-border/50 pt-1.5"
                  data-attribute-control={axis.attribute}
                >
                  <dt className="text-sm text-text-muted">{axis.attributeLabel}</dt>
                  <dd className="flex items-center gap-2">
                    <span className="font-medium tabular-nums text-text">
                      {attributePoints[axis.attribute]}
                    </span>
                    <Button
                      variant="icon"
                      className="relative z-30"
                      aria-label={`Increase ${axis.attributeLabel}`}
                      disabled={freeAttributePoints <= 0}
                      onClick={() => onSpendAttributePoint(axis.attribute)}
                    >
                      <span aria-hidden="true">+</span>
                    </Button>
                  </dd>
                </div>
              </div>
            </div>
          );
        })}
      </dl>
      <div className="mt-1.5 flex min-h-8 items-center justify-between gap-3">
        {freeAttributePoints > 0 ? (
          <p className="font-display text-sm text-accent-strong">
            {freeAttributePoints} {freeAttributePoints === 1 ? 'Point' : 'Points'} Available
          </p>
        ) : null}
        <Button
          variant="ghost"
          className="ml-auto flex shrink-0 items-center justify-center gap-2 text-sm"
          aria-label="Respec attributes"
          disabled
          title="Attribute respec Gold cost is not configured yet."
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          RESPEC
        </Button>
      </div>
    </Panel>
  );
}

function StatsPanel({
  characterId,
  progression,
  stats,
  onSpendAttributePoint,
}: {
  characterId: CharacterId;
  progression: CharacterProgressionState;
  stats: CharacterStats;
  onSpendAttributePoint: (attribute: keyof AttributePoints) => void;
}) {
  const [core, , offensive, defensive, utility] = categoriesFor(stats);

  return (
    <div
      id="heroes-panel-stats"
      role="tabpanel"
      aria-labelledby="heroes-tab-stats"
      className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
    >
      <div className="grid min-w-0 gap-5 @min-[60rem]:grid-cols-[minmax(15rem,0.8fr)_minmax(0,2fr)]">
        <div className="flex h-full min-w-0 flex-col gap-2" data-testid="heroes-identity-column">
          <HeroIdentityPanel characterId={characterId} />
          <div className="mx-auto flex w-full max-w-xs flex-1">
            <CharacterAttributesPanel
              progression={progression}
              derived={stats.derived}
              onSpendAttributePoint={onSpendAttributePoint}
            />
          </div>
        </div>
        <div className="flex h-full min-w-0 flex-col gap-6" data-testid="heroes-overview-column">
          <CharacterProgressPanel characterId={characterId} progression={progression} />
          <StatCategoryPanel category={core} variant="thin" layout="columns" />
          <div
            className="grid min-h-0 min-w-0 flex-1 gap-6 @min-[42rem]:grid-cols-2 @min-[68rem]:grid-cols-3"
            data-testid="heroes-specialized-stats"
          >
            <StatCategoryPanel category={offensive} variant="thin" />
            <StatCategoryPanel category={defensive} variant="thin" />
            <StatCategoryPanel category={utility} variant="thin" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadoutPanel() {
  return (
    <div
      id="heroes-panel-loadout"
      role="tabpanel"
      aria-labelledby="heroes-tab-loadout"
      className="min-h-0 flex-1 overflow-y-auto py-4"
    >
      <Panel as="section" variant="ornate">
        <h3 className="font-display text-display-sm text-accent-strong">Loadout</h3>
        <p className="mt-2 text-text-muted">
          Equipment details will be available here once the Armory can be inspected.
        </p>
      </Panel>
    </div>
  );
}

/** Character-scoped hub; the sole character selection remains in the shared sidebar. */
export function HeroesScreen() {
  const save = useSaveStore((state) => state.data);
  const characterId = useNavigationStore((state) => state.activeCharacterId);
  const activeArea = useHeroesStore((state) => state.activeArea);
  const setActiveArea = useHeroesStore((state) => state.setActiveArea);
  const spendAttributePoint = useSaveStore((state) => state.spendAttributePoint);

  if (save === null) {
    return (
      <ScreenLayout scroll={false}>
        <p aria-live="polite" className="text-text-muted">
          Loading heroes…
        </p>
      </ScreenLayout>
    );
  }

  const character = CHARACTERS[characterId];
  const stats = effectiveStatsFromSave(save, characterId);

  return (
    <ScreenLayout scroll={false}>
      <section
        aria-label="Heroes"
        className="mx-auto flex min-h-0 w-full max-w-page flex-1 flex-col"
      >
        <ScreenHeader
          title="Heroes"
          intro={`Review ${character.name}'s current combat capabilities and prepare for the depths.`}
          className="mb-4 shrink-0"
        />
        <HeroesTabs activeArea={activeArea} onSelect={setActiveArea} />
        {activeArea === 'stats' ? (
          <StatsPanel
            characterId={characterId}
            progression={save.characters[characterId]}
            stats={stats}
            onSpendAttributePoint={(attribute) => {
              void spendAttributePoint(characterId, attribute);
            }}
          />
        ) : (
          <LoadoutPanel />
        )}
      </section>
    </ScreenLayout>
  );
}
