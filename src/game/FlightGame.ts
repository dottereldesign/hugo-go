import hugoFlightUrl from '../assets/game/hugo-flight.webp';
import hugoRunUrl from '../assets/game/hugo-run.webp';
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
  private readonly flightSprite = this.loadSprite(hugoFlightUrl);
  private readonly runSprite = this.loadSprite(hugoRunUrl);

  constructor(
    private readonly elements: FlightGameElements,
    private readonly options: FlightGameOptions,
  ) {
    const context = elements.canvas.getContext('2d');
    if (!context) throw new Error('HUGO GO! needs Canvas 2D support.');
    this.context = context;
    this.configureCanvas();
    this.bindControls();
  }

  start(): void {
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
    if (this.state.phase === 'playing' && this.state.hugo.boostGlow === 0) {
      this.elements.phase.textContent = this.state.hugo.grounded ? 'RUNNING' : 'FLYING';
    }
  }

  private render(): void {
    const context = this.context;
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.drawSky(context);
    this.drawDistantLandscape(context);
    this.drawForest(context);
    this.drawCoins(context);
    for (const obstacle of this.state.obstacles) this.drawObstacle(context, obstacle);
    this.drawGround(context);
    this.drawHugo(context);
    this.drawStartHint(context);
  }

  private drawSky(context: CanvasRenderingContext2D): void {
    const sky = context.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#70d8f2');
    sky.addColorStop(0.52, '#bdf2df');
    sky.addColorStop(1, '#f6e7a8');
    context.fillStyle = sky;
    context.fillRect(0, 0, GAME_WIDTH, GROUND_Y);

    context.fillStyle = 'rgba(255, 246, 172, .9)';
    context.beginPath();
    context.arc(314, 112, 44, 0, Math.PI * 2);
    context.fill();

    const travel = this.state.distance / 0.085;
    for (let index = 0; index < 11; index += 1) {
      const x = modulo(index * 83 - travel * 0.14, GAME_WIDTH + 90) - 25;
      const y = 116 + (index % 4) * 62;
      context.save();
      context.translate(x, y);
      context.rotate((index % 2 ? -1 : 1) * 0.3);
      context.fillStyle = index % 3 === 0 ? 'rgba(255, 184, 204, .74)' : 'rgba(255, 237, 191, .7)';
      context.beginPath();
      context.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
  }

  private drawDistantLandscape(context: CanvasRenderingContext2D): void {
    const travel = this.state.distance / 0.085;
    const mountainShift = modulo(-travel * 0.06, GAME_WIDTH * 1.8);
    context.save();
    context.translate(mountainShift, 0);
    for (let repeat = -1; repeat < 3; repeat += 1) {
      const offset = repeat * GAME_WIDTH * 1.8;
      context.fillStyle = 'rgba(77, 132, 121, .42)';
      context.beginPath();
      context.moveTo(offset - 100, 510);
      context.lineTo(offset + 170, 218);
      context.lineTo(offset + 432, 510);
      context.closePath();
      context.fill();
      context.fillStyle = 'rgba(244, 250, 227, .72)';
      context.beginPath();
      context.moveTo(offset + 118, 274);
      context.lineTo(offset + 170, 218);
      context.lineTo(offset + 218, 271);
      context.lineTo(offset + 190, 262);
      context.lineTo(offset + 168, 286);
      context.lineTo(offset + 145, 262);
      context.closePath();
      context.fill();
    }
    context.restore();

    context.fillStyle = '#4e9672';
    context.beginPath();
    context.moveTo(0, 485);
    for (let x = 0; x <= GAME_WIDTH; x += 28) {
      context.lineTo(x, 455 - ((x / 28) % 3) * 24);
    }
    context.lineTo(GAME_WIDTH, GROUND_Y);
    context.lineTo(0, GROUND_Y);
    context.closePath();
    context.fill();
  }

  private drawForest(context: CanvasRenderingContext2D): void {
    const travel = this.state.distance / 0.085;
    for (let index = 0; index < 9; index += 1) {
      const x = modulo(index * 69 - travel * 0.42, GAME_WIDTH + 110) - 55;
      const height = 142 + (index % 3) * 34;
      context.fillStyle = index % 2 ? '#246c4f' : '#2f7b55';
      context.fillRect(x + 19, GROUND_Y - height, 14, height);
      context.fillStyle = index % 3 === 0 ? '#d86062' : '#2b8d5c';
      for (let tier = 0; tier < 4; tier += 1) {
        const tierY = GROUND_Y - height + tier * 35;
        context.beginPath();
        context.moveTo(x + 26, tierY - 24);
        context.lineTo(x - 12 - tier * 3, tierY + 38);
        context.lineTo(x + 64 + tier * 3, tierY + 38);
        context.closePath();
        context.fill();
      }
    }

    // Natural silver-fern-like fronds: botanical scenery, never a cultural motif.
    context.strokeStyle = '#b8e38c';
    context.lineWidth = 3;
    for (let index = 0; index < 6; index += 1) {
      const x = modulo(index * 92 - travel * 0.68, GAME_WIDTH + 90) - 40;
      const baseY = GROUND_Y - 9;
      context.beginPath();
      context.moveTo(x, baseY);
      context.quadraticCurveTo(x + 18, baseY - 52, x + 47, baseY - 70);
      context.stroke();
      for (let leaf = 0; leaf < 6; leaf += 1) {
        const leafX = x + 9 + leaf * 6;
        const leafY = baseY - 27 - leaf * 7;
        context.beginPath();
        context.moveTo(leafX, leafY);
        context.lineTo(leafX - 15, leafY - 7);
        context.moveTo(leafX + 2, leafY - 3);
        context.lineTo(leafX + 16, leafY - 14);
        context.stroke();
      }
    }
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
    const bob = hugo.grounded ? Math.sin(this.state.elapsed * 16) * 1.6 : 0;
    context.save();
    if (hugo.boostGlow > 0) {
      context.shadowColor = '#ffe061';
      context.shadowBlur = 20;
    }

    if (hugo.grounded && this.runSprite.ready) {
      const drawHeight = 102;
      const drawWidth = drawHeight * (605 / 768);
      context.drawImage(
        this.runSprite,
        hugo.x - 23,
        GROUND_Y - drawHeight + bob,
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

  private loadSprite(url: string): LoadedSprite {
    const image = new Image() as LoadedSprite;
    image.decoding = 'async';
    image.addEventListener('load', () => {
      image.ready = true;
      this.render();
    });
    image.src = url;
    return image;
  }
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
