import { useState, type ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';
import { effectiveWeaponValues } from '@/features/combat/engine/masteryCombat';
import { disciplineLabel } from '@/features/weaponMastery/masteryPresentation';
import { innateValue } from '@/game/items/armor';
import { RARITY_LAYER } from '@/game/items/itemLayers';
import { imprintEffectText } from '@/game/sigils/imprints';
import { sigilById } from '@/game/sigils/sigils';
import type { SigilCodex } from '@/game/sigils/types';
import {
  AMBER_AFFIXES,
  RUBY_AFFIXES,
  type ArmorInnateStat,
  type ArmorItem,
  type ArmorItemType,
  type ArmorLoadout,
  type ArmorSlot,
  type CharacterId,
  type CharacterStats,
  type GemAffix,
  type Rarity,
  type SocketedGem,
} from '@/game/types';
import { Icon } from '@/shared/ui/icons/Icon';
import { Panel } from '@/shared/ui/layout/Panel';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { cn } from '@/shared/ui/utils/cn';
import {
  focusRing,
  hoverBorder,
  selectedRing,
  stateAttrs,
  transitionState,
} from '@/shared/ui/utils/state';

/** Anatomische Anzeige-Reihenfolge der Armor-Säule; unabhängig von `ARMOR_SLOTS`. */
const ARMOR_COLUMN = ['head', 'chest', 'legs', 'feet'] as const satisfies readonly ArmorSlot[];

const ARMOR_SLOT_LABEL: Record<ArmorSlot, string> = {
  head: 'Head',
  chest: 'Chest',
  legs: 'Legs',
  feet: 'Feet',
};

const ARMOR_BASE_LABEL: Record<ArmorItemType, string> = {
  helmet: 'Helmet',
  armor: 'Chest Armor',
  legguards: 'Legguards',
  boots: 'Boots',
};

const INNATE_LABEL: Record<ArmorInnateStat, string> = {
  toughness: 'Toughness',
  vitality: 'Vitality',
  initiative: 'Initiative',
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  magic: 'Magic',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const GEM_COLOR_LABEL: Record<SocketedGem['color'], string> = {
  amber: 'Amber',
  ruby: 'Ruby',
  sapphire: 'Sapphire',
  emerald: 'Emerald',
};

const GEM_AFFIX_LABEL: Record<GemAffix, string> = {
  critChance: 'Crit Chance',
  multiHitChance: 'Multi Hit Chance',
  splashChance: 'Splash Chance',
  counterChance: 'Counter Chance',
  critDamage: 'Crit Damage',
  multiHitDamage: 'Multi Hit Damage',
  splashDamage: 'Splash Damage',
  counterDamage: 'Counter Damage',
  barrier: 'Barrier',
  blockChance: 'Block Chance',
  evasion: 'Evasion',
  regeneration: 'Regeneration',
  might: 'Might',
  toughness: 'Toughness',
  vitality: 'Vitality',
};

/** Affixe mit Anteils-Semantik (0..1) erscheinen als Prozentwert, alle übrigen flach. */
const PERCENT_AFFIXES: ReadonlySet<GemAffix> = new Set([
  ...AMBER_AFFIXES,
  ...RUBY_AFFIXES,
  'blockChance',
  'evasion',
]);

// Statische Klassen-Strings, damit Tailwind die mask-Utilities beim Scan findet.
const WEAPON_ICON_CLASS: Record<CharacterId, string> = {
  korvin: 'mask-[url(/assets/icons/mastery/weapon-warhammer.png)]',
  rhaya: 'mask-[url(/assets/icons/mastery/weapon-twin-blades.png)]',
  quinn: 'mask-[url(/assets/icons/mastery/weapon-longbow.png)]',
};

/** Auswählbare Loadout-Einträge; gesperrte Armor-Slots sind bewusst nicht auswählbar. */
type LoadoutSelection = 'weapon' | ArmorSlot;

const valueFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function formatPercent(value: number): string {
  return `${valueFormatter.format(value * 100)}%`;
}

function SlotButton({
  selection,
  selected,
  semantic = 'normal',
  onSelect,
  label,
  className,
  children,
}: {
  selection: LoadoutSelection;
  selected: boolean;
  semantic?: 'normal' | 'locked';
  onSelect: () => void;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      {...stateAttrs({ selected, semantic })}
      data-loadout-slot={selection}
      onClick={onSelect}
      className={cn(
        'group flex w-full min-w-0 cursor-pointer rounded-lg border border-border bg-surface/70 text-left',
        'data-[semantic=locked]:border-state-locked-border',
        focusRing,
        selectedRing,
        hoverBorder,
        transitionState,
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Gesperrter Armor-Slot: nicht auswählbar, keine Detailkarte, zugänglicher Locked-Status. */
function LockedArmorSlot({ slot }: { slot: ArmorSlot }) {
  return (
    <div
      {...stateAttrs({ semantic: 'locked' })}
      data-loadout-slot={slot}
      className={cn(
        'flex min-w-0 items-center gap-3 rounded-lg border border-state-locked-border bg-surface/50 px-3 py-2.5',
        transitionState,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-raised/40 text-text-muted opacity-(--state-deemphasis-medium)"
      >
        <LockKeyhole className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-sm text-text">{ARMOR_SLOT_LABEL[slot]}</span>
        <span className="block text-xs text-text-muted">Locked</span>
      </span>
    </div>
  );
}

function DetailRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-text-muted">{term}</dt>
      <dd className="font-medium tabular-nums text-text">{value}</dd>
    </div>
  );
}

function WeaponDetail({
  characterId,
  stats,
  masteryRanks,
}: {
  characterId: CharacterId;
  stats: CharacterStats;
  masteryRanks: Readonly<Record<string, number>>;
}) {
  const weapon = effectiveWeaponValues(characterId, masteryRanks);
  const damageMin = stats.derived.attack * weapon.damageRange.min;
  const damageMax = stats.derived.attack * weapon.damageRange.max;

  return (
    <>
      <h3 className="font-display text-display-sm text-accent-strong">
        {disciplineLabel('weapon', characterId)}
      </h3>
      <p className="mt-1 text-sm text-text-muted">Signature Weapon</p>
      <dl className="mt-3 divide-y divide-border/50 border-t border-border/50">
        <DetailRow
          term="Damage Range"
          value={`${valueFormatter.format(damageMin)} – ${valueFormatter.format(damageMax)}`}
        />
        <DetailRow term="Precision" value={formatPercent(weapon.precision)} />
      </dl>
    </>
  );
}

/** Anzeige eines gebundenen Gems: gerollter Wert, Affix und Farbe (ITEMS §8). */
function gemLabel(gem: SocketedGem): string {
  const value = PERCENT_AFFIXES.has(gem.affix)
    ? formatPercent(gem.value)
    : valueFormatter.format(gem.value);
  return `+${value} ${GEM_AFFIX_LABEL[gem.affix]} (${GEM_COLOR_LABEL[gem.color]})`;
}

function ArmorDetail({ item, sigils }: { item: ArmorItem; sigils: SigilCodex }) {
  const base = ARMOR_BASE_LABEL[item.itemType];
  const socketCount = item.sockets.length + item.prismaticSockets.length;
  const imprint = item.imprint === undefined ? undefined : sigilById(item.imprint.sigilId);
  const imprintLevel = imprint === undefined ? undefined : sigils[imprint.id];

  return (
    <>
      <h3 className="font-display text-display-sm text-accent-strong">
        {base} +{item.itemLevel}
      </h3>
      <p className="mt-1 text-sm text-text-muted">{ARMOR_SLOT_LABEL[item.slot]} Slot</p>
      <dl className="mt-3 divide-y divide-border/50 border-t border-border/50">
        <DetailRow term="Base Item Type" value={base} />
        <DetailRow term="Rarity" value={RARITY_LABEL[item.rarity]} />
        <DetailRow
          term="Item Level"
          value={`+${item.itemLevel} / +${RARITY_LAYER[item.rarity].itemLevelCap}`}
        />
        <DetailRow term="Innate" value={`+${innateValue(item)} ${INNATE_LABEL[item.innate]}`} />
        {imprint !== undefined && imprintLevel !== undefined ? (
          <>
            <DetailRow term="Imprint" value={`${imprint.name} · Level ${imprintLevel}`} />
            <DetailRow term="Imprint Effect" value={imprintEffectText(imprint, imprintLevel)} />
          </>
        ) : null}
        {socketCount === 0 ? (
          <DetailRow term="Sockets" value="None" />
        ) : (
          <>
            {item.sockets.map((gem, index) => (
              <DetailRow
                // Sockel sind positionsfest; der Index ist die Identität des Sockels.
                key={`socket-${index}`}
                term={`Socket ${index + 1}`}
                value={gem === null ? 'Empty' : gemLabel(gem)}
              />
            ))}
            {item.prismaticSockets.map((_, index) => (
              <DetailRow
                key={`prismatic-${index}`}
                term={`Prismatic Socket ${index + 1}`}
                value="Empty"
              />
            ))}
          </>
        )}
      </dl>
    </>
  );
}

interface LoadoutPanelProps {
  characterId: CharacterId;
  stats: CharacterStats;
  masteryRanks: Readonly<Record<string, number>>;
  armor: ArmorLoadout;
  sigils: SigilCodex;
}

/**
 * Loadout-Bereich von Heroes: Signaturwaffe und vier Armor-Slots. Talismane gehören ausschließlich
 * zu Runescribe und sind bewusst weder Auswahl noch Item-Schicht dieses Screens.
 */
export function LoadoutPanel({
  characterId,
  stats,
  masteryRanks,
  armor,
  sigils,
}: LoadoutPanelProps) {
  const [selection, setSelection] = useState<LoadoutSelection>('weapon');
  const weapon = effectiveWeaponValues(characterId, masteryRanks);
  const selectedItem = selection !== 'weapon' ? armor[selection] : undefined;

  return (
    <div
      id="heroes-panel-loadout"
      role="tabpanel"
      aria-labelledby="heroes-tab-loadout"
      className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
    >
      <div className="grid min-w-0 content-start gap-5 @min-[60rem]:grid-cols-[minmax(15rem,1.2fr)_minmax(13rem,1fr)_minmax(15rem,1.1fr)]">
        <section
          aria-label="Signature Weapon"
          className="min-w-0"
          data-testid="loadout-weapon-column"
        >
          <SectionTitle as="h3">Signature Weapon</SectionTitle>
          <SlotButton
            selection="weapon"
            selected={selection === 'weapon'}
            onSelect={() => setSelection('weapon')}
            label={`Signature Weapon ${disciplineLabel('weapon', characterId)}`}
            className="mt-2 items-center gap-4 px-4 py-4"
          >
            <span
              aria-hidden="true"
              className={cn(
                'inline-block size-11 shrink-0 bg-accent-strong mask-center mask-contain mask-no-repeat',
                WEAPON_ICON_CLASS[characterId],
              )}
            />
            <span className="min-w-0">
              <span className="block font-display text-display-sm text-accent-strong">
                {disciplineLabel('weapon', characterId)}
              </span>
              <span className="mt-1 block text-sm text-text-muted">
                Damage Range{' '}
                <span className="font-medium tabular-nums text-text">
                  {valueFormatter.format(stats.derived.attack * weapon.damageRange.min)} –{' '}
                  {valueFormatter.format(stats.derived.attack * weapon.damageRange.max)}
                </span>
              </span>
              <span className="block text-sm text-text-muted">
                Precision{' '}
                <span className="font-medium tabular-nums text-text">
                  {formatPercent(weapon.precision)}
                </span>
              </span>
            </span>
          </SlotButton>
        </section>
        <section
          aria-label="Armor"
          className="flex min-w-0 flex-col gap-3"
          data-testid="loadout-armor-column"
        >
          <SectionTitle as="h3">Armor</SectionTitle>
          {ARMOR_COLUMN.map((slot) => {
            const item = armor[slot];

            if (item === undefined) {
              return <LockedArmorSlot key={slot} slot={slot} />;
            }

            return (
              <SlotButton
                key={slot}
                selection={slot}
                selected={selection === slot}
                onSelect={() => setSelection(slot)}
                label={`${ARMOR_SLOT_LABEL[slot]}, ${ARMOR_BASE_LABEL[item.itemType]} +${item.itemLevel}`}
                className="items-center gap-3 px-3 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-raised/60 text-accent-strong"
                >
                  <Icon name="crucible-armory" size="sm" className="bg-current" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm text-text">
                    {ARMOR_SLOT_LABEL[slot]}
                  </span>
                  <span className="block truncate text-xs text-text-muted">
                    {ARMOR_BASE_LABEL[item.itemType]} +{item.itemLevel}
                  </span>
                </span>
              </SlotButton>
            );
          })}
        </section>
        <Panel
          as="aside"
          variant="standard"
          padding="md"
          aria-label="Loadout details"
          data-testid="loadout-detail"
          className="min-w-0 self-start"
        >
          {selection === 'weapon' ? (
            <WeaponDetail characterId={characterId} stats={stats} masteryRanks={masteryRanks} />
          ) : selectedItem !== undefined ? (
            <ArmorDetail item={selectedItem} sigils={sigils} />
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
