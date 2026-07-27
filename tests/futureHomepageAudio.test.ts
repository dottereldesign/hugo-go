import { describe, expect, it, vi } from 'vitest';
import { FutureHomepageAudio } from '../src/game/FutureHomepageAudio';

describe('Future Homepage music', () => {
  it('starts Sleepy automatically and resets it when the page closes', async () => {
    const audio = {
      currentTime: 18,
      pause: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      volume: 1,
    };
    const root = {
      querySelector: vi.fn().mockReturnValue(audio),
    } as unknown as HTMLElement;
    const music = new FutureHomepageAudio(root);

    music.start();
    await Promise.resolve();

    expect(audio.volume).toBe(0.55);
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledOnce();

    audio.currentTime = 7;
    music.stop();

    expect(audio.pause).toHaveBeenCalledOnce();
    expect(audio.currentTime).toBe(0);
  });
});
