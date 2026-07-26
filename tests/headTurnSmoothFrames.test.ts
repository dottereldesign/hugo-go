import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import anchorManifest from '../src/assets/game/head-turn/canonical-24/manifest.json';
import manifest from '../src/assets/game/head-turn/canonical-48/manifest.json';

describe('paired-midpoint 60 FPS Hugo head turn', () => {
  it('alternates immutable anchors and exact 7.5-degree midpoints', () => {
    expect(manifest.viewCount).toBe(48);
    expect(manifest.stepDegrees).toBe(7.5);
    expect(manifest.playbackFps).toBe(60);
    expect(manifest.loopDurationSeconds).toBe(0.8);
    expect(manifest.derivation).toMatchObject({
      approvedAnchorCount: 24,
      generatedMidpointCount: 24,
      pairSpecificGeneration: true,
      sheetSlicing: false,
      independentSheetInterleaving: false,
      anchorsCopiedByteForByte: true,
    });
    expect(manifest.frames.map(({ degrees }) => degrees)).toEqual(
      Array.from({ length: 48 }, (_, index) => index * 7.5),
    );

    manifest.frames.forEach((frame, index) => {
      if (index % 2 === 0) {
        const anchor = anchorManifest.frames[index / 2];
        expect(frame.kind).toBe('approved-anchor');
        expect(frame.file).toBe(anchor.file);
        expect(frame.sha256).toBe(anchor.sha256);
        return;
      }
      expect(frame.kind).toBe('generated-midpoint');
      expect(frame.file).toContain('p5.png');
      expect(frame.generatedFromDegrees).toEqual([
        (frame.degrees - 7.5 + 360) % 360,
        (frame.degrees + 7.5) % 360,
      ]);
      expect(frame.generationContract).toBe('one-adjacent-pair-per-call');
    });
  });

  it('binds all 48 manifest entries to separate registered PNG files', () => {
    for (const frame of manifest.frames) {
      const path = resolve(
        'src/assets/game/head-turn/canonical-48',
        frame.file,
      );
      const bytes = readFileSync(path);
      const digest = createHash('sha256').update(bytes).digest('hex');
      expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
      expect(bytes.readUInt32BE(16)).toBe(320);
      expect(bytes.readUInt32BE(20)).toBe(320);
      expect(digest).toBe(frame.sha256);
    }
  });

  it('keeps every registered silhouette on one fixed-height centre', () => {
    expect(manifest.registration).toMatchObject({
      canvas: [320, 320],
      alphaHeight: 240,
      topGutter: 40,
      centreYSpread: 0,
      alphaHeightSpread: 0,
    });
    expect(manifest.registration.centreXSpread).toBeLessThanOrEqual(0.5);
    expect(manifest.registration.minimumGutter).toBeGreaterThanOrEqual(32);
  });
});
