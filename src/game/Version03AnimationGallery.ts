import headNodSoftInbetweensManifestJson from '../assets/game/2d-v03/animations/head-nod-soft-inbetweens/manifest.json';
import neutralToConfidentWalkManifestJson from '../assets/game/2d-v03/animations/neutral-to-confident-walk/manifest.json';
import { refreshIcons } from '../icons';

const FRAME_MODULES = import.meta.glob(
  '../assets/game/2d-v03/animations/*/frames/*.png',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
);

interface FrameDefinition {
  index: number;
  sourceFrame?: number;
  label: string;
  filename: string;
  runtime: boolean;
}

interface AnimationManifest {
  animation: {
    id: string;
    assetDirectory?: string;
    name: string;
    description: string;
    prompt: string;
    stageLabel?: string;
  };
  timing: {
    baseFps: number;
    runtimeFrameCount: number;
    drawingCount: number;
    loopDurationSeconds: number;
    bookendFrame?: number;
    loopReturnFrame?: number;
  };
  productionMethod: string;
  frames: FrameDefinition[];
}

interface AnimationPreview {
  root: HTMLElement;
  manifest: AnimationManifest;
  image: HTMLImageElement;
  frameReadout: HTMLElement;
  playButton: HTMLButtonElement;
  speedInput: HTMLInputElement;
  speedOutput: HTMLOutputElement;
  copyButton: HTMLButtonElement;
  copyStatus: HTMLElement;
  frameButtons: HTMLButtonElement[];
  urls: string[];
  currentFrame: number;
  elapsedMs: number;
  speed: number;
  playing: boolean;
}

const SPEED_MIN = 0.1;
const SPEED_MAX = 2;
const SPEED_STEP = 0.05;
const SPEED_STORAGE_KEY = 'hugo-go:version-03-speed-v2';

const MANIFESTS = [
  headNodSoftInbetweensManifestJson as AnimationManifest,
  neutralToConfidentWalkManifestJson as AnimationManifest,
];

export class Version03AnimationGallery {
  private readonly previews: AnimationPreview[];
  private readonly sleepyAudio: HTMLAudioElement;
  private readonly sleepyPlayButton: HTMLButtonElement;
  private readonly sleepyRestartButton: HTMLButtonElement;
  private assetsStarted = false;
  private active = false;
  private raf = 0;
  private lastTimestamp = 0;

  constructor(root: HTMLElement) {
    this.sleepyAudio = this.required<HTMLAudioElement>(root, '#version-03-sleepy-audio');
    this.sleepyPlayButton = this.required<HTMLButtonElement>(root, '#version-03-music-play');
    this.sleepyRestartButton = this.required<HTMLButtonElement>(
      root,
      '#version-03-music-restart',
    );
    this.sleepyAudio.volume = 0.55;
    this.previews = MANIFESTS.map((manifest, index) => {
      const card = root.querySelector<HTMLElement>(
        `[data-v03-animation="${manifest.animation.id}"]`,
      );
      if (!card) {
        throw new Error(`Missing Version 03 animation card: ${manifest.animation.id}`);
      }
      return this.createPreview(card, manifest, index + 1);
    });
    this.sleepyPlayButton.addEventListener('click', () => this.toggleSleepy());
    this.sleepyRestartButton.addEventListener('click', () => this.restartSleepy());
    this.sleepyAudio.addEventListener('play', () => this.syncSleepyControls());
    this.sleepyAudio.addEventListener('pause', () => this.syncSleepyControls());
    this.syncAll();
    this.syncSleepyControls();
    refreshIcons();
  }

  start(): void {
    this.ensureAssets();
    if (this.active) return;
    this.active = true;
    this.lastTimestamp = performance.now();
    for (const preview of this.previews) preview.playing = true;
    this.syncAll();
    this.raf = requestAnimationFrame((timestamp) => this.tick(timestamp));
  }

  stop(): void {
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.lastTimestamp = 0;
    this.sleepyAudio.pause();
    this.sleepyAudio.currentTime = 0;
    this.syncSleepyControls();
  }

