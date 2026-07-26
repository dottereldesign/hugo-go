import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import library from '../src/assets/game/2d-v02/manifest.json';
import nightComet from '../src/assets/game/2d-v02/night-comet/manifest.json';
import skyline from '../src/assets/game/2d-v02/skyline/manifest.json';
import sunrise from '../src/assets/game/2d-v02/sunrise/manifest.json';

const outfits = [skyline, nightComet, sunrise];
const expectedSlugs = [
  'neutral-front',
  'ready-profile',
  'sprint-launch',
  'jump-tuck',
  'level-glide',
  'steep-dive',
  'bank-left',
  'bank-right',
  'jet-boost',
  'landing-crouch',
  'braking-flare',
  'hero-finish',
];

describe('2D Sandbox Version 02 pose library', () => {
  it('registers three coherent 4x3 outfit sheets and 36 individual poses', () => {
    expect(library).toMatchObject({
      sandboxVersion: '02',
      direction: '2D pose library',
      sheetCount: 3,
      poseCountPerSheet: 12,
      individualPoseCount: 36,
    });
    expect(library.outfits.map(({ id }) => id)).toEqual([
      'skyline',
      'night-comet',
      'sunrise',
    ]);

    for (const outfit of outfits) {
      expect(outfit.source).toMatchObject({
        width: 1254,
        height: 1254,
        columns: 4,
        rows: 3,
      });
      expect(outfit.extraction).toMatchObject({
        method: 'connected-silhouette-ordered-by-grid-centre',
        outputCanvas: [512, 512],
        figureLimit: 440,
        poseCount: 12,
      });
      expect(outfit.poses.map(({ index }) => index)).toEqual(
        Array.from({ length: 12 }, (_, index) => index + 1),
      );
      expect(outfit.poses.map(({ slug }) => slug)).toEqual(expectedSlugs);
      expect(outfit.poses.map(({ sourceCell }) => [
        sourceCell.row,
        sourceCell.column,
      ])).toEqual(
        Array.from({ length: 12 }, (_, index) => [
          Math.floor(index / 4) + 1,
          index % 4 + 1,
        ]),
      );
    }
  });

  it('binds every manifest entry to a unique transparent 512px PNG checksum', () => {
    const registeredFiles = outfits.flatMap(({ poses }) => poses.map(({ file }) => file));
    expect(new Set(registeredFiles).size).toBe(36);

    for (const outfit of outfits) {
      for (const pose of outfit.poses) {
        const path = resolve(pose.file);
        const bytes = readFileSync(path);
        const digest = createHash('sha256').update(bytes).digest('hex');
        expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
        expect(bytes.readUInt32BE(16)).toBe(512);
        expect(bytes.readUInt32BE(20)).toBe(512);
        expect(bytes[25]).toBe(6);
        expect(digest).toBe(pose.output.sha256);
        expect(pose.filename).toMatch(
          new RegExp(`^hugo-2d-${outfit.outfit.id}-\\d{2}-${pose.slug}\\.png$`),
        );
      }
    }
  });

  it('keeps every normalized figure inside a transparent safety gutter', () => {
    for (const outfit of outfits) {
      for (const pose of outfit.poses) {
        const [left, top, right, bottom] = pose.output.alphaBounds;
        expect(left).toBeGreaterThanOrEqual(36);
        expect(top).toBeGreaterThanOrEqual(36);
        expect(512 - right).toBeGreaterThanOrEqual(36);
        expect(512 - bottom).toBeGreaterThanOrEqual(36);
        expect(Math.max(right - left, bottom - top)).toBeLessThanOrEqual(440);
      }
    }
  });
});
