import { CHARACTERS, TEAM_ORDER } from '@/game/characters/characters';
import type { CharacterId } from '@/game/types';
import { cn } from '@/shared/ui/utils/cn';
import { ROLE_ICON } from '@/shared/ui/icons/roleIcons';
import { stateAttrs, transitionState } from '@/shared/ui/utils/state';
import { useRovingFocus } from '@/shared/ui/utils/useRovingFocus';

interface CharacterSwitcherProps {
  activeCharacterId: CharacterId;
  onSelect: (characterId: CharacterId) => void;
}

/** Compact, controlled party context for all character-scoped views. */
export function CharacterSwitcher({ activeCharacterId, onSelect }: CharacterSwitcherProps) {
  const rovingProps = useRovingFocus({
    items: TEAM_ORDER,
    selected: activeCharacterId,
    onSelect,
    itemDomId: (characterId) => `character-switcher-${characterId}`,
    orientation: 'both',
  });

  return (
    <div
      role="radiogroup"
      aria-label="Active character"
      className="grid grid-cols-3 gap-0.5 overflow-visible rounded-b-md border-x border-b border-border/50 bg-background/85 px-1 pb-1 pt-1.5"
    >
      {TEAM_ORDER.map((characterId) => {
        const selected = characterId === activeCharacterId;
        const character = CHARACTERS[characterId];
        const RoleIcon = ROLE_ICON[character.role];

        return (
          <button
            key={characterId}
            id={`character-switcher-${characterId}`}
            type="button"
            role="radio"
            aria-checked={selected}
            {...stateAttrs({ selected })}
            onClick={() => onSelect(characterId)}
            {...rovingProps(characterId)}
            className={cn(
              'group relative h-28 min-h-11 w-[4.667rem] min-w-11 cursor-pointer justify-self-center overflow-visible text-center',
              transitionState,
              'text-text-muted data-selected:text-accent-strong',
              'focus-visible:z-30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-state-focus',
            )}
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-[15.5%] top-[17%] bottom-[20.5%] overflow-hidden rounded-t-[999px] bg-surface-raised"
            >
              <img
                src={`/assets/portraits/${characterId}.png`}
                alt=""
                data-character-part="portrait"
                className={cn(
                  'size-full object-cover object-center',
                  transitionState,
                  'opacity-(--state-deemphasis-weak) brightness-[.55] grayscale saturate-50',
                  'group-hover:opacity-95 group-hover:brightness-75 group-hover:grayscale-0',
                  'group-focus-visible:opacity-95 group-focus-visible:brightness-75 group-focus-visible:grayscale-0',
                  'group-data-selected:opacity-100 group-data-selected:brightness-100 group-data-selected:grayscale-0 group-data-selected:saturate-100',
                )}
              />
              <span className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background/90 to-transparent" />
            </span>

            <img
              src="/assets/frames/character-portrait-frame.png"
              alt=""
              aria-hidden="true"
              data-character-part="frame"
              className={cn(
                'pointer-events-none absolute inset-0 z-10 size-full object-fill',
                transitionState,
                'opacity-(--state-deemphasis-weak) brightness-[.65] grayscale',
                'group-hover:opacity-90 group-hover:brightness-75 group-hover:grayscale-0',
                'group-focus-visible:opacity-90 group-focus-visible:brightness-75 group-focus-visible:grayscale-0',
                'group-data-selected:opacity-100 group-data-selected:brightness-100 group-data-selected:grayscale-0 group-data-selected:drop-shadow-glow-accent',
              )}
            />

            <RoleIcon
              aria-hidden="true"
              data-character-part="role-icon"
              className="pointer-events-none absolute left-1/2 top-[5.5%] z-20 size-3.5 -translate-x-1/2 text-text-muted drop-shadow-text-contrast group-data-selected:text-accent-strong"
            />

            <span
              data-character-part="name"
              className="pointer-events-none absolute inset-x-[17%] top-[77.8%] z-20 flex h-[10%] items-center justify-center truncate px-0.5 font-display text-[0.625rem] font-semibold leading-none"
            >
              {character.name}
            </span>

            {selected ? (
              <span
                aria-hidden="true"
                data-character-part="active-marker"
                className="pointer-events-none absolute bottom-[5.5%] left-1/2 z-0 h-px w-12 -translate-x-1/2 bg-linear-to-r from-transparent via-accent-strong to-transparent"
              >
                <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-accent-strong bg-background" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
