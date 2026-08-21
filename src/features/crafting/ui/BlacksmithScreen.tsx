import { Coins, Flame } from 'lucide-react';
import { useNavigationStore } from '@/app/navigationStore';
import { useSaveStore } from '@/features/save/saveStore';
import {
  brandCost,
  brandFailure,
  masterworkCost,
  masterworkFailure,
  RARITY_LABEL,
  temperFailure,
  temperGoldCost,
} from '@/game/crafting/blacksmith';
import { ARMORY_SLOT_ORDER, CRUCIBLE_IDS } from '@/game/crucible/crucible';
import { innateValue } from '@/game/items/armor';
import { RARITY_LAYER } from '@/game/items/itemLayers';
import { activeImprintSigilIds, imprintEffectText } from '@/game/sigils/imprints';
import { SIGILS, sigilById } from '@/game/sigils/sigils';
import type { SigilCodex, SigilDefinition, SigilId, SigilLevel } from '@/game/sigils/types';
import type { ArmorItem } from '@/game/types';
import { Button } from '@/shared/ui/controls/Button';
import { OrnateTab, OrnateTabs } from '@/shared/ui/controls/OrnateTabs';
import { ProgressBar } from '@/shared/ui/feedback/ProgressBar';
import { GemIcon } from '@/shared/ui/icons/GemIcon';
import { Icon } from '@/shared/ui/icons/Icon';
import { Panel } from '@/shared/ui/layout/Panel';
import { ScreenHeader } from '@/shared/ui/layout/ScreenHeader';
import { ScreenLayout } from '@/shared/ui/layout/ScreenLayout';
import { SectionTitle } from '@/shared/ui/layout/SectionTitle';
import { cn } from '@/shared/ui/utils/cn';
import { useRovingFocus } from '@/shared/ui/utils/useRovingFocus';
import { formatNumber } from '@/shared/utils/formatNumber';
import { BLACKSMITH_TABS, useCraftingStore, type BlacksmithTab } from '../craftingStore';
import {
  ARMOR_BASE_LABEL,
  costFormatter,
  INNATE_LABEL,
  RARITY_BADGE_CLASS,
  RARITY_TEXT_CLASS,
} from './stationPresentation';
import {
  CostAmount,
  CostRow,
  FundsBar,
  LockedStation,
  PreviewRow,
  SlotList,
} from './stationShared';

const BLACKSMITH_TAB_LABEL: Record<BlacksmithTab, string> = {
  temper: 'Temper',
  masterwork: 'Masterwork',
  brand: 'Brand',
};

/** Dienst-Auswahl der Station: Temper, Masterwork und Brand. */
function BlacksmithTabs({
  activeTab,
  onSelect,
}: {
  activeTab: BlacksmithTab;
  onSelect: (tab: BlacksmithTab) => void;
}) {
  const rovingProps = useRovingFocus({
    items: BLACKSMITH_TABS,
    selected: activeTab,
    onSelect,
    itemDomId: (tab) => `blacksmith-tab-${tab}`,
  });

  return (
    <OrnateTabs label="Blacksmith services" className="grid-cols-3">
      {BLACKSMITH_TABS.map((tab) => (
        <OrnateTab
          key={tab}
          id={`blacksmith-tab-${tab}`}
          selected={tab === activeTab}
          controls={`blacksmith-panel-${tab}`}
          onClick={() => onSelect(tab)}
          {...rovingProps(tab)}
        >
          {BLACKSMITH_TAB_LABEL[tab]}
        </OrnateTab>
      ))}
    </OrnateTabs>
  );
}

