import hugoDoubleJumpCycleUrl from '../assets/game/hugo-double-jump-cycle.webp';
import hugoFreefallCycleUrl from '../assets/game/hugo-freefall-cycle.webp';
import hugoFreefallV2CycleUrl from '../assets/game/hugo-freefall-v2-cycle.png';
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
  FREEFALL_V2_FRAME_HEIGHT,
  FREEFALL_V2_FRAME_WIDTH,
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
  getFreefallV2LoopFrame,
  getGrindFrame,
  getJetFlameAnchors,
  getJetFlameFrame,
  getRunFrame,
  type AtlasFrame,
  type FlightPoseKind,
} from './animation';

type AnimationKind = 'run' | 'jump' | 'double-jump' | 'freefall' | 'freefall-v2' | 'powered' | 'glide' | 'grind' | 'wall' | 'flame';
type LoadedSprite = HTMLImageElement & { ready?: boolean };

interface Preview {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  kind: AnimationKind;
  controls: HTMLElement;
  playButton: HTMLButtonElement;
  loopButton: HTMLButtonElement;
  editButton: HTMLButtonElement;
  frameReadout: HTMLElement;
  frameButtons: HTMLButtonElement[];
  elapsed: number;
  frameAccumulator: number;
  currentFrame: number;
  playing: boolean;
  looping: boolean;
  editing: boolean;
  activeFrames: boolean[];
}

interface DrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ANIMATION_CONFIG: Record<AnimationKind, { frameCount: number; duration: number }> = {
  run: { frameCount: 60, duration: 2 },
  jump: { frameCount: 8, duration: 2.4 },
  'double-jump': { frameCount: 6, duration: 2 },
  freefall: { frameCount: 6, duration: 0.6 },
  'freefall-v2': { frameCount: 24, duration: 0.8 },
  powered: { frameCount: 6, duration: 0.5 },
  glide: { frameCount: 6, duration: 0.5 },
  grind: { frameCount: 30, duration: 1 },
  wall: { frameCount: 6, duration: 2.8 },
  flame: { frameCount: 30, duration: 1 },
};

export class AnimationSandbox {
  private readonly previews: Preview[];
  private readonly sprites = {
    run: this.createSprite(),
    jump: this.createSprite(),
    doubleJump: this.createSprite(),
    freefall: this.createSprite(),
    freefallV2: this.createSprite(),
    powered: this.createSprite(),
    glide: this.createSprite(),
    grind: this.createSprite(),
    wall: this.createSprite(),
    flame: this.createSprite(),
  };
  private assetsStarted = false;
  private running = false;
  private animationFrame = 0;
  private previousTime = 0;

  constructor(private readonly root: HTMLElement) {
    this.previews = Array.from(root.querySelectorAll<HTMLCanvasElement>('[data-sandbox-animation]')).map((canvas) => {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Animation Sandbox requires a 2D canvas context.');
      const kind = canvas.dataset.sandboxAnimation as AnimationKind;
      const controls = this.createControls(canvas, kind);
      const frameButtons = Array.from(controls.querySelectorAll<HTMLButtonElement>('[data-frame]'));
      return {
        canvas,
        context,
        kind,
        controls,
        playButton: this.controlButton(controls, '[data-sandbox-control="play"]'),
        loopButton: this.controlButton(controls, '[data-sandbox-control="loop"]'),
        editButton: this.controlButton(controls, '[data-sandbox-control="edit"]'),
        frameReadout: this.controlElement(controls, '[data-sandbox-frame-readout]'),
        frameButtons,
        elapsed: 0,
        frameAccumulator: 0,
        currentFrame: 0,
        playing: true,
        looping: true,
        editing: false,
        activeFrames: this.loadActiveFrames(kind, ANIMATION_CONFIG[kind].frameCount),
      };
    });
    for (const preview of this.previews) this.syncControls(preview);
    this.root.addEventListener('click', (event) => this.handleControl(event));
  }

  start(): void {
    if (this.running) return;
    this.ensureAssets();
    this.running = true;
    this.previousTime = performance.now();
    this.animationFrame = window.requestAnimationFrame((time) => this.tick(time));
  }

