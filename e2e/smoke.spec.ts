import { expect, test, type Locator } from '@playwright/test';

async function gridMetrics(locator: Locator) {
  return locator.evaluate((element) => {
    const htmlElement = element as unknown as {
      clientWidth: number;
      scrollWidth: number;
      ownerDocument: {
        defaultView: {
          getComputedStyle: (target: unknown) => { gridTemplateColumns: string };
        } | null;
      };
    };
    const view = htmlElement.ownerDocument.defaultView;
    if (view === null) throw new Error('Grid has no browser window');

    return {
      columns: view.getComputedStyle(element).gridTemplateColumns.split(' ').length,
      clientWidth: htmlElement.clientWidth,
      scrollWidth: htmlElement.scrollWidth,
    };
  });
}

async function elementWidth(locator: Locator) {
  return locator.evaluate((element) => (element as unknown as { clientWidth: number }).clientWidth);
}

/**
 * Hintergrund und Kontrast-Overlay eines Screens bluten um `--spacing-frame-bleed`
 * nach außen unter die Goldlinie des App-Rahmens (UI.md §1). Der Rahmen-Wrapper
 * klippt diesen Überlauf, `main` ist selbst kein Scroll-Container. Container, die
 * den Bleed tragen, werden daher mit dieser Toleranz geprüft.
 */
const FRAME_BLEED = 8;

const RITE_CONFIGURATION_SAVE = {
  version: 1,
  saveSeed: 42,
  runCounter: 0,
  craftCounter: 0,
  playbackSpeed: 1,
  characters: {
    korvin: {
      level: 1,
      xp: 0,
      freeAttributePoints: 1,
      attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
      freeMasteryPoints: 1,
      masteryRanks: {},
    },
    rhaya: {
      level: 1,
      xp: 0,
      freeAttributePoints: 1,
      attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
      freeMasteryPoints: 1,
      masteryRanks: {},
    },
    quinn: {
      level: 1,
      xp: 0,
      freeAttributePoints: 1,
      attributePoints: { ferocity: 0, resilience: 0, vigor: 0 },
      freeMasteryPoints: 1,
      masteryRanks: {},
    },
  },
  currencies: { gold: 0, relicShards: 0, cinder: 0, runewords: 0 },
  gems: { amber: 0, ruby: 0, sapphire: 0, emerald: 0, diamond: 0 },
  sigils: {},
  runes: {
    'rune.trigger.on-crit': 1,
    'rune.effect.heal': 1,
    'rune.modifier.echo': 1,
  },
  rites: {
    korvin: { triggerRuneId: null, effectRuneId: null, modifierRuneId: null },
    rhaya: { triggerRuneId: null, effectRuneId: null, modifierRuneId: null },
    quinn: { triggerRuneId: null, effectRuneId: null, modifierRuneId: null },
  },
  firstVictories: [],
  crucible: {
    'anvil.rune-grimoire': 1,
    'anvil.talisman': 2,
    'anvil.runic-focus': 1,
    'anvil.rune-mastery': 1,
  },
  armor: { korvin: {}, rhaya: {}, quinn: {} },
  completedDungeons: {
    'A1-D1': false,
    'A1-D2': false,
    'A1-D3': false,
    'A1-D4': false,
    'A1-D5': false,
  },
} as const;

async function scrollState(locator: Locator, tolerance = 0) {
  return locator.evaluate((element, slack) => {
    const scrollContainer = element as unknown as {
      clientWidth: number;
      scrollWidth: number;
      clientHeight: number;
      scrollHeight: number;
    };
    return {
      scrollsX: scrollContainer.scrollWidth - scrollContainer.clientWidth > slack,
      scrollsY: scrollContainer.scrollHeight - scrollContainer.clientHeight > slack,
    };
  }, tolerance);
}

test('loads the accessible dungeon selection', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'DUNGEONS', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ENTER DUNGEON' })).toBeEnabled();

  // Sichtbare Klickziele sind die Dungeon-Namen unter den Toren; die Labels
  // ("DUNGEON II") sind sr-only-Bestandteile des Accessible Name.
  await page.getByText('The Charred Vaults', { exact: true }).click();
  await expect(page.getByRole('radio', { name: /DUNGEON II\b/ })).toBeChecked();
  await expect(page.getByRole('button', { name: 'ENTER DUNGEON' })).toHaveCount(0);
  await page.getByText('Cinder Gate', { exact: true }).click();
  await expect(page.getByRole('radio', { name: /DUNGEON I\b/ })).toBeChecked();
  await expect(page.getByRole('button', { name: 'ENTER DUNGEON' })).toBeEnabled();
});

