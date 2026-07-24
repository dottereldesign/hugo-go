import { expect, test } from '@playwright/test';

test('shows the HUGO GO! home screen with Hugo and all six worlds', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('HUGO GO!');
  await expect(page.getByRole('heading', { name: 'HUGO GO!' })).toBeVisible();
  await expect(page.locator('#home-player-name')).toHaveText('Hugo');
  await expect(page.locator('[data-home-world]')).toHaveCount(6);
  await expect(page.locator('[data-home-world="forest"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Flap. Boost. Go!')).toBeVisible();
});

test('selects a world without opening maps or levels', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-home-world="space"]').click();

  await expect(page.locator('[data-home-world="space"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#home-status')).toContainText('Space World selected');
  await expect(page.locator('#game-screen')).toBeHidden();
  await expect(page.locator('text=/map|level select/i')).toHaveCount(0);
});

test('Play opens the new flight-game page and Back returns home', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-home-world="music"]').click();
  await page.getByRole('button', { name: 'Play HUGO GO!' }).click();

  await expect(page).toHaveURL(/#\/game$/);
  await expect(page.locator('#home-screen')).not.toHaveClass(/is-open/);
  await expect(page.locator('#game-screen')).toBeVisible();
  await expect(page.locator('#game-world-label')).toHaveText('Music World');
  await expect(page.getByText('Flight course coming next')).toBeVisible();

  await page.getByRole('button', { name: /Back home/i }).click();
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.locator('#home-screen')).toHaveClass(/is-open/);
});

test('keeps home panels and compact navigation usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.locator('#home-menu-button').click();
  await expect(page.locator('#home-mobile-menu')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Learning worlds' })).toBeVisible();

  await page.locator('#home-mobile-menu-close').click();
  await page.getByRole('button', { name: /Missions/i }).click();
  await expect(page.locator('#home-panel-modal')).toHaveClass(/is-open/);
  await expect(page.locator('#home-panel-title')).toHaveText('Missions');
  await expect(page.getByText('Coming with the flight game')).toBeVisible();
});
