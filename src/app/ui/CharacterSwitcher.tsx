import type { KeyboardEvent } from 'react';
import { Crosshair, Shield, Swords, type LucideIcon } from 'lucide-react';
import { CHARACTERS, TEAM_ORDER } from '@/game/characters/characters';
import type { CharacterId, Role } from '@/game/types';

interface CharacterSwitcherProps {
  activeCharacterId: CharacterId;
  onSelect: (characterId: CharacterId) => void;
}

const ROLE_ICON: Record<Role, LucideIcon> = {
  tank: Shield,
  melee: Swords,
  ranged: Crosshair,
};

function focusCharacter(id: CharacterId) {
  document.getElementById(`character-switcher-${id}`)?.focus();
}

function handleCharacterKey(
  event: KeyboardEvent<HTMLButtonElement>,
  characterId: CharacterId,
  onSelect: (id: CharacterId) => void,
) {
  const index = TEAM_ORDER.indexOf(characterId);
  const nextIndex =
    event.key === 'ArrowRight' || event.key === 'ArrowDown'
      ? (index + 1) % TEAM_ORDER.length
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? (index - 1 + TEAM_ORDER.length) % TEAM_ORDER.length
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? TEAM_ORDER.length - 1
            : null;

  if (nextIndex === null) return;
  const nextId = TEAM_ORDER[nextIndex];
  if (nextId === undefined) return;
  event.preventDefault();
  onSelect(nextId);
  focusCharacter(nextId);
}

/** Compact, controlled party context for all character-scoped views. */
export function CharacterSwitcher({ activeCharacterId, onSelect }: CharacterSwitcherProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Active character"
      className="grid grid-cols-3 gap-0.5 overflow-visible rounded-b-md border-x border-b border-border/50 bg-background/85 px-1 pb-1 pt-1.5"
    >
      {TEAM_ORDER.map((characterId) => {
        const active = characterId === activeCharacterId;
        const character = CHARACTERS[characterId];
        const RoleIcon = ROLE_ICON[character.role];

        return (
          <button
            key={characterId}
            id={`character-switcher-${characterId}`}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(characterId)}
            onKeyDown={(event) => handleCharacterKey(event, characterId, onSelect)}
            className={`group relative h-28 min-h-11 w-[4.667rem] min-w-11 justify-self-center overflow-visible text-center transition-[filter] motion-reduce:transition-none focus-visible:z-30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
              active ? 'text-accent-strong' : 'text-text-muted'
            }`}
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-[15.5%] top-[17%] bottom-[20.5%] overflow-hidden rounded-t-[999px] bg-surface-raised"
            >
              <img
                src={`/assets/portraits/${characterId}.png`}
                alt=""
                data-character-part="portrait"
                className={`size-full object-cover object-center transition-[filter,opacity] duration-150 motion-reduce:transition-none ${
                  active
                    ? 'brightness-100 saturate-100'
                    : 'opacity-80 brightness-[.55] grayscale saturate-50 group-hover:opacity-95 group-hover:brightness-75 group-hover:grayscale-0 group-focus-visible:opacity-95 group-focus-visible:brightness-75 group-focus-visible:grayscale-0'
                }`}
              />
              <span className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background/90 to-transparent" />
            </span>

            <img
              src="/assets/frames/character-portrait-frame.png"
              alt=""
              aria-hidden="true"
              data-character-part="frame"
              className={`pointer-events-none absolute inset-0 z-10 size-full object-fill transition-[filter,opacity] duration-150 motion-reduce:transition-none ${
                active
                  ? 'drop-shadow-[0_0_5px_rgba(245,158,11,0.55)]'
                  : 'opacity-75 brightness-[.65] grayscale group-hover:opacity-90 group-hover:brightness-75 group-hover:grayscale-0 group-focus-visible:opacity-90 group-focus-visible:brightness-75 group-focus-visible:grayscale-0'
              }`}
            />

            <RoleIcon
              aria-hidden="true"
              data-character-part="role-icon"
              className={`pointer-events-none absolute left-1/2 top-[5.5%] z-20 size-3.5 -translate-x-1/2 drop-shadow-[0_1px_2px_rgba(2,7,13,0.9)] ${
                active ? 'text-accent-strong' : 'text-text-muted'
              }`}
            />

            <span
              data-character-part="name"
              className="pointer-events-none absolute inset-x-[17%] top-[77.8%] z-20 flex h-[10%] items-center justify-center truncate px-0.5 font-display text-[0.625rem] font-semibold leading-none"
            >
              {character.name}
            </span>

            {active ? (
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
