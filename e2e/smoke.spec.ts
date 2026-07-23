import { expect, test } from '@playwright/test';

test('lädt und zeigt den Kampf-View', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Combat' })).toBeVisible();
});

test('navigiert zwischen den Views', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Upgrades' }).click();
  await expect(page.getByRole('heading', { name: 'Upgrades' })).toBeVisible();
});
