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
import { useNavigationStore, VIEW_LABELS, VIEWS, type View } from '../navigationStore';

const VIEW_ICONS: Record<View, LucideIcon> = {
  dungeons: Castle,
  heroes: Users,
  crucible: Flame,
  'weapon-mastery': Swords,
  blacksmith: Hammer,
  jeweler: Gem,
  runes: ScrollText,
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
  const setActiveView = useNavigationStore((state) => state.setActiveView);

  return (
    <aside className="border-image-sidebar flex h-dvh w-72 shrink-0 flex-col">
      {/* Endet an der sichtbaren Außenkante des Rahmens; vor den Nav-Buttons im DOM, damit deren positionierte Elemente darüber liegen. */}
      <img
        alt=""
        aria-hidden="true"
        src="/assets/effects/ember-glow.png"
        className="pointer-events-none absolute bottom-1.25 left-1.25 w-[calc(100%-0.5rem)] opacity-80"
      />
      {/* Der Wrapper trägt die Fläche, damit sie an der Goldlinie endet (Utility-Padding). */}
      <div className="flex min-h-0 flex-1 flex-col bg-background">
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
          {VIEWS.map((view) => (
            <SidebarNavItem
              key={view}
              view={view}
              isActive={view === activeView}
              onSelect={setActiveView}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function SidebarNavItem({
  view,
  isActive,
  onSelect,
}: {
  view: View;
  isActive: boolean;
  onSelect: (view: View) => void;
}) {
  const NavIcon = VIEW_ICONS[view];

  return (
    <button
      type="button"
      onClick={() => onSelect(view)}
      aria-current={isActive ? 'page' : undefined}
      className={`relative flex items-center gap-3 whitespace-nowrap rounded-r-md py-2 pl-7 pr-3 text-left font-display text-display-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        isActive
          ? ACTIVE_NAV_ITEM_CLASS
          : 'text-accent-strong/70 hover:bg-surface hover:text-accent-strong'
      }`}
    >
      {isActive ? (
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
