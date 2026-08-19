import { Coins, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useNavigationStore } from '@/app/navigationStore';
import { useSaveStore } from '@/features/save/saveStore';
import { RARITY_LABEL } from '@/game/crafting/blacksmith';
import {
  ATTUNE_GOLD_COST,
  attunedGem,
  attuneFailure,
  attuneFodderCost,
  INLAY_GOLD_COST,
  inlayFailure,
  RECUT_GOLD_COST,
  recutFailure,
  socketedGemAt,
} from '@/game/crafting/jeweler';
import { ARMORY_SLOT_ORDER, CRUCIBLE_IDS } from '@/game/crucible/crucible';
import { GEM_LABEL, GEM_POOLS, gemValueRange } from '@/game/items/gems';
import { RARITY_LAYER } from '@/game/items/itemLayers';
import {
  AMBER_AFFIXES,
  GEM_COLORS,
  REGULAR_GEM_COLORS,
  RUBY_AFFIXES,
  type ArmorItem,
  type GemAffix,
  type GemStock,
  type RegularGemColor,
  type SocketedGem,
} from '@/game/types';
import { Button } from '@/shared/ui/controls/Button';
import { OrnateTab, OrnateTabs } from '@/shared/ui/controls/OrnateTabs';
import { GemIcon } from '@/shared/ui/icons/GemIcon';
import { Icon } from '@/shared/ui/icons/Icon';
import { Panel } from '@/shared/ui/layout/Panel';
import { ScreenHeader } from '@/shared/ui/layout/ScreenHeader';
import { ScreenLayout } from '@/shared/ui/layout/ScreenLayout';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { cn } from '@/shared/ui/utils/cn';
import {
  focusRing,
  hoverBorder,
  selectedRing,
  stateAttrs,
  transitionState,
} from '@/shared/ui/utils/state';
import { useRovingFocus } from '@/shared/ui/utils/useRovingFocus';
import { formatNumber } from '@/shared/utils/formatNumber';
import { JEWELER_TABS, useCraftingStore, type JewelerTab } from '../craftingStore';
import { ARMOR_BASE_LABEL, RARITY_BADGE_CLASS, RARITY_TEXT_CLASS } from './stationPresentation';
import {
  CostAmount,
  CostRow,
  FundsBar,
  LockedStation,
  PreviewRow,
  SlotList,
} from './stationShared';

