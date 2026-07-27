import { describe, expect, it } from 'vitest';
import { isBackgroundMusicSuppressed, resolveUiSoundUrl } from '../src/audio';

describe('UI sound asset URLs', () => {
  it('stay inside a nested production deployment', () => {
    expect(resolveUiSoundUrl('confirm', 'magic-chimes', 'https://example.com/games/hugo-go/', './')).toBe(
      'https://example.com/games/hugo-go/audio/ui/packs/magic-chimes/confirm.ogg',
    );
  });

  it('respect an explicit application base', () => {
    expect(resolveUiSoundUrl('card', 'gentle-quest', 'https://example.com/', '/hugo-go/')).toBe(
      'https://example.com/hugo-go/audio/ui/packs/gentle-quest/card.mp3',
    );
  });
});

describe('background music routing', () => {
  const bodyClasses = (...classes: string[]): Pick<DOMTokenList, 'contains'> => ({
    contains: (className: string) => classes.includes(className),
  });

  it('suppresses the regular track on both cinematic pages', () => {
    expect(isBackgroundMusicSuppressed(bodyClasses('version-03-page-open'))).toBe(true);
    expect(isBackgroundMusicSuppressed(bodyClasses('future-homepage-page-open'))).toBe(true);
  });

  it('allows the regular track elsewhere', () => {
    expect(isBackgroundMusicSuppressed(bodyClasses('game-page-open'))).toBe(false);
  });
});
