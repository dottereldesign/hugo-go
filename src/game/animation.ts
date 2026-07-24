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
export type FlightPoseKind = 'powered' | 'glide';

const RUN_FRAME_Y_OFFSETS = [0, 2, -1, -7, 0, 2, -1, -7] as const;
const TAKEOFF_FRAME_INDICES = [2, 3] as const;
const JET_FLAME_ANCHORS = {
  powered: [
    [{ x: 0.23, y: 0.88, angle: 0.23 }, { x: 0.37, y: 0.88, angle: 0.2 }],
    [{ x: 0.24, y: 0.88, angle: 0.22 }, { x: 0.37, y: 0.89, angle: 0.2 }],
    [{ x: 0.24, y: 0.87, angle: 0.23 }, { x: 0.38, y: 0.88, angle: 0.19 }],
    [{ x: 0.24, y: 0.82, angle: 0.24 }, { x: 0.38, y: 0.83, angle: 0.2 }],
    [{ x: 0.25, y: 0.83, angle: 0.23 }, { x: 0.39, y: 0.82, angle: 0.19 }],
    [{ x: 0.25, y: 0.81, angle: 0.24 }, { x: 0.39, y: 0.77, angle: 0.18 }],
  ],
  glide: [
    [{ x: 0.23, y: 0.9, angle: 0.23 }, { x: 0.37, y: 0.9, angle: 0.2 }],
    [{ x: 0.24, y: 0.89, angle: 0.22 }, { x: 0.38, y: 0.89, angle: 0.2 }],
    [{ x: 0.24, y: 0.89, angle: 0.23 }, { x: 0.38, y: 0.9, angle: 0.19 }],
    [{ x: 0.23, y: 0.85, angle: 0.24 }, { x: 0.37, y: 0.84, angle: 0.2 }],
    [{ x: 0.24, y: 0.84, angle: 0.23 }, { x: 0.38, y: 0.84, angle: 0.19 }],
    [{ x: 0.24, y: 0.85, angle: 0.24 }, { x: 0.38, y: 0.84, angle: 0.18 }],
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
