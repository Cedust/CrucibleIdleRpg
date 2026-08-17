// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useNavigationStore } from '@/app/navigationStore';
import { effectiveStatsFromSave } from '@/features/combat/engine/characterStats';
import { createDefaultSave, type SaveData } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { CRUCIBLE_IDS } from '@/game/crucible/crucible';
import { createTeamArmor } from '@/game/items/armor';
import { nodeById } from '@/game/weaponMastery/mastery';
import { useHeroesStore } from '../heroesStore';
import { HeroesScreen } from './HeroesScreen';
import { LoadoutPanel } from './LoadoutPanel';

/**
 * Geprüft wird der Loadout-Bereich aus Task 024: Auswahl und Detailkarte, Sperrbehandlung
 * gesperrter Armor-Slots, der auswählbare Talisman und der Charakterwechsel über den
 * geteilten Kontext. Zahlwerte stammen aus dem Platzhalter-Balancing.
 */

/** Save mit Armory-Rang 2: Chest und Legs offen, Head und Feet gesperrt. */
function saveWithArmoryRankTwo(): SaveData {
  const ranks = { [CRUCIBLE_IDS.armory]: 2 };
  return { ...createDefaultSave(42), crucible: ranks, armor: createTeamArmor(ranks) };
}

function renderLoadout(save: SaveData, characterId: 'korvin' | 'rhaya' | 'quinn' = 'korvin') {
  return render(
    <LoadoutPanel
      characterId={characterId}
      stats={effectiveStatsFromSave(save, characterId)}
      masteryRanks={save.characters[characterId].masteryRanks}
      armor={save.armor[characterId]}
    />,
  );
}

