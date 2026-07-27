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
    expect(html.match(/data-v03-cinematic(?=[\s>])/g)).toHaveLength(2);
    expect(html.match(/data-v03-cinematic-world/g)).toHaveLength(2);
    expect(html.match(/data-v03-cinematic-frame/g)).toHaveLength(2);
    expect(html.match(/data-v03-cinematic-line/g)).toHaveLength(2);
    expect(html.match(/data-v03-cinematic-ground-line/g)).toHaveLength(2);
    expect(html).toContain('id="future-homepage-button"');
    expect(html).toContain('id="version-03-future-homepage-button"');
    expect(html).toContain('id="future-homepage-screen"');
    expect(html).toContain('id="future-homepage-sleepy-audio"');
    expect(html).toContain('src="./audio/music/sleepy.mp3"');
    expect(loadingStart).toBeGreaterThan(futureHomepageStart);
    expect(html.match(/class="future-homepage-loading"/g)).toHaveLength(1);
    expect(html).toContain('MOUNT POGAGA // 01');
    expect(html).toContain('Loading...');
    expect(html).toContain('読み込み中…');
    expect(html).not.toContain('FOREST SYSTEM');
    expect(html).toContain('Some squirrels help forests grow');
    expect(html).not.toContain('SQUIRREL FIELD NOTE');
    expect(app).toContain("'#/future-homepage'");
    expect(app).toContain("@fontsource/rampart-one/latin-400.css");
    expect(app).toContain("@fontsource/rampart-one/japanese-400.css");
    expect(cinematic).toContain("'--v03-cinematic-midline-y'");
    expect(styles).toContain("font: 400 clamp(3.5rem, 8vw, 10rem)/1.08 'Rampart One'");
    expect(styles).toContain('@keyframes future-loading-type');
    expect(styles).toContain('@keyframes future-loading-type-japanese');
    expect(styles).toContain('clip-path: inset(-.12em 100% -.2em 0)');
    expect(styles).toContain('3.2s steps(10, end) .15s infinite both');
    expect(styles).toContain('.v03-cinematic--future-homepage .v03-cinematic-character');
    expect(styles).toContain('@media (hover: hover) and (pointer: fine)');
    expect(styles).toContain('drop-shadow(0 0 8px rgba(36, 255, 127, .5))');
    expect(html).not.toContain('data-v03-cinematic-backdrop');
  });
});
