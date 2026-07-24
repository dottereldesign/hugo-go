import { describe, expect, it } from 'vitest';
import {
  createDefaultPlayerState,
  loadPlayerState,
  PLAYER_STATE_KEY,
  recordRun,
  savePlayerState,
} from '../src/state';

function memoryStorage(initial?: string): Storage {
  const values = new Map<string, string>();
  if (initial) values.set(PLAYER_STATE_KEY, initial);
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe('HUGO GO! player state', () => {
  it('creates Hugo in Forest World by default', () => {
    const state = createDefaultPlayerState();
    expect(state.name).toBe('Hugo');
    expect(state.selectedWorld).toBe('forest');
    expect(state.bestDistance).toBe(0);
  });

  it('keeps Forest as the only currently playable world', () => {
    const storage = memoryStorage();
    const state = createDefaultPlayerState();
    state.selectedWorld = 'space';
    savePlayerState(state, storage);
    expect(loadPlayerState(storage).selectedWorld).toBe('forest');
  });

  it('repairs invalid stored identity and world values', () => {
    const storage = memoryStorage(JSON.stringify({ name: 'Someone else', selectedWorld: 'unknown' }));
    const state = loadPlayerState(storage);
    expect(state.name).toBe('Hugo');
    expect(state.selectedWorld).toBe('forest');
  });

  it('records rewards and keeps the five best local runs', () => {
    let state = createDefaultPlayerState();
    for (let distance = 10; distance <= 70; distance += 10) {
      state = recordRun(state, { distance, coins: distance / 10 }, `2026-07-24T00:00:0${distance / 10}.000Z`);
    }
    expect(state.totalRuns).toBe(7);
    expect(state.bestDistance).toBe(70);
    expect(state.topRuns.map((run) => run.distance)).toEqual([70, 60, 50, 40, 30]);
    expect(state.coins).toBe(28);
    expect(state.xp).toBeGreaterThan(0);
  });

  it('sanitises invalid numeric progress from storage', () => {
    const storage = memoryStorage(JSON.stringify({
      coins: -50,
      bestDistance: Number.POSITIVE_INFINITY,
      totalRuns: -2,
      topRuns: [{ distance: -8, coins: 2, playedAt: 'today' }, { nope: true }],
    }));
    const state = loadPlayerState(storage);
    expect(state.coins).toBe(0);
    expect(state.bestDistance).toBe(0);
    expect(state.totalRuns).toBe(0);
    expect(state.topRuns).toEqual([{ distance: 0, coins: 2, playedAt: 'today' }]);
  });
});
