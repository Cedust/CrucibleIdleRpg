// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSave, type SaveData } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { WeaponMasteryScreen } from './WeaponMasteryScreen';

/** Schema-gültiger Stand mit Investition: Level = freie + investierte Punkte je Sorte. */
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

  it('investiert nur über den freigegebenen Button und benennt den Sperrgrund', async () => {
    const user = userEvent.setup();
    render(<WeaponMasteryScreen />);

    // Startauswahl: CHC I (Initiate, Level 1) mit einem freien Punkt — kaufbar.
    const invest = screen.getByRole('button', { name: 'Invest' });
    expect(invest).toBeEnabled();

    await user.click(invest);

    await vi.waitFor(() =>
      expect(saveStore.getState().data?.characters.korvin.masteryRanks['finesse.chc-i']).toBe(1),
    );
    expect(await screen.findByText('No Mastery Points available.')).toBeInTheDocument();
    const locked = screen.getByRole('button', { name: 'Invest' });
    expect(locked).toBeDisabled();
    expect(locked).toHaveAccessibleDescription('No Mastery Points available.');
  });

  it('setzt die Auswahl beim Charakterwechsel zurück', async () => {
    const user = userEvent.setup();
    render(<WeaponMasteryScreen />);
    const inspector = () => screen.getByRole('complementary', { name: 'Mastery node inspector' });

    await user.click(screen.getByRole('button', { name: 'CHC II0/5' }));
    expect(within(inspector()).getByRole('heading', { name: 'CHC II' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Rhaya' }));
    expect(within(inspector()).getByRole('heading', { name: 'CHC I' })).toBeInTheDocument();
  });

  it('führt den Respec über den modalen Dialog aus und bricht folgenlos ab', async () => {
    saveStore.setState({ data: saveWithInvestment(), status: 'ready' });
    const user = userEvent.setup();
    render(<WeaponMasteryScreen />);

    // Abbrechen lässt Ränge und Gold unangetastet.
    await user.click(screen.getByRole('button', { name: 'Respec 150 Gold' }));
    const dialog = screen.getByRole('dialog', { name: 'Confirm Discipline Respec' });
    expect(within(dialog).getByText('Refund 2 Mastery Points for 150 Gold.')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(saveStore.getState().data?.characters.korvin.masteryRanks['finesse.chc-i']).toBe(2);
    expect(saveStore.getState().data?.currencies.gold).toBe(1000);

    // Bestätigen erstattet die Discipline gegen Gold.
    await user.click(screen.getByRole('button', { name: 'Respec 150 Gold' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Respec' }));

    await vi.waitFor(() =>
      expect(saveStore.getState().data?.characters.korvin.masteryRanks).toEqual({}),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(saveStore.getState().data?.characters.korvin.freeMasteryPoints).toBe(2);
    expect(saveStore.getState().data?.currencies.gold).toBe(850);
  });
});
