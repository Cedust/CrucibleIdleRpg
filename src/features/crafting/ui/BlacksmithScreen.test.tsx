// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useNavigationStore } from '@/app/navigationStore';
import { createDefaultSave, type SaveData } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { masterworkCost, temperGoldCost } from '@/game/crafting/blacksmith';
import { createTeamArmor, innateValue } from '@/game/items/armor';
import type { ArmorItem } from '@/game/types';
import { useCraftingStore } from '../craftingStore';
import { BlacksmithScreen } from './BlacksmithScreen';

/** Schema-valid state: Blacksmith unlocked behind Armory, funds for both actions. */
function saveWithStation(armoryRank = 1): SaveData {
  const base = createDefaultSave(4242);
  const crucible = { 'anvil.armory': armoryRank, 'anvil.blacksmith': 1 };
  return {
    ...base,
    currencies: { ...base.currencies, gold: 1000, cinder: 2 },
    crucible,
    armor: createTeamArmor(crucible),
  };
}

function withKorvinChest(save: SaveData, patch: Partial<ArmorItem>): SaveData {
  const chest = save.armor.korvin.chest;
  if (chest === undefined) throw new Error('Chest fehlt');
  return {
    ...save,
    armor: { ...save.armor, korvin: { ...save.armor.korvin, chest: { ...chest, ...patch } } },
  };
}