  private toggleSleepy(): void {
    if (this.sleepyAudio.paused) {
      void this.sleepyAudio.play().catch(() => this.syncSleepyControls());
    } else {
      this.sleepyAudio.pause();
    }
  }

  private restartSleepy(): void {
    this.sleepyAudio.currentTime = 0;
    void this.sleepyAudio.play().catch(() => this.syncSleepyControls());
  }

  private syncSleepyControls(): void {
    const paused = this.sleepyAudio.paused;
    this.sleepyPlayButton.setAttribute('aria-label', paused ? 'Play Sleepy' : 'Pause Sleepy');
    this.sleepyPlayButton.setAttribute('aria-pressed', String(!paused));
    this.sleepyPlayButton.innerHTML = `
      <i data-lucide="${paused ? 'play' : 'pause'}" aria-hidden="true"></i>
      <span>${paused ? 'Play Sleepy' : 'Pause Sleepy'}</span>
    `;
    refreshIcons();
  }

  private createPreview(
    root: HTMLElement,
    manifest: AnimationManifest,
    libraryIndex: number,
  ): AnimationPreview {
    const isHeadNod = manifest.animation.id.startsWith('head-nod');
    const isSoftHeadNod = manifest.animation.id.startsWith('head-nod-soft');
    const isMidpointExperiment =
      manifest.animation.id === 'head-nod-soft-inbetweens';
    const isNeutralToConfidentWalk =
      manifest.animation.id === 'neutral-to-confident-walk';
    const usesRepeatedDrawings =
      manifest.timing.runtimeFrameCount !== manifest.timing.drawingCount;
    const speed = this.loadSpeed(manifest.animation.id);
    const speedId = `version-03-speed-${manifest.animation.id}`;
    const frameControls = `
        <div class="v03-animation-frames" aria-label="${manifest.animation.name} frame selector">
          ${manifest.frames.map((frame, index) => `
            <button
              type="button"
              data-v03-frame="${index}"
              aria-label="Pause on step ${index + 1}, source frame ${frame.sourceFrame ?? frame.index}: ${frame.label}"
            >${frame.sourceFrame ?? frame.index}</button>
          `).join('')}
        </div>
      `;
    root.innerHTML = `
      <header>
        <div>
          <span>${String(libraryIndex).padStart(2, '0')} · NEUTRAL SIDE</span>
          <h3>${manifest.animation.name}</h3>
          <p>${manifest.animation.description}</p>
        </div>
        <small>${manifest.timing.runtimeFrameCount} runtime frames · ${manifest.timing.baseFps} FPS · ${manifest.timing.loopDurationSeconds.toFixed(2)} s</small>
      </header>
      <div class="v03-animation-stage">
        <div class="v03-animation-stage-grid" aria-hidden="true"></div>
        <img width="512" height="512" alt="${manifest.animation.name} animation preview">
        <span>${manifest.animation.stageLabel ?? 'OUTFIT 03 · GAME IDLE'}</span>
      </div>
      <div class="v03-animation-controls">
        <button type="button" data-v03-action="restart">
          <i data-lucide="play" aria-hidden="true"></i>
          Restart
        </button>
        <button type="button" data-v03-action="pause">
          <i data-lucide="pause" aria-hidden="true"></i>
          <span>Pause</span>
        </button>
        <strong data-v03-frame-readout></strong>
      </div>
      <label class="v03-animation-speed" for="${speedId}">
        <span>Playback speed</span>
        <input
          id="${speedId}"
          type="range"
          min="${SPEED_MIN}"
          max="${SPEED_MAX}"
          step="${SPEED_STEP}"
          value="${speed.toFixed(2)}"
          data-v03-speed
          aria-label="${manifest.animation.name} playback speed"
        >
        <output for="${speedId}" data-v03-speed-output></output>
      </label>
      ${frameControls}
      <footer class="v03-animation-notes">
        <span>${usesRepeatedDrawings ? `<b>Source drawings:</b> ${manifest.timing.drawingCount} complete figures · ${manifest.timing.runtimeFrameCount}-step loop` : `<b>Full drawings:</b> all ${manifest.timing.runtimeFrameCount} generated characters`}</span>
        <span><b>Motion:</b> ${isMidpointExperiment ? 'drawings 1–7 · midpoint-smoothed loop' : isNeutralToConfidentWalk ? 'exact neutral · lead step · opposite-leg follow-through' : isSoftHeadNod ? 'frames 1–4 · mirrored beat loop' : isHeadNod ? 'six down · six back up · head only' : 'head · hand · shoe groove'}</span>
        <span><b>Processing:</b> chroma cleanup · whole-body registration only</span>
      </footer>
      <div class="v03-animation-prompt">
        <div>
          <span>SAVED GENERATION PROMPT</span>
          <p>Copy the exact production brief used for this animation.</p>
        </div>
        <button type="button" data-v03-copy-prompt>
          <i data-lucide="copy" aria-hidden="true"></i>
          <span>Copy prompt</span>
        </button>
        <span class="v03-copy-status" data-v03-copy-status role="status" aria-live="polite"></span>
      </div>
    `;

    const urls = manifest.frames.map((frame) => {
      const assetDirectory = manifest.animation.assetDirectory ?? manifest.animation.id;
      const modulePath =
        `../assets/game/2d-v03/animations/${assetDirectory}/frames/${frame.filename}`;
      const url = FRAME_MODULES[modulePath];
      if (typeof url !== 'string') {
        throw new Error(`Missing Version 03 frame asset: ${modulePath}`);
      }
      return url;
    });
    const preview: AnimationPreview = {
      root,
      manifest,
      image: this.required<HTMLImageElement>(root, '.v03-animation-stage img'),
      frameReadout: this.required<HTMLElement>(root, '[data-v03-frame-readout]'),
      playButton: this.required<HTMLButtonElement>(root, '[data-v03-action="pause"]'),
      speedInput: this.required<HTMLInputElement>(root, '[data-v03-speed]'),
      speedOutput: this.required<HTMLOutputElement>(root, '[data-v03-speed-output]'),
      copyButton: this.required<HTMLButtonElement>(root, '[data-v03-copy-prompt]'),
      copyStatus: this.required<HTMLElement>(root, '[data-v03-copy-status]'),
      frameButtons: Array.from(
        root.querySelectorAll<HTMLButtonElement>('[data-v03-frame]'),
      ),
      urls,
      currentFrame: 0,
      elapsedMs: 0,
      speed,
      playing: true,
    };

    this.required<HTMLButtonElement>(root, '[data-v03-action="restart"]').addEventListener(
      'click',
      () => {
        preview.currentFrame = 0;
        preview.elapsedMs = 0;
        preview.playing = true;
        this.sync(preview);
      },
    );
    preview.playButton.addEventListener('click', () => {
      preview.playing = !preview.playing;
      this.sync(preview);
    });
    preview.speedInput.addEventListener('input', () => {
      preview.speed = this.clampSpeed(Number(preview.speedInput.value));
      preview.speedInput.value = preview.speed.toFixed(2);
      this.saveSpeed(preview);
      this.sync(preview);
    });
    preview.copyButton.addEventListener('click', () => {
      void this.copyPrompt(preview);
    });
    for (const button of preview.frameButtons) {
      button.addEventListener('click', () => {
        const frameIndex = Number(button.dataset.v03Frame);
        if (!Number.isInteger(frameIndex)) return;
        preview.currentFrame = frameIndex;
        preview.elapsedMs = 0;
        preview.playing = false;
        this.sync(preview);
      });
    }
    return preview;
  }