  stop(): void {
    this.running = false;
    window.cancelAnimationFrame(this.animationFrame);
  }

  private tick(time: number): void {
    if (!this.running || this.root.hidden) return;
    const delta = Math.min(0.1, Math.max(0, (time - this.previousTime) / 1000));
    this.previousTime = time;
    for (const preview of this.previews) {
      if (preview.playing) this.advance(preview, delta);
      this.drawPreview(preview, preview.elapsed, preview.currentFrame);
    }
    this.animationFrame = window.requestAnimationFrame((nextTime) => this.tick(nextTime));
  }

  private drawPreview(preview: Preview, elapsed: number, forcedFrame: number | null): void {
    const { canvas, context, kind } = preview;
    this.drawBackdrop(context, canvas.width, canvas.height, kind === 'run' || kind === 'jump');

    switch (kind) {
      case 'run':
        this.drawRun(preview, elapsed, forcedFrame);
        break;
      case 'jump':
        this.drawJump(preview, elapsed, forcedFrame);
        break;
      case 'double-jump':
        this.drawDoubleJump(preview, elapsed, forcedFrame);
        break;
      case 'freefall':
        this.drawFreefall(preview, elapsed, forcedFrame);
        break;
      case 'freefall-v2':
        this.drawFreefallV2(preview, elapsed, forcedFrame);
        break;
      case 'powered':
        this.drawFlight(preview, elapsed, 'powered', forcedFrame);
        break;
      case 'glide':
        this.drawFlight(preview, elapsed, 'glide', forcedFrame);
        break;
      case 'grind':
        this.drawGrind(preview, elapsed, forcedFrame);
        break;
      case 'wall':
        this.drawWall(preview, elapsed, forcedFrame);
        break;
      case 'flame':
        this.drawFlames(preview, elapsed, forcedFrame);
        break;
    }
  }

