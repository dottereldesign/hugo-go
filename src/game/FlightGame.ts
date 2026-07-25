import hugoDoubleJumpCycleUrl from '../assets/game/hugo-double-jump-cycle.webp';
import hugoFreefallCycleUrl from '../assets/game/hugo-freefall-cycle.webp';
import hugoGlideCycleUrl from '../assets/game/hugo-glide-cycle.webp';
import hugoGrindCycleUrl from '../assets/game/hugo-grind-cycle.webp';
import hugoJumpLandCycleUrl from '../assets/game/hugo-jump-land-cycle.webp';
import hugoPoweredCycleUrl from '../assets/game/hugo-powered-cycle.webp';
import hugoRunCycleUrl from '../assets/game/hugo-run-60-cycle.webp';
import hugoWallRecoveryCycleUrl from '../assets/game/hugo-wall-recovery-cycle.webp';
import jetFlameCycleUrl from '../assets/game/jet-flame-cycle.webp';
import trailGroundUrl from '../assets/game/trail-ground.webp';
import {
  DOUBLE_JUMP_DURATION,
  CHARACTER_FRAME_HEIGHT,
  CHARACTER_FRAME_WIDTH,
  GRIND_FRAME_HEIGHT,
  GRIND_FRAME_WIDTH,
  JET_FLAME_FRAME_HEIGHT,
  JET_FLAME_FRAME_WIDTH,
  WALL_RECOVERY_DURATION,
  getDoubleJumpFrame,
  getDoubleJumpFrameLayout,
  getFlightLoopFrame,
  getFreefallLoopFrame,
  getGrindFrame,
  getJetFlameAnchors,
  getJetFlameFrame,
  getLandingFrame,
  getRunFrame,
  getTakeoffFrame,
  getWallRecoveryFrame,
  getWallStuckFrame,
  RUN_FRAME_HEIGHT,
  RUN_FRAME_WIDTH,
  TRANSITION_DURATION,
  type AtlasFrame,
  type FlightPoseKind,
} from './animation';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_Y,
  HUGO_HEIGHT,
  HUGO_WIDTH,
  advanceFlight,
  createFlightGame,
  getGrindingWire,
  getWireSlopeAtX,
  setFlightThrust,
  type FlightGameState,
  type Obstacle,
} from './engine';
import { getSeasonVisual, type SeasonVisual } from './seasons';

export interface RunResult {
  distance: number;
  coins: number;
}

interface FlightGameElements {
  canvas: HTMLCanvasElement;
  distance: HTMLElement;
  coins: HTMLElement;
  best: HTMLElement;
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

const RUN_DRAW_HEIGHT = 76;
const AIRBORNE_DRAW_HEIGHT = 84;
const GRIND_DRAW_HEIGHT = 82;
const JET_FLAME_SECOND_SHOE_OFFSET = 13;

export class FlightGame {
  private state = createFlightGame();
  private animationFrame = 0;
  private previousFrameTime = 0;
  private running = false;
  private runReported = false;
  private readonly context: CanvasRenderingContext2D;
  private skyGradient: CanvasGradient | null = null;
  private assetsStarted = false;
  private readonly poweredCycleSprite = this.createSprite();
  private readonly glideCycleSprite = this.createSprite();
  private readonly freefallCycleSprite = this.createSprite();
  private readonly jumpLandCycleSprite = this.createSprite();
  private readonly doubleJumpCycleSprite = this.createSprite();
  private readonly wallRecoveryCycleSprite = this.createSprite();
  private readonly runCycleSprite = this.createSprite();
  private readonly grindCycleSprite = this.createSprite();
  private readonly jetFlameCycleSprite = this.createSprite();
  private readonly trailGroundSprite = this.createSprite();
  private hudDistance = -1;
  private hudCoins = -1;
  private hudBest = -1;
  private activePointerId: number | null = null;
  private readonly thrustKeys = new Set<string>();
  private canvasPixelRatio = 1;
  private canvasBleedX = 0;
  private canvasBleedY = 0;
  private canvasViewportWidth = GAME_WIDTH;
  private canvasViewportHeight = GAME_HEIGHT;
  private canvasResizeObserver: ResizeObserver | null = null;

