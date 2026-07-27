import { describe, expect, it, vi } from 'vitest';
import { FutureHomepageAudio } from '../src/game/FutureHomepageAudio';

describe('Future Homepage music', () => {
  it('starts Sleepy automatically and resets it when the page closes', async () => {
    const audio = {
      addEventListener: vi.fn(),
      autoplay: false,
      currentTime: 18,
      load: vi.fn(),
      networkState: 1,
      pause: vi.fn(),
      paused: true,
      play: vi.fn().mockResolvedValue(undefined),
      volume: 1,
    };
    const root = {
      querySelector: vi.fn().mockReturnValue(audio),
    } as unknown as HTMLElement;
    const music = new FutureHomepageAudio(root, new EventTarget());

    music.start();
    await Promise.resolve();

    expect(audio.volume).toBe(0.55);
    expect(audio.autoplay).toBe(true);
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledOnce();

    audio.currentTime = 7;
    music.stop();

    expect(audio.pause).toHaveBeenCalledOnce();
    expect(audio.autoplay).toBe(false);
    expect(audio.currentTime).toBe(0);
  });

  it('retries blocked autoplay on the next mouse, touch, or keyboard interaction', async () => {
    const interactionTarget = new EventTarget();
    const audio = {
      addEventListener: vi.fn(),
      autoplay: false,
      currentTime: 0,
      load: vi.fn(),
      networkState: 1,
      pause: vi.fn(),
      paused: true,
      play: vi
        .fn()
        .mockRejectedValueOnce(new DOMException('Autoplay blocked', 'NotAllowedError'))
        .mockResolvedValue(undefined),
      volume: 1,
    };
    const root = {
      querySelector: vi.fn().mockReturnValue(audio),
    } as unknown as HTMLElement;
    const music = new FutureHomepageAudio(root, interactionTarget);

    music.start();
    await vi.waitFor(() => expect(audio.play).toHaveBeenCalledTimes(1));

    interactionTarget.dispatchEvent(new Event('pointerup'));
    await vi.waitFor(() => expect(audio.play).toHaveBeenCalledTimes(2));

    music.stop();
  });
});
