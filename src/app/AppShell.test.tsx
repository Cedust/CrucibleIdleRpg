import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';
import { createDefaultSave } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { AppShell } from './AppShell';
import { useNavigationStore } from './navigationStore';

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear();
    useNavigationStore.setState({ activeView: 'dungeons' });
    useDungeonRunStore.setState({ mode: 'selection', activeDungeonId: null, startError: null });
    saveStore.setState({ data: createDefaultSave(42), status: 'ready' });
  });

  it('shows branding, resources, and accessible primary navigation outside a run', () => {
    render(<AppShell />);

    expect(screen.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeInTheDocument();
    expect(screen.getByLabelText('Gold amount')).toHaveTextContent('0');
    expect(screen.getByLabelText('Crystals amount')).toHaveTextContent('0');
    expect(screen.getByLabelText('Cinder amount')).toHaveTextContent('—');
    expect(screen.getByLabelText('Runedust amount')).toHaveTextContent('—');
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
  });

  it('shows the dungeon selection in the default view', () => {
    render(<AppShell />);

    expect(screen.getByRole('button', { name: 'DUNGEONS' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('heading', { name: 'Dungeons' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter Dungeon' })).toBeEnabled();
  });

  it('switches views through primary navigation', async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole('button', { name: 'RUNES' }));

    expect(screen.getByRole('heading', { name: 'RUNES' })).toBeInTheDocument();
    expect(useNavigationStore.getState().activeView).toBe('runes');
  });

  it('opens the weapon mastery tree from navigation', async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole('button', { name: 'WEAPON MASTERY' }));

    expect(screen.getByRole('heading', { name: 'Weapon Mastery' })).toBeInTheDocument();
    expect(screen.getByText(/1 Mastery Points available/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FINESSE' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('isolates a run from navigation and only exits after confirmed leave', async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole('button', { name: 'Enter Dungeon' }));

    expect(await screen.findByRole('heading', { name: 'A1-D1-01' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Primary navigation' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'CRUCIBLE' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'TEAM' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'BLACKSMITH' })).not.toBeInTheDocument();

    act(() => useNavigationStore.getState().setActiveView('crucible'));
    expect(screen.getByRole('heading', { name: 'A1-D1-01' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'CRUCIBLE' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Leave Dungeon' }));
    expect(screen.getByRole('button', { name: 'Confirm Leave Dungeon' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm Leave Dungeon' }));

    expect(await screen.findByRole('heading', { name: 'Dungeons' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
  });
});
