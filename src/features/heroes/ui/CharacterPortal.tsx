import { CHARACTERS } from '@/game/characters/characters';
import type { CharacterId } from '@/game/types';
import { cn } from '@/shared/ui/utils/cn';

/**
 * Charakterportal der Stats-Ansicht: die freigestellte Ganzkörper-Figur steht in der
 * Bogenöffnung des Portal-Rahmens, der Name liegt als Live-Text auf der Steinfläche über dem
 * Bogen (UI.md §9).
 *
 * Geometrie am Asset vermessen (1086×1448, exakt 3:4): Die Bogenöffnung ist transparent von
 * x 232–851 (21,4 %–78,4 %) und y 321–1374 (22,2 %–94,9 %); ihr Spitzbogen läuft von der Spitze
 * bei y 321 bis zur vollen Breite bei y 619 und springt dabei direkt unter der Spitze weit auf —
 * 4 px darunter ist er schon 266 px breit, wo ein Halbkreis über der Öffnungsbreite nur 99 px
 * hätte. Die Hintergrundfläche ist darum ein Rechteck, das hinter dem Stein bis y 174 (12 %)
 * hochläuft; der Stein ist über dem Bogen von y 149 bis y 292 auf der ganzen Öffnungsbreite
 * deckend und schneidet die Bogenform selbst aus. Die Figur hat ihre eigene Box ab der
 * Bogenspitze, damit ihr Kopf nicht in den Rahmen ragt. Die dunkle Namensfläche liegt zwischen
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
      <span
        aria-hidden="true"
        data-character-part="backdrop"
        className="absolute inset-x-[21.5%] top-[12%] bottom-[5%] bg-linear-to-t from-background to-transparent"
      />
      <span className="absolute inset-x-[21.5%] top-[22.1%] bottom-[5%]">
        <img
          src={`/assets/figures/${characterId}.png`}
          alt={`${character.name} figure`}
          data-character-part="figure"
          className="size-full object-contain object-bottom"
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
