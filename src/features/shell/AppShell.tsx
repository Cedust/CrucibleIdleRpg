import { Coins, Flame, Gem, Hammer, Map, ScrollText, Users } from 'lucide-react';
import { useEffect, type ComponentType } from 'react';
import { useNavigationStore, VIEWS, type View } from './navigationStore';
import { CombatScreen } from '@/features/combat/CombatScreen';
import { useCombatStore } from '@/features/combat/combatStore';
import { useCombatPlayback } from '@/features/combat/useCombatPlayback';
import { useSaveStore } from '@/features/save/saveStore';
import { formatNumber } from '@/shared/utils/formatNumber';

const VIEW_META: Record<View, { label: string; icon: ComponentType<{ className?: string }> }> = {
  dungeons: { label: 'DUNGEONS', icon: Map },
  team: { label: 'TEAM', icon: Users },
  crucible: { label: 'CRUCIBLE', icon: Flame },
  blacksmith: { label: 'BLACKSMITH', icon: Hammer },
  jeweler: { label: 'JEWELER', icon: Gem },
  runes: { label: 'RUNES', icon: ScrollText },
};

/** App-Shell mit State-basiertem View-Switch (kein Router, siehe AGENTS.md §6). */
export function AppShell() {
  // Der Controller lebt oberhalb des View-Switches: Navigation unterbricht den Kampf nicht.
  useCombatPlayback();
  const hydrateSave = useSaveStore((state) => state.hydrate);

  useEffect(() => {
    // Top-Level-Mount entspricht einem Reload: Laufzeitkampf verwerfen, Save neu laden.
    useCombatStore.getState().clearCombat();
    void hydrateSave()
      .then((save) => {
        useCombatStore.getState().setPlaybackSpeed(save.playbackSpeed);
      })
      .catch(() => undefined);
  }, [hydrateSave]);

  const activeView = useNavigationStore((s) => s.activeView);
  const setActiveView = useNavigationStore((s) => s.setActiveView);
  const currencies = useSaveStore((state) => state.data?.currencies ?? null);

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 sm:px-7">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-lg border-2 border-accent font-serif text-sm font-bold text-accent"
          >
            C
          </div>
          <div>
            <h1
              aria-label="Crucible Idle RPG"
              className="text-sm font-bold leading-none tracking-[0.15em] text-text"
            >
              CRUCIBLE
            </h1>
            <p
              aria-hidden="true"
              className="mt-1 text-[0.6rem] leading-none tracking-[0.25em] text-text-muted"
            >
              IDLE RPG
            </p>
          </div>
        </div>

        <dl aria-label="Resources" className="flex items-center gap-2 sm:gap-4">
          <ResourceChip icon={Coins} label="Gold" value={currencies?.gold} />
          <ResourceChip icon={Gem} label="Crystals" value={currencies?.crystals} tone="info" />
        </dl>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Primary navigation"
          className="flex w-52 shrink-0 flex-col gap-1 border-r border-border bg-background/60 px-2 py-3"
        >
          {VIEWS.map((view) => {
            const { label, icon: Icon } = VIEW_META[view];
            const isActive = view === activeView;
            return (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-r-md border-l-2 px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isActive
                    ? 'border-accent bg-accent/10 text-text'
                    : 'border-transparent text-text-muted hover:bg-surface hover:text-text'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-raised ${
                    isActive ? 'text-accent' : 'text-text-muted'
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                {label}
              </button>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6">
          {activeView === 'dungeons' ? (
            <CombatScreen />
          ) : (
            <PlaceholderView label={VIEW_META[activeView].label} />
          )}
        </main>
      </div>
    </div>
  );
}

function ResourceChip({
  icon: Icon,
  label,
  value,
  tone = 'accent',
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  tone?: 'accent' | 'info';
}) {
  const displayValue = value === undefined ? '—' : formatNumber(value);

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm">
      <dt className="sr-only">{label}</dt>
      <Icon
        aria-hidden="true"
        className={`size-4 ${tone === 'accent' ? 'text-accent' : 'text-info'}`}
      />
      <dd aria-label={`${label} amount`} className="font-semibold text-text">
        {displayValue}
      </dd>
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
