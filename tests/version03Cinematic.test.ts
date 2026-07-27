import { existsSync, readFileSync, statSync } from 'node:fs';
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

  it('ships the monochrome panorama and its full-screen scene hooks', () => {
    const backdropPath = resolve(
      'src/assets/game/2d-v03/cinematic/hugo-cliff-city-backdrop.webp',
    );
    const backdrop = readFileSync(backdropPath);
    const html = readFileSync(resolve('index.html'), 'utf8');

    expect(backdrop.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(backdrop.subarray(8, 12).toString('ascii')).toBe('WEBP');
    expect(statSync(backdropPath).size).toBeGreaterThan(200_000);
    expect(html).toContain('data-v03-cinematic');
    expect(html).toContain('data-v03-cinematic-world');
    expect(html).toContain('data-v03-cinematic-frame');
    expect(html).toContain('data-v03-cinematic-backdrop');
  });
});
