import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../src/assets/game/2d-v03/animations/neutral-to-naruto-run/manifest.json';

const frameRoot = resolve(
  'src/assets/game/2d-v03/animations/neutral-to-naruto-run/frames',
);

const digest = (path: string): string => (
  createHash('sha256').update(readFileSync(path)).digest('hex')
);

describe('Version 03 Neutral Side to Naruto Run transition', () => {
  it('has a matching Version 03 page card for the registered manifest', () => {
    const html = readFileSync(resolve('index.html'), 'utf8');
    expect(html).toContain(
      'data-v03-animation="neutral-to-naruto-run"',
    );
  });

  it('keeps only the first four drawings in Animation 03', () => {
    expect(manifest.animation.id).toBe('neutral-to-naruto-run');
    expect(manifest.timing.drawingCount).toBe(4);
    expect(manifest.timing.runtimeFrameCount).toBe(4);
    expect(manifest.timing.baseFps).toBe(4);
    expect(manifest.timing.loopDurationSeconds).toBe(1);
    expect(manifest.frames.map((frame) => frame.sourceFrame)).toEqual([
      1, 2, 3, 4,
    ]);

    const startFrame = resolve(frameRoot, manifest.frames[0].filename);
    const approvedStart = resolve(
      'src/assets/game/2d-v03/animations/head-nod-soft-inbetweens/frames/hugo-head-nod-smooth-01-approved-00-percent.png',
    );

    expect(digest(startFrame)).toBe(digest(approvedStart));
  });

  it('binds three distinct generated preparation drawings', () => {
    expect(manifest.frames.every((frame) => (
      existsSync(resolve(frameRoot, frame.filename))
    ))).toBe(true);
    expect(manifest.source.uniqueDrawings).toHaveLength(4);

    const generated = manifest.source.uniqueDrawings.slice(1);
    expect(generated.every(
      (drawing) => drawing.kind === 'generated in-between',
    )).toBe(true);
    expect(generated.every(
      (drawing) => drawing.legMechanics.nearLeg !== drawing.legMechanics.farLeg,
    )).toBe(true);
    expect(new Set(generated.map((drawing) => drawing.sha256)).size).toBe(3);
    expect(generated.slice(0, 2).map((drawing) => drawing.progressPercent)).toEqual([
      7, 13,
    ]);
    expect(manifest.source.generatedDrawings).toHaveLength(3);
    expect(manifest.source.generatedDrawings.every(
      (path) => existsSync(resolve(path)),
    )).toBe(true);
    expect(existsSync(resolve(manifest.source.registeredSequence))).toBe(true);
    expect(manifest.animation.description).toContain('two gentle');
    expect(manifest.productionMethod).toContain('no body-part compositing');
  });
});
