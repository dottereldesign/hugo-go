import { describe, expect, it } from 'vitest';
import { createDefaultPlayerState, loadPlayerState, PLAYER_STATE_KEY, savePlayerState } from '../src/state';

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

  it('persists the selected flight world', () => {
    const storage = memoryStorage();
    const state = createDefaultPlayerState();
    state.selectedWorld = 'space';
    savePlayerState(state, storage);
    expect(loadPlayerState(storage).selectedWorld).toBe('space');
  });

  it('repairs invalid stored identity and world values', () => {
    const storage = memoryStorage(JSON.stringify({ name: 'Someone else', selectedWorld: 'unknown' }));
    const state = loadPlayerState(storage);
    expect(state.name).toBe('Hugo');
    expect(state.selectedWorld).toBe('forest');
  });
});