describe('BlacksmithScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    useNavigationStore.setState({ activeCharacterId: 'korvin' });
    useCraftingStore.setState({ selectedSlot: 'chest', activeTab: 'temper' });
    saveStore.setState({ data: saveWithStation(), status: 'ready' });
  });

  it('zeigt Gold- und Cinder-Bestand dauerhaft, auch auf der gesperrten Station', () => {
    const base = createDefaultSave(4242);
    saveStore.setState({
      data: { ...base, currencies: { ...base.currencies, gold: 123, cinder: 4 } },
      status: 'ready',
    });
    render(<BlacksmithScreen />);

    const funds = within(screen.getByLabelText('Crafting funds'));
    expect(funds.getByLabelText('Gold amount')).toHaveTextContent('123');
    expect(funds.getByLabelText('Cinder amount')).toHaveTextContent('4');
    expect(screen.getByTestId('blacksmith-locked')).toBeInTheDocument();
    expect(screen.getByText('The forge lies cold')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Armor slot' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Temper' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: 'Blacksmith services' })).not.toBeInTheDocument();
  });

  it('trennt die Dienste in Tabs: Temper startet aktiv, Brand bleibt Platzhalter', async () => {
    const user = userEvent.setup();
    render(<BlacksmithScreen />);

    const tablist = within(screen.getByRole('tablist', { name: 'Blacksmith services' }));
    expect(tablist.getByRole('tab', { name: 'Temper', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Temper' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Masterwork' })).not.toBeInTheDocument();

    await user.click(tablist.getByRole('tab', { name: 'Masterwork' }));
    expect(screen.getByRole('region', { name: 'Masterwork' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Temper' })).not.toBeInTheDocument();
    // Werkstück und Slot-Auswahl bleiben in beiden Dienst-Tabs bestehen.
    expect(screen.getByTestId('blacksmith-stage')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Armor slot' })).toBeInTheDocument();

    await user.click(tablist.getByRole('tab', { name: 'Brand' }));
    expect(screen.getByRole('tabpanel', { name: 'Brand' })).toHaveTextContent(
      'The branding iron rests in the coals — Sigil brands arrive with a later update.',
    );
    expect(screen.queryByTestId('blacksmith-stage')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Temper' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Masterwork' })).not.toBeInTheDocument();
  });

  it('wählt Slot aus: Chest ist vorausgewählt, gesperrte Slots sind markiert', () => {
    render(<BlacksmithScreen />);

    const group = screen.getByRole('radiogroup', { name: 'Armor slot' });
    expect(within(group).getByRole('radio', { name: /Chest/ })).toBeChecked();
    // Armory Rang 1: Legs, Head und Feet erscheinen als gesperrte Zeilen ohne Aktion.
    expect(within(group).getAllByText('Locked')).toHaveLength(3);

    const stage = screen.getByTestId('blacksmith-stage');
    expect(within(stage).getByRole('heading', { name: 'Chest Armor [1]' })).toBeInTheDocument();
  });

  it('navigiert die Slot-Auswahl per Pfeiltaste (Roving Focus)', async () => {
    saveStore.setState({ data: saveWithStation(4), status: 'ready' });
    const user = userEvent.setup();
    render(<BlacksmithScreen />);

    const chest = screen.getByRole('radio', { name: /Chest/ });
    chest.focus();
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('radio', { name: /Legs/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Legs/ })).toHaveFocus();
    const stage = screen.getByTestId('blacksmith-stage');
    expect(within(stage).getByRole('heading', { name: 'Legguards [1]' })).toBeInTheDocument();
  });

  it('behält den gewählten Slot beim Tab-Wechsel (session-only)', async () => {
    saveStore.setState({ data: saveWithStation(4), status: 'ready' });
    const user = userEvent.setup();
    render(<BlacksmithScreen />);

    await user.click(screen.getByRole('radio', { name: /Legs/ }));
    await user.click(screen.getByRole('tab', { name: 'Masterwork' }));

    expect(screen.getByRole('radio', { name: /Legs/ })).toBeChecked();
    expect(
      within(screen.getByTestId('blacksmith-stage')).getByRole('heading', {
        name: 'Legguards [1]',
      }),
    ).toBeInTheDocument();
  });

  it('tempert um genau eine Stufe, zeigt den wachsenden Innate-Wert und zahlt Gold', async () => {
    saveStore.setState({
      data: withKorvinChest(saveWithStation(), { itemLevel: 5 }),
      status: 'ready',
    });
    const user = userEvent.setup();
    render(<BlacksmithScreen />);

    const chest = saveStore.getState().data?.armor.korvin.chest;
    if (chest === undefined) throw new Error('Chest fehlt');
    const preview = within(screen.getByRole('region', { name: 'Temper' }));
    const innateRow = preview.getByText('Toughness').closest('div');
    expect(innateRow).toHaveTextContent(`+${innateValue(chest)}`);
    expect(innateRow).toHaveTextContent(`+${innateValue({ ...chest, itemLevel: 6 })}`);

    await user.click(screen.getByRole('button', { name: 'Temper' }));

    expect(
      within(screen.getByTestId('blacksmith-stage')).getByRole('heading', {
        name: 'Chest Armor [6]',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Gold amount')).toHaveTextContent(`${1000 - temperGoldCost(5)}`);
    expect(saveStore.getState().data?.armor.korvin.chest?.itemLevel).toBe(6);
  });

  it('deaktiviert Temper am Seltenheits-Cap und begründet den Zustand zugänglich', () => {
    saveStore.setState({
      data: withKorvinChest(saveWithStation(), { itemLevel: 20 }),
      status: 'ready',
    });
    render(<BlacksmithScreen />);

    const temper = screen.getByRole('button', { name: 'Temper' });
    expect(temper).toBeDisabled();
    expect(temper).toHaveAccessibleDescription(
      'Item level is at the Common cap. Masterwork raises the cap.',
    );
  });

  it('deaktiviert unbezahlbare Aktionen und nennt die fehlenden Kosten', async () => {
    const base = saveWithStation();
    saveStore.setState({
      data: { ...base, currencies: { ...base.currencies, gold: 0, cinder: 0 } },
      status: 'ready',
    });
    const user = userEvent.setup();
    render(<BlacksmithScreen />);

    const temper = screen.getByRole('button', { name: 'Temper' });
    expect(temper).toBeDisabled();
    expect(temper).toHaveAccessibleDescription('Not enough Gold.');

    await user.click(screen.getByRole('tab', { name: 'Masterwork' }));
    const masterwork = screen.getByRole('button', { name: 'Masterwork' });
    expect(masterwork).toBeDisabled();
    expect(masterwork).toHaveAccessibleDescription('Not enough Gold and Cinder.');
  });

  it('masterworkt zur nächsten Seltenheit, öffnet einen Sockel und zahlt Cinder plus Gold', async () => {
    useCraftingStore.setState({ activeTab: 'masterwork' });
    const user = userEvent.setup();
    render(<BlacksmithScreen />);

    const masterworkRegion = screen.getByRole('region', { name: 'Masterwork' });
    expect(within(masterworkRegion).getByText('Common')).toBeInTheDocument();
    expect(within(masterworkRegion).getByText('Magic')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Masterwork' }));

    const item = saveStore.getState().data?.armor.korvin.chest;
    expect(item).toMatchObject({ rarity: 'magic', itemLevel: 1 });
    expect(item?.sockets).toEqual([null]);
    const cost = masterworkCost('common');
    expect(screen.getByLabelText('Cinder amount')).toHaveTextContent(`${2 - (cost?.cinder ?? 0)}`);
    expect(screen.getByLabelText('Gold amount')).toHaveTextContent(`${1000 - (cost?.gold ?? 0)}`);
    const stage = screen.getByTestId('blacksmith-stage');
    expect(within(stage).getByRole('list', { name: 'Sockets' }).children).toHaveLength(1);
    expect(within(stage).getByText('Socket 1: Empty')).toBeInTheDocument();
  });

  it('deaktiviert Masterwork auf Legendary mit Begründung', () => {
    useCraftingStore.setState({ activeTab: 'masterwork' });
    saveStore.setState({
      data: withKorvinChest(saveWithStation(), {
        rarity: 'legendary',
        sockets: [null, null, null, null],
      }),
      status: 'ready',
    });
    render(<BlacksmithScreen />);

    const masterwork = screen.getByRole('button', { name: 'Masterwork' });
    expect(masterwork).toBeDisabled();
    expect(masterwork).toHaveAccessibleDescription('Legendary is the highest rarity.');
  });
});
