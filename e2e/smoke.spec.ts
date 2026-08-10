import { expect, test } from '@playwright/test';

test('loads the accessible dungeon selection', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Crucible Idle RPG' })).toBeVisible();
  await expect(page.getByLabel('Resources')).toBeVisible();
  await expect(page.getByRole('button', { name: 'DUNGEONS', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ENTER DUNGEON' })).toBeEnabled();

  await page.getByText('DUNGEON II', { exact: true }).click();
  await expect(page.getByRole('radio', { name: /DUNGEON II\b/ })).toBeChecked();
  await expect(page.getByRole('button', { name: 'ENTER DUNGEON' })).toBeDisabled();
  await page.getByText('DUNGEON I', { exact: true }).click();
  await expect(page.getByRole('radio', { name: /DUNGEON I\b/ })).toBeChecked();
  await expect(page.getByRole('button', { name: 'ENTER DUNGEON' })).toBeEnabled();
});

test('isolates a dungeon run without sidebar branding or resources', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER DUNGEON' }).click();

  await expect(page.getByRole('heading', { name: 'A1-D1-01' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Crucible Idle RPG' })).toHaveCount(0);
  await expect(page.getByLabel('Resources')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'CRUCIBLE', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Leave Dungeon' }).click();
  await page.getByRole('button', { name: 'Confirm Leave Dungeon' }).click();

  await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await expect(page.getByLabel('Resources')).toBeVisible();
});

test('reload during a run returns to the selection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER DUNGEON' }).click();
  await expect(page.getByRole('heading', { name: 'A1-D1-01' })).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Dungeons', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ENTER DUNGEON' })).toBeVisible();
});
