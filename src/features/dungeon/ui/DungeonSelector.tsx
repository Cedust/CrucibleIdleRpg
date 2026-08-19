import { Check, Lock } from 'lucide-react';
import { ACT_1_DUNGEON_IDS, type Act1DungeonId } from '@/game/encounters/act1';
import { ACT_1_DUNGEON_DISPLAY_META } from '@/game/encounters/actMeta';
import { cn } from '@/shared/ui/utils/cn';
import { stateAttrs, transitionState } from '@/shared/ui/utils/state';
import { DUNGEON_BACKGROUND_CLASSES } from './dungeonBackgrounds';
import {
  GATE_ART_SRC,
  GATE_NUMERAL_POSITION_CLASSES,
  GATE_OPENING_CLASSES,
  gateVariantFor,
} from './gateArt';

/** Dungeon-Numerale auf der Tor-Raute; die Reihenfolge folgt ACT_1_DUNGEON_IDS. */
const DUNGEON_NUMERALS = ['I', 'II', 'III', 'IV', 'V'] as const;

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
    // min-w-0 hebt das Fieldset-Default `min-inline-size: min-content` auf; das
    // auto-fit-Grid streckt die Tore über die volle Zeilenbreite und bricht sie
    // bei schmalen Containern in neue Reihen um. Der horizontale Abstand lebt
    // als px-4 in den Kacheln (statt gap-x), damit die Pfadsegmente sich an der
    // gemeinsamen Kachelkante berühren, ohne das Fieldset zu überlaufen.
    <fieldset
      className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-y-4"
      aria-label="Dungeon selection"
    >
      <legend className="sr-only">Choose a dungeon</legend>
      {ACT_1_DUNGEON_IDS.map((dungeonId, index) => {
        const meta = ACT_1_DUNGEON_DISPLAY_META[dungeonId];
        const variant = gateVariantFor(dungeonId);
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
            {...stateAttrs({ selected, semantic: unlocked ? 'normal' : 'locked' })}
            className={cn(
              'group flex min-w-0 cursor-pointer flex-col items-center gap-2 px-4 py-2 text-text',
              transitionState,
              'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-state-focus',
            )}
          >
            <input
              checked={selected}
              className="sr-only"
              name="dungeon"
              type="radio"
              value={dungeonId}
              onChange={() => onSelect(dungeonId)}
            />
            {/* Whitespace-Textknoten trennen die Spans im Accessible Name des Radios. */}
            <span className="sr-only">{meta.label}</span>{' '}
            {/* Tor-Kunst im @container-Wrapper: cqw-Maße folgen der Kachelbreite.
                Der Aspect folgt dem höchsten Crop (gate-boss-open, 517×604), die
                Tore sind top-verankert; das Numerale-Overlay sitzt auf dem
                Rauten-Zentrum der jeweiligen Tor-Variante (gateArt.ts). */}
            <span
              aria-hidden="true"
              className={cn(
                '@container relative mx-auto block aspect-517/604 w-full max-w-gate-art',
                transitionState,
                selected && 'scale-105',
              )}
            >
              {/* Dungeon-Hintergrund hinter der transparenten Bogen-Öffnung des
                  offenen Tors; der opake Stein verdeckt den Überhang des
                  Rechtecks (GATE_OPENING_CLASSES, gateArt.ts). */}
              {unlocked && (
                <span
                  className={cn(
                    'absolute bg-cover bg-center',
                    GATE_OPENING_CLASSES[variant],
                    DUNGEON_BACKGROUND_CLASSES[meta.backgroundId],
                  )}
                />
              )}
              {/* Enger Kontur-Glow statt des flächigen Halos: Die Tor-Silhouette
                  bekommt eine schmale Goldlinie. Der Drop-Shadow liegt auf dem
                  img selbst, damit das Bild den eigenen Schatten auch bei
                  gedimmter Opacity verdeckt und das Asset ungefärbt bleibt. */}
              <img
                src={GATE_ART_SRC[variant][unlocked ? 'open' : 'locked']}
                alt=""
                className={cn(
                  'absolute inset-x-0 top-0 w-full',
                  transitionState,
                  selected && 'drop-shadow-[0_0_3px_var(--color-accent)]',
                  // Hover-Affordance auf dem Art-Layer: offene Tore hellen auf,
                  // gedimmte gesperrte Tore heben ihre Opacity (CharacterSwitcher-Muster).
                  unlocked
                    ? 'group-hover:brightness-110'
                    : 'opacity-(--state-deemphasis-weak) group-hover:opacity-100',
                )}
              />
              <span
                className={cn(
                  'absolute -translate-y-1/2 font-display text-[7cqw] text-accent-strong drop-shadow-text-contrast',
                  GATE_NUMERAL_POSITION_CLASSES[variant][unlocked ? 'open' : 'locked'],
                )}
              >
                {DUNGEON_NUMERALS[index]}
              </span>
            </span>{' '}
            {/* min-h-[2lh] reserviert zwei Namenszeilen, damit die Pfad-Zeile
                aller Tore auf einer Linie steht. */}
            <span
              className={cn(
                'min-h-[2lh] text-center font-display text-display-sm',
                selected && 'text-accent-strong',
              )}
            >
              {meta.name}
            </span>{' '}
            {/* Akt-Pfad (Draft v5): Gold-Linie von Tor zu Tor mit Status-Medaillon.
                Die Segmente reichen durch das px-4-Kachel-Padding exakt bis zur
                Kachelkante und treffen dort das Segment des Nachbartors (gap-x = 0);
                der Verlauf dimmt zur Kante hin und markiert so die Tor-Übergänge. */}
            <span aria-hidden="true" className="relative flex w-full items-center justify-center">
              {index > 0 && (
                <span className="absolute top-1/2 right-1/2 h-px w-[calc(50%+1rem)] -translate-y-1/2 bg-linear-to-r from-accent/25 to-accent/55" />
              )}
              {index < ACT_1_DUNGEON_IDS.length - 1 && (
                <span className="absolute top-1/2 left-1/2 h-px w-[calc(50%+1rem)] -translate-y-1/2 bg-linear-to-r from-accent/55 to-accent/25" />
              )}
              <span
                className={cn(
                  'relative flex size-8 items-center justify-center rounded-full border bg-background/80',
                  status === 'LOCKED' && 'border-ornament/50 text-text-muted',
                  status === 'COMPLETED' && 'border-success/60 text-success',
                  status === 'AVAILABLE' && 'border-accent/60 text-accent',
                )}
              >
                {status === 'LOCKED' && <Lock className="size-4" />}
                {status === 'COMPLETED' && <Check className="size-4" />}
                {status === 'AVAILABLE' && <span className="size-2 rotate-45 bg-accent" />}
              </span>
            </span>
            <span className="sr-only"> {status}</span>
            {selected && <span className="sr-only"> selected</span>}
          </label>
        );
      })}
    </fieldset>
  );
}
