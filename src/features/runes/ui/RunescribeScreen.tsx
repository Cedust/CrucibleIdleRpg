import { ScrollText, Sparkles } from 'lucide-react';
import { useNavigationStore } from '@/app/navigationStore';
import { CHARACTERS } from '@/game/characters/characters';
import { useSaveStore } from '@/features/save/saveStore';
import { ScreenHeader } from '@/shared/ui/layout/ScreenHeader';
import { ScreenLayout } from '@/shared/ui/layout/ScreenLayout';
import { RiteConfigurationPanel } from './RiteConfigurationPanel';

/** Character-bound Runescribe station for configuring one Talisman and its Rite. */
export function RunescribeScreen() {
  const save = useSaveStore((state) => state.data);
  const characterId = useNavigationStore((state) => state.activeCharacterId);
  const character = CHARACTERS[characterId];

  if (save === null) {
    return (
      <ScreenLayout background="runescribe">
        <p aria-live="polite" className="text-text-muted">
          Opening the Runescribe…
        </p>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout background="runescribe" scroll={false}>
      <section
        aria-label="Runescribe"
        className="mx-auto flex min-h-0 w-full max-w-page flex-1 flex-col"
      >
        <ScreenHeader
          title="Runescribe"
          intro={`The scribe tends ${character.name}'s engraved vessel. Bind a single Rite, then let its runes answer in the depths.`}
        >
          <dl className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <div className="flex items-center gap-1.5">
              <ScrollText aria-hidden="true" className="size-4 text-accent-strong" />
              <dt className="sr-only">Attuned character</dt>
              <dd className="font-display text-2xs tracking-[0.14em] text-text">
                {character.name}
              </dd>
            </div>
            <div className="flex items-center gap-1.5 text-text-muted">
              <Sparkles aria-hidden="true" className="size-4 text-arcane" />
              <dt className="sr-only">Rite configuration</dt>
              <dd className="font-display text-2xs tracking-[0.14em]">ONE TALISMAN · ONE RITE</dd>
            </div>
          </dl>
        </ScreenHeader>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-4 pr-1">
          <RiteConfigurationPanel key={characterId} characterId={characterId} />
        </div>
      </section>
    </ScreenLayout>
  );
}
