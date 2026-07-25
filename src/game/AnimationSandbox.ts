import hugoDoubleJumpCycleUrl from '../assets/game/hugo-double-jump-cycle.webp';
import hugoFreefallCycleUrl from '../assets/game/hugo-freefall-cycle.webp';
import hugoGlideCycleUrl from '../assets/game/hugo-glide-cycle.webp';
import hugoGrindCycleUrl from '../assets/game/hugo-grind-cycle.webp';
import hugoJumpLandCycleUrl from '../assets/game/hugo-jump-land-cycle.webp';
import hugoPoweredCycleUrl from '../assets/game/hugo-powered-cycle.webp';
import hugoRunCycleUrl from '../assets/game/hugo-run-60-cycle.webp';
import hugoWallRecoveryCycleUrl from '../assets/game/hugo-wall-recovery-cycle.webp';
import jetFlameCycleUrl from '../assets/game/jet-flame-cycle.webp';
import {
  CHARACTER_FRAME_HEIGHT,
  CHARACTER_FRAME_WIDTH,
  DOUBLE_JUMP_DURATION,
  GRIND_FRAME_HEIGHT,
  GRIND_FRAME_WIDTH,
  JET_FLAME_FRAME_HEIGHT,
  JET_FLAME_FRAME_WIDTH,
  RUN_FRAME_HEIGHT,
  RUN_FRAME_WIDTH,
  getDoubleJumpFrame,
  getDoubleJumpFrameLayout,
  getFlightLoopFrame,
  getFreefallLoopFrame,
  getGrindFrame,
  getJetFlameAnchors,
  getJetFlameFrame,
  getRunFrame,
  type AtlasFrame,
  type FlightPoseKind,
} from './animation';

type AnimationKind = 'run' | 'jump' | 'double-jump' | 'freefall' | 'powered' | 'glide' | 'grind' | 'wall' | 'flame';
type LoadedSprite = HTMLImageElement & { ready?: boolean };

interface Preview {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  kind: AnimationKind;
}

interface DrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class AnimationSandbox {
  private readonly previews: Preview[];
  private readonly sprites = {
    run: this.createSprite(),
    jump: this.createSprite(),
    doubleJump: this.createSprite(),
    freefall: this.createSprite(),
    powered: this.createSprite(),
    glide: this.createSprite(),
    grind: this.createSprite(),
    wall: this.createSprite(),
    flame: this.createSprite(),
  };
  private assetsStarted = false;
  private running = false;
  private animationFrame = 0;
  private startedAt = 0;

  constructor(private readonly root: HTMLElement) {
    this.previews = Array.from(root.querySelectorAll<HTMLCanvasElement>('[data-sandbox-animation]')).map((canvas) => {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Animation Sandbox requires a 2D canvas context.');
      return {
        canvas,
        context,
        kind: canvas.dataset.sandboxAnimation as AnimationKind,
      };
    });
  }

  start(): void {
    if (this.running) return;
    this.ensureAssets();
    this.running = true;
    this.startedAt = performance.now();
    this.animationFrame = window.requestAnimationFrame((time) => this.tick(time));
  }

  stop(): void {
    this.running = false;
    window.cancelAnimationFrame(this.animationFrame);
  }

  private tick(time: number): void {
    if (!this.running || this.root.hidden) return;
    const elapsed = Math.max(0, (time - this.startedAt) / 1000);
    for (const preview of this.previews) this.drawPreview(preview, elapsed);
    this.animationFrame = window.requestAnimationFrame((nextTime) => this.tick(nextTime));
  }

  private drawPreview(preview: Preview, elapsed: number): void {
    const { canvas, context, kind } = preview;
    this.drawBackdrop(context, canvas.width, canvas.height, kind === 'run' || kind === 'jump');

    switch (kind) {
      case 'run':
        this.drawRun(preview, elapsed);
        break;
      case 'jump':
        this.drawJump(preview, elapsed);
        break;
      case 'double-jump':
        this.drawDoubleJump(preview, elapsed);
        break;
      case 'freefall':
        this.drawFreefall(preview, elapsed);
        break;
      case 'powered':
        this.drawFlight(preview, elapsed, 'powered');
        break;
      case 'glide':
        this.drawFlight(preview, elapsed, 'glide');
        break;
      case 'grind':
        this.drawGrind(preview, elapsed);
        break;
      case 'wall':
        this.drawWall(preview, elapsed);
        break;
      case 'flame':
        this.drawFlames(preview, elapsed);
        break;
    }
  }

  private drawRun(preview: Preview, elapsed: number): void {
    const frame = getRunFrame(elapsed);
    const { context, canvas } = preview;
    context.save();
    context.strokeStyle = 'rgba(255, 255, 255, .3)';
    context.lineWidth = 4;
    const spacing = 90;
    const travel = (elapsed * 180) % spacing;
    for (let x = -spacing; x < canvas.width + spacing; x += spacing) {
      context.beginPath();
      context.moveTo(x - travel, canvas.height * 0.82);
      context.lineTo(x + 32 - travel, canvas.height * 0.82);
      context.stroke();
    }
    context.restore();
    this.drawAtlas(context, this.sprites.run, frame, RUN_FRAME_WIDTH, RUN_FRAME_HEIGHT, canvas.width / 2, canvas.height * 0.79 + frame.verticalOffset, 174);
    this.markFrame(preview, frame.index);
  }