  private tick(timestamp: number): void {
    if (!this.active) return;
    const delta = Math.min(100, Math.max(0, timestamp - this.lastTimestamp));
    this.lastTimestamp = timestamp;

    for (const preview of this.previews) {
      if (!preview.playing) continue;
      const frameDuration = 1000 / preview.manifest.timing.baseFps;
      preview.elapsedMs += delta * preview.speed;
      let changed = false;
      while (preview.elapsedMs >= frameDuration) {
        preview.elapsedMs -= frameDuration;
        preview.currentFrame =
          (preview.currentFrame + 1) % preview.manifest.timing.runtimeFrameCount;
        changed = true;
      }
      if (changed) this.sync(preview);
    }

    this.raf = requestAnimationFrame((nextTimestamp) => this.tick(nextTimestamp));
  }

  private syncAll(): void {
    for (const preview of this.previews) this.sync(preview);
  }

  private sync(preview: AnimationPreview): void {
    const frame = preview.manifest.frames[preview.currentFrame];
    preview.image.src = preview.urls[preview.currentFrame];
    preview.image.alt =
      `${preview.manifest.animation.name}, frame ${frame.index}: ${frame.label}`;
    preview.frameReadout.textContent = frame.sourceFrame === undefined
      ? `Frame ${frame.index} / ${preview.manifest.timing.runtimeFrameCount}`
      : `Step ${preview.currentFrame + 1} / ${preview.manifest.timing.runtimeFrameCount} · source ${frame.sourceFrame}`;
    const buttonLabel = preview.playButton.querySelector('span');
    if (buttonLabel) buttonLabel.textContent = preview.playing ? 'Pause' : 'Resume';
    preview.playButton.dataset.playing = String(preview.playing);
    const effectiveFps = preview.manifest.timing.baseFps * preview.speed;
    const loopDuration = preview.manifest.timing.loopDurationSeconds / preview.speed;
    preview.speedOutput.value =
      `${preview.speed.toFixed(2)}× · ${effectiveFps.toFixed(2)} FPS · ${loopDuration.toFixed(2)} s loop`;
    preview.speedOutput.textContent = preview.speedOutput.value;
    preview.speedInput.setAttribute(
      'aria-valuetext',
      `${preview.speed.toFixed(2)} times speed`,
    );
    for (const [index, button] of preview.frameButtons.entries()) {
      const isCurrent = index === preview.currentFrame;
      button.classList.toggle('is-current', isCurrent);
      button.setAttribute('aria-pressed', String(isCurrent));
    }
  }

