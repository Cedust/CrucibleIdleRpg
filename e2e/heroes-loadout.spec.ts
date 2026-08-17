import { expect, test, type Page } from '@playwright/test';

/**
 * Heroes-Loadout (Task 024): Slot-Anordnung, Auswahl mit Detailkarte, Sperrbehandlung und
 * responsive Anordnung. Der Save wird mit Armory-Rang 2 geseedet — Chest und Legs offen,
 * Head und Feet gesperrt.
 */

const ARMOR_ITEMS = {
  chest: {
    slot: 'chest',
    itemType: 'armor',
    rarity: 'common',
    itemLevel: 1,
    innate: 'toughness',
    sockets: [],
    prismaticSockets: [],
  },
  legs: {
    slot: 'legs',
    itemType: 'legguards',
    rarity: 'common',
    itemLevel: 1,
    innate: 'toughness',
    sockets: [],
    prismaticSockets: [],
  },
} as const;

const LEVEL_ONE = {
  level: 1,
  xp: 0,
  freeAttributePoints: 1,
  attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
  freeMasteryPoints: 1,
  masteryRanks: {},
} as const;

const SEEDED_SAVE = {
  version: 1,
  saveSeed: 42,
  runCounter: 0,
  playbackSpeed: 1,
  characters: { korvin: LEVEL_ONE, rhaya: LEVEL_ONE, quinn: LEVEL_ONE },
  currencies: { gold: 0, relicShards: 0, cinder: 0 },
  gems: { amber: 0, ruby: 0, sapphire: 0, emerald: 0, diamond: 0 },
  firstVictories: [],
  crucible: { 'anvil.armory': 2 },
  armor: { korvin: ARMOR_ITEMS, rhaya: ARMOR_ITEMS, quinn: ARMOR_ITEMS },
  completedDungeons: {
    'A1-D1': false,
    'A1-D2': false,
    'A1-D3': false,
    'A1-D4': false,
    'A1-D5': false,
  },
} as const;

async function openLoadout(page: Page) {
  await page.addInitScript((save) => {
    localStorage.setItem('crucible-idle-rpg:save', JSON.stringify(save));
  }, SEEDED_SAVE);
  await page.goto('/');
  await page.getByRole('button', { name: 'HEROES', exact: true }).click();
  await page.getByRole('tab', { name: 'Loadout' }).click();
  await expect(page.getByRole('tab', { name: 'Loadout' })).toHaveAttribute('aria-selected', 'true');
}

async function scrollState(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const scrollContainer = element as unknown as {
      clientWidth: number;
      scrollWidth: number;
      clientHeight: number;
      scrollHeight: number;
    };
    return {
      scrollsX: scrollContainer.scrollWidth > scrollContainer.clientWidth,
      scrollsY: scrollContainer.scrollHeight > scrollContainer.clientHeight,
    };
  });
}

test('arranges talisman, signature weapon, armor column and detail without document scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openLoadout(page);

  const talisman = page.getByRole('button', { name: 'Talisman, Locked' });
  const weapon = page.getByRole('button', { name: 'Signature Weapon WARHAMMER' });
  const armorColumn = page.getByTestId('loadout-armor-column');
  const detail = page.getByTestId('loadout-detail');
  await expect(talisman).toBeVisible();
  await expect(weapon).toBeVisible();
  await expect(weapon).toHaveAttribute('aria-pressed', 'true');

  const [talismanBox, weaponBox, armorBox, detailBox] = await Promise.all([
    talisman.boundingBox(),
    weapon.boundingBox(),
    armorColumn.boundingBox(),
    detail.boundingBox(),
  ]);
  if (talismanBox === null || weaponBox === null || armorBox === null || detailBox === null) {
    throw new Error('Loadout layout must be visible');
  }
  // Links oben Talisman, links unten die Signaturwaffe.
  expect(talismanBox.y + talismanBox.height).toBeLessThanOrEqual(weaponBox.y);
  expect(Math.abs(talismanBox.x - weaponBox.x)).toBeLessThanOrEqual(1);
  // Rechts davon die anatomische Armor-Säule, außen die Detailkarte.
  expect(armorBox.x).toBeGreaterThanOrEqual(weaponBox.x + weaponBox.width);
  expect(detailBox.x).toBeGreaterThanOrEqual(armorBox.x + armorBox.width);

  const slotOrder = await armorColumn.locator('[data-loadout-slot]').evaluateAll((slots) => {
    const elements = slots as unknown as { getAttribute(name: string): string | null }[];
    return elements.map((slot) => slot.getAttribute('data-loadout-slot'));
  });
  expect(slotOrder).toEqual(['head', 'chest', 'legs', 'feet']);

  expect(await scrollState(page, 'html')).toEqual({ scrollsX: false, scrollsY: false });
  const mainScroll = await page.getByRole('main').evaluate((element) => {
    const scrollContainer = element as unknown as {
      clientWidth: number;
      scrollWidth: number;
      clientHeight: number;
      scrollHeight: number;
    };
    return (
      scrollContainer.scrollHeight > scrollContainer.clientHeight ||
      scrollContainer.scrollWidth > scrollContainer.clientWidth
    );
  });
  expect(mainScroll).toBe(false);
});

