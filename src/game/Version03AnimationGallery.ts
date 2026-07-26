import headNodManifestJson from '../assets/game/2d-v03/animations/head-nod/manifest.json';
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
  copyButton: HTMLButtonElement;
  copyStatus: HTMLElement;
  urls: string[];
  currentFrame: number;
  elapsedMs: number;
  playing: boolean;
}

const MANIFESTS = [
  neutralGrooveManifestJson as AnimationManifest,
  headNodManifestJson as AnimationManifest,
];

export class Version03AnimationGallery {
  private readonly previews: AnimationPreview[];
  private assetsStarted = false;
  private active = false;
  private raf = 0;
  private lastTimestamp = 0;

  constructor(root: HTMLElement) {
    this.previews = MANIFESTS.map((manifest, index) => {
      const card = root.querySelector<HTMLElement>(
        `[data-v03-animation="${manifest.animation.id}"]`,
      );
      if (!card) {
        throw new Error(`Missing Version 03 animation card: ${manifest.animation.id}`);
      }
      return this.createPreview(card, manifest, index + 1);
    });
    this.syncAll();
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
  }

  private createPreview(
    root: HTMLElement,
    manifest: AnimationManifest,
    libraryIndex: number,
  ): AnimationPreview {
    const isHeadNod = manifest.animation.id === 'head-nod';
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
        <span><b>Full drawings:</b> all ${manifest.timing.runtimeFrameCount} generated characters</span>
        <span><b>Motion:</b> ${isHeadNod ? 'six down · six back up · head only' : 'head · hand · shoe groove'}</span>
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
      const modulePath =
        `../assets/game/2d-v03/animations/${manifest.animation.id}/frames/${frame.filename}`;
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
        this.sync(preview);
      },
    );
    preview.playButton.addEventListener('click', () => {
      preview.playing = !preview.playing;
      this.sync(preview);
    });
    preview.copyButton.addEventListener('click', () => {
      void this.copyPrompt(preview);
    });
    return preview;
  }

  private tick(timestamp: number): void {
    if (!this.active) return;
    const delta = Math.min(100, Math.max(0, timestamp - this.lastTimestamp));
    this.lastTimestamp = timestamp;

    for (const preview of this.previews) {
      if (!preview.playing) continue;
      const frameDuration = 1000 / preview.manifest.timing.baseFps;
      preview.elapsedMs += delta;
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
    preview.frameReadout.textContent =
      `Frame ${frame.index} / ${preview.manifest.timing.runtimeFrameCount}`;
    const buttonLabel = preview.playButton.querySelector('span');
    if (buttonLabel) buttonLabel.textContent = preview.playing ? 'Pause' : 'Resume';
    preview.playButton.dataset.playing = String(preview.playing);
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

  private required<T extends Element>(root: ParentNode, selector: string): T {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing Version 03 animation element: ${selector}`);
    return element;
  }
}
