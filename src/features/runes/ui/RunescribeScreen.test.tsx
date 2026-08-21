// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useNavigationStore } from '@/app/navigationStore';
import { createDefaultSave, type SaveData } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { RuneGrimoireScreen } from './RuneGrimoireScreen';
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

function riteReadySave(): SaveData {
  const base = unlockedRunescribeSave();
  return {
    ...base,
    crucible: {
      'anvil.rune-grimoire': 1,
      'anvil.talisman': 2,
      'anvil.runic-focus': 1,
    },
    runes: {
      'rune.trigger.on-crit': 1,
      'rune.trigger.on-multi-hit': 1,
      'rune.effect.heal': 1,
      'rune.effect.barrier': 1,
      'rune.modifier.echo': 1,
    },
  };
}

describe('RuneGrimoireScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    useNavigationStore.setState({ activeCharacterId: 'korvin' });
    saveStore.setState({ data: createDefaultSave(4242), status: 'ready' });
  });

  it('shows a locked Grimoire as a game-state panel before the Anvil unlock', () => {
    render(<RuneGrimoireScreen />);

    expect(screen.getByRole('heading', { name: 'Rune Grimoire' })).toBeInTheDocument();
    expect(screen.getByLabelText('Rune Grimoire locked')).toBeInTheDocument();
    expect(screen.getByText('The Grimoire sleeps')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Inscribe/ })).not.toBeInTheDocument();
  });

  it('reveals only known Runes and categorical silhouettes up to the reached depth', () => {
    saveStore.setState({ data: unlockedRunescribeSave(), status: 'ready' });
    const { container } = render(<RuneGrimoireScreen />);

    expect(screen.getByRole('heading', { name: 'Rune Grimoire' })).toBeInTheDocument();
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
    render(<RuneGrimoireScreen />);

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
    render(<RuneGrimoireScreen />);

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

describe('RunescribeScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    useNavigationStore.setState({ activeCharacterId: 'korvin' });
    saveStore.setState({ data: createDefaultSave(4242), status: 'ready' });
  });

  it('shows only the selected character Talisman with rank-gated Rite sockets', () => {
    saveStore.setState({ data: riteReadySave(), status: 'ready' });
    render(<RunescribeScreen />);

    expect(screen.getByLabelText('Korvin Talisman and Rite')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-character-id]')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Korvin TRIGGER slot, empty' })).toBeEnabled();
    expect(screen.queryByText('Rite of Rhaya')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Rhaya EFFECT slot, empty' }),
    ).not.toBeInTheDocument();
  });

  it('binds, excludes, replaces and clears a Rite slot through the keyboard', async () => {
    const user = userEvent.setup();
    saveStore.setState({ data: riteReadySave(), status: 'ready' });
    render(<RunescribeScreen />);

    const korvinTrigger = screen.getByRole('button', { name: 'Korvin TRIGGER slot, empty' });
    korvinTrigger.focus();
    await user.keyboard('{Enter}');
    const workbench = screen.getByRole('region', { name: 'Rite socket selection' });
    const bindOnCrit = within(workbench).getByRole('button', { name: 'Bind On Crit, level 1' });
    bindOnCrit.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(saveStore.getState().data?.rites.korvin.triggerRuneId).toBe('rune.trigger.on-crit');
    });

    act(() => useNavigationStore.getState().setActiveCharacterId('rhaya'));
    const rhayaTrigger = screen.getByRole('button', { name: 'Rhaya TRIGGER slot, empty' });
    rhayaTrigger.focus();
    await user.keyboard('{Enter}');
    const rhayaWorkbench = screen.getByRole('region', { name: 'Rite socket selection' });
    expect(
      within(rhayaWorkbench).queryByRole('button', { name: 'Bind On Crit, level 1' }),
    ).not.toBeInTheDocument();
    const bindMultiHit = within(rhayaWorkbench).getByRole('button', {
      name: 'Bind On Multi-Hit, level 1',
    });
    bindMultiHit.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(saveStore.getState().data?.rites.rhaya.triggerRuneId).toBe(
        'rune.trigger.on-multi-hit',
      );
    });

    act(() => useNavigationStore.getState().setActiveCharacterId('korvin'));
    const reopenedKorvinTrigger = screen.getByRole('button', {
      name: 'Korvin TRIGGER slot, On Crit',
    });
    reopenedKorvinTrigger.focus();
    await user.keyboard('{Enter}');
    const korvinWorkbench = screen.getByRole('region', { name: 'Rite socket selection' });
    const clear = within(korvinWorkbench).getByRole('button', {
      name: 'Clear Korvin TRIGGER slot',
    });
    clear.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(saveStore.getState().data?.rites.korvin.triggerRuneId).toBeNull();
    });
    expect(saveStore.getState().data?.runes['rune.trigger.on-crit']).toBe(1);
  });
});
