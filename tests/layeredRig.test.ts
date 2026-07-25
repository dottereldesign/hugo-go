import { describe, expect, it } from 'vitest';
import {
  RIGGED_JUMP_FRAME_COUNT,
  RIGGED_RUN_FRAME_COUNT,
  HEAD_TURN_FRAME_COUNT,
  WALK_V4_FRAME_COUNT,
  WALK_V5_FRAME_COUNT,
  WALK_V6_FRAME_COUNT,
  WALK_V6_LEFT_ARM_BEND,
  WALK_V6_RIGHT_ARM_BEND,
  getDebugJumpPose,
  getDebugRunPose,
  getHeadTurnPose,
  getRiggedJumpPose,
  getRiggedRunPose,
  getWalkV4Pose,
  getWalkV5Pose,
  getWalkV6Pose,
  rigEndpoint,
  solveTwoBoneChain,
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

  it('plants one debug-run foot while the other follows a raised swing arc', () => {
    const nearContact = getDebugRunPose(7);
    expect(nearContact.nearFoot.y).toBe(-8);
    expect(nearContact.farFoot.y).toBeLessThan(-25);

    const farContact = getDebugRunPose(22);
    expect(farContact.farFoot.y).toBe(-8);
    expect(farContact.nearFoot.y).toBeLessThan(-25);
    expect(getDebugRunPose(RIGGED_RUN_FRAME_COUNT)).toEqual(getDebugRunPose(0));
  });

  it('keeps the debug-jump feet grounded before takeoff and after landing', () => {
    const rest = getDebugJumpPose(0);
    const apex = getDebugJumpPose(18);
    const landing = getDebugJumpPose(30);

    expect(rest.nearFoot.y).toBe(-8);
    expect(rest.farFoot.y).toBe(-8);
    expect(apex.hip.y).toBeLessThan(-145);
    expect(apex.nearFoot.y).toBeLessThan(-80);
    expect(landing.nearFoot.y).toBe(-8);
    expect(landing.farFoot.y).toBe(-8);
    expect(getDebugJumpPose(RIGGED_JUMP_FRAME_COUNT)).toEqual(rest);
  });

  it('solves connected two-bone limbs without changing either segment length', () => {
    const chain = solveTwoBoneChain(
      { x: 4, y: 7 },
      { x: 42, y: 58 },
      44,
      44,
      -1,
    );
    const upperLength = Math.hypot(
      chain.joint.x - chain.root.x,
      chain.joint.y - chain.root.y,
    );
    const lowerLength = Math.hypot(
      chain.end.x - chain.joint.x,
      chain.end.y - chain.joint.y,
    );

    expect(chain.end).toEqual({ x: 42, y: 58 });
    expect(upperLength).toBeCloseTo(44, 8);
    expect(lowerLength).toBeCloseTo(44, 8);
  });

  it('returns Walking V4 to the identical pose after its 36-frame cycle', () => {
    expect(getWalkV4Pose(WALK_V4_FRAME_COUNT)).toEqual(getWalkV4Pose(0));
  });

  it('returns Walking V5 to the identical pose after its 36-frame cycle', () => {
    expect(getWalkV5Pose(WALK_V5_FRAME_COUNT)).toEqual(getWalkV5Pose(0));
  });

  it('gives Walking V5 complete relaxed arm reach without changing its upright gait', () => {
    const forward = getWalkV5Pose(0);
    const reverse = getWalkV5Pose(WALK_V5_FRAME_COUNT / 2);

    expect(forward.nearHandOffset.y).toBeGreaterThan(60);
    expect(forward.farHandOffset.y).toBeGreaterThan(60);
    expect(forward.nearHandOffset.x).toBeLessThan(0);
    expect(forward.farHandOffset.x).toBeGreaterThan(0);
    expect(reverse.nearHandOffset.x).toBeGreaterThan(0);
    expect(reverse.farHandOffset.x).toBeLessThan(0);
    expect(Math.abs(forward.torsoAngle)).toBeLessThan(0.06);
  });

  it('returns Walking V6 to the identical pose after its 36-frame cycle', () => {
    expect(getWalkV6Pose(WALK_V6_FRAME_COUNT)).toEqual(getWalkV6Pose(0));
  });

  it('keeps left and right V6 elbows on fixed bend branches for the whole loop', () => {
    const root = { x: 0, y: 0 };
    let previousLeftElbow: { x: number; y: number } | null = null;
    let previousRightElbow: { x: number; y: number } | null = null;

    for (let frame = 0; frame <= WALK_V6_FRAME_COUNT; frame += 1) {
      const pose = getWalkV6Pose(frame);
      const left = solveTwoBoneChain(root, pose.leftWristOffset, 34, 30, WALK_V6_LEFT_ARM_BEND);
      const right = solveTwoBoneChain(root, pose.rightWristOffset, 34, 30, WALK_V6_RIGHT_ARM_BEND);
      const leftSide = pose.leftWristOffset.x * left.joint.y - pose.leftWristOffset.y * left.joint.x;
      const rightSide = pose.rightWristOffset.x * right.joint.y - pose.rightWristOffset.y * right.joint.x;

      expect(leftSide).toBeLessThan(0);
      expect(rightSide).toBeGreaterThan(0);
      if (previousLeftElbow && previousRightElbow) {
        expect(Math.hypot(left.joint.x - previousLeftElbow.x, left.joint.y - previousLeftElbow.y)).toBeLessThan(5);
        expect(Math.hypot(right.joint.x - previousRightElbow.x, right.joint.y - previousRightElbow.y)).toBeLessThan(5);
      }
      previousLeftElbow = left.joint;
      previousRightElbow = right.joint;
    }
  });

  it('gives Walking V6 independent hands after its wrist joints', () => {
    const pose = getWalkV6Pose(9);

    expect(pose.leftWristOffset.y).toBeGreaterThan(55);
    expect(pose.rightWristOffset.y).toBeGreaterThan(55);
    expect(pose.leftHandAngle).not.toBe(pose.rightHandAngle);
    expect(pose.leftFoot.grounded).not.toBe(pose.rightFoot.grounded);
  });

  it('rotates the head through 24 even views and loops to its opening profile', () => {
    const rightProfile = getHeadTurnPose(0);
    const front = getHeadTurnPose(6);
    const leftProfile = getHeadTurnPose(12);
    const back = getHeadTurnPose(18);
    const lastUniqueView = getHeadTurnPose(23);

    expect(rightProfile.yaw).toBeCloseTo(-Math.PI / 2, 8);
    expect(front.yaw).toBeCloseTo(0, 8);
    expect(leftProfile.yaw).toBeCloseTo(Math.PI / 2, 8);
    expect(back.yaw).toBeCloseTo(Math.PI, 8);
    expect(lastUniqueView.yaw).toBeCloseTo(17 * Math.PI / 12, 8);
    expect(getHeadTurnPose(HEAD_TURN_FRAME_COUNT)).toEqual(rightProfile);
  });

  it('alternates planted and swinging feet through a natural walking gait', () => {
    const nearStance = getWalkV4Pose(9);
    const farStance = getWalkV4Pose(27);

    expect(nearStance.nearFoot.grounded).toBe(true);
    expect(nearStance.farFoot.grounded).toBe(false);
    expect(nearStance.farFoot.y).toBeLessThan(-18);
    expect(farStance.nearFoot.grounded).toBe(false);
    expect(farStance.farFoot.grounded).toBe(true);
    expect(farStance.nearFoot.y).toBeLessThan(-18);
  });

  it('uses heel strike, toe-off, upright posture, and opposing relaxed arms', () => {
    const heelStrike = getWalkV4Pose(0);
    const toeOff = getWalkV4Pose(20);

    expect(heelStrike.nearFoot.angle).toBeLessThan(0);
    expect(toeOff.nearFoot.angle).toBeGreaterThan(0.1);
    expect(Math.abs(heelStrike.torsoAngle)).toBeLessThan(0.08);
    expect(Math.abs(heelStrike.headAngle)).toBeLessThan(0.04);
    expect(heelStrike.nearHandOffset.x).toBeLessThan(0);
    expect(heelStrike.farHandOffset.x).toBeGreaterThan(0);
    expect(heelStrike.nearHandOffset.y).toBeGreaterThan(50);
  });
});
