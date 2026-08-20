import {
  Castle,
  Flame,
  Gem,
  Hammer,
  ScrollText,
  Swords,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  isCharacterScopedView,
  useNavigationStore,
  VIEW_LABELS,
  VIEWS,
  type View,
} from '../navigationStore';
import { cn } from '@/shared/ui/utils/cn';
import { Divider } from '@/shared/ui/layout/Divider';
import { focusRing, stateAttrs, transitionState } from '@/shared/ui/utils/state';
import { CharacterSwitcher } from './CharacterSwitcher';

const VIEW_ICONS: Record<View, LucideIcon> = {
  dungeons: Castle,
  heroes: Users,
  crucible: Flame,
  'weapon-mastery': Swords,
  blacksmith: Hammer,
  jeweler: Gem,
  runescribe: ScrollText,
};

const ACTIVE_NAV_ITEM_CLASS = [
  'nav-selection-surface text-accent-strong',
  "before:pointer-events-none before:absolute before:left-[3px] before:right-0 before:top-0 before:h-px before:content-['']",
  'before:bg-linear-to-r before:from-accent-strong/80 before:via-ornament/50 before:to-transparent',
  "after:pointer-events-none after:absolute after:left-[3px] after:right-0 after:bottom-0 after:h-px after:content-['']",
  'after:bg-linear-to-r after:from-accent-strong/80 after:via-ornament/50 after:to-transparent',
].join(' ');

/** Sidebar containing the app brand and primary view navigation. */
export function AppSidebar() {
  const activeView = useNavigationStore((state) => state.activeView);
  const activeCharacterId = useNavigationStore((state) => state.activeCharacterId);
  const setActiveView = useNavigationStore((state) => state.setActiveView);
  const setActiveCharacterId = useNavigationStore((state) => state.setActiveCharacterId);

  return (
    <aside className="border-image-frame isolate flex w-nav shrink-0 flex-col px-4 py-4">
      {/* Steintextur füllt die Sidebar bis unter die Goldlinie des Rahmens; -z-10 hält
          sie unter Emblem, Divider und Nav (isolate bindet den Stacking-Kontext). */}
      <div aria-hidden="true" className="sidebar-stone-surface absolute inset-frame-line -z-10" />
      {/* Endet an der sichtbaren Außenkante des Rahmens; vor den Nav-Buttons im DOM, damit deren positionierte Elemente darüber liegen. */}
      <img
        alt=""
        aria-hidden="true"
        src="/assets/effects/ember-glow.png"
        className="pointer-events-none absolute bottom-1.25 left-1.25 w-[calc(100%-0.5rem)] opacity-80"
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-2 text-center">
          <div className="mx-auto h-24 w-40 overflow-hidden">
            <img
              alt=""
              aria-hidden="true"
              src="/assets/icons/logo/crucible-emblem.png"
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

        <Divider className="my-3" />

        <nav
          aria-label="Primary navigation"
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
        >
          {VIEWS.map((view) => {
            const selected = view === activeView;
            return (
              <div key={view}>
                <SidebarNavItem view={view} selected={selected} onSelect={setActiveView} />
                {selected && isCharacterScopedView(view) ? (
                  <CharacterSwitcher
                    activeCharacterId={activeCharacterId}
                    onSelect={setActiveCharacterId}
                  />
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function SidebarNavItem({
  view,
  selected,
  onSelect,
}: {
  view: View;
  selected: boolean;
  onSelect: (view: View) => void;
}) {
  const NavIcon = VIEW_ICONS[view];

  return (
    <button
      type="button"
      onClick={() => onSelect(view)}
      aria-current={selected ? 'page' : undefined}
      {...stateAttrs({ selected })}
      className={cn(
        'relative flex w-full items-center gap-3 whitespace-nowrap rounded-r-md py-2 pl-7 pr-3 text-left font-display text-display-sm',
        transitionState,
        focusRing,
        // Die Selektionssprache der Nav bleibt asset-basiert;
        // nav-selection-surface muss literal am Element stehen, damit die
        // ::before/::after-Regeln aus index.css greifen.
        selected
          ? ACTIVE_NAV_ITEM_CLASS
          : 'text-accent-strong/70 hover:nav-hover-surface hover:text-accent-strong',
      )}
    >
      {selected ? (
        <img
          alt=""
          aria-hidden="true"
          src="/assets/ornaments/nav-selection.png"
          className="pointer-events-none absolute inset-y-0 left-0 h-full w-7 translate-x-[-8.5%] object-cover object-left"
        />
      ) : null}
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-raised/70 text-current"
      >
        <NavIcon className="size-4" />
      </span>
      {VIEW_LABELS[view]}
    </button>
  );
}
