// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSave, type SaveData } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { createTeamArmor } from '@/game/items/armor';
import { CrucibleScreen } from './CrucibleScreen';

/** Schema-valid state: completed first dungeon, Relic Shards and invested Smelting ranks. */
function saveWithInvestment(): SaveData {
  const base = createDefaultSave(4242);
  return {
    ...base,
    currencies: { ...base.currencies, relicShards: 5 },
    crucible: { 'smelting.overpower': 2 },
    completedDungeons: { ...base.completedDungeons, 'A1-D1': true },
  };
}

function nodeButton(container: HTMLElement, name: string) {
  return within(container).getByRole('button', { name: new RegExp(`^${name},`) });
}

describe('CrucibleScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    saveStore.setState({ data: createDefaultSave(4242), status: 'ready' });
  });

  it('renders every tree with its real prerequisite topology', async () => {
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    const trees = screen.getByRole('tablist', { name: 'Trees' });
    expect(trees).toHaveAttribute('aria-orientation', 'horizontal');
    for (const label of ['ANVIL SPARKS', 'SMELTING FLAMES', 'MOLTEN CAST']) {
      expect(within(trees).getByRole('tab', { name: label })).toBeInTheDocument();
    }
    const anvilTab = screen.getByRole('tab', { name: 'ANVIL SPARKS' });
    const smeltingTab = screen.getByRole('tab', { name: 'SMELTING FLAMES' });
    const moltenTab = screen.getByRole('tab', { name: 'MOLTEN CAST' });
    expect(anvilTab).toHaveAttribute('data-selected');
    expect(anvilTab).toHaveAttribute('aria-selected', 'true');
    expect(smeltingTab).not.toHaveAttribute('data-selected');
    expect(moltenTab).not.toHaveAttribute('data-selected');
    expect(trees).toHaveClass('ornate-tab-bar');
    expect(anvilTab.querySelector('[data-ornate-tab-selection]')).toHaveClass(
      'ornate-tab-selection',
    );
    expect(anvilTab.querySelector('[class*="crucible-tree-anvil.png"]')).toBeInTheDocument();
    expect(smeltingTab.querySelector('[class*="crucible-tree-smelting.png"]')).toBeInTheDocument();
    expect(moltenTab.querySelector('[class*="crucible-tree-molten.png"]')).toBeInTheDocument();
    expect(within(trees).queryByRole('tab', { name: 'MASTERWORK' })).not.toBeInTheDocument();
    const crucibleIntro = screen.getByText(
      'Beneath the ruined kingdom, the ancient Crucible still burns. Relic Shards reclaimed from conquered depths can be melted down and forged into new strength.',
    );
    expect(crucibleIntro).toBeInTheDocument();
    expect(crucibleIntro.closest('p')).toHaveClass('font-intro');
    expect(screen.getByText('0 Relic Shards', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText(/Relic Shards available/)).not.toBeInTheDocument();

    const anvil = screen.getByRole('tabpanel', { name: 'ANVIL SPARKS' });
    for (const name of [
      'Waystones',
      'Armory',
      'Blacksmith',
      'Jeweler',
      'Rune Grimoire',
      'Talisman',
      'Runic Focus',
      'Rune Mastery',
    ]) {
      expect(nodeButton(anvil, name)).toBeInTheDocument();
    }
    expect(within(anvil).getByRole('heading', { name: 'ANVIL SPARKS' })).toHaveClass('sr-only');

    const dungeons = within(anvil).getByRole('region', { name: 'DUNGEONS' });
    expect(nodeButton(dungeons, 'Waystones')).toBeInTheDocument();

    const crafting = within(anvil).getByRole('region', { name: 'CRAFTING' });
    for (const name of ['Armory', 'Blacksmith', 'Jeweler']) {
      expect(nodeButton(crafting, name)).toBeInTheDocument();
    }

    const runes = within(anvil).getByRole('region', { name: 'RUNES' });
    for (const name of ['Rune Grimoire', 'Talisman', 'Runic Focus', 'Rune Mastery']) {
      expect(nodeButton(runes, name)).toBeInTheDocument();
    }
    expect(anvil.querySelectorAll('[data-connection]')).toHaveLength(5);
    expect(
      anvil.querySelector('[data-connection="anvil.armory->anvil.blacksmith"]'),
    ).not.toBeNull();
    expect(
      anvil.querySelector('[data-connection="anvil.blacksmith->anvil.jeweler"]'),
    ).not.toBeNull();
    expect(
      anvil.querySelector('[data-connection="anvil.rune-grimoire->anvil.talisman"]'),
    ).not.toBeNull();
    expect(
      anvil.querySelector('[data-connection="anvil.rune-grimoire->anvil.rune-mastery"]'),
    ).not.toBeNull();
    expect(
      anvil.querySelector('[data-connection="anvil.talisman->anvil.runic-focus"]'),
    ).not.toBeNull();

    await user.click(screen.getByRole('tab', { name: 'SMELTING FLAMES' }));
    const smelting = screen.getByRole('tabpanel', { name: 'SMELTING FLAMES' });
    for (const name of ['Overpower', 'Iron Skin', 'Unyielding', 'Quick Step']) {
      expect(nodeButton(smelting, name)).toBeInTheDocument();
    }
    const attributes = within(smelting).getByRole('region', { name: 'ATTRIBUTES' });
    for (const name of ['Overpower', 'Iron Skin', 'Unyielding', 'Quick Step']) {
      expect(nodeButton(attributes, name)).toBeInTheDocument();
    }
    expect(smelting.querySelectorAll('[data-connection]')).toHaveLength(0);

    await user.click(screen.getByRole('tab', { name: 'MOLTEN CAST' }));
    const molten = screen.getByRole('tabpanel', { name: 'MOLTEN CAST' });
    for (const name of [
      'Mitigation',
      'Sunder',
      'Suppression',
      'Rally',
      'Ambush',
      'Menace',
      'Momentum',
      'Second Wind',
    ]) {
      expect(nodeButton(molten, name)).toBeInTheDocument();
    }
    const combatArts = within(molten).getByRole('region', { name: 'COMBAT ARTS' });
    for (const name of ['Mitigation', 'Sunder', 'Suppression', 'Ambush', 'Menace', 'Momentum']) {
      expect(nodeButton(combatArts, name)).toBeInTheDocument();
    }
    const survival = within(molten).getByRole('region', { name: 'SURVIVAL' });
    expect(nodeButton(survival, 'Rally')).toBeInTheDocument();
    expect(nodeButton(survival, 'Second Wind')).toBeInTheDocument();
    expect(molten.querySelectorAll('[data-connection]')).toHaveLength(4);
  });

  it('distinguishes locked, available, invested, insufficient and max states without color', async () => {
    const base = createDefaultSave(4242);
    saveStore.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, relicShards: 2 },
        crucible: {
          'smelting.overpower': 2,
          'smelting.unyielding': 5,
          'smelting.quick-step': 1,
        },
      },
      status: 'ready',
    });
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    const armory = screen.getByRole('button', { name: /Armory, rank 0 of 4, Available/ });
    expect(armory).toHaveAttribute('data-availability', 'available');

    await user.click(screen.getByRole('tab', { name: 'SMELTING FLAMES' }));
    expect(
      screen.getByRole('button', { name: /Overpower, rank 2 of 5, Needs 3 Relic Shards/ }),
    ).toHaveAttribute('data-availability', 'insufficient');
    const ironSkin = screen.getByRole('button', { name: /Iron Skin, rank 0 of 5, Available/ });
    expect(ironSkin).toHaveAttribute('data-availability', 'available');
    expect(ironSkin).not.toHaveAttribute('data-semantic');
    expect(screen.getByRole('button', { name: /Unyielding, rank 5 of 5, Max/ })).toHaveAttribute(
      'data-availability',
      'max',
    );
    expect(
      screen.getByRole('button', { name: /Quick Step, rank 1 of 5, Next rank available/ }),
    ).toHaveAttribute('data-availability', 'available');
    for (const status of [
      'Locked',
      'Available',
      'Next rank available',
      'Needs 3 Relic Shards',
      'Max',
    ]) {
      expect(screen.queryByText(status, { exact: true })).not.toBeInTheDocument();
    }
  });

  it('reflects prerequisite ranks in connection state without using the Relic Shard balance', async () => {
    const base = createDefaultSave(4242);
    saveStore.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, relicShards: 0 },
        crucible: { 'molten.sunder': 1 },
      },
      status: 'ready',
    });
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    await user.click(screen.getByRole('tab', { name: 'MOLTEN CAST' }));
    const molten = screen.getByRole('tabpanel', { name: 'MOLTEN CAST' });
    expect(
      molten.querySelector('[data-connection="molten.sunder->molten.ambush"]'),
    ).toHaveAttribute('data-state', 'unlocked');
    expect(
      molten.querySelector('[data-connection="molten.mitigation->molten.menace"]'),
    ).toHaveAttribute('data-state', 'locked');
  });

  it('selects locked future nodes without mutating the save and names their lock reason', async () => {
    const before = saveStore.getState().data;
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    await user.click(screen.getByRole('button', { name: /Blacksmith, rank 0 of 1, Locked/ }));

    expect(screen.getByRole('heading', { name: 'Blacksmith' })).toBeInTheDocument();
    expect(screen.getByText('Locked until Crafting (M4).')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invest' })).toBeDisabled();
    expect(saveStore.getState().data).toEqual(before);
  });

  it('names the next team-wide Armory slot and its rank cost in the inspector', async () => {
    const base = createDefaultSave(4242);
    saveStore.setState({
      data: {
        ...base,
        currencies: { ...base.currencies, relicShards: 10 },
        crucible: { 'anvil.armory': 2 },
        armor: createTeamArmor({ 'anvil.armory': 2 }),
      },
      status: 'ready',
    });
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    await user.click(
      screen.getByRole('button', { name: /Armory, rank 2 of 4, Next rank available/ }),
    );

    expect(screen.getByText('Next unlock')).toBeInTheDocument();
    expect(screen.getByText('Head for all characters')).toBeInTheDocument();
    expect(screen.getByText('3 Relic Shards')).toBeInTheDocument();
  });

  it('purchases an affordable node only through the inspector action', async () => {
    const base = createDefaultSave(4242);
    saveStore.setState({
      data: { ...base, currencies: { ...base.currencies, relicShards: 3 } },
      status: 'ready',
    });
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    await user.click(screen.getByRole('tab', { name: 'SMELTING FLAMES' }));
    await user.click(screen.getByRole('button', { name: /Overpower, rank 0 of 5, Available/ }));
    expect(saveStore.getState().data?.crucible).toEqual({});

    const invest = screen.getByRole('button', { name: 'Invest' });
    expect(invest).toBeEnabled();
    await user.click(invest);

    await vi.waitFor(() =>
      expect(saveStore.getState().data?.crucible['smelting.overpower']).toBe(1),
    );
    expect(saveStore.getState().data?.currencies.relicShards).toBe(2);
  });

  it('executes the free tree respec through its modal dialog and cancels without changes', async () => {
    saveStore.setState({ data: saveWithInvestment(), status: 'ready' });
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    await user.click(screen.getByRole('tab', { name: 'SMELTING FLAMES' }));

    const smelting = screen.getByRole('tabpanel', { name: 'SMELTING FLAMES' });
    await user.click(within(smelting).getByRole('button', { name: 'RESPEC' }));
    const dialog = screen.getByRole('dialog', { name: 'Confirm Tree Respec' });
    expect(
      within(dialog).getByText(
        'Removes all ranks of this tree and refunds 3 Relic Shards. Free of charge.',
      ),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(saveStore.getState().data?.crucible).toEqual({ 'smelting.overpower': 2 });

    await user.click(within(smelting).getByRole('button', { name: 'RESPEC' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Respec' }));

    await vi.waitFor(() => expect(saveStore.getState().data?.crucible).toEqual({}));
    expect(saveStore.getState().data?.currencies.relicShards).toBe(8);
  });

  it('omits Anvil respec and disables it for empty flexible trees', async () => {
    saveStore.setState({ data: saveWithInvestment(), status: 'ready' });
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    expect(screen.queryByRole('button', { name: /^Respec / })).not.toBeInTheDocument();
    expect(screen.queryByText('Permanent')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'MOLTEN CAST' }));
    expect(
      within(screen.getByRole('tabpanel', { name: 'MOLTEN CAST' })).getByRole('button', {
        name: 'RESPEC',
      }),
    ).toBeDisabled();
  });

  it('supports arrow-key tree navigation and keyboard node selection', async () => {
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    const anvilTab = screen.getByRole('tab', { name: 'ANVIL SPARKS' });
    anvilTab.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');

    const moltenTab = screen.getByRole('tab', { name: 'MOLTEN CAST' });
    expect(moltenTab).toHaveFocus();
    expect(moltenTab).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(anvilTab).toHaveFocus();
    expect(anvilTab).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{End}');
    expect(moltenTab).toHaveFocus();
    expect(moltenTab).toHaveAttribute('aria-selected', 'true');

    const mitigation = screen.getByRole('button', { name: /^Mitigation,/ });
    mitigation.focus();
    await user.keyboard('{Enter}');
    expect(mitigation).toHaveAttribute('aria-pressed', 'true');
    expect(mitigation).toHaveAttribute('data-selected');
    expect(screen.getByRole('heading', { name: 'Mitigation' })).toBeInTheDocument();
  });

  it('shows readable prerequisite names in the inspector', async () => {
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    await user.click(screen.getByRole('button', { name: /^Jeweler,/ }));
    expect(screen.getByText('Blacksmith (rank 1)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Runic Focus,/ }));

    expect(screen.getByText('Talisman (matching rank)')).toBeInTheDocument();
    expect(screen.queryByText(/anvil\.talisman/)).not.toBeInTheDocument();
  });
});
