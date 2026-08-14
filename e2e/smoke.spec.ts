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

async function scrollState(locator: Locator) {
  return locator.evaluate((element) => {
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

test('loads the accessible dungeon selection', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'DUNGEONS', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ENTER DUNGEON' })).toBeEnabled();

  await page.getByText('DUNGEON II', { exact: true }).click();
  await expect(page.getByRole('radio', { name: /DUNGEON II\b/ })).toBeChecked();
  await expect(page.getByRole('button', { name: 'ENTER DUNGEON' })).toHaveCount(0);
  await page.getByText('DUNGEON I', { exact: true }).click();
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
    expect(Math.abs(backgroundBox.x - mainViewBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(backgroundBox.width - mainViewBox.width)).toBeLessThanOrEqual(1);
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

  expect(mainMetrics.scrollHeight).toBeLessThanOrEqual(mainMetrics.clientHeight);
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
  await expect(page.locator('[data-ornate-tab-frame]').first()).toBeVisible();
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
    page.getByRole('tab', { name: 'ANVIL SPARKS' }).locator('[data-crucible-tab-surface]'),
  ).toHaveCSS('background-image', /crucible-tab-anvil-sparks\.png/);
  await expect(
    page.getByRole('tab', { name: 'SMELTING FLAMES' }).locator('[data-crucible-tab-surface]'),
  ).toHaveCSS('background-image', /crucible-tab-smelting-flames\.png/);
  await expect(
    page.getByRole('tab', { name: 'MOLTEN CAST' }).locator('[data-crucible-tab-surface]'),
  ).toHaveCSS('background-image', /crucible-tab-molten-cast\.png/);
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
  expect(Math.abs((await elementWidth(navigation)) - (await elementWidth(graph)))).toBeLessThan(1);
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
  expect(Math.abs((await elementWidth(navigation)) - (await elementWidth(graph)))).toBeLessThan(1);

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
  await expect(page.locator('[data-ornate-tab-frame]').first()).toBeVisible();

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
  const runScrolls = await page.getByRole('main').evaluate((element) => {
    const scrollContainer = element as unknown as { clientHeight: number; scrollHeight: number };
    return scrollContainer.scrollHeight > scrollContainer.clientHeight;
  });
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
    expect(await scrollState(page.getByRole('main'))).toEqual({ scrollsX: false, scrollsY: false });

    await page.getByRole('button', { name: 'CRUCIBLE', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Crucible', exact: true })).toBeVisible();
    expect(await scrollState(page.locator('html'))).toEqual({ scrollsX: false, scrollsY: false });
    expect(await scrollState(page.getByRole('main'))).toEqual({ scrollsX: false, scrollsY: false });
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
  expect(frontlineBox.height).toBe(heroBox.height);
  expect(backlineBox.height).toBe(heroBox.height);
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
