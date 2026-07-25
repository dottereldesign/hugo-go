import { describe, expect, it } from 'vitest';
import {
  getRunFrame,
  RUN_ATLAS_COLUMNS,
  RUN_FRAME_COUNT,
  RUN_FRAME_HEIGHT,
  RUN_FRAME_WIDTH,
  RUN_FRAMES_PER_SECOND,
} from '../src/game/animation';
import {
  getSeasonVisual,
  SEASON_DURATION_SECONDS,
  SEASON_TRANSITION_SECONDS,
} from '../src/game/seasons';

describe('Forest seasonal presentation', () => {
  it('holds each season before beginning a gradual ten-second transition', () => {
    const beforeTransition = getSeasonVisual(SEASON_DURATION_SECONDS - SEASON_TRANSITION_SECONDS - 0.01);
    expect(beforeTransition.current).toBe('spring');
    expect(beforeTransition.transition).toBe(0);
    expect(beforeTransition.label).toBe('Spring');

    const halfway = getSeasonVisual(25);
    expect(halfway.current).toBe('spring');
    expect(halfway.next).toBe('summer');
    expect(halfway.transition).toBeCloseTo(0.5, 8);
    expect(halfway.label).toBe('Spring → Summer');
  });

  it('advances through all four seasons every thirty seconds and loops', () => {
    expect(getSeasonVisual(0).current).toBe('spring');
    expect(getSeasonVisual(30).current).toBe('summer');
    expect(getSeasonVisual(60).current).toBe('autumn');
    expect(getSeasonVisual(90).current).toBe('winter');
    expect(getSeasonVisual(120).current).toBe('spring');
  });

  it('keeps blended particle weights normalised during every transition', () => {
    for (const elapsed of [0, 25, 55, 85, 115, 120]) {
      const visual = getSeasonVisual(elapsed);
      const total = Object.values(visual.particleWeights).reduce((sum, weight) => sum + weight, 0);
      expect(total).toBeCloseTo(1, 8);
      expect(visual.filter).toContain('saturate(');
      expect(visual.overlay).toMatch(/^rgba\(/);
    }
  });

  it('repairs invalid elapsed times to the Spring opening', () => {
    expect(getSeasonVisual(Number.NaN).current).toBe('spring');
    expect(getSeasonVisual(-30).current).toBe('spring');
  });
});

describe('Hugo run-cycle timing', () => {
  it('uses all 60 authored poses at a natural 30 frames per second', () => {
    const indices = Array.from(
      { length: RUN_FRAME_COUNT },
      (_, index) => getRunFrame(index / RUN_FRAMES_PER_SECOND).index,
    );
    expect(indices).toEqual(Array.from({ length: 60 }, (_, index) => index));
    expect(new Set(indices).size).toBe(60);
    expect(RUN_FRAMES_PER_SECOND).toBe(30);
  });

  it('maps each authored pose to one unique cell in the 10 by 6 atlas', () => {
    const frames = Array.from(
      { length: RUN_FRAME_COUNT },
      (_, index) => getRunFrame(index / RUN_FRAMES_PER_SECOND),
    );
    expect(new Set(frames.map(({ sourceX, sourceY }) => `${sourceX},${sourceY}`)).size).toBe(60);
    expect(frames.every(({ sourceX }) => sourceX % RUN_FRAME_WIDTH === 0)).toBe(true);
    expect(frames.every(({ sourceY }) => sourceY % RUN_FRAME_HEIGHT === 0)).toBe(true);
    expect(Math.max(...frames.map(({ sourceX }) => sourceX))).toBe(
      (RUN_ATLAS_COLUMNS - 1) * RUN_FRAME_WIDTH,
    );
    expect(Math.max(...frames.map(({ sourceY }) => sourceY))).toBe(5 * RUN_FRAME_HEIGHT);
  });

  it('loops seamlessly after one complete two-second stride', () => {
    const loopDuration = RUN_FRAME_COUNT / RUN_FRAMES_PER_SECOND;
    expect(loopDuration).toBe(2);
    expect(getRunFrame(0).index).toBe(0);
    expect(getRunFrame(loopDuration).index).toBe(0);
    expect(getRunFrame(Number.NaN).index).toBe(0);
  });

  it('uses two smooth airborne arcs without a seam hitch', () => {
    const offsets = Array.from(
      { length: RUN_FRAME_COUNT + 1 },
      (_, index) => getRunFrame(index / RUN_FRAMES_PER_SECOND).verticalOffset,
    );
    expect(getRunFrame(0).verticalOffset).toBe(0);
    expect(getRunFrame(15 / RUN_FRAMES_PER_SECOND).verticalOffset).toBe(-7);
    expect(getRunFrame(30 / RUN_FRAMES_PER_SECOND).verticalOffset).toBe(0);
    expect(getRunFrame(45 / RUN_FRAMES_PER_SECOND).verticalOffset).toBe(-7);
    expect(offsets.at(-1)).toBe(0);
    expect(offsets.slice(1).every((offset, index) => (
      Math.abs(offset - offsets[index]) <= 1
    ))).toBe(true);
  });
});