  private drawJump(preview: Preview, elapsed: number): void {
    const phase = elapsed % 2.4;
    const progress = phase / 2.4;
    const frameIndex = Math.min(7, Math.floor(progress * 8));
    const height = Math.sin(progress * Math.PI) * preview.canvas.height * 0.34;
    const frame = this.atlasFrame(frameIndex, 4, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT);
    this.drawAtlas(preview.context, this.sprites.jump, frame, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT, preview.canvas.width / 2, preview.canvas.height * 0.8 - height, 198);
    this.markFrame(preview, frameIndex);
  }

  private drawDoubleJump(preview: Preview, elapsed: number): void {
    const progress = (elapsed % 2) / 2;
    const sequenceTime = Math.min(DOUBLE_JUMP_DURATION, progress * DOUBLE_JUMP_DURATION);
    const frame = getDoubleJumpFrame(sequenceTime);
    const layout = getDoubleJumpFrameLayout(frame.index);
    const height = (0.42 + Math.sin(progress * Math.PI) * 0.18) * preview.canvas.height;
    this.drawAtlas(
      preview.context,
      this.sprites.doubleJump,
      frame,
      CHARACTER_FRAME_WIDTH,
      CHARACTER_FRAME_HEIGHT,
      preview.canvas.width / 2,
      preview.canvas.height - height + layout.verticalOffset * 180,
      198 * layout.scale,
    );
    this.markFrame(preview, frame.index);
  }

  private drawFreefall(preview: Preview, elapsed: number): void {
    const frame = getFreefallLoopFrame(elapsed);
    const drift = ((elapsed * 75) % 100) - 50;
    this.drawAtlas(preview.context, this.sprites.freefall, frame, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT, preview.canvas.width / 2, preview.canvas.height * 0.62 + drift, 205);
    this.markFrame(preview, frame.index);
  }

  private drawFlight(preview: Preview, elapsed: number, pose: FlightPoseKind): void {
    const frame = getFlightLoopFrame(elapsed);
    const sprite = pose === 'powered' ? this.sprites.powered : this.sprites.glide;
    const bob = Math.sin(elapsed * Math.PI * 2) * 8;
    const rect = this.characterRect(preview.canvas.width / 2, preview.canvas.height * 0.68 + bob, 205, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT);
    if (pose === 'powered') this.drawAttachedFlames(preview.context, rect, elapsed, pose, frame.index);
    this.drawAtlasAtRect(preview.context, sprite, frame, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT, rect);
    this.markFrame(preview, frame.index);
  }

  private drawGrind(preview: Preview, elapsed: number): void {
    const { context, canvas } = preview;
    const frame = getGrindFrame(elapsed);
    context.save();
    context.lineWidth = 7;
    context.strokeStyle = '#182f47';
    context.beginPath();
    context.moveTo(34, canvas.height * 0.57);
    context.quadraticCurveTo(canvas.width / 2, canvas.height * 0.72, canvas.width - 34, canvas.height * 0.57);
    context.stroke();
    context.fillStyle = '#eb5a48';
    context.fillRect(24, canvas.height * 0.22, 18, canvas.height * 0.56);
    context.fillRect(canvas.width - 42, canvas.height * 0.22, 18, canvas.height * 0.56);
    context.restore();
    const x = canvas.width / 2;
    const wireY = canvas.height * 0.645;
    this.drawAtlas(context, this.sprites.grind, frame, GRIND_FRAME_WIDTH, GRIND_FRAME_HEIGHT, x, wireY + 10, 185, -0.02);
    this.markFrame(preview, frame.index);
  }

  private drawWall(preview: Preview, elapsed: number): void {
    const { context, canvas } = preview;
    const phase = elapsed % 2.8;
    let frameIndex = 0;
    if (phase >= 0.45 && phase < 1.35) frameIndex = 1 + Math.floor((phase - 0.45) * 7) % 2;
    else if (phase >= 1.35) frameIndex = Math.min(5, 3 + Math.floor((phase - 1.35) * 3));
    context.fillStyle = '#ef4c52';
    context.fillRect(canvas.width * 0.69, 30, canvas.width * 0.18, canvas.height - 60);
    context.fillStyle = 'rgba(255,255,255,.2)';
    for (let y = 52; y < canvas.height - 30; y += 50) context.fillRect(canvas.width * 0.69, y, canvas.width * 0.18, 5);
    const frame = this.atlasFrame(frameIndex, 3, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT);
    this.drawAtlas(context, this.sprites.wall, frame, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT, canvas.width * 0.61, canvas.height * 0.74, 205);
    this.markFrame(preview, frameIndex);
  }

