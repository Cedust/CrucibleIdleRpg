// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultSave, type SaveData } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { RunescribeScreen } from './RunescribeScreen';

function unlockedRunescribeSave(options: { depth?: number; mastery?: number } = {}): SaveData {
  const { depth = 3, mastery = 0 } = options;
  const base = createDefaultSave(4242);
  return {
    ...base,
    currencies: { ...base.currencies, gold: 500, runewords: 100 },
    firstVictories: [`A1-D1-${String(depth).padStart(2, '0')}`],
    crucible: {
      'anvil.rune-grimoire': 1,
      ...(mastery > 0 ? { 'anvil.rune-mastery': mastery } : {}),
    },
    runes: { 'rune.trigger.on-crit': 1, 'rune.effect.heal': 1 },
  };
}

describe('RunescribeScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    saveStore.setState({ data: createDefaultSave(4242), status: 'ready' });
  });

  it('shows a locked Grimoire as a game-state panel before the Anvil unlock', () => {
    render(<RunescribeScreen />);

    expect(screen.getByRole('heading', { name: 'Runescribe' })).toBeInTheDocument();
    expect(screen.getByLabelText('Rune Grimoire locked')).toBeInTheDocument();
    expect(screen.getByText('The Grimoire sleeps')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Inscribe/ })).not.toBeInTheDocument();
  });

  it('reveals only known Runes and categorical silhouettes up to the reached depth', () => {
    saveStore.setState({ data: unlockedRunescribeSave(), status: 'ready' });
    const { container } = render(<RunescribeScreen />);

    expect(screen.getByRole('heading', { name: 'Runescribe' })).toBeInTheDocument();
    expect(screen.getByLabelText('Runewords amount')).toHaveTextContent('100');
    expect(screen.getByText('2 / 17 RUNES')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'TRIGGERS' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'EFFECTS' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'MODIFIERS' })).toBeInTheDocument();
    expect(container.querySelector('[data-rune-id="rune.trigger.on-splash"]')).toHaveAttribute(
      'data-known',
      'false',
    );
    expect(
      container.querySelector('[data-rune-id="rune.trigger.on-counter"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inscribe TRIGGERS' })).toBeEnabled();
  });

  it('inscribes through the keyboard and redraws the persistent Rune knowledge', async () => {
    const user = userEvent.setup();
    saveStore.setState({ data: unlockedRunescribeSave(), status: 'ready' });
    render(<RunescribeScreen />);

    const inscribe = screen.getByRole('button', { name: 'Inscribe TRIGGERS' });
    inscribe.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(saveStore.getState().data?.craftCounter).toBe(1);
    });
    expect(Object.keys(saveStore.getState().data?.runes ?? {})).toHaveLength(3);
    expect(screen.getByText('3 / 17 RUNES')).toBeInTheDocument();
  });

  it('etches a known Rune through the keyboard without consuming a craft roll', async () => {
    const user = userEvent.setup();
    saveStore.setState({ data: unlockedRunescribeSave({ mastery: 1 }), status: 'ready' });
    render(<RunescribeScreen />);

    const etch = screen.getByRole('button', { name: 'Etch On Crit' });
    etch.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(saveStore.getState().data?.runes['rune.trigger.on-crit']).toBe(2);
    });
    expect(saveStore.getState().data?.craftCounter).toBe(0);
    expect(screen.getByLabelText('Rune level 2 of 5')).toBeInTheDocument();
  });
});
