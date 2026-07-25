import { expect, test } from '@playwright/test';

test.describe('Animation Sandbox', () => {
  test('opens from Settings and presents every live production animation', async ({ page }) => {
    await page.goto('/#/home');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Open Sandbox' }).click();

    await expect(page).toHaveURL(/#\/sandbox$/);
    await expect(page.locator('#sandbox-screen')).toBeVisible();
    await expect(page.locator('#home-screen')).not.toHaveClass(/is-open/);
    await expect(page.locator('#game-screen')).toBeHidden();
    await expect(page.locator('[data-sandbox-card]')).toHaveCount(9);
    await expect(page.locator('[data-sandbox-animation]')).toHaveCount(9);

    await expect.poll(async () => page.locator('[data-sandbox-animation="run"]').getAttribute('data-frame')).not.toBeNull();
    const firstFrame = await page.locator('[data-sandbox-animation="run"]').getAttribute('data-frame');
    await page.waitForTimeout(180);
    await expect(page.locator('[data-sandbox-animation="run"]')).not.toHaveAttribute('data-frame', firstFrame ?? '');

    const runWidth = await page.locator('[data-sandbox-card="run"]').evaluate((element) => element.getBoundingClientRect().width);
    const jumpWidth = await page.locator('[data-sandbox-card="jump"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(runWidth).toBeGreaterThan(jumpWidth * 1.8);

    await page.getByRole('button', { name: 'Back home' }).click();
    await expect(page).toHaveURL(/#\/home$/);
    await expect(page.locator('#home-screen')).toHaveClass(/is-open/);
    await expect(page.locator('#sandbox-screen')).toBeHidden();
  });

  test('supports a direct sandbox route and stacks cards on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/sandbox');

    await expect(page.locator('#sandbox-screen')).toBeVisible();
    const runBox = await page.locator('[data-sandbox-card="run"]').boundingBox();
    const jumpBox = await page.locator('[data-sandbox-card="jump"]').boundingBox();
    expect(runBox).not.toBeNull();
    expect(jumpBox).not.toBeNull();
    expect(Math.abs((runBox?.width ?? 0) - (jumpBox?.width ?? 0))).toBeLessThan(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    expect(await page.evaluate(() => document.body.scrollWidth)).toBe(390);
  });
});
