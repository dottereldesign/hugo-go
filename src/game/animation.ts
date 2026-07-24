export const RUN_FRAME_WIDTH = 384;
export const RUN_FRAME_HEIGHT = 320;
export const RUN_FRAME_COUNT = 8;
export const RUN_FRAMES_PER_SECOND = 12;

const RUN_FRAME_Y_OFFSETS = [0, 2, -1, -7, 0, 2, -1, -7] as const;

export interface RunFrame {
  index: number;
  sourceX: number;
  sourceY: number;
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
