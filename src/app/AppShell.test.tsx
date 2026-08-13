// @vitest-environment jsdom
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

  it('shows sidebar branding, floating resources, and accessible primary navigation outside a run', () => {
    const { container } = render(<AppShell />);

    expect(screen.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveClass('border-image-sidebar');
    expect(screen.getByRole('main').parentElement).toHaveClass('border-image-mainview');
    expect(screen.getByText('IDLE RPG')).toBeInTheDocument();
    expect(
      container.querySelector('img[src="/assets/icons/crucible-emblem.png"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('img[src="/assets/ornaments/divider-ornate.png"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('img[src="/assets/ornaments/nav-selection.png"]'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Gold amount')).toHaveTextContent('0');
    expect(screen.getByLabelText('Relic Shards amount')).toHaveTextContent('0');
    expect(container.querySelector('svg.lucide-stone')).not.toBeNull();
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
    expect(screen.getByRole('button', { name: 'ENTER DUNGEON' })).toBeEnabled();
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

    await user.click(screen.getByRole('button', { name: 'ENTER DUNGEON' }));

    expect(
      await screen.findByRole('heading', { name: 'The Ashen Depths — Cinder Gate' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main').parentElement).toHaveClass('border-image-mainview');
    expect(screen.queryByRole('heading', { name: 'Crucible Idle RPG' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Resources')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Primary navigation' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'CRUCIBLE' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'HEROES' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'BLACKSMITH' })).not.toBeInTheDocument();

    act(() => useNavigationStore.getState().setActiveView('crucible'));
    expect(
      screen.getByRole('heading', { name: 'The Ashen Depths — Cinder Gate' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'CRUCIBLE' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'LEAVE DUNGEON' }));
    expect(screen.getByRole('button', { name: 'Confirm Leave Dungeon' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm Leave Dungeon' }));

    expect(await screen.findByRole('heading', { name: 'Dungeons' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
  });
});