describe('LoadoutPanel', () => {
  it('zeigt die Signaturwaffe vorausgewählt mit effektiven Waffenwerten ohne Skilltree', () => {
    renderLoadout(saveWithArmoryRankTwo());

    const weapon = screen.getByRole('button', { name: 'Signature Weapon WARHAMMER' });
    expect(weapon).toHaveAttribute('aria-pressed', 'true');
    // Korvin: Attack 14, Range 0.7–1.3, Precision 0.7 (Platzhalter-Balancing).
    expect(within(weapon).getByText('9.8 – 18.2')).toBeInTheDocument();
    expect(within(weapon).getByText('70%')).toBeInTheDocument();

    const detail = screen.getByTestId('loadout-detail');
    expect(within(detail).getByRole('heading', { name: 'WARHAMMER' })).toBeInTheDocument();
    expect(within(detail).getByText('9.8 – 18.2')).toBeInTheDocument();
    expect(within(detail).getByText('70%')).toBeInTheDocument();
    expect(screen.queryByRole('tree')).not.toBeInTheDocument();
    expect(within(detail).queryByText(/rank/i)).not.toBeInTheDocument();
  });

  it('rechnet wirksame Weapon-Mastery-Effekte in die Waffenwerte ein', () => {
    const base = saveWithArmoryRankTwo();
    const perRank = nodeById('korvin', 'weapon.prc-i')?.perRank ?? 0;
    expect(perRank).toBeGreaterThan(0);
    const save: SaveData = {
      ...base,
      characters: {
        ...base.characters,
        korvin: {
          ...base.characters.korvin,
          level: 6,
          freeAttributePoints: 6,
          freeMasteryPoints: 3,
          masteryRanks: { 'weapon.prc-i': 3 },
        },
      },
    };

    renderLoadout(save);

    const detail = screen.getByTestId('loadout-detail');
    const expected = `${(0.7 + 3 * perRank) * 100}%`;
    expect(within(detail).getByText(expected)).toBeInTheDocument();
  });

  it('macht freigeschaltete Slots auswählbar und zeigt nur Basis, Item-Level und Innate', async () => {
    const user = userEvent.setup();
    renderLoadout(saveWithArmoryRankTwo());

    await user.click(screen.getByRole('button', { name: 'Chest, Chest Armor +1' }));

    const detail = screen.getByTestId('loadout-detail');
    expect(within(detail).getByRole('heading', { name: 'Chest Armor +1' })).toBeInTheDocument();
    expect(within(detail).getByText('Base Item Type')).toBeInTheDocument();
    expect(within(detail).getByText('Item Level')).toBeInTheDocument();
    expect(within(detail).getByText('+1 Toughness')).toBeInTheDocument();
    // Spätere Item-Schichten existieren in M3 nicht einmal als Platzhalter.
    expect(within(detail).queryByText(/common/i)).not.toBeInTheDocument();
    expect(within(detail).queryByText(/rarity/i)).not.toBeInTheDocument();
    expect(within(detail).queryByText(/socket/i)).not.toBeInTheDocument();
    expect(within(detail).queryByText(/implicit/i)).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Chest, Chest Armor +1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Signature Weapon WARHAMMER' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('sperrt nicht freigeschaltete Slots ohne Auswahl und ohne Detailkarte', () => {
    renderLoadout(saveWithArmoryRankTwo());

    const armorColumn = screen.getByTestId('loadout-armor-column');
    expect(within(armorColumn).getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /head/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /feet/i })).not.toBeInTheDocument();

    const lockedHead = armorColumn.querySelector('[data-loadout-slot="head"]');
    expect(lockedHead).toHaveAttribute('data-semantic', 'locked');
    expect(lockedHead).toHaveTextContent('Locked');
    // Die konkrete Freischaltung erklärt nur der Crucible-Inspector.
    expect(lockedHead).not.toHaveTextContent(/relic|armory|crucible/i);
  });

  it('ordnet die Armor-Säule anatomisch Head, Chest, Legs, Feet', () => {
    renderLoadout(saveWithArmoryRankTwo());

    const slots = [
      ...screen.getByTestId('loadout-armor-column').querySelectorAll('[data-loadout-slot]'),
    ].map((slot) => slot.getAttribute('data-loadout-slot'));
    expect(slots).toEqual(['head', 'chest', 'legs', 'feet']);
  });

  it('zeigt den Talisman als gesperrten, auswählbaren Ritual-Slot mit M5-Erklärung', async () => {
    const user = userEvent.setup();
    renderLoadout(saveWithArmoryRankTwo());

    const talisman = screen.getByRole('button', { name: 'Talisman, Locked' });
    expect(talisman).toHaveAttribute('data-semantic', 'locked');

    await user.click(talisman);

    expect(talisman).toHaveAttribute('aria-pressed', 'true');
    const detail = screen.getByTestId('loadout-detail');
    expect(within(detail).getByRole('heading', { name: 'Talisman' })).toBeInTheDocument();
    expect(within(detail).getByText(/Unlocks with Runes \(M5\)/)).toBeInTheDocument();
  });

  it('ist per Tastatur bedienbar und respektiert reduzierte Bewegung über transition-state', async () => {
    const user = userEvent.setup();
    renderLoadout(saveWithArmoryRankTwo());

    const talisman = screen.getByRole('button', { name: 'Talisman, Locked' });
    talisman.focus();
    await user.keyboard('{Enter}');
    expect(talisman).toHaveAttribute('aria-pressed', 'true');

    await user.tab();
    expect(screen.getByRole('button', { name: 'Signature Weapon WARHAMMER' })).toHaveFocus();
    await user.keyboard(' ');
    expect(
      within(screen.getByTestId('loadout-detail')).getByRole('heading', { name: 'WARHAMMER' }),
    ).toBeInTheDocument();

    for (const slot of screen.getByTestId('loadout-armor-column').querySelectorAll('button')) {
      expect(slot).toHaveClass('transition-state', 'motion-reduce:transition-none');
    }
  });

  it('folgt dem Charakterwechsel des geteilten Kontexts', () => {
    useNavigationStore.setState({ activeCharacterId: 'korvin' });
    useHeroesStore.setState({ activeArea: 'loadout' });
    const save = saveWithArmoryRankTwo();
    saveStore.setState({ data: save, status: 'ready' });
    render(<HeroesScreen />);

    expect(
      within(screen.getByTestId('loadout-detail')).getByRole('heading', { name: 'WARHAMMER' }),
    ).toBeInTheDocument();

    act(() => useNavigationStore.getState().setActiveCharacterId('rhaya'));

    const detail = screen.getByTestId('loadout-detail');
    expect(within(detail).getByRole('heading', { name: 'TWIN BLADES' })).toBeInTheDocument();
    // Rhaya: Attack 18, Range 0.8–1.2, Precision 0.8 (Platzhalter-Balancing).
    expect(within(detail).getByText('14.4 – 21.6')).toBeInTheDocument();
    expect(within(detail).getByText('80%')).toBeInTheDocument();
  });
});

describe('LoadoutPanel im Heroes-Screen', () => {
  beforeEach(() => {
    useNavigationStore.setState({ activeCharacterId: 'korvin' });
    useHeroesStore.setState({ activeArea: 'loadout' });
    saveStore.setState({ data: saveWithArmoryRankTwo(), status: 'ready' });
  });

  it('bleibt ein lokaler Bereich ohne eigenen Sidebar-Eintrag', () => {
    render(<HeroesScreen />);

    expect(screen.getByRole('tab', { name: 'Loadout' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'heroes-panel-loadout');
    expect(screen.getByTestId('loadout-armor-column')).toBeInTheDocument();
    expect(screen.queryByTestId('heroes-identity')).not.toBeInTheDocument();
  });
});
