import { expect, test } from '@playwright/test';

test('shows the HUGO GO! home screen with Hugo and all six worlds', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('HUGO GO!');
  await expect(page.getByRole('heading', { name: 'HUGO GO!' })).toBeVisible();
  await expect(page.locator('#home-player-name')).toHaveText('Hugo');
  await expect(page.locator('[data-home-world]')).toHaveCount(6);
  await expect(page.locator('[data-home-world="forest"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-home-world][aria-disabled="true"]')).toHaveCount(5);
  await expect(page.locator('[data-home-world="forest"]')).toContainText('Ready to fly');
  await expect(page.getByText('Flap. Boost. Go!')).toBeVisible();
});

test('keeps unfinished worlds muted and locked without opening maps or levels', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-home-world="space"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-home-world="space"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-home-world="forest"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#game-screen')).toBeHidden();
  await expect(page.locator('text=/map|level select/i')).toHaveCount(0);
});

test('Play starts Forest immediately and Back returns home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play HUGO GO!' }).click();

  await expect(page).toHaveURL(/#\/game$/);
  await expect(page.locator('#home-screen')).not.toHaveClass(/is-open/);
  await expect(page.locator('#game-screen')).toBeVisible();
  await expect(page.locator('#game-world-label')).toHaveText('Forest World');
  await expect(page.locator('#game-canvas')).toBeVisible();
  await expect(page.locator('#game-phase')).toHaveText('RUNNING');
  await expect(page.locator('#game-distance')).toHaveText(/^\d+ m$/);
  await expect(page.locator('text=/level select/i')).toHaveCount(0);

  await page.getByRole('button', { name: /Back home/i }).click();
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.locator('#home-screen')).toHaveClass(/is-open/);
});

test('clicking the game boosts Hugo upward', async ({ page }) => {
  await page.goto('/#/game');
  const before = await page.evaluate(() => window.__HUGO_GO__.getGameState().hugo.y);
  await page.locator('#game-canvas').click({ position: { x: 190, y: 420 } });
  await page.waitForTimeout(120);
  const after = await page.evaluate(() => window.__HUGO_GO__.getGameState().hugo.y);
  expect(after).toBeLessThan(before);
});

test('crashing records the run and Fly again restarts without a level screen', async ({ page }) => {
  await page.goto('/#/game');
  await expect(page.locator('#game-over-overlay')).toBeVisible({ timeout: 6_000 });
  await expect(page.locator('#game-over-result')).toHaveText(/\d+ m · \d+ coins?/);
  await expect(page.locator('#game-restart-button')).toBeFocused();

  const storedRuns = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('hugo-go-player-v1') ?? '{}') as { totalRuns?: number };
    return state.totalRuns;
  });
  expect(storedRuns).toBe(1);

  await page.locator('#game-restart-button').click();
  await expect(page.locator('#game-over-overlay')).toBeHidden();
  await expect(page.locator('#game-phase')).toHaveText('RUNNING');
  await expect(page.locator('text=/level select/i')).toHaveCount(0);
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
  await expect(page.getByText('First flight')).toBeVisible();
});
