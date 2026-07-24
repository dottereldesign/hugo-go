import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  await page.goto('http://127.0.0.1:4187/#/game');
  await page.waitForTimeout(850);
  await page.locator('#game-canvas').click({ position: { x: 180, y: 470 } });
  await page.waitForTimeout(260);
  await page.screenshot({
    path: 'art/reference/ui/game-mobile.png',
    fullPage: false,
  });
} finally {
  await browser.close();
}
