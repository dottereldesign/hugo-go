import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../src/assets/game/2d-v03/animations/neutral-to-confident-walk/manifest.json';

const frameRoot = resolve(
  'src/assets/game/2d-v03/animations/neutral-to-confident-walk/frames',
);

const digest = (path: string): string => (
  createHash('sha256').update(readFileSync(path)).digest('hex')
);

describe('Version 03 Neutral Side to Confident Walk transition', () => {
  it('uses five complete drawings with exact approved endpoints', () => {
    expect(manifest.animation.id).toBe('neutral-to-confident-walk');
    expect(manifest.timing.drawingCount).toBe(5);
    expect(manifest.timing.runtimeFrameCount).toBe(7);
    expect(manifest.frames[0].sourceFrame).toBe(1);
    expect(manifest.frames.at(-1)?.sourceFrame).toBe(5);

    const startFrame = resolve(frameRoot, manifest.frames[0].filename);
    const finalFrame = resolve(frameRoot, manifest.frames.at(-1)!.filename);
    const approvedStart = resolve(
      'src/assets/game/2d-v03/animations/head-nod-soft-inbetweens/frames/hugo-head-nod-smooth-01-approved-00-percent.png',
    );
    const approvedFinal = resolve(
      'src/assets/game/2d-v03/sunrise-side/poses/hugo-sunrise-side-02-confident-walk.png',
    );

    expect(digest(startFrame)).toBe(digest(approvedStart));
    expect(digest(finalFrame)).toBe(digest(approvedFinal));
  });

  it('binds every runtime step to a registered frame asset', () => {
    expect(manifest.frames.every((frame) => (
      existsSync(resolve(frameRoot, frame.filename))
    ))).toBe(true);
    expect(manifest.source.uniqueDrawings).toHaveLength(5);
    expect(manifest.source.uniqueDrawings.slice(1, 4).every(
      (drawing) => drawing.kind === 'generated in-between',
    )).toBe(true);
    expect(manifest.productionMethod).toContain('no body-part compositing');
    expect(existsSync(resolve(manifest.source.generatedSheet))).toBe(true);
  });
});
