import forestSeasonUrl from '../assets/game/forest-season-base.webp';
import hugoFlightUrl from '../assets/game/hugo-flight.webp';
import hugoRunCycleUrl from '../assets/game/hugo-run-cycle.webp';
import { getRunFrame, RUN_FRAME_HEIGHT, RUN_FRAME_WIDTH } from './animation';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_Y,
  HUGO_HEIGHT,
  HUGO_WIDTH,
  advanceFlight,
  boostFlight,
  createFlightGame,
  type FlightGameState,
  type Obstacle,
} from './engine';
import { getSeasonVisual, type SeasonId, type SeasonVisual } from './seasons';

export interface RunResult {
  distance: number;
  coins: number;
}

interface FlightGameElements {
  canvas: HTMLCanvasElement;
  distance: HTMLElement;
  coins: HTMLElement;
  best: HTMLElement;
  phase: HTMLElement;
  season: HTMLElement;
  overlay: HTMLElement;
  result: HTMLElement;
  restart: HTMLButtonElement;
  announcer: HTMLElement;
}

interface FlightGameOptions {
  bestDistance: () => number;
  onRunComplete: (result: RunResult) => void;
}

type LoadedSprite = HTMLImageElement & { ready?: boolean };

export class FlightGame {
  private state = createFlightGame();
  private animationFrame = 0;
  private previousFrameTime = 0;
  private running = false;
  private runReported = false;
  private readonly context: CanvasRenderingContext2D;
  private readonly backgroundBuffer: HTMLCanvasElement;
  private readonly backgroundContext: CanvasRenderingContext2D;
  private backgroundCacheKey = '';
  private assetsStarted = false;
  private readonly flightSprite = this.createSprite();
  private readonly runCycleSprite = this.createSprite();
  private readonly forestBackground = this.createSprite();
  private seasonLabel = '';

  constructor(
    private readonly elements: FlightGameElements,
    private readonly options: FlightGameOptions,
  ) {
    const context = elements.canvas.getContext('2d');
    if (!context) throw new Error('HUGO GO! needs Canvas 2D support.');
    this.context = context;
    this.backgroundBuffer = document.createElement('canvas');
    this.backgroundBuffer.width = GAME_WIDTH;
    this.backgroundBuffer.height = GROUND_Y;
    const backgroundContext = this.backgroundBuffer.getContext('2d');
    if (!backgroundContext) throw new Error('HUGO GO! needs offscreen Canvas 2D support.');
    this.backgroundContext = backgroundContext;
    this.configureCanvas();
    this.bindControls();
  }

  start(): void {
    this.ensureAssets();
    this.state = createFlightGame();
    this.runReported = false;
    this.running = true;
    this.previousFrameTime = performance.now();
    this.elements.overlay.hidden = true;
    this.elements.phase.textContent = 'RUNNING';
    this.elements.announcer.textContent = 'Forest run started. Tap, click, or press Space to boost.';
    this.updateHud();
    this.render();
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame((time) => this.tick(time));
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
  }

  getState(): Readonly<FlightGameState> {
    return this.state;
  }

  boost(): void {
    if (!this.running) return;
    if (this.state.phase === 'gameover') {
      this.start();
      return;
    }
    if (boostFlight(this.state)) {
      this.elements.phase.textContent = 'BOOST';
      window.setTimeout(() => {
        if (this.state.phase === 'playing') this.elements.phase.textContent = this.state.hugo.grounded ? 'RUNNING' : 'FLYING';
      }, 130);
    }
  }

