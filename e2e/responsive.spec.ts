import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Strukturelle Responsive-Matrix: kein Seiten-Scroll,
 * funktionierende lokale Scroller, zentrierte Caps und Clamp-Token-Werte an
 * den Stützstellen 1920 / 2560 / 3840 (3440 = 2560-Äquivalent über die
 * 16:9-Normierung). Screenshot-Infrastruktur bleibt bewusst außen vor.
 */

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

async function assertNoPageScroll(page: Page) {
  expect(await scrollState(page.locator('html'))).toEqual({ scrollsX: false, scrollsY: false });
  expect(await scrollState(page.getByRole('main'))).toEqual({ scrollsX: false, scrollsY: false });
}

async function boxWidth(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const measured = element as unknown as {
      getBoundingClientRect: () => { width: number; height: number };
    };
    return measured.getBoundingClientRect().width;
  });
}

async function boxHeight(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const measured = element as unknown as {
      getBoundingClientRect: () => { width: number; height: number };
    };
    return measured.getBoundingClientRect().height;
  });
}

async function fontSizePx(locator: Locator) {
  return locator.evaluate((element) => {
    const htmlElement = element as unknown as {
      ownerDocument: { defaultView: { getComputedStyle: (t: unknown) => { fontSize: string } } };
    };
    return Number.parseFloat(
      htmlElement.ownerDocument.defaultView.getComputedStyle(element).fontSize,
    );
  });
}

async function assertCenteredIn(subject: Locator, container: Locator, tolerance = 1.5) {
  const [subjectBox, containerBox] = await Promise.all([
    subject.boundingBox(),
    container.boundingBox(),
  ]);
  if (subjectBox === null || containerBox === null) throw new Error('Boxes must be visible');
  const leftGap = subjectBox.x - containerBox.x;
  const rightGap = containerBox.x + containerBox.width - (subjectBox.x + subjectBox.width);
  expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(tolerance);
}

const nav = (page: Page) => page.locator('aside.border-image-frame');
const intro = (page: Page) => page.locator('p.font-intro').first();

