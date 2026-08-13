// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSave, type SaveData } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
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
    await user.click(screen.getByRole('button', { name: 'Rhaya' }));
    expect(within(inspector()).getByRole('heading', { name: 'CHC I' })).toBeInTheDocument();
  });

  it('respecs the active Discipline through the modal dialog', async () => {
    saveStore.setState({ data: saveWithInvestment(), status: 'ready' });
    const user = userEvent.setup();
    render(<WeaponMasteryScreen />);
    await user.click(screen.getByRole('tab', { name: /^FINESSE/ }));
    await user.click(screen.getByRole('button', { name: 'Respec 150 Gold' }));
    const dialog = screen.getByRole('dialog', { name: 'Confirm Discipline Respec' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(saveStore.getState().data?.characters.korvin.masteryRanks['finesse.chc-i']).toBe(2);
    await user.click(screen.getByRole('button', { name: 'Respec 150 Gold' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Respec' }));
    await vi.waitFor(() =>
      expect(saveStore.getState().data?.characters.korvin.masteryRanks).toEqual({}),
    );
  });
});
