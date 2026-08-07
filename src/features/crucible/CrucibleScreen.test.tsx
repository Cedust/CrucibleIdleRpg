// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSave, type SaveData } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { CrucibleScreen } from './CrucibleScreen';

/** Schema-gültiger Stand: vollendeter erster Dungeon, Crystals und investierte Smelting-Ränge. */
function saveWithInvestment(): SaveData {
  const base = createDefaultSave(4242);
  return {
    ...base,
    currencies: { ...base.currencies, crystals: 5 },
    crucible: { 'smelting.overpower': 2 },
    completedDungeons: { ...base.completedDungeons, 'A1-D1': true },
  };
}

describe('CrucibleScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    saveStore.setState({ data: createDefaultSave(4242), status: 'ready' });
  });

  it('zeigt alle vier Trees mit Rängen und benennt Sperrgründe gesperrter Nodes', async () => {
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    const trees = within(screen.getByRole('group', { name: 'Trees' }));
    for (const label of ['ANVIL SPARKS', 'SMELTING FLAMES', 'MOLTEN CAST', 'MASTERWORK']) {
      expect(trees.getByRole('button', { name: label })).toBeInTheDocument();
    }

    // Waystones ohne Vollendet-Flag: sichtbar, aber mit benanntem Sperrgrund.
    expect(screen.getByText('Requires completing A1-D1.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invest' })).toBeDisabled();

    // Armory ist sichtbar und bis M3 gesperrt.
    await user.click(screen.getByRole('button', { name: /Armory/ }));
    expect(screen.getByText('Locked until Equipment (M3).')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invest' })).toBeDisabled();
  });

  it('kauft einen bezahlbaren Node über den Invest-Button', async () => {
    const base = createDefaultSave(4242);
    saveStore.setState({
      data: { ...base, currencies: { ...base.currencies, crystals: 3 } },
      status: 'ready',
    });
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    await user.click(screen.getByRole('button', { name: 'SMELTING FLAMES' }));
    await user.click(screen.getByRole('button', { name: /Overpower/ }));
    const invest = screen.getByRole('button', { name: 'Invest' });
    expect(invest).toBeEnabled();

    await user.click(invest);

    await vi.waitFor(() =>
      expect(saveStore.getState().data?.crucible['smelting.overpower']).toBe(1),
    );
    expect(saveStore.getState().data?.currencies.crystals).toBe(2);
  });

  it('führt den kostenlosen Tree-Respec über den modalen Dialog aus und bricht folgenlos ab', async () => {
    saveStore.setState({ data: saveWithInvestment(), status: 'ready' });
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    await user.click(screen.getByRole('button', { name: /SMELTING FLAMES \[3\]/ }));

    // Abbrechen lässt Ränge und Crystals unangetastet.
    await user.click(screen.getByRole('button', { name: 'Respec SMELTING FLAMES' }));
    const dialog = screen.getByRole('dialog', { name: 'Confirm Tree Respec' });
    expect(
      within(dialog).getByText(
        'Removes all ranks of this tree and refunds 3 Crystals. Free of charge.',
      ),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(saveStore.getState().data?.crucible).toEqual({ 'smelting.overpower': 2 });

    // Bestätigen entfernt die Tree-Ränge und erstattet exakt die Investition.
    await user.click(screen.getByRole('button', { name: 'Respec SMELTING FLAMES' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Respec' }));

    await vi.waitFor(() => expect(saveStore.getState().data?.crucible).toEqual({}));
    expect(saveStore.getState().data?.currencies.crystals).toBe(8);
  });

  it('bietet für Anvil Sparks keinen Respec an', async () => {
    saveStore.setState({ data: saveWithInvestment(), status: 'ready' });
    const user = userEvent.setup();
    render(<CrucibleScreen />);

    expect(screen.queryByRole('button', { name: /^Respec / })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'MOLTEN CAST' }));
    expect(screen.getByRole('button', { name: 'Respec MOLTEN CAST' })).toBeDisabled();
  });
});
