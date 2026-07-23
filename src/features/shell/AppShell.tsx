import { Swords, Users, TrendingUp } from 'lucide-react';
import type { ComponentType } from 'react';
import { useNavigationStore, VIEWS, type View } from './navigationStore';
import { CombatScreen } from '@/features/combat/CombatScreen';

const VIEW_META: Record<View, { label: string; icon: ComponentType<{ className?: string }> }> = {
  combat: { label: 'Combat', icon: Swords },
  team: { label: 'Team', icon: Users },
  upgrades: { label: 'Upgrades', icon: TrendingUp },
};

/** App-Shell mit State-basiertem View-Switch (kein Router, siehe AGENTS.md §6). */
export function AppShell() {
  const activeView = useNavigationStore((s) => s.activeView);
  const setActiveView = useNavigationStore((s) => s.setActiveView);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface px-4 py-3">
        <h1 className="text-lg font-bold tracking-wide text-accent">Crucible Idle RPG</h1>
      </header>

      <div className="flex flex-1">
        <nav className="flex w-40 flex-col gap-1 border-r border-border bg-surface p-2">
          {VIEWS.map((view) => {
            const { label, icon: Icon } = VIEW_META[view];
            const isActive = view === activeView;
            return (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isActive
                    ? 'bg-surface-raised text-accent'
                    : 'text-text-muted hover:bg-surface-raised hover:text-text'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <main className="flex-1 p-6">
          {activeView === 'combat' && <CombatScreen />}
          {activeView === 'team' && <PlaceholderView label="Team" />}
          {activeView === 'upgrades' && <PlaceholderView label="Upgrades" />}
        </main>
      </div>
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
