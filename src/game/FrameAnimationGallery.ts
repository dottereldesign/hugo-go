import neutralIdleManifestJson from '../assets/game/2d-v02/animations/neutral-idle/manifest.json';
import readyProfileManifestJson from '../assets/game/2d-v02/animations/ready-profile/manifest.json';

const FRAME_MODULES = import.meta.glob(
  '../assets/game/2d-v02/animations/*/frames/*.png',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
);

interface FrameDefinition {
  index: number;
  slug: string;
  label: string;
  filename: string;
  runtime: boolean;
  durationTicks: number;
}

interface AnimationManifest {
  animation: {
    id: string;
    name: string;
    description: string;
  };
  timing: {
    baseFps: number;
    drawingCount: number;
    runtimeFrameCount: number;
    loopDurationSeconds: number;
    bookendFrame: number;
  };
  frames: FrameDefinition[];
}

interface GalleryPreview {
  root: HTMLElement;
  manifest: AnimationManifest;
  image: HTMLImageElement;
  comparisonImages: HTMLImageElement[];
  playButton: HTMLButtonElement;
  loopButton: HTMLButtonElement;
  readout: HTMLElement;
  speedInput: HTMLInputElement;
  speedOutput: HTMLOutputElement;
  frameButtons: HTMLButtonElement[];
  urls: string[];
  currentFrame: number;
  elapsedMs: number;
  speed: number;
  playing: boolean;
  loop: boolean;
}

const MANIFESTS = [
  neutralIdleManifestJson as AnimationManifest,
  readyProfileManifestJson as AnimationManifest,
];

export class FrameAnimationGallery {
  private readonly previews: GalleryPreview[];
  private assetsStarted = false;
  private active = false;
  private raf = 0;
  private lastTimestamp = 0;

