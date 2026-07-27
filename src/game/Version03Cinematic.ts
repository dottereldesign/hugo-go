import headNodManifestJson from '../assets/game/2d-v03/animations/head-nod-soft-inbetweens/manifest.json';
import backdropUrl from '../assets/game/2d-v03/cinematic/hugo-cliff-city-backdrop.webp';

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

const manifest = headNodManifestJson as CinematicManifest;

export class Version03Cinematic {
  private readonly root: HTMLElement;
  private readonly scrollRoot: HTMLElement;
  private readonly world: HTMLElement;
  private readonly backdrop: HTMLImageElement;
  private readonly frameImage: HTMLImageElement;
  private readonly frameUrls: string[];
  private active = false;
  private assetsStarted = false;
  private raf = 0;
  private lastTimestamp = 0;
  private elapsedMs = 0;
  private frameIndex = 0;

  constructor(root: HTMLElement, scrollRoot: HTMLElement) {
    this.root = this.required<HTMLElement>(root, '[data-v03-cinematic]');
    this.scrollRoot = scrollRoot;
    this.world = this.required<HTMLElement>(this.root, '[data-v03-cinematic-world]');
    this.backdrop = this.required<HTMLImageElement>(
      this.root,
      '[data-v03-cinematic-backdrop]',
    );
    this.frameImage = this.required<HTMLImageElement>(
      this.root,
      '[data-v03-cinematic-frame]',
    );
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
    this.backdrop.src = backdropUrl;
    this.syncFrame();
    this.syncLayout();
    this.syncCamera();
    this.scrollRoot.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('resize', this.handleResize, { passive: true });
  }

  start(): void {
    this.ensureAssets();
    this.syncLayout();
    this.syncCamera();
    if (this.active) return;
    this.active = true;
    this.lastTimestamp = performance.now();
    this.raf = requestAnimationFrame((timestamp) => this.tick(timestamp));
  }

  stop(): void {
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.lastTimestamp = 0;
  }

  private readonly handleScroll = (): void => {
    if (this.active) this.syncCamera();
  };

  private readonly handleResize = (): void => {
    this.syncLayout();
    if (this.active) this.syncCamera();
  };

  private tick(timestamp: number): void {
    if (!this.active) return;
    const delta = Math.min(100, Math.max(0, timestamp - this.lastTimestamp));
    this.lastTimestamp = timestamp;
    this.elapsedMs += delta;
    const frameDuration = 1000 / manifest.timing.baseFps;
    let changed = false;
    while (this.elapsedMs >= frameDuration) {
      this.elapsedMs -= frameDuration;
      this.frameIndex = (this.frameIndex + 1) % manifest.timing.runtimeFrameCount;
      changed = true;
    }
    if (changed) this.syncFrame();
    this.raf = requestAnimationFrame((nextTimestamp) => this.tick(nextTimestamp));
  }

  private syncFrame(): void {
    const frame = manifest.frames[this.frameIndex];
    this.frameImage.src = this.frameUrls[this.frameIndex];
    this.frameImage.alt = `Hugo nodding in side profile: ${frame.label}`;
  }

  private syncLayout(): void {
    const viewportHeight = this.scrollRoot.clientHeight;
    const durationScreens = window.innerWidth <= 700 ? 4.6 : 5.2;
    this.root.style.setProperty('--v03-cinematic-viewport', `${viewportHeight}px`);
    this.root.style.height = `${viewportHeight * durationScreens}px`;
  }

  private syncCamera(): void {
    const scrollRect = this.scrollRoot.getBoundingClientRect();
    const rootRect = this.root.getBoundingClientRect();
    const travel = Math.max(1, rootRect.height - this.scrollRoot.clientHeight);
    const progress = this.clamp((scrollRect.top - rootRect.top) / travel, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const scale = 1 + 3.75 * Math.pow(1 - eased, 1.28);
    const panX = (1 - eased) * -1.4;
    const panY = (1 - eased) * 1.8;

    this.root.style.setProperty('--v03-cinematic-progress', progress.toFixed(4));
    this.root.style.setProperty(
      '--v03-cinematic-progress-width',
      `${(progress * 100).toFixed(2)}%`,
    );
    this.root.style.setProperty(
      '--v03-cinematic-copy-opacity',
      this.clamp(1 - progress * 5, 0, 1).toFixed(4),
    );
    this.root.style.setProperty(
      '--v03-cinematic-copy-y',
      `${(progress * -18).toFixed(2)}px`,
    );
    this.world.style.transform =
      `translate3d(${panX.toFixed(3)}%, ${panY.toFixed(3)}%, 0) scale(${scale.toFixed(4)})`;
    this.root.dataset.cameraPhase =
      progress < 0.2 ? 'near' : progress < 0.72 ? 'pulling-back' : 'wide';
  }

  private ensureAssets(): void {
    if (this.assetsStarted) return;
    this.assetsStarted = true;
    const backdrop = new Image();
    backdrop.src = backdropUrl;
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

  private clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(maximum, Math.max(minimum, value));
  }
}
