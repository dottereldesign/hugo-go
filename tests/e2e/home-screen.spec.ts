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
  await expect(page.getByText('Hold. Glide. Go!')).toBeVisible();
});

test('keeps unfinished worlds muted and locked without opening maps or levels', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-home-world="space"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-home-world="space"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-home-world="forest"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#game-screen')).toBeHidden();
  await expect(page.locator('#home-screen.is-open').locator('text=/map|level select/i')).toHaveCount(0);
});

test('Play starts Forest immediately and Back returns home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play HUGO GO!' }).click();

  await expect(page).toHaveURL(/#\/game$/);
  await expect(page.locator('#home-screen')).not.toHaveClass(/is-open/);
  await expect(page.locator('#game-screen')).toBeVisible();
  await expect(page.locator('#game-world-label')).toHaveText('Forest World');
  await expect(page.locator('#game-canvas')).toBeVisible();
  await expect(page.locator('.game-wordmark')).toHaveText('HUGOGO!');
  await expect(page.locator('#game-phase, #game-season')).toHaveCount(0);
  await expect(page.locator('#game-distance')).toHaveText(/^\d+ m$/);
  await expect(page.locator('text=/level select/i')).toHaveCount(0);

  await page.getByRole('button', { name: /Back home/i }).click();
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.locator('#home-screen')).toHaveClass(/is-open/);
});

test('holding the game glides Hugo smoothly upward and release returns gravity', async ({ page }) => {
  await page.goto('/#/game');
  const canvas = page.locator('#game-canvas');
  const before = await page.evaluate(() => window.__HUGO_GO__.getGameState().hugo.y);
  await canvas.hover({ position: { x: 190, y: 420 } });
  await page.mouse.down();
  await page.waitForTimeout(180);
  const firstHeld = await page.evaluate(() => ({ ...window.__HUGO_GO__.getGameState().hugo }));
  await page.waitForTimeout(180);
  const secondHeld = await page.evaluate(() => ({ ...window.__HUGO_GO__.getGameState().hugo }));
  expect(firstHeld.y).toBeLessThan(before);
  expect(secondHeld.y).toBeLessThan(firstHeld.y);
  expect(secondHeld.thrusting).toBe(true);
  expect(secondHeld.thrustIntensity).toBeGreaterThan(0.9);

  await page.mouse.up();
  const velocityAtRelease = await page.evaluate(() => window.__HUGO_GO__.getGameState().hugo.velocityY);
  await page.waitForTimeout(220);
  const afterRelease = await page.evaluate(() => ({ ...window.__HUGO_GO__.getGameState().hugo }));
  expect(afterRelease.thrusting).toBe(false);
  expect(afterRelease.velocityY).toBeGreaterThan(velocityAtRelease);
});

test('a fast second press triggers the authored double-jump state', async ({ page }) => {
  await page.goto('/#/game');
  await page.keyboard.down('Space');
  await page.keyboard.up('Space');
  await page.keyboard.down('Space');
  const doubleJump = await page.evaluate(() => ({ ...window.__HUGO_GO__.getGameState().hugo }));
  await page.keyboard.up('Space');

  expect(doubleJump.doubleJumpAvailable).toBe(false);
  expect(doubleJump.doubleJumpTime).toBeLessThan(0.35);
  expect(doubleJump.velocityY).toBeLessThanOrEqual(-525);
});

test('lands on an obstacle, runs along it, and jumps cleanly from its top', async ({ page }) => {
  await page.goto('/#/game');
  await page.evaluate(() => {
    const state = window.__HUGO_GO__.getGameState();
    const platformY = 520;
    Object.assign(state, {
      obstacles: [{
        id: 777,
        kind: 'log',
        x: state.hugo.x - 20,
        y: platformY,
        width: 260,
        height: 704 - platformY,
      }],
      coins: [],
    });
    Object.assign(state.hugo, {
      y: platformY - 50 - 6,
      velocityY: 240,
      grounded: false,
      thrusting: false,
      thrustIntensity: 0,
      jumpAvailable: true,
      surfaceId: null,
    });
  });

  await page.waitForFunction(() => window.__HUGO_GO__.getGameState().hugo.surfaceId === 777);
  const landed = await page.evaluate(() => ({ ...window.__HUGO_GO__.getGameState().hugo }));
  await page.waitForTimeout(220);
  const running = await page.evaluate(() => ({ ...window.__HUGO_GO__.getGameState().hugo }));
  expect(running.grounded).toBe(true);
  expect(running.surfaceId).toBe(777);
  expect(running.y).toBeCloseTo(landed.y, 4);

  const canvas = page.locator('#game-canvas');
  await canvas.hover({ position: { x: 190, y: 420 } });
  await page.mouse.down();
  await page.waitForTimeout(120);
  const jumping = await page.evaluate(() => ({ ...window.__HUGO_GO__.getGameState().hugo }));
  await page.mouse.up();
  expect(jumping.grounded).toBe(false);
  expect(jumping.surfaceId).toBeNull();
  expect(jumping.y).toBeLessThan(running.y);
  expect(jumping.jumpTime).toBeLessThan(0.34);
});

