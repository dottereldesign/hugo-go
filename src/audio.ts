export type UiSound = 'click' | 'card' | 'confirm' | 'toggle' | 'back' | 'open';
export type UiSoundPack = 'magic-chimes' | 'cozy-clicks' | 'gentle-quest';

export const UI_SOUND_PACKS: ReadonlyArray<{ id: UiSoundPack; name: string; description: string }> = [
  { id: 'magic-chimes', name: 'Magic Chimes', description: 'Soft bells and orchestral taps.' },
  { id: 'cozy-clicks', name: 'Cozy Clicks', description: 'Warm, organic switches and wooden clicks.' },
  { id: 'gentle-quest', name: 'Gentle Quest', description: 'Polished storybook adventure cues.' },
];

export function isUiSoundPack(value: unknown): value is UiSoundPack {
  return UI_SOUND_PACKS.some((pack) => pack.id === value);
}

export interface AudioChannels {
  musicEnabled: boolean;
  effectsEnabled: boolean;
  soundPack: UiSoundPack;
}

const UI_SOUND_FILES: Record<UiSoundPack, Record<UiSound, string>> = {
  'magic-chimes': Object.fromEntries(['click', 'card', 'confirm', 'toggle', 'back', 'open'].map((sound) => [sound, `${sound}.ogg`])) as Record<UiSound, string>,
  'cozy-clicks': Object.fromEntries(['click', 'card', 'confirm', 'toggle', 'back', 'open'].map((sound) => [sound, `${sound}.wav`])) as Record<UiSound, string>,
  'gentle-quest': Object.fromEntries(['click', 'card', 'confirm', 'toggle', 'back', 'open'].map((sound) => [sound, `${sound}.mp3`])) as Record<UiSound, string>,
};

export function resolveUiSoundUrl(
  sound: UiSound,
  pack: UiSoundPack = 'magic-chimes',
  pageBase = document.baseURI,
  appBase = './',
): string {
  return new URL(`${appBase}audio/ui/packs/${pack}/${UI_SOUND_FILES[pack][sound]}`, pageBase).href;
}

export function isBackgroundMusicSuppressed(
  bodyClasses: Pick<DOMTokenList, 'contains'> = document.body.classList,
): boolean {
  return (
    bodyClasses.contains('version-03-page-open')
    || bodyClasses.contains('future-homepage-page-open')
  );
}

export class AudioEngine {
  muted: boolean;
  private context: AudioContext | null = null;
  private readonly music = document.getElementById('background-music') as HTMLAudioElement | null;
  private readonly effectBuffers = new Map<string, AudioBuffer>();
  private readonly effectLoads = new Map<string, Promise<AudioBuffer | null>>();
  private musicEnabled = true;
  private effectsEnabled = true;
  private soundPack: UiSoundPack = 'magic-chimes';
  private effectPlays = 0;
  private lastEffect: UiSound | null = null;

  constructor() {
    const storedPreference = localStorage.getItem('hugo-go-muted');
    this.muted = storedPreference === null ? true : storedPreference !== 'false';
    if (this.music) this.music.volume = 0.18;
  }

  unlock(): void {
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === 'suspended') void this.context.resume();
    if (
      !this.muted
      && this.musicEnabled
      && !isBackgroundMusicSuppressed()
      && this.music?.paused
    ) {
      void this.music.play().catch(() => undefined);
    }
    if (this.effectsEnabled) void this.preloadEffects();
  }

  pauseMusic(): void {
    this.music?.pause();
  }

  configure(channels: AudioChannels): void {
    this.musicEnabled = channels.musicEnabled;
    this.effectsEnabled = channels.effectsEnabled;
    this.soundPack = channels.soundPack;
    if (!this.musicEnabled) this.music?.pause();
    else if (!this.muted) this.unlock();
    if (this.effectsEnabled && this.context) void this.preloadEffects();
  }

  toggle(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('hugo-go-muted', String(this.muted));
    if (this.muted) {
      this.music?.pause();
    } else {
      this.unlock();
    }
    return this.muted;
  }

  playUi(sound: UiSound): void {
    if (!this.effectsEnabled) return;
    this.unlock();
    const buffer = this.effectBuffers.get(sound);
    if (buffer) {
      this.playBuffer(sound, buffer);
      return;
    }
    void this.loadEffect(sound).then((loaded) => {
      if (loaded && this.effectsEnabled) this.playBuffer(sound, loaded);
    });
  }

  getDiagnostics(): { muted: boolean; musicEnabled: boolean; effectsEnabled: boolean; soundPack: UiSoundPack; contextState: AudioContextState | 'unavailable'; loadedEffects: number; effectPlays: number; lastEffect: UiSound | null } {
    return {
      muted: this.muted,
      musicEnabled: this.musicEnabled,
      effectsEnabled: this.effectsEnabled,
      soundPack: this.soundPack,
      contextState: this.context?.state ?? 'unavailable',
      loadedEffects: this.effectBuffers.size,
      effectPlays: this.effectPlays,
      lastEffect: this.lastEffect,
    };
  }

  private async preloadEffects(): Promise<void> {
    await Promise.all((Object.keys(UI_SOUND_FILES[this.soundPack]) as UiSound[]).map((sound) => this.loadEffect(sound)));
  }

  private loadEffect(sound: UiSound): Promise<AudioBuffer | null> {
    const pack = this.soundPack;
    const key = `${pack}:${sound}`;
    const cached = this.effectBuffers.get(key);
    if (cached) return Promise.resolve(cached);
    const pending = this.effectLoads.get(key);
    if (pending) return pending;
    if (!this.context) return Promise.resolve(null);

    const load = fetch(resolveUiSoundUrl(sound, pack))
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${sound} sound.`);
        return response.arrayBuffer();
      })
      .then((data) => this.context?.decodeAudioData(data) ?? null)
      .then((buffer) => {
        if (buffer) this.effectBuffers.set(key, buffer);
        return buffer;
      })
      .catch(() => null)
      .finally(() => this.effectLoads.delete(key));
    this.effectLoads.set(key, load);
    return load;
  }

  private playBuffer(sound: UiSound, buffer: AudioBuffer): void {
    if (!this.context) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    const packVolume = this.soundPack === 'cozy-clicks' ? 0.72 : this.soundPack === 'gentle-quest' ? 0.38 : 0.34;
    const soundVolume = sound === 'confirm' ? 1 : sound === 'click' ? 0.76 : 0.84;
    gain.gain.value = packVolume * soundVolume;
    source.connect(gain);
    gain.connect(this.context.destination);
    source.start();
    this.effectPlays += 1;
    this.lastEffect = sound;
  }

}
