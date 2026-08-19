// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createHeroesStore, useHeroesStore } from '../heroesStore';

import { HeroesScreen } from './HeroesScreen';
import { createDefaultSave } from '@/features/save/saveSchema';
import { saveStore } from '@/features/save/saveStore';
import { useNavigationStore } from '@/app/navigationStore';
import userEvent from '@testing-library/user-event';

describe('HeroesScreen', () => {
  beforeEach(() => {
    useNavigationStore.setState({ activeCharacterId: 'korvin' });
    useHeroesStore.setState({ activeArea: 'stats' });
    saveStore.setState({ data: createDefaultSave(42), status: 'ready' });
  });

  it('shows the active character’s stats, portrait, and progression details', () => {
    render(<HeroesScreen />);

    expect(screen.getByRole('heading', { name: 'Heroes' })).toBeInTheDocument();
    expect(
      screen.getByText("Review Korvin's current combat capabilities and prepare for the depths."),
    ).toBeInTheDocument();
    for (const category of ['Core', 'Offensive', 'Defensive', 'Utility']) {
      expect(screen.getByRole('heading', { name: category })).toBeInTheDocument();
    }
    expect(screen.queryByRole('heading', { name: 'Derived' })).not.toBeInTheDocument();
    expect(screen.getByText('Attack')).toBeInTheDocument();
    expect(screen.getByText('14', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Defense')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Block Chance')).toBeInTheDocument();
    expect(screen.getByText('10%', { exact: true })).toBeInTheDocument();
    expect(screen.getByAltText('Korvin portrait')).toBeInTheDocument();
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.queryByText('Role')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'tank role' })).toBeInTheDocument();
    expect(within(screen.getByTestId('heroes-portrait-frame')).getByText('Korvin')).toHaveClass(
      'top-[78.3%]',
      'text-display',
    );
    expect(screen.getByTestId('heroes-identity')).not.toHaveClass(
      'border-image-ornate',
      'bg-surface/90',
      'shadow-panel',
    );
    expect(screen.getByRole('progressbar', { name: 'Korvin experience' })).toHaveAttribute(
      'aria-valuemax',
      '75',
    );
    expect(
      within(screen.getByTestId('heroes-identity')).queryByText('Level'),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('heroes-identity')).queryByText('tank'),
    ).not.toBeInTheDocument();
    for (const category of ['Core', 'Offensive', 'Defensive', 'Utility']) {
      const panel = screen.getByRole('heading', { name: category }).closest('section');
      expect(panel).not.toHaveClass('border-image-ornate');
      expect(panel?.querySelector('.border-image-standard')).toBeInTheDocument();
    }
    expect(screen.getByTestId('heroes-progression')).not.toHaveClass('border-image-ornate');
    expect(
      screen.getByTestId('heroes-progression').querySelector('.border-image-standard'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('heroes-progression')).toHaveClass('flex', 'items-center');

    const identityColumn = screen.getByTestId('heroes-identity-column');
    expect(within(identityColumn).getByTestId('heroes-attributes')).toBeInTheDocument();
    expect(within(identityColumn).getByText('Ferocity')).toBeInTheDocument();
    expect(within(identityColumn).queryByRole('heading', { name: 'Core' })).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('heroes-overview-column')).getByRole('heading', { name: 'Core' }),
    ).toBeInTheDocument();
    const corePanel = screen.getByRole('heading', { name: 'Core' }).closest('section');
    expect(corePanel).not.toHaveClass('grid-cols-[auto_minmax(0,1fr)]');
    expect(corePanel?.querySelector('dl')).toHaveClass('mt-1.5');
    expect(within(corePanel as HTMLElement).getByText('Might').parentElement).toHaveClass(
      'items-baseline',
      'justify-between',
    );
    expect(within(screen.getByTestId('heroes-progression')).queryByText('Ferocity')).toBeNull();
    expect(screen.getByRole('button', { name: 'Increase Ferocity' })).toHaveClass('size-8', 'p-0');
    expect(screen.getByRole('button', { name: 'Respec attributes' })).toHaveClass('ml-auto');
    const ferocityAxis = document.querySelector('[data-attribute-axis="ferocity"]');
    const attackStat = ferocityAxis?.querySelector('[data-derived-stat="attack"]');
    const ferocityControl = ferocityAxis?.querySelector('[data-attribute-control="ferocity"]');
    expect(attackStat).toHaveTextContent('Attack14');
    expect(within(attackStat as HTMLElement).getByText('Attack')).toHaveClass(
      'text-base',
      'text-text',
    );
    expect(ferocityControl).toHaveTextContent('Ferocity0+');
    expect(within(ferocityControl as HTMLElement).getByText('Ferocity')).toHaveClass(
      'text-sm',
      'text-text-muted',
    );
    expect(within(ferocityControl as HTMLElement).getByText('0')).toHaveClass(
      'font-medium',
      'tabular-nums',
      'text-text',
    );
    expect(within(ferocityControl as HTMLElement).getByText('Ferocity')).not.toHaveClass(
      'font-display',
      'uppercase',
    );
    expect(attackStat?.compareDocumentPosition(ferocityControl as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(document.querySelectorAll('[data-attribute-icon]')).toHaveLength(3);
    for (const icon of document.querySelectorAll('[data-attribute-icon]')) {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('uses keyboard-operated local tabs and retains their selection during the session', async () => {
    const user = userEvent.setup();
    const firstRender = render(<HeroesScreen />);
    const stats = screen.getByRole('tab', { name: 'Stats' });

    stats.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Loadout' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Signature Weapon');

    firstRender.unmount();
    render(<HeroesScreen />);
    expect(screen.getByRole('tab', { name: 'Loadout' })).toHaveAttribute('aria-selected', 'true');
  });

  it('spends available attribute points and updates the coupled derived stat', async () => {
    const user = userEvent.setup();
    render(<HeroesScreen />);

    expect(screen.getByText('1 Point Available')).toBeInTheDocument();
    expect(screen.getByText('Ferocity')).toBeInTheDocument();
    expect(screen.getByText('Resilience')).toBeInTheDocument();
    expect(screen.getByText('Vigor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Respec attributes' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Increase Ferocity' }));

    await waitFor(() => {
      expect(saveStore.getState().data?.characters.korvin).toMatchObject({
        freeAttributePoints: 0,
        attributePoints: { ferocity: 1, resilience: 0, vigor: 0 },
      });
    });
    expect(screen.queryByText('1 Point Available')).not.toBeInTheDocument();
    expect(screen.getByText('14.17', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Increase Ferocity' })).toBeDisabled();
  });

  it('starts a fresh browser session on Stats', () => {
    const store = createHeroesStore();

    expect(store.getState().activeArea).toBe('stats');
  });

  it('updates the character identity and progression when the shared character changes', () => {
    render(<HeroesScreen />);
    expect(screen.getByAltText('Korvin portrait')).toBeInTheDocument();

    act(() => useNavigationStore.getState().setActiveCharacterId('rhaya'));

    expect(
      screen.getByText("Review Rhaya's current combat capabilities and prepare for the depths."),
    ).toBeInTheDocument();
    expect(screen.getByAltText('Rhaya portrait')).toBeInTheDocument();
    expect(screen.getByText('18', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'melee role' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Rhaya experience' })).toHaveAttribute(
      'aria-valuemax',
      '75',
    );
  });
});
