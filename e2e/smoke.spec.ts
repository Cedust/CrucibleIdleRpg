import { expect, test } from '@playwright/test';

test('loads the accessible dungeon selection', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'DUNGEONS', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter Dungeon' })).toBeEnabled();
  await expect(page.getByRole('radio', { name: /DUNGEON II\b/ })).toBeDisabled();
});

test('isolates a dungeon run without hiding the read-only top bar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter Dungeon' }).click();

  await expect(page.getByRole('heading', { name: 'A1-D1-01' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'CRUCIBLE', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Leave Dungeon' }).click();
  await page.getByRole('button', { name: 'Confirm Leave Dungeon' }).click();

  await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
});

test('reload during a run returns to the selection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter Dungeon' }).click();
  await expect(page.getByRole('heading', { name: 'A1-D1-01' })).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter Dungeon' })).toBeVisible();
});
