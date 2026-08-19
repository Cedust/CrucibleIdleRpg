// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useNavigationStore } from '@/app/navigationStore';
import { createDefaultSave, type SaveData } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import {
  ATTUNE_GOLD_COST,
  attuneFodderCost,
  craftLootPrng,
  INLAY_GOLD_COST,
  RECUT_GOLD_COST,
  rollGem,
} from '@/game/crafting/jeweler';
import { createTeamArmor } from '@/game/items/armor';
import { gemValueRange } from '@/game/items/gems';
import type { ArmorItem } from '@/game/types';
import { useCraftingStore } from '../craftingStore';
import { JewelerScreen } from './JewelerScreen';

/** Schema-valid state: Jeweler unlocked behind Blacksmith, funds and gems for the inlay. */
function saveWithStation(armoryRank = 1): SaveData {
  const base = createDefaultSave(4242);
  const crucible = {
    'anvil.armory': armoryRank,
    'anvil.blacksmith': 1,
    'anvil.jeweler': 1,
  };
  return {
    ...base,
    currencies: { ...base.currencies, gold: 1000 },
    gems: { amber: 3, ruby: 2, sapphire: 1, emerald: 0, diamond: 0 },
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

/** Station mit einem Magic-Chest (ein leerer Sockel). */
function socketedSave(): SaveData {
  return withKorvinChest(saveWithStation(), { rarity: 'magic', sockets: [null] });
}

describe('JewelerScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    useNavigationStore.setState({ activeCharacterId: 'korvin' });
    useCraftingStore.setState({ selectedSlot: 'chest', jewelerTab: 'inlay' });
    saveStore.setState({ data: socketedSave(), status: 'ready' });
  });

  it('zeigt Gold- und alle Gem-Bestände dauerhaft, auch auf der gesperrten Station', () => {
    const base = createDefaultSave(4242);
    saveStore.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, gold: 123 },
        gems: { amber: 5, ruby: 4, sapphire: 3, emerald: 2, diamond: 1 },
      },
      status: 'ready',
    });
    render(<JewelerScreen />);

    const funds = within(screen.getByLabelText('Crafting funds'));
    expect(funds.getByLabelText('Gold amount')).toHaveTextContent('123');
    expect(funds.getByLabelText('Amber amount')).toHaveTextContent('5');
    expect(funds.getByLabelText('Ruby amount')).toHaveTextContent('4');
    expect(funds.getByLabelText('Sapphire amount')).toHaveTextContent('3');
    expect(funds.getByLabelText('Emerald amount')).toHaveTextContent('2');
    expect(funds.getByLabelText('Diamond amount')).toHaveTextContent('1');
    expect(screen.getByTestId('jeweler-locked')).toBeInTheDocument();
    expect(screen.getByText('The gem bench sits dark')).toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: 'Jeweler services' })).not.toBeInTheDocument();
  });

  it('trennt die Dienste in Tabs: Inlay startet aktiv, Werkbank und Slots bleiben in allen Tabs', async () => {
    const user = userEvent.setup();
    render(<JewelerScreen />);

    const tablist = within(screen.getByRole('tablist', { name: 'Jeweler services' }));
    expect(tablist.getByRole('tab', { name: 'Inlay', selected: true })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Inlay' })).toBeInTheDocument();

    await user.click(tablist.getByRole('tab', { name: 'Attune' }));
    expect(screen.getByRole('region', { name: 'Attune' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Inlay' })).not.toBeInTheDocument();
    // Werkbank und Slot-Auswahl bleiben in jedem Dienst-Tab bestehen.
    expect(screen.getByTestId('jeweler-stage')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Armor slot' })).toBeInTheDocument();

    await user.click(tablist.getByRole('tab', { name: 'Recut' }));
    expect(screen.getByRole('region', { name: 'Recut' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Inlay' })).not.toBeInTheDocument();
  });

  it('sockelt per Inlay: verbraucht einen Gem, zahlt Gold und zeigt den gebundenen Roll', async () => {
    const user = userEvent.setup();
    render(<JewelerScreen />);

    await user.click(screen.getByRole('button', { name: 'Inlay' }));

    const expected = rollGem('amber', craftLootPrng(4242, 0));
    expect(saveStore.getState().data?.armor.korvin.chest?.sockets[0]).toEqual(expected);
    expect(saveStore.getState().data?.gems.amber).toBe(2);
    expect(screen.getByLabelText('Gold amount')).toHaveTextContent(`${1000 - INLAY_GOLD_COST}`);
    expect(screen.getByLabelText('Amber amount')).toHaveTextContent('2');
    // Der Sockel auf der Werkbank trägt jetzt den gerollten Amber.
    const socket = screen.getByRole('radio', { name: /^Socket 1: Amber/ });
    expect(socket).toBeInTheDocument();
  });

  it('rollt aus dem Pool der gewählten Farbe und warnt vor dem Überschreiben', async () => {
    const user = userEvent.setup();
    render(<JewelerScreen />);

    await user.click(screen.getByRole('radio', { name: /Ruby/ }));
    expect(screen.getByRole('region', { name: 'Inlay' })).toHaveTextContent(
      'Crit Damage, Multi Hit Damage, Splash Damage, Counter Damage',
    );

    await user.click(screen.getByRole('button', { name: 'Inlay' }));
    expect(saveStore.getState().data?.armor.korvin.chest?.sockets[0]).toMatchObject({
      color: 'ruby',
    });

    // Der belegte Sockel kündigt den Verlust des gebundenen Gems an.
    expect(screen.getByRole('region', { name: 'Inlay' })).toHaveTextContent(
      'Socket 1 holds a bound Ruby — inlaying destroys it.',
    );
  });

  it('deaktiviert das Inlay bei leerem Farb-Bestand mit benanntem Grund', async () => {
    const user = userEvent.setup();
    render(<JewelerScreen />);

    await user.click(screen.getByRole('radio', { name: /Emerald/ }));

    const inlay = screen.getByRole('button', { name: 'Inlay' });
    expect(inlay).toBeDisabled();
    expect(inlay).toHaveAccessibleDescription('No Emerald in stock.');
  });

  it('deaktiviert das Inlay ohne Sockel mit Verweis auf das Masterwork', () => {
    saveStore.setState({ data: saveWithStation(), status: 'ready' });
    render(<JewelerScreen />);

    const inlay = screen.getByRole('button', { name: 'Inlay' });
    expect(inlay).toBeDisabled();
    expect(inlay).toHaveAccessibleDescription(
      'The piece has no sockets. Masterwork opens the first socket.',
    );
  });

  it('zeigt Prismatic-Sockel als Diamond-gebunden gesperrt', () => {
    saveStore.setState({
      data: withKorvinChest(saveWithStation(), {
        rarity: 'rare',
        itemLevel: 50,
        sockets: [null, null],
        prismaticSockets: [null],
      }),
      status: 'ready',
    });
    render(<JewelerScreen />);

    const prismatic = screen.getByTestId('jeweler-prismatic-socket');
    expect(prismatic).toHaveTextContent('Prismatic Socket 1');
    expect(prismatic).toHaveTextContent('Bound to Diamond gems');
    expect(prismatic).toHaveTextContent('Locked');
    // Prismatic ist kein Inlay-Ziel: nur die zwei normalen Sockel sind wählbar.
    const bench = within(screen.getByRole('radiogroup', { name: 'Socket' }));
    expect(bench.getAllByRole('radio')).toHaveLength(2);
  });

  it('attuned den gebundenen Gem: Level +1, Positions-Erhalt, Fodder und Gold gezahlt', async () => {
    // Emerald auf dem Range-Minimum: die relative Position 0 bleibt beim Attune erhalten.
    const gem = {
      color: 'emerald',
      affix: 'might',
      gemLevel: 1,
      value: gemValueRange('might', 1).min,
    } as const;
    const base = withKorvinChest(saveWithStation(), { rarity: 'magic', sockets: [gem] });
    saveStore.setState({
      data: { ...base, gems: { ...base.gems, emerald: 5 } },
      status: 'ready',
    });
    useCraftingStore.setState({ jewelerTab: 'attune' });
    const user = userEvent.setup();
    render(<JewelerScreen />);

    // Vorher-→-Nachher-Vorschau: Level 1 → 2 innerhalb des Magic-Caps.
    const panel = screen.getByRole('region', { name: 'Attune' });
    expect(panel).toHaveTextContent('1 / 2');
    expect(panel).toHaveTextContent('2 / 2');

    await user.click(screen.getByRole('button', { name: 'Attune' }));

    const attuned = saveStore.getState().data?.armor.korvin.chest?.sockets[0];
    expect(attuned).toMatchObject({ color: 'emerald', affix: 'might', gemLevel: 2 });
    expect(attuned?.value).toBeCloseTo(gemValueRange('might', 2).min, 10);
    expect(saveStore.getState().data?.gems.emerald).toBe(5 - attuneFodderCost(1));
    expect(screen.getByLabelText('Gold amount')).toHaveTextContent(`${1000 - ATTUNE_GOLD_COST}`);

    // Magic-Cap erreicht: der Button ist deaktiviert und nennt Masterwork als Weg.
    const attune = screen.getByRole('button', { name: 'Attune' });
    expect(attune).toBeDisabled();
    expect(attune).toHaveAccessibleDescription(
      'Gem level is at the Magic cap. Masterwork raises the cap.',
    );
  });

  it('deaktiviert Attune und Recut auf leeren Sockeln mit benanntem Grund', async () => {
    useCraftingStore.setState({ jewelerTab: 'attune' });
    const user = userEvent.setup();
    render(<JewelerScreen />);

    const attune = screen.getByRole('button', { name: 'Attune' });
    expect(attune).toBeDisabled();
    expect(attune).toHaveAccessibleDescription('The socket holds no gem.');

    await user.click(screen.getByRole('tab', { name: 'Recut' }));
    const recut = screen.getByRole('button', { name: 'Recut' });
    expect(recut).toBeDisabled();
    expect(recut).toHaveAccessibleDescription('The socket holds no gem.');
  });

  it('recuttet den Wert innerhalb der aktuellen Range über den Craft-Seed und zahlt Gold', async () => {
    const range = gemValueRange('barrier', 1);
    const gem = { color: 'sapphire', affix: 'barrier', gemLevel: 1, value: range.min } as const;
    saveStore.setState({
      data: withKorvinChest(saveWithStation(), { rarity: 'magic', sockets: [gem] }),
      status: 'ready',
    });
    useCraftingStore.setState({ jewelerTab: 'recut' });
    const user = userEvent.setup();
    render(<JewelerScreen />);

    await user.click(screen.getByRole('button', { name: 'Recut' }));

    const recut = saveStore.getState().data?.armor.korvin.chest?.sockets[0];
    const expected = range.min + craftLootPrng(4242, 0).next() * (range.max - range.min);
    expect(recut?.value).toBeCloseTo(expected, 10);
    expect(recut).toMatchObject({ color: 'sapphire', affix: 'barrier', gemLevel: 1 });
    expect(saveStore.getState().data?.craftCounter).toBe(1);
    expect(screen.getByLabelText('Gold amount')).toHaveTextContent(`${1000 - RECUT_GOLD_COST}`);
  });

  it('sockelt in den gewählten Sockel und behält andere Sockel unverändert', async () => {
    saveStore.setState({
      data: withKorvinChest(saveWithStation(), { rarity: 'rare', sockets: [null, null] }),
      status: 'ready',
    });
    const user = userEvent.setup();
    render(<JewelerScreen />);

    await user.click(screen.getByRole('radio', { name: 'Socket 2: Empty' }));
    await user.click(screen.getByRole('button', { name: 'Inlay' }));

    const sockets = saveStore.getState().data?.armor.korvin.chest?.sockets;
    expect(sockets?.[0]).toBeNull();
    expect(sockets?.[1]).toMatchObject({ color: 'amber' });
  });
});