  private drawRun(preview: Preview, elapsed: number, forcedFrame: number | null): void {
    const frame = getRunFrame(forcedFrame === null ? elapsed : forcedFrame / 30);
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

  private drawJump(preview: Preview, elapsed: number, forcedFrame: number | null): void {
    const phase = elapsed % 2.4;
    const progress = phase / 2.4;
    const frameIndex = forcedFrame ?? Math.min(7, Math.floor(progress * 8));
    const frameProgress = forcedFrame === null ? progress : frameIndex / 7;
    const height = Math.sin(frameProgress * Math.PI) * preview.canvas.height * 0.34;
    const frame = this.atlasFrame(frameIndex, 4, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT);
    this.drawAtlas(preview.context, this.sprites.jump, frame, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT, preview.canvas.width / 2, preview.canvas.height * 0.8 - height, 198);
    this.markFrame(preview, frameIndex);
  }

  private drawDoubleJump(preview: Preview, elapsed: number, forcedFrame: number | null): void {
    const progress = forcedFrame === null ? (elapsed % 2) / 2 : forcedFrame / 5;
    const sequenceTime = forcedFrame === null
      ? Math.min(DOUBLE_JUMP_DURATION, progress * DOUBLE_JUMP_DURATION)
      : forcedFrame / 14;
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

  private drawFreefall(preview: Preview, elapsed: number, forcedFrame: number | null): void {
    const frame = forcedFrame === null
      ? getFreefallLoopFrame(elapsed)
      : this.atlasFrame(forcedFrame, 3, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT);
    const drift = ((elapsed * 75) % 100) - 50;
    this.drawAtlas(preview.context, this.sprites.freefall, frame, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT, preview.canvas.width / 2, preview.canvas.height * 0.62 + drift, 205);
    this.markFrame(preview, frame.index);
  }

  private drawFreefallV2(preview: Preview, elapsed: number, forcedFrame: number | null): void {
    const frame = getFreefallV2LoopFrame(forcedFrame === null ? elapsed : forcedFrame / 30);
    const momentum = Math.sin(frame.index / 24 * Math.PI * 2) * 7;
    this.drawAtlas(
      preview.context,
      this.sprites.freefallV2,
      frame,
      FREEFALL_V2_FRAME_WIDTH,
      FREEFALL_V2_FRAME_HEIGHT,
      preview.canvas.width / 2,
      preview.canvas.height * 0.78 + momentum,
      318,
    );
    this.markFrame(preview, frame.index);
  }

  private drawFlight(preview: Preview, elapsed: number, pose: FlightPoseKind, forcedFrame: number | null): void {
    const frame = forcedFrame === null
      ? getFlightLoopFrame(elapsed)
      : this.atlasFrame(forcedFrame, 3, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT);
    const sprite = pose === 'powered' ? this.sprites.powered : this.sprites.glide;
    const bob = Math.sin(elapsed * Math.PI * 2) * 8;
    const rect = this.characterRect(preview.canvas.width / 2, preview.canvas.height * 0.68 + bob, 205, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT);
    if (pose === 'powered') this.drawAttachedFlames(preview.context, rect, elapsed, pose, frame.index);
    this.drawAtlasAtRect(preview.context, sprite, frame, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT, rect);
    this.markFrame(preview, frame.index);
  }

  private drawGrind(preview: Preview, elapsed: number, forcedFrame: number | null): void {
    const { context, canvas } = preview;
    const frame = getGrindFrame(forcedFrame === null ? elapsed : forcedFrame / 30);
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

  private drawWall(preview: Preview, elapsed: number, forcedFrame: number | null): void {
    const { context, canvas } = preview;
    const phase = elapsed % 2.8;
    let frameIndex = forcedFrame ?? 0;
    if (forcedFrame === null) {
      if (phase >= 0.45 && phase < 1.35) frameIndex = 1 + Math.floor((phase - 0.45) * 7) % 2;
      else if (phase >= 1.35) frameIndex = Math.min(5, 3 + Math.floor((phase - 1.35) * 3));
    }
    context.fillStyle = '#ef4c52';
    context.fillRect(canvas.width * 0.69, 30, canvas.width * 0.18, canvas.height - 60);
    context.fillStyle = 'rgba(255,255,255,.2)';
    for (let y = 52; y < canvas.height - 30; y += 50) context.fillRect(canvas.width * 0.69, y, canvas.width * 0.18, 5);
    const frame = this.atlasFrame(frameIndex, 3, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT);
    this.drawAtlas(context, this.sprites.wall, frame, CHARACTER_FRAME_WIDTH, CHARACTER_FRAME_HEIGHT, canvas.width * 0.61, canvas.height * 0.74, 205);
    this.markFrame(preview, frameIndex);
  }

  private drawFlames(preview: Preview, elapsed: number, forcedFrame: number | null): void {
    const flameElapsed = forcedFrame === null ? elapsed : forcedFrame / 30;
    const frame = getJetFlameFrame(flameElapsed);
    const { context, canvas } = preview;
    context.save();
    context.translate(canvas.width / 2 - 55, canvas.height * 0.35);
    context.rotate(0.18);
    this.drawFlameCell(context, frame, 0, 0, 72, 120);
    context.translate(110, -8);
    context.rotate(-0.35);
    this.drawFlameCell(context, getJetFlameFrame(flameElapsed, 11), 0, 0, 72, 120);
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

  private advance(preview: Preview, delta: number): void {
    const { duration, frameCount } = ANIMATION_CONFIG[preview.kind];
    preview.elapsed += delta;
    preview.frameAccumulator += delta;
    const frameDuration = duration / frameCount;
    while (preview.frameAccumulator >= frameDuration) {
      preview.frameAccumulator -= frameDuration;
      const nextFrame = this.findNextActiveFrame(preview, preview.currentFrame, 1);
      if (nextFrame === null) {
        preview.playing = false;
        preview.frameAccumulator = 0;
        this.syncControls(preview);
        return;
      }
      preview.currentFrame = nextFrame;
      preview.elapsed = this.seekElapsed(preview.kind, nextFrame);
    }
  }

  private handleControl(event: Event): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-sandbox-control], [data-frame]');
    if (!button) return;
    const controls = button.closest<HTMLElement>('.sandbox-controls');
    const preview = this.previews.find((candidate) => candidate.controls === controls);
    if (!preview) return;

    const selectedFrame = button.dataset.frame;
    if (selectedFrame !== undefined) {
      if (preview.editing) this.toggleFrameActive(preview, Number(selectedFrame));
      else this.selectFrame(preview, Number(selectedFrame));
      return;
    }

    switch (button.dataset.sandboxControl) {
      case 'play':
        if (preview.playing) {
          preview.playing = false;
        } else {
          if (!preview.activeFrames[preview.currentFrame]) {
            preview.currentFrame = this.findNextActiveFrame(preview, preview.currentFrame, 1)
              ?? preview.activeFrames.findIndex(Boolean);
          }
          preview.elapsed = this.seekElapsed(preview.kind, preview.currentFrame);
          preview.frameAccumulator = 0;
          preview.playing = true;
        }
        break;
      case 'restart':
        preview.currentFrame = preview.activeFrames.findIndex(Boolean);
        preview.elapsed = this.seekElapsed(preview.kind, preview.currentFrame);
        preview.frameAccumulator = 0;
        preview.playing = true;
        break;
      case 'previous':
        this.selectFrame(preview, preview.currentFrame - 1);
        return;
      case 'next':
        this.selectFrame(preview, preview.currentFrame + 1);
        return;
      case 'loop':
        preview.looping = !preview.looping;
        break;
      case 'edit':
        preview.editing = !preview.editing;
        if (preview.editing) preview.playing = false;
        break;
      case 'activate-all':
        preview.activeFrames.fill(true);
        this.saveActiveFrames(preview);
        break;
    }
    this.syncControls(preview);
    this.drawPreview(preview, preview.elapsed, preview.currentFrame);
  }

  private selectFrame(preview: Preview, requestedFrame: number): void {
    const { frameCount } = ANIMATION_CONFIG[preview.kind];
    const frame = preview.looping
      ? (Math.floor(requestedFrame) % frameCount + frameCount) % frameCount
      : Math.max(0, Math.min(frameCount - 1, Math.floor(requestedFrame)));
    preview.currentFrame = frame;
    preview.elapsed = this.seekElapsed(preview.kind, frame);
    preview.frameAccumulator = 0;
    preview.playing = false;
    this.syncControls(preview);
    this.drawPreview(preview, preview.elapsed, frame);
  }

  private toggleFrameActive(preview: Preview, requestedFrame: number): void {
    const frame = Math.max(0, Math.min(preview.activeFrames.length - 1, Math.floor(requestedFrame)));
    const activeCount = preview.activeFrames.filter(Boolean).length;
    if (preview.activeFrames[frame] && activeCount === 1) return;
    preview.activeFrames[frame] = !preview.activeFrames[frame];
    this.saveActiveFrames(preview);
    this.syncControls(preview);
  }

  private findNextActiveFrame(preview: Preview, from: number, direction: 1 | -1): number | null {
    const frameCount = preview.activeFrames.length;
    for (let step = 1; step <= frameCount; step += 1) {
      const candidate = from + step * direction;
      if (!preview.looping && (candidate < 0 || candidate >= frameCount)) return null;
      const frame = (candidate % frameCount + frameCount) % frameCount;
      if (preview.activeFrames[frame]) return frame;
    }
    return null;
  }

  private loadActiveFrames(kind: AnimationKind, frameCount: number): boolean[] {
    try {
      const saved = JSON.parse(localStorage.getItem(`hugo-go:sandbox-frames:${kind}`) ?? 'null');
      if (
        Array.isArray(saved)
        && saved.length === frameCount
        && saved.every((value) => typeof value === 'boolean')
        && saved.some(Boolean)
      ) return saved;
    } catch {
      // Invalid local review data falls back to the complete production sequence.
    }
    return Array.from({ length: frameCount }, () => true);
  }

  private saveActiveFrames(preview: Preview): void {
    localStorage.setItem(
      `hugo-go:sandbox-frames:${preview.kind}`,
      JSON.stringify(preview.activeFrames),
    );
  }

  private seekElapsed(kind: AnimationKind, frame: number): number {
    if (kind === 'wall') return [0, 0.45, 0.58, 1.35, 1.68, 2.01][frame] ?? 0;
    const { duration, frameCount } = ANIMATION_CONFIG[kind];
    return frame / frameCount * duration;
  }

  private createControls(canvas: HTMLCanvasElement, kind: AnimationKind): HTMLElement {
    const { frameCount } = ANIMATION_CONFIG[kind];
    const controls = document.createElement('footer');
    controls.className = 'sandbox-controls';
    controls.dataset.sandboxControls = kind;
    controls.innerHTML = `
      <div class="sandbox-transport" role="group" aria-label="${kind} playback controls">
        <button type="button" data-sandbox-control="restart">Start</button>
        <button type="button" data-sandbox-control="play" aria-pressed="false">Pause</button>
        <button type="button" data-sandbox-control="previous" aria-label="Previous frame">−1</button>
        <strong data-sandbox-frame-readout>Frame 1 / ${frameCount}</strong>
        <button type="button" data-sandbox-control="next" aria-label="Next frame">+1</button>
        <button class="sandbox-loop is-active" type="button" data-sandbox-control="loop" aria-pressed="true">Loop</button>
        <button class="sandbox-edit" type="button" data-sandbox-control="edit" aria-pressed="false">Edit frames</button>
        <button class="sandbox-activate-all" type="button" data-sandbox-control="activate-all">Use all</button>
      </div>
      <div class="sandbox-frame-picker" role="group" aria-label="${kind} frames">
        ${Array.from({ length: frameCount }, (_, index) => `<button type="button" data-frame="${index}" aria-label="Show frame ${index + 1}">${index + 1}</button>`).join('')}
      </div>
      <p class="sandbox-edit-help">Editing: click frame numbers to deactivate or restore them. Red frames are skipped during playback.</p>
    `;
    canvas.after(controls);
    return controls;
  }

  private syncControls(preview: Preview): void {
    preview.playButton.textContent = preview.playing ? 'Pause' : 'Resume';
    preview.playButton.setAttribute('aria-pressed', String(!preview.playing));
    preview.loopButton.classList.toggle('is-active', preview.looping);
    preview.loopButton.setAttribute('aria-pressed', String(preview.looping));
    preview.editButton.classList.toggle('is-active', preview.editing);
    preview.editButton.setAttribute('aria-pressed', String(preview.editing));
    preview.editButton.textContent = preview.editing ? 'Done editing' : 'Edit frames';
    preview.controls.classList.toggle('is-editing', preview.editing);
    const activeCount = preview.activeFrames.filter(Boolean).length;
    preview.frameReadout.textContent = `Frame ${preview.currentFrame + 1} / ${ANIMATION_CONFIG[preview.kind].frameCount} · ${activeCount} active`;
    preview.frameButtons.forEach((button, index) => {
      const selected = index === preview.currentFrame;
      const enabled = preview.activeFrames[index];
      button.classList.toggle('is-active', selected);
      button.classList.toggle('is-deactivated', !enabled);
      button.dataset.frameActive = String(enabled);
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `${preview.editing ? (enabled ? 'Deactivate' : 'Reactivate') : 'Show'} frame ${index + 1}${enabled ? '' : ', deactivated'}`);
    });
  }

  private controlButton(root: HTMLElement, selector: string): HTMLButtonElement {
    const button = root.querySelector<HTMLButtonElement>(selector);
    if (!button) throw new Error(`Missing Animation Sandbox control ${selector}.`);
    return button;
  }

  private controlElement(root: HTMLElement, selector: string): HTMLElement {
    const element = root.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing Animation Sandbox control ${selector}.`);
    return element;
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
    if (preview.currentFrame === index) return;
    preview.currentFrame = index;
    this.syncControls(preview);
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
    this.sprites.freefallV2.src = hugoFreefallV2CycleUrl;
    this.sprites.powered.src = hugoPoweredCycleUrl;
    this.sprites.glide.src = hugoGlideCycleUrl;
    this.sprites.grind.src = hugoGrindCycleUrl;
    this.sprites.wall.src = hugoWallRecoveryCycleUrl;
    this.sprites.flame.src = jetFlameCycleUrl;
  }
}
