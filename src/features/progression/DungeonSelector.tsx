import { ACT_1_DUNGEON_IDS, type Act1DungeonId } from '@/game/encounters/act1';
import type { SaveData } from '@/features/save/saveSchema';

interface DungeonSelectorProps {
  save: SaveData;
  selectedDungeonId: Act1DungeonId;
  onSelect: (dungeonId: Act1DungeonId) => void;
}

/** Auswahl zeigt ausschließlich persistierte Checkpoints (PROGRESSION §4). */
export function DungeonSelector({ save, selectedDungeonId, onSelect }: DungeonSelectorProps) {
  const unlockedDungeonIds = ACT_1_DUNGEON_IDS.filter((id) => save.unlockedDungeonIds.includes(id));

  return (
    <fieldset className="flex flex-wrap gap-2" aria-label="Dungeon selection">
      <legend className="sr-only">Choose a dungeon</legend>
      {unlockedDungeonIds.map((dungeonId, index) => {
        const selected = dungeonId === selectedDungeonId;

        return (
          <label
            key={dungeonId}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text has-checked:border-accent has-checked:text-accent"
          >
            <input
              checked={selected}
              className="accent-accent"
              name="dungeon"
              type="radio"
              value={dungeonId}
              onChange={() => onSelect(dungeonId)}
            />
            <span>Dungeon {index + 1}</span>
            <span className="text-text-muted">{dungeonId}</span>
            {selected && <span className="sr-only">selected</span>}
          </label>
        );
      })}
    </fieldset>
  );
}
