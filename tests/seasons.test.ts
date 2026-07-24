import { describe, expect, it } from 'vitest';
import { getRunFrame, RUN_FRAME_COUNT, RUN_FRAMES_PER_SECOND } from '../src/game/animation';
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
  it('uses all eight generated poses at twelve frames per second', () => {
    const indices = Array.from(
      { length: RUN_FRAME_COUNT },
      (_, index) => getRunFrame(index / RUN_FRAMES_PER_SECOND).index,
    );
    expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('loops seamlessly after one complete stride', () => {
    const loopDuration = RUN_FRAME_COUNT / RUN_FRAMES_PER_SECOND;
    expect(getRunFrame(0).index).toBe(0);
    expect(getRunFrame(loopDuration).index).toBe(0);
    expect(getRunFrame(Number.NaN).index).toBe(0);
  });

  it('raises airborne stride frames above contact frames', () => {
    expect(getRunFrame(3 / RUN_FRAMES_PER_SECOND).verticalOffset).toBeLessThan(0);
    expect(getRunFrame(7 / RUN_FRAMES_PER_SECOND).verticalOffset).toBeLessThan(0);
    expect(getRunFrame(0).verticalOffset).toBe(0);
  });
});
