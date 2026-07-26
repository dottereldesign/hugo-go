import neutralGrooveManifestJson from '../assets/game/2d-v03/animations/neutral-groove/manifest.json';
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
  label: string;
  filename: string;
  runtime: boolean;
}

interface AnimationManifest {
  animation: {
    id: string;
    name: string;
    description: string;
    prompt: string;
  };
  timing: {
    baseFps: number;
    runtimeFrameCount: number;
    drawingCount: number;
    loopDurationSeconds: number;
    bookendFrame: number;
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
  copyButton: HTMLButtonElement;
  copyStatus: HTMLElement;
  urls: string[];
  currentFrame: number;
  elapsedMs: number;
  playing: boolean;
}

const MANIFEST = neutralGrooveManifestJson as AnimationManifest;

export class Version03AnimationGallery {
  private readonly preview: AnimationPreview;
  private assetsStarted = false;
  private active = false;
  private raf = 0;
  private lastTimestamp = 0;

  constructor(root: HTMLElement) {
    const card = root.querySelector<HTMLElement>(
      `[data-v03-animation="${MANIFEST.animation.id}"]`,
    );
    if (!card) throw new Error(`Missing Version 03 animation card: ${MANIFEST.animation.id}`);
    this.preview = this.createPreview(card, MANIFEST);
    this.sync();
  }

  start(): void {
    this.ensureAssets();
    if (this.active) return;
    this.active = true;
    this.preview.playing = true;
    this.lastTimestamp = performance.now();
    this.sync();
    this.raf = requestAnimationFrame((timestamp) => this.tick(timestamp));
  }

  stop(): void {
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.lastTimestamp = 0;
  }

  private createPreview(root: HTMLElement, manifest: AnimationManifest): AnimationPreview {
    root.innerHTML = `
      <header>
        <div>
          <span>01 · NEUTRAL SIDE</span>
          <h3>${manifest.animation.name}</h3>
          <p>${manifest.animation.description}</p>
        </div>
        <small>${manifest.timing.runtimeFrameCount} runtime frames · ${manifest.timing.baseFps} FPS · ${manifest.timing.loopDurationSeconds.toFixed(2)} s</small>
      </header>
      <div class="v03-animation-stage">
        <div class="v03-animation-stage-grid" aria-hidden="true"></div>
        <img width="640" height="640" alt="${manifest.animation.name} animation preview">
        <span>OUTFIT 03 · GAME IDLE</span>
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
      <footer class="v03-animation-notes">
        <span><b>Moving:</b> head · front hand · front shoe</span>
        <span><b>Locked:</b> torso · hips · standing leg · wingsuit</span>
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
      const modulePath = `../assets/game/2d-v03/animations/${manifest.animation.id}/frames/${frame.filename}`;
      const url = FRAME_MODULES[modulePath];
      if (typeof url !== 'string') throw new Error(`Missing Version 03 frame asset: ${modulePath}`);
      return url;
    });
    const preview: AnimationPreview = {
      root,
      manifest,
      image: this.required<HTMLImageElement>(root, '.v03-animation-stage img'),
      frameReadout: this.required<HTMLElement>(root, '[data-v03-frame-readout]'),
      playButton: this.required<HTMLButtonElement>(root, '[data-v03-action="pause"]'),
      copyButton: this.required<HTMLButtonElement>(root, '[data-v03-copy-prompt]'),
      copyStatus: this.required<HTMLElement>(root, '[data-v03-copy-status]'),
      urls,
      currentFrame: 0,
      elapsedMs: 0,
      playing: true,
    };

    this.required<HTMLButtonElement>(root, '[data-v03-action="restart"]').addEventListener(
      'click',
      () => {
        preview.currentFrame = 0;
        preview.elapsedMs = 0;
        preview.playing = true;
        this.sync();
      },
    );
    preview.playButton.addEventListener('click', () => {
      preview.playing = !preview.playing;
      this.sync();
    });
    preview.copyButton.addEventListener('click', () => {
      void this.copyPrompt();
    });
    refreshIcons();
    return preview;
  }

  private tick(timestamp: number): void {
    if (!this.active) return;
    const delta = Math.min(100, Math.max(0, timestamp - this.lastTimestamp));
    this.lastTimestamp = timestamp;

    if (this.preview.playing) {
      const frameDuration = 1000 / this.preview.manifest.timing.baseFps;
      this.preview.elapsedMs += delta;
      let changed = false;
      while (this.preview.elapsedMs >= frameDuration) {
        this.preview.elapsedMs -= frameDuration;
        this.preview.currentFrame =
          (this.preview.currentFrame + 1) % this.preview.manifest.timing.runtimeFrameCount;
        changed = true;
      }
      if (changed) this.sync();
    }

    this.raf = requestAnimationFrame((nextTimestamp) => this.tick(nextTimestamp));
  }

  private sync(): void {
    const frame = this.preview.manifest.frames[this.preview.currentFrame];
    this.preview.image.src = this.preview.urls[this.preview.currentFrame];
    this.preview.image.alt =
      `${this.preview.manifest.animation.name}, frame ${frame.index}: ${frame.label}`;
    this.preview.frameReadout.textContent =
      `Frame ${frame.index} / ${this.preview.manifest.timing.runtimeFrameCount}`;
    const buttonLabel = this.preview.playButton.querySelector('span');
    if (buttonLabel) buttonLabel.textContent = this.preview.playing ? 'Pause' : 'Resume';
    this.preview.playButton.dataset.playing = String(this.preview.playing);
  }

  private async copyPrompt(): Promise<void> {
    let copied = false;
    try {
      await navigator.clipboard.writeText(this.preview.manifest.animation.prompt);
      copied = true;
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = this.preview.manifest.animation.prompt;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.append(textArea);
      textArea.select();
      copied = document.execCommand('copy');
      textArea.remove();
    }

    this.preview.copyStatus.textContent = copied ? 'Prompt copied!' : 'Could not copy prompt.';
    this.preview.copyButton.classList.toggle('is-copied', copied);
    window.setTimeout(() => {
      this.preview.copyStatus.textContent = '';
      this.preview.copyButton.classList.remove('is-copied');
    }, 2200);
  }

  private ensureAssets(): void {
    if (this.assetsStarted) return;
    this.assetsStarted = true;
    for (const url of this.preview.urls) {
      const image = new Image();
      image.decoding = 'async';
      image.src = url;
    }
  }

  private required<T extends Element>(root: ParentNode, selector: string): T {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing Version 03 animation element: ${selector}`);
    return element;
  }
}
