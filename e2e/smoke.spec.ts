import { expect, test } from '@playwright/test';

test('lädt und zeigt den Kampf-View', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Combat', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Scroll formation left' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Scroll formation right' })).toBeDisabled();
});

test('navigiert zwischen den Views', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Upgrades' }).click();
  await expect(page.getByRole('heading', { name: 'Upgrades' })).toBeVisible();
});

test('startet einen Kampf, spielt Takte ab und erreicht das Kampfende', async ({ page }) => {
  test.setTimeout(75_000);
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

  await expect(page.getByRole('button', { name: 'Start Again' })).toBeVisible({ timeout: 60_000 });
});

test('hält die 2×3-Formation auf schmalen Viewports im eigenen Scrollbereich', async ({ page }) => {
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
