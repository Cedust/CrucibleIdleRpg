// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSave, type SaveData } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { useNavigationStore } from '@/app/navigationStore';
import { WeaponMasteryScreen } from './WeaponMasteryScreen';

function saveWithInvestment(): SaveData {
  const base = createDefaultSave(4242);
  return {
    ...base,
    currencies: { ...base.currencies, gold: 1000 },
    characters: {
      ...base.characters,
      korvin: {
        ...base.characters.korvin,
        level: 2,
        freeAttributePoints: 2,
        freeMasteryPoints: 0,
        masteryRanks: { 'finesse.chc-i': 2 },
      },
    },
  };
}

describe('WeaponMasteryScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    saveStore.setState({ data: createDefaultSave(4242), status: 'ready' });
    useNavigationStore.setState({ activeCharacterId: 'korvin' });
  });

  it('starts on the personal Weapon tree and invests only through the inspector', async () => {
    const user = userEvent.setup();
    render(<WeaponMasteryScreen />);
    expect(screen.getByRole('tab', { name: 'WARHAMMER' })).toHaveAttribute('aria-selected', 'true');
    const invest = screen.getByRole('button', { name: 'Invest' });
    expect(invest).toBeEnabled();
    await user.click(invest);
    await vi.waitFor(() =>
      expect(saveStore.getState().data?.characters.korvin.masteryRanks['weapon.dmg-i']).toBe(1),
    );
    expect(await screen.findByText('No Mastery Points available.')).toBeInTheDocument();
  });

  it('exposes node states as data attributes for the shared state system', async () => {
    const user = userEvent.setup();
    render(<WeaponMasteryScreen />);

    const selected = screen.getByRole('button', { pressed: true });
    expect(selected).toHaveAttribute('data-selected');

    const available = screen.getAllByRole('button', { name: /, Available$/ })[0];
    expect(available).toHaveAttribute('data-availability', 'available');
    expect(available).not.toHaveAttribute('data-semantic');

    const locked = screen.getAllByRole('button', { name: /, Locked$/ })[0];
    expect(locked).toHaveAttribute('data-semantic', 'locked');
    expect(locked).not.toHaveAttribute('data-availability');

    await user.click(screen.getByRole('button', { name: 'Invest' }));
    const insufficient = await screen.findAllByRole('button', { name: /, No Mastery Points$/ });
    expect(insufficient[0]).toHaveAttribute('data-availability', 'insufficient');
  });

  it('names the lock reason for locked nodes even without free Mastery Points', async () => {
    const save = createDefaultSave(4242);
    saveStore.setState({
      data: {
        ...save,
        characters: {
          ...save.characters,
          korvin: { ...save.characters.korvin, freeMasteryPoints: 0 },
        },
      },
    });
    const user = userEvent.setup();
    render(<WeaponMasteryScreen />);

    await user.click(screen.getByRole('tab', { name: 'FINESSE' }));
    await user.click(screen.getByRole('button', { name: /^CHC II,.*Locked$/ }));

    const inspector = screen.getByRole('complementary', { name: 'Mastery node inspector' });
    expect(within(inspector).getByText('Requires level 20.')).toBeInTheDocument();
  });

  it('shows the lore intro and available Mastery Points in the header', () => {
    render(<WeaponMasteryScreen />);

    expect(
      screen.getByText(
        'Every weapon remembers the battles it has survived. Hone its nature through different disciplines and forge a fighting style worthy of the depths.',
      ),
    ).toHaveClass('font-intro');
    expect(
      within(screen.getByLabelText('Weapon Mastery')).getByText('1 Mastery Point', {
        exact: true,
        selector: 'p',
      }),
    ).toBeInTheDocument();
  });

  it('uses the plural label for every Mastery Point count except one', () => {
    const save = createDefaultSave(4242);
    saveStore.setState({
      data: {
        ...save,
        characters: {
          ...save.characters,
          korvin: { ...save.characters.korvin, freeMasteryPoints: 2 },
        },
      },
    });

    render(<WeaponMasteryScreen />);

    expect(screen.getByText('2 Mastery Points', { exact: true })).toBeInTheDocument();
  });

  it('supports Discipline keyboard navigation and resets selection on character change', async () => {
    const user = userEvent.setup();
    render(<WeaponMasteryScreen />);
    const weapon = screen.getByRole('tab', { name: 'WARHAMMER' });
    await user.click(weapon);
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'FINESSE' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('button', { name: /^CHC II,/ }));
    const inspector = () => screen.getByRole('complementary', { name: 'Mastery node inspector' });
    expect(within(inspector()).getByRole('heading', { name: 'CHC II' })).toBeInTheDocument();
    act(() => useNavigationStore.getState().setActiveCharacterId('rhaya'));
    expect(within(inspector()).getByRole('heading', { name: 'CHC I' })).toBeInTheDocument();
  });

  it('uses the character Weapon icon and fixed Discipline icons with live point labels', () => {
    saveStore.setState({ data: saveWithInvestment(), status: 'ready' });
    render(<WeaponMasteryScreen />);

    const weapon = screen.getByRole('tab', { name: 'WARHAMMER' });
    expect(weapon.querySelector('[data-mastery-tab-icon="weapon-korvin"]')).toBeInTheDocument();
    expect(
      screen
        .getByRole('tab', { name: 'FINESSE [2]' })
        .querySelector('[data-mastery-tab-icon="discipline-finesse"]'),
    ).toBeInTheDocument();
    for (const discipline of ['tempest', 'dominance', 'valor']) {
      expect(
        screen
          .getByRole('tab', { name: discipline.toUpperCase() })
          .querySelector(`[data-mastery-tab-icon="discipline-${discipline}"]`),
      ).toBeInTheDocument();
    }

    act(() => useNavigationStore.getState().setActiveCharacterId('rhaya'));
    expect(
      screen
        .getByRole('tab', { name: 'TWIN BLADES' })
        .querySelector('[data-mastery-tab-icon="weapon-rhaya"]'),
    ).toBeInTheDocument();
    act(() => useNavigationStore.getState().setActiveCharacterId('quinn'));
    expect(
      screen
        .getByRole('tab', { name: 'LONGBOW' })
        .querySelector('[data-mastery-tab-icon="weapon-quinn"]'),
    ).toBeInTheDocument();
  });

  it('renders the disciplines as segments of one shared tab bar', () => {
    render(<WeaponMasteryScreen />);

    const navigation = screen.getByTestId('mastery-discipline-navigation');
    const bar = screen.getByRole('tablist', { name: 'Disciplines' });
    const weapon = screen.getByRole('tab', { name: 'WARHAMMER' });
    expect(navigation).toContainElement(bar);
    expect(bar).toHaveClass('ornate-tab-bar');
    expect(weapon.querySelector('[data-ornate-tab-selection]')).toHaveClass('ornate-tab-selection');
  });

  it('closes an open respec dialog on character change', async () => {
    saveStore.setState({ data: saveWithInvestment(), status: 'ready' });
    const user = userEvent.setup();
    render(<WeaponMasteryScreen />);

    await user.click(screen.getByRole('tab', { name: /^FINESSE/ }));
    await user.click(screen.getByRole('button', { name: 'Respec FINESSE for 150 Gold' }));
    expect(screen.getByRole('dialog', { name: 'Confirm Discipline Respec' })).toBeInTheDocument();

    act(() => useNavigationStore.getState().setActiveCharacterId('rhaya'));

    expect(
      screen.queryByRole('dialog', { name: 'Confirm Discipline Respec' }),
    ).not.toBeInTheDocument();
  });

  it('respecs the active Discipline through the modal dialog', async () => {
    saveStore.setState({ data: saveWithInvestment(), status: 'ready' });
    const user = userEvent.setup();
    render(<WeaponMasteryScreen />);
    await user.click(screen.getByRole('tab', { name: /^FINESSE/ }));
    await user.click(screen.getByRole('button', { name: 'Respec FINESSE for 150 Gold' }));
    const dialog = screen.getByRole('dialog', { name: 'Confirm Discipline Respec' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(saveStore.getState().data?.characters.korvin.masteryRanks['finesse.chc-i']).toBe(2);
    await user.click(screen.getByRole('button', { name: 'Respec FINESSE for 150 Gold' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Respec' }));
    await vi.waitFor(() =>
      expect(saveStore.getState().data?.characters.korvin.masteryRanks).toEqual({}),
    );
  });
});
