import type { AudioChannels } from './audio';
import { isUiSoundPack } from './audio';
import { isWorldId, type WorldId } from './worlds';

export const PLAYER_STATE_KEY = 'hugo-go-player-v1';

export interface RunRecord {
  distance: number;
  coins: number;
  playedAt: string;
}

export interface PlayerState {
  name: string;
  level: number;
  xp: number;
  energy: number;
  coins: number;
  gems: number;
  flightPower: number;
  streak: number;
  bestDistance: number;
  totalRuns: number;
  topRuns: RunRecord[];
  selectedWorld: WorldId;
  settings: AudioChannels & {
    reducedMotion: boolean;
  };
}

export function createDefaultPlayerState(): PlayerState {
  return {
    name: 'Hugo',
    level: 1,
    xp: 0,
    energy: 100,
    coins: 0,
    gems: 0,
    flightPower: 0,
    streak: 0,
    bestDistance: 0,
    totalRuns: 0,
    topRuns: [],
    selectedWorld: 'forest',
    settings: {
      musicEnabled: true,
      effectsEnabled: true,
      soundPack: 'magic-chimes',
      reducedMotion: false,
    },
  };
}

export function loadPlayerState(storage: Pick<Storage, 'getItem'> = localStorage): PlayerState {
  const defaults = createDefaultPlayerState();
  try {
    const stored = storage.getItem(PLAYER_STATE_KEY);
    if (!stored) return defaults;
    const value = JSON.parse(stored) as Partial<PlayerState>;
    const settings = value.settings as Partial<PlayerState['settings']> | undefined;
    const topRuns = Array.isArray(value.topRuns)
      ? value.topRuns
        .filter(isRunRecord)
        .map((run) => ({
          distance: nonNegativeInteger(run.distance),
          coins: nonNegativeInteger(run.coins),
          playedAt: run.playedAt,
        }))
        .sort(compareRuns)
        .slice(0, 5)
      : defaults.topRuns;
    return {
      ...defaults,
      ...value,
      name: 'Hugo',
      level: Math.max(1, nonNegativeInteger(value.level ?? defaults.level)),
      xp: nonNegativeInteger(value.xp ?? defaults.xp),
      coins: nonNegativeInteger(value.coins ?? defaults.coins),
      gems: nonNegativeInteger(value.gems ?? defaults.gems),
      flightPower: nonNegativeInteger(value.flightPower ?? defaults.flightPower),
      bestDistance: nonNegativeInteger(value.bestDistance ?? defaults.bestDistance),
      totalRuns: nonNegativeInteger(value.totalRuns ?? defaults.totalRuns),
      topRuns,
      selectedWorld: isWorldId(value.selectedWorld) && value.selectedWorld === 'forest'
        ? value.selectedWorld
        : defaults.selectedWorld,
      settings: {
        ...defaults.settings,
        ...settings,
        soundPack: isUiSoundPack(settings?.soundPack) ? settings.soundPack : defaults.settings.soundPack,
      },
    };
  } catch {
    return defaults;
  }
}

export function savePlayerState(state: PlayerState, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(PLAYER_STATE_KEY, JSON.stringify(state));
}

export function recordRun(
  state: PlayerState,
  result: Pick<RunRecord, 'distance' | 'coins'>,
  playedAt = new Date().toISOString(),
): PlayerState {
  const distance = nonNegativeInteger(result.distance);
  const coins = nonNegativeInteger(result.coins);
  const earnedXp = distance + coins * 20;
  const run: RunRecord = { distance, coins, playedAt };
  return {
    ...state,
    level: Math.floor((state.xp + earnedXp) / 1_000) + 1,
    xp: state.xp + earnedXp,
    coins: state.coins + coins,
    flightPower: state.flightPower + Math.floor(distance / 10) + coins * 3,
    bestDistance: Math.max(state.bestDistance, distance),
    totalRuns: state.totalRuns + 1,
    topRuns: [...state.topRuns, run].sort(compareRuns).slice(0, 5),
    selectedWorld: 'forest',
  };
}

function isRunRecord(value: unknown): value is RunRecord {
  if (!value || typeof value !== 'object') return false;
  const run = value as Partial<RunRecord>;
  return Number.isFinite(run.distance) && Number.isFinite(run.coins) && typeof run.playedAt === 'string';
}

function nonNegativeInteger(value: number): number {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function compareRuns(first: RunRecord, second: RunRecord): number {
  return second.distance - first.distance || second.coins - first.coins;
}
