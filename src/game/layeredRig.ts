export const RIG_PART_CELL_SIZE = 320;
export const RIG_PART_COLUMNS = 4;
export const RIGGED_RUN_FRAME_COUNT = 30;
export const RIGGED_RUN_FRAMES_PER_SECOND = 30;
export const RIGGED_JUMP_FRAME_COUNT = 36;
export const RIGGED_JUMP_FRAMES_PER_SECOND = 30;

export const RigPart = {
  torso: 0,
  head: 1,
  hair: 2,
  hood: 3,
  nearUpperArm: 4,
  nearForearm: 5,
  farUpperArm: 6,
  farForearm: 7,
  nearThigh: 8,
  nearShin: 9,
  nearShoe: 10,
  farThigh: 11,
  farShin: 12,
  farShoe: 13,
  rearJacketTail: 14,
  frontJacketTail: 15,
} as const;

export interface LayeredRigPose {
  hipX: number;
  hipY: number;
  torsoAngle: number;
  headAngle: number;
  hoodAngle: number;
  hairAngle: number;
  rearTailAngle: number;
  frontTailAngle: number;
  nearUpperArmAngle: number;
  nearForearmAngle: number;
  farUpperArmAngle: number;
  farForearmAngle: number;
  nearThighAngle: number;
  nearShinAngle: number;
  farThighAngle: number;
  farShinAngle: number;
  shoeAngle: number;
}

export interface RigPoint {
  x: number;
  y: number;
}

export function getRiggedRunPose(frameIndex: number): LayeredRigPose {
  const phase = normalizedFrame(frameIndex, RIGGED_RUN_FRAME_COUNT) * Math.PI * 2;
  const nearStride = Math.sin(phase);
  const farStride = Math.sin(phase + Math.PI);
  const nearLift = Math.max(0, -Math.cos(phase));
  const farLift = Math.max(0, -Math.cos(phase + Math.PI));
  const bounce = Math.sin(phase * 2) ** 2;

  return {
    hipX: 0,
    hipY: -bounce * 5,
    torsoAngle: -0.3 + Math.sin(phase * 2) * 0.025,
    headAngle: 0.12 - Math.sin(phase * 2) * 0.035,
    hoodAngle: 0.18 + Math.sin(phase - 0.55) * 0.06,
    hairAngle: 0.2 + Math.sin(phase - 0.8) * 0.075,
    rearTailAngle: 0.8 + Math.sin(phase - 0.7) * 0.13,
    frontTailAngle: 0.58 + Math.sin(phase - 0.35) * 0.1,
    nearUpperArmAngle: 1.13 + Math.sin(phase - 0.35) * 0.07,
    nearForearmAngle: 1.22 + Math.sin(phase - 0.7) * 0.08,
    farUpperArmAngle: 1.02 + Math.sin(phase + Math.PI - 0.35) * 0.055,
    farForearmAngle: 1.12 + Math.sin(phase + Math.PI - 0.7) * 0.065,
    nearThighAngle: nearStride * 0.78,
    nearShinAngle: nearStride * 0.46 + nearLift * 1.08,
    farThighAngle: farStride * 0.78,
    farShinAngle: farStride * 0.46 + farLift * 1.08,
    shoeAngle: -0.08 + Math.sin(phase) * 0.08,
  };
}

export function getRiggedJumpPose(frameIndex: number): LayeredRigPose {
  const progress = normalizedFrame(frameIndex, RIGGED_JUMP_FRAME_COUNT);
  const anticipation = pulse(progress, 0, 0.18);
  const flightProgress = clamp01((progress - 0.16) / 0.62);
  const airborne = progress >= 0.16 && progress <= 0.78
    ? Math.sin(flightProgress * Math.PI)
    : 0;
  const tuck = progress >= 0.28 && progress <= 0.68
    ? Math.sin(clamp01((progress - 0.28) / 0.4) * Math.PI)
    : 0;
  const landing = pulse(progress, 0.76, 0.93);
  const settle = progress > 0.86
    ? Math.sin(clamp01((progress - 0.86) / 0.14) * Math.PI) * (1 - progress)
    : 0;
  const compression = anticipation * 18 + landing * 15;
  const armLift = smoothstep(0.1, 0.32, progress) * (1 - smoothstep(0.58, 0.84, progress));

  return {
    hipX: airborne * 10,
    hipY: compression - airborne * 112,
    torsoAngle: -0.08 - anticipation * 0.2 - airborne * 0.13 + landing * 0.12,
    headAngle: 0.04 + anticipation * 0.08 - airborne * 0.04 + settle * 0.2,
    hoodAngle: 0.08 + airborne * 0.18 + settle * 0.24,
    hairAngle: 0.08 + airborne * 0.24 + settle * 0.3,
    rearTailAngle: 0.28 + airborne * 0.65 + settle * 0.35,
    frontTailAngle: 0.18 + airborne * 0.48 + settle * 0.26,
    nearUpperArmAngle: 0.22 + anticipation * 0.72 - armLift * 2.18 + landing * 0.48,
    nearForearmAngle: 0.12 + anticipation * 0.62 - armLift * 2.02 + landing * 0.42,
    farUpperArmAngle: 0.12 + anticipation * 0.58 - armLift * 1.92 + landing * 0.38,
    farForearmAngle: 0.08 + anticipation * 0.5 - armLift * 1.8 + landing * 0.34,
    nearThighAngle: -anticipation * 0.5 - tuck * 1.02 + landing * 0.42,
    nearShinAngle: anticipation * 0.74 + tuck * 1.26 - landing * 0.58,
    farThighAngle: anticipation * 0.42 + tuck * 0.78 - landing * 0.34,
    farShinAngle: -anticipation * 0.62 - tuck * 1.1 + landing * 0.5,
    shoeAngle: -0.04 - tuck * 0.16 + landing * 0.1,
  };
}

export function rigEndpoint(origin: RigPoint, angle: number, length: number): RigPoint {
  return {
    x: origin.x - Math.sin(angle) * length,
    y: origin.y + Math.cos(angle) * length,
  };
}

function normalizedFrame(frameIndex: number, frameCount: number): number {
  const safeIndex = Number.isFinite(frameIndex) ? Math.floor(frameIndex) : 0;
  return ((safeIndex % frameCount) + frameCount) % frameCount / frameCount;
}

function pulse(value: number, start: number, end: number): number {
  if (value <= start || value >= end) return 0;
  return Math.sin((value - start) / (end - start) * Math.PI);
}

function smoothstep(start: number, end: number, value: number): number {
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