/** Sichtbare Sockelreihe des Items: gebundene Gems, leere und Prismatic-Sockel. */
function SocketRow({ item }: { item: ArmorItem }) {
  const total = item.sockets.length + item.prismaticSockets.length;
  if (total === 0) {
    return null;
  }

  return (
    <ul aria-label="Sockets" className="flex items-center justify-center gap-2.5">
      {item.sockets.map((gem, index) => (
        // Sockel sind positionsfest; der Index ist die Identität des Sockels.
        <li key={`socket-${index}`} className="flex items-center">
          {gem === null ? (
            <span
              aria-hidden="true"
              className="block size-3.5 rounded-full border border-dashed border-state-empty-border bg-background/60"
            />
          ) : (
            <GemIcon color={gem.color} className="size-3.5" />
          )}
          <span className="sr-only">
            {gem === null ? `Socket ${index + 1}: Empty` : `Socket ${index + 1}: ${gem.color}`}
          </span>
        </li>
      ))}
      {item.prismaticSockets.map((_, index) => (
        <li key={`prismatic-${index}`} className="flex items-center">
          <GemIcon color="diamond" className="size-3.5 opacity-(--state-deemphasis-medium)" />
          <span className="sr-only">Prismatic socket {index + 1}: Empty</span>
        </li>
      ))}
    </ul>
  );
}