test('keeps the shared character switcher inside the sidebar at target desktop sizes', async ({
  page,
}) => {
  for (const viewport of [
    { width: 2048, height: 785 },
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const activeNavItem = page.getByRole('button', { name: 'WEAPON MASTERY', exact: true });
    await activeNavItem.click();

    const navWidths = await activeNavItem.evaluate((element) => {
      const navElement = element as unknown as {
        clientWidth: number;
        parentElement: { clientWidth: number };
      };
      return { item: navElement.clientWidth, row: navElement.parentElement.clientWidth };
    });
    expect(navWidths.item).toBe(navWidths.row);

    const switcher = page.getByRole('radiogroup', { name: 'Active character' });
    await expect(switcher).toBeVisible();
    const korvin = switcher.getByRole('radio', { name: 'Korvin' });
    await expect(korvin).toHaveAttribute('aria-checked', 'true');
    await expect(korvin.locator('[data-character-part="portrait"]')).toBeVisible();
    await expect(korvin.locator('[data-character-part="frame"]')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(korvin).toBeFocused();
    await expect(korvin).toHaveCSS('outline-style', 'solid');
    await expect(page.getByRole('heading', { name: 'Weapon Mastery' })).toBeVisible();
    const masteryBackground = page.locator('[data-screen-background="weapon-mastery"]');
    await expect(masteryBackground).toHaveCSS('background-image', /weapon-mastery-view\.png/);
    await expect(page.locator('[id^="mastery-tree-panel-"]')).toHaveCSS('overflow', 'visible');

    const [backgroundBox, mainViewBox, switcherBox, sidebarBox] = await Promise.all([
      masteryBackground.boundingBox(),
      page.getByRole('main').boundingBox(),
      switcher.boundingBox(),
      page.locator('aside.border-image-frame').boundingBox(),
    ]);
    if (
      backgroundBox === null ||
      mainViewBox === null ||
      switcherBox === null ||
      sidebarBox === null
    ) {
      throw new Error('Weapon Mastery layout must be visible');
    }
    expect(Math.abs(backgroundBox.x - (mainViewBox.x - FRAME_BLEED))).toBeLessThanOrEqual(1);
    expect(
      Math.abs(backgroundBox.width - (mainViewBox.width + 2 * FRAME_BLEED)),
    ).toBeLessThanOrEqual(1);
    expect(switcherBox.height).toBeLessThanOrEqual(124);
    expect(switcherBox.x).toBeGreaterThanOrEqual(sidebarBox.x);
    expect(switcherBox.x + switcherBox.width).toBeLessThanOrEqual(sidebarBox.x + sidebarBox.width);

    const dimensions = await page.locator('html').evaluate((element) => {
      const htmlElement = element as unknown as { clientWidth: number; scrollWidth: number };
      return { clientWidth: htmlElement.clientWidth, scrollWidth: htmlElement.scrollWidth };
    });
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});

test('separates the character-bound Runescribe from the shared Rune Grimoire', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'RUNESCRIBE', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Runescribe', exact: true })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Active character' })).toBeVisible();
  await expect(page.getByLabel('Korvin Talisman and Rite')).toBeVisible();
  await expect(page.locator('[data-character-id]')).toHaveCount(1);

  await page.getByRole('radio', { name: 'Rhaya' }).click();
  await expect(page.getByLabel('Rhaya Talisman and Rite')).toBeVisible();
  await expect(page.getByLabel('Korvin Talisman and Rite')).toHaveCount(0);

  await page.getByRole('button', { name: 'RUNE GRIMOIRE', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Rune Grimoire', exact: true })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Active character' })).toHaveCount(0);
  await expect(page.locator('[data-character-id]')).toHaveCount(0);
});