test('selection only swaps the detail card and locked slots stay inert', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openLoadout(page);

  const detail = page.getByTestId('loadout-detail');
  await expect(detail.getByRole('heading', { name: 'WARHAMMER' })).toBeVisible();
  await expect(detail.getByText('9.8 – 18.2')).toBeVisible();

  await page.getByRole('button', { name: 'Chest, Chest Armor +1' }).click();
  await expect(detail.getByRole('heading', { name: 'Chest Armor +1' })).toBeVisible();
  await expect(detail.getByText('Base Item Type')).toBeVisible();
  await expect(detail.getByText('+1 Toughness')).toBeVisible();
  // Die persistierten Schichten Seltenheit, Item-Level-Cap und Sockel (Task 026).
  await expect(detail.getByText('Common', { exact: true })).toBeVisible();
  await expect(detail.getByText('+1 / +20')).toBeVisible();
  await expect(detail.getByText('Sockets')).toBeVisible();
  await expect(detail.getByText('None', { exact: true })).toBeVisible();

  // Gesperrte Slots sind keine Buttons, tragen aber einen zugänglichen Locked-Status.
  const lockedHead = page.locator('[data-loadout-slot="head"]');
  await expect(lockedHead).toHaveAttribute('data-semantic', 'locked');
  await expect(lockedHead).toContainText('Locked');
  await expect(page.locator('button[data-loadout-slot="head"]')).toHaveCount(0);

  const talisman = page.getByRole('button', { name: 'Talisman, Locked' });
  await talisman.click();
  await expect(detail.getByRole('heading', { name: 'Talisman' })).toBeVisible();
  await expect(detail.getByText(/Unlocks with Runes \(M5\)/)).toBeVisible();
});

test('follows the shared character switcher and stacks on narrow viewports', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openLoadout(page);

  await page.getByRole('radio', { name: 'Rhaya' }).click();
  const detail = page.getByTestId('loadout-detail');
  await expect(detail.getByRole('heading', { name: 'TWIN BLADES' })).toBeVisible();
  await expect(detail.getByText('14.4 – 21.6')).toBeVisible();

  await page.setViewportSize({ width: 1024, height: 768 });
  const weapon = page.getByRole('button', { name: 'Signature Weapon TWIN BLADES' });
  const [weaponBox, armorBox, detailBox] = await Promise.all([
    weapon.boundingBox(),
    page.getByTestId('loadout-armor-column').boundingBox(),
    detail.boundingBox(),
  ]);
  if (weaponBox === null || armorBox === null || detailBox === null) {
    throw new Error('Stacked loadout layout must be visible');
  }
  expect(armorBox.y).toBeGreaterThanOrEqual(weaponBox.y + weaponBox.height);
  expect(detailBox.y).toBeGreaterThanOrEqual(armorBox.y + armorBox.height);
  expect(await scrollState(page, 'html')).toEqual({ scrollsX: false, scrollsY: false });
});
