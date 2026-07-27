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

    expect(existsSync(backdropPath)).toBe(false);
    expect(html.match(/data-v03-cinematic(?=[\s>])/g)).toHaveLength(2);
    expect(html.match(/data-v03-cinematic-world/g)).toHaveLength(2);
    expect(html.match(/data-v03-cinematic-frame/g)).toHaveLength(2);
    expect(html.match(/data-v03-cinematic-line/g)).toHaveLength(2);
    expect(html.match(/data-v03-cinematic-ground-line/g)).toHaveLength(2);
    expect(html).toContain('id="future-homepage-button"');
    expect(html).toContain('id="version-03-future-homepage-button"');
    expect(html).toContain('id="future-homepage-screen"');
    expect(app).toContain("'#/future-homepage'");
    expect(html).not.toContain('data-v03-cinematic-backdrop');
  });
});
