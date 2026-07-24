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
  await page.mouse.move(190, 430);
  await page.mouse.down();
  await page.waitForTimeout(420);
  await page.screenshot({
    path: 'art/reference/ui/game-powered-hold-mobile.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: false,
  });
  await page.mouse.up();
  await page.waitForTimeout(240);
  await page.screenshot({
    path: 'art/reference/ui/game-glide-release-mobile.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: false,
  });
  await page.evaluate(() => {
    const state = window.__HUGO_GO__.getGameState();
    Object.assign(state, { elapsed: 8, distance: 90 });
    Object.assign(state.hugo, {
      grounded: true,
      y: 654,
      velocityY: 0,
      thrust: 0,
      doubleJumpTime: Number.POSITIVE_INFINITY,
      recoveryTime: Number.POSITIVE_INFINITY,
      stuckObstacleId: null,
    });
    state.obstacles = [];
  });
  await page.waitForTimeout(120);
  await page.screenshot({
    path: 'art/reference/ui/game-planet-aurora-mobile.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: false,
  });
  await page.evaluate(() => {
    const state = window.__HUGO_GO__.getGameState();
    Object.assign(state, { elapsed: 8, distance: 42 });
    state.obstacles = [
      { id: 9101, x: 174, y: 610, width: 92, height: 94, kind: 'log', scored: false },
      { id: 9102, x: 318, y: 568, width: 108, height: 136, kind: 'boulder', scored: false },
    ];
  });
  await page.waitForTimeout(100);
  await page.screenshot({
    path: 'art/reference/ui/game-red-obstacles-mobile.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: false,
  });
  await page.evaluate(() => {
    const state = window.__HUGO_GO__.getGameState();
    state.obstacles = [];
    Object.assign(state.hugo, {
      grounded: false,
      y: 340,
      velocityY: -360,
      thrust: 0.5,
      jumpTime: 0.18,
      doubleJumpAvailable: false,
      doubleJumpTime: 0.16,
      recoveryTime: Number.POSITIVE_INFINITY,
      stuckObstacleId: null,
    });
  });
  await page.waitForTimeout(70);
  await page.screenshot({
    path: 'art/reference/ui/game-double-jump-mobile.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: false,
  });
  await page.evaluate(() => {
    const state = window.__HUGO_GO__.getGameState();
    Object.assign(state.hugo, {
      grounded: false,
      y: 594,
      velocityY: 0,
      thrust: 0,
      doubleJumpTime: 0,
      recoveryTime: 0,
      stuckObstacleId: 9201,
      stuckTime: 0.15,
    });
    state.obstacles = [
      { id: 9201, x: state.hugo.x + 32, y: 580, width: 112, height: 124, kind: 'stump', scored: false },
    ];
  });
  await page.waitForTimeout(70);
  await page.screenshot({
    path: 'art/reference/ui/game-wall-splat-mobile.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: false,
  });
  await page.evaluate(() => {
    const state = window.__HUGO_GO__.getGameState();
    Object.assign(state, { elapsed: 60 });
    Object.assign(state.hugo, {
      stuckObstacleId: null,
      recoveryTime: Number.POSITIVE_INFINITY,
      doubleJumpTime: Number.POSITIVE_INFINITY,
      grounded: true,
      y: 654,
    });
    state.obstacles = [];
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