test('hält 1366×768 und 1600×900 ohne Seiten-Scroll mit internen Scrollern', async ({ page }) => {
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1600, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
    await assertNoPageScroll(page);
    const cardGrid = page.getByRole('group', { name: 'Dungeon selection' });
    expect((await scrollState(cardGrid)).scrollsX).toBe(false);

    await page.getByRole('button', { name: 'CRUCIBLE', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Crucible', exact: true })).toBeVisible();
    await expect(
      page.getByRole('complementary', { name: 'Crucible node inspector' }),
    ).toBeVisible();
    await assertNoPageScroll(page);

    await page.getByRole('button', { name: 'WEAPON MASTERY', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Weapon Mastery' })).toBeVisible();
    await expect(page.locator('[data-node-medallion]').first()).toBeVisible();
    await assertNoPageScroll(page);
  }
});

test('bricht die Dungeon-Karten bei schmalem Container in eine zweite Reihe um', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');

  const cards = page.getByRole('group', { name: 'Dungeon selection' }).locator('label');
  await expect(cards).toHaveCount(5);
  const [firstBox, lastBox] = await Promise.all([
    cards.first().boundingBox(),
    cards.last().boundingBox(),
  ]);
  if (firstBox === null || lastBox === null) throw new Error('Cards must be visible');
  expect(lastBox.y).toBeGreaterThan(firstBox.y + 10);
  expect((await scrollState(page.getByRole('group', { name: 'Dungeon selection' }))).scrollsX).toBe(
    false,
  );
});

test('rendert bei 1920×1080 die Clamp-Minima', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
  expect(Math.abs((await boxWidth(nav(page))) - 288)).toBeLessThanOrEqual(0.5);
  expect(Math.abs((await fontSizePx(intro(page))) - 14)).toBeLessThanOrEqual(0.05);
  await assertNoPageScroll(page);

  await page.getByRole('button', { name: 'CRUCIBLE', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Crucible', exact: true })).toBeVisible();
  const tablist = page.getByRole('tablist', { name: 'Trees' });
  expect(Math.abs((await boxHeight(tablist)) - 52)).toBeLessThanOrEqual(0.5);
  // Branch-Medaillon md: --spacing-medallion-sm = 4rem am Clamp-Minimum
  const medallion = page.locator('[data-node-medallion="anvil.waystones"]');
  expect(Math.abs((await boxWidth(medallion)) - 64)).toBeLessThanOrEqual(0.5);
  await assertNoPageScroll(page);
});

test('skaliert die leichten Clamps bei 2560×1440 auf die Formelwerte', async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto('/');

  // 288 + 640 × 0.028125 = 306 px; text-sm 14 + 640 × 0.0018229 ≈ 15.17 px
  expect(Math.abs((await boxWidth(nav(page))) - 306)).toBeLessThanOrEqual(1);
  expect(Math.abs((await fontSizePx(intro(page))) - 15.17)).toBeLessThanOrEqual(0.15);
  await assertNoPageScroll(page);

  await page.getByRole('button', { name: 'CRUCIBLE', exact: true }).click();
  const section = page.locator('section[aria-label="Crucible"]');
  await expect(section).toBeVisible();
  // Cap --container-page = 96rem = 1536 px, zentriert im Mainview
  expect(Math.abs((await boxWidth(section)) - 1536)).toBeLessThanOrEqual(1);
  await assertCenteredIn(section, page.getByRole('main'));
  await assertNoPageScroll(page);
});

test('behandelt 3440×1440 über die 16:9-Normierung wie 1440p', async ({ page }) => {
  await page.setViewportSize({ width: 3440, height: 1440 });
  await page.goto('/');

  expect(Math.abs((await boxWidth(nav(page))) - 306)).toBeLessThanOrEqual(1);
  expect(Math.abs((await fontSizePx(intro(page))) - 15.17)).toBeLessThanOrEqual(0.15);
  await assertNoPageScroll(page);

  await page.getByRole('button', { name: 'CRUCIBLE', exact: true }).click();
  const section = page.locator('section[aria-label="Crucible"]');
  await expect(section).toBeVisible();
  expect(Math.abs((await boxWidth(section)) - 1536)).toBeLessThanOrEqual(1);
  await assertCenteredIn(section, page.getByRole('main'));
  await assertNoPageScroll(page);
});

test('erreicht bei 3840×2160 die Clamp-Maxima und cappt die Arena', async ({ page }) => {
  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.goto('/');

  expect(Math.abs((await boxWidth(nav(page))) - 342)).toBeLessThanOrEqual(1);
  expect(Math.abs((await fontSizePx(intro(page))) - 17.5)).toBeLessThanOrEqual(0.1);
  await assertNoPageScroll(page);

  await page.getByRole('button', { name: 'CRUCIBLE', exact: true }).click();
  const tablist = page.getByRole('tablist', { name: 'Trees' });
  expect(Math.abs((await boxHeight(tablist)) - 64)).toBeLessThanOrEqual(0.5);
  // Branch-Medaillon md: --spacing-medallion-sm = 5rem am Clamp-Maximum
  const medallion = page.locator('[data-node-medallion="anvil.waystones"]');
  expect(Math.abs((await boxWidth(medallion)) - 80)).toBeLessThanOrEqual(0.5);

  await page.getByRole('button', { name: 'DUNGEONS', exact: true }).click();
  await page.getByRole('button', { name: 'ENTER DUNGEON' }).click();
  await expect(page.getByRole('heading', { name: 'The Ashen Depths — Cinder Gate' })).toBeVisible();
  const arena = page.getByRole('main').locator('section').first();
  // Cap --container-run: 105rem + 1920 px × 0.2166667 = 131 rem = 2096 px
  expect(await boxWidth(arena)).toBeLessThanOrEqual(2097);
  await assertCenteredIn(arena, page.getByRole('main'));
  const documentScroll = await scrollState(page.locator('html'));
  expect(documentScroll).toEqual({ scrollsX: false, scrollsY: false });
});