  constructor(root: HTMLElement) {
    this.previews = MANIFESTS.map((manifest) => {
      const card = root.querySelector<HTMLElement>(
        `[data-v02-animation="${manifest.animation.id}"]`,
      );
      if (!card) throw new Error(`Missing V02 animation card: ${manifest.animation.id}`);
      return this.createPreview(card, manifest);
    });
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

  private createPreview(root: HTMLElement, manifest: AnimationManifest): GalleryPreview {
    const runtimeDuration = manifest.timing.loopDurationSeconds;
    root.innerHTML = `
      <header>
        <div>
          <span>${manifest.animation.id === 'neutral-idle' ? 'NEUTRAL FRONT' : 'READY PROFILE'}</span>
          <h3>${manifest.animation.name}</h3>
          <p>${manifest.animation.description}</p>
        </div>
        <small>${manifest.timing.drawingCount} files · ${runtimeDuration.toFixed(2)} s loop · ${manifest.timing.baseFps} timing FPS</small>
      </header>
      <div class="v02-animation-stage">
        <div class="v02-animation-stage-grid" aria-hidden="true"></div>
        <img width="640" height="640" alt="${manifest.animation.name} animation preview">
        <span class="v02-animation-stage-label">OUTFIT 03 · FRAME PLAYER</span>
      </div>
      <div class="v02-animation-controls">
        <div class="v02-animation-transport">
          <button type="button" data-action="start">Start</button>
          <button type="button" data-action="pause">Pause</button>
          <button type="button" data-action="previous" aria-label="Previous frame">−1</button>
          <strong data-frame-readout></strong>
          <button type="button" data-action="next" aria-label="Next frame">+1</button>
          <button type="button" data-action="loop" aria-pressed="true">Loop</button>
        </div>
        <label class="v02-animation-speed">
          <span>Playback speed</span>
          <input type="range" min="0.25" max="2" step="0.05" value="1" data-speed>
          <output data-speed-output></output>
        </label>
        <div class="v02-animation-frames" aria-label="${manifest.animation.name} frame picker"></div>
      </div>
      <footer>
        <span><b>01–${manifest.timing.runtimeFrameCount}</b> runtime drawings with authored holds</span>
        <span><b>${manifest.timing.bookendFrame}</b> exact copied seam · review only</span>
        <span><b>640 px</b> registered transparent PNGs</span>
      </footer>
      ${manifest.animation.id === 'neutral-idle' ? `
        <section class="v02-size-compare" aria-label="Neutral Front size comparison">
          <header><span>SIZE REVIEW</span><b>Same frame · four display scales</b></header>
          <div>
            <figure data-size="100"><img width="640" height="640" alt=""><figcaption>Current · 100%</figcaption></figure>
            <figure data-size="78"><img width="640" height="640" alt=""><figcaption>Compact · 78%</figcaption></figure>
            <figure data-size="60"><img width="640" height="640" alt=""><figcaption>Small · 60%</figcaption></figure>
            <figure data-size="45"><img width="640" height="640" alt=""><figcaption>Mini · 45%</figcaption></figure>
          </div>
        </section>` : ''}
    `;

    const urls = manifest.frames.map((frame) => {
      const modulePath = `../assets/game/2d-v02/animations/${manifest.animation.id}/frames/${frame.filename}`;
      const url = FRAME_MODULES[modulePath];
      if (typeof url !== 'string') throw new Error(`Missing V02 frame asset: ${modulePath}`);
      return url;
    });
    const framePicker = this.required<HTMLElement>(root, '.v02-animation-frames');
    const frameButtons = manifest.frames.map((frame) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(frame.index);
      button.dataset.frame = String(frame.index - 1);
      button.title = `${frame.index}. ${frame.label}${frame.runtime ? '' : ' · exact seam bookend'}`;
      button.setAttribute('aria-label', `Show frame ${frame.index}: ${frame.label}`);
      if (!frame.runtime) button.classList.add('is-bookend');
      framePicker.append(button);
      return button;
    });

    const preview: GalleryPreview = {
      root,
      manifest,
      image: this.required<HTMLImageElement>(root, '.v02-animation-stage img'),
      comparisonImages: Array.from(root.querySelectorAll<HTMLImageElement>('.v02-size-compare img')),
      playButton: this.required<HTMLButtonElement>(root, '[data-action="pause"]'),
      loopButton: this.required<HTMLButtonElement>(root, '[data-action="loop"]'),
      readout: this.required<HTMLElement>(root, '[data-frame-readout]'),
      speedInput: this.required<HTMLInputElement>(root, '[data-speed]'),
      speedOutput: this.required<HTMLOutputElement>(root, '[data-speed-output]'),
      frameButtons,
      urls,
      currentFrame: 0,
      elapsedMs: 0,
      speed: 1,
      playing: true,
      loop: true,
    };

    this.required<HTMLButtonElement>(root, '[data-action="start"]').addEventListener(
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
      if (preview.currentFrame >= preview.manifest.timing.runtimeFrameCount) {
        preview.currentFrame = 0;
        preview.elapsedMs = 0;
      }
      this.sync(preview);
    });
    this.required<HTMLButtonElement>(root, '[data-action="previous"]').addEventListener(
      'click',
      () => this.step(preview, -1),
    );
    this.required<HTMLButtonElement>(root, '[data-action="next"]').addEventListener(
      'click',
      () => this.step(preview, 1),
    );
    preview.loopButton.addEventListener('click', () => {
      preview.loop = !preview.loop;
      this.sync(preview);
    });
    preview.speedInput.addEventListener('input', () => {
      preview.speed = Number(preview.speedInput.value);
      this.sync(preview);
    });
    framePicker.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-frame]');
      if (!button) return;
      preview.currentFrame = Number(button.dataset.frame);
      preview.elapsedMs = 0;
      preview.playing = false;
      this.sync(preview);
    });
    this.sync(preview);
    return preview;
  }

  private tick(timestamp: number): void {
    if (!this.active) return;
    const delta = Math.min(100, Math.max(0, timestamp - this.lastTimestamp));
    this.lastTimestamp = timestamp;

    for (const preview of this.previews) {
      if (!preview.playing) continue;
      preview.elapsedMs += delta * preview.speed;
      let changed = false;
      let frame = preview.manifest.frames[preview.currentFrame];
      while (frame.runtime && preview.elapsedMs >= this.frameDurationMs(preview, frame)) {
        preview.elapsedMs -= this.frameDurationMs(preview, frame);
        const nextFrame = preview.currentFrame + 1;
        if (nextFrame >= preview.manifest.timing.runtimeFrameCount) {
          if (!preview.loop) {
            preview.currentFrame = preview.manifest.timing.runtimeFrameCount - 1;
            preview.elapsedMs = 0;
            preview.playing = false;
            changed = true;
            break;
          }
          preview.currentFrame = 0;
        } else {
          preview.currentFrame = nextFrame;
        }
        changed = true;
        frame = preview.manifest.frames[preview.currentFrame];
      }
      if (changed) this.sync(preview);
    }

    this.raf = requestAnimationFrame((nextTimestamp) => this.tick(nextTimestamp));
  }

  private frameDurationMs(preview: GalleryPreview, frame: FrameDefinition): number {
    return frame.durationTicks / preview.manifest.timing.baseFps * 1000;
  }

  private step(preview: GalleryPreview, direction: -1 | 1): void {
    preview.playing = false;
    preview.elapsedMs = 0;
    const frameCount = preview.manifest.frames.length;
    preview.currentFrame = (preview.currentFrame + direction + frameCount) % frameCount;
    this.sync(preview);
  }

  private syncAll(): void {
    for (const preview of this.previews) this.sync(preview);
  }

  private sync(preview: GalleryPreview): void {
    const frame = preview.manifest.frames[preview.currentFrame];
    preview.image.src = preview.urls[preview.currentFrame];
    preview.image.alt = `${preview.manifest.animation.name}, frame ${frame.index}: ${frame.label}`;
    preview.comparisonImages.forEach((image) => {
      image.src = preview.urls[preview.currentFrame];
      image.alt = `${preview.manifest.animation.name}, frame ${frame.index}: ${frame.label}`;
    });
    preview.root.dataset.frame = String(frame.index);
    preview.root.dataset.playing = String(preview.playing);
    preview.playButton.textContent = preview.playing ? 'Pause' : 'Resume';
    preview.loopButton.classList.toggle('is-active', preview.loop);
    preview.loopButton.setAttribute('aria-pressed', String(preview.loop));
    preview.readout.textContent = `Frame ${frame.index} / ${preview.manifest.frames.length} · ${frame.label}`;
    preview.speedOutput.textContent = `${preview.speed.toFixed(2)}× · ${(preview.manifest.timing.baseFps * preview.speed).toFixed(1)} timing FPS · ${(preview.manifest.timing.loopDurationSeconds / preview.speed).toFixed(2)} s loop`;
    preview.frameButtons.forEach((button, index) => {
      const current = index === preview.currentFrame;
      button.classList.toggle('is-current', current);
      button.setAttribute('aria-pressed', String(current));
    });
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

  private required<T extends Element>(root: HTMLElement, selector: string): T {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing required gallery element: ${selector}`);
    return element;
  }
}
