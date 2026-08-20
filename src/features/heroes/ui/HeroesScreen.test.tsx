// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createHeroesStore, useHeroesStore } from '../heroesStore';

import type { AttributePoints } from '@/game/types';
import { HeroesScreen } from './HeroesScreen';
import { attributeRespecCost } from '@/game/rewards/xpRewards';
import { createDefaultSave } from '@/features/save/saveSchema';
import { formatNumber } from '@/shared/utils/formatNumber';
import { saveStore } from '@/features/save/saveStore';
import { useNavigationStore } from '@/app/navigationStore';
import userEvent from '@testing-library/user-event';

/**
 * Setzt Korvin auf eine investierte Verteilung mit definierter Gold-Deckung. Das Save-Schema
 * verlangt `freeAttributePoints + verteilte Punkte === level`; das Level folgt darum der Summe.
 */
function investKorvin(attributePoints: AttributePoints, gold: number) {
  const save = createDefaultSave(42);
  const level = attributePoints.ferocity + attributePoints.resilience + attributePoints.vigor;
  saveStore.setState({
    data: {
      ...save,
      currencies: { ...save.currencies, gold },
      characters: {
        ...save.characters,
        korvin: {
          ...save.characters.korvin,
          level,
          freeMasteryPoints: level,
          freeAttributePoints: 0,
          attributePoints,
        },
      },
    },
    status: 'ready',
  });
}

