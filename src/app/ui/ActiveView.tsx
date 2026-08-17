import { useNavigationStore, VIEW_LABELS } from '../navigationStore';
import { CrucibleScreen } from '@/features/crucible/ui/CrucibleScreen';
import { DungeonSelectionScreen } from '@/features/dungeon/ui/DungeonSelectionScreen';
import { HeroesScreen } from '@/features/heroes/ui/HeroesScreen';
import { ScreenHeader } from '@/shared/ui/layout/ScreenHeader';
import { ScreenLayout } from '@/shared/ui/layout/ScreenLayout';
import { WeaponMasteryScreen } from '@/features/weaponMastery/ui/WeaponMasteryScreen';

/** Renders the currently selected normal-shell view. */
export function ActiveView() {
  const activeView = useNavigationStore((state) => state.activeView);

  switch (activeView) {
    case 'dungeons':
      return <DungeonSelectionScreen />;
    case 'crucible':
      return <CrucibleScreen />;
    case 'heroes':
      return <HeroesScreen />;
    case 'weapon-mastery':
      return <WeaponMasteryScreen />;
    default:
      return (
        <ScreenLayout>
          <PlaceholderView label={VIEW_LABELS[activeView]} />
        </ScreenLayout>
      );
  }
}

function PlaceholderView({ label }: { label: string }) {
  return (
    <section>
      <ScreenHeader title={label} />
      <p className="mt-2 text-text-muted">Coming soon.</p>
    </section>
  );
}
