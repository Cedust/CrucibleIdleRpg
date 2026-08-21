// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useNavigationStore } from '@/app/navigationStore';
import { effectiveStatsFromSave } from '@/features/combat/engine/characterStats';
import { createDefaultSave, type SaveData } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { CRUCIBLE_IDS } from '@/game/crucible/crucible';
import { createArmorItem, createTeamArmor, innateValue } from '@/game/items/armor';
import { nodeById } from '@/game/weaponMastery/mastery';
import { useHeroesStore } from '../heroesStore';
import { HeroesScreen } from './HeroesScreen';
import { LoadoutPanel } from './LoadoutPanel';

/**
 * Geprüft wird der Loadout-Bereich: Auswahl und Detailkarte, Sperrbehandlung gesperrter
 * Armor-Slots und der Charakterwechsel über den geteilten Kontext. Zahlwerte stammen aus dem
 * Platzhalter-Balancing.
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
      sigils={save.sigils}
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

  it('macht freigeschaltete Slots auswählbar und zeigt Basis, Seltenheit, Item-Level und Sockel', async () => {
    const user = userEvent.setup();
    renderLoadout(saveWithArmoryRankTwo());

    await user.click(screen.getByRole('button', { name: 'Chest, Chest Armor +1' }));

    const detail = screen.getByTestId('loadout-detail');
    expect(within(detail).getByRole('heading', { name: 'Chest Armor +1' })).toBeInTheDocument();
    expect(within(detail).getByText('Base Item Type')).toBeInTheDocument();
    expect(within(detail).getByText('Rarity')).toBeInTheDocument();
    expect(within(detail).getByText('Common')).toBeInTheDocument();
    expect(within(detail).getByText('Item Level')).toBeInTheDocument();
    // Common +1 bis zum Cap der Seltenheit (+20); ohne Sockel.
    expect(within(detail).getByText('+1 / +20')).toBeInTheDocument();
    expect(within(detail).getByText('Sockets')).toBeInTheDocument();
    expect(within(detail).getByText('None')).toBeInTheDocument();
    expect(within(detail).getByText('+1 Toughness')).toBeInTheDocument();
    expect(within(detail).queryByText(/imprint/i)).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Chest, Chest Armor +1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Signature Weapon WARHAMMER' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('zeigt die persistierten Schichten eines ausgebauten Items: Seltenheit, Level-Cap und Sockelbelegung', async () => {
    const user = userEvent.setup();
    const base = saveWithArmoryRankTwo();
    const craftedChest = {
      ...createArmorItem('chest'),
      rarity: 'rare',
      itemLevel: 50,
      sockets: [{ color: 'amber', affix: 'critChance', gemLevel: 2, value: 0.05 }, null],
      prismaticSockets: [null],
    } as const;
    const save: SaveData = {
      ...base,
      armor: {
        ...base.armor,
        korvin: { ...base.armor.korvin, chest: craftedChest },
      },
    };

    renderLoadout(save);
    await user.click(screen.getByRole('button', { name: 'Chest, Chest Armor +50' }));

    const detail = screen.getByTestId('loadout-detail');
    expect(within(detail).getByRole('heading', { name: 'Chest Armor +50' })).toBeInTheDocument();
    expect(within(detail).getByText('Rare')).toBeInTheDocument();
    expect(within(detail).getByText('+50 / +60')).toBeInTheDocument();
    expect(within(detail).getByText(`+${innateValue(craftedChest)} Toughness`)).toBeInTheDocument();
    expect(within(detail).getByText('Socket 1')).toBeInTheDocument();
    expect(within(detail).getByText('+5% Crit Chance (Amber)')).toBeInTheDocument();
    expect(within(detail).getByText('Socket 2')).toBeInTheDocument();
    expect(within(detail).getByText('Prismatic Socket 1')).toBeInTheDocument();
    expect(within(detail).getAllByText('Empty')).toHaveLength(2);
  });

  it('shows a branded Armor Imprint without the Sigil Codex prefix', async () => {
    const user = userEvent.setup();
    const base = saveWithArmoryRankTwo();
    const chest = base.armor.korvin.chest;
    if (chest === undefined) throw new Error('Chest fehlt');
    const save: SaveData = {
      ...base,
      sigils: { 'sigil.burning-sentence': 3 },
      armor: {
        ...base.armor,
        korvin: {
          ...base.armor.korvin,
          chest: {
            ...chest,
            rarity: 'magic',
            sockets: [null],
            imprint: { sigilId: 'sigil.burning-sentence' },
          },
        },
      },
    };

    renderLoadout(save);
    await user.click(screen.getByRole('button', { name: 'Chest, Chest Armor +1' }));

    const detail = screen.getByTestId('loadout-detail');
    expect(within(detail).getByText('Imprint')).toBeInTheDocument();
    expect(within(detail).getByText('Burning Sentence · Level 3')).toBeInTheDocument();
    expect(within(detail).getByText('Critical Damage +12%')).toBeInTheDocument();
    expect(within(detail).queryByText('Sigil of Burning Sentence')).not.toBeInTheDocument();
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

  it('zeigt den Talisman weder als Ausrüstungs-Slot noch als Detailkarte', () => {
    renderLoadout(saveWithArmoryRankTwo());

    expect(screen.queryByLabelText('Talisman')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Talisman/ })).not.toBeInTheDocument();
    expect(screen.getByTestId('loadout-weapon-column')).toBeInTheDocument();
  });

  it('ist per Tastatur bedienbar und respektiert reduzierte Bewegung über transition-state', async () => {
    const user = userEvent.setup();
    renderLoadout(saveWithArmoryRankTwo());

    const weapon = screen.getByRole('button', { name: 'Signature Weapon WARHAMMER' });
    weapon.focus();
    await user.keyboard('{Enter}');
    expect(weapon).toHaveAttribute('aria-pressed', 'true');

    await user.tab();
    expect(screen.getByRole('button', { name: 'Chest, Chest Armor +1' })).toHaveFocus();
    await user.keyboard(' ');
    expect(
      within(screen.getByTestId('loadout-detail')).getByRole('heading', { name: 'Chest Armor +1' }),
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
