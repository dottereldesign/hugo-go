import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4191;
const origin = `http://127.0.0.1:${port}`;
const preview = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port)],
  { cwd: process.cwd(), stdio: 'ignore', windowsHide: true },
);

async function waitForPreview() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // The preview process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error('Vite preview did not start for the performance audit.');
}

const browser = await chromium.launch({ headless: true });
try {
  await waitForPreview();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  });
  await page.addInitScript(() => {
    window.__HUGO_GO_LONG_TASKS__ = [];
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__HUGO_GO_LONG_TASKS__.push(entry.duration);
        }
      });
      try {
        observer.observe({ type: 'longtask', buffered: true });
      } catch {
        // Long-task observation is not available in every browser build.
      }
    }
  });
  await page.goto(`${origin}/#/game`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => (
    performance.getEntriesByType('resource').some((entry) => entry.name.includes('hugo-grind-cycle'))
  ));
  await page.waitForTimeout(1_500);
  const canvas = page.locator('#game-canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Game canvas was not visible during the performance audit.');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(280);
  await page.mouse.up();
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const state = window.__HUGO_GO__.getGameState();
    const wire = {
      id: 9_001,
      kind: 'wire',
      x: -100,
      y: 430,
      width: 1_200,
      height: 274,
      sag: 60,
    };
    const contactX = state.hugo.x + 16;
    const progress = (contactX - wire.x) / wire.width;
    const wireY = wire.y + wire.sag * 4 * progress * (1 - progress);
    state.obstacles = [wire];
    state.coins = [];
    Object.assign(state.hugo, {
      y: wireY - 50,
      velocityY: 0,
      grounded: true,
      thrusting: false,
      thrustIntensity: 0,
      jumpAvailable: true,
      doubleJumpAvailable: false,
      doubleJumpTime: Number.POSITIVE_INFINITY,
      surfaceId: wire.id,
      grindTime: 0,
    });
  });
  await page.evaluate(async () => {
    let frames = 0;
    await new Promise((resolve) => {
      const warmGrindRenderer = () => {
        frames += 1;
        if (frames >= 120) resolve();
        else requestAnimationFrame(warmGrindRenderer);
      };
      requestAnimationFrame(warmGrindRenderer);
    });
  });
  await page.evaluate(() => {
    window.__HUGO_GO_LONG_TASKS__.length = 0;
  });

  const report = await page.evaluate(async () => {
    const intervals = [];
    let previous = performance.now();
    await new Promise((resolve) => {
      const sample = (time) => {
        intervals.push(time - previous);
        previous = time;
        if (intervals.length >= 180) resolve();
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const sorted = [...intervals].sort((a, b) => a - b);
    const resources = performance.getEntriesByType('resource');
    const canvasElement = document.querySelector('#game-canvas');
    return {
      averageFrameMs: intervals.reduce((sum, value) => sum + value, 0) / intervals.length,
      p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
      maximumFrameMs: Math.max(...intervals),
      longTasks: window.__HUGO_GO_LONG_TASKS__,
      transferredBytes: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
      decodedResourceBytes: resources.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0),
      resourceCount: resources.length,
      canvasBackingWidth: canvasElement.width,
      canvasBackingHeight: canvasElement.height,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    };
  });

  console.log(JSON.stringify(report, null, 2));
  if (report.p95FrameMs > 34) throw new Error(`p95 frame time ${report.p95FrameMs.toFixed(2)} ms exceeds 34 ms`);
  if (report.canvasBackingWidth !== 780) throw new Error('Mobile Canvas did not use the required 2× backing resolution');
} finally {
  await browser.close();
  preview.kill();
}
