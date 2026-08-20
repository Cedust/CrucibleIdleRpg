import { useNavigationStore } from '@/app/navigationStore';
import { CHARACTERS } from '@/game/characters/characters';
import { effectiveStatsFromSave } from '@/features/combat/engine/characterStats';
import { useSaveStore } from '@/features/save/saveStore';
import { OrnateTab, OrnateTabs } from '@/shared/ui/controls/OrnateTabs';
import { ScreenHeader } from '@/shared/ui/layout/ScreenHeader';
import { ScreenLayout } from '@/shared/ui/layout/ScreenLayout';
import { useRovingFocus } from '@/shared/ui/utils/useRovingFocus';
import { HERO_AREAS, useHeroesStore, type HeroesArea } from '../heroesStore';
import { LoadoutPanel } from './LoadoutPanel';
import { StatsPanel } from './StatsPanel';

function HeroesTabs({
  activeArea,
  onSelect,
}: {
  activeArea: HeroesArea;
  onSelect: (area: HeroesArea) => void;
}) {
  const rovingProps = useRovingFocus({
    items: HERO_AREAS,
    selected: activeArea,
    onSelect,
    itemDomId: (area) => `heroes-tab-${area}`,
  });

  return (
    <OrnateTabs label="Heroes sections" className="grid-cols-2">
      {HERO_AREAS.map((area) => (
        <OrnateTab
          key={area}
          id={`heroes-tab-${area}`}
          selected={area === activeArea}
          controls={`heroes-panel-${area}`}
          onClick={() => onSelect(area)}
          {...rovingProps(area)}
        >
          {area === 'stats' ? 'Stats' : 'Loadout'}
        </OrnateTab>
      ))}
    </OrnateTabs>
  );
}

/** Character-scoped hub; the sole character selection remains in the shared sidebar. */
export function HeroesScreen() {
  const save = useSaveStore((state) => state.data);
  const characterId = useNavigationStore((state) => state.activeCharacterId);
  const activeArea = useHeroesStore((state) => state.activeArea);
  const setActiveArea = useHeroesStore((state) => state.setActiveArea);

  if (save === null) {
    return (
      <ScreenLayout background="heroes" scroll={false}>
        <p aria-live="polite" className="text-text-muted">
          Loading heroes…
        </p>
      </ScreenLayout>
    );
  }

  const character = CHARACTERS[characterId];

  return (
    <ScreenLayout background="heroes" scroll={false}>
      <section
        aria-label="Heroes"
        className="mx-auto flex min-h-0 w-full max-w-page flex-1 flex-col"
      >
        <ScreenHeader
          title="Heroes"
          intro={`Review ${character.name}'s current combat capabilities and prepare for the depths.`}
          className="mb-4 shrink-0"
        />
        <HeroesTabs activeArea={activeArea} onSelect={setActiveArea} />
        {activeArea === 'stats' ? (
          <StatsPanel key={characterId} characterId={characterId} save={save} />
        ) : (
          <LoadoutPanel
            characterId={characterId}
            stats={effectiveStatsFromSave(save, characterId)}
            masteryRanks={save.characters[characterId].masteryRanks}
            armor={save.armor[characterId]}
          />
        )}
      </section>
    </ScreenLayout>
  );
}
