// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDungeonRunStore } from '@/features/dungeon/state/dungeonRunStore';
import { createDefaultSave } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { ACT_1_ENCOUNTERS } from '@/game/encounters/act1';
import { DungeonSelectionScreen } from './DungeonSelectionScreen';

describe('DungeonSelectionScreen', () => {
  beforeEach(() => {
    saveStore.setState({ data: createDefaultSave(42), status: 'ready' });
    useDungeonRunStore.setState({ mode: 'selection', activeDungeonId: null, startError: null });
  });

  it('shows the act stack with only act 1 unlocked', () => {
    render(<DungeonSelectionScreen />);

    const heading = screen.getByRole('heading', { name: 'Dungeons' });
    expect(heading).toHaveClass('font-display', 'text-display-lg', 'text-accent-strong');
    expect(
      screen.getByText(
        'Descend into the ancient depths, where the ashes of a fallen kingdom conceal a forgotten world.',
      ),
    ).toHaveClass('font-intro');

    const acts = within(screen.getByRole('list', { name: 'Acts' })).getAllByRole('listitem');
    expect(acts).toHaveLength(3);
    expect(acts[0]).toHaveTextContent(/ACT I\b.*The Ashen Depths/);
    expect(acts[0]).toHaveAttribute('aria-current', 'true');
    expect(acts[0]).toHaveAttribute('data-selected');
    expect(acts[0]?.querySelector('.border-image-act')).toBeInTheDocument();
    expect(acts[1]).toHaveAttribute('data-semantic', 'locked');
    expect(acts[2]).toHaveAttribute('data-semantic', 'locked');
    expect(within(acts[1] as HTMLElement).getByText('ACT II')).toBeInTheDocument();
    expect(within(acts[1] as HTMLElement).getByText('The Ember Foundry')).toBeInTheDocument();
    expect(within(acts[2] as HTMLElement).getByText('ACT III')).toBeInTheDocument();
    expect(within(acts[2] as HTMLElement).getByText('The Forgotten Citadel')).toBeInTheDocument();

    // Medaillon-Numerale pro Akt, scoped gegen die Tor-Numerale der Kacheln.
    expect(within(acts[0] as HTMLElement).getByText('I')).toBeInTheDocument();
    expect(within(acts[1] as HTMLElement).getByText('II')).toBeInTheDocument();
    expect(within(acts[2] as HTMLElement).getByText('III')).toBeInTheDocument();
    expect(
      acts[0]?.querySelector('img[src="/assets/frames/medallion-act.png"]'),
    ).toBeInTheDocument();

    const actTwoLockLabel = within(acts[1] as HTMLElement).getByText('Locked');
    expect(actTwoLockLabel).toHaveClass('sr-only');
    expect(actTwoLockLabel.previousElementSibling?.tagName).toBe('svg');
    expect(actTwoLockLabel.closest('p')).toContainElement(
      within(acts[1] as HTMLElement).getByText('ACT II'),
    );
  });

  it('offers the dungeon gates with the fresh-save unlock state', () => {
    render(<DungeonSelectionScreen />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(radios[0]).toBeChecked();
    expect(radios.every((radio) => !(radio as HTMLInputElement).disabled)).toBe(true);
    const gateGrid = screen.getByRole('group', { name: 'Dungeon selection' });
    expect(gateGrid).toHaveClass('grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]');

    const details = screen.getByRole('region', { name: 'Cinder Gate details' });
    expect(details).toHaveClass('mx-4', 'grid', 'px-6', 'py-5');
    expect(details).toHaveClass('@min-[42rem]:grid-cols-[minmax(0,1fr)_auto]');
    expect(details.querySelector('.border-image-act')).toBeInTheDocument();
    expect(within(details).getByText('ACT I - The Ashen Depths')).toBeInTheDocument();
    expect(
      within(details).getByRole('heading', { name: 'DUNGEON I - Cinder Gate' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('ACT I - THE ASHEN DEPTHS')).not.toBeInTheDocument();
    expect(
      within(details).getByText(
        'The outer gate to the Ashen Depths. Once a grand entrance, now reduced to ember and stone.',
      ),
    ).toBeInTheDocument();
    expect(within(details).getByText('Floor 0 / 20')).toBeInTheDocument();
    expect(within(details).getByRole('progressbar')).toBeInTheDocument();
    const enterButton = within(details).getByRole('button', { name: 'ENTER DUNGEON' });
    expect(enterButton).toBeEnabled();
    expect(enterButton).toHaveClass('border-image-button');
  });

  it('selects a locked dungeon and hides progress and entry action', async () => {
    const user = userEvent.setup();
    render(<DungeonSelectionScreen />);

    const lockedDungeon = screen.getByRole('radio', {
      name: /DUNGEON II\b.*The Charred Vaults.*LOCKED/,
    });
    await user.click(lockedDungeon);

    expect(lockedDungeon).toBeChecked();
    const details = screen.getByRole('region', { name: 'The Charred Vaults details' });
    expect(
      within(details).getByText(
        'Vaults of a burned treasury. The soot on the walls still whispers of the fires that sealed them.',
      ),
    ).toBeInTheDocument();
    expect(within(details).queryByRole('progressbar')).not.toBeInTheDocument();
    expect(within(details).queryByText('Floor 0 / 20')).not.toBeInTheDocument();
    expect(
      within(details).queryByRole('button', { name: 'ENTER DUNGEON' }),
    ).not.toBeInTheDocument();
  });

  it('shows mastered-floor progress for the selected dungeon', () => {
    const save = createDefaultSave(42);
    const firstVictories = ACT_1_ENCOUNTERS.filter((encounter) => encounter.dungeonId === 'A1-D1')
      .slice(0, 18)
      .map((encounter) => encounter.id);
    saveStore.setState({ data: { ...save, firstVictories }, status: 'ready' });

    render(<DungeonSelectionScreen />);

    const details = screen.getByRole('region', { name: 'Cinder Gate details' });
    expect(within(details).getByText('Floor 18 / 20')).toBeInTheDocument();
    expect(within(details).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '18');
  });

  it('keeps a completed dungeon available to enter', () => {
    const save = createDefaultSave(42);
    saveStore.setState({
      data: {
        ...save,
        completedDungeons: { ...save.completedDungeons, 'A1-D1': true },
      },
      status: 'ready',
    });

    render(<DungeonSelectionScreen />);

    expect(screen.getByRole('radio', { name: /Cinder Gate.*COMPLETED/ })).toBeChecked();
    expect(screen.getByRole('button', { name: 'ENTER DUNGEON' })).toBeEnabled();
  });

  it('reports loading progress before the save is available', () => {
    saveStore.setState({ data: null, status: 'loading' });
    render(<DungeonSelectionScreen />);

    expect(screen.getByText('Loading saved progress...')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});