test('keeps Rune Grimoire frame outsets inside its local scroller', async ({ page }) => {
  await page.setViewportSize({ width: 2048, height: 560 });
  await page.addInitScript((save) => {
    if (localStorage.getItem('crucible-idle-rpg:save') === null) {
      localStorage.setItem('crucible-idle-rpg:save', JSON.stringify(save));
    }
  }, RITE_CONFIGURATION_SAVE);
  await page.goto('/');
  await page.getByRole('button', { name: 'RUNE GRIMOIRE', exact: true }).click();

  const scroller = page.getByTestId('rune-grimoire-chapters-scroll');
  const chapter = page.getByLabel('TRIGGERS rune chapter');
  await expect(chapter.locator('.border-image-standard')).toBeVisible();
  await expect(scroller).toHaveCSS('padding-top', '12px');

  const [scrollerBox, chapterBox] = await Promise.all([
    scroller.boundingBox(),
    chapter.boundingBox(),
  ]);
  if (scrollerBox === null || chapterBox === null) {
    throw new Error('Rune Grimoire chapter scroller must stay visible');
  }
  expect(chapterBox.y - scrollerBox.y).toBeGreaterThanOrEqual(12);
});

test('persists a bound Rite Modifier and keeps the Runescribe inside the viewport', async ({
  page,
}) => {
  await page.addInitScript((save) => {
    if (localStorage.getItem('crucible-idle-rpg:save') === null) {
      localStorage.setItem('crucible-idle-rpg:save', JSON.stringify(save));
    }
  }, RITE_CONFIGURATION_SAVE);
  await page.goto('/');
  await page.getByRole('button', { name: 'RUNESCRIBE', exact: true }).click();

  const bind = async (slot: 'TRIGGER' | 'EFFECT' | 'MODIFIER', rune: string) => {
    await page.getByRole('button', { name: `Korvin ${slot} slot, empty` }).click();
    const workbench = page.getByRole('region', { name: 'Rite socket selection' });
    await workbench.getByRole('button', { name: `Bind ${rune}, level 1` }).click();
    await expect(page.getByRole('button', { name: `Korvin ${slot} slot, ${rune}` })).toBeVisible();
    await page.getByRole('button', { name: 'Close Rite socket selection' }).click();
  };

  await bind('TRIGGER', 'On Crit');
  await bind('EFFECT', 'Heal');
  await bind('MODIFIER', 'Echo');
  await expect(page.getByText('Frequency · Echoes the Effect at 50% strength.')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = localStorage.getItem('crucible-idle-rpg:save');
        return saved === null
          ? null
          : (JSON.parse(saved) as typeof RITE_CONFIGURATION_SAVE).rites.korvin;
      }),
    )
    .toEqual({
      triggerRuneId: 'rune.trigger.on-crit',
      effectRuneId: 'rune.effect.heal',
      modifierRuneId: 'rune.modifier.echo',
    });
  expect(await scrollState(page.locator('html'))).toEqual({ scrollsX: false, scrollsY: false });

  await page.reload();
  await page.getByRole('button', { name: 'RUNESCRIBE', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Korvin MODIFIER slot, Echo' })).toBeVisible();
  await expect(page.getByText('Frequency · Echoes the Effect at 50% strength.')).toBeVisible();
});