const JEWELER_TAB_LABEL: Record<JewelerTab, string> = {
  inlay: 'Inlay',
  attune: 'Attune',
  recut: 'Recut',
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

const valueFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function formatAffixValue(affix: GemAffix, value: number): string {
  return PERCENT_AFFIXES.has(affix)
    ? `${valueFormatter.format(value * 100)}%`
    : valueFormatter.format(value);
}

function formatGemValue(gem: SocketedGem): string {
  return `+${formatAffixValue(gem.affix, gem.value)} ${GEM_AFFIX_LABEL[gem.affix]}`;
}

/** Dienst-Auswahl der Station: Inlay sowie Attune und Recut (Task 029). */
function JewelerTabs({
  activeTab,
  onSelect,
}: {
  activeTab: JewelerTab;
  onSelect: (tab: JewelerTab) => void;
}) {
  const rovingProps = useRovingFocus({
    items: JEWELER_TABS,
    selected: activeTab,
    onSelect,
    itemDomId: (tab) => `jeweler-tab-${tab}`,
  });

  return (
    <OrnateTabs label="Jeweler services" className="grid-cols-3">
      {JEWELER_TABS.map((tab) => (
        <OrnateTab
          key={tab}
          id={`jeweler-tab-${tab}`}
          selected={tab === activeTab}
          controls={`jeweler-panel-${tab}`}
          onClick={() => onSelect(tab)}
          {...rovingProps(tab)}
        >
          {JEWELER_TAB_LABEL[tab]}
        </OrnateTab>
      ))}
    </OrnateTabs>
  );
}

/**
 * Die Werkbank der Station: das Werkstück mit wählbaren Sockeln. Normale Sockel sind die
 * Inlay-Ziele; Prismatic-Sockel erscheinen als Diamond-gebunden gesperrt, solange die
 * Diamond-Effekte offen sind (OPEN_ISSUES §2).
 */
function GemBench({
  item,
  selectedSocket,
  onSelectSocket,
}: {
  item: ArmorItem;
  selectedSocket: number;
  onSelectSocket: (index: number) => void;
}) {
  // Roving Focus arbeitet auf String-Keys; der Sockel-Index ist die Identität.
  const socketKeys = item.sockets.map((_, index) => `${index}`);
  const rovingProps = useRovingFocus({
    items: socketKeys,
    selected: `${selectedSocket}`,
    onSelect: (key) => onSelectSocket(Number(key)),
    itemDomId: (key) => `jeweler-socket-${key}`,
    orientation: 'both',
  });

  return (
    <Panel
      as="section"
      variant="standard"
      padding="none"
      aria-label="Workpiece"
      data-testid="jeweler-stage"
      className="min-w-0 self-start"
    >
      <div className="flex flex-col items-center rounded-lg bg-[radial-gradient(circle_at_50%_20%,color-mix(in_srgb,var(--color-arcane)_12%,transparent),transparent_62%)] px-5 py-6 text-center">
        <span
          aria-hidden="true"
          className="flex size-20 items-center justify-center rounded-full border-2 border-ornament bg-arcane/10 text-accent-strong shadow-glow-accent"
        >
          <Icon name="crucible-armory" size="xl" className="bg-current" />
        </span>
        <h3
          className={cn(
            'mt-4 font-display text-display',
            RARITY_TEXT_CLASS[item.rarity],
            item.rarity !== 'common' && 'drop-shadow-text-contrast',
          )}
        >
          {ARMOR_BASE_LABEL[item.itemType]}{' '}
          <span className="relative top-[-0.16em] ml-1 font-sans text-sm font-semibold tracking-normal text-text-muted tabular-nums">
            [{item.itemLevel}]
          </span>
        </h3>
        <span
          className={cn(
            'mt-3 rounded-full border px-3 py-0.5 font-display text-2xs uppercase tracking-widest',
            RARITY_BADGE_CLASS[item.rarity],
          )}
        >
          {RARITY_LABEL[item.rarity]}
        </span>

        {item.sockets.length === 0 ? (
          <p className="mt-5 border-t border-border/50 pt-4 text-sm text-text-muted">
            The piece has no sockets. Masterwork opens the first socket.
          </p>
        ) : (
          <div
            role="radiogroup"
            aria-label="Socket"
            className="mt-5 flex w-full flex-col gap-2 border-t border-border/50 pt-4"
          >
            {item.sockets.map((gem, index) => {
              const selected = index === selectedSocket;
              return (
                <button
                  // Sockel sind positionsfest; der Index ist die Identität des Sockels.
                  key={`socket-${index}`}
                  type="button"
                  id={`jeweler-socket-${index}`}
                  role="radio"
                  aria-checked={selected}
                  aria-label={`Socket ${index + 1}: ${gem === null ? 'Empty' : `${GEM_LABEL[gem.color]}, ${formatGemValue(gem)}`}`}
                  {...rovingProps(`${index}`)}
                  {...stateAttrs({ selected })}
                  onClick={() => onSelectSocket(index)}
                  className={cn(
                    'flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface/70 px-3 py-2 text-left',
                    focusRing,
                    selectedRing,
                    hoverBorder,
                    transitionState,
                  )}
                >
                  {gem === null ? (
                    <span
                      aria-hidden="true"
                      className="block size-3.5 rounded-full border border-dashed border-state-empty-border bg-background/60"
                    />
                  ) : (
                    <GemIcon color={gem.color} className="size-3.5" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm text-text">Socket {index + 1}</span>
                    <span className="block truncate text-xs text-text-muted">
                      {gem === null ? 'Empty' : formatGemValue(gem)}
                    </span>
                  </span>
                  {gem !== null ? (
                    <span className="shrink-0 text-2xs uppercase text-text-muted">
                      {GEM_LABEL[gem.color]}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        {item.prismaticSockets.map((_, index) => (
          <div
            key={`prismatic-${index}`}
            {...stateAttrs({ semantic: 'locked' })}
            data-testid="jeweler-prismatic-socket"
            className={cn(
              'mt-2 flex w-full min-w-0 items-center gap-3 rounded-lg border border-state-locked-border bg-surface/50 px-3 py-2 text-left',
              transitionState,
            )}
          >
            <GemIcon color="diamond" className="size-3.5 opacity-(--state-deemphasis-medium)" />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-sm text-text">
                Prismatic Socket {index + 1}
              </span>
              <span className="block text-xs text-text-muted">Bound to Diamond gems</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted">
              <LockKeyhole aria-hidden="true" className="size-3.5" />
              Locked
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** Farbwahl des Inlay: die vier regulären Farben mit ihren Beständen. */
function GemColorPicker({
  gems,
  selectedColor,
  onSelect,
}: {
  gems: GemStock;
  selectedColor: RegularGemColor;
  onSelect: (color: RegularGemColor) => void;
}) {
  const rovingProps = useRovingFocus({
    items: REGULAR_GEM_COLORS,
    selected: selectedColor,
    onSelect,
    itemDomId: (color) => `jeweler-gem-${color}`,
    orientation: 'both',
  });

  return (
    <div role="radiogroup" aria-label="Gem color" className="mt-2 grid grid-cols-2 gap-2">
      {REGULAR_GEM_COLORS.map((color) => {
        const selected = color === selectedColor;
        return (
          <button
            key={color}
            type="button"
            id={`jeweler-gem-${color}`}
            role="radio"
            aria-checked={selected}
            aria-label={`${GEM_LABEL[color]}, ${gems[color]} in stock`}
            {...rovingProps(color)}
            {...stateAttrs({ selected })}
            onClick={() => onSelect(color)}
            className={cn(
              'flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface/70 px-3 py-2 text-left',
              focusRing,
              selectedRing,
              hoverBorder,
              transitionState,
            )}
          >
            <GemIcon color={color} />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-sm text-text">{GEM_LABEL[color]}</span>
              <span className="block text-xs tabular-nums text-text-muted">
                {gems[color]} owned
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function InlayPanel({
  item,
  socketIndex,
  gold,
  gems,
  onInlay,
}: {
  item: ArmorItem;
  socketIndex: number;
  gold: number;
  gems: GemStock;
  onInlay: (color: RegularGemColor) => void;
}) {
  const [color, setColor] = useState<RegularGemColor>('amber');
  const failure = inlayFailure(item, socketIndex, color, { gold, gems });
  const occupied = item.sockets[socketIndex] ?? null;

  return (
    <Panel
      as="section"
      variant="standard"
      padding="md"
      aria-label="Inlay"
      className="min-w-0 self-start"
    >
      <SectionTitle as="h3" align="start">
        Inlay
      </SectionTitle>
      <p className="mt-1 text-sm leading-6 text-text-muted">
        Set a gem into the socket — the affix is rolled from the color pool.
      </p>

      <GemColorPicker gems={gems} selectedColor={color} onSelect={setColor} />

      <p className="mt-3 border-t border-border/50 pt-3 text-xs leading-5 text-text-muted">
        Rolls one of:{' '}
        <span className="text-text">
          {GEM_POOLS[color].map((affix) => GEM_AFFIX_LABEL[affix]).join(', ')}
        </span>
      </p>

      {occupied !== null ? (
        <p className="mt-3 text-sm text-warning">
          Socket {socketIndex + 1} holds a bound {GEM_LABEL[occupied.color]} — inlaying destroys it.
        </p>
      ) : null}

      <CostRow>
        {/* Gold steht in jeder Kostenanzeige zuerst. */}
        <CostAmount
          icon={<Coins aria-hidden="true" className="size-4 text-gold" />}
          amount={INLAY_GOLD_COST}
          label="Gold"
        />
        <CostAmount icon={<GemIcon color={color} />} amount={1} label={GEM_LABEL[color]} />
      </CostRow>

      {failure !== null ? (
        <p id="jeweler-inlay-reason" className="mt-3 text-sm text-warning">
          {failure}
        </p>
      ) : null}
      <Button
        variant="ornate"
        className="mt-3 w-full"
        disabled={failure !== null}
        aria-describedby={failure !== null ? 'jeweler-inlay-reason' : undefined}
        onClick={() => onInlay(color)}
      >
        Inlay
      </Button>
    </Panel>
  );
}

function AttunePanel({
  item,
  socketIndex,
  gold,
  gems,
  onAttune,
}: {
  item: ArmorItem;
  socketIndex: number;
  gold: number;
  gems: GemStock;
  onAttune: () => void;
}) {
  const failure = attuneFailure(item, socketIndex, { gold, gems });
  const gem = socketedGemAt(item, socketIndex);
  const cap = RARITY_LAYER[item.rarity].gemLevelCap;
  const atCap = gem !== null && gem.gemLevel >= cap;
  const preview = gem === null || atCap ? undefined : attunedGem(gem);

  return (
    <Panel
      as="section"
      variant="standard"
      padding="md"
      aria-label="Attune"
      className="min-w-0 self-start"
    >
      <SectionTitle as="h3" align="start">
        Attune
      </SectionTitle>
      <p className="mt-1 text-sm leading-6 text-text-muted">
        Level the bound gem — its value keeps its place in the growing range.
      </p>
      <dl className="mt-3 divide-y divide-border/50 border-y border-border/50">
        <PreviewRow
          term="Gem Level"
          from={gem === null ? '—' : `${gem.gemLevel} / ${cap}`}
          to={preview === undefined ? undefined : `${preview.gemLevel} / ${cap}`}
        />
        <PreviewRow
          term={gem === null ? 'Value' : GEM_AFFIX_LABEL[gem.affix]}
          from={gem === null ? '—' : `+${formatAffixValue(gem.affix, gem.value)}`}
          to={
            preview === undefined ? undefined : `+${formatAffixValue(preview.affix, preview.value)}`
          }
        />
      </dl>
      {gem === null || atCap ? null : (
        <CostRow>
          {/* Gold steht in jeder Kostenanzeige zuerst. */}
          <CostAmount
            icon={<Coins aria-hidden="true" className="size-4 text-gold" />}
            amount={ATTUNE_GOLD_COST}
            label="Gold"
          />
          <CostAmount
            icon={<GemIcon color={gem.color} />}
            amount={attuneFodderCost(gem.gemLevel)}
            label={`${GEM_LABEL[gem.color]} fodder`}
          />
        </CostRow>
      )}
      {failure !== null ? (
        <p id="jeweler-attune-reason" className="mt-3 text-sm text-warning">
          {failure}
        </p>
      ) : null}
      <Button
        variant="ornate"
        className="mt-3 w-full"
        disabled={failure !== null}
        aria-describedby={failure !== null ? 'jeweler-attune-reason' : undefined}
        onClick={onAttune}
      >
        Attune
      </Button>
    </Panel>
  );
}

function RecutPanel({
  item,
  socketIndex,
  gold,
  onRecut,
}: {
  item: ArmorItem;
  socketIndex: number;
  gold: number;
  onRecut: () => void;
}) {
  const failure = recutFailure(item, socketIndex, gold);
  const gem = socketedGemAt(item, socketIndex);
  const range = gem === null ? undefined : gemValueRange(gem.affix, gem.gemLevel);

  return (
    <Panel
      as="section"
      variant="standard"
      padding="md"
      aria-label="Recut"
      className="min-w-0 self-start"
    >
      <SectionTitle as="h3" align="start">
        Recut
      </SectionTitle>
      <p className="mt-1 text-sm leading-6 text-text-muted">
        Reroll the bound gem&apos;s value within its current range.
      </p>
      <dl className="mt-3 divide-y divide-border/50 border-y border-border/50">
        <PreviewRow
          term={gem === null ? 'Value' : GEM_AFFIX_LABEL[gem.affix]}
          from={gem === null ? '—' : `+${formatAffixValue(gem.affix, gem.value)}`}
        />
        <PreviewRow
          term="Range"
          from={
            gem === null || range === undefined
              ? '—'
              : `+${formatAffixValue(gem.affix, range.min)} – +${formatAffixValue(gem.affix, range.max)}`
          }
        />
      </dl>
      {gem === null ? null : (
        <CostRow>
          <CostAmount
            icon={<Coins aria-hidden="true" className="size-4 text-gold" />}
            amount={RECUT_GOLD_COST}
            label="Gold"
          />
        </CostRow>
      )}
      {failure !== null ? (
        <p id="jeweler-recut-reason" className="mt-3 text-sm text-warning">
          {failure}
        </p>
      ) : null}
      <Button
        variant="ornate"
        className="mt-3 w-full"
        disabled={failure !== null}
        aria-describedby={failure !== null ? 'jeweler-recut-reason' : undefined}
        onClick={onRecut}
      >
        Recut
      </Button>
    </Panel>
  );
}

/**
 * Jeweler-Station (Task 028/029): ein Tab je Dienst auf dem geteilten Stations-Aufbau —
 * links die Armor-Slots des aktiven Charakters, in der Mitte das Werkstück mit wählbaren
 * Sockeln, rechts das Panel des aktiven Dienstes: Inlay mit Farbwahl, Attune mit
 * Vorher-→-Nachher-Vorschau, Recut mit der aktuellen Range. Gold- und Gem-Bestände stehen
 * dauerhaft im Kopf.
 */
export function JewelerScreen() {
  const save = useSaveStore((state) => state.data);
  const inlayGem = useSaveStore((state) => state.inlayGem);
  const attuneGem = useSaveStore((state) => state.attuneGem);
  const recutGem = useSaveStore((state) => state.recutGem);
  const characterId = useNavigationStore((state) => state.activeCharacterId);
  const selectedSlot = useCraftingStore((state) => state.selectedSlot);
  const setSelectedSlot = useCraftingStore((state) => state.setSelectedSlot);
  const jewelerTab = useCraftingStore((state) => state.jewelerTab);
  const setJewelerTab = useCraftingStore((state) => state.setJewelerTab);
  const [selectedSocket, setSelectedSocket] = useState(0);

  if (save === null) {
    return (
      <ScreenLayout background="jeweler">
        <p aria-live="polite" className="text-text-muted">
          Loading jeweler…
        </p>
      </ScreenLayout>
    );
  }

  const stationUnlocked = (save.crucible[CRUCIBLE_IDS.jeweler] ?? 0) >= 1;
  const loadout = save.armor[characterId];
  // Die Auswahl fällt auf den ersten freigeschalteten Slot zurück (Armory-Reihenfolge).
  const activeSlot =
    loadout[selectedSlot] !== undefined
      ? selectedSlot
      : ARMORY_SLOT_ORDER.find((slot) => loadout[slot] !== undefined);
  const item = activeSlot === undefined ? undefined : loadout[activeSlot];
  // Slot- oder Charakterwechsel können weniger Sockel zeigen; die Auswahl bleibt im Bereich.
  const activeSocket =
    item === undefined ? 0 : Math.max(0, Math.min(selectedSocket, item.sockets.length - 1));

  return (
    <ScreenLayout background="jeweler">
      <section
        aria-label="Jeweler"
        className="mx-auto flex min-h-0 w-full max-w-page flex-1 flex-col"
      >
        <ScreenHeader
          title="Jeweler"
          intro="Steady hands set fire into steel. Every gem carries a spark of the depths, the bench decides where it burns."
        >
          <FundsBar
            entries={[
              {
                label: 'Gold',
                icon: <Coins aria-hidden="true" className="size-4 text-gold" />,
                value: formatNumber(save.currencies.gold),
              },
              ...GEM_COLORS.map((color) => ({
                label: GEM_LABEL[color],
                icon: <GemIcon color={color} />,
                value: formatNumber(save.gems[color]),
              })),
            ]}
          />
        </ScreenHeader>

        {!stationUnlocked ? (
          <LockedStation
            ariaLabel="Jeweler locked"
            testId="jeweler-locked"
            icon={<Icon name="crucible-jeweler" size="xl" className="bg-text-muted" />}
            title="The gem bench sits dark"
          >
            Unlock the Jeweler in the Crucible: the Anvil Sparks tree opens the station once the
            Blacksmith holds its first rank.
          </LockedStation>
        ) : (
          <>
            <div className="mt-6">
              <JewelerTabs activeTab={jewelerTab} onSelect={setJewelerTab} />
            </div>
            {activeSlot === undefined || item === undefined ? (
              <p className="mt-6 text-center text-sm text-text-muted">
                No armor to work on yet — the Armory in the Crucible opens the first slot.
              </p>
            ) : (
              <div
                id={`jeweler-panel-${jewelerTab}`}
                role="tabpanel"
                aria-labelledby={`jeweler-tab-${jewelerTab}`}
                className="mt-5 grid min-w-0 content-start gap-5 @min-[60rem]:grid-cols-[minmax(13rem,0.9fr)_minmax(0,1.3fr)_minmax(16rem,1.05fr)]"
              >
                <SlotList
                  idPrefix="jeweler"
                  loadout={loadout}
                  selectedSlot={activeSlot}
                  onSelect={setSelectedSlot}
                />
                <GemBench
                  item={item}
                  selectedSocket={activeSocket}
                  onSelectSocket={setSelectedSocket}
                />
                {jewelerTab === 'inlay' ? (
                  <InlayPanel
                    item={item}
                    socketIndex={activeSocket}
                    gold={save.currencies.gold}
                    gems={save.gems}
                    onInlay={(color) => void inlayGem(characterId, activeSlot, activeSocket, color)}
                  />
                ) : jewelerTab === 'attune' ? (
                  <AttunePanel
                    item={item}
                    socketIndex={activeSocket}
                    gold={save.currencies.gold}
                    gems={save.gems}
                    onAttune={() => void attuneGem(characterId, activeSlot, activeSocket)}
                  />
                ) : (
                  <RecutPanel
                    item={item}
                    socketIndex={activeSocket}
                    gold={save.currencies.gold}
                    onRecut={() => void recutGem(characterId, activeSlot, activeSocket)}
                  />
                )}
              </div>
            )}
          </>
        )}
      </section>
    </ScreenLayout>
  );
}