test('lands from above, follows, animates, and jumps from a drooping wire', async ({ page }) => {
  await page.goto('/#/game');
  await page.evaluate(() => {
    const state = window.__HUGO_GO__.getGameState();
    const wire = {
      id: 817,
      kind: 'wire' as const,
      x: 20,
      y: 430,
      width: 300,
      height: 274,
      sag: 48,
    };
    const contactX = state.hugo.x + 16;
    const progress = (contactX - wire.x) / wire.width;
    const wireY = wire.y + wire.sag * 4 * progress * (1 - progress);
    Object.assign(state, { obstacles: [wire], coins: [] });
    Object.assign(state.hugo, {
      y: wireY - 50 - 5,
      velocityY: 420,
      grounded: false,
      thrusting: false,
      thrustIntensity: 0,
      jumpAvailable: true,
      surfaceId: null,
      grindTime: Number.POSITIVE_INFINITY,
    });
  });

  await page.waitForFunction(() => window.__HUGO_GO__.getGameState().hugo.surfaceId === 817);
  const landed = await page.evaluate(() => ({
    y: window.__HUGO_GO__.getGameState().hugo.y,
    grindTime: window.__HUGO_GO__.getGameState().hugo.grindTime,
  }));
  await page.waitForTimeout(180);
  const grinding = await page.evaluate(() => ({
    y: window.__HUGO_GO__.getGameState().hugo.y,
    grindTime: window.__HUGO_GO__.getGameState().hugo.grindTime,
    surfaceId: window.__HUGO_GO__.getGameState().hugo.surfaceId,
    grindAssetLoaded: performance.getEntriesByType('resource').some(
      ({ name }) => name.includes('hugo-grind-cycle'),
    ),
  }));
  expect(grinding.surfaceId).toBe(817);
  expect(grinding.grindTime).toBeGreaterThan(landed.grindTime);
  expect(grinding.y).not.toBeCloseTo(landed.y, 3);
  expect(grinding.grindAssetLoaded).toBe(true);

  await page.keyboard.press('Space');
  const jumping = await page.evaluate(() => ({ ...window.__HUGO_GO__.getGameState().hugo }));
  expect(jumping.surfaceId).toBeNull();
  expect(jumping.grindTime).toBe(Number.POSITIVE_INFINITY);
  expect(jumping.velocityY).toBeLessThan(0);
});

test('a front impact splats first and a quick hold recovers the run', async ({ page }) => {
  await page.goto('/#/game');
  await page.evaluate(() => {
    const state = window.__HUGO_GO__.getGameState();
    state.obstacles.splice(0, state.obstacles.length, {
      id: 888,
      kind: 'stump',
      x: state.hugo.x + 34,
      y: state.hugo.y - 10,
      width: 100,
      height: 110,
    });
    state.coins.splice(0);
  });
  await page.waitForFunction(() => window.__HUGO_GO__.getGameState().hugo.stuckObstacleId === 888);

  await page.keyboard.down('Space');
  await page.waitForFunction(() => window.__HUGO_GO__.getGameState().hugo.stuckObstacleId === null);
  const recovered = await page.evaluate(() => ({ ...window.__HUGO_GO__.getGameState().hugo }));
  await page.keyboard.up('Space');
  expect(recovered.stuckObstacleId).toBeNull();
  expect(recovered.recoveryTime).toBeLessThan(0.35);
  expect(recovered.velocityY).toBeLessThan(0);
  await expect(page.locator('#game-over-overlay')).toBeHidden();
});

test('an unrecovered splat eventually records the run and retry skips level select', async ({ page }) => {
  await page.goto('/#/game');
  await expect(page.locator('#game-over-overlay')).toBeVisible({ timeout: 8_000 });
  await expect(page.locator('#game-over-result')).toHaveText(/\d+ m · \d+ coins?/);
  await expect(page.locator('#game-restart-button')).toBeFocused();

  const storedRuns = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('hugo-go-player-v1') ?? '{}') as { totalRuns?: number };
    return state.totalRuns;
  });
  expect(storedRuns).toBe(1);

  await page.locator('#game-restart-button').click();
  await expect(page.locator('#game-over-overlay')).toBeHidden();
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
