import { expect, test } from '@playwright/test';

test('lÃ¤dt den Dungeons-View mit dem Kampfbildschirm', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'DUNGEONS', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('heading', { name: 'Combat', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Scroll formation left' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Scroll formation right' })).toBeDisabled();
});

test('navigiert zwischen den Views', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'RUNES' }).click();

  await expect(page.getByRole('heading', { name: 'RUNES' })).toBeVisible();
});

test('zeigt alle vorgesehenen Bereiche in der PrimÃ¤rnavigation', async ({ page }) => {
  await page.goto('/');

  for (const label of ['DUNGEONS', 'TEAM', 'CRUCIBLE', 'BLACKSMITH', 'JEWELER', 'RUNES']) {
    await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
  }
});

test('committet einen Sieg und behÃ¤lt die Belohnung nach Reload', async ({ page }) => {
  test.setTimeout(75_000);
  await page.addInitScript(() => {
    const key = 'crucible-idle-rpg:save';
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          saveSeed: 4242,
          runCounter: 0,
          playbackSpeed: 1,
          characters: {
            korvin: { level: 1, xp: 0 },
            rhaya: { level: 1, xp: 0 },
            quinn: { level: 1, xp: 0 },
          },
          currencies: { gold: 0, crystals: 0 },
          firstVictories: [],
        }),
      );
    }
  });
  await page.goto('/');

  await page.getByRole('button', { name: 'Start Combat' }).click();
  await expect(page.getByRole('button', { name: 'Resume Combat' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume Combat' }).click();

  await expect(
    page.getByRole('list', { name: 'Combat log' }).getByRole('listitem').first(),
  ).toBeVisible({ timeout: 3_000 });
  await expect(page.getByRole('button', { name: 'Pause Combat' })).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Combat log' }).getByRole('listitem').nth(1),
  ).toBeVisible({ timeout: 3_000 });
  await expect(page.getByRole('button', { name: 'Pause Combat' })).toBeVisible();

  await expect(page.getByText(/Reward saved: \+10 Gold/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel('Gold balance')).toContainText('10');
  await expect(page.getByLabel('Crystal balance')).toContainText('1');
  await expect(page.getByLabel('Team XP balance')).toContainText('15');

  await page.reload();
  await expect(page.getByRole('button', { name: 'Start Combat' })).toBeVisible();
  await expect(page.getByLabel('Gold balance')).toContainText('10');
  await expect(page.getByLabel('Crystal balance')).toContainText('1');
  await expect(page.getByLabel('Team XP balance')).toContainText('15');

  await page.getByRole('button', { name: 'Start Combat' }).click();
  await expect(page.getByText('A1-D1-01')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start Combat' })).toBeVisible();
  await expect(page.getByLabel('Gold balance')).toContainText('10');
});

test('hÃ¤lt die 2Ã—3-Formation auf schmalen Viewports im eigenen Scrollbereich', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Combat' }).click();

  const scroller = page.getByTestId('enemy-formation-scroll');
  const metrics = {
    clientWidth: await scroller.evaluate<number>((element) =>
      Number(Reflect.get(element, 'clientWidth')),
    ),
    scrollWidth: await scroller.evaluate<number>((element) =>
      Number(Reflect.get(element, 'scrollWidth')),
    ),
    pageWidth: await page
      .locator('html')
      .evaluate<number>((element) => Number(Reflect.get(element, 'scrollWidth'))),
  };

  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
  expect(metrics.pageWidth).toBe(375);

  await expect(page.getByRole('button', { name: 'Scroll formation left' })).toBeDisabled();
  const scrollRight = page.getByRole('button', { name: 'Scroll formation right' });
  await expect(scrollRight).toBeEnabled();
  await scrollRight.focus();
  await expect(scrollRight).toBeFocused();
  await page.keyboard.press('Enter');
  await expect
    .poll(() => scroller.evaluate<number>((element) => Number(Reflect.get(element, 'scrollLeft'))))
    .toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: 'Scroll formation left' })).toBeEnabled();
});
