// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react';
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
    useNavigationStore.setState({ activeView: 'dungeons', activeCharacterId: 'korvin' });
    useDungeonRunStore.setState({ mode: 'selection', activeDungeonId: null, startError: null });
    saveStore.setState({ data: createDefaultSave(42), status: 'ready' });
  });

  it('shows sidebar branding and accessible primary navigation outside a run', () => {
    const { container } = render(<AppShell />);

    expect(screen.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveClass('border-image-frame');
    expect(screen.getByRole('main').parentElement).toHaveClass('border-image-frame');
    expect(screen.getByText('IDLE RPG')).toBeInTheDocument();
    expect(
      container.querySelector('img[src="/assets/icons/logo/crucible-emblem.png"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('img[src="/assets/ornaments/divider-ornate.png"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('img[src="/assets/ornaments/nav-selection.png"]'),
    ).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: 'RUNESCRIBE' }));

    expect(screen.getByRole('heading', { name: 'RUNESCRIBE' })).toBeInTheDocument();
    expect(useNavigationStore.getState().activeView).toBe('runescribe');
  });

  it('opens the weapon mastery tree from navigation', async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole('button', { name: 'WEAPON MASTERY' }));

    expect(screen.getByRole('heading', { name: 'Weapon Mastery' })).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('Weapon Mastery')).getByText('1 Mastery Point', {
        exact: true,
        selector: 'p',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'WARHAMMER' })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows one shared character switcher only for character-scoped views', async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    expect(screen.queryByRole('radiogroup', { name: 'Active character' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'HEROES' }));
    await user.click(screen.getByRole('radio', { name: 'Rhaya' }));
    expect(useNavigationStore.getState().activeCharacterId).toBe('rhaya');

    await user.click(screen.getByRole('button', { name: 'WEAPON MASTERY' }));
    expect(screen.getAllByRole('radiogroup', { name: 'Active character' })).toHaveLength(1);
    expect(screen.getByRole('radio', { name: 'Rhaya' })).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('button', { name: 'CRUCIBLE' }));
    expect(screen.queryByRole('radiogroup', { name: 'Active character' })).not.toBeInTheDocument();
  });

  it('isolates a run from navigation and only exits after confirmed leave', async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole('button', { name: 'ENTER DUNGEON' }));

    expect(
      await screen.findByRole('heading', { name: 'The Ashen Depths — Cinder Gate' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main').parentElement).toHaveClass('border-image-frame');
    expect(screen.queryByRole('heading', { name: 'Crucible Idle RPG' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Primary navigation' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'CRUCIBLE' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'HEROES' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'BLACKSMITH' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Active character' })).not.toBeInTheDocument();

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
