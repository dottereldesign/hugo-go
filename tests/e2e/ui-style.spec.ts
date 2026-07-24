import { expect, test } from '@playwright/test';

test('loads all home artwork and visually mutes unfinished worlds', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => document.fonts.status === 'loaded');

  const images = page.locator('#home-screen img');
  await expect(images).toHaveCount(15);
  const brokenImages = await images.evaluateAll((elements) => (
    elements.filter((element) => !(element as HTMLImageElement).complete || (element as HTMLImageElement).naturalWidth === 0).length
  ));
  expect(brokenImages).toBe(0);

  const worldStyles = await page.locator('[data-home-world="word"]').evaluate((element) => ({
    opacity: Number(getComputedStyle(element).opacity),
    filter: getComputedStyle(element).filter,
  }));
  expect(worldStyles.opacity).toBeLessThan(0.6);
  expect(worldStyles.filter).not.toBe('none');
});

test('renders the playable portrait canvas as a separate full-screen view', async ({ page }) => {
  await page.goto('/#/game');
  await expect(page.locator('#game-screen')).toBeVisible();
  await expect(page.locator('#home-screen')).not.toHaveClass(/is-open/);

  const layout = await page.locator('#game-screen').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      backgroundImage: getComputedStyle(element).backgroundImage,
      scrollHeight: element.scrollHeight,
    };
  });

  expect(layout.width).toBeGreaterThanOrEqual(1000);
  expect(layout.height).toBeGreaterThanOrEqual(700);
  expect(layout.scrollHeight).toBe(layout.height);
  expect(layout.backgroundImage).toContain('radial-gradient');

  const canvas = page.locator('#game-canvas');
  await expect(canvas).toBeVisible();
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox?.height).toBeGreaterThan(600);
  expect(canvasBox?.width).toBeLessThan(canvasBox?.height ?? 0);
});

test('loads the generated character and trail art over a clean blue sky', async ({ page }) => {
  await page.goto('/#/game');
  await page.waitForFunction(() => {
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    return resources.some((name) => name.includes('trail-ground'))
      && resources.some((name) => name.includes('hugo-run-cycle'))
      && resources.some((name) => name.includes('hugo-powered-cycle'))
      && resources.some((name) => name.includes('hugo-glide-cycle'))
      && resources.some((name) => name.includes('hugo-freefall-cycle'))
      && resources.some((name) => name.includes('hugo-jump-land-cycle'))
      && resources.some((name) => name.includes('hugo-double-jump-cycle'))
      && resources.some((name) => name.includes('hugo-wall-recovery-cycle'));
  });
  const skyPixel = await page.locator('#game-canvas').evaluate((canvas) => (
    Array.from((canvas as HTMLCanvasElement).getContext('2d')!.getImageData(10, 10, 1, 1).data)
  ));
  expect(skyPixel[0]).toBeLessThan(80);
  expect(skyPixel[1]).toBeGreaterThan(190);
  expect(skyPixel[2]).toBeGreaterThan(235);
  await page.evaluate(() => {
    Object.assign(window.__HUGO_GO__.getGameState(), { elapsed: 25 });
  });

  await page.evaluate(() => {
    Object.assign(window.__HUGO_GO__.getGameState(), { elapsed: 90 });
  });
  await expect(page.locator('#game-phase, #game-season')).toHaveCount(0);
});

test('locks mobile gameplay to the viewport with no page scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/game');
  await page.locator('#game-canvas').click({ position: { x: 180, y: 430 } });

  const viewport = await page.evaluate(() => ({
    innerHeight: window.innerHeight,
    rootHeight: document.documentElement.scrollHeight,
    bodyHeight: document.body.scrollHeight,
    bodyOverflow: getComputedStyle(document.body).overflow,
    touchAction: getComputedStyle(document.querySelector('#game-canvas')!).touchAction,
    canvasWidth: (document.querySelector('#game-canvas') as HTMLCanvasElement).width,
    canvasBox: document.querySelector('#game-canvas')!.getBoundingClientRect().toJSON(),
    wordmarkColors: Array.from(document.querySelectorAll('.game-wordmark span')).map(
      (span) => getComputedStyle(span).color,
    ),
    backBackground: getComputedStyle(document.querySelector('#game-back-button')!).backgroundImage,
  }));
  expect(viewport.rootHeight).toBe(viewport.innerHeight);
  expect(viewport.bodyHeight).toBe(viewport.innerHeight);
  expect(viewport.bodyOverflow).toBe('hidden');
  expect(viewport.touchAction).toBe('none');
  expect(viewport.canvasWidth).toBeLessThanOrEqual(390);
  expect(viewport.canvasBox.left).toBe(0);
  expect(viewport.canvasBox.right).toBe(390);
  expect(viewport.wordmarkColors[0]).not.toBe(viewport.wordmarkColors[1]);
  expect(viewport.backBackground).toContain('linear-gradient');
});
