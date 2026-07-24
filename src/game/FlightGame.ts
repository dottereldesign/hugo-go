import hugoDoubleJumpCycleUrl from '../assets/game/hugo-double-jump-cycle.webp';
import hugoGlideCycleUrl from '../assets/game/hugo-glide-cycle.webp';
import hugoJumpLandCycleUrl from '../assets/game/hugo-jump-land-cycle.webp';
import hugoPoweredCycleUrl from '../assets/game/hugo-powered-cycle.webp';
import hugoRunCycleUrl from '../assets/game/hugo-run-cycle.webp';
import hugoWallRecoveryCycleUrl from '../assets/game/hugo-wall-recovery-cycle.webp';
import trailGroundUrl from '../assets/game/trail-ground.webp';
import {
  DOUBLE_JUMP_DURATION,
  WALL_RECOVERY_DURATION,
  getDoubleJumpFrame,
  getDoubleJumpFrameLayout,
  getFlightLoopFrame,
  getJetFlameAnchors,
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
  setFlightThrust,
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

export const JET_FLAME_COLORS = {
  core: '#fff1bd',
  inner: '#ffad16',
  outer: '#e53b18',
  tip: '#8f160f',
  glow: 'rgba(207, 39, 17, .56)',
} as const;

const RUN_DRAW_HEIGHT = 76;
const AIRBORNE_DRAW_HEIGHT = 84;

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
  private readonly jumpLandCycleSprite = this.createSprite();
  private readonly doubleJumpCycleSprite = this.createSprite();
  private readonly wallRecoveryCycleSprite = this.createSprite();
  private readonly runCycleSprite = this.createSprite();
  private readonly trailGroundSprite = this.createSprite();
  private hudDistance = -1;
  private hudCoins = -1;
  private hudBest = -1;
  private activePointerId: number | null = null;
  private readonly thrustKeys = new Set<string>();

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
    this.ensureAssets();
    this.clearThrustInputs();
    this.state = createFlightGame();
    this.runReported = false;
    this.running = true;
    this.previousFrameTime = performance.now();
    this.elements.overlay.hidden = true;
    this.elements.announcer.textContent = 'Forest run started. Press and hold to jump, then fly upward; release to descend.';
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
    const pixelRatioLimit = window.innerWidth <= 680 ? 1 : 2;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, pixelRatioLimit);
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
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.drawSky(context);
    this.drawGround(context);
    this.drawSeasonAtmosphere(context, season);
    this.drawCoins(context);
    for (const obstacle of this.state.obstacles) this.drawObstacle(context, obstacle);
    this.drawHugo(context);
    this.drawStartHint(context);
  }

  private drawSky(context: CanvasRenderingContext2D): void {
    if (!this.skyGradient) {
      this.skyGradient = context.createLinearGradient(0, 0, 0, GROUND_Y);
      this.skyGradient.addColorStop(0, '#20c8f3');
      this.skyGradient.addColorStop(1, '#31e1ff');
    }
    context.fillStyle = this.skyGradient;
    context.fillRect(0, 0, GAME_WIDTH, GROUND_Y);
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
    context.fillStyle = '#7c2818';
    context.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
    if (!this.trailGroundSprite.ready) {
      context.fillStyle = '#e8892e';
      context.fillRect(0, GROUND_Y, GAME_WIDTH, 10);
      return;
    }

    const drawHeight = 132;
    const drawWidth = drawHeight * (
      this.trailGroundSprite.naturalWidth / this.trailGroundSprite.naturalHeight
    );
    const travel = this.state.distance / 0.085;
    const firstX = -modulo(travel, drawWidth);
    for (let x = firstX; x < GAME_WIDTH; x += drawWidth) {
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

  private drawHugo(context: CanvasRenderingContext2D): void {
    const { hugo } = this.state;

    if (hugo.grounded && hugo.groundedTime >= TRANSITION_DURATION && this.runCycleSprite.ready) {
      const runFrame = getRunFrame(this.state.elapsed);
      const drawHeight = RUN_DRAW_HEIGHT;
      const drawWidth = drawHeight * (RUN_FRAME_WIDTH / RUN_FRAME_HEIGHT);
      const drawX = hugo.x + HUGO_WIDTH / 2 - drawWidth / 2;
      context.save();
      context.drawImage(
        this.runCycleSprite,
        runFrame.sourceX,
        runFrame.sourceY,
        RUN_FRAME_WIDTH,
        RUN_FRAME_HEIGHT,
        drawX,
        hugo.y + HUGO_HEIGHT - drawHeight + runFrame.verticalOffset,
        drawWidth,
        drawHeight,
      );
      context.restore();
      return;
    }

    const animatedPose = this.getAnimatedFlightPose();
    if (animatedPose) {
      const baseDrawWidth = AIRBORNE_DRAW_HEIGHT * (RUN_FRAME_WIDTH / RUN_FRAME_HEIGHT);
      const baseDrawX = hugo.x + HUGO_WIDTH / 2 - baseDrawWidth / 2;
      const baseDrawY = hugo.y + HUGO_HEIGHT - AIRBORNE_DRAW_HEIGHT;
      const frameLayout = animatedPose.kind === 'doubleJump'
        ? getDoubleJumpFrameLayout(animatedPose.frame.index)
        : { scale: 1, verticalOffset: 0 };
      const drawHeight = AIRBORNE_DRAW_HEIGHT * frameLayout.scale;
      const drawWidth = baseDrawWidth * frameLayout.scale;
      const drawX = baseDrawX + (baseDrawWidth - drawWidth) / 2;
      const drawY = baseDrawY + AIRBORNE_DRAW_HEIGHT * frameLayout.verticalOffset;

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
        context.shadowColor = JET_FLAME_COLORS.glow;
        context.shadowBlur = 12 * hugo.thrustIntensity;
      }
      context.drawImage(
        animatedPose.sprite,
        animatedPose.frame.sourceX,
        animatedPose.frame.sourceY,
        RUN_FRAME_WIDTH,
        RUN_FRAME_HEIGHT,
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

  private getAnimatedFlightPose(): {
    sprite: LoadedSprite;
    frame: AtlasFrame;
    kind: FlightPoseKind | 'transition' | 'doubleJump' | 'wall';
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
    const anchors = getJetFlameAnchors(pose, frameIndex);

    for (const [index, anchor] of anchors.entries()) {
      const flicker = 0.92 + Math.sin(this.state.elapsed * 31 + index * 2.3) * 0.08;
      const flameLength = (12 + intensity * 25) * flicker;
      const flameWidth = 3.8 + intensity * 4.6;
      context.save();
      context.translate(drawX + drawWidth * anchor.x, drawY + drawHeight * anchor.y);
      context.rotate(anchor.angle);
      context.globalAlpha = 0.42 + intensity * 0.58;

      const glow = context.createRadialGradient(0, 5, 0, 0, 8, flameLength * 0.82);
      glow.addColorStop(0, JET_FLAME_COLORS.glow);
      glow.addColorStop(1, 'rgba(63, 224, 255, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.ellipse(0, flameLength * 0.45, flameWidth * 2.1, flameLength * 0.72, 0, 0, Math.PI * 2);
      context.fill();

      const outer = context.createLinearGradient(0, 0, 0, flameLength);
      outer.addColorStop(0, JET_FLAME_COLORS.core);
      outer.addColorStop(0.24, JET_FLAME_COLORS.inner);
      outer.addColorStop(0.58, JET_FLAME_COLORS.outer);
      outer.addColorStop(1, JET_FLAME_COLORS.tip);
      context.fillStyle = outer;
      context.beginPath();
      context.moveTo(-flameWidth, 0);
      context.quadraticCurveTo(-flameWidth * 0.84, flameLength * 0.48, 0, flameLength);
      context.quadraticCurveTo(flameWidth * 0.84, flameLength * 0.48, flameWidth, 0);
      context.closePath();
      context.fill();

      context.fillStyle = JET_FLAME_COLORS.core;
      context.beginPath();
      context.moveTo(-flameWidth * 0.37, 0);
      context.quadraticCurveTo(0, flameLength * 0.53, flameWidth * 0.18, flameLength * 0.64);
      context.quadraticCurveTo(flameWidth * 0.42, flameLength * 0.24, flameWidth * 0.37, 0);
      context.closePath();
      context.fill();
      context.restore();
    }
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
    context.fillText('HOLD TO JUMP + FLY', GAME_WIDTH / 2, 191);
    context.fillStyle = '#c9f7ff';
    context.font = '700 11px Inter, sans-serif';
    context.fillText('Quick re-press = double jump · Hold if stuck', GAME_WIDTH / 2, 215);
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
    this.poweredCycleSprite.src = hugoPoweredCycleUrl;
    this.glideCycleSprite.src = hugoGlideCycleUrl;
    this.jumpLandCycleSprite.src = hugoJumpLandCycleUrl;
    this.doubleJumpCycleSprite.src = hugoDoubleJumpCycleUrl;
    this.wallRecoveryCycleSprite.src = hugoWallRecoveryCycleUrl;
    this.runCycleSprite.src = hugoRunCycleUrl;
    this.trailGroundSprite.src = trailGroundUrl;
  }
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
