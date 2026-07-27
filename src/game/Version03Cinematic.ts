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

interface AlphaMask {
  width: number;
  height: number;
  alpha: Uint8Array;
}

const manifest = headNodManifestJson as CinematicManifest;

export class Version03Cinematic {
  private readonly root: HTMLElement;
  private readonly scrollRoot: HTMLElement;
  private readonly world: HTMLElement;
  private readonly character: HTMLElement;
  private readonly frameImage: HTMLImageElement;
  private readonly frameUrls: string[];
  private readonly usesAlphaHover: boolean;
  private readonly alphaMasks = new Map<string, AlphaMask>();
  private pointerPosition?: { clientX: number; clientY: number };
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
    this.character = this.required<HTMLElement>(
      this.root,
      '.v03-cinematic-character',
    );
    this.frameImage = this.required<HTMLImageElement>(
      this.root,
      '[data-v03-cinematic-frame]',
    );
    this.usesAlphaHover = this.root.classList.contains(
      'v03-cinematic--future-homepage',
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
    if (this.usesAlphaHover) {
      this.character.addEventListener(
        'pointermove',
        this.handleCharacterPointerMove,
      );
      this.character.addEventListener('pointerleave', this.clearAlphaHover);
      this.frameImage.addEventListener('load', this.handleFrameImageLoad);
    }
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
    this.clearAlphaHover();
  }

  private readonly handleScroll = (): void => {
    if (this.active) this.syncCamera();
  };

  private readonly handleResize = (): void => {
    this.syncLayout();
    if (this.active) this.syncCamera();
    this.syncAlphaHover();
  };

  private readonly handleCharacterPointerMove = (event: PointerEvent): void => {
    if (event.pointerType && event.pointerType !== 'mouse') {
      this.clearAlphaHover();
      return;
    }
    this.pointerPosition = {
      clientX: event.clientX,
      clientY: event.clientY,
    };
    this.syncAlphaHover();
  };

  private readonly handleFrameImageLoad = (): void => {
    this.syncAlphaHover();
  };

  private readonly clearAlphaHover = (): void => {
    this.pointerPosition = undefined;
    this.character.classList.remove('is-alpha-hovered');
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
    this.syncAlphaHover();
  }

  private syncAlphaHover(): void {
    if (!this.usesAlphaHover || !this.pointerPosition) return;

    const rect = this.frameImage.getBoundingClientRect();
    const { naturalWidth, naturalHeight } = this.frameImage;
    if (
      !this.frameImage.complete ||
      naturalWidth === 0 ||
      naturalHeight === 0 ||
      rect.width === 0 ||
      rect.height === 0
    ) {
      this.character.classList.remove('is-alpha-hovered');
      return;
    }

    const naturalAspect = naturalWidth / naturalHeight;
    const elementAspect = rect.width / rect.height;
    let renderedWidth = rect.width;
    let renderedHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (naturalAspect > elementAspect) {
      renderedHeight = rect.width / naturalAspect;
      offsetY = (rect.height - renderedHeight) / 2;
    } else {
      renderedWidth = rect.height * naturalAspect;
      offsetX = (rect.width - renderedWidth) / 2;
    }

    const localX = this.pointerPosition.clientX - rect.left - offsetX;
    const localY = this.pointerPosition.clientY - rect.top - offsetY;
    if (
      localX < 0 ||
      localY < 0 ||
      localX >= renderedWidth ||
      localY >= renderedHeight
    ) {
      this.character.classList.remove('is-alpha-hovered');
      return;
    }

    const sourceX = Math.min(
      naturalWidth - 1,
      Math.floor((localX / renderedWidth) * naturalWidth),
    );
    const sourceY = Math.min(
      naturalHeight - 1,
      Math.floor((localY / renderedHeight) * naturalHeight),
    );
    const mask = this.getAlphaMask();
    const isVisiblePixel =
      mask !== undefined && mask.alpha[sourceY * mask.width + sourceX] >= 24;
    this.character.classList.toggle('is-alpha-hovered', isVisiblePixel);
  }

  private getAlphaMask(): AlphaMask | undefined {
    const key = this.frameImage.currentSrc || this.frameImage.src;
    const cached = this.alphaMasks.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = this.frameImage.naturalWidth;
    canvas.height = this.frameImage.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return undefined;

    try {
      context.drawImage(this.frameImage, 0, 0);
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      const alpha = new Uint8Array(canvas.width * canvas.height);
      for (let index = 0, pixel = 3; index < alpha.length; index += 1, pixel += 4) {
        alpha[index] = pixels[pixel];
      }
      const mask = { width: canvas.width, height: canvas.height, alpha };
      this.alphaMasks.set(key, mask);
      return mask;
    } catch {
      return undefined;
    }
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

    this.root.style.setProperty(
      '--v03-cinematic-line-scale',
      (1 / scale).toFixed(4),
    );
    this.world.style.transform =
      `translate3d(${panX.toFixed(3)}%, ${panY.toFixed(3)}%, 0) scale(${scale.toFixed(4)})`;
    this.root.dataset.cameraPhase =
      progress < 0.2 ? 'near' : progress < 0.72 ? 'pulling-back' : 'wide';
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

  private clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(maximum, Math.max(minimum, value));
  }
}