test('keeps Heroes local to the shared character context and its own scroll area', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  await page.getByRole('button', { name: 'HEROES', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Heroes', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Stats' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Derived', exact: true })).toHaveCount(0);

  // Das Charakterportal trägt Figur, Rahmen und Name als getrennte Ebenen.
  const portal = page.getByTestId('heroes-portal-frame');
  await expect(portal.getByAltText('Korvin figure')).toBeVisible();
  await expect(portal.locator('[data-character-part="frame"]')).toHaveAttribute(
    'src',
    '/assets/frames/character-portal-frame.png',
  );
  await expect(portal.getByText('Korvin')).toBeVisible();

  const portalColumn = page.getByTestId('heroes-portal-column');
  const combatColumn = page.getByTestId('heroes-combat-column');
  const detailColumn = page.getByTestId('heroes-detail-column');
  const levelPanel = page.getByTestId('heroes-progression');
  const combatStats = page.getByTestId('heroes-combat-stats');

  await expect(levelPanel.getByText('Level 1')).toBeVisible();
  await expect(levelPanel.getByText('XP 0 / 75')).toBeVisible();
  await expect(combatStats.locator('[data-combat-stat="attack"]')).toContainText('Attack');
  await expect(combatStats.locator('[data-combat-stat="health"]')).toContainText('320');
  for (const group of ['Core', 'Offensive', 'Defensive', 'Utility']) {
    await expect(page.getByRole('heading', { name: group, exact: true })).toBeVisible();
  }

  // Dreispaltig: Attribute links, Portal in der Mitte, Detail-Listen rechts.
  const [combatBox, portalBox, detailBox, levelBox, frameBox] = await Promise.all([
    combatColumn.boundingBox(),
    portalColumn.boundingBox(),
    detailColumn.boundingBox(),
    levelPanel.boundingBox(),
    portal.boundingBox(),
  ]);
  if (
    combatBox === null ||
    portalBox === null ||
    detailBox === null ||
    levelBox === null ||
    frameBox === null
  ) {
    throw new Error('Heroes stat columns must be visible');
  }
  expect(combatBox.x + combatBox.width).toBeLessThanOrEqual(portalBox.x + 1);
  expect(portalBox.x + portalBox.width).toBeLessThanOrEqual(detailBox.x + 1);
  expect(Math.abs(combatBox.y - portalBox.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(portalBox.y - detailBox.y)).toBeLessThanOrEqual(1);
  // Das Level-Panel schließt die Mittelspalte ab, das Portal steht direkt darüber.
  expect(
    Math.abs(levelBox.y + levelBox.height - (portalBox.y + portalBox.height)),
  ).toBeLessThanOrEqual(1);
  expect(levelBox.y - (frameBox.y + frameBox.height)).toBeLessThanOrEqual(17);
  // Das Portal nutzt die Breite seiner Spalte aus.
  expect(frameBox.width).toBeGreaterThanOrEqual(portalBox.width - 1);

  // Der Respec-Entwurf bleibt lokal und verlangt Gold-Deckung.
  await expect(page.getByTestId('heroes-free-points')).toHaveText('1 attribute point available');
  await page.getByRole('button', { name: 'Increase Ferocity' }).click();
  await expect(combatStats.locator('[data-combat-stat="attack"]')).toContainText('14.17');
  await expect(page.getByRole('button', { name: 'Increase Ferocity' })).toBeDisabled();

  const attributesPanel = page.getByTestId('heroes-attributes');
  const restingHeight = (await attributesPanel.boundingBox())?.height;
  await page.getByRole('button', { name: 'Respec attributes' }).click();
  // Der Respec-Modus tauscht nur die Buttons der Fußzeile; das Panel behält seine Höhe.
  expect((await attributesPanel.boundingBox())?.height).toBe(restingHeight);
  await page.getByRole('button', { name: 'Decrease Ferocity' }).click();
  await expect(page.getByTestId('heroes-respec-draft')).toContainText(/Cost \d+ Gold/);
  await expect(page.getByTestId('heroes-respec-funds')).toBeVisible();
  await expect(combatStats.locator('[data-combat-stat="attack"]')).toContainText('14');
  await expect(page.getByRole('button', { name: 'Confirm respec' })).toBeDisabled();
  expect((await attributesPanel.boundingBox())?.height).toBe(restingHeight);
  await page.getByRole('button', { name: 'Cancel respec' }).click();
  await expect(page.getByTestId('heroes-respec-draft')).toHaveCount(0);
  await expect(page.getByTestId('heroes-respec-funds')).toHaveCount(0);
  await expect(combatStats.locator('[data-combat-stat="attack"]')).toContainText('14.17');

  // Zweispaltig: das Portal spannt über beide Stat-Spalten.
  await page.setViewportSize({ width: 1280, height: 720 });
  const [narrowPortal, narrowCombat, narrowDetail] = await Promise.all([
    portalColumn.boundingBox(),
    combatColumn.boundingBox(),
    detailColumn.boundingBox(),
  ]);
  if (narrowPortal === null || narrowCombat === null || narrowDetail === null) {
    throw new Error('Heroes stat columns must stay visible in the two-column layout');
  }
  expect(narrowPortal.y + narrowPortal.height).toBeLessThanOrEqual(narrowCombat.y + 1);
  expect(narrowCombat.x + narrowCombat.width).toBeLessThanOrEqual(narrowDetail.x + 1);
  expect(Math.abs(narrowCombat.y - narrowDetail.y)).toBeLessThanOrEqual(1);

  /*
   * Die rechte Spalte tragt 12 Stat-Zeilen, weil die Offensive Stats paarweise stehen: in
   * jeder dreispaltigen Klasse passt der Bereich damit ohne Scroll. Unterhalb des
   * 68rem-Thresholds spannt das Portal uber beide Stat-Spalten und stapelt darueber; dort
   * uebernimmt der lokale Scroller des Panels. Quer gescrollt wird nie, und der Scroll bleibt
   * lokal (UI.md §1, §3).
   */
  for (const viewport of [
    { width: 1366, height: 768, scrollsY: true },
    { width: 1536, height: 864, scrollsY: false },
    { width: 1600, height: 900, scrollsY: false },
    { width: 1920, height: 1080, scrollsY: false },
    { width: 2560, height: 1440, scrollsY: false },
  ]) {
    await page.setViewportSize(viewport);
    expect(await scrollState(page.locator('#heroes-panel-stats'))).toEqual({
      scrollsX: false,
      scrollsY: viewport.scrollsY,
    });
    expect(await scrollState(page.locator('html'))).toEqual({ scrollsX: false, scrollsY: false });
    expect(await scrollState(page.getByRole('main'), FRAME_BLEED)).toEqual({
      scrollsX: false,
      scrollsY: false,
    });
  }

  await page.getByRole('radio', { name: 'Rhaya' }).click();
  await expect(
    page.getByText("Review Rhaya's current combat capabilities and prepare for the depths."),
  ).toBeVisible();
  await expect(portal.getByAltText('Rhaya figure')).toBeVisible();
  await expect(combatStats.locator('[data-combat-stat="attack"]')).toContainText('18');

  const stats = page.getByRole('tab', { name: 'Stats' });
  await stats.focus();
  await stats.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Loadout' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('Signature Weapon');

  await page.getByRole('button', { name: 'CRUCIBLE', exact: true }).click();
  await page.getByRole('button', { name: 'HEROES', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Loadout' })).toHaveAttribute('aria-selected', 'true');
  expect(await scrollState(page.locator('html'))).toEqual({ scrollsX: false, scrollsY: false });
  expect(await scrollState(page.getByRole('main'), FRAME_BLEED)).toEqual({
    scrollsX: false,
    scrollsY: false,
  });

  await page.reload();
  await page.getByRole('button', { name: 'HEROES', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Stats' })).toHaveAttribute('aria-selected', 'true');
});

test('keeps mastery tab focus ornaments visible and scrolls tall trees within their panel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 700 });
  await page.goto('/');
  await page.getByRole('button', { name: 'WEAPON MASTERY', exact: true }).click();

  const dominance = page.getByRole('tab', { name: 'DOMINANCE', exact: true });
  await dominance.click();
  await dominance.press('Shift+Tab');
  await page.getByRole('tab', { name: 'TEMPEST', exact: true }).press('Tab');
  await expect(dominance).toHaveCSS('outline-style', 'solid');

  const [mainMetrics, treeMetrics] = await Promise.all([
    page.getByRole('main').evaluate((element) => {
      const scrollContainer = element as unknown as { clientHeight: number; scrollHeight: number };
      return {
        clientHeight: scrollContainer.clientHeight,
        scrollHeight: scrollContainer.scrollHeight,
      };
    }),
    page.locator('#mastery-tree-panel-dominance > div.overflow-auto').evaluate((element) => {
      const scrollContainer = element as unknown as { clientHeight: number; scrollHeight: number };
      return {
        clientHeight: scrollContainer.clientHeight,
        scrollHeight: scrollContainer.scrollHeight,
      };
    }),
  ]);

  expect(mainMetrics.scrollHeight).toBeLessThanOrEqual(mainMetrics.clientHeight + FRAME_BLEED);
  expect(treeMetrics.scrollHeight).toBeGreaterThan(treeMetrics.clientHeight);
});

test('keeps the ornamental mastery tabs inside their own narrow-screen scroller', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  await page.getByRole('button', { name: 'WEAPON MASTERY', exact: true }).click();

  const navigation = page.getByTestId('mastery-discipline-navigation');
  const scroller = navigation.locator('.overflow-x-auto');
  const [documentMetrics, navigationMetrics] = await Promise.all([
    page.locator('html').evaluate((element) => {
      const html = element as unknown as { clientWidth: number; scrollWidth: number };
      return { clientWidth: html.clientWidth, scrollWidth: html.scrollWidth };
    }),
    scroller.evaluate((element) => {
      const tabs = element as unknown as { clientWidth: number; scrollWidth: number };
      return { clientWidth: tabs.clientWidth, scrollWidth: tabs.scrollWidth };
    }),
  ]);

  expect(documentMetrics.scrollWidth).toBeLessThanOrEqual(documentMetrics.clientWidth);
  expect(navigationMetrics.scrollWidth).toBeGreaterThan(navigationMetrics.clientWidth);
  await expect(page.getByRole('tab', { name: 'WARHAMMER', exact: true })).toHaveAttribute(
    'data-selected',
    '',
  );
  await expect(page.locator('[data-ornate-tab-bar]').first()).toBeVisible();
});

test('renders the Crucible graph without horizontal overflow at wide and stacked widths', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1680, height: 937 });
  await page.goto('/');
  await page.getByRole('button', { name: 'CRUCIBLE', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Crucible', exact: true })).toBeVisible();
  await expect(page.locator('[data-screen-background="crucible"]')).toHaveCSS(
    'background-image',
    /crucible-view\.png/,
  );
  await expect(page.getByRole('tab', { name: 'ANVIL SPARKS' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(
    page.getByRole('tab', { name: 'ANVIL SPARKS' }).locator('[data-ornate-tab-selection]'),
  ).toHaveCSS('opacity', '1');
  await expect(
    page.getByRole('tab', { name: 'SMELTING FLAMES' }).locator('[data-ornate-tab-selection]'),
  ).toHaveCSS('opacity', '0');
  await expect(page.getByRole('tab')).toHaveCount(3);
  await expect(page.getByRole('tab', { name: 'MASTERWORK' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Waystones,/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Rune Grimoire,/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Runic Focus,/ })).toBeVisible();

  await page.getByRole('tab', { name: 'SMELTING FLAMES' }).click();
  await page.getByRole('button', { name: /^Overpower,/ }).click();
  await expect(page.getByText('Requires 1 Relic Shard.')).toBeVisible();
  await expect(page.getByText('1 Relic Shard', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'ANVIL SPARKS' }).click();

  const layout = page.getByTestId('crucible-layout');
  const navigation = page.getByTestId('crucible-tree-navigation');
  const graph = page.getByTestId('crucible-tree-graph');
  const inspector = page.getByRole('complementary', { name: 'Crucible node inspector' });
  const tablist = page.getByRole('tablist', { name: 'Trees' });
  const wideLayout = await gridMetrics(layout);
  expect(wideLayout.columns).toBe(2);
  expect(wideLayout.scrollWidth).toBeLessThanOrEqual(wideLayout.clientWidth);
  expect((await gridMetrics(tablist)).columns).toBe(3);
  expect(Math.abs((await elementWidth(navigation)) - (await elementWidth(layout)))).toBeLessThan(1);
  const [graphBox, inspectorBox] = await Promise.all([
    graph.boundingBox(),
    inspector.boundingBox(),
  ]);
  if (graphBox === null || inspectorBox === null)
    throw new Error('Crucible panels are not visible');
  expect(Math.abs(graphBox.y - inspectorBox.y)).toBeLessThan(1);

  await page.setViewportSize({ width: 1180, height: 900 });
  const stackedLayout = await gridMetrics(layout);
  expect(stackedLayout.columns).toBe(1);
  expect(stackedLayout.scrollWidth).toBeLessThanOrEqual(stackedLayout.clientWidth);
  expect((await gridMetrics(tablist)).columns).toBe(3);
  expect(Math.abs((await elementWidth(navigation)) - (await elementWidth(layout)))).toBeLessThan(1);

  await page.setViewportSize({ width: 768, height: 900 });
  const scroller = navigation.locator('.overflow-x-auto');
  const [documentMetrics, navigationMetrics] = await Promise.all([
    page.locator('html').evaluate((element) => {
      const html = element as unknown as { clientWidth: number; scrollWidth: number };
      return { clientWidth: html.clientWidth, scrollWidth: html.scrollWidth };
    }),
    scroller.evaluate((element) => {
      const tabs = element as unknown as { clientWidth: number; scrollWidth: number };
      return { clientWidth: tabs.clientWidth, scrollWidth: tabs.scrollWidth };
    }),
  ]);
  expect(documentMetrics.scrollWidth).toBeLessThanOrEqual(documentMetrics.clientWidth);
  expect(navigationMetrics.scrollWidth).toBeGreaterThan(navigationMetrics.clientWidth);
  await expect(page.locator('[data-ornate-tab-bar]').first()).toBeVisible();

  await page.setViewportSize({ width: 1180, height: 900 });

  await page.getByRole('tab', { name: 'MOLTEN CAST' }).click();
  await expect(page.getByRole('button', { name: /^Mitigation,/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Second Wind,/ })).toBeVisible();
  await expect(
    page.getByRole('tabpanel', { name: 'MOLTEN CAST' }).getByRole('button', { name: 'RESPEC' }),
  ).toBeDisabled();
  await expect(page.getByRole('region', { name: 'COMBAT ARTS' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'SURVIVAL' })).toBeVisible();

  await page.setViewportSize({ width: 1680, height: 937 });
  await expect(page.getByRole('region', { name: 'COMBAT ARTS' })).toBeVisible();

  const [rallyBox, secondWindBox] = await Promise.all([
    page.locator('[data-node-medallion="molten.rally"]').boundingBox(),
    page.locator('[data-node-medallion="molten.second-wind"]').boundingBox(),
  ]);
  if (rallyBox === null || secondWindBox === null) throw new Error('Survival node is not visible');
  const survivalPairDistance = secondWindBox.x - rallyBox.x;

  for (const [sourceId, targetId] of [
    ['molten.mitigation', 'molten.menace'],
    ['molten.sunder', 'molten.ambush'],
    ['molten.suppression', 'molten.momentum'],
  ]) {
    const [sourceBox, targetBox] = await Promise.all([
      page.locator(`[data-node-medallion="${sourceId}"]`).boundingBox(),
      page.locator(`[data-node-medallion="${targetId}"]`).boundingBox(),
    ]);
    if (sourceBox === null || targetBox === null)
      throw new Error('Combat Arts node is not visible');

    expect(Math.abs(sourceBox.y - targetBox.y)).toBeLessThan(1);
    expect(targetBox.x).toBeGreaterThan(sourceBox.x);
    expect(Math.abs(targetBox.x - sourceBox.x - survivalPairDistance)).toBeLessThan(1);
  }
});

test('isolates a dungeon run without sidebar branding or resources', async ({ page }) => {
  await page.setViewportSize({ width: 1680, height: 937 });
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER DUNGEON' }).click();

  await expect(page.getByRole('heading', { name: 'The Ashen Depths — Cinder Gate' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Crucible Idle RPG' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'CRUCIBLE', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  await expect(page.getByRole('button', { name: '1×' })).toBeVisible();
  await expect(page.getByRole('button', { name: '2×' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Party' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Combat Log' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Enemy Formation', exact: true })).toBeVisible();
  const runScrolls = await page.getByRole('main').evaluate((element, slack) => {
    const scrollContainer = element as unknown as { clientHeight: number; scrollHeight: number };
    return scrollContainer.scrollHeight - scrollContainer.clientHeight > slack;
  }, FRAME_BLEED);
  const documentScrolls = await page.locator('html').evaluate((element) => {
    const scrollContainer = element as unknown as { clientHeight: number; scrollHeight: number };
    return scrollContainer.scrollHeight > scrollContainer.clientHeight;
  });
  const combatAreaScrollsHorizontally = await page
    .getByTestId('combat-main-area')
    .evaluate((element) => {
      const scrollContainer = element as unknown as { clientWidth: number; scrollWidth: number };
      return scrollContainer.scrollWidth > scrollContainer.clientWidth;
    });
  expect(runScrolls).toBe(false);
  expect(documentScrolls).toBe(false);
  expect(combatAreaScrollsHorizontally).toBe(false);

  await page.getByRole('button', { name: 'LEAVE DUNGEON' }).click();
  await page.getByRole('button', { name: 'Confirm Leave Dungeon' }).click();

  await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
});

test('keeps dungeon selection and crucible free of document and main scroll', async ({ page }) => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
    expect(await scrollState(page.locator('html'))).toEqual({ scrollsX: false, scrollsY: false });
    expect(await scrollState(page.getByRole('main'), FRAME_BLEED)).toEqual({
      scrollsX: false,
      scrollsY: false,
    });

    await page.getByRole('button', { name: 'CRUCIBLE', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Crucible', exact: true })).toBeVisible();
    expect(await scrollState(page.locator('html'))).toEqual({ scrollsX: false, scrollsY: false });
    expect(await scrollState(page.getByRole('main'), FRAME_BLEED)).toEqual({
      scrollsX: false,
      scrollsY: false,
    });
  }
});

test('reload during a run returns to the selection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER DUNGEON' }).click();
  await expect(page.getByRole('heading', { name: 'The Ashen Depths — Cinder Gate' })).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ENTER DUNGEON' })).toBeVisible();
});

test('keeps the enemy formation inside the mobile viewport without horizontal scrolling', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER DUNGEON' }).click();
  await page.setViewportSize({ width: 390, height: 844 });

  const formation = page.getByRole('region', { name: 'Enemy Formation', exact: true });
  await expect(formation).toBeVisible();
  const dimensions = await formation.evaluate((element) => {
    const htmlElement = element as unknown as { clientWidth: number; scrollWidth: number };

    return { clientWidth: htmlElement.clientWidth, scrollWidth: htmlElement.scrollWidth };
  });

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByRole('button', { name: 'Scroll formation left' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Scroll formation right' })).toHaveCount(0);
});

test('centers the combat log between equally wide hero and enemy areas', async ({ page }) => {
  await page.setViewportSize({ width: 1680, height: 937 });
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER DUNGEON' }).click();

  const heroCard = page.getByRole('region', { name: 'Party' }).getByRole('article').first();
  const formation = page.getByTestId('enemy-formation-grid');
  const frontlineCard = page.getByRole('article', { name: /frontline slot 1$/ });
  const backlineCard = page.getByRole('article', { name: /backline slot 1$/ });
  const logPanel = page.getByTestId('combat-log-panel');
  const combatArea = page.getByTestId('combat-main-area');
  const statusBar = page.getByTestId('run-status-bar');
  const [heroBox, formationBox, frontlineBox, backlineBox, logBox, combatAreaBox, statusBox] =
    await Promise.all([
      heroCard.boundingBox(),
      formation.boundingBox(),
      frontlineCard.boundingBox(),
      backlineCard.boundingBox(),
      logPanel.boundingBox(),
      combatArea.boundingBox(),
      statusBar.boundingBox(),
    ]);

  if (
    heroBox === null ||
    formationBox === null ||
    frontlineBox === null ||
    backlineBox === null ||
    logBox === null ||
    combatAreaBox === null ||
    statusBox === null
  ) {
    throw new Error('Combat columns must be visible');
  }

  expect(Math.abs(heroBox.width - formationBox.width)).toBeLessThanOrEqual(1);
  expect(frontlineBox.height).toBe(backlineBox.height);
  expect(heroBox.height).toBeLessThanOrEqual(frontlineBox.height);
  expect(Math.abs(heroBox.x - statusBox.x)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(formationBox.x + formationBox.width - (statusBox.x + statusBox.width)),
  ).toBeLessThanOrEqual(1);
  expect(heroBox.x - combatAreaBox.x).toBeGreaterThanOrEqual(6);
  expect(
    combatAreaBox.x + combatAreaBox.width - (formationBox.x + formationBox.width),
  ).toBeGreaterThanOrEqual(6);
  expect(Math.abs(heroBox.y - frontlineBox.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(heroBox.y - backlineBox.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(logBox.x + logBox.width / 2 - 1680 / 2)).toBeLessThanOrEqual(1);
});
