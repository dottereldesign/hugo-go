export const CHARACTER_FRAME_WIDTH = 384;
export const CHARACTER_FRAME_HEIGHT = 320;
export const RUN_FRAME_WIDTH = 192;
export const RUN_FRAME_HEIGHT = 168;
export const RUN_FRAME_COUNT = 60;
export const RUN_FRAMES_PER_SECOND = 30;
export const RUN_ATLAS_COLUMNS = 10;
export const FLIGHT_FRAME_COUNT = 6;
export const FLIGHT_FRAMES_PER_SECOND = 12;
export const FREEFALL_FRAMES_PER_SECOND = 10;
export const FREEFALL_V2_FRAME_COUNT = 30;
export const FREEFALL_V2_FRAMES_PER_SECOND = 30;
export const FREEFALL_V2_FRAME_WIDTH = 320;
export const FREEFALL_V2_FRAME_HEIGHT = 256;
export const FREEFALL_V2_ATLAS_COLUMNS = 6;
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
export const JET_FLAME_FRAME_COUNT = 30;
export const JET_FLAME_FRAMES_PER_SECOND = 30;
export const JET_FLAME_FRAME_WIDTH = 96;
export const JET_FLAME_FRAME_HEIGHT = 160;
export const JET_FLAME_ATLAS_COLUMNS = 10;
export const GRIND_FRAME_COUNT = 30;
export const GRIND_FRAMES_PER_SECOND = 30;
export const GRIND_FRAME_WIDTH = 224;
export const GRIND_FRAME_HEIGHT = 196;
export const GRIND_ATLAS_COLUMNS = 5;
export type FlightPoseKind = 'powered' | 'glide';

const TAKEOFF_FRAME_INDICES = [2, 3] as const;
const DOUBLE_JUMP_FRAME_LAYOUTS = [
  { scale: 0.91, verticalOffset: 0.025 },
  { scale: 0.86, verticalOffset: 0.063 },
  { scale: 0.93, verticalOffset: -0.032 },
  { scale: 0.80, verticalOffset: 0.113 },
  { scale: 0.83, verticalOffset: 0.097 },
  { scale: 0.86, verticalOffset: 0.072 },
] as const;

const jetAnchor = (sourceX: number, sourceY: number, angle: number) => ({
  x: sourceX / CHARACTER_FRAME_WIDTH,
  y: sourceY / CHARACTER_FRAME_HEIGHT,
  angle,
});

