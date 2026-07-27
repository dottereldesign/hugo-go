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
  it('uses nine complete drawings while preserving both approved poses', () => {
    expect(manifest.animation.id).toBe('neutral-to-confident-walk');
    expect(manifest.timing.drawingCount).toBe(9);
    expect(manifest.timing.runtimeFrameCount).toBe(10);
    expect(manifest.timing.baseFps).toBe(10);
    expect(manifest.timing.loopDurationSeconds).toBe(1);
    expect(manifest.frames[0].sourceFrame).toBe(1);
    expect(manifest.frames.at(-1)?.sourceFrame).toBe(9);
    expect(manifest.frames.filter((frame) => frame.sourceFrame === 5)).toHaveLength(1);

    const startFrame = resolve(frameRoot, manifest.frames[0].filename);
    const approvedWalkFrame = resolve(
      frameRoot,
      manifest.frames.find((frame) => frame.sourceFrame === 5)!.filename,
    );
    const approvedStart = resolve(
      'src/assets/game/2d-v03/animations/head-nod-soft-inbetweens/frames/hugo-head-nod-smooth-01-approved-00-percent.png',
    );
    const approvedFinal = resolve(
      'src/assets/game/2d-v03/sunrise-side/poses/hugo-sunrise-side-02-confident-walk.png',
    );

    expect(digest(startFrame)).toBe(digest(approvedStart));
    expect(digest(approvedWalkFrame)).toBe(digest(approvedFinal));
  });

  it('binds the complete opposite-leg follow-through to registered assets', () => {
    expect(manifest.frames.every((frame) => (
      existsSync(resolve(frameRoot, frame.filename))
    ))).toBe(true);
    expect(manifest.source.uniqueDrawings).toHaveLength(9);
    expect(manifest.source.uniqueDrawings.slice(1, 4).every(
      (drawing) => drawing.kind === 'generated in-between',
    )).toBe(true);
    expect(manifest.source.uniqueDrawings.slice(5).every(
      (drawing) => drawing.kind === 'generated opposite-step continuation',
    )).toBe(true);
    expect(manifest.source.continuationDrawings).toHaveLength(4);
    expect(manifest.source.continuationDrawings.every(
      (path) => existsSync(resolve(path)),
    )).toBe(true);
    expect(manifest.frames.slice(6).map((frame) => frame.sourceFrame)).toEqual([
      6, 7, 8, 9,
    ]);
    expect(manifest.animation.description).toContain("opposite leg's complete next step");
    expect(manifest.productionMethod).toContain('no body-part compositing');
    expect(existsSync(resolve(manifest.source.generatedSheet))).toBe(true);
    expect(existsSync(resolve(manifest.source.registeredSequence))).toBe(true);
  });
});
