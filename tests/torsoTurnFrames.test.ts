import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import headManifest from '../src/assets/game/head-turn/canonical-24/manifest.json';
import manifest from '../src/assets/game/torso-turn/canonical-24/manifest.json';

describe('sheet-extracted 24-view Hugo torso turn', () => {
  it('maps one coherent 6x4 source sheet to exact 15-degree files', () => {
    expect(manifest.viewCount).toBe(24);
    expect(manifest.stepDegrees).toBe(15);
    expect(manifest.playbackFps).toBe(12);
    expect(manifest.loopDurationSeconds).toBe(2);
    expect(manifest.source).toMatchObject({
      sheetLayout: [6, 4],
      uniqueViews: 24,
      singleGenerationOnly: true,
      connectedComponentExtraction: true,
      crossSheetInterleaving: false,
    });
    expect(manifest.frames.map(({ sourceAtlasIndex }) => sourceAtlasIndex)).toEqual(
      Array.from({ length: 24 }, (_, index) => index),
    );
    expect(manifest.frames.map(({ degrees }) => degrees)).toEqual(
      Array.from({ length: 24 }, (_, index) => index * 15),
    );
    expect(manifest.frames[0].file).toBe(
      'frames/hugo-torso-yaw-cw-000-front.png',
    );
    expect(manifest.frames[6].file).toBe(
      'frames/hugo-torso-yaw-cw-090-left-profile.png',
    );
    expect(manifest.frames[12].file).toBe(
      'frames/hugo-torso-yaw-cw-180-back.png',
    );
    expect(manifest.frames[18].file).toBe(
      'frames/hugo-torso-yaw-cw-270-right-profile.png',
    );
  });

  it('keeps every torso frame registered and bound to its checksum', () => {
    expect(manifest.registration).toMatchObject({
      canvas: [320, 320],
      alphaHeight: 260,
      topGutter: 30,
      neckSocket: [160, 62],
      centreYSpread: 0,
      alphaHeightSpread: 0,
    });
    expect(manifest.registration.centreXSpread).toBeLessThanOrEqual(0.5);

    for (const frame of manifest.frames) {
      const path = resolve(
        'src/assets/game/torso-turn/canonical-24',
        frame.file,
      );
      const bytes = readFileSync(path);
      const digest = createHash('sha256').update(bytes).digest('hex');
      expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
      expect(bytes.readUInt32BE(16)).toBe(320);
      expect(bytes.readUInt32BE(20)).toBe(320);
      expect(digest).toBe(frame.sha256);
      expect(frame.sourceBounds[2]).toBeGreaterThan(frame.sourceBounds[0]);
      expect(frame.sourceBounds[3]).toBeGreaterThan(frame.sourceBounds[1]);
    }
  });

  it('synchronizes torso and head by the same degree and render contract', () => {
    expect(manifest.sync).toEqual({
      headManifest: 'src/assets/game/head-turn/canonical-24/manifest.json',
      rule: 'same-index-same-degree',
      headLayer: 'behind-torso-collar',
    });
    expect(manifest.frames.map(({ degrees }) => degrees)).toEqual(
      headManifest.frames.map(({ degrees }) => degrees),
    );
  });
});