  private async copyPrompt(preview: AnimationPreview): Promise<void> {
    let copied = false;
    try {
      await navigator.clipboard.writeText(preview.manifest.animation.prompt);
      copied = true;
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = preview.manifest.animation.prompt;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.append(textArea);
      textArea.select();
      copied = document.execCommand('copy');
      textArea.remove();
    }

    preview.copyStatus.textContent = copied ? 'Prompt copied!' : 'Could not copy prompt.';
    preview.copyButton.classList.toggle('is-copied', copied);
    window.setTimeout(() => {
      preview.copyStatus.textContent = '';
      preview.copyButton.classList.remove('is-copied');
    }, 2200);
  }

  private ensureAssets(): void {
    if (this.assetsStarted) return;
    this.assetsStarted = true;
    for (const preview of this.previews) {
      for (const url of preview.urls) {
        const image = new Image();
        image.decoding = 'async';
        image.src = url;
      }
    }
  }

  private loadSpeed(animationId: string): number {
    try {
      const saved = Number(
        localStorage.getItem(`${SPEED_STORAGE_KEY}:${animationId}`),
      );
      if (Number.isFinite(saved) && saved >= SPEED_MIN && saved <= SPEED_MAX) {
        return this.clampSpeed(saved);
      }
    } catch {
      // Restricted storage still allows the in-memory speed control to work.
    }
    return 1;
  }

  private saveSpeed(preview: AnimationPreview): void {
    try {
      localStorage.setItem(
        `${SPEED_STORAGE_KEY}:${preview.manifest.animation.id}`,
        preview.speed.toFixed(2),
      );
    } catch {
      // Restricted storage still allows the in-memory speed control to work.
    }
  }

  private clampSpeed(value: number): number {
    if (!Number.isFinite(value)) return 1;
    const stepped = Math.round(value / SPEED_STEP) * SPEED_STEP;
    return Math.min(SPEED_MAX, Math.max(SPEED_MIN, stepped));
  }

  private required<T extends Element>(root: ParentNode, selector: string): T {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing Version 03 animation element: ${selector}`);
    return element;
  }
}
