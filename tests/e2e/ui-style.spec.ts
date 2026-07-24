import { expect, test } from '@playwright/test';

test('loads all home artwork and keeps the selected world visible', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => document.fonts.status === 'loaded');

  const images = page.locator('#home-screen img');
  await expect(images).toHaveCount(15);
  const brokenImages = await images.evaluateAll((elements) => (
    elements.filter((element) => !(element as HTMLImageElement).complete || (element as HTMLImageElement).naturalWidth === 0).length
  ));
  expect(brokenImages).toBe(0);

  await page.locator('[data-home-world="word"]').click();
  const selectedStyle = await page.locator('[data-home-world="word"]').evaluate((element) => getComputedStyle(element).boxShadow);
  expect(selectedStyle).not.toBe('none');
});

test('renders the placeholder game page as a separate full-screen view', async ({ page }) => {
  await page.goto('/#/game');
  await expect(page.locator('#game-screen')).toBeVisible();
  await expect(page.locator('#home-screen')).not.toHaveClass(/is-open/);

  const layout = await page.locator('#game-screen').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      backgroundImage: getComputedStyle(element).backgroundImage,
    };
  });

  expect(layout.width).toBeGreaterThanOrEqual(1000);
  expect(layout.height).toBeGreaterThanOrEqual(700);
  expect(layout.backgroundImage).toContain('learning-fortress');
});
