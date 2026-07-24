export const RUN_FRAME_WIDTH = 384;
export const RUN_FRAME_HEIGHT = 320;
export const RUN_FRAME_COUNT = 8;
export const RUN_FRAMES_PER_SECOND = 12;
export const FLIGHT_FRAME_COUNT = 6;
export const FLIGHT_FRAMES_PER_SECOND = 12;
export const TRANSITION_FRAME_COUNT = 8;
export const TAKEOFF_FRAME_COUNT = 2;
export const LANDING_FRAME_START = 4;
export const TRANSITION_DURATION = TAKEOFF_FRAME_COUNT / FLIGHT_FRAMES_PER_SECOND;
export const DOUBLE_JUMP_FRAME_COUNT = 6;
export const DOUBLE_JUMP_FRAMES_PER_SECOND = 14;
export const DOUBLE_JUMP_DURATION = DOUBLE_JUMP_FRAME_COUNT / DOUBLE_JUMP_FRAMES_PER_SECOND;
export const WALL_RECOVERY_FRAME_COUNT = 6;
export const WALL_RECOVERY_FRAMES_PER_SECOND = 12;
export const WALL_RECOVERY_DURATION = 3 / WALL_RECOVERY_FRAMES_PER_SECOND;
export type FlightPoseKind = 'powered' | 'glide';

const RUN_FRAME_Y_OFFSETS = [0, 2, -1, -7, 0, 2, -1, -7] as const;
const TAKEOFF_FRAME_INDICES = [2, 3] as const;
const JET_FLAME_ANCHORS = {
  powered: [
    [{ x: 0.229, y: 0.881, angle: 0.58 }, { x: 0.369, y: 0.881, angle: 0.50 }],
    [{ x: 0.242, y: 0.882, angle: 0.62 }, { x: 0.369, y: 0.883, angle: 0.48 }],
    [{ x: 0.241, y: 0.871, angle: 0.60 }, { x: 0.379, y: 0.878, angle: 0.46 }],
    [{ x: 0.239, y: 0.829, angle: 0.68 }, { x: 0.374, y: 0.831, angle: 0.52 }],
    [{ x: 0.249, y: 0.828, angle: 0.64 }, { x: 0.380, y: 0.824, angle: 0.50 }],
    [{ x: 0.247, y: 0.815, angle: 0.70 }, { x: 0.375, y: 0.783, angle: 0.45 }],
  ],
  glide: [
    [{ x: 0.228, y: 0.894, angle: 0.58 }, { x: 0.365, y: 0.895, angle: 0.49 }],
    [{ x: 0.238, y: 0.892, angle: 0.61 }, { x: 0.370, y: 0.892, angle: 0.48 }],
    [{ x: 0.239, y: 0.890, angle: 0.59 }, { x: 0.373, y: 0.894, angle: 0.46 }],
    [{ x: 0.231, y: 0.854, angle: 0.66 }, { x: 0.360, y: 0.846, angle: 0.51 }],
    [{ x: 0.238, y: 0.845, angle: 0.63 }, { x: 0.368, y: 0.845, angle: 0.49 }],
    [{ x: 0.236, y: 0.852, angle: 0.69 }, { x: 0.366, y: 0.842, angle: 0.45 }],
  ],
} as const;

export interface AtlasFrame {
  index: number;
  sourceX: number;
  sourceY: number;
}

export interface RunFrame extends AtlasFrame {
  verticalOffset: number;
}

export interface JetFlameAnchor {
  x: number;
  y: number;
  angle: number;
}

export function getRunFrame(elapsedSeconds: number): RunFrame {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const index = Math.floor(safeElapsed * RUN_FRAMES_PER_SECOND) % RUN_FRAME_COUNT;
  return {
    index,
    sourceX: (index % 4) * RUN_FRAME_WIDTH,
    sourceY: Math.floor(index / 4) * RUN_FRAME_HEIGHT,
    verticalOffset: RUN_FRAME_Y_OFFSETS[index],
  };
}

export function getFlightLoopFrame(elapsedSeconds: number): AtlasFrame {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const index = Math.floor(safeElapsed * FLIGHT_FRAMES_PER_SECOND) % FLIGHT_FRAME_COUNT;
  return getFlightAtlasFrame(index);
}

export function getTakeoffFrame(airborneTime: number): AtlasFrame {
  const sequenceIndex = getTimedFrame(airborneTime, 0, TAKEOFF_FRAME_COUNT);
  return getTransitionAtlasFrame(TAKEOFF_FRAME_INDICES[sequenceIndex]);
}

export function getLandingFrame(groundedTime: number): AtlasFrame {
  return getTransitionAtlasFrame(getTimedFrame(groundedTime, LANDING_FRAME_START, TRANSITION_FRAME_COUNT));
}

export function getDoubleJumpFrame(doubleJumpTime: number): AtlasFrame {
  const safeElapsed = Number.isFinite(doubleJumpTime) ? Math.max(0, doubleJumpTime) : 0;
  const index = Math.min(
    DOUBLE_JUMP_FRAME_COUNT - 1,
    Math.floor(safeElapsed * DOUBLE_JUMP_FRAMES_PER_SECOND),
  );
  return getFlightAtlasFrame(index);
}

export function getWallStuckFrame(stuckTime: number): AtlasFrame {
  const safeElapsed = Number.isFinite(stuckTime) ? Math.max(0, stuckTime) : 0;
  if (safeElapsed < 1 / WALL_RECOVERY_FRAMES_PER_SECOND) return getFlightAtlasFrame(0);
  const wobbleIndex = 1 + (
    Math.floor((safeElapsed - 1 / WALL_RECOVERY_FRAMES_PER_SECOND) * 8) % 2
  );
  return getFlightAtlasFrame(wobbleIndex);
}

export function getWallRecoveryFrame(recoveryTime: number): AtlasFrame {
  const safeElapsed = Number.isFinite(recoveryTime) ? Math.max(0, recoveryTime) : 0;
  const index = Math.min(
    WALL_RECOVERY_FRAME_COUNT - 1,
    3 + Math.floor(safeElapsed * WALL_RECOVERY_FRAMES_PER_SECOND),
  );
  return getFlightAtlasFrame(index);
}

export function getJetFlameAnchors(
  pose: FlightPoseKind,
  frameIndex: number,
): readonly JetFlameAnchor[] {
  const safeIndex = Math.max(0, Math.min(FLIGHT_FRAME_COUNT - 1, Math.floor(frameIndex)));
  return JET_FLAME_ANCHORS[pose][safeIndex];
}

function getTimedFrame(elapsedSeconds: number, firstFrame: number, endFrame: number): number {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  return Math.min(endFrame - 1, firstFrame + Math.floor(safeElapsed * FLIGHT_FRAMES_PER_SECOND));
}

function getFlightAtlasFrame(index: number): AtlasFrame {
  return {
    index,
    sourceX: (index % 3) * RUN_FRAME_WIDTH,
    sourceY: Math.floor(index / 3) * RUN_FRAME_HEIGHT,
  };
}

function getTransitionAtlasFrame(index: number): AtlasFrame {
  return {
    index,
    sourceX: (index % 4) * RUN_FRAME_WIDTH,
    sourceY: Math.floor(index / 4) * RUN_FRAME_HEIGHT,
  };
}
