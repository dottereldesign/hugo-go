export const SEASON_DURATION_SECONDS = 30;
export const SEASON_TRANSITION_SECONDS = 10;

export const SEASON_IDS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type SeasonId = typeof SEASON_IDS[number];

interface SeasonProfile {
  id: SeasonId;
  name: string;
  brightness: number;
  saturation: number;
  contrast: number;
  hue: number;
  sepia: number;
  overlay: readonly [number, number, number];
  overlayAlpha: number;
}

export interface SeasonVisual {
  current: SeasonId;
  next: SeasonId;
  currentName: string;
  nextName: string;
  transition: number;
  label: string;
  filter: string;
  overlay: string;
  particleWeights: Readonly<Record<SeasonId, number>>;
}

const PROFILES: readonly SeasonProfile[] = [
  {
    id: 'spring',
    name: 'Spring',
    brightness: 1.05,
    saturation: 1.05,
    contrast: 0.98,
    hue: 0,
    sepia: 0,
    overlay: [255, 195, 222],
    overlayAlpha: 0.035,
  },
  {
    id: 'summer',
    name: 'Summer',
    brightness: 1,
    saturation: 1.13,
    contrast: 1.03,
    hue: 5,
    sepia: 0,
    overlay: [255, 211, 103],
    overlayAlpha: 0.025,
  },
  {
    id: 'autumn',
    name: 'Autumn',
    brightness: 0.98,
    saturation: 1.18,
    contrast: 1.04,
    hue: -24,
    sepia: 0.24,
    overlay: [221, 95, 35],
    overlayAlpha: 0.085,
  },
  {
    id: 'winter',
    name: 'Winter',
    brightness: 1.1,
    saturation: 0.56,
    contrast: 0.93,
    hue: 4,
    sepia: 0.06,
    overlay: [188, 226, 255],
    overlayAlpha: 0.18,
  },
];

export function getSeasonVisual(elapsedSeconds: number): SeasonVisual {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const cycleDuration = SEASON_DURATION_SECONDS * PROFILES.length;
  const cycleTime = safeElapsed % cycleDuration;
  const profileIndex = Math.floor(cycleTime / SEASON_DURATION_SECONDS);
  const profileTime = cycleTime - profileIndex * SEASON_DURATION_SECONDS;
  const transitionStart = SEASON_DURATION_SECONDS - SEASON_TRANSITION_SECONDS;
  const rawTransition = clamp(
    (profileTime - transitionStart) / SEASON_TRANSITION_SECONDS,
    0,
    1,
  );
  const transition = smoothStep(rawTransition);
  const current = PROFILES[profileIndex];
  const next = PROFILES[(profileIndex + 1) % PROFILES.length];
  const red = Math.round(mix(current.overlay[0], next.overlay[0], transition));
  const green = Math.round(mix(current.overlay[1], next.overlay[1], transition));
  const blue = Math.round(mix(current.overlay[2], next.overlay[2], transition));
  const overlayAlpha = mix(current.overlayAlpha, next.overlayAlpha, transition);
  const weights = Object.fromEntries(SEASON_IDS.map((id) => [id, 0])) as Record<SeasonId, number>;
  weights[current.id] = 1 - transition;
  weights[next.id] += transition;

  return {
    current: current.id,
    next: next.id,
    currentName: current.name,
    nextName: next.name,
    transition,
    label: rawTransition > 0 ? `${current.name} → ${next.name}` : current.name,
    filter: [
      `brightness(${mix(current.brightness, next.brightness, transition).toFixed(3)})`,
      `saturate(${mix(current.saturation, next.saturation, transition).toFixed(3)})`,
      `contrast(${mix(current.contrast, next.contrast, transition).toFixed(3)})`,
      `hue-rotate(${mix(current.hue, next.hue, transition).toFixed(2)}deg)`,
      `sepia(${mix(current.sepia, next.sepia, transition).toFixed(3)})`,
    ].join(' '),
    overlay: `rgba(${red}, ${green}, ${blue}, ${overlayAlpha.toFixed(3)})`,
    particleWeights: weights,
  };
}

function mix(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function smoothStep(value: number): number {
  return value * value * (3 - 2 * value);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
