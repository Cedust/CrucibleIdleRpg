import { CHARACTERS } from '@/game/characters/characters';
import type { CharacterId } from '@/game/types';
import { cn } from '@/shared/ui/utils/cn';

/**
 * Charakterportal der Stats-Ansicht: die freigestellte Ganzkörper-Figur steht in der
 * Bogenöffnung des Portal-Rahmens, der Name liegt als Live-Text auf der Steinfläche über dem
 * Bogen (UI.md §9).
 *
 * Geometrie am Asset vermessen (1086×1448, exakt 3:4): Die Bogenöffnung ist transparent von
 * x 232–851 (21,4 %–78,4 %) und y 320–1375 (22,1 %–94,9 %); ihr Bogen läuft von der Spitze bei
 * y 320 bis zur vollen Breite bei y 619 und entspricht damit fast genau einem Halbkreis über
 * der Öffnungsbreite — `rounded-t-[999px]` deckt ihn ab. Die dunkle Namensfläche liegt zwischen
 * dem oberen Steinbogen und dem Goldband bei y 91–256 (6,3 %–17,7 %) und ist auf Höhe des
 * Namens x 330–752 (30,4 %–69,2 %) breit; das Namensfeld schöpft sie aus, damit der Name in der
 * größten Display-Stufe darin steht.
 */
export function CharacterPortal({
  characterId,
  className,
}: {
  characterId: CharacterId;
  className?: string;
}) {
  const character = CHARACTERS[characterId];

  return (
    <div
      className={cn('relative mx-auto aspect-3/4 w-full max-w-portal', className)}
      data-testid="heroes-portal-frame"
    >
      <span className="absolute inset-x-[21.5%] top-[22.1%] bottom-[5%] overflow-hidden rounded-t-[999px] bg-linear-to-b from-surface-raised via-surface to-background">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-ember/20 to-transparent"
        />
        <img
          src={`/assets/figures/${characterId}.png`}
          alt={`${character.name} figure`}
          data-character-part="figure"
          className="relative size-full object-contain object-bottom"
        />
      </span>
      <img
        src="/assets/frames/character-portal-frame.png"
        alt=""
        aria-hidden="true"
        data-character-part="frame"
        className="pointer-events-none absolute inset-0 z-10 size-full object-fill"
      />
      <span
        data-character-part="name"
        className="pointer-events-none absolute inset-x-[30%] top-[7%] z-20 flex h-[9.5%] items-center justify-center leading-none"
      >
        <span className="truncate font-display text-display-lg text-accent-strong drop-shadow-text-contrast">
          {character.name}
        </span>
      </span>
    </div>
  );
}
