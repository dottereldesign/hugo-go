export const RIG_PART_CELL_SIZE = 320;
export const RIG_PART_COLUMNS = 4;
export const RIGGED_RUN_FRAME_COUNT = 30;
export const RIGGED_RUN_FRAMES_PER_SECOND = 30;
export const RIGGED_JUMP_FRAME_COUNT = 36;
export const RIGGED_JUMP_FRAMES_PER_SECOND = 30;
export const WALK_V4_FRAME_COUNT = 36;
export const WALK_V4_FRAMES_PER_SECOND = 30;
export const WALK_V5_FRAME_COUNT = 36;
export const WALK_V5_FRAMES_PER_SECOND = 30;

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

export interface DebugRigPose {
  hip: RigPoint;
  torsoAngle: number;
  headAngle: number;
  nearFoot: RigPoint;
  farFoot: RigPoint;
  nearHandOffset: RigPoint;
  farHandOffset: RigPoint;
}

export interface TwoBoneChain {
  root: RigPoint;
  joint: RigPoint;
  end: RigPoint;
}

export interface WalkFootPose extends RigPoint {
  angle: number;
  grounded: boolean;
}

export interface WalkV4Pose {
  hip: RigPoint;
  torsoAngle: number;
  headAngle: number;
  pelvisAngle: number;
  nearFoot: WalkFootPose;
  farFoot: WalkFootPose;
  nearHandOffset: RigPoint;
  farHandOffset: RigPoint;
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

export function getDebugRunPose(frameIndex: number): DebugRigPose {
  const progress = normalizedFrame(frameIndex, RIGGED_RUN_FRAME_COUNT);
  const phase = progress * Math.PI * 2;
  const nearFoot = runFootTarget(progress);
  const farFoot = runFootTarget((progress + 0.5) % 1);
  const bounce = Math.sin(phase * 2) ** 2;
  return {
    hip: { x: 0, y: -82 - bounce * 3 },
    torsoAngle: -0.24 + Math.sin(phase * 2) * 0.025,
    headAngle: 0.08 - Math.sin(phase * 2) * 0.03,
    nearFoot,
    farFoot,
    nearHandOffset: {
      x: -55 + Math.sin(phase - 0.45) * 3,
      y: 24 + Math.cos(phase) * 2,
    },
    farHandOffset: {
      x: -50 + Math.sin(phase + Math.PI - 0.45) * 2.5,
      y: 28 + Math.cos(phase + Math.PI) * 2,
    },
  };
}

export function getDebugJumpPose(frameIndex: number): DebugRigPose {
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
  const hip = {
    x: airborne * 8,
    y: -82 + anticipation * 20 + landing * 17 - airborne * 68,
  };
  const nearGroundFoot = { x: 13, y: -8 };
  const farGroundFoot = { x: -13, y: -8 };
  const nearAirFoot = {
    x: hip.x + 24 - tuck * 11,
    y: hip.y + 72 - tuck * 27,
  };
  const farAirFoot = {
    x: hip.x - 18 + tuck * 9,
    y: hip.y + 74 - tuck * 25,
  };
  const airborneBlend = smoothstep(0.15, 0.24, progress)
    * (1 - smoothstep(0.69, 0.8, progress));
  const armLift = smoothstep(0.1, 0.3, progress)
    * (1 - smoothstep(0.58, 0.84, progress));

  return {
    hip,
    torsoAngle: -0.08 - anticipation * 0.18 - airborne * 0.12 + landing * 0.1,
    headAngle: 0.03 + anticipation * 0.06 - airborne * 0.035,
    nearFoot: mixPoint(nearGroundFoot, nearAirFoot, airborneBlend),
    farFoot: mixPoint(farGroundFoot, farAirFoot, airborneBlend),
    nearHandOffset: {
      x: mix(-14, 52, armLift),
      y: mix(50, -27, armLift),
    },
    farHandOffset: {
      x: mix(-19, 45, armLift),
      y: mix(53, -22, armLift),
    },
  };
}

export function getWalkV4Pose(frameIndex: number): WalkV4Pose {
  const progress = normalizedFrame(frameIndex, WALK_V4_FRAME_COUNT);
  const phase = progress * Math.PI * 2;
  const verticalRise = (1 - Math.cos(phase * 2)) * 2;
  const armSwing = Math.cos(phase);

  return {
    hip: {
      x: Math.sin(phase) * 1.5,
      y: -89 - verticalRise,
    },
    torsoAngle: -0.045 + Math.sin(phase * 2) * 0.012,
    headAngle: 0.018 - Math.sin(phase * 2) * 0.01,
    pelvisAngle: Math.sin(phase) * 0.045,
    nearFoot: walkFootTarget(progress),
    farFoot: walkFootTarget((progress + 0.5) % 1),
    nearHandOffset: {
      x: -armSwing * 14,
      y: 55 - Math.abs(armSwing) * 1.5,
    },
    farHandOffset: {
      x: armSwing * 13,
      y: 56 - Math.abs(armSwing) * 1.25,
    },
  };
}

export function getWalkV5Pose(frameIndex: number): WalkV4Pose {
  const progress = normalizedFrame(frameIndex, WALK_V5_FRAME_COUNT);
  const phase = progress * Math.PI * 2;
  const verticalRise = (1 - Math.cos(phase * 2)) * 1.75;
  const armSwing = Math.cos(phase);

  return {
    hip: {
      x: Math.sin(phase) * 1.25,
      y: -91 - verticalRise,
    },
    torsoAngle: -0.035 + Math.sin(phase * 2) * 0.01,
    headAngle: 0.014 - Math.sin(phase * 2) * 0.009,
    pelvisAngle: Math.sin(phase) * 0.04,
    nearFoot: walkFootTarget(progress),
    farFoot: walkFootTarget((progress + 0.5) % 1),
    nearHandOffset: {
      x: -armSwing * 14,
      y: 62 - Math.abs(armSwing) * 1.5,
    },
    farHandOffset: {
      x: armSwing * 13,
      y: 63 - Math.abs(armSwing) * 1.25,
    },
  };
}

export function solveTwoBoneChain(
  root: RigPoint,
  target: RigPoint,
  firstLength: number,
  secondLength: number,
  bendDirection: 1 | -1,
): TwoBoneChain {
  const deltaX = target.x - root.x;
  const deltaY = target.y - root.y;
  const rawDistance = Math.hypot(deltaX, deltaY);
  const minimum = Math.abs(firstLength - secondLength) + 0.001;
  const maximum = firstLength + secondLength - 0.001;
  const distance = Math.max(minimum, Math.min(maximum, rawDistance || minimum));
  const directionX = rawDistance > 0 ? deltaX / rawDistance : 0;
  const directionY = rawDistance > 0 ? deltaY / rawDistance : 1;
  const along = (
    firstLength ** 2 - secondLength ** 2 + distance ** 2
  ) / (2 * distance);
  const perpendicular = Math.sqrt(Math.max(0, firstLength ** 2 - along ** 2));
  const joint = {
    x: root.x + directionX * along - directionY * perpendicular * bendDirection,
    y: root.y + directionY * along + directionX * perpendicular * bendDirection,
  };
  const constrainedEnd = rawDistance > maximum || rawDistance < minimum
    ? {
        x: root.x + directionX * distance,
        y: root.y + directionY * distance,
      }
    : target;
  return { root, joint, end: constrainedEnd };
}

function normalizedFrame(frameIndex: number, frameCount: number): number {
  const safeIndex = Number.isFinite(frameIndex) ? Math.floor(frameIndex) : 0;
  return ((safeIndex % frameCount) + frameCount) % frameCount / frameCount;
}

function pulse(value: number, start: number, end: number): number {
  if (value <= start || value >= end) return 0;
  return Math.sin((value - start) / (end - start) * Math.PI);
}

function runFootTarget(progress: number): RigPoint {
  if (progress < 0.5) {
    const contact = progress / 0.5;
    return { x: mix(32, -32, contact), y: -8 };
  }
  const swing = (progress - 0.5) / 0.5;
  return {
    x: mix(-32, 32, smoothstep(0, 1, swing)),
    y: -8 - Math.sin(swing * Math.PI) * 23,
  };
}

function walkFootTarget(progress: number): WalkFootPose {
  const stanceDuration = 0.62;
  if (progress < stanceDuration) {
    const stance = progress / stanceDuration;
    let angle = 0;
    if (stance < 0.16) {
      angle = mix(-0.18, 0, smoothstep(0, 0.16, stance));
    } else if (stance > 0.78) {
      angle = mix(0, 0.28, smoothstep(0.78, 1, stance));
    }
    return {
      x: mix(27, -27, smoothstep(0, 1, stance)),
      y: -8,
      angle,
      grounded: true,
    };
  }

  const swing = (progress - stanceDuration) / (1 - stanceDuration);
  return {
    x: mix(-27, 27, smoothstep(0, 1, swing)),
    y: -8 - Math.sin(swing * Math.PI) * 18,
    angle: mix(0.2, -0.12, smoothstep(0, 1, swing)),
    grounded: false,
  };
}

function mixPoint(from: RigPoint, to: RigPoint, amount: number): RigPoint {
  return {
    x: mix(from.x, to.x, amount),
    y: mix(from.y, to.y, amount),
  };
}

function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function smoothstep(start: number, end: number, value: number): number {
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
