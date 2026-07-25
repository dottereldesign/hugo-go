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

test('preserves uniform game scale and a sharp 2x backing store at every screen size', async ({ page }) => {
  const viewports = [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 414, height: 896 },
    { width: 430, height: 932 },
    { width: 600, height: 1024 },
    { width: 820, height: 1180 },
    { width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/#/game');

    const canvas = await page.locator('#game-canvas').evaluate((element) => {
      const htmlCanvas = element as HTMLCanvasElement;
      const rect = htmlCanvas.getBoundingClientRect();
      return {
        cssWidth: rect.width,
        cssHeight: rect.height,
        left: rect.left,
        right: rect.right,
        backingWidth: htmlCanvas.width,
        backingHeight: htmlCanvas.height,
      };
    });

    const xScale = canvas.cssWidth / canvas.backingWidth;
    const yScale = canvas.cssHeight / canvas.backingHeight;
    expect(Math.abs(xScale - yScale) / Math.max(xScale, yScale)).toBeLessThan(0.0015);
    expect(Math.min(canvas.backingWidth / 390, canvas.backingHeight / 780)).toBeCloseTo(2, 3);
    if (viewport.width <= 680) {
      expect(canvas.left).toBe(0);
      expect(canvas.right).toBe(viewport.width);
    } else {
      expect(canvas.backingWidth).toBe(780);
      expect(canvas.backingHeight).toBe(1560);
      expect(canvas.cssWidth / canvas.cssHeight).toBeCloseTo(390 / 780, 3);
    }
  }
});

test('bleeds the scene to iPhone 11 edges when safe areas shorten the play region', async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto('/#/game');
  await page.evaluate(() => {
    const root = document.documentElement;
    root.style.setProperty('--safe-top', '44px');
    root.style.setProperty('--safe-right', '0px');
    root.style.setProperty('--safe-bottom', '34px');
    root.style.setProperty('--safe-left', '0px');
  });
  await page.waitForFunction(() => (
    (document.querySelector('#game-canvas') as HTMLCanvasElement).width > 780
  ));

  const layout = await page.locator('#game-canvas').evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext('2d')!;
    const sampleY = Math.round(canvas.height * 0.5);
    const leftPixel = Array.from(context.getImageData(0, sampleY, 1, 1).data);
    const rightPixel = Array.from(context.getImageData(canvas.width - 1, sampleY, 1, 1).data);
    return {
      rect: rect.toJSON(),
      backingWidth: canvas.width,
      backingHeight: canvas.height,
      xScale: rect.width / canvas.width,
      yScale: rect.height / canvas.height,
      leftPixel,
      rightPixel,
    };
  });

  expect(layout.rect.left).toBe(0);
  expect(layout.rect.right).toBe(414);
  // Integer backing-store pixels can differ by less than one physical pixel.
  expect(layout.xScale).toBeCloseTo(layout.yScale, 3);
  expect(layout.backingWidth).toBeGreaterThan(780);
  expect(layout.backingHeight).toBe(1560);
  expect(layout.backingWidth % 2).toBe(0);
  expect(layout.backingHeight % 2).toBe(0);
  expect(layout.leftPixel[3]).toBe(255);
  expect(layout.rightPixel[3]).toBe(255);
  expect(layout.leftPixel[2]).toBeGreaterThan(200);
  expect(layout.rightPixel[2]).toBeGreaterThan(200);
});

test('loads the generated character and trail art over a clean blue sky', async ({ page }) => {
  await page.goto('/#/game');
  await page.waitForFunction(() => {
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    return resources.some((name) => name.includes('trail-ground'))
      && resources.some((name) => name.includes('hugo-run-60-cycle'))
      && resources.some((name) => name.includes('hugo-powered-cycle'))
      && resources.some((name) => name.includes('hugo-glide-cycle'))
      && resources.some((name) => name.includes('hugo-freefall-cycle'))
      && resources.some((name) => name.includes('hugo-jump-land-cycle'))
      && resources.some((name) => name.includes('hugo-double-jump-cycle'))
      && resources.some((name) => name.includes('hugo-wall-recovery-cycle'))
      && resources.some((name) => name.includes('jet-flame-cycle'));
  });
  const atlasSizes = await page.evaluate(async () => {
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    const readSize = async (assetName: string) => {
      const source = resources.find((name) => name.includes(assetName) && !name.includes('?import'));
      if (!source) throw new Error(`${assetName} atlas did not load.`);
      const image = new Image();
      image.src = source;
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    };
    return {
      run: await readSize('hugo-run-60-cycle'),
      flame: await readSize('jet-flame-cycle'),
    };
  });
  expect(atlasSizes.run).toEqual({ width: 1920, height: 1008 });
  expect(atlasSizes.flame).toEqual({ width: 960, height: 480 });
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
  expect(viewport.canvasWidth).toBeGreaterThanOrEqual(780);
  expect(viewport.canvasBox.left).toBe(0);
  expect(viewport.canvasBox.right).toBe(390);
  expect(viewport.wordmarkColors[0]).not.toBe(viewport.wordmarkColors[1]);
  expect(viewport.backBackground).toContain('linear-gradient');
});
