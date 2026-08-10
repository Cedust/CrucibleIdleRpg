import { Lock } from 'lucide-react';
import { ACT_1_DUNGEON_IDS, type Act1DungeonId } from '@/game/encounters/act1';
import { ACT_1_DUNGEON_DISPLAY_META } from '@/game/encounters/actMeta';
import { DUNGEON_BACKGROUND_CLASSES } from './dungeonBackgrounds';

interface DungeonSelectorProps {
  unlockedDungeonIds: readonly Act1DungeonId[];
  completedDungeons: Readonly<Record<Act1DungeonId, boolean>>;
  selectedDungeonId: Act1DungeonId;
  onSelect: (dungeonId: Act1DungeonId) => void;
}

/** Shows and selects every entrance; availability only controls whether a run may start. */
export function DungeonSelector({
  unlockedDungeonIds,
  completedDungeons,
  selectedDungeonId,
  onSelect,
}: DungeonSelectorProps) {
  return (
    // min-w-0 hebt das Fieldset-Default `min-inline-size: min-content` auf, sonst
    // schiebt die Kartenreihe den Auswahlbereich auf statt zu scrollen. Das Padding gibt den
    // per Outset überstehenden Frame-Spitzen Raum, die der Scroll-Container sonst clippt.
    <fieldset className="flex min-w-0 gap-4 overflow-x-auto p-2" aria-label="Dungeon selection">
      <legend className="sr-only">Choose a dungeon</legend>
      {ACT_1_DUNGEON_IDS.map((dungeonId) => {
        const meta = ACT_1_DUNGEON_DISPLAY_META[dungeonId];
        const selected = dungeonId === selectedDungeonId;
        const unlocked = unlockedDungeonIds.includes(dungeonId);
        const status = !unlocked
          ? 'LOCKED'
          : completedDungeons[dungeonId]
            ? 'COMPLETED'
            : 'AVAILABLE';

        return (
          <label
            key={dungeonId}
            className="group relative isolate flex h-74 w-40 shrink-0 cursor-pointer flex-col justify-between rounded-lg p-3 text-text has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
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
                selected ? '' : 'from-background/90 to-background/45'
              }`}
            />
            {/* Selektion = Frame in voller Stärke, alle anderen gedimmt. */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 border-image-thin transition-opacity ${
                selected
                  ? 'shadow-glow-accent'
                  : unlocked
                    ? 'opacity-60 group-hover:opacity-90'
                    : 'opacity-20'
              }`}
            />
            <input
              checked={selected}
              className="sr-only"
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
              {!unlocked && <Lock aria-hidden="true" className="size-4 text-text-muted" />}
              <span
                className={
                  status === 'COMPLETED'
                    ? 'text-success'
                    : status === 'AVAILABLE'
                      ? 'text-accent-strong'
                      : 'text-text-muted'
                }
              >
                {status}
              </span>
            </span>
            {selected && <span className="sr-only"> selected</span>}
          </label>
        );
      })}
    </fieldset>
  );
}
