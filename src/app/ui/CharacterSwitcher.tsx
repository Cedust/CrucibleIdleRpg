import type { KeyboardEvent } from 'react';
import { CHARACTERS, TEAM_ORDER } from '@/game/characters/characters';
import type { CharacterId } from '@/game/types';

interface CharacterSwitcherProps {
  activeCharacterId: CharacterId;
  onSelect: (characterId: CharacterId) => void;
}

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
      className="grid grid-cols-3 gap-1 px-2 py-2"
    >
      {TEAM_ORDER.map((characterId) => {
        const active = characterId === activeCharacterId;
        const character = CHARACTERS[characterId];

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
            className={`relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-md border px-1 py-1 text-center text-[0.625rem] font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              active
                ? 'border-accent bg-accent/10 text-accent-strong shadow-glow-accent'
                : 'border-border bg-surface/70 text-text-muted hover:border-ornament hover:text-text'
            }`}
          >
            <img
              src={`/assets/portraits/${characterId}.png`}
              alt=""
              className="size-7 rounded-sm object-cover"
            />
            <span className="truncate">{character.name}</span>
            {active ? (
              <span
                aria-hidden="true"
                className="absolute bottom-0 h-0.5 w-5 rounded-full bg-accent"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
