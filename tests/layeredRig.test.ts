import { describe, expect, it } from 'vitest';
import {
  RIGGED_JUMP_FRAME_COUNT,
  RIGGED_RUN_FRAME_COUNT,
  getRiggedJumpPose,
  getRiggedRunPose,
  rigEndpoint,
} from '../src/game/layeredRig';

describe('deterministic layered Hugo rig', () => {
  it('returns to the identical run pose after one 30-frame cycle', () => {
    expect(getRiggedRunPose(RIGGED_RUN_FRAME_COUNT)).toEqual(getRiggedRunPose(0));
  });

  it('drives both run legs through opposite complete arcs', () => {
    const passing = getRiggedRunPose(7);
    expect(passing.nearThighAngle).toBeGreaterThan(0.7);
    expect(passing.farThighAngle).toBeLessThan(-0.7);

    const oppositePassing = getRiggedRunPose(22);
    expect(oppositePassing.nearThighAngle).toBeLessThan(-0.7);
    expect(oppositePassing.farThighAngle).toBeGreaterThan(0.7);
  });

  it('authors anticipation, airborne apex, landing compression, and a clean jump cycle', () => {
    const rest = getRiggedJumpPose(0);
    const anticipation = getRiggedJumpPose(3);
    const apex = getRiggedJumpPose(18);
    const landing = getRiggedJumpPose(30);

    expect(anticipation.hipY).toBeGreaterThan(rest.hipY + 10);
    expect(apex.hipY).toBeLessThan(rest.hipY - 100);
    expect(landing.hipY).toBeGreaterThan(rest.hipY);
    expect(getRiggedJumpPose(RIGGED_JUMP_FRAME_COUNT)).toEqual(rest);
  });

  it('connects child pieces at deterministic joint endpoints', () => {
    const endpoint = rigEndpoint({ x: 100, y: 50 }, Math.PI / 2, 40);
    expect(endpoint.x).toBeCloseTo(60, 8);
    expect(endpoint.y).toBeCloseTo(50, 8);
  });
});
