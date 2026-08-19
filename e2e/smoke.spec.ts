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

test('keeps Heroes local to the shared character context and its own scroll area', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByRole('button', { name: 'HEROES', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Heroes', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Stats' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Attack', { exact: true })).toBeVisible();
  await expect(page.getByAltText('Korvin portrait')).toBeVisible();
  await expect(page.getByText('Role', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('img', { name: 'tank role' })).toBeVisible();
  await expect(page.getByTestId('heroes-portrait-frame').getByText('Korvin')).toBeVisible();
  await expect(page.getByTestId('heroes-identity')).not.toHaveClass(/border-image-ornate/);
  await expect(page.getByText('XP', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Derived', exact: true })).toHaveCount(0);
  const progressionPanel = page.getByTestId('heroes-progression');
  const progressionContent = progressionPanel.locator(':scope > div').last();
  const [progressionBox, progressionContentBox] = await Promise.all([
    progressionPanel.boundingBox(),
    progressionContent.boundingBox(),
  ]);
  if (progressionBox === null || progressionContentBox === null) {
    throw new Error('Heroes progression panel must be visible');
  }
  const progressionTopGap = progressionContentBox.y - progressionBox.y;
  const progressionBottomGap =
    progressionBox.y +
    progressionBox.height -
    (progressionContentBox.y + progressionContentBox.height);
  expect(Math.abs(progressionTopGap - progressionBottomGap)).toBeLessThanOrEqual(1);
  const corePanel = page.getByRole('heading', { name: 'Core', exact: true }).locator('..');
  await expect(corePanel).not.toHaveClass(/border-image-ornate/);
  await expect(corePanel.locator('.border-image-thin')).toHaveCSS(
    'border-image-source',
    /panel-thin\.png/,
  );
  const attributePanel = page.getByTestId('heroes-attributes');
  const specializedStats = page.getByTestId('heroes-specialized-stats');
  const offensivePanel = page
    .getByRole('heading', { name: 'Offensive', exact: true })
    .locator('..');
  const defensivePanel = page
    .getByRole('heading', { name: 'Defensive', exact: true })
    .locator('..');
  const utilityPanel = page.getByRole('heading', { name: 'Utility', exact: true }).locator('..');
  const [
    identityBox,
    attributeBox,
    coreBox,
    specializedBox,
    offensiveBox,
    defensiveBox,
    utilityBox,
  ] = await Promise.all([
    page.getByTestId('heroes-identity').boundingBox(),
    attributePanel.boundingBox(),
    corePanel.boundingBox(),
    specializedStats.boundingBox(),
    offensivePanel.boundingBox(),
    defensivePanel.boundingBox(),
    utilityPanel.boundingBox(),
  ]);
  if (
    identityBox === null ||
    attributeBox === null ||
    coreBox === null ||
    specializedBox === null ||
    offensiveBox === null ||
    defensiveBox === null ||
    utilityBox === null
  ) {
    throw new Error('Heroes stat layout must be visible');
  }
  expect(attributeBox.y).toBeGreaterThanOrEqual(identityBox.y + identityBox.height);
  expect(coreBox.y + coreBox.height).toBeLessThanOrEqual(offensiveBox.y);
  expect(coreBox.y + coreBox.height).toBeLessThanOrEqual(defensiveBox.y);
  expect(coreBox.y + coreBox.height).toBeLessThanOrEqual(utilityBox.y);
  expect(Math.abs(coreBox.x - specializedBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(coreBox.width - specializedBox.width)).toBeLessThanOrEqual(1);
  await expect(page.getByText('1 Point Available')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Respec attributes' })).toBeDisabled();
  await page.getByRole('button', { name: 'Increase Ferocity' }).click();
  await expect(page.getByText('14.17', { exact: true })).toBeVisible();
  await expect(page.getByText('1 Point Available')).toHaveCount(0);
  for (const viewport of [
    { width: 1536, height: 864 },
    { width: 1600, height: 900 },
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 },
  ]) {
    await page.setViewportSize(viewport);
    expect(await scrollState(page.locator('#heroes-panel-stats'))).toEqual({
      scrollsX: false,
      scrollsY: false,
    });
    const alignedPanels = await Promise.all(
      [attributePanel, offensivePanel, defensivePanel, utilityPanel].map((panel) =>
        panel.boundingBox(),
      ),
    );
    const panelBottoms = alignedPanels.map((box) => {
      if (box === null) throw new Error('Aligned Heroes panels must be visible');
      return box.y + box.height;
    });
    expect(Math.max(...panelBottoms) - Math.min(...panelBottoms)).toBeLessThanOrEqual(1);
  }
  await page.getByRole('radio', { name: 'Rhaya' }).click();
  await expect(
    page.getByText("Review Rhaya's current combat capabilities and prepare for the depths."),
  ).toBeVisible();
  await expect(page.getByText('18', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'melee role' })).toBeVisible();

  const stats = page.getByRole('tab', { name: 'Stats' });
  await stats.focus();
  await stats.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Loadout' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('Signature Weapon');

  await page.getByRole('button', { name: 'CRUCIBLE', exact: true }).click();
  await page.getByRole('button', { name: 'HEROES', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Loadout' })).toHaveAttribute('aria-selected', 'true');
  expect(await scrollState(page.locator('html'))).toEqual({ scrollsX: false, scrollsY: false });
  expect(await scrollState(page.getByRole('main'))).toEqual({ scrollsX: false, scrollsY: false });

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
