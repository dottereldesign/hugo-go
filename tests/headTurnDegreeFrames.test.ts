import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../src/assets/game/head-turn/canonical-24/manifest.json';

describe('canonical degree-addressed Hugo head turn', () => {
  it('contains one clockwise file every 15 degrees from front', () => {
    expect(manifest.viewCount).toBe(24);
    expect(manifest.stepDegrees).toBe(15);
    expect(manifest.zeroDegrees).toBe('front');
    expect(manifest.direction).toBe('clockwise-viewed-from-above');
    expect(manifest.source.singleSequenceOnly).toBe(true);
    expect(manifest.source.pixelChangesDuringExtraction).toBe(false);
    expect(manifest.frames.map(({ degrees }) => degrees)).toEqual(
      Array.from({ length: 24 }, (_, index) => index * 15),
    );
    expect(manifest.frames[0].file).toBe(
      'frames/hugo-head-yaw-cw-000-front.png',
    );
    expect(manifest.frames[6].file).toBe(
      'frames/hugo-head-yaw-cw-090-left-profile.png',
    );
    expect(manifest.frames[12].file).toBe(
      'frames/hugo-head-yaw-cw-180-back.png',
    );
    expect(manifest.frames[18].file).toBe(
      'frames/hugo-head-yaw-cw-270-right-profile.png',
    );
  });

  it('keeps every manifest entry bound to the exact extracted PNG', () => {
    for (const frame of manifest.frames) {
      const path = resolve(
        'src/assets/game/head-turn/canonical-24',
        frame.file,
      );
      const bytes = readFileSync(path);
      const digest = createHash('sha256').update(bytes).digest('hex');
      expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
      expect(digest).toBe(frame.sha256);
    }
  });
});
