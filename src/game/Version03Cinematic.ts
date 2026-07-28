import headNodManifestJson from '../assets/game/2d-v03/animations/head-nod-soft-inbetweens/manifest.json';

const FRAME_MODULES = import.meta.glob(
  '../assets/game/2d-v03/animations/head-nod-soft-inbetweens/frames/*.png',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
);

interface CinematicManifest {
  animation: {
    id: string;
    assetDirectory?: string;
    name: string;
  };
  timing: {
    baseFps: number;
    runtimeFrameCount: number;
  };
  frames: Array<{
    index: number;
    label: string;
    filename: string;
  }>;
}

export interface Version03CinematicFrame {
  frameIndex: number;
  frameNumber: number;
  completedLoops: number;
}

interface Version03CinematicOptions {
  onFrame?: (frame: Version03CinematicFrame) => void;
}

const manifest = headNodManifestJson as CinematicManifest;

export class Version03Cinematic {
  private readonly root: HTMLElement;
  private readonly scrollRoot: HTMLElement;
  private readonly frameImage: HTMLImageElement;
  private readonly colorFrameImage?: HTMLImageElement;
  private readonly frameUrls: string[];
  private readonly onFrame?: (frame: Version03CinematicFrame) => void;
  private active = false;
  private assetsStarted = false;
  private raf = 0;
  private lastTimestamp = 0;
  private elapsedMs = 0;
  private frameIndex = 0;
  private completedLoops = 0;

  constructor(
    root: HTMLElement,
    scrollRoot: HTMLElement,
    options: Version03CinematicOptions = {},
  ) {
    this.root = this.required<HTMLElement>(root, '[data-v03-cinematic]');
    this.scrollRoot = scrollRoot;
    this.onFrame = options.onFrame;
    this.frameImage = this.required<HTMLImageElement>(
      this.root,
      '[data-v03-cinematic-frame]',
    );
    this.colorFrameImage = this.root.querySelector<HTMLImageElement>(
      '[data-v03-cinematic-color-frame]',
    ) ?? undefined;
    const assetDirectory = manifest.animation.assetDirectory ?? manifest.animation.id;
    this.frameUrls = manifest.frames.map((frame) => {
      const modulePath =
        `../assets/game/2d-v03/animations/${assetDirectory}/frames/${frame.filename}`;
      const url = FRAME_MODULES[modulePath];
      if (typeof url !== 'string') {
        throw new Error(`Missing Version 03 cinematic frame: ${modulePath}`);
      }
      return url;
    });
    this.syncFrame(false);
    this.syncLayout();
    window.addEventListener('resize', this.handleResize, { passive: true });
  }

  start(): void {
    this.ensureAssets();
    this.syncLayout();
    if (this.active) return;
    this.active = true;
    this.lastTimestamp = performance.now();
    this.raf = requestAnimationFrame((timestamp) => this.tick(timestamp));
  }

  holdFirstFrame(): void {
    this.stop();
    this.ensureAssets();
    this.elapsedMs = 0;
    this.frameIndex = 0;
    this.completedLoops = 0;
    this.syncFrame(false);
    this.syncLayout();
  }

  stop(): void {
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.lastTimestamp = 0;
  }

  private readonly handleResize = (): void => {
    this.syncLayout();
  };

  private tick(timestamp: number): void {
    if (!this.active) return;
    const delta = Math.min(100, Math.max(0, timestamp - this.lastTimestamp));
    this.lastTimestamp = timestamp;
    this.elapsedMs += delta;
    const frameDuration = 1000 / manifest.timing.baseFps;
    while (this.elapsedMs >= frameDuration) {
      this.elapsedMs -= frameDuration;
      this.frameIndex = (this.frameIndex + 1) % manifest.timing.runtimeFrameCount;
      if (this.frameIndex === 0) this.completedLoops += 1;
      this.syncFrame();
    }
    this.raf = requestAnimationFrame((nextTimestamp) => this.tick(nextTimestamp));
  }

  private syncFrame(notify = true): void {
    const frame = manifest.frames[this.frameIndex];
    this.frameImage.src = this.frameUrls[this.frameIndex];
    this.frameImage.alt = `Hugo nodding in side profile: ${frame.label}`;
    if (this.colorFrameImage) {
      this.colorFrameImage.src = this.frameUrls[this.frameIndex];
    }
    if (notify) {
      this.onFrame?.({
        frameIndex: this.frameIndex,
        frameNumber: frame.index,
        completedLoops: this.completedLoops,
      });
    }
  }

  private syncLayout(): void {
    const viewportHeight = this.scrollRoot.clientHeight;
    const sourceFrameWidth =
      this.frameImage.naturalWidth ||
      Number(this.frameImage.getAttribute('width')) ||
      512;
    const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1);
    const nativeFrameCssWidth = Math.max(
      1,
      Math.floor(sourceFrameWidth / devicePixelRatio),
    );
    this.root.style.setProperty('--v03-cinematic-viewport', `${viewportHeight}px`);
    this.root.style.setProperty(
      '--v03-native-frame-css-width',
      `${nativeFrameCssWidth}px`,
    );
    this.root.style.height = `${viewportHeight}px`;
  }

  private ensureAssets(): void {
    if (this.assetsStarted) return;
    this.assetsStarted = true;
    for (const url of this.frameUrls) {
      const image = new Image();
      image.src = url;
    }
  }

  private required<T extends Element>(root: ParentNode, selector: string): T {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing Version 03 cinematic element: ${selector}`);
    return element;
  }
}