  private drawFlames(preview: Preview, elapsed: number): void {
    const frame = getJetFlameFrame(elapsed);
    const { context, canvas } = preview;
    context.save();
    context.translate(canvas.width / 2 - 55, canvas.height * 0.35);
    context.rotate(0.18);
    this.drawFlameCell(context, frame, 0, 0, 72, 120);
    context.translate(110, -8);
    context.rotate(-0.35);
    this.drawFlameCell(context, getJetFlameFrame(elapsed, 11), 0, 0, 72, 120);
    context.restore();
    this.markFrame(preview, frame.index);
  }

  private drawAttachedFlames(context: CanvasRenderingContext2D, rect: DrawRect, elapsed: number, pose: FlightPoseKind, poseFrame: number): void {
    const anchors = getJetFlameAnchors(pose, poseFrame);
    anchors.forEach((anchor, index) => {
      context.save();
      context.translate(rect.x + rect.width * anchor.x, rect.y + rect.height * anchor.y);
      context.rotate(anchor.angle);
      this.drawFlameCell(context, getJetFlameFrame(elapsed, index * 11), 0, 0, 35, 65);
      context.restore();
    });
  }

  private drawFlameCell(context: CanvasRenderingContext2D, frame: AtlasFrame, x: number, y: number, width: number, height: number): void {
    if (!this.sprites.flame.ready) return;
    context.drawImage(
      this.sprites.flame,
      frame.sourceX,
      frame.sourceY,
      JET_FLAME_FRAME_WIDTH,
      JET_FLAME_FRAME_HEIGHT,
      x - width / 2,
      y,
      width,
      height,
    );
  }

  private drawBackdrop(context: CanvasRenderingContext2D, width: number, height: number, ground: boolean): void {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#25d8ef');
    gradient.addColorStop(0.62, '#66e7e4');
    gradient.addColorStop(1, '#d9f3be');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'rgba(255, 255, 255, .28)';
    context.beginPath();
    context.arc(width * 0.82, height * 0.2, Math.min(width, height) * 0.13, 0, Math.PI * 2);
    context.fill();
    if (!ground) return;
    context.fillStyle = '#e9813d';
    context.fillRect(0, height * 0.82, width, height * 0.18);
    context.fillStyle = '#8e482d';
    context.fillRect(0, height * 0.91, width, height * 0.09);
  }

  private drawAtlas(
    context: CanvasRenderingContext2D,
    sprite: LoadedSprite,
    frame: AtlasFrame,
    sourceWidth: number,
    sourceHeight: number,
    centerX: number,
    bottomY: number,
    drawHeight: number,
    rotation = 0,
  ): DrawRect {
    const rect = this.characterRect(centerX, bottomY, drawHeight, sourceWidth, sourceHeight);
    if (!rotation) {
      this.drawAtlasAtRect(context, sprite, frame, sourceWidth, sourceHeight, rect);
      return rect;
    }
    context.save();
    context.translate(centerX, bottomY);
    context.rotate(rotation);
    const rotatedRect = { x: -rect.width / 2, y: -rect.height, width: rect.width, height: rect.height };
    this.drawAtlasAtRect(context, sprite, frame, sourceWidth, sourceHeight, rotatedRect);
    context.restore();
    return rect;
  }

  private drawAtlasAtRect(context: CanvasRenderingContext2D, sprite: LoadedSprite, frame: AtlasFrame, sourceWidth: number, sourceHeight: number, rect: DrawRect): void {
    if (!sprite.ready) return;
    context.drawImage(sprite, frame.sourceX, frame.sourceY, sourceWidth, sourceHeight, rect.x, rect.y, rect.width, rect.height);
  }

  private characterRect(centerX: number, bottomY: number, drawHeight: number, sourceWidth: number, sourceHeight: number): DrawRect {
    const drawWidth = drawHeight * sourceWidth / sourceHeight;
    return { x: centerX - drawWidth / 2, y: bottomY - drawHeight, width: drawWidth, height: drawHeight };
  }

  private atlasFrame(index: number, columns: number, width: number, height: number): AtlasFrame {
    return { index, sourceX: index % columns * width, sourceY: Math.floor(index / columns) * height };
  }

  private markFrame(preview: Preview, index: number): void {
    preview.canvas.dataset.frame = String(index);
  }

  private createSprite(): LoadedSprite {
    const sprite = new Image() as LoadedSprite;
    sprite.decoding = 'async';
    sprite.addEventListener('load', () => {
      sprite.ready = true;
    });
    return sprite;
  }

  private ensureAssets(): void {
    if (this.assetsStarted) return;
    this.assetsStarted = true;
    this.sprites.run.src = hugoRunCycleUrl;
    this.sprites.jump.src = hugoJumpLandCycleUrl;
    this.sprites.doubleJump.src = hugoDoubleJumpCycleUrl;
    this.sprites.freefall.src = hugoFreefallCycleUrl;
    this.sprites.powered.src = hugoPoweredCycleUrl;
    this.sprites.glide.src = hugoGlideCycleUrl;
    this.sprites.grind.src = hugoGrindCycleUrl;
    this.sprites.wall.src = hugoWallRecoveryCycleUrl;
    this.sprites.flame.src = jetFlameCycleUrl;
  }
}