const JET_FLAME_ANCHORS = {
  powered: [
    [jetAnchor(95, 286, 0.68), jetAnchor(139, 286, 0.57)],
    [jetAnchor(96, 286, 0.70), jetAnchor(140, 282, 0.58)],
    [jetAnchor(97, 284, 0.69), jetAnchor(141, 281, 0.57)],
    [jetAnchor(98, 291, 0.72), jetAnchor(143, 285, 0.60)],
    [jetAnchor(98, 289, 0.70), jetAnchor(143, 280, 0.58)],
    [jetAnchor(98, 286, 0.72), jetAnchor(141, 281, 0.60)],
  ],
  glide: [
    [jetAnchor(95, 285, 0.66), jetAnchor(141, 282, 0.56)],
    [jetAnchor(96, 284, 0.68), jetAnchor(142, 282, 0.56)],
    [jetAnchor(97, 284, 0.67), jetAnchor(142, 283, 0.55)],
    [jetAnchor(96, 284, 0.70), jetAnchor(142, 282, 0.58)],
    [jetAnchor(96, 284, 0.69), jetAnchor(142, 282, 0.57)],
    [jetAnchor(96, 284, 0.70), jetAnchor(142, 282, 0.58)],
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

export interface DoubleJumpFrameLayout {
  scale: number;
  verticalOffset: number;
}

export function getRunFrame(elapsedSeconds: number): RunFrame {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const index = Math.floor(safeElapsed * RUN_FRAMES_PER_SECOND) % RUN_FRAME_COUNT;
  const stridePhase = index / (RUN_FRAME_COUNT / 2);
  const strideLift = Math.round(7 * Math.sin(stridePhase * Math.PI) ** 2);
  return {
    index,
    sourceX: (index % RUN_ATLAS_COLUMNS) * RUN_FRAME_WIDTH,
    sourceY: Math.floor(index / RUN_ATLAS_COLUMNS) * RUN_FRAME_HEIGHT,
    verticalOffset: strideLift === 0 ? 0 : -strideLift,
  };
}

export function getFlightLoopFrame(elapsedSeconds: number): AtlasFrame {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const index = Math.floor(safeElapsed * FLIGHT_FRAMES_PER_SECOND) % FLIGHT_FRAME_COUNT;
  return getFlightAtlasFrame(index);
}

export function getFreefallLoopFrame(elapsedSeconds: number): AtlasFrame {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const index = Math.floor(safeElapsed * FREEFALL_FRAMES_PER_SECOND) % FLIGHT_FRAME_COUNT;
  return getFlightAtlasFrame(index);
}

export function getFreefallV2LoopFrame(elapsedSeconds: number): AtlasFrame {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const index = Math.floor(safeElapsed * FREEFALL_V2_FRAMES_PER_SECOND) % FREEFALL_V2_FRAME_COUNT;
  return {
    index,
    sourceX: index % FREEFALL_V2_ATLAS_COLUMNS * FREEFALL_V2_FRAME_WIDTH,
    sourceY: Math.floor(index / FREEFALL_V2_ATLAS_COLUMNS) * FREEFALL_V2_FRAME_HEIGHT,
  };
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

export function getDoubleJumpFrameLayout(frameIndex: number): DoubleJumpFrameLayout {
  const safeIndex = Math.max(0, Math.min(
    DOUBLE_JUMP_FRAME_COUNT - 1,
    Math.floor(Number.isFinite(frameIndex) ? frameIndex : 0),
  ));
  return DOUBLE_JUMP_FRAME_LAYOUTS[safeIndex];
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

export function getJetFlameFrame(
  elapsedSeconds: number,
  frameOffset = 0,
): AtlasFrame {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const safeOffset = Number.isFinite(frameOffset) ? Math.floor(frameOffset) : 0;
  const index = (
    (Math.floor(safeElapsed * JET_FLAME_FRAMES_PER_SECOND) + safeOffset)
    % JET_FLAME_FRAME_COUNT
    + JET_FLAME_FRAME_COUNT
  ) % JET_FLAME_FRAME_COUNT;
  return {
    index,
    sourceX: (index % JET_FLAME_ATLAS_COLUMNS) * JET_FLAME_FRAME_WIDTH,
    sourceY: Math.floor(index / JET_FLAME_ATLAS_COLUMNS) * JET_FLAME_FRAME_HEIGHT,
  };
}

export function getGrindFrame(elapsedSeconds: number): AtlasFrame {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const index = Math.floor(safeElapsed * GRIND_FRAMES_PER_SECOND) % GRIND_FRAME_COUNT;
  return {
    index,
    sourceX: (index % GRIND_ATLAS_COLUMNS) * GRIND_FRAME_WIDTH,
    sourceY: Math.floor(index / GRIND_ATLAS_COLUMNS) * GRIND_FRAME_HEIGHT,
  };
}

function getTimedFrame(elapsedSeconds: number, firstFrame: number, endFrame: number): number {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  return Math.min(endFrame - 1, firstFrame + Math.floor(safeElapsed * FLIGHT_FRAMES_PER_SECOND));
}

function getFlightAtlasFrame(index: number): AtlasFrame {
  return {
    index,
    sourceX: (index % 3) * CHARACTER_FRAME_WIDTH,
    sourceY: Math.floor(index / 3) * CHARACTER_FRAME_HEIGHT,
  };
}

function getTransitionAtlasFrame(index: number): AtlasFrame {
  return {
    index,
    sourceX: (index % 4) * CHARACTER_FRAME_WIDTH,
    sourceY: Math.floor(index / 4) * CHARACTER_FRAME_HEIGHT,
  };
}
