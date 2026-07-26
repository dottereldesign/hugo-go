import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import library from '../src/assets/game/2d-v02/animations/manifest.json';
import neutralIdle from '../src/assets/game/2d-v02/animations/neutral-idle/manifest.json';
import readyProfile from '../src/assets/game/2d-v02/animations/ready-profile/manifest.json';

const animations = [neutralIdle, readyProfile];

function digest(path: string): string {
  return createHash('sha256').update(readFileSync(resolve(path))).digest('hex');
}

describe('2D Sandbox Version 02 Outfit 03 animations', () => {
  it('locks Outfit 03 and registers both authored loops', () => {
    expect(library).toMatchObject({
      sandboxVersion: '02',
      canonicalOutfit: {
        id: 'sunrise',
        displayName: 'Outfit 03 · Sunrise Flight Suit',
      },
      animationCount: 2,
    });
    expect(library.animations.map(({ id }) => id)).toEqual([
      'neutral-idle',
      'ready-profile',
    ]);

    expect(neutralIdle.timing).toMatchObject({
      baseFps: 24,
      drawingCount: 69,
      runtimeFrameCount: 68,
      runtimeTicks: 68,
      loopDurationSeconds: 68 / 24,
      bookendFrame: 69,
    });
    expect(readyProfile.timing).toMatchObject({
      baseFps: 12,
      drawingCount: 24,
      runtimeFrameCount: 23,
      runtimeTicks: 51,
      loopDurationSeconds: 4.25,
      bookendFrame: 24,
      bookendRuntime: false,
    });
  });

  it('keeps original chronology and inserts only bracketed adjacent-pair targets', () => {
    const inserted = neutralIdle.frames.filter(
      ({ source }) => source.type === '24fps-adjacent-pair-inbetween',
    );
    expect(inserted).toHaveLength(34);
    expect(inserted.map(({ source }) => source.betweenBaseFrames)).toEqual(
      Array.from({ length: 34 }, (_, index) => [index + 1, index === 33 ? 1 : index + 2]),
    );
    expect(new Set(inserted.map(({ source }) => source.column))).toEqual(new Set([2]));
    expect(neutralIdle.frames.some(({ slug }) => slug === 'wipe-smear')).toBe(false);
    expect(neutralIdle.frames.filter(({ runtime }) => runtime).every(({ durationTicks }) => durationTicks === 1)).toBe(true);

    const generated = readyProfile.frames.slice(1, 23);
    expect(generated.slice(0, 11).map(({ source }) => source.sheetFrame)).toEqual(
      Array.from({ length: 11 }, (_, index) => index + 2),
    );
    expect(generated.slice(11).map(({ source }) => source.sheetFrame)).toEqual(
      Array.from({ length: 11 }, (_, index) => index + 1),
    );
    expect(new Set(generated.slice(0, 11).map(({ source }) => source.sheet))).toHaveLength(1);
    expect(new Set(generated.slice(11).map(({ source }) => source.sheet))).toHaveLength(1);
    expect(generated[0].source.sheet).not.toBe(generated[11].source.sheet);
  });

  it('keeps all neutral drawings on the fixed 640px production canvas', () => {
    for (const frame of neutralIdle.frames.filter(({ runtime }) => runtime)) {
      expect(frame.rootRegistration ?? frame.source.refinement).toBeDefined();
    }
  });

  it('binds every entry to a named transparent 640px PNG and exact seam copy', () => {
    const files = animations.flatMap(({ frames }) => frames.map(({ file }) => file));
    expect(new Set(files).size).toBe(93);

    for (const animation of animations) {
      for (const frame of animation.frames) {
        const bytes = readFileSync(resolve(frame.file));
        expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
        expect(bytes.readUInt32BE(16)).toBe(640);
        expect(bytes.readUInt32BE(20)).toBe(640);
        expect(bytes[25]).toBe(6);
        expect(digest(frame.file)).toBe(frame.output.sha256);
        expect(frame.filename).toBe(
          `hugo-${animation.animation.id}-${String(frame.index).padStart(2, '0')}-${frame.slug}.png`,
        );
        const [left, top, right, bottom] = frame.output.alphaBounds;
        expect(left).toBeGreaterThanOrEqual(0);
        expect(top).toBeGreaterThanOrEqual(0);
        expect(right).toBeLessThanOrEqual(640);
        expect(bottom).toBeLessThanOrEqual(640);
      }

      const first = animation.frames[0];
      const bookend = animation.frames.at(-1)!;
      expect(bookend.runtime).toBe(false);
      expect(bookend.durationTicks).toBe(0);
      expect(readFileSync(resolve(bookend.file))).toEqual(readFileSync(resolve(first.file)));
      expect(bookend.output.sha256).toBe(first.output.sha256);
      expect(animation.frames.slice(0, -1).every(({ runtime }) => runtime)).toBe(true);
      expect(
        animation.frames.slice(0, -1).reduce((sum, frame) => sum + frame.durationTicks, 0),
      ).toBe(animation.timing.runtimeTicks);
    }
  });
});
