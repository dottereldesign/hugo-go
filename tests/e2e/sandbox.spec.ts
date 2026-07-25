import { expect, test } from '@playwright/test';

test.describe('Animation Sandbox', () => {
  test.describe.configure({ timeout: 60_000 });

  test('opens from Settings and presents every live production animation', async ({ page }) => {
    await page.goto('/#/home');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Open Sandbox' }).click();

    await expect(page).toHaveURL(/#\/sandbox$/);
    await expect(page.locator('#sandbox-screen')).toBeVisible();
    await expect(page.locator('#home-screen')).not.toHaveClass(/is-open/);
    await expect(page.locator('#game-screen')).toBeHidden();
    await expect(page.locator('[data-sandbox-card]')).toHaveCount(25);
    await expect(page.locator('[data-sandbox-animation]')).toHaveCount(25);
    await expect(page.locator('[data-sandbox-speed]')).toHaveCount(25);
    await expect(page.getByRole('heading', { name: 'Animation V2 Framework' })).toBeVisible();
    await expect(page.getByText('Mandatory looping-sheet bookend')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The 12 animation principles, translated for HUGO GO!' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Smooth does not mean evenly spaced' })).toBeVisible();
    await expect(page.locator('[data-sandbox-card="freefall-v2"] button[data-frame]')).toHaveCount(24);
    await expect(page.locator('[data-sandbox-card="double-jump-v2"] button[data-frame]')).toHaveCount(16);
    await expect(page.locator('[data-sandbox-card="rig-run-v2"] button[data-frame]')).toHaveCount(30);
    await expect(page.locator('[data-sandbox-card="rig-jump-v2"] button[data-frame]')).toHaveCount(36);
    await expect(page.locator('[data-sandbox-card="rig-run-debug"] button[data-frame]')).toHaveCount(30);
    await expect(page.locator('[data-sandbox-card="rig-jump-debug"] button[data-frame]')).toHaveCount(36);
    await expect(page.locator('[data-sandbox-card="walk-v4-debug"] button[data-frame]')).toHaveCount(36);
    await expect(page.locator('[data-sandbox-card="walk-v4-painted"] button[data-frame]')).toHaveCount(36);
    await expect(page.locator('[data-sandbox-card="walk-v5-debug"] button[data-frame]')).toHaveCount(36);
    await expect(page.locator('[data-sandbox-card="walk-v5-painted"] button[data-frame]')).toHaveCount(36);
    await expect(page.locator('[data-sandbox-card="walk-v6-debug"] button[data-frame]')).toHaveCount(36);
    await expect(page.locator('[data-sandbox-card="walk-v6-painted"] button[data-frame]')).toHaveCount(36);
    await expect(page.locator('[data-sandbox-card="head-turn-debug"] button[data-frame]')).toHaveCount(24);
    await expect(page.locator('[data-sandbox-card="head-turn-painted"] button[data-frame]')).toHaveCount(24);
    await expect(page.locator('[data-sandbox-card="head-turn-fixed-debug"] button[data-frame]')).toHaveCount(24);
    await expect(page.locator('[data-sandbox-card="head-turn-fixed-painted"] button[data-frame]')).toHaveCount(24);
    await expect(page.getByRole('heading', { name: 'Why the first two layered rigs fail' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What changed for Walking V4' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What V5 fixes from the V4 review' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Plain-language part names and joint paths' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why the added joints matter' })).toBeVisible();
    const expectedMetrics: Record<string, string> = {
      run: '60 frames · 2.00 s total · 30 FPS',
      jump: '8 frames · 2.40 s total · 3.33 FPS',
      'double-jump': '6 frames · 2.00 s total · 3 FPS',
      freefall: '6 frames · 0.60 s total · 10 FPS',
      powered: '6 frames · 0.50 s total · 12 FPS',
      glide: '6 frames · 0.50 s total · 12 FPS',
      grind: '30 frames · 1.00 s total · 30 FPS',
      wall: '6 frames · 2.80 s total · 2.14 FPS',
      flame: '30 frames · 1.00 s total · 30 FPS',
      'freefall-v2': '24 frames · 0.80 s total · 30 FPS',
      'double-jump-v2': '16 frames · 0.53 s total · 30 FPS',
      'rig-run-v2': '30 frames · 1.00 s total · 30 FPS',
      'rig-jump-v2': '36 frames · 1.20 s total · 30 FPS',
      'rig-run-debug': '30 frames · 1.00 s total · 30 FPS',
      'rig-jump-debug': '36 frames · 1.20 s total · 30 FPS',
      'walk-v4-debug': '36 frames · 1.20 s total · 30 FPS',
      'walk-v4-painted': '36 frames · 1.20 s total · 30 FPS',
      'walk-v5-debug': '36 frames · 1.20 s total · 30 FPS',
      'walk-v5-painted': '36 frames · 1.20 s total · 30 FPS',
      'walk-v6-debug': '36 frames · 1.20 s total · 30 FPS',
      'walk-v6-painted': '36 frames · 1.20 s total · 30 FPS',
      'head-turn-debug': '24 frames · 2.00 s total · 12 FPS',
      'head-turn-painted': '24 frames · 2.00 s total · 12 FPS',
      'head-turn-fixed-debug': '24 frames · 2.00 s total · 12 FPS',
      'head-turn-fixed-painted': '24 frames · 2.00 s total · 12 FPS',
    };
    for (const [animation, metrics] of Object.entries(expectedMetrics)) {
      await expect(page.locator(`[data-sandbox-card="${animation}"] [data-sandbox-metrics]`)).toHaveText(metrics);
    }

    await expect.poll(async () => page.locator('[data-sandbox-animation="run"]').getAttribute('data-frame')).not.toBeNull();
    const firstFrame = await page.locator('[data-sandbox-animation="run"]').getAttribute('data-frame');
    await page.waitForTimeout(180);
    await expect(page.locator('[data-sandbox-animation="run"]')).not.toHaveAttribute('data-frame', firstFrame ?? '');

    const runWidth = await page.locator('[data-sandbox-card="run"]').evaluate((element) => element.getBoundingClientRect().width);
    const jumpWidth = await page.locator('[data-sandbox-card="jump"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(Math.abs(runWidth - jumpWidth)).toBeLessThan(2);
    const freefallV2Width = await page.locator('[data-sandbox-card="freefall-v2"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(Math.abs(freefallV2Width - jumpWidth)).toBeLessThan(2);
    const doubleJumpV2Width = await page.locator('[data-sandbox-card="double-jump-v2"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(Math.abs(doubleJumpV2Width - jumpWidth)).toBeLessThan(2);
    const riggedRunWidth = await page.locator('[data-sandbox-card="rig-run-v2"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(Math.abs(riggedRunWidth - jumpWidth)).toBeLessThan(2);
    const debugRunWidth = await page.locator('[data-sandbox-card="rig-run-debug"]').evaluate((element) => element.getBoundingClientRect().width);
    const debugJumpWidth = await page.locator('[data-sandbox-card="rig-jump-debug"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(Math.abs(debugRunWidth - jumpWidth)).toBeLessThan(2);
    expect(Math.abs(debugJumpWidth - jumpWidth)).toBeLessThan(2);
    const walkDebugWidth = await page.locator('[data-sandbox-card="walk-v4-debug"]').evaluate((element) => element.getBoundingClientRect().width);
    const walkPaintedWidth = await page.locator('[data-sandbox-card="walk-v4-painted"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(Math.abs(walkDebugWidth - jumpWidth)).toBeLessThan(2);
    expect(Math.abs(walkPaintedWidth - jumpWidth)).toBeLessThan(2);
    const walkV5DebugWidth = await page.locator('[data-sandbox-card="walk-v5-debug"]').evaluate((element) => element.getBoundingClientRect().width);
    const walkV5PaintedWidth = await page.locator('[data-sandbox-card="walk-v5-painted"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(Math.abs(walkV5DebugWidth - jumpWidth)).toBeLessThan(2);
    expect(Math.abs(walkV5PaintedWidth - jumpWidth)).toBeLessThan(2);
    const walkV6DebugWidth = await page.locator('[data-sandbox-card="walk-v6-debug"]').evaluate((element) => element.getBoundingClientRect().width);
    const walkV6PaintedWidth = await page.locator('[data-sandbox-card="walk-v6-painted"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(Math.abs(walkV6DebugWidth - jumpWidth)).toBeLessThan(2);
    expect(Math.abs(walkV6PaintedWidth - jumpWidth)).toBeLessThan(2);
    const headTurnDebugWidth = await page.locator('[data-sandbox-card="head-turn-debug"]').evaluate((element) => element.getBoundingClientRect().width);
    const headTurnPaintedWidth = await page.locator('[data-sandbox-card="head-turn-painted"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(Math.abs(headTurnDebugWidth - jumpWidth)).toBeLessThan(2);
    expect(Math.abs(headTurnPaintedWidth - jumpWidth)).toBeLessThan(2);
    const headTurnFixedDebugWidth = await page.locator('[data-sandbox-card="head-turn-fixed-debug"]').evaluate((element) => element.getBoundingClientRect().width);
    const headTurnFixedPaintedWidth = await page.locator('[data-sandbox-card="head-turn-fixed-painted"]').evaluate((element) => element.getBoundingClientRect().width);
    expect(Math.abs(headTurnFixedDebugWidth - jumpWidth)).toBeLessThan(2);
    expect(Math.abs(headTurnFixedPaintedWidth - jumpWidth)).toBeLessThan(2);
    await expect.poll(async () => page.evaluate(() => (
      performance.getEntriesByType('resource').some((entry) => entry.name.includes('hugo-layered-rig-parts'))
    ))).toBe(true);
    await expect.poll(async () => page.evaluate(() => (
      performance.getEntriesByType('resource').some((entry) => entry.name.includes('hugo-walk-v4-parts'))
    ))).toBe(true);
    await expect.poll(async () => page.evaluate(() => (
      performance.getEntriesByType('resource').some((entry) => entry.name.includes('hugo-walk-v5-torso'))
    ))).toBe(true);
    await expect.poll(async () => page.evaluate(() => (
      performance.getEntriesByType('resource').some((entry) => entry.name.includes('hugo-head-turn-stabilized-cycle'))
    ))).toBe(true);
    const headTurnAtlasSize = await page.evaluate(async () => {
      const source = performance.getEntriesByType('resource')
        .map((entry) => entry.name)
        .find((name) => name.includes('hugo-head-turn-stabilized-cycle') && !name.includes('?import'));
      if (!source) throw new Error('Head-turn atlas did not load.');
      const image = new Image();
      image.src = source;
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    });
    expect(headTurnAtlasSize).toEqual({ width: 1600, height: 1600 });
    const headRegistration = await page.evaluate(async () => {
      const source = performance.getEntriesByType('resource')
        .map((entry) => entry.name)
        .find((name) => name.includes('hugo-head-turn-stabilized-cycle') && !name.includes('?import'));
      if (!source) throw new Error('Stabilized head-turn atlas did not load.');
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Missing atlas validation context.');

      const bounds = Array.from({ length: 24 }, (_, frame) => {
        context.clearRect(0, 0, 320, 320);
        context.drawImage(
          image,
          frame % 5 * 320,
          Math.floor(frame / 5) * 320,
          320,
          320,
          0,
          0,
          320,
          320,
        );
        const pixels = context.getImageData(0, 0, 320, 320).data;
        let left = 320;
        let top = 320;
        let right = -1;
        let bottom = -1;
        for (let index = 3; index < pixels.length; index += 4) {
          if (pixels[index] === 0) continue;
          const pixel = (index - 3) / 4;
          const x = pixel % 320;
          const y = Math.floor(pixel / 320);
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
        return { left, top, right, bottom };
      });

      context.clearRect(0, 0, 320, 320);
      context.drawImage(image, 0, 0, 320, 320, 0, 0, 320, 320);
      const first = context.getImageData(0, 0, 320, 320).data;
      context.clearRect(0, 0, 320, 320);
      context.drawImage(image, 1280, 1280, 320, 320, 0, 0, 320, 320);
      const bookend = context.getImageData(0, 0, 320, 320).data;
      return {
        centerXSpread: Math.max(...bounds.map(({ left, right }) => (left + right) / 2))
          - Math.min(...bounds.map(({ left, right }) => (left + right) / 2)),
        centerYSpread: Math.max(...bounds.map(({ top, bottom }) => (top + bottom) / 2))
          - Math.min(...bounds.map(({ top, bottom }) => (top + bottom) / 2)),
        heightSpread: Math.max(...bounds.map(({ top, bottom }) => bottom - top + 1))
          - Math.min(...bounds.map(({ top, bottom }) => bottom - top + 1)),
        minimumGutter: Math.min(...bounds.flatMap(
          ({ left, top, right, bottom }) => [left, top, 319 - right, 319 - bottom],
        )),
        bookendMatches: first.every((value, index) => value === bookend[index]),
      };
    });
    expect(headRegistration.centerXSpread).toBeLessThanOrEqual(0.5);
    expect(headRegistration.centerYSpread).toBe(0);
    expect(headRegistration.heightSpread).toBe(0);
    expect(headRegistration.minimumGutter).toBeGreaterThanOrEqual(32);
    expect(headRegistration.bookendMatches).toBe(true);

    const anatomyCanvas = page.locator('[data-rig-anatomy-canvas]');
    const upperArmLabel = page.locator('button[data-rig-part="left-upper-arm"]');
    await upperArmLabel.click();
    await expect(upperArmLabel).toHaveAttribute('aria-pressed', 'true');
    await expect(anatomyCanvas).toHaveAttribute('data-active-rig-part', 'left-upper-arm');
    await expect(page.locator('button[data-rig-part="left-hand"]')).toBeVisible();
    await expect(page.locator('button[data-rig-part="right-hand"]')).toBeVisible();
    await expect(page.getByText('Head artwork', { exact: true })).toHaveCount(0);
    await expect(page.locator('.sandbox-anatomy-labels').getByText(/Near|Far/)).toHaveCount(0);

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

  test('adjusts and remembers playback speed independently for every preview', async ({ page }) => {
    await page.goto('/#/sandbox');
    const runCard = page.locator('[data-sandbox-card="run"]');
    const runSpeed = runCard.locator('[data-sandbox-speed]');
    const runOutput = runCard.locator('[data-sandbox-speed-output]');
    const headCard = page.locator('[data-sandbox-card="head-turn-fixed-painted"]');

    await expect(runSpeed).toHaveValue('1');
    await expect(runOutput).toHaveText('1.00× · 30.00 FPS · 2.00 s loop');
    await expect(headCard.locator('[data-sandbox-speed]')).toHaveValue('0.4');
    await expect(headCard.locator('[data-sandbox-speed-output]')).toHaveText('0.40× · 12.00 FPS · 2.00 s loop');

    await headCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(220);
    await headCard.getByRole('button', { name: 'Pause' }).click();
    await expect(headCard.locator('canvas')).toHaveAttribute('data-frame', /\d+/);
    const displayedHeadFrame = Number(await headCard.locator('canvas').getAttribute('data-frame'));
    await expect(headCard.locator('[data-sandbox-frame-readout]')).toContainText(`Frame ${displayedHeadFrame + 1} / 24`);

    await runSpeed.evaluate((element: HTMLInputElement) => {
      element.value = '1.50';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(runSpeed).toHaveValue('1.5');
    await expect(runSpeed).toHaveAttribute('aria-valuetext', '1.50 times speed');
    await expect(runOutput).toHaveText('1.50× · 45.00 FPS · 1.33 s loop');
    await expect(runCard.locator('[data-sandbox-metrics]')).toHaveText('60 frames · 1.33 s total · 45 FPS');

    await page.reload();
    await expect(runCard.locator('[data-sandbox-speed]')).toHaveValue('1.5');
    await expect(runCard.locator('[data-sandbox-speed-output]')).toHaveText('1.50× · 45.00 FPS · 1.33 s loop');
    await expect(headCard.locator('[data-sandbox-speed]')).toHaveValue('0.4');
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
    await expect(runCard.locator('[data-sandbox-frame-readout]')).toContainText('1.97 s total · 30 FPS');
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