/** Die Item-Bühne der Station: das gewählte Werkstück mit allen sichtbaren Schichten. */
function AnvilStage({ item, sigils }: { item: ArmorItem; sigils: SigilCodex }) {
  const layer = RARITY_LAYER[item.rarity];
  const imprint = item.imprint === undefined ? undefined : sigilById(item.imprint.sigilId);
  const imprintLevel = imprint === undefined ? undefined : sigils[imprint.id];

  return (
    <Panel
      as="section"
      variant="standard"
      padding="none"
      aria-label="Workpiece"
      data-testid="blacksmith-stage"
      className="min-w-0 self-start"
    >
      <div className="flex flex-col items-center rounded-lg bg-[radial-gradient(circle_at_50%_20%,color-mix(in_srgb,var(--color-ember)_14%,transparent),transparent_62%)] px-5 py-6 text-center">
        <span
          aria-hidden="true"
          className="flex size-20 items-center justify-center rounded-full border-2 border-ornament bg-ember/10 text-ember-bright shadow-glow-accent"
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
          {/* Das Level hebt sich bewusst vom Itemnamen ab: Fließtext-Schrift, muted, [n].
              Der Hub gleicht den Klammer-Unterlauf der Sans-Schrift aus, damit das
              Klammerband optisch auf der Schriftlinie der Versalien sitzt. */}
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

        <p className="mt-5 border-t border-border/50 pt-4 font-display text-display-sm text-accent-strong">
          +{costFormatter.format(innateValue(item))} {INNATE_LABEL[item.innate]}
        </p>
        <p className="mt-0.5 text-2xs uppercase tracking-wide text-text-muted">Innate</p>

        <ProgressBar
          label="Item Level"
          ariaLabel={`Item level toward the ${RARITY_LABEL[item.rarity]} cap`}
          value={item.itemLevel}
          max={layer.itemLevelCap}
          valueText={`${item.itemLevel} / ${layer.itemLevelCap}`}
          tone="accent"
          size="sm"
          labelSize="xs"
          className="mt-5 w-full max-w-60"
        />

        <div className="mt-4">
          <SocketRow item={item} />
        </div>

        {imprint !== undefined && imprintLevel !== undefined ? (
          <div className="mt-5 w-full max-w-60 border-t border-ornament/45 pt-4">
            <p className="font-display text-2xs uppercase tracking-[0.16em] text-ember-bright">
              Imprint
            </p>
            <p className="mt-1 font-display text-sm text-text">{imprint.name}</p>
            <p className="mt-1 text-xs text-text-muted">
              Level {imprintLevel} · {imprintEffectText(imprint, imprintLevel)}
            </p>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

interface BrandCandidate {
  sigil: SigilDefinition;
  level: SigilLevel;
}

/**
 * Die Brand-Auswahl enthält ausschließlich bekannte, freie Sigils, die auf das aktuell
 * gewählte Magic+-Item passen. Der bestehende Brand erscheint separat als aktuelle Markierung.
 */
function eligibleBrandCandidates(
  item: ArmorItem,
  sigils: SigilCodex,
  activeSigilIds: ReadonlySet<SigilId>,
): readonly BrandCandidate[] {
  if (item.rarity === 'common') return [];

  return (SIGILS as readonly SigilDefinition[]).flatMap((sigil) => {
    const level = sigils[sigil.id];
    return level === undefined ||
      sigil.id === item.imprint?.sigilId ||
      activeSigilIds.has(sigil.id) ||
      !sigil.slots.includes(item.slot)
      ? []
      : [{ sigil, level }];
  });
}

function BrandPanel({
  item,
  sigils,
  gold,
  cinder,
  candidates,
  selectedSigilId,
  activeSigilIds,
  onSelectSigil,
  onBrand,
}: {
  item: ArmorItem;
  sigils: SigilCodex;
  gold: number;
  cinder: number;
  candidates: readonly BrandCandidate[];
  selectedSigilId: SigilId | null;
  activeSigilIds: ReadonlySet<SigilId>;
  onSelectSigil: (sigilId: SigilId) => void;
  onBrand: (sigilId: SigilId) => void;
}) {
  const selected = candidates.find((candidate) => candidate.sigil.id === selectedSigilId);
  const selectedId = selected?.sigil.id ?? null;
  const cost = brandCost(item);
  const failure =
    selectedId === null
      ? item.rarity === 'common'
        ? 'Branding requires a Magic item or higher.'
        : 'No compatible, unbound Sigils are known.'
      : brandFailure(item, selectedId, sigils, activeSigilIds, { gold, cinder });
  const focusId = selectedId ?? candidates[0]?.sigil.id ?? 'sigil.tempered-edge';
  const rovingProps = useRovingFocus({
    items: candidates.map((candidate) => candidate.sigil.id),
    selected: focusId,
    onSelect: onSelectSigil,
    itemDomId: (sigilId) => `blacksmith-sigil-${sigilId}`,
    orientation: 'both',
  });

  return (
    <Panel
      as="section"
      variant="standard"
      padding="md"
      aria-label="Brand"
      className="min-w-0 self-start"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionTitle as="h3" align="start">
            {cost.rebrand ? 'Re-Brand' : 'Brand'}
          </SectionTitle>
          <p className="mt-1 text-sm leading-6 text-text-muted">
            {cost.rebrand
              ? 'Quench the old mark and strike a new Sigil into the steel.'
              : 'Bind a recovered Sigil to this piece of armor.'}
          </p>
        </div>
      </div>

      <div className="mt-4 border-y border-ornament/35 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-ember)_9%,transparent),transparent)] px-3 py-2.5">
        <p className="font-display text-2xs uppercase tracking-[0.14em] text-text-muted">
          {item.imprint === undefined ? 'Unmarked steel' : 'Current imprint'}
        </p>
        {item.imprint === undefined ? (
          <p className="mt-1 text-sm text-text">No Imprint on this armor.</p>
        ) : (
          <p className="mt-1 font-display text-sm text-ember-bright">
            {sigilById(item.imprint.sigilId)?.name ?? 'Unknown Imprint'}
          </p>
        )}
      </div>

      <div className="mt-4">
        <p className="font-display text-2xs uppercase tracking-[0.14em] text-text-muted">
          Compatible Sigils
        </p>
        {candidates.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-text-muted">
            {item.rarity === 'common'
              ? 'Raise this item to Magic before the iron can hold a mark.'
              : 'Recover a matching Sigil, or free one from another piece of armor.'}
          </p>
        ) : (
          <div
            role="radiogroup"
            aria-label="Compatible Sigils"
            className="mt-2 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 @min-[32rem]:grid-cols-2"
          >
            {candidates.map(({ sigil, level }) => {
              const selected = sigil.id === selectedId;
              return (
                <button
                  key={sigil.id}
                  type="button"
                  id={`blacksmith-sigil-${sigil.id}`}
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${sigil.name}, level ${level}, ${imprintEffectText(sigil, level)}`}
                  {...rovingProps(sigil.id)}
                  onClick={() => onSelectSigil(sigil.id)}
                  className={cn(
                    'group relative min-w-0 overflow-hidden rounded-md border px-3 py-2.5 text-left',
                    'border-border bg-surface-raised/50 transition-colors duration-150',
                    'hover:border-ember/65 focus-visible:border-ember',
                    selected && 'border-ember/75 bg-ember/10 shadow-glow-accent',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-y-0 left-0 w-0.5 bg-ember opacity-0 transition-opacity',
                      selected && 'opacity-100',
                    )}
                  />
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-display text-sm text-text">{sigil.name}</span>
                    <span className="shrink-0 font-display text-2xs uppercase tracking-wide text-ember-bright">
                      Lvl {level}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-text-muted">
                    {imprintEffectText(sigil, level)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <CostRow>
        <CostAmount
          icon={<Coins aria-hidden="true" className="size-4 text-gold" />}
          amount={cost.gold}
          label="Gold"
        />
        <CostAmount
          icon={<Flame aria-hidden="true" className="size-4 text-cinder" />}
          amount={cost.cinder}
          label="Cinder"
        />
      </CostRow>
      {failure !== null ? (
        <p id="blacksmith-brand-reason" className="mt-3 text-sm text-warning">
          {failure}
        </p>
      ) : null}
      <Button
        variant="ornate"
        className="mt-3 w-full"
        disabled={failure !== null || selectedId === null}
        aria-describedby={failure !== null ? 'blacksmith-brand-reason' : undefined}
        onClick={() => {
          if (selectedId !== null) onBrand(selectedId);
        }}
      >
        {cost.rebrand ? 'Re-Brand' : 'Brand'}
      </Button>
    </Panel>
  );
}

function TemperPanel({
  item,
  gold,
  onTemper,
}: {
  item: ArmorItem;
  gold: number;
  onTemper: () => void;
}) {
  const failure = temperFailure(item, gold);
  const atCap = item.itemLevel >= RARITY_LAYER[item.rarity].itemLevelCap;
  const nextLevelItem: ArmorItem = { ...item, itemLevel: item.itemLevel + 1 };

  return (
    <Panel
      as="section"
      variant="standard"
      padding="md"
      aria-label="Temper"
      className="min-w-0 self-start"
    >
      <SectionTitle as="h3" align="start">
        Temper
      </SectionTitle>
      <p className="mt-1 text-sm leading-6 text-text-muted">Hammer the piece one level higher.</p>
      <dl className="mt-3 divide-y divide-border/50 border-y border-border/50">
        <PreviewRow
          term="Item Level"
          from={`${item.itemLevel}`}
          to={atCap ? undefined : `${item.itemLevel + 1}`}
        />
        <PreviewRow
          term={INNATE_LABEL[item.innate]}
          from={`+${costFormatter.format(innateValue(item))}`}
          to={atCap ? undefined : `+${costFormatter.format(innateValue(nextLevelItem))}`}
        />
      </dl>
      {atCap ? null : (
        <CostRow>
          <CostAmount
            icon={<Coins aria-hidden="true" className="size-4 text-gold" />}
            amount={temperGoldCost(item.itemLevel)}
            label="Gold"
          />
        </CostRow>
      )}
      {failure !== null ? (
        <p id="blacksmith-temper-reason" className="mt-3 text-sm text-warning">
          {failure}
        </p>
      ) : null}
      <Button
        variant="ornate"
        className="mt-3 w-full"
        disabled={failure !== null}
        aria-describedby={failure !== null ? 'blacksmith-temper-reason' : undefined}
        onClick={onTemper}
      >
        Temper
      </Button>
    </Panel>
  );
}

function MasterworkPanel({
  item,
  gold,
  cinder,
  onMasterwork,
}: {
  item: ArmorItem;
  gold: number;
  cinder: number;
  onMasterwork: () => void;
}) {
  const failure = masterworkFailure(item, { gold, cinder });
  const cost = masterworkCost(item.rarity);
  const nextLayer = cost === undefined ? undefined : RARITY_LAYER[cost.to];

  return (
    <Panel
      as="section"
      variant="standard"
      padding="md"
      aria-label="Masterwork"
      className="min-w-0 self-start"
    >
      <SectionTitle as="h3" align="start">
        Masterwork
      </SectionTitle>
      <p className="mt-1 text-sm leading-6 text-text-muted">
        Reforge the piece into a higher rarity.
      </p>
      <dl className="mt-3 divide-y divide-border/50 border-y border-border/50">
        <PreviewRow
          term="Rarity"
          from={<span className={RARITY_TEXT_CLASS[item.rarity]}>{RARITY_LABEL[item.rarity]}</span>}
          to={
            cost === undefined ? undefined : (
              <span className={RARITY_TEXT_CLASS[cost.to]}>{RARITY_LABEL[cost.to]}</span>
            )
          }
        />
        <PreviewRow
          term="Sockets"
          from={`${item.sockets.length}`}
          to={cost === undefined ? undefined : `${item.sockets.length + 1}`}
        />
        <PreviewRow
          term="Level Cap"
          from={`${RARITY_LAYER[item.rarity].itemLevelCap}`}
          to={nextLayer === undefined ? undefined : `${nextLayer.itemLevelCap}`}
        />
      </dl>
      {cost === undefined ? null : (
        <CostRow>
          {/* Gold steht in jeder Kostenanzeige zuerst. */}
          <CostAmount
            icon={<Coins aria-hidden="true" className="size-4 text-gold" />}
            amount={cost.gold}
            label="Gold"
          />
          <CostAmount
            icon={<Flame aria-hidden="true" className="size-4 text-cinder" />}
            amount={cost.cinder}
            label="Cinder"
          />
        </CostRow>
      )}
      {failure !== null ? (
        <p id="blacksmith-masterwork-reason" className="mt-3 text-sm text-warning">
          {failure}
        </p>
      ) : null}
      <Button
        variant="ornate"
        className="mt-3 w-full"
        disabled={failure !== null}
        aria-describedby={failure !== null ? 'blacksmith-masterwork-reason' : undefined}
        onClick={onMasterwork}
      >
        Masterwork
      </Button>
    </Panel>
  );
}

/**
 * Blacksmith-Station: ein Tab je Dienst. Links die Armor-Slots des aktiven Charakters, in der
 * Mitte das Werkstück und rechts die planbare Aktion mit Vorher-→-Nachher-Vorschau respektive
 * der Sigil-Auswahl. Die Charakterwahl bleibt im gemeinsamen Sidebar-Switcher; Gold und Cinder
 * stehen dauerhaft im Kopf.
 */
export function BlacksmithScreen() {
  const save = useSaveStore((state) => state.data);
  const temperArmor = useSaveStore((state) => state.temperArmor);
  const masterworkArmor = useSaveStore((state) => state.masterworkArmor);
  const brandArmor = useSaveStore((state) => state.brandArmor);
  const characterId = useNavigationStore((state) => state.activeCharacterId);
  const selectedSlot = useCraftingStore((state) => state.selectedSlot);
  const setSelectedSlot = useCraftingStore((state) => state.setSelectedSlot);
  const activeTab = useCraftingStore((state) => state.activeTab);
  const setActiveTab = useCraftingStore((state) => state.setActiveTab);
  const selectedSigilId = useCraftingStore((state) => state.selectedSigilId);
  const setSelectedSigilId = useCraftingStore((state) => state.setSelectedSigilId);

  if (save === null) {
    return (
      <ScreenLayout background="blacksmith">
        <p aria-live="polite" className="text-text-muted">
          Loading blacksmith…
        </p>
      </ScreenLayout>
    );
  }

  const stationUnlocked = (save.crucible[CRUCIBLE_IDS.blacksmith] ?? 0) >= 1;
  const loadout = save.armor[characterId];
  // Die Auswahl fällt auf den ersten freigeschalteten Slot zurück (Armory-Reihenfolge).
  const activeSlot =
    loadout[selectedSlot] !== undefined
      ? selectedSlot
      : ARMORY_SLOT_ORDER.find((slot) => loadout[slot] !== undefined);
  const item = activeSlot === undefined ? undefined : loadout[activeSlot];
  const activeSigilIds =
    activeSlot === undefined
      ? new Set<SigilId>()
      : activeImprintSigilIds(save.armor, {
          characterId,
          slot: activeSlot,
        });
  const brandCandidates =
    item === undefined ? [] : eligibleBrandCandidates(item, save.sigils, activeSigilIds);
  const activeBrandSigilId = brandCandidates.some(
    (candidate) => candidate.sigil.id === selectedSigilId,
  )
    ? selectedSigilId
    : (brandCandidates[0]?.sigil.id ?? null);

  return (
    <ScreenLayout background="blacksmith">
      <section
        aria-label="Blacksmith"
        className="mx-auto flex min-h-0 w-full max-w-page flex-1 flex-col"
      >
        <ScreenHeader
          title="Blacksmith"
          intro="The forge never sleeps. Steel that survived the depths is laid upon this anvil and leaves the coals stronger than the day it was made."
        >
          <FundsBar
            entries={[
              {
                label: 'Gold',
                icon: <Coins aria-hidden="true" className="size-4 text-gold" />,
                value: formatNumber(save.currencies.gold),
              },
              {
                label: 'Cinder',
                icon: <Flame aria-hidden="true" className="size-4 text-cinder" />,
                value: formatNumber(save.currencies.cinder),
              },
            ]}
          />
        </ScreenHeader>

        {!stationUnlocked ? (
          <LockedStation
            ariaLabel="Blacksmith locked"
            testId="blacksmith-locked"
            icon={<Icon name="crucible-blacksmith" size="xl" className="bg-text-muted" />}
            title="The forge lies cold"
          >
            Unlock the Blacksmith in the Crucible: the Anvil Sparks tree opens the station once the
            Armory holds its first rank.
          </LockedStation>
        ) : (
          <>
            <div className="mt-6">
              <BlacksmithTabs activeTab={activeTab} onSelect={setActiveTab} />
            </div>
            {activeSlot === undefined || item === undefined ? (
              <p className="mt-6 text-center text-sm text-text-muted">
                No armor to work on yet — the Armory in the Crucible opens the first slot.
              </p>
            ) : (
              <div
                id={`blacksmith-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`blacksmith-tab-${activeTab}`}
                className="mt-5 grid min-w-0 content-start gap-5 @min-[60rem]:grid-cols-[minmax(13rem,0.9fr)_minmax(0,1.3fr)_minmax(16rem,1.05fr)]"
              >
                <SlotList
                  idPrefix="blacksmith"
                  loadout={loadout}
                  selectedSlot={activeSlot}
                  onSelect={setSelectedSlot}
                />
                <AnvilStage item={item} sigils={save.sigils} />
                {activeTab === 'temper' ? (
                  <TemperPanel
                    item={item}
                    gold={save.currencies.gold}
                    onTemper={() => void temperArmor(characterId, activeSlot)}
                  />
                ) : activeTab === 'masterwork' ? (
                  <MasterworkPanel
                    item={item}
                    gold={save.currencies.gold}
                    cinder={save.currencies.cinder}
                    onMasterwork={() => void masterworkArmor(characterId, activeSlot)}
                  />
                ) : (
                  <BrandPanel
                    item={item}
                    sigils={save.sigils}
                    gold={save.currencies.gold}
                    cinder={save.currencies.cinder}
                    candidates={brandCandidates}
                    selectedSigilId={activeBrandSigilId}
                    activeSigilIds={activeSigilIds}
                    onSelectSigil={setSelectedSigilId}
                    onBrand={(sigilId) => void brandArmor(characterId, activeSlot, sigilId)}
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
