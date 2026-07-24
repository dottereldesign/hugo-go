export const RUN_FRAME_WIDTH = 384;
export const RUN_FRAME_HEIGHT = 320;
export const RUN_FRAME_COUNT = 8;
export const RUN_FRAMES_PER_SECOND = 12;
export const FLIGHT_FRAME_COUNT = 6;
export const FLIGHT_FRAMES_PER_SECOND = 12;
export const TRANSITION_FRAME_COUNT = 6;
export const TAKEOFF_FRAME_COUNT = 3;
export const LANDING_FRAME_START = 3;
export const TRANSITION_DURATION = TAKEOFF_FRAME_COUNT / FLIGHT_FRAMES_PER_SECOND;

const RUN_FRAME_Y_OFFSETS = [0, 2, -1, -7, 0, 2, -1, -7] as const;

export interface AtlasFrame {
  index: number;
  sourceX: number;
  sourceY: number;
}

export interface RunFrame extends AtlasFrame {
  verticalOffset: number;
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
  return getFlightAtlasFrame(getTimedFrame(airborneTime, 0, TAKEOFF_FRAME_COUNT));
}

export function getLandingFrame(groundedTime: number): AtlasFrame {
  return getFlightAtlasFrame(getTimedFrame(groundedTime, LANDING_FRAME_START, TRANSITION_FRAME_COUNT));
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
