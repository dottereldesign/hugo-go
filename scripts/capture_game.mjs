import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  await page.goto('http://127.0.0.1:4187/#/game');
  await page.waitForTimeout(650);
  await page.screenshot({
    path: 'art/reference/ui/game-mobile.jpg',
    type: 'jpeg',
    quality: 88,
    fullPage: false,
  });
  await page.evaluate(() => {
    Object.assign(window.__HUGO_GO__.getGameState(), { elapsed: 60 });
  });
  await page.waitForTimeout(100);
  await page.screenshot({
    path: 'art/reference/ui/game-season-autumn-mobile.jpg',
    type: 'jpeg',
    quality: 88,
    fullPage: false,
  });
  await page.evaluate(() => {
    Object.assign(window.__HUGO_GO__.getGameState(), { elapsed: 90 });
  });
  await page.waitForTimeout(100);
  await page.screenshot({
    path: 'art/reference/ui/game-season-winter-mobile.jpg',
    type: 'jpeg',
    quality: 88,
    fullPage: false,
  });
} finally {
  await browser.close();
}
