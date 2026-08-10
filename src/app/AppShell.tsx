import { Coins, Flame, Gem, Hammer, Map, ScrollText, Swords, Users } from 'lucide-react';
import { useEffect, type ComponentType } from 'react';
import { useNavigationStore, VIEWS, type View } from './navigationStore';
import { DungeonRunScreen } from '@/features/dungeon/ui/DungeonRunScreen';
import { useCombatStore } from '@/features/combat/state/combatStore';
import { useCombatPlayback } from '@/features/combat/state/useCombatPlayback';
import { DungeonSelectionScreen } from '@/features/dungeon/ui/DungeonSelectionScreen';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';
import { useSaveStore } from '@/features/save/saveStore';
import { formatNumber } from '@/shared/utils/formatNumber';
import { Tooltip } from '@/shared/ui/Tooltip';
import { CrucibleScreen } from '@/features/crucible/CrucibleScreen';
import { WeaponMasteryScreen } from '@/features/weaponMastery/WeaponMasteryScreen';

const VIEW_META: Record<View, { label: string; icon: ComponentType<{ className?: string }> }> = {
  dungeons: { label: 'DUNGEONS', icon: Map },
  team: { label: 'TEAM', icon: Users },
  crucible: { label: 'CRUCIBLE', icon: Flame },
  'weapon-mastery': { label: 'WEAPON MASTERY', icon: Swords },
  blacksmith: { label: 'BLACKSMITH', icon: Hammer },
  jeweler: { label: 'JEWELER', icon: Gem },
  runes: { label: 'RUNES', icon: ScrollText },
};

const RESOURCE_TONE_CLASS = {
  accent: 'text-accent',
  info: 'text-info',
  muted: 'text-text-muted',
} as const;

type ResourceTone = keyof typeof RESOURCE_TONE_CLASS;

const ACTIVE_NAV_ITEM_CLASS = [
  'nav-selection-surface text-accent-strong',
  "before:pointer-events-none before:absolute before:left-[3px] before:right-0 before:top-0 before:h-px before:content-['']",
  'before:bg-linear-to-r before:from-accent-strong/80 before:via-ornament/50 before:to-transparent',
  "after:pointer-events-none after:absolute after:left-[3px] after:right-0 after:bottom-0 after:h-px after:content-['']",
  'after:bg-linear-to-r after:from-accent-strong/80 after:via-ornament/50 after:to-transparent',
].join(' ');

/** App-Shell mit State-basiertem View-Switch (kein Router, siehe AGENTS.md). */
export function AppShell() {
  // Der Controller lebt oberhalb des View-Switches: Navigation unterbricht den Kampf nicht.
  useCombatPlayback();
  const hydrateSave = useSaveStore((state) => state.hydrate);

  useEffect(() => {
    // Top-Level-Mount entspricht einem Reload: Laufzeitkampf verwerfen, Save neu laden.
    useCombatStore.getState().clearCombat();
    useDungeonRunStore.getState().resetForReload();
    void hydrateSave()
      .then((save) => {
        useCombatStore.getState().setPlaybackSpeed(save.playbackSpeed);
      })
      .catch(() => undefined);
  }, [hydrateSave]);

  const activeView = useNavigationStore((s) => s.activeView);
  const setActiveView = useNavigationStore((s) => s.setActiveView);
  const runMode = useDungeonRunStore((state) => state.mode);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-text">
      {runMode === 'run' ? (
        <DungeonRunScreen />
      ) : (
        <>
          <Sidebar activeView={activeView} onSelectView={setActiveView} />
          <div className="border-image-mainview relative min-w-0 flex-1">
            <ResourceDock />
            <main className="h-full overflow-auto">
              {activeView === 'dungeons' ? (
                <DungeonSelectionScreen />
              ) : (
                // Screens ohne eigenes ScreenLayout (019/020) behalten das bisherige Padding.
                <div className="p-4 sm:p-6">
                  {activeView === 'crucible' ? (
                    <CrucibleScreen />
                  ) : activeView === 'weapon-mastery' ? (
                    <WeaponMasteryScreen />
                  ) : (
                    <PlaceholderView label={VIEW_META[activeView].label} />
                  )}
                </div>
              )}
            </main>
          </div>
        </>
      )}
    </div>
  );
}