  private bindControls(): void {
    this.elements.canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      event.preventDefault();
      this.boost();
    });
    this.elements.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    this.elements.restart.addEventListener('click', () => this.start());
    window.addEventListener('keydown', (event) => {
      if (!this.running || !['Space', 'ArrowUp', 'KeyW'].includes(event.code)) return;
      event.preventDefault();
      if (!event.repeat) this.boost();
    });
    document.addEventListener('visibilitychange', () => {
      this.previousFrameTime = performance.now();
    });
    window.addEventListener('resize', () => this.configureCanvas());
  }

  private configureCanvas(): void {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.elements.canvas.width = Math.round(GAME_WIDTH * pixelRatio);
    this.elements.canvas.height = Math.round(GAME_HEIGHT * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
    this.render();
  }

  private tick(time: number): void {
    if (!this.running) return;
    const elapsedSeconds = Math.min(0.05, Math.max(0, (time - this.previousFrameTime) / 1_000));
    this.previousFrameTime = time;

    advanceFlight(this.state, elapsedSeconds);
    this.updateHud();
    this.render();

    if (this.state.phase === 'gameover') {
      this.finishRun();
      return;
    }
    this.animationFrame = requestAnimationFrame((nextTime) => this.tick(nextTime));
  }

  private finishRun(): void {
    if (this.runReported) return;
    this.runReported = true;
    const result = {
      distance: Math.floor(this.state.distance),
      coins: this.state.runCoins,
    };
    this.options.onRunComplete(result);
    this.elements.phase.textContent = 'RUN OVER';
    this.elements.result.textContent = `${result.distance} m · ${result.coins} coin${result.coins === 1 ? '' : 's'}`;
    this.elements.overlay.hidden = false;
    this.elements.announcer.textContent = `Run over at ${result.distance} metres with ${result.coins} coins.`;
    this.elements.restart.focus({ preventScroll: true });
    this.updateHud();
  }

  private updateHud(): void {
    this.elements.distance.textContent = `${Math.floor(this.state.distance)} m`;
    this.elements.coins.textContent = String(this.state.runCoins);
    this.elements.best.textContent = `${Math.max(this.options.bestDistance(), Math.floor(this.state.distance))} m`;
    const season = getSeasonVisual(this.state.elapsed);
    if (this.seasonLabel !== season.label) {
      this.seasonLabel = season.label;
      this.elements.season.textContent = season.label.toUpperCase();
    }
    if (this.state.phase === 'playing' && this.state.hugo.boostGlow === 0) {
      this.elements.phase.textContent = this.state.hugo.grounded ? 'RUNNING' : 'FLYING';
    }
  }

  private render(): void {
    const context = this.context;
    const season = getSeasonVisual(this.state.elapsed);
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.drawSeasonBackground(context, season);
    this.drawGround(context);
    this.drawSeasonAtmosphere(context, season);
    this.drawCoins(context);
    for (const obstacle of this.state.obstacles) this.drawObstacle(context, obstacle);
    this.drawHugo(context);
    this.drawStartHint(context);
  }

  private drawSeasonBackground(context: CanvasRenderingContext2D, season: SeasonVisual): void {
    const sky = context.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#70d8f2');
    sky.addColorStop(0.52, '#bdf2df');
    sky.addColorStop(1, '#f6e7a8');
    context.fillStyle = sky;
    context.fillRect(0, 0, GAME_WIDTH, GROUND_Y);

    if (!this.forestBackground.ready) return;

    const filterStep = Math.round(season.transition * 120);
    const cacheKey = `${season.current}-${season.next}-${filterStep}`;
    if (cacheKey !== this.backgroundCacheKey) {
      this.renderBackgroundBuffer(season);
      this.backgroundCacheKey = cacheKey;
    }
    context.drawImage(this.backgroundBuffer, 0, 0, GAME_WIDTH, GROUND_Y);
  }

  private renderBackgroundBuffer(season: SeasonVisual): void {
    const context = this.backgroundContext;
    const sourceWidth = this.forestBackground.naturalWidth;
    const sourceHeight = this.forestBackground.naturalHeight;
    const targetAspect = GAME_WIDTH / GROUND_Y;
    const sourceAspect = sourceWidth / sourceHeight;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    if (sourceAspect > targetAspect) cropWidth = sourceHeight * targetAspect;
    else cropHeight = sourceWidth / targetAspect;
    const sourceX = (sourceWidth - cropWidth) / 2;
    const sourceY = sourceHeight - cropHeight;

    context.clearRect(0, 0, GAME_WIDTH, GROUND_Y);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.filter = season.filter;
    context.drawImage(
      this.forestBackground,
      sourceX,
      sourceY,
      cropWidth,
      cropHeight,
      0,
      0,
      GAME_WIDTH,
      GROUND_Y,
    );
    context.filter = 'none';
  }

  private drawSeasonAtmosphere(context: CanvasRenderingContext2D, season: SeasonVisual): void {
    context.fillStyle = season.overlay;
    context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const winterWeight = season.particleWeights.winter;
    if (winterWeight > 0) {
      context.fillStyle = `rgba(232, 247, 255, ${(winterWeight * 0.72).toFixed(3)})`;
      context.fillRect(0, GROUND_Y, GAME_WIDTH, 13);
      context.fillStyle = `rgba(203, 229, 240, ${(winterWeight * 0.34).toFixed(3)})`;
      context.fillRect(0, GROUND_Y + 13, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 13);
    }

    for (const seasonId of ['spring', 'summer', 'autumn', 'winter'] as const) {
      const weight = season.particleWeights[seasonId];
      if (weight > 0.002) this.drawSeasonParticles(context, seasonId, weight);
    }
  }

  private drawSeasonParticles(context: CanvasRenderingContext2D, season: SeasonId, weight: number): void {
    const counts: Record<SeasonId, number> = { spring: 13, summer: 9, autumn: 16, winter: 24 };
    const speeds: Record<SeasonId, number> = { spring: 18, summer: 7, autumn: 30, winter: 25 };
    const elapsed = this.state.elapsed;
    context.save();
    context.globalAlpha = weight;
    for (let index = 0; index < counts[season]; index += 1) {
      const seed = index * 67.31 + (season === 'winter' ? 19 : season === 'autumn' ? 11 : 3);
      const x = modulo(seed * 5.7 + elapsed * (season === 'summer' ? 3 : -9), GAME_WIDTH + 50) - 25;
      const y = modulo(seed * 9.1 + elapsed * speeds[season], GROUND_Y - 70) + 70;
      context.save();
      context.translate(x, y);
      context.rotate(elapsed * 0.7 + seed);
      if (season === 'spring') {
        context.fillStyle = index % 3 === 0 ? '#fff0f6' : '#f2a9c6';
        context.beginPath();
        context.ellipse(0, 0, 5.5, 2.7, 0, 0, Math.PI * 2);
        context.fill();
      } else if (season === 'summer') {
        context.fillStyle = '#fff2a1';
        context.shadowColor = '#fff5b7';
        context.shadowBlur = 7;
        context.beginPath();
        context.arc(0, 0, 1.7 + (index % 2), 0, Math.PI * 2);
        context.fill();
      } else if (season === 'autumn') {
        context.fillStyle = index % 3 === 0 ? '#f6bd3d' : index % 2 === 0 ? '#d9512e' : '#e8872e';
        context.beginPath();
        context.ellipse(0, 0, 6, 3.2, 0.4, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillStyle = 'rgba(255,255,255,.92)';
        context.beginPath();
        context.arc(0, 0, 1.8 + (index % 4) * 0.65, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }
    context.restore();
  }

  private drawGround(context: CanvasRenderingContext2D): void {
    context.fillStyle = '#5f9f38';
    context.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
    context.fillStyle = '#9bd449';
    context.fillRect(0, GROUND_Y, GAME_WIDTH, 9);
    context.fillStyle = '#385d2f';
    context.fillRect(0, GROUND_Y + 18, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 18);

    const travel = this.state.distance / 0.085;
    context.fillStyle = 'rgba(221, 199, 115, .42)';
    for (let index = 0; index < 12; index += 1) {
      const x = modulo(index * 42 - travel, GAME_WIDTH + 42) - 20;
      context.fillRect(x, GROUND_Y + 34 + (index % 2) * 17, 20, 4);
    }
  }

  private drawCoins(context: CanvasRenderingContext2D): void {
    for (const coin of this.state.coins) {
      const pulse = 1 + Math.sin(this.state.elapsed * 8 + coin.id) * 0.08;
      context.save();
      context.translate(coin.x, coin.y);
      context.scale(pulse, pulse);
      context.fillStyle = 'rgba(255, 229, 75, .25)';
      context.beginPath();
      context.arc(0, 0, coin.radius + 6, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#ffca25';
      context.strokeStyle = '#a65b09';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(0, 0, coin.radius, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = '#fff2a5';
      context.font = '900 12px Inter, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('✦', 0, 0.5);
      context.restore();
    }
  }

  private drawObstacle(context: CanvasRenderingContext2D, obstacle: Obstacle): void {
    context.save();
    context.translate(obstacle.x, obstacle.y);
    const gradient = context.createLinearGradient(0, 0, obstacle.width, obstacle.height);
    gradient.addColorStop(0, obstacle.kind === 'boulder' ? '#8d8776' : '#a26332');
    gradient.addColorStop(1, obstacle.kind === 'boulder' ? '#4b5147' : '#543216');
    context.fillStyle = gradient;
    context.strokeStyle = '#263c24';
    context.lineWidth = 4;
    context.beginPath();
    context.roundRect(0, 0, obstacle.width, obstacle.height + 3, obstacle.kind === 'boulder' ? 13 : 7);
    context.fill();
    context.stroke();

    context.strokeStyle = obstacle.kind === 'boulder' ? '#aaa78e' : '#d18b45';
    context.lineWidth = 3;
    if (obstacle.kind === 'log') {
      for (let y = 18; y < obstacle.height; y += 22) {
        context.beginPath();
        context.moveTo(8, y);
        context.lineTo(obstacle.width - 8, y - 8);
        context.stroke();
      }
    } else if (obstacle.kind === 'boulder') {
      context.beginPath();
      context.moveTo(8, obstacle.height * 0.55);
      context.lineTo(obstacle.width * 0.45, 12);
      context.lineTo(obstacle.width - 8, obstacle.height * 0.43);
      context.stroke();
    } else {
      context.beginPath();
      context.ellipse(obstacle.width / 2, 7, obstacle.width * 0.37, 5, 0, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(12, 20);
      context.lineTo(obstacle.width - 12, obstacle.height - 12);
      context.stroke();
    }

    context.strokeStyle = 'rgba(255, 213, 71, .54)';
    context.lineWidth = 2;
    context.setLineDash([5, 5]);
    context.strokeRect(1, 1, obstacle.width - 2, obstacle.height - 1);
    context.restore();
  }

  private drawHugo(context: CanvasRenderingContext2D): void {
    const { hugo } = this.state;
    context.save();
    if (hugo.boostGlow > 0) {
      context.shadowColor = '#ffe061';
      context.shadowBlur = 20;
    }

    if (hugo.grounded && this.runCycleSprite.ready) {
      const runFrame = getRunFrame(this.state.elapsed);
      const drawHeight = 106;
      const drawWidth = drawHeight * (RUN_FRAME_WIDTH / RUN_FRAME_HEIGHT);
      context.drawImage(
        this.runCycleSprite,
        runFrame.sourceX,
        runFrame.sourceY,
        RUN_FRAME_WIDTH,
        RUN_FRAME_HEIGHT,
        hugo.x - 43,
        GROUND_Y - drawHeight + runFrame.verticalOffset,
        drawWidth,
        drawHeight,
      );
    } else if (this.flightSprite.ready) {
      const drawHeight = 122;
      const drawWidth = drawHeight * (467 / 768);
      context.drawImage(
        this.flightSprite,
        hugo.x - 19,
        hugo.y - 31,
        drawWidth,
        drawHeight,
      );
    } else {
      context.fillStyle = '#1cb6c9';
      context.beginPath();
      context.roundRect(hugo.x, hugo.y, HUGO_WIDTH, HUGO_HEIGHT, 14);
      context.fill();
    }
    context.restore();
  }

  private drawStartHint(context: CanvasRenderingContext2D): void {
    if (this.state.elapsed > 4.5 || this.state.phase !== 'playing') return;
    const alpha = this.state.elapsed < 2.7 ? 1 : Math.max(0, 1 - (this.state.elapsed - 2.7) / 1.8);
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = 'rgba(5, 31, 45, .82)';
    context.beginPath();
    context.roundRect(73, 160, 244, 76, 20);
    context.fill();
    context.strokeStyle = 'rgba(255,255,255,.55)';
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = '#fffbe0';
    context.textAlign = 'center';
    context.font = '900 19px Inter, sans-serif';
    context.fillText('TAP / CLICK TO BOOST', GAME_WIDTH / 2, 191);
    context.fillStyle = '#c9f7ff';
    context.font = '700 11px Inter, sans-serif';
    context.fillText('Space, ↑ or W also works', GAME_WIDTH / 2, 215);
    context.restore();
  }

  private createSprite(): LoadedSprite {
    const image = new Image() as LoadedSprite;
    image.decoding = 'async';
    image.addEventListener('load', () => {
      image.ready = true;
      this.render();
    });
    return image;
  }

  private ensureAssets(): void {
    if (this.assetsStarted) return;
    this.assetsStarted = true;
    this.flightSprite.src = hugoFlightUrl;
    this.runCycleSprite.src = hugoRunCycleUrl;
    this.forestBackground.src = forestSeasonUrl;
  }
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
