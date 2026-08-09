import { Lock } from 'lucide-react';
import { ACT_1_DUNGEON_IDS, type Act1DungeonId } from '@/game/encounters/act1';
import { ACT_1_DUNGEON_DISPLAY_META } from '@/game/encounters/actMeta';
import { DUNGEON_BACKGROUND_CLASSES } from './dungeonBackgrounds';

interface DungeonSelectorProps {
  unlockedDungeonIds: readonly Act1DungeonId[];
  selectedDungeonId: Act1DungeonId;
  onSelect: (dungeonId: Act1DungeonId) => void;
}

/** Shows locked entrances too, but only persisted checkpoints can be selected. */
export function DungeonSelector({
  unlockedDungeonIds,
  selectedDungeonId,
  onSelect,
}: DungeonSelectorProps) {
  return (
    // min-w-0 hebt das Fieldset-Default `min-inline-size: min-content` auf, sonst
    // schiebt die Kartenreihe das Panel auf statt zu scrollen. Das Padding gibt den
    // per Outset überstehenden Frame-Spitzen Raum, die der Scroll-Container sonst clippt.
    <fieldset className="flex min-w-0 gap-4 overflow-x-auto p-2" aria-label="Dungeon selection">
      <legend className="sr-only">Choose a dungeon</legend>
      {ACT_1_DUNGEON_IDS.map((dungeonId) => {
        const meta = ACT_1_DUNGEON_DISPLAY_META[dungeonId];
        const selected = dungeonId === selectedDungeonId;
        const unlocked = unlockedDungeonIds.includes(dungeonId);

        return (
          <label
            key={dungeonId}
            className={`group relative isolate flex h-72 w-40 shrink-0 flex-col justify-between rounded-lg p-3 text-text has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
              unlocked ? 'cursor-pointer' : 'cursor-not-allowed'
            }`}
          >
            <div
              aria-hidden="true"
              className={`absolute inset-0 -z-20 rounded-md bg-surface bg-cover bg-center ${
                DUNGEON_BACKGROUND_CLASSES[meta.backgroundId]
              } ${unlocked ? '' : 'opacity-40'}`}
            />
            <div
              aria-hidden="true"
              className={`absolute inset-0 -z-10 rounded-md bg-linear-to-t ${
                selected
                  ? 'from-background/70 to-background/20'
                  : 'from-background/90 to-background/45'
              }`}
            />
            {/* Selektion = Frame in voller Stärke, alle anderen gedimmt. */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 border-image-thin transition-opacity ${
                selected ? '' : unlocked ? 'opacity-60 group-hover:opacity-90' : 'opacity-40'
              }`}
            />
            <input
              checked={selected}
              className="sr-only"
              disabled={!unlocked}
              name="dungeon"
              type="radio"
              value={dungeonId}
              onChange={() => onSelect(dungeonId)}
            />
            {/* Whitespace-Textknoten trennen die Spans im Accessible Name des Radios. */}
            <span className="flex flex-col gap-1 text-center">
              <span className="text-xs tracking-widest text-text-muted">{meta.label}</span>{' '}
              <span className="font-display text-display-sm">{meta.name}</span>
            </span>{' '}
            <span className="flex items-center justify-center gap-1.5 text-sm">
              {unlocked ? (
                <span className="text-accent">Open</span>
              ) : (
                <>
                  <Lock aria-hidden="true" className="size-4 text-text-muted" />
                  <span className="text-text-muted">Locked</span>
                </>
              )}
            </span>
            {selected && <span className="sr-only"> selected</span>}
          </label>
        );
      })}
    </fieldset>
  );
}
