import type { AudioChannels } from './audio';
import { isUiSoundPack } from './audio';
import { isWorldId, type WorldId } from './worlds';

export const PLAYER_STATE_KEY = 'hugo-go-player-v1';

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
    return {
      ...defaults,
      ...value,
      name: 'Hugo',
      selectedWorld: isWorldId(value.selectedWorld) ? value.selectedWorld : defaults.selectedWorld,
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
