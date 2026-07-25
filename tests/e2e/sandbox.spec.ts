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
    await expect(page.locator('[data-sandbox-card]')).toHaveCount(10);
    await expect(page.locator('[data-sandbox-animation]')).toHaveCount(10);
    await expect(page.getByRole('heading', { name: 'Animation V2 Framework' })).toBeVisible();
    await expect(page.locator('[data-sandbox-card="freefall-v2"] button[data-frame]')).toHaveCount(24);

    await expect.poll(async () => page.locator('[data-sandbox-animation="run"]').getAttribute('data-frame')).not.toBeNull();
    const firstFrame = await page.locator('[data-sandbox-animation="run"]').getAttribute('data-frame');
    await page.waitForTimeout(180);
    await expect(page.locator('[data-sandbox-animation="run"]')).not.toHaveAttribute('data-frame', firstFrame ?? '');

    const runWidth = await page.locator('[data-sandbox-card="run"]').evaluate((element) => element.getBoundingClientRect().width);
    const jumpWidth = await page.locator('[data-sandbox-card="jump"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(Math.abs(runWidth - jumpWidth)).toBeLessThan(2);
    const freefallV2Width = await page.locator('[data-sandbox-card="freefall-v2"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(Math.abs(freefallV2Width - jumpWidth)).toBeLessThan(2);

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

  test('lets each preview pause, seek by number, step, resume, restart, and toggle looping', async ({ page }) => {
    await page.goto('/#/sandbox');
    const runCard = page.locator('[data-sandbox-card="run"]');
    const runCanvas = runCard.locator('canvas');

    await expect(runCard.locator('button[data-frame]')).toHaveCount(60);
    await runCard.getByRole('button', { name: 'Show frame 40', exact: true }).click();
    await expect(runCanvas).toHaveAttribute('data-frame', '39');
    await expect(runCard.locator('[data-sandbox-frame-readout]')).toContainText('Frame 40 / 60');
    await expect(runCard.getByRole('button', { name: 'Resume' })).toBeVisible();

    await page.waitForTimeout(180);
    await expect(runCanvas).toHaveAttribute('data-frame', '39');

    await runCard.getByRole('button', { name: 'Next frame' }).click();
    await expect(runCanvas).toHaveAttribute('data-frame', '40');
    await runCard.getByRole('button', { name: 'Previous frame' }).click();
    await expect(runCanvas).toHaveAttribute('data-frame', '39');

    await runCard.getByRole('button', { name: 'Resume' }).click();
    await page.waitForTimeout(120);
    await expect(runCanvas).not.toHaveAttribute('data-frame', '39');

    const loopButton = runCard.getByRole('button', { name: 'Loop' });
    await loopButton.click();
    await expect(loopButton).toHaveAttribute('aria-pressed', 'false');
    await runCard.getByRole('button', { name: 'Start' }).click();
    await expect(runCard.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  test('deactivates red frames and skips them during playback', async ({ page }) => {
    await page.goto('/#/sandbox');
    const runCard = page.locator('[data-sandbox-card="run"]');
    const runCanvas = runCard.locator('canvas');

    await runCard.getByRole('button', { name: 'Edit frames' }).click();
    await runCard.getByRole('button', { name: 'Deactivate frame 5', exact: true }).click();
    const removedFrame = runCard.locator('button[data-frame="4"]');
    await expect(removedFrame).toHaveClass(/is-deactivated/);
    await expect(removedFrame).toHaveAttribute('data-frame-active', 'false');
    await expect(runCard.locator('[data-sandbox-frame-readout]')).toContainText('59 active');
    await runCard.getByRole('button', { name: 'Done editing' }).click();

    await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-sandbox-animation="run"]');
      if (!canvas) throw new Error('Missing run canvas');
      const observed: string[] = [];
      const observer = new MutationObserver(() => {
        if (canvas.dataset.frame) observed.push(canvas.dataset.frame);
      });
      observer.observe(canvas, { attributes: true, attributeFilter: ['data-frame'] });
      Object.assign(window, { __sandboxObservedFrames: observed, __sandboxObserver: observer });
    });
    await runCard.getByRole('button', { name: 'Start' }).click();
    await page.waitForFunction(() => (
      ((window as Window & { __sandboxObservedFrames?: string[] }).__sandboxObservedFrames ?? []).includes('5')
    ));
    await runCard.getByRole('button', { name: 'Pause' }).click();
    const observed = await page.evaluate(() => (
      (window as Window & { __sandboxObservedFrames?: string[] }).__sandboxObservedFrames ?? []
    ));
    expect(observed).toContain('5');
    expect(observed).not.toContain('4');
    await expect(runCanvas).not.toHaveAttribute('data-frame', '4');

    await page.reload();
    await expect(removedFrame).toHaveClass(/is-deactivated/);
    await runCard.getByRole('button', { name: 'Edit frames' }).click();
    await runCard.getByRole('button', { name: 'Use all' }).click();
    await expect(removedFrame).not.toHaveClass(/is-deactivated/);
  });
});