  constructor(
    private readonly elements: FlightGameElements,
    private readonly options: FlightGameOptions,
  ) {
    const context = elements.canvas.getContext('2d');
    if (!context) throw new Error('HUGO GO! needs Canvas 2D support.');
    this.context = context;
    this.configureCanvas();
    this.bindControls();
    if ('ResizeObserver' in window) {
      this.canvasResizeObserver = new ResizeObserver(() => this.configureCanvas());
      this.canvasResizeObserver.observe(elements.canvas);
    }
  }

  start(): void {
    this.configureCanvas();
    this.ensureAssets();
    this.clearThrustInputs();
    this.state = createFlightGame();
    this.runReported = false;
    this.running = true;
    this.previousFrameTime = performance.now();
    this.elements.overlay.hidden = true;
    this.elements.announcer.textContent = 'Forest run started.';
    this.updateHud();
    this.render();
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame((time) => this.tick(time));
  }

  stop(): void {
    this.clearThrustInputs();
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
  }

  getState(): Readonly<FlightGameState> {
    return this.state;
  }

  setThrusting(thrusting: boolean): void {
    if (!this.running) return;
    setFlightThrust(this.state, thrusting);
  }

  private bindControls(): void {
    this.elements.canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      if (this.activePointerId !== null) return;
      event.preventDefault();
      this.activePointerId = event.pointerId;
      this.elements.canvas.setPointerCapture?.(event.pointerId);
      this.syncThrustInput();
    });
    const releasePointer = (event: PointerEvent) => {
      if (event.pointerId !== this.activePointerId) return;
      this.activePointerId = null;
      this.syncThrustInput();
    };
    this.elements.canvas.addEventListener('pointerup', releasePointer);
    this.elements.canvas.addEventListener('pointercancel', releasePointer);
    this.elements.canvas.addEventListener('lostpointercapture', releasePointer);
    this.elements.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    this.elements.restart.addEventListener('click', () => this.start());
    window.addEventListener('keydown', (event) => {
      if (!this.running || !['Space', 'ArrowUp', 'KeyW'].includes(event.code)) return;
      event.preventDefault();
      this.thrustKeys.add(event.code);
      this.syncThrustInput();
    });
    window.addEventListener('keyup', (event) => {
      if (!['Space', 'ArrowUp', 'KeyW'].includes(event.code)) return;
      event.preventDefault();
      this.thrustKeys.delete(event.code);
      this.syncThrustInput();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clearThrustInputs();
        cancelAnimationFrame(this.animationFrame);
      } else if (this.running && this.state.phase === 'playing') {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = requestAnimationFrame((time) => this.tick(time));
      }
      this.previousFrameTime = performance.now();
    });
    window.addEventListener('blur', () => this.clearThrustInputs());
    window.addEventListener('resize', () => this.configureCanvas());
    window.visualViewport?.addEventListener('resize', () => this.configureCanvas());
  }

  private syncThrustInput(): void {
    this.setThrusting(this.activePointerId !== null || this.thrustKeys.size > 0);
  }

  private clearThrustInputs(): void {
    const pointerId = this.activePointerId;
    this.activePointerId = null;
    if (pointerId !== null && this.elements.canvas.hasPointerCapture?.(pointerId)) {
      this.elements.canvas.releasePointerCapture?.(pointerId);
    }
    this.thrustKeys.clear();
    if (this.state.phase === 'playing') setFlightThrust(this.state, false);
  }

  private configureCanvas(): void {
    // Keep the 390×780 playfield uniformly scaled. If a phone's safe areas leave a
    // wider or taller viewport, render extra scene around it instead of stretching
    // the game or exposing page-coloured gutters.
    const pixelRatio = 2;
    const bounds = this.elements.canvas.getBoundingClientRect();
    const cssWidth = bounds.width > 0 ? bounds.width : GAME_WIDTH;
    const cssHeight = bounds.height > 0 ? bounds.height : GAME_HEIGHT;
    const cssAspect = cssWidth / cssHeight;
    const gameAspect = GAME_WIDTH / GAME_HEIGHT;
    const viewportWidth = cssAspect >= gameAspect
      ? GAME_HEIGHT * cssAspect
      : GAME_WIDTH;
    const viewportHeight = cssAspect >= gameAspect
      ? GAME_HEIGHT
      : GAME_WIDTH / cssAspect;
    // Even dimensions keep the centered core translation on whole backing pixels,
    // preventing a half-pixel blur at devices whose ideal bleed width is fractional.
    const backingWidth = Math.round(viewportWidth * pixelRatio / 2) * 2;
    const backingHeight = Math.round(viewportHeight * pixelRatio / 2) * 2;

    this.canvasPixelRatio = pixelRatio;
    this.canvasViewportWidth = backingWidth / pixelRatio;
    this.canvasViewportHeight = backingHeight / pixelRatio;
    this.canvasBleedX = (this.canvasViewportWidth - GAME_WIDTH) / 2;
    this.canvasBleedY = (this.canvasViewportHeight - GAME_HEIGHT) / 2;
    if (
      this.elements.canvas.width !== backingWidth
      || this.elements.canvas.height !== backingHeight
    ) {
      this.elements.canvas.width = backingWidth;
      this.elements.canvas.height = backingHeight;
      this.skyGradient = null;
    }
    this.context.setTransform(
      pixelRatio,
      0,
      0,
      pixelRatio,
      this.canvasBleedX * pixelRatio,
      this.canvasBleedY * pixelRatio,
    );
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
    this.elements.result.textContent = `${result.distance} m · ${result.coins} coin${result.coins === 1 ? '' : 's'}`;
    this.elements.overlay.hidden = false;
    this.elements.announcer.textContent = `Run over at ${result.distance} metres with ${result.coins} coins.`;
    this.elements.restart.focus({ preventScroll: true });
    this.updateHud();
  }

  private updateHud(): void {
    const distance = Math.floor(this.state.distance);
    const best = Math.max(this.options.bestDistance(), distance);
    if (distance !== this.hudDistance) {
      this.hudDistance = distance;
      this.elements.distance.textContent = `${distance} m`;
    }
    if (this.state.runCoins !== this.hudCoins) {
      this.hudCoins = this.state.runCoins;
      this.elements.coins.textContent = String(this.state.runCoins);
    }
    if (best !== this.hudBest) {
      this.hudBest = best;
      this.elements.best.textContent = `${best} m`;
    }
  }

  private render(): void {
    const context = this.context;
    const season = getSeasonVisual(this.state.elapsed);
    context.clearRect(
      -this.canvasBleedX,
      -this.canvasBleedY,
      this.canvasViewportWidth,
      this.canvasViewportHeight,
    );
    this.drawSky(context);
    this.drawGround(context);
    this.drawSeasonAtmosphere(context, season);
    this.drawCoins(context);
    for (const obstacle of this.state.obstacles) this.drawObstacle(context, obstacle);
    this.drawHugo(context);
  }

  private drawSky(context: CanvasRenderingContext2D): void {
    if (!this.skyGradient) {
      this.skyGradient = context.createLinearGradient(0, 0, 0, GROUND_Y);
      this.skyGradient.addColorStop(0, '#20c8f3');
      this.skyGradient.addColorStop(1, '#31e1ff');
    }
    context.fillStyle = this.skyGradient;
    context.fillRect(
      -this.canvasBleedX,
      -this.canvasBleedY,
      this.canvasViewportWidth,
      GROUND_Y + this.canvasBleedY,
    );
  }

  private drawSeasonAtmosphere(context: CanvasRenderingContext2D, season: SeasonVisual): void {
    context.fillStyle = season.overlay;
    context.fillRect(
      -this.canvasBleedX,
      -this.canvasBleedY,
      this.canvasViewportWidth,
      this.canvasViewportHeight,
    );

    const winterWeight = season.particleWeights.winter;
    if (winterWeight > 0) {
      context.fillStyle = `rgba(232, 247, 255, ${(winterWeight * 0.72).toFixed(3)})`;
      context.fillRect(-this.canvasBleedX, GROUND_Y, this.canvasViewportWidth, 13);
      context.fillStyle = `rgba(203, 229, 240, ${(winterWeight * 0.34).toFixed(3)})`;
      context.fillRect(
        -this.canvasBleedX,
        GROUND_Y + 13,
        this.canvasViewportWidth,
        GAME_HEIGHT + this.canvasBleedY - GROUND_Y - 13,
      );
    }

  }

  private drawGround(context: CanvasRenderingContext2D): void {
    context.fillStyle = '#7c2818';
    context.fillRect(
      -this.canvasBleedX,
      GROUND_Y,
      this.canvasViewportWidth,
      GAME_HEIGHT + this.canvasBleedY - GROUND_Y,
    );
    if (!this.trailGroundSprite.ready) {
      context.fillStyle = '#e8892e';
      context.fillRect(-this.canvasBleedX, GROUND_Y, this.canvasViewportWidth, 10);
      return;
    }

    const drawHeight = 132;
    const drawWidth = drawHeight * (
      this.trailGroundSprite.naturalWidth / this.trailGroundSprite.naturalHeight
    );
    const travel = this.state.distance / 0.085;
    const firstX = -this.canvasBleedX - modulo(travel + this.canvasBleedX, drawWidth);
    const rightEdge = GAME_WIDTH + this.canvasBleedX;
    for (let x = firstX; x < rightEdge; x += drawWidth) {
      context.drawImage(
        this.trailGroundSprite,
        x,
        GROUND_Y - 33,
        drawWidth,
        drawHeight,
      );
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
    if (obstacle.kind === 'wire') {
      this.drawGrindingWire(context, obstacle);
      return;
    }

    context.save();
    context.translate(obstacle.x, obstacle.y);
    context.fillStyle = obstacle.kind === 'log'
      ? '#ed334e'
      : obstacle.kind === 'boulder' ? '#d8204f' : '#bb173f';
    context.strokeStyle = '#6f0d2b';
    context.lineWidth = 4;
    if (obstacle.kind === 'log') {
      context.beginPath();
      context.roundRect(0, 0, obstacle.width, obstacle.height + 3, 8);
      context.fill();
      context.stroke();
      context.save();
      context.beginPath();
      context.roundRect(2, 2, obstacle.width - 4, obstacle.height - 1, 6);
      context.clip();
      context.strokeStyle = '#ff7890';
      context.lineWidth = 7;
      for (let x = -obstacle.height; x < obstacle.width; x += 28) {
        context.beginPath();
        context.moveTo(x, obstacle.height);
        context.lineTo(x + obstacle.height, 0);
        context.stroke();
      }
      context.restore();
    } else if (obstacle.kind === 'boulder') {
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(obstacle.width, 0);
      context.lineTo(obstacle.width * 0.86, obstacle.height);
      context.lineTo(obstacle.width * 0.14, obstacle.height);
      context.closePath();
      context.fill();
      context.stroke();
      context.strokeStyle = '#ff6d8d';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(4, 4);
      context.lineTo(obstacle.width * 0.48, obstacle.height * 0.43);
      context.lineTo(obstacle.width * 0.23, obstacle.height);
      context.moveTo(obstacle.width - 4, 4);
      context.lineTo(obstacle.width * 0.48, obstacle.height * 0.43);
      context.lineTo(obstacle.width * 0.74, obstacle.height);
      context.stroke();
    } else {
      context.beginPath();
      context.rect(0, 0, obstacle.width, obstacle.height + 3);
      context.fill();
      context.stroke();
      context.fillStyle = '#ed345c';
      context.fillRect(8, 8, obstacle.width - 16, obstacle.height - 13);
      context.strokeStyle = '#ff7895';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(obstacle.width / 2, 10);
      context.lineTo(obstacle.width / 2, obstacle.height - 9);
      context.moveTo(10, obstacle.height * 0.33);
      context.lineTo(obstacle.width - 10, obstacle.height * 0.33);
      context.moveTo(10, obstacle.height * 0.66);
      context.lineTo(obstacle.width - 10, obstacle.height * 0.66);
      context.stroke();
    }

    context.strokeStyle = 'rgba(255, 185, 199, .72)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(5, 5);
    context.lineTo(obstacle.width - 5, 5);
    context.stroke();
    context.restore();
  }

  private drawGrindingWire(context: CanvasRenderingContext2D, obstacle: Obstacle): void {
    const sag = obstacle.sag ?? 0;
    const poleTop = -28;
    const poleBottom = obstacle.height + 18;
    const drawPole = (x: number) => {
      context.fillStyle = '#b81740';
      context.strokeStyle = '#650c29';
      context.lineWidth = 4;
      context.beginPath();
      context.roundRect(x - 8, poleTop, 16, poleBottom - poleTop, 6);
      context.fill();
      context.stroke();

      context.fillStyle = '#f04a68';
      context.fillRect(x - 3, poleTop + 7, 4, poleBottom - poleTop - 15);
      context.fillStyle = '#5b1730';
      context.beginPath();
      context.roundRect(x - 18, poleTop - 4, 36, 10, 5);
      context.fill();
      context.stroke();

      context.fillStyle = '#ffd45c';
      context.beginPath();
      context.arc(x, -1, 5.5, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#6f3e12';
      context.lineWidth = 2;
      context.stroke();
    };

    context.save();
    context.translate(obstacle.x, obstacle.y);
    drawPole(0);
    drawPole(obstacle.width);

    context.lineCap = 'round';
    context.strokeStyle = 'rgba(44, 18, 38, .38)';
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(obstacle.width / 2, sag * 2, obstacle.width, 0);
    context.stroke();

    context.strokeStyle = '#42263f';
    context.lineWidth = 3.2;
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(obstacle.width / 2, sag * 2, obstacle.width, 0);
    context.stroke();

    context.strokeStyle = 'rgba(215, 235, 241, .76)';
    context.lineWidth = 1.1;
    context.beginPath();
    context.moveTo(0, -1);
    context.quadraticCurveTo(obstacle.width / 2, sag * 2 - 1, obstacle.width, -1);
    context.stroke();
    context.restore();
  }

  private drawHugo(context: CanvasRenderingContext2D): void {
    const { hugo } = this.state;
    const grindingWire = getGrindingWire(this.state);

    if (grindingWire) {
      const contactX = hugo.x + HUGO_WIDTH / 2;
      const contactY = hugo.y + HUGO_HEIGHT;
      const cableAngle = Math.atan(getWireSlopeAtX(grindingWire, contactX));
      context.save();
      context.translate(
        this.snapToDevicePixel(contactX),
        this.snapToDevicePixel(contactY),
      );
      context.rotate(cableAngle);
      this.drawGrindingSparks(context);
      if (this.grindCycleSprite.ready) {
        const frame = getGrindFrame(hugo.grindTime);
        const drawWidth = GRIND_DRAW_HEIGHT * (GRIND_FRAME_WIDTH / GRIND_FRAME_HEIGHT);
        const shoeEdgePadding = GRIND_DRAW_HEIGHT * (4 / GRIND_FRAME_HEIGHT);
        context.drawImage(
          this.grindCycleSprite,
          frame.sourceX,
          frame.sourceY,
          GRIND_FRAME_WIDTH,
          GRIND_FRAME_HEIGHT,
          -drawWidth / 2,
          -GRIND_DRAW_HEIGHT + shoeEdgePadding,
          drawWidth,
          GRIND_DRAW_HEIGHT,
        );
      } else {
        context.fillStyle = '#1cb6c9';
        context.beginPath();
        context.roundRect(-HUGO_WIDTH / 2, -HUGO_HEIGHT, HUGO_WIDTH, HUGO_HEIGHT, 14);
        context.fill();
      }
      context.restore();
      return;
    }

    if (hugo.grounded && hugo.groundedTime >= TRANSITION_DURATION && this.runCycleSprite.ready) {
      const runFrame = getRunFrame(this.state.elapsed);
      const drawHeight = RUN_DRAW_HEIGHT;
      const drawWidth = drawHeight * (RUN_FRAME_WIDTH / RUN_FRAME_HEIGHT);
      const drawX = this.snapToDevicePixel(hugo.x + HUGO_WIDTH / 2 - drawWidth / 2);
      context.save();
      context.drawImage(
        this.runCycleSprite,
        runFrame.sourceX,
        runFrame.sourceY,
        RUN_FRAME_WIDTH,
        RUN_FRAME_HEIGHT,
        drawX,
        this.snapToDevicePixel(hugo.y + HUGO_HEIGHT - drawHeight + runFrame.verticalOffset),
        drawWidth,
        drawHeight,
      );
      context.restore();
      return;
    }

    const animatedPose = this.getAnimatedFlightPose();
    if (animatedPose) {
      const baseDrawWidth = AIRBORNE_DRAW_HEIGHT
        * (CHARACTER_FRAME_WIDTH / CHARACTER_FRAME_HEIGHT);
      const baseDrawX = hugo.x + HUGO_WIDTH / 2 - baseDrawWidth / 2;
      const baseDrawY = hugo.y + HUGO_HEIGHT - AIRBORNE_DRAW_HEIGHT;
      const frameLayout = animatedPose.kind === 'doubleJump'
        ? getDoubleJumpFrameLayout(animatedPose.frame.index)
        : { scale: 1, verticalOffset: 0 };
      const drawHeight = AIRBORNE_DRAW_HEIGHT * frameLayout.scale;
      const drawWidth = baseDrawWidth * frameLayout.scale;
      const drawX = this.snapToDevicePixel(baseDrawX + (baseDrawWidth - drawWidth) / 2);
      const drawY = this.snapToDevicePixel(
        baseDrawY + AIRBORNE_DRAW_HEIGHT * frameLayout.verticalOffset,
      );

      if (
        !hugo.grounded
        && hugo.thrustIntensity > 0.01
        && (animatedPose.kind === 'powered' || animatedPose.kind === 'glide')
      ) {
        this.drawJetFlames(
          context,
          drawX,
          drawY,
          drawWidth,
          drawHeight,
          hugo.thrustIntensity,
          animatedPose.kind,
          animatedPose.frame.index,
        );
      }

      if (animatedPose.kind === 'doubleJump') {
        this.drawDoubleJumpEffect(context);
      } else if (animatedPose.kind === 'wall' && hugo.stuckObstacleId !== null) {
        this.drawWallImpactEffect(context);
      }

      context.save();
      if (
        (animatedPose.kind === 'powered' || animatedPose.kind === 'glide')
        && hugo.thrustIntensity > 0.12
      ) {
        context.shadowColor = 'rgba(70, 232, 255, .72)';
        context.shadowBlur = 12 * hugo.thrustIntensity;
      }
      context.drawImage(
        animatedPose.sprite,
        animatedPose.frame.sourceX,
        animatedPose.frame.sourceY,
        CHARACTER_FRAME_WIDTH,
        CHARACTER_FRAME_HEIGHT,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
      );
      context.restore();
    } else {
      context.save();
      context.fillStyle = '#1cb6c9';
      context.beginPath();
      context.roundRect(hugo.x, hugo.y, HUGO_WIDTH, HUGO_HEIGHT, 14);
      context.fill();
      context.restore();
    }
  }

  private drawGrindingSparks(context: CanvasRenderingContext2D): void {
    const pulse = this.state.hugo.grindTime * 30;
    context.save();
    for (let shoe = 0; shoe < 2; shoe += 1) {
      const shoeX = shoe === 0 ? -27 : 28;
      for (let index = 0; index < 3; index += 1) {
        const phase = modulo(Math.floor(pulse) + shoe * 4 + index * 3, 9) / 9;
        const length = 3 + phase * 8;
        context.globalAlpha = 0.28 + (1 - phase) * 0.58;
        context.strokeStyle = index === 0 ? '#fff5b0' : '#ffb42f';
        context.lineWidth = 0.8 + (1 - phase) * 1.1;
        context.beginPath();
        context.moveTo(shoeX, 0);
        context.lineTo(shoeX - length, 2 + phase * 7 + index);
        context.stroke();
      }
    }
    context.restore();
  }

  private getAnimatedFlightPose(): {
    sprite: LoadedSprite;
    frame: AtlasFrame;
    kind: FlightPoseKind | 'freefall' | 'transition' | 'doubleJump' | 'wall';
  } | null {
    const { hugo } = this.state;
    if (hugo.stuckObstacleId !== null && this.wallRecoveryCycleSprite.ready) {
      return {
        sprite: this.wallRecoveryCycleSprite,
        frame: getWallStuckFrame(hugo.stuckTime),
        kind: 'wall',
      };
    }
    if (hugo.recoveryTime < WALL_RECOVERY_DURATION && this.wallRecoveryCycleSprite.ready) {
      return {
        sprite: this.wallRecoveryCycleSprite,
        frame: getWallRecoveryFrame(hugo.recoveryTime),
        kind: 'wall',
      };
    }
    if (hugo.doubleJumpTime < DOUBLE_JUMP_DURATION && this.doubleJumpCycleSprite.ready) {
      return {
        sprite: this.doubleJumpCycleSprite,
        frame: getDoubleJumpFrame(hugo.doubleJumpTime),
        kind: 'doubleJump',
      };
    }
    if (hugo.grounded && this.jumpLandCycleSprite.ready) {
      return {
        sprite: this.jumpLandCycleSprite,
        frame: getLandingFrame(hugo.groundedTime),
        kind: 'transition',
      };
    }
    if (!hugo.grounded && hugo.jumpTime < TRANSITION_DURATION && this.jumpLandCycleSprite.ready) {
      return {
        sprite: this.jumpLandCycleSprite,
        frame: getTakeoffFrame(hugo.jumpTime),
        kind: 'transition',
      };
    }
    if (hugo.thrusting && this.poweredCycleSprite.ready) {
      return {
        sprite: this.poweredCycleSprite,
        frame: getFlightLoopFrame(this.state.elapsed),
        kind: 'powered',
      };
    }
    if (hugo.velocityY > 45 && this.freefallCycleSprite.ready) {
      return {
        sprite: this.freefallCycleSprite,
        frame: getFreefallLoopFrame(this.state.elapsed),
        kind: 'freefall',
      };
    }
    if (this.glideCycleSprite.ready) {
      return {
        sprite: this.glideCycleSprite,
        frame: getFlightLoopFrame(this.state.elapsed),
        kind: 'glide',
      };
    }
    return null;
  }

  private drawDoubleJumpEffect(context: CanvasRenderingContext2D): void {
    const progress = clamp01(this.state.hugo.doubleJumpTime / DOUBLE_JUMP_DURATION);
    const centerX = this.state.hugo.x + HUGO_WIDTH / 2;
    const centerY = this.state.hugo.y + HUGO_HEIGHT / 2;
    context.save();
    context.translate(centerX, centerY);
    context.rotate(this.state.hugo.doubleJumpTime * 11);
    context.globalAlpha = Math.sin(progress * Math.PI) * 0.72;
    context.strokeStyle = '#fff0a3';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, 24 + progress * 18, -0.4, 1.8);
    context.stroke();
    context.strokeStyle = '#63f4ff';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, 31 + progress * 22, 2.3, 5.7);
    context.stroke();
    context.fillStyle = '#fff6b8';
    for (let index = 0; index < 5; index += 1) {
      const angle = index * (Math.PI * 2 / 5);
      const radius = 34 + progress * 24;
      context.beginPath();
      context.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 2.2, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  private drawWallImpactEffect(context: CanvasRenderingContext2D): void {
    const impact = clamp01(1 - this.state.hugo.stuckTime / 0.24);
    if (impact <= 0) return;
    const x = this.state.hugo.x + HUGO_WIDTH + 2;
    const y = this.state.hugo.y + HUGO_HEIGHT / 2;
    context.save();
    context.globalAlpha = impact * 0.7;
    context.strokeStyle = '#ffd1da';
    context.lineWidth = 3;
    for (let index = -2; index <= 2; index += 1) {
      context.beginPath();
      context.moveTo(x + 3, y + index * 8);
      context.lineTo(x + 12 + impact * 10, y + index * 13);
      context.stroke();
    }
    context.restore();
  }

  private drawJetFlames(
    context: CanvasRenderingContext2D,
    drawX: number,
    drawY: number,
    drawWidth: number,
    drawHeight: number,
    intensity: number,
    pose: FlightPoseKind,
    frameIndex: number,
  ): void {
    if (!this.jetFlameCycleSprite.ready) return;
    const anchors = getJetFlameAnchors(pose, frameIndex);

    for (const [index, anchor] of anchors.entries()) {
      const flameFrame = getJetFlameFrame(
        this.state.elapsed,
        index * JET_FLAME_SECOND_SHOE_OFFSET,
      );
      const flameHeight = 8 + intensity * 25;
      const flameWidth = flameHeight * (JET_FLAME_FRAME_WIDTH / JET_FLAME_FRAME_HEIGHT);
      context.save();
      context.translate(drawX + drawWidth * anchor.x, drawY + drawHeight * anchor.y);
      context.rotate(anchor.angle);
      context.globalAlpha = 0.55 + intensity * 0.45;
      context.shadowColor = 'rgba(70, 232, 255, .68)';
      context.shadowBlur = 4 + intensity * 5;
      context.drawImage(
        this.jetFlameCycleSprite,
        flameFrame.sourceX,
        flameFrame.sourceY,
        JET_FLAME_FRAME_WIDTH,
        JET_FLAME_FRAME_HEIGHT,
        -flameWidth / 2,
        -flameHeight * (4 / JET_FLAME_FRAME_HEIGHT),
        flameWidth,
        flameHeight,
      );
      context.restore();
    }
  }

  private snapToDevicePixel(value: number): number {
    return Math.round(value * this.canvasPixelRatio) / this.canvasPixelRatio;
  }

  private createSprite(): LoadedSprite {
    const image = new Image() as LoadedSprite;
    image.decoding = 'async';
    image.addEventListener('load', () => {
      image.ready = true;
      this.render();
      if (typeof image.decode === 'function') {
        void image.decode().then(
          () => this.render(),
          () => undefined,
        );
      }
    });
    return image;
  }

  private ensureAssets(): void {
    if (this.assetsStarted) return;
    this.assetsStarted = true;
    this.poweredCycleSprite.src = hugoPoweredCycleUrl;
    this.glideCycleSprite.src = hugoGlideCycleUrl;
    this.freefallCycleSprite.src = hugoFreefallCycleUrl;
    this.jumpLandCycleSprite.src = hugoJumpLandCycleUrl;
    this.doubleJumpCycleSprite.src = hugoDoubleJumpCycleUrl;
    this.wallRecoveryCycleSprite.src = hugoWallRecoveryCycleUrl;
    this.runCycleSprite.src = hugoRunCycleUrl;
    this.grindCycleSprite.src = hugoGrindCycleUrl;
    this.jetFlameCycleSprite.src = jetFlameCycleUrl;
    this.trailGroundSprite.src = trailGroundUrl;
  }
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
