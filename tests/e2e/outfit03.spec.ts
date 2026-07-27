import { expect, test } from '@playwright/test';

test.describe('Outfit 03 reference and V02 animation loops', () => {
  test('opens from the Sandbox and provides complete frame controls', async ({ page }) => {
    await page.goto('/#/sandbox');
    await page.getByRole('button', { name: 'Open Outfit 03' }).click();

    await expect(page).toHaveURL(/#\/outfit-03$/);
    await expect(page.locator('#outfit-03-screen')).toBeVisible();
    await expect(page.locator('#sandbox-screen')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Sunrise Hugo is the reference.' })).toBeVisible();
    await expect(page.locator('[data-outfit-03-reference] .sandbox-2d-pose')).toHaveCount(12);
    await expect(page.locator('.version-03-library--side .version-03-pose-grid figure')).toHaveCount(35);
    await expect(page.locator('[data-v02-animation]')).toHaveCount(2);

    const neutral = page.locator('[data-v02-animation="neutral-idle"]');
    const ready = page.locator('[data-v02-animation="ready-profile"]');
    await expect(neutral.locator('[data-frame]')).toHaveCount(75);
    await expect(ready.locator('[data-frame]')).toHaveCount(24);
    await expect(neutral).toHaveAttribute('data-playing', 'true');

    await neutral.getByRole('button', { name: 'Pause' }).click();
    await expect(neutral).toHaveAttribute('data-playing', 'false');
    const pausedFrame = await neutral.getAttribute('data-frame');
    await page.waitForTimeout(500);
    await expect(neutral).toHaveAttribute('data-frame', pausedFrame ?? '');

    await neutral.getByRole('button', { name: 'Show frame 75: Exact frame 01 loop bookend' }).click();
    await expect(neutral).toHaveAttribute('data-frame', '75');
    await expect(neutral.locator('[data-frame-readout]')).toHaveText(
      'Frame 75 / 75 · Exact frame 01 loop bookend',
    );
    await expect(neutral.getByRole('button', { name: 'Resume' })).toBeVisible();

    await neutral.getByRole('button', { name: 'Resume' }).click();
    await expect(neutral).toHaveAttribute('data-playing', 'true');

    const speed = neutral.locator('[data-speed]');
    await speed.evaluate((element: HTMLInputElement) => {
      element.value = '1.5';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(speed).toHaveValue('1.5');
    await expect(neutral.locator('[data-speed-output]')).toHaveText(
      '1.50× · 36.0 timing FPS · 2.06 s loop',
    );

    const loop = neutral.getByRole('button', { name: 'Loop', exact: true });
    await loop.click();
    await expect(loop).toHaveAttribute('aria-pressed', 'false');
    await neutral.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(neutral).toHaveAttribute('data-playing', 'false');

    await page.getByRole('button', { name: 'Back to animation sandbox' }).click();
    await expect(page).toHaveURL(/#\/sandbox$/);
    await expect(page.locator('#sandbox-screen')).toBeVisible();
  });

  test('fits a portrait mobile viewport without horizontal gutters or overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/outfit-03');

    await expect(page.locator('#outfit-03-screen')).toBeVisible();
    await expect(page.locator('[data-outfit-03-reference] .sandbox-2d-pose')).toHaveCount(12);
    const first = await page.locator('[data-outfit-03-reference] .sandbox-2d-pose').nth(0).boundingBox();
    const second = await page.locator('[data-outfit-03-reference] .sandbox-2d-pose').nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs((first?.y ?? 0) - (second?.y ?? 0))).toBeLessThan(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    expect(await page.evaluate(() => document.body.scrollWidth)).toBe(390);

    const neutral = page.locator('[data-v02-animation="neutral-idle"]');
    await neutral.scrollIntoViewIfNeeded();
    const cardBox = await neutral.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox?.x).toBeGreaterThanOrEqual(11);
    expect((cardBox?.x ?? 0) + (cardBox?.width ?? 0)).toBeLessThanOrEqual(379);
    await expect(neutral.locator('[data-frame]')).toHaveCount(75);
  });

  test('opens the source Character Sheets archive and enlarges a thumbnail', async ({ page }) => {
    await page.goto('/#/outfit-03');
    await page.getByRole('button', { name: 'Character Sheets' }).click();

    await expect(page).toHaveURL(/#\/character-sheets$/);
    await expect(page.getByRole('heading', { name: 'Character Sheets' })).toBeVisible();
    const cards = page.locator('.character-sheet-card');
    expect(await cards.count()).toBeGreaterThan(20);

    await cards.first().click();
    await expect(page.locator('#character-sheet-dialog')).toBeVisible();
    await expect(page.locator('[data-character-sheet-large]')).toHaveAttribute('src', /.+/);
    await page.getByRole('button', { name: 'Close enlarged character sheet' }).click();
    await expect(page.locator('#character-sheet-dialog')).toBeHidden();

    await page.getByRole('button', { name: 'Back to Outfit 03' }).click();
    await expect(page).toHaveURL(/#\/outfit-03$/);
  });

  test('keeps the complete Version 03 nod figure inside its preview stage', async ({ page }) => {
    await page.goto('/#/version-03');

    const previews = page.locator('[data-v03-animation]');
    await expect(previews).toHaveCount(2);
    await expect(previews).toContainText('01 · NEUTRAL SIDE');
    await expect(previews).toContainText('02 · NEUTRAL SIDE');
    const walkStart = page.locator('[data-v03-animation="neutral-to-confident-walk"]');
    await expect(walkStart).toContainText('Step into confident walk');
    await expect(walkStart).toContainText('10 runtime frames');
    await expect(walkStart).toContainText('9 complete figures');
    await expect(walkStart).toContainText('opposite-leg follow-through');
    await expect(page.locator('[data-v03-animation="head-nod-soft"]')).toHaveCount(0);

    const previewSizes = await previews.evaluateAll((cards) => cards.map((card) => {
      const stage = card.querySelector<HTMLElement>('.v03-animation-stage');
      const image = card.querySelector<HTMLImageElement>('.v03-animation-stage img');
      if (!stage || !image) throw new Error('Version 03 preview is incomplete');

      const stageBox = stage.getBoundingClientRect();
      const imageBox = image.getBoundingClientRect();
      return {
        stageHeight: stageBox.height,
        imageHeight: imageBox.height,
      };
    }));

    for (const { stageHeight, imageHeight } of previewSizes) {
      expect(imageHeight).toBeLessThanOrEqual(stageHeight * 1.07);
    }
  });

  test('keeps the full-screen Version 03 line scene at a fixed scale', async ({ page }) => {
    await page.goto('/#/version-03');

    const cinematic = page.locator('#version-03-screen [data-v03-cinematic]');
    const scroll = page.locator('#version-03-scroll');
    await expect(cinematic).toHaveCount(1);
    await expect(cinematic.locator('[data-v03-cinematic-frame]')).toHaveAttribute(
      'src',
      /hugo-head-nod-smooth/,
    );
    await expect(cinematic.locator('[data-v03-cinematic-line]')).toHaveCount(1);
    await expect(cinematic.locator('[data-v03-cinematic-ground-line]')).toHaveCount(1);
    const world = cinematic.locator('[data-v03-cinematic-world]');

    await scroll.evaluate((element, section) => {
      const target = section as HTMLElement;
      element.scrollTop = target.offsetTop + target.offsetHeight;
      element.dispatchEvent(new Event('scroll'));
    }, await cinematic.elementHandle());
    await expect(cinematic).not.toHaveAttribute('data-camera-phase', /.+/);
    await expect(world).not.toHaveAttribute('style', /transform/);
  });

  test('opens the animation-only Future Homepage from Version 03 navigation', async ({ page }) => {
    await page.goto('/#/version-03');
    await page.getByRole('button', { name: 'Future Homepage' }).click();

    await expect(page).toHaveURL(/#\/future-homepage$/);
    const future = page.locator('#future-homepage-screen');
    const cinematic = future.locator('[data-v03-cinematic]');
    await expect(future).toBeVisible();
    await expect(page.locator('#version-03-screen')).toBeHidden();
    await expect(future.locator('.outfit-03-header, .version-03-library')).toHaveCount(0);
    await expect(cinematic).toHaveCount(1);
    await expect(cinematic.locator('[data-v03-cinematic-frame]')).toHaveAttribute(
      'src',
      /hugo-head-nod-smooth/,
    );
    await expect(cinematic.locator('[data-v03-cinematic-line]')).toHaveCount(0);
    await expect(cinematic.locator('[data-v03-cinematic-ground-line]')).toHaveCount(0);
    await expect(future.locator('[data-v03-cinematic-line]')).toHaveCount(1);
    await expect(future.locator('[data-v03-cinematic-ground-line]')).toHaveCount(1);
    await expect(future.locator('[data-v03-cinematic-line]').first()).toHaveCSS(
      'animation-name',
      'none',
    );
    await expect(cinematic.locator('[data-v03-cinematic-frame]')).toHaveCSS(
      'filter',
      /grayscale\(1\)/,
    );
    await expect(future.locator('.future-homepage-loading-kicker')).toHaveAttribute(
      'aria-label',
      'MOUNT POGAGA // 01',
    );
    await expect(future.getByRole('heading', { name: '読み込み中...' })).toBeVisible();
    await expect(
      future.getByRole('button', { name: 'Start the Mount Pogaga sequence' }),
    ).toBeVisible();
    await expect(future.locator('.future-homepage-start-arrow')).toHaveCount(1);
    await expect(future.locator('.future-homepage-blue-wipe')).toHaveCount(1);
    await expect(future.locator('.future-homepage-credit')).toHaveCount(3);
    await expect(future.locator('.future-homepage-credits')).toHaveAttribute(
      'aria-label',
      /A Jamie Wilson production.*Created and directed by Jamie Wilson.*Hugo Go/i,
    );
    await expect(future.getByText('Dotterel Design')).toHaveCount(0);
    await future.getByRole('button', { name: 'Start the Mount Pogaga sequence' }).click();
    await expect(future.locator('[data-v03-cinematic-line]').first()).toHaveCSS(
      'animation-name',
      'future-homepage-letterbox-in',
    );
    await expect(future.getByText('Loading...')).toHaveCount(0);
    await expect(future.getByText('SQUIRREL FIELD NOTE')).toHaveCount(0);
    await expect(future.getByText(/The world saw only a boy/i)).toBeVisible();
    await expect(future.getByText(/The boy saw a world waiting to be conquered/i)).toBeVisible();
    await expect(future.locator('#future-homepage-sleepy-audio')).toHaveAttribute(
      'src',
      /audio\/music\/sleepy\.mp3/,
    );
    await expect(future.locator('#future-homepage-sleepy-audio')).toHaveAttribute('loop', '');
    await expect(future.getByRole('button', { name: 'Back to Version 03' })).toHaveCount(0);
  });
});