function Sidebar({
  activeView,
  onSelectView,
}: {
  activeView: View;
  onSelectView: (view: View) => void;
}) {
  return (
    <aside className="border-image-sidebar flex h-dvh w-72 shrink-0 flex-col">
      {/* Der Wrapper trägt die Fläche, damit sie an der Goldlinie endet (Utility-Padding). */}
      <div className="flex min-h-0 flex-1 flex-col bg-background px-2 py-3">
        <div className="px-2 text-center">
          <div className="mx-auto h-24 w-40 overflow-hidden">
            <img
              alt=""
              aria-hidden="true"
              src="/assets/icons/crucible-emblem.png"
              className="size-full object-cover"
            />
          </div>
          <h1
            aria-label="Crucible Idle RPG"
            className="mt-2 font-display text-display text-accent-strong"
          >
            CRUCIBLE
          </h1>
          <p
            aria-hidden="true"
            className="mt-1 font-display text-[0.6rem] leading-none tracking-[0.3em] text-accent-strong/70"
          >
            IDLE RPG
          </p>
        </div>

        <div aria-hidden="true" className="my-3 h-7 overflow-hidden">
          <img
            alt=""
            src="/assets/ornaments/divider-ornate.png"
            className="size-full object-cover"
          />
        </div>

        <nav aria-label="Primary navigation" className="flex min-h-0 flex-1 flex-col gap-1">
          {VIEWS.map((view) => {
            const { label, icon: NavIcon } = VIEW_META[view];
            const isActive = view === activeView;
            return (
              <button
                key={view}
                type="button"
                onClick={() => onSelectView(view)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center gap-3 whitespace-nowrap rounded-r-md py-2 pl-7 pr-3 text-left font-display text-display-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isActive
                    ? ACTIVE_NAV_ITEM_CLASS
                    : 'text-accent-strong/70 hover:bg-surface hover:text-accent-strong'
                }`}
              >
                {isActive && (
                  <img
                    alt=""
                    aria-hidden="true"
                    src="/assets/ornaments/nav-selection.png"
                    className="pointer-events-none absolute inset-y-0 left-0 h-full w-7 -translate-x-[8.5%] object-cover object-left"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-raised/70 text-current"
                >
                  <NavIcon className="size-4" />
                </span>
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function ResourceDock() {
  const currencies = useSaveStore((state) => state.data?.currencies ?? null);

  return (
    <dl
      aria-label="Resources"
      className="absolute right-4 top-4 z-10 flex flex-wrap justify-end gap-2 lg:right-6 lg:top-6"
    >
      <ResourceChip icon={Coins} label="Gold" value={currencies?.gold} />
      <ResourceChip icon={Gem} label="Crystals" value={currencies?.crystals} tone="info" />
      <ResourceChip icon={Flame} label="Cinder" value={undefined} />
      <ResourceChip icon={ScrollText} label="Runedust" value={undefined} tone="muted" />
    </dl>
  );
}

function ResourceChip({
  icon: ChipIcon,
  label,
  value,
  tone = 'accent',
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  tone?: ResourceTone;
}) {
  const displayValue = value === undefined ? '—' : formatNumber(value);

  return (
    <div className="rounded-full border border-ornament/60 bg-surface/70 px-3 py-1.5 text-sm shadow-panel backdrop-blur-sm">
      <dt className="sr-only">{label}</dt>
      <Tooltip content={label}>
        {(trigger) => (
          <span
            {...trigger}
            className="flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <ChipIcon aria-hidden="true" className={`size-4 ${RESOURCE_TONE_CLASS[tone]}`} />
            <dd aria-label={`${label} amount`} className="font-semibold text-text">
              {displayValue}
            </dd>
          </span>
        )}
      </Tooltip>
    </div>
  );
}

function PlaceholderView({ label }: { label: string }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{label}</h2>
      <p className="mt-2 text-text-muted">Coming soon.</p>
    </section>
  );
}