describe('HeroesScreen', () => {
  beforeEach(() => {
    useNavigationStore.setState({ activeCharacterId: 'korvin' });
    useHeroesStore.setState({ activeArea: 'stats' });
    saveStore.setState({ data: createDefaultSave(42), status: 'ready' });
  });

  it('composes the stats area from the portal, combat, and detail columns', () => {
    render(<HeroesScreen />);

    expect(screen.getByRole('heading', { name: 'Heroes' })).toBeInTheDocument();
    expect(
      screen.getByText("Review Korvin's current combat capabilities and prepare for the depths."),
    ).toBeInTheDocument();

    const portalColumn = screen.getByTestId('heroes-portal-column');
    const combatColumn = screen.getByTestId('heroes-combat-column');
    const detailColumn = screen.getByTestId('heroes-detail-column');

    // Die Mittelspalte steht im DOM zuerst und wandert erst per order in die Mitte.
    expect(portalColumn.compareDocumentPosition(combatColumn)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(combatColumn.compareDocumentPosition(detailColumn)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(portalColumn).toHaveClass('@min-[68rem]:order-2');
    expect(combatColumn).toHaveClass('@min-[68rem]:order-1');
    expect(detailColumn).toHaveClass('@min-[68rem]:order-3');

    const portal = within(portalColumn).getByTestId('heroes-portal-frame');
    expect(within(portal).getByAltText('Korvin figure')).toHaveAttribute(
      'src',
      '/assets/figures/korvin.png',
    );
    expect(portal.querySelector('[data-character-part="frame"]')).toHaveAttribute(
      'src',
      '/assets/frames/character-portal-frame.png',
    );
    expect(within(portal).getByText('Korvin')).toBeInTheDocument();
    expect(portal).toHaveClass('aspect-3/4', 'max-w-portal', 'mt-auto');

    const progression = within(portalColumn).getByTestId('heroes-progression');
    expect(within(progression).getByText('Level 1')).toBeInTheDocument();
    expect(screen.queryByText(/Level Progression/i)).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Korvin experience' })).toHaveAttribute(
      'aria-valuemax',
      '75',
    );

    // Combat Stats, Attribute und Core Stats teilen sich das linke Panel, Combat zuoberst …
    const combatStats = within(combatColumn).getByTestId('heroes-combat-stats');
    const attributes = within(combatColumn).getByTestId('heroes-attributes');
    const core = within(combatColumn).getByRole('heading', { name: 'Core' });
    expect(combatStats.compareDocumentPosition(attributes)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(attributes.compareDocumentPosition(core)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    for (const [stat, value] of [
      ['attack', '14'],
      ['defense', '5'],
      ['health', '320'],
    ] as const) {
      const row = combatStats.querySelector('[data-combat-stat="' + stat + '"]');
      expect(within(row as HTMLElement).getByText(value)).toBeInTheDocument();
    }

    // … die drei Detail-Listen das rechte.
    for (const group of ['Offensive', 'Defensive', 'Utility']) {
      expect(within(detailColumn).getByRole('heading', { name: group })).toBeInTheDocument();
    }
    expect(within(detailColumn).getByText('Splash Radius')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Derived' })).not.toBeInTheDocument();

    // Die Offensive Stats stehen paarweise; ‚Chance‘ und ‚Damage‘ beschriften die Spalten
    // einmal im Kopf, jede Zeile trägt sie für Screenreader selbst.
    const offensive = detailColumn.querySelector('[data-stat-group="Offensive"]') as HTMLElement;
    expect(offensive.querySelector('[data-stat-columns]')).toHaveTextContent('ChanceDamage');
    const critRow = offensive.querySelector('[data-stat-row="Critical Hits"]') as HTMLElement;
    expect(within(critRow).getByRole('term')).toHaveTextContent('Critical Hits');
    expect(
      within(critRow)
        .getAllByRole('definition')
        .map((cell) => cell.textContent),
    ).toEqual(['Chance 5%', 'Damage 150%']);
    expect(within(detailColumn).queryByText('Crit Chance')).not.toBeInTheDocument();
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

  it('marks free points on the plus button and spends them into the coupled derived stat', async () => {
    const user = userEvent.setup();
    render(<HeroesScreen />);

    expect(screen.getByTestId('heroes-free-points')).toHaveTextContent(
      '1 attribute point available',
    );
    expect(screen.getByTestId('heroes-free-points-badge')).toBeInTheDocument();
    const increase = screen.getByRole('button', { name: 'Increase Ferocity' });
    expect(increase).toHaveAttribute('data-availability', 'available');
    expect(screen.queryByRole('button', { name: 'Decrease Ferocity' })).not.toBeInTheDocument();

    await user.click(increase);

    await waitFor(() => {
      expect(saveStore.getState().data?.characters.korvin).toMatchObject({
        freeAttributePoints: 0,
        attributePoints: { ferocity: 1, resilience: 0, vigor: 0 },
      });
    });
    expect(screen.getByTestId('heroes-free-points')).toHaveTextContent(
      '0 attribute points available',
    );
    // Ohne freie Punkte trägt die Kopfzeile keine Raute mehr.
    expect(screen.queryByTestId('heroes-free-points-badge')).not.toBeInTheDocument();
    expect(screen.getByText('14.17')).toBeInTheDocument();
    const spent = screen.getByRole('button', { name: 'Increase Ferocity' });
    expect(spent).toBeDisabled();
    expect(spent).not.toHaveAttribute('data-availability');
  });

  it('redistributes attribute points as a priced draft and commits it', async () => {
    const user = userEvent.setup();
    investKorvin({ ferocity: 2, resilience: 0, vigor: 0 }, attributeRespecCost(1));
    render(<HeroesScreen />);

    expect(screen.queryByTestId('heroes-respec-funds')).not.toBeInTheDocument();
    expect(screen.queryByTestId('heroes-free-points-badge')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Respec attributes' }));
    // Im Respec-Modus steht die Raute auch bei null freien Punkten.
    expect(screen.getByTestId('heroes-free-points-badge')).toBeInTheDocument();
    expect(screen.getByTestId('heroes-respec-draft')).toBeInTheDocument();
    expect(screen.getByTestId('heroes-respec-funds')).toHaveTextContent(
      `${formatNumber(attributeRespecCost(1))} Gold available`,
    );
    expect(screen.getByRole('button', { name: 'Confirm respec' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Decrease Ferocity' }));
    expect(screen.getByTestId('heroes-respec-draft')).toHaveTextContent(
      `Cost ${formatNumber(attributeRespecCost(1))} Gold`,
    );
    expect(screen.getByTestId('heroes-free-points')).toHaveTextContent(
      '1 attribute point available',
    );
    // Die Vorschau folgt dem Entwurf, noch ohne Schreibvorgang.
    expect(screen.getByText('14.17')).toBeInTheDocument();
    expect(saveStore.getState().data?.characters.korvin.attributePoints).toEqual({
      ferocity: 2,
      resilience: 0,
      vigor: 0,
    });

    await user.click(screen.getByRole('button', { name: 'Increase Vigor' }));
    const confirm = screen.getByRole('button', { name: 'Confirm respec' });
    expect(confirm).toBeEnabled();

    await user.click(confirm);

    await waitFor(() => {
      expect(saveStore.getState().data?.characters.korvin).toMatchObject({
        freeAttributePoints: 0,
        attributePoints: { ferocity: 1, resilience: 0, vigor: 1 },
      });
    });
    expect(saveStore.getState().data?.currencies.gold).toBe(0);
    expect(screen.queryByTestId('heroes-respec-draft')).not.toBeInTheDocument();
  });

  it('keeps the draft local until it is confirmed and discards it on cancel', async () => {
    const user = userEvent.setup();
    investKorvin({ ferocity: 2, resilience: 0, vigor: 0 }, attributeRespecCost(1));
    render(<HeroesScreen />);

    await user.click(screen.getByRole('button', { name: 'Respec attributes' }));
    await user.click(screen.getByRole('button', { name: 'Decrease Ferocity' }));
    await user.click(screen.getByRole('button', { name: 'Cancel respec' }));

    expect(screen.queryByTestId('heroes-respec-draft')).not.toBeInTheDocument();
    expect(saveStore.getState().data?.characters.korvin.attributePoints).toEqual({
      ferocity: 2,
      resilience: 0,
      vigor: 0,
    });
    expect(saveStore.getState().data?.currencies.gold).toBe(attributeRespecCost(1));
    expect(screen.getByRole('button', { name: 'Respec attributes' })).toBeInTheDocument();
  });

  it('blocks a redistribution the player cannot pay for', async () => {
    const user = userEvent.setup();
    investKorvin({ ferocity: 2, resilience: 0, vigor: 0 }, attributeRespecCost(1) - 1);
    render(<HeroesScreen />);

    await user.click(screen.getByRole('button', { name: 'Respec attributes' }));
    await user.click(screen.getByRole('button', { name: 'Decrease Ferocity' }));

    const confirm = screen.getByRole('button', { name: 'Confirm respec' });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('title', 'Not enough Gold for this redistribution.');
  });

  it('starts a fresh browser session on Stats', () => {
    const store = createHeroesStore();

    expect(store.getState().activeArea).toBe('stats');
  });

  it('follows the shared character selection and discards a running draft', async () => {
    const user = userEvent.setup();
    investKorvin({ ferocity: 2, resilience: 0, vigor: 0 }, attributeRespecCost(1));
    render(<HeroesScreen />);

    await user.click(screen.getByRole('button', { name: 'Respec attributes' }));
    await user.click(screen.getByRole('button', { name: 'Decrease Ferocity' }));

    act(() => useNavigationStore.getState().setActiveCharacterId('rhaya'));

    expect(
      screen.getByText("Review Rhaya's current combat capabilities and prepare for the depths."),
    ).toBeInTheDocument();
    expect(screen.getByAltText('Rhaya figure')).toBeInTheDocument();
    expect(screen.queryByTestId('heroes-respec-draft')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Rhaya experience' })).toHaveAttribute(
      'aria-valuemax',
      '75',
    );
  });
});
