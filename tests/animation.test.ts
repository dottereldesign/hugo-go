import { describe, expect, it } from 'vitest';
import {
  FLIGHT_FRAME_COUNT,
  LANDING_FRAME_START,
  TRANSITION_DURATION,
  getFlightLoopFrame,
  getLandingFrame,
  getTakeoffFrame,
} from '../src/game/animation';

describe('Hugo character animation timing', () => {
  it('loops all six powered or glide frames without leaving the atlas', () => {
    const frames = Array.from({ length: FLIGHT_FRAME_COUNT }, (_, index) => (
      getFlightLoopFrame(index / 12)
    ));
    expect(frames.map((frame) => frame.index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(getFlightLoopFrame(TRANSITION_DURATION * 2).index).toBe(0);
    for (const frame of frames) {
      expect(frame.sourceX).toBeGreaterThanOrEqual(0);
      expect(frame.sourceY).toBeGreaterThanOrEqual(0);
    }
  });

  it('uses the first three transition poses for takeoff', () => {
    expect(getTakeoffFrame(0).index).toBe(0);
    expect(getTakeoffFrame(1 / 12).index).toBe(1);
    expect(getTakeoffFrame(2 / 12).index).toBe(2);
    expect(getTakeoffFrame(10).index).toBe(2);
  });

  it('uses the final three transition poses for landing', () => {
    expect(getLandingFrame(0).index).toBe(LANDING_FRAME_START);
    expect(getLandingFrame(1 / 12).index).toBe(4);
    expect(getLandingFrame(2 / 12).index).toBe(5);
    expect(getLandingFrame(10).index).toBe(5);
  });
});
