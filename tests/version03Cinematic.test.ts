import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../src/assets/game/2d-v03/animations/head-nod-soft-inbetweens/manifest.json';

describe('Version 03 long-view cinematic', () => {
  it('reuses the approved twelve-step neutral-side nod loop', () => {
    expect(manifest.animation.id).toBe('head-nod-soft-inbetweens');
    expect(manifest.timing.runtimeFrameCount).toBe(12);
    expect(manifest.frames).toHaveLength(12);

    for (const frame of manifest.frames) {
      expect(
        existsSync(
          resolve(
            'src/assets/game/2d-v03/animations/head-nod-soft-inbetweens/frames',
            frame.filename,
          ),
        ),
      ).toBe(true);
    }
  });

  it('ships the library and future-homepage scenes with two straight lines each', () => {
    const backdropPath = resolve(
      'src/assets/game/2d-v03/cinematic/hugo-cliff-city-backdrop.webp',
    );
    const html = readFileSync(resolve('index.html'), 'utf8');
    const app = readFileSync(resolve('src/main.ts'), 'utf8');
    const cinematic = readFileSync(resolve('src/game/Version03Cinematic.ts'), 'utf8');
    const styles = readFileSync(resolve('src/style.css'), 'utf8');
    const futureHomepageStart = html.indexOf('id="future-homepage-screen"');
    const loadingStart = html.indexOf('class="future-homepage-loading"');

    expect(existsSync(backdropPath)).toBe(false);
    expect(existsSync(resolve('public/audio/music/sleepy.mp3'))).toBe(true);
    expect(html).toContain(
      '<link rel="preload" href="./audio/music/sleepy.mp3" as="audio" type="audio/mpeg" />',
    );
    expect(html.match(/data-v03-cinematic(?=[\s>])/g)).toHaveLength(2);
    expect(html.match(/data-v03-cinematic-world/g)).toHaveLength(2);
    expect(html.match(/data-v03-cinematic-frame/g)).toHaveLength(2);
    expect(html.match(/data-v03-cinematic-line/g)).toHaveLength(2);
    expect(html.match(/data-v03-cinematic-ground-line/g)).toHaveLength(2);
    expect(html).toContain('id="future-homepage-button"');
    expect(html).toContain('id="version-03-future-homepage-button"');
    expect(html).toContain('id="future-homepage-screen"');
    expect(html).not.toContain('id="future-homepage-back-button"');
    expect(html).toContain('id="future-homepage-sleepy-audio"');
    expect(html).toContain('src="./audio/music/sleepy.mp3"');
    expect(loadingStart).toBeGreaterThan(futureHomepageStart);
    expect(html.match(/class="future-homepage-loading"/g)).toHaveLength(1);
    expect(html).toContain('MOUNT POGAGA // 01');
    expect(html).toContain('id="future-homepage-start"');
    expect(html).toContain('class="future-homepage-start-arrow"');
    expect(html).toContain('data-lucide="arrow-right"');
    expect(html).toContain('<span>START</span>');
    expect(html).toContain('class="future-homepage-blue-wipe"');
    expect(html).toContain('data-v03-cinematic-color-frame');
    expect(html).toContain('aria-label="読み込み中..."');
    expect(html).toContain('class="future-homepage-loading-dots"');
    expect(html).not.toContain('<span>Loading...</span>');
    expect(html).not.toContain('FOREST SYSTEM');
    expect(html).toContain('A gorilla weighs about as much as 450 squirrels');
    expect(html).toContain('The other 4,550 are there for emotional support.');
    expect(html).not.toContain('Some squirrels help forests grow');
    expect(html).not.toContain('SQUIRREL FIELD NOTE');
    expect(app).toContain("'#/future-homepage'");
    expect(app).toContain("@fontsource/rampart-one/latin-400.css");
    expect(app).toContain("@fontsource/rampart-one/japanese-400.css");
    expect(app).toContain('this.futureHomepageCinematic.holdFirstFrame()');
    expect(app).toContain('this.futureHomepageAudio.prime()');
    expect(app).toContain('frame.frameNumber === 7');
    expect(app).toContain('frame.completedLoops >= 3');
    expect(cinematic).not.toContain("'--v03-cinematic-midline-y'");
    expect(cinematic).not.toContain('syncCamera');
    expect(cinematic).not.toContain("addEventListener('scroll'");
    expect(cinematic).toContain('this.root.style.height = `${viewportHeight}px`');
    expect(cinematic).toContain('window.devicePixelRatio');
    expect(cinematic).toContain("'--v03-native-frame-css-width'");
    expect(styles).toContain('max-width: 1200px !important');
    expect(styles).toContain("font: 400 clamp(3.5rem, 8vw, 6.25rem)/1.18 'Rampart One'");
    expect(styles).toContain('--future-homepage-ink: #20231f');
    expect(styles).toContain('--future-homepage-blue-start: #20c8f3');
    expect(styles).toContain('--future-homepage-blue-end: #31e1ff');
    expect(styles).toContain('.future-homepage-screen > .v03-cinematic-line');
    expect(styles).toContain('.future-homepage-screen.is-running > .v03-cinematic-line');
    expect(styles).toContain('height: max(64px, calc((100% - min(56.25vw, 675px)) / 2))');
    expect(styles).toContain('height: clamp(44px, 9vh, 72px)');
    expect(styles).toContain('max-width: 520px');
    expect(styles).toContain('width: clamp(320px, 31vw, 570px)');
    expect(styles).toContain(
      'width: min(82vw, var(--v03-native-frame-css-width, 170px))',
    );
    expect(styles).toContain('.v03-cinematic-character.is-alpha-hovered');
    expect(styles).not.toContain('height: 420vh');
    expect(styles).toContain('transform: translate(-50%, -50%)');
    expect(styles).toContain('@keyframes future-loading-type');
    expect(styles).toContain('@keyframes future-loading-dots');
    expect(styles).toContain('@keyframes future-homepage-colour-reveal');
    expect(styles).toContain('@keyframes future-homepage-blue-wipe');
    expect(styles).toContain('@keyframes future-homepage-column-exit');
    expect(styles).toContain('@keyframes future-homepage-slash-enter');
    expect(styles).toContain('transform: translate(-50%, -81.25%)');
    expect(styles).toContain('width: clamp(145px, 13vw, 210px)');
    expect(styles).toContain('clip-path: polygon(0 -100%, 0 -100%, 0 200%, 0 200%)');
    expect(styles).toContain('3.2s steps(5, end) .15s infinite both');
    expect(styles).toContain('3.2s steps(3, end) .15s infinite both');
    expect(styles).not.toContain('.future-homepage-loading-title::after');
    expect(styles).not.toContain('future-loading-cursor');
    expect(styles).toContain('.v03-cinematic--future-homepage .v03-cinematic-character');
    expect(styles).toContain('@media (hover: hover) and (pointer: fine)');
    expect(styles).toContain('grayscale(1)');
    expect(styles).toContain('sepia(.08)');
    expect(styles).toContain('saturate(.82)');
    expect(styles).not.toContain('drop-shadow(0 20px 18px rgba(32, 35, 31');
    expect(styles).not.toContain('rgba(78, 255, 148');
    expect(styles).not.toContain('.v03-cinematic-character:hover img');
    expect(styles).not.toContain('.v03-cinematic--future-homepage .v03-cinematic-character::before');
    expect(styles).not.toContain('.v03-cinematic--future-homepage .v03-cinematic-character::after');
    expect(cinematic).toContain("'pointermove'");
    expect(cinematic).toContain("getImageData(");
    expect(cinematic).toContain("'is-alpha-hovered'");
    expect(html).not.toContain('data-v03-cinematic-backdrop');
  });
});
