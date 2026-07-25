import hugoDoubleJumpCycleUrl from '../assets/game/hugo-double-jump-cycle.webp';
import hugoDoubleJumpV2CycleUrl from '../assets/game/hugo-double-jump-v2-cycle.png';
import hugoFreefallCycleUrl from '../assets/game/hugo-freefall-cycle.webp';
import hugoFreefallV2CycleUrl from '../assets/game/hugo-freefall-v2-cycle.png';
import hugoGlideCycleUrl from '../assets/game/hugo-glide-cycle.webp';
import hugoGrindCycleUrl from '../assets/game/hugo-grind-cycle.webp';
import hugoJumpLandCycleUrl from '../assets/game/hugo-jump-land-cycle.webp';
import hugoLayeredRigPartsUrl from '../assets/game/hugo-layered-rig-parts.png';
import hugoPoweredCycleUrl from '../assets/game/hugo-powered-cycle.webp';
import hugoRunCycleUrl from '../assets/game/hugo-run-60-cycle.webp';
import hugoWalkV4LegsUrl from '../assets/game/hugo-walk-v4-legs.png';
import hugoWalkV4PartsUrl from '../assets/game/hugo-walk-v4-parts.png';
import hugoWallRecoveryCycleUrl from '../assets/game/hugo-wall-recovery-cycle.webp';
import jetFlameCycleUrl from '../assets/game/jet-flame-cycle.webp';
import {
  CHARACTER_FRAME_HEIGHT,
  CHARACTER_FRAME_WIDTH,
  DOUBLE_JUMP_DURATION,
  DOUBLE_JUMP_V2_DURATION,
  DOUBLE_JUMP_V2_FRAME_HEIGHT,
  DOUBLE_JUMP_V2_FRAME_WIDTH,
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
  getDoubleJumpV2Frame,
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
import {
  RIG_PART_CELL_SIZE,
  RIG_PART_COLUMNS,
  RIGGED_JUMP_FRAME_COUNT,
  RIGGED_RUN_FRAME_COUNT,
  WALK_V4_FRAME_COUNT,
  RigPart,
  getDebugJumpPose,
  getDebugRunPose,
  getRiggedJumpPose,
  getRiggedRunPose,
  getWalkV4Pose,
  rigEndpoint,
  solveTwoBoneChain,
  type DebugRigPose,
  type LayeredRigPose,
  type RigPoint,
  type TwoBoneChain,
  type WalkFootPose,
  type WalkV4Pose,
} from './layeredRig';

type AnimationKind = 'run' | 'jump' | 'rig-run-v2' | 'rig-jump-v2' | 'rig-run-debug' | 'rig-jump-debug' | 'walk-v4-debug' | 'walk-v4-painted' | 'double-jump' | 'double-jump-v2' | 'freefall' | 'freefall-v2' | 'powered' | 'glide' | 'grind' | 'wall' | 'flame';
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

interface WalkFootGeometry {
  ankle: RigPoint;
  heel: RigPoint;
  toe: RigPoint;
  angle: number;
  grounded: boolean;
}

interface WalkRigGeometry {
  hip: RigPoint;
  farHip: RigPoint;
  nearHip: RigPoint;
  spine: RigPoint;
  chest: RigPoint;
  neck: RigPoint;
  farShoulder: RigPoint;
  nearShoulder: RigPoint;
  farLeg: TwoBoneChain;
  nearLeg: TwoBoneChain;
  farArm: TwoBoneChain;
  nearArm: TwoBoneChain;
  farFoot: WalkFootGeometry;
  nearFoot: WalkFootGeometry;
}

interface AtlasPartRegistration {
  part: number;
  columns: number;
  rows: number;
  sourceStart: RigPoint;
  sourceEnd: RigPoint;
}

const ANIMATION_CONFIG: Record<AnimationKind, { frameCount: number; duration: number }> = {
  run: { frameCount: 60, duration: 2 },
  jump: { frameCount: 8, duration: 2.4 },
  'rig-run-v2': { frameCount: RIGGED_RUN_FRAME_COUNT, duration: 1 },
  'rig-jump-v2': { frameCount: RIGGED_JUMP_FRAME_COUNT, duration: 1.2 },
  'rig-run-debug': { frameCount: RIGGED_RUN_FRAME_COUNT, duration: 1 },
  'rig-jump-debug': { frameCount: RIGGED_JUMP_FRAME_COUNT, duration: 1.2 },
  'walk-v4-debug': { frameCount: WALK_V4_FRAME_COUNT, duration: 1.2 },
  'walk-v4-painted': { frameCount: WALK_V4_FRAME_COUNT, duration: 1.2 },
  'double-jump': { frameCount: 6, duration: 2 },
  'double-jump-v2': { frameCount: 16, duration: DOUBLE_JUMP_V2_DURATION },
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
    layeredRig: this.createSprite(),
    walkParts: this.createSprite(),
    walkLegs: this.createSprite(),
    doubleJump: this.createSprite(),
    doubleJumpV2: this.createSprite(),
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
      const metrics = canvas.closest<HTMLElement>('[data-sandbox-card]')?.querySelector<HTMLElement>('[data-sandbox-metrics]');
      if (metrics) metrics.textContent = this.metricsText(kind, ANIMATION_CONFIG[kind].frameCount);
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
    this.drawBackdrop(
      context,
      canvas.width,
      canvas.height,
      kind === 'run'
        || kind === 'jump'
        || kind === 'rig-run-v2'
        || kind === 'rig-jump-v2'
        || kind === 'rig-run-debug'
        || kind === 'rig-jump-debug'
        || kind === 'walk-v4-debug'
        || kind === 'walk-v4-painted',
    );

    switch (kind) {
      case 'run':
        this.drawRun(preview, elapsed, forcedFrame);
        break;
      case 'jump':
        this.drawJump(preview, elapsed, forcedFrame);
        break;
      case 'rig-run-v2':
        this.drawRiggedRunV2(preview, forcedFrame);
        break;
      case 'rig-jump-v2':
        this.drawRiggedJumpV2(preview, forcedFrame);
        break;
      case 'rig-run-debug':
        this.drawRiggedRunDebug(preview, forcedFrame);
        break;
      case 'rig-jump-debug':
        this.drawRiggedJumpDebug(preview, forcedFrame);
        break;
      case 'walk-v4-debug':
        this.drawWalkingV4Debug(preview, forcedFrame);
        break;
      case 'walk-v4-painted':
        this.drawWalkingV4Painted(preview, forcedFrame);
        break;
      case 'double-jump':
        this.drawDoubleJump(preview, elapsed, forcedFrame);
        break;
      case 'double-jump-v2':
        this.drawDoubleJumpV2(preview, elapsed, forcedFrame);
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

  private drawRiggedRunV2(preview: Preview, forcedFrame: number | null): void {
    const frame = forcedFrame ?? 0;
    this.drawLayeredRig(preview, getRiggedRunPose(frame), frame, preview.canvas.height * 0.81);
  }

  private drawRiggedJumpV2(preview: Preview, forcedFrame: number | null): void {
    const frame = forcedFrame ?? 0;
    this.drawLayeredRig(preview, getRiggedJumpPose(frame), frame, preview.canvas.height * 0.81);
  }

  private drawRiggedRunDebug(preview: Preview, forcedFrame: number | null): void {
    const frame = forcedFrame ?? 0;
    this.drawDebugRig(preview, getDebugRunPose(frame), frame, preview.canvas.height * 0.82, 'run');
  }

  private drawRiggedJumpDebug(preview: Preview, forcedFrame: number | null): void {
    const frame = forcedFrame ?? 0;
    this.drawDebugRig(preview, getDebugJumpPose(frame), frame, preview.canvas.height * 0.82, 'jump');
  }

  private drawWalkingV4Debug(preview: Preview, forcedFrame: number | null): void {
    const frame = forcedFrame ?? 0;
    const pose = getWalkV4Pose(frame);
    const groundY = preview.canvas.height * 0.82;
    const geometry = this.buildWalkingRig(preview.canvas, pose, groundY);
    const { context, canvas } = preview;

    context.save();
    this.drawDebugGuide(context, canvas, groundY);
    this.drawDebugChain(context, geometry.farLeg, 13, '#9a8bff', 'rgba(117, 96, 244, .24)', 0.72);
    this.drawWalkingDebugFoot(context, geometry.farFoot, groundY, '#9a8bff', 'rgba(117, 96, 244, .24)', 0.72);
    this.drawDebugChain(context, geometry.farArm, 10, '#9a8bff', 'rgba(117, 96, 244, .24)', 0.72);

    this.drawDebugSegment(context, geometry.hip, geometry.spine, 34, '#ffd661', 'rgba(255, 190, 49, .23)');
    this.drawDebugSegment(context, geometry.spine, geometry.chest, 31, '#ffd661', 'rgba(255, 190, 49, .23)');
    this.drawDebugSegment(context, geometry.chest, geometry.neck, 22, '#70f0b1', 'rgba(66, 216, 149, .2)');
    this.drawDebugSegment(context, geometry.farHip, geometry.nearHip, 16, '#ffd661', 'rgba(255, 190, 49, .23)');
    this.drawDebugJoint(context, geometry.hip, '#ffd661', 5);
    this.drawDebugJoint(context, geometry.spine, '#ffd661', 4.5);
    this.drawDebugJoint(context, geometry.chest, '#ffd661', 5);
    this.drawDebugJoint(context, geometry.neck, '#70f0b1', 4);

    this.drawDebugChain(context, geometry.nearLeg, 14, '#5ce9ff', 'rgba(40, 207, 239, .28)', 1);
    this.drawWalkingDebugFoot(context, geometry.nearFoot, groundY, '#5ce9ff', 'rgba(40, 207, 239, .28)', 1);
    this.drawDebugChain(context, geometry.nearArm, 11, '#5ce9ff', 'rgba(40, 207, 239, .28)', 1);

    this.drawHeadHitbox(context, geometry.neck, pose.headAngle);
    this.drawRigPart(context, RigPart.head, geometry.neck, pose.headAngle, 0.3, { x: 160, y: 302 });
    this.drawWalkLabel(context, 'SOCKET-LOCKED WALK CYCLE', 'SPINE · CHEST · HEEL · TOE NODES');
    context.restore();
    this.markFrame(preview, frame);
  }

  private drawWalkingV4Painted(preview: Preview, forcedFrame: number | null): void {
    const frame = forcedFrame ?? 0;
    const pose = getWalkV4Pose(frame);
    const groundY = preview.canvas.height * 0.82;
    const geometry = this.buildWalkingRig(preview.canvas, pose, groundY);
    const { context } = preview;

    context.save();
    context.globalAlpha = 0.84;
    this.drawWalkAtlasBone(context, this.sprites.walkLegs, {
      part: 2,
      columns: 2,
      rows: 2,
      sourceStart: { x: 0.2, y: 0.5 },
      sourceEnd: { x: 0.85, y: 0.5 },
    }, geometry.farLeg.root, geometry.farLeg.joint, 1.25);
    this.drawWalkAtlasBone(context, this.sprites.walkLegs, {
      part: 3,
      columns: 2,
      rows: 2,
      sourceStart: { x: 0.18, y: 0.5 },
      sourceEnd: { x: 0.82, y: 0.5 },
    }, geometry.farLeg.joint, geometry.farLeg.end, 1.35);
    this.drawWalkShoe(context, 11, geometry.farFoot, 0.84);
    this.drawWalkAtlasBone(context, this.sprites.walkParts, {
      part: 4,
      columns: 4,
      rows: 4,
      sourceStart: { x: 0.24, y: 0.51 },
      sourceEnd: { x: 0.8, y: 0.51 },
    }, geometry.farArm.root, geometry.farArm.joint, 1.35);
    this.drawWalkAtlasBone(context, this.sprites.walkParts, {
      part: 5,
      columns: 4,
      rows: 4,
      sourceStart: { x: 0.18, y: 0.53 },
      sourceEnd: { x: 0.88, y: 0.62 },
    }, geometry.farArm.joint, geometry.farArm.end, 1.25);
    context.restore();

    this.drawWalkAtlasBone(context, this.sprites.walkParts, {
      part: 2,
      columns: 4,
      rows: 4,
      sourceStart: { x: 0.25, y: 0.6 },
      sourceEnd: { x: 0.79, y: 0.6 },
    }, geometry.nearArm.root, geometry.nearArm.joint, 1.35);
    this.drawWalkingTorso(context, geometry.hip, geometry.neck);

    this.drawWalkAtlasBone(context, this.sprites.walkLegs, {
      part: 0,
      columns: 2,
      rows: 2,
      sourceStart: { x: 0.2, y: 0.5 },
      sourceEnd: { x: 0.85, y: 0.5 },
    }, geometry.nearLeg.root, geometry.nearLeg.joint, 1.25);
    this.drawWalkAtlasBone(context, this.sprites.walkLegs, {
      part: 1,
      columns: 2,
      rows: 2,
      sourceStart: { x: 0.18, y: 0.5 },
      sourceEnd: { x: 0.82, y: 0.5 },
    }, geometry.nearLeg.joint, geometry.nearLeg.end, 1.35);
    this.drawWalkShoe(context, 8, geometry.nearFoot, 1);
    this.drawWalkAtlasBone(context, this.sprites.walkParts, {
      part: 3,
      columns: 4,
      rows: 4,
      sourceStart: { x: 0.18, y: 0.62 },
      sourceEnd: { x: 0.88, y: 0.7 },
    }, geometry.nearArm.joint, geometry.nearArm.end, 1.25);
    this.drawWalkAtlasAtPivot(
      context,
      this.sprites.walkParts,
      1,
      4,
      4,
      geometry.neck,
      pose.headAngle,
      0.3,
      { x: 0.57, y: 0.93 },
    );

    this.drawPaintedWalkNodes(context, geometry);
    this.drawWalkLabel(context, 'GENERATED ART ON V4 SOCKETS', 'IDENTICAL BONES · IDENTICAL CONTACTS');
    context.restore();
    this.markFrame(preview, frame);
  }

  private buildWalkingRig(
    canvas: HTMLCanvasElement,
    pose: WalkV4Pose,
    groundY: number,
  ): WalkRigGeometry {
    const worldPoint = (point: RigPoint): RigPoint => ({
      x: canvas.width / 2 + point.x,
      y: groundY + point.y,
    });
    const hip = worldPoint(pose.hip);
    const torsoVector = {
      x: -Math.sin(pose.torsoAngle),
      y: -Math.cos(pose.torsoAngle),
    };
    const spine = {
      x: hip.x + torsoVector.x * 23,
      y: hip.y + torsoVector.y * 23,
    };
    const chest = {
      x: hip.x + torsoVector.x * 48,
      y: hip.y + torsoVector.y * 48,
    };
    const neck = {
      x: hip.x + torsoVector.x * 66,
      y: hip.y + torsoVector.y * 66,
    };
    const hipSpread = {
      x: Math.cos(pose.pelvisAngle) * 6,
      y: Math.sin(pose.pelvisAngle) * 6,
    };
    const farHip = { x: hip.x - hipSpread.x, y: hip.y - hipSpread.y + 1 };
    const nearHip = { x: hip.x + hipSpread.x, y: hip.y + hipSpread.y };
    const shoulderBase = { x: chest.x - 6, y: chest.y };
    const farShoulder = { x: shoulderBase.x - 4, y: shoulderBase.y + 2 };
    const nearShoulder = { x: shoulderBase.x + 4, y: shoulderBase.y };
    const farFoot = this.buildWalkingFoot(worldPoint(pose.farFoot), pose.farFoot, groundY);
    const nearFoot = this.buildWalkingFoot(worldPoint(pose.nearFoot), pose.nearFoot, groundY);
    const farHand = {
      x: farShoulder.x + pose.farHandOffset.x,
      y: farShoulder.y + pose.farHandOffset.y,
    };
    const nearHand = {
      x: nearShoulder.x + pose.nearHandOffset.x,
      y: nearShoulder.y + pose.nearHandOffset.y,
    };
    const farArmBend = pose.farHandOffset.x >= 0 ? 1 : -1;
    const nearArmBend = pose.nearHandOffset.x >= 0 ? 1 : -1;

    return {
      hip,
      farHip,
      nearHip,
      spine,
      chest,
      neck,
      farShoulder,
      nearShoulder,
      farLeg: solveTwoBoneChain(farHip, farFoot.ankle, 43, 43, -1),
      nearLeg: solveTwoBoneChain(nearHip, nearFoot.ankle, 43, 43, -1),
      farArm: solveTwoBoneChain(farShoulder, farHand, 31, 29, farArmBend),
      nearArm: solveTwoBoneChain(nearShoulder, nearHand, 31, 29, nearArmBend),
      farFoot,
      nearFoot,
    };
  }

  private buildWalkingFoot(
    target: RigPoint,
    pose: WalkFootPose,
    groundY: number,
  ): WalkFootGeometry {
    const cosine = Math.cos(pose.angle);
    const sine = Math.sin(pose.angle);
    const heelOffset = { x: -5 * cosine, y: -5 * sine };
    const toeOffset = { x: 28 * cosine, y: 28 * sine };
    const lowestOffset = Math.max(heelOffset.y, toeOffset.y) + 7.5;
    const groundCorrection = pose.grounded ? groundY - (target.y + lowestOffset) : 0;
    const ankle = { x: target.x, y: target.y + groundCorrection };
    return {
      ankle,
      heel: { x: ankle.x + heelOffset.x, y: ankle.y + heelOffset.y },
      toe: { x: ankle.x + toeOffset.x, y: ankle.y + toeOffset.y },
      angle: pose.angle,
      grounded: pose.grounded,
    };
  }

  private drawWalkingDebugFoot(
    context: CanvasRenderingContext2D,
    foot: WalkFootGeometry,
    groundY: number,
    stroke: string,
    fill: string,
    opacity: number,
  ): void {
    context.save();
    context.globalAlpha = opacity;
    this.drawDebugSegment(context, foot.heel, foot.toe, 15, stroke, fill);
    this.drawDebugJoint(context, foot.ankle, stroke, 4);
    this.drawDebugJoint(context, foot.heel, stroke, 3);
    this.drawDebugJoint(context, foot.toe, stroke, 3);
    if (foot.grounded) {
      context.strokeStyle = '#fff0a6';
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(Math.min(foot.heel.x, foot.toe.x) - 3, groundY - 1);
      context.lineTo(Math.max(foot.heel.x, foot.toe.x) + 3, groundY - 1);
      context.stroke();
    }
    context.restore();
  }

  private drawWalkAtlasBone(
    context: CanvasRenderingContext2D,
    sprite: LoadedSprite,
    registration: AtlasPartRegistration,
    targetStart: RigPoint,
    targetEnd: RigPoint,
    thicknessScale = 1,
  ): void {
    if (!sprite.ready) return;
    const cellWidth = sprite.naturalWidth / registration.columns;
    const cellHeight = sprite.naturalHeight / registration.rows;
    const sourceRect = {
      x: registration.part % registration.columns * cellWidth,
      y: Math.floor(registration.part / registration.columns) * cellHeight,
      width: cellWidth,
      height: cellHeight,
    };
    this.drawMappedSprite(
      context,
      sprite,
      sourceRect,
      {
        x: registration.sourceStart.x * cellWidth,
        y: registration.sourceStart.y * cellHeight,
      },
      {
        x: registration.sourceEnd.x * cellWidth,
        y: registration.sourceEnd.y * cellHeight,
      },
      targetStart,
      targetEnd,
      thicknessScale,
    );
  }

  private drawWalkingTorso(
    context: CanvasRenderingContext2D,
    hip: RigPoint,
    neck: RigPoint,
  ): void {
    this.drawWalkAtlasBone(
      context,
      this.sprites.walkParts,
      {
        part: 13,
        columns: 4,
        rows: 4,
        sourceStart: { x: 0.54, y: 0.78 },
        sourceEnd: { x: 0.54, y: 0.05 },
      },
      hip,
      neck,
      1.25,
    );
  }

  private drawMappedSprite(
    context: CanvasRenderingContext2D,
    sprite: LoadedSprite,
    sourceRect: DrawRect,
    sourceStart: RigPoint,
    sourceEnd: RigPoint,
    targetStart: RigPoint,
    targetEnd: RigPoint,
    thicknessScale = 1,
  ): void {
    if (!sprite.ready) return;
    const sourceDelta = {
      x: sourceEnd.x - sourceStart.x,
      y: sourceEnd.y - sourceStart.y,
    };
    const targetDelta = {
      x: targetEnd.x - targetStart.x,
      y: targetEnd.y - targetStart.y,
    };
    const sourceLength = Math.hypot(sourceDelta.x, sourceDelta.y);
    const targetLength = Math.hypot(targetDelta.x, targetDelta.y);
    if (sourceLength <= 0 || targetLength <= 0) return;
    const sourceAngle = Math.atan2(sourceDelta.y, sourceDelta.x);
    const targetAngle = Math.atan2(targetDelta.y, targetDelta.x);
    const scale = targetLength / sourceLength;

    context.save();
    context.translate(targetStart.x, targetStart.y);
    context.rotate(targetAngle);
    context.scale(scale, scale * thicknessScale);
    context.rotate(-sourceAngle);
    context.drawImage(
      sprite,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      -sourceStart.x,
      -sourceStart.y,
      sourceRect.width,
      sourceRect.height,
    );
    context.restore();
  }

  private drawWalkShoe(
    context: CanvasRenderingContext2D,
    part: number,
    foot: WalkFootGeometry,
    opacity: number,
  ): void {
    const pivot = part === 8 ? { x: 0.3, y: 0.29 } : { x: 0.18, y: 0.29 };
    this.drawWalkAtlasAtPivot(
      context,
      this.sprites.walkParts,
      part,
      4,
      4,
      foot.ankle,
      foot.angle,
      0.18,
      pivot,
      opacity,
    );
  }

  private drawWalkAtlasAtPivot(
    context: CanvasRenderingContext2D,
    sprite: LoadedSprite,
    part: number,
    columns: number,
    rows: number,
    position: RigPoint,
    angle: number,
    scale: number,
    pivot: RigPoint,
    opacity = 1,
  ): void {
    if (!sprite.ready) return;
    const cellWidth = sprite.naturalWidth / columns;
    const cellHeight = sprite.naturalHeight / rows;
    const sourceX = part % columns * cellWidth;
    const sourceY = Math.floor(part / columns) * cellHeight;
    context.save();
    context.globalAlpha *= opacity;
    context.translate(position.x, position.y);
    context.rotate(angle);
    context.drawImage(
      sprite,
      sourceX,
      sourceY,
      cellWidth,
      cellHeight,
      -pivot.x * cellWidth * scale,
      -pivot.y * cellHeight * scale,
      cellWidth * scale,
      cellHeight * scale,
    );
    context.restore();
  }

  private drawPaintedWalkNodes(
    context: CanvasRenderingContext2D,
    geometry: WalkRigGeometry,
  ): void {
    context.save();
    context.globalAlpha = 0.24;
    const nodes = [
      geometry.hip,
      geometry.spine,
      geometry.chest,
      geometry.neck,
      geometry.farShoulder,
      geometry.nearShoulder,
      geometry.farLeg.joint,
      geometry.nearLeg.joint,
      geometry.farFoot.ankle,
      geometry.nearFoot.ankle,
      geometry.farArm.joint,
      geometry.nearArm.joint,
    ];
    for (const node of nodes) this.drawDebugJoint(context, node, '#e7fbff', 2);
    context.restore();
  }

  private drawWalkLabel(
    context: CanvasRenderingContext2D,
    title: string,
    detail: string,
  ): void {
    context.fillStyle = 'rgba(4, 27, 55, .78)';
    context.fillRect(15, 15, 284, 46);
    context.fillStyle = '#dffaff';
    context.font = '700 12px "IBM Plex Mono", monospace';
    context.fillText(title, 27, 34);
    context.fillStyle = '#8ab1ca';
    context.font = '600 10px "IBM Plex Mono", monospace';
    context.fillText(detail, 27, 50);
  }

  private drawDebugRig(
    preview: Preview,
    pose: DebugRigPose,
    frame: number,
    groundY: number,
    motion: 'run' | 'jump',
  ): void {
    const { context, canvas } = preview;
    const worldPoint = (point: RigPoint): RigPoint => ({
      x: canvas.width / 2 + point.x,
      y: groundY + point.y,
    });
    const hip = worldPoint(pose.hip);
    const farHip = { x: hip.x - 6, y: hip.y + 1 };
    const nearHip = { x: hip.x + 6, y: hip.y };
    const torsoVector = {
      x: -Math.sin(pose.torsoAngle),
      y: -Math.cos(pose.torsoAngle),
    };
    const shoulder = {
      x: hip.x + torsoVector.x * 55,
      y: hip.y + torsoVector.y * 55,
    };
    const neck = {
      x: shoulder.x + torsoVector.x * 10,
      y: shoulder.y + torsoVector.y * 10,
    };
    const farShoulder = { x: shoulder.x - 5, y: shoulder.y + 2 };
    const nearShoulder = { x: shoulder.x + 5, y: shoulder.y };
    const nearFoot = worldPoint(pose.nearFoot);
    const farFoot = worldPoint(pose.farFoot);
    const nearHand = {
      x: nearShoulder.x + pose.nearHandOffset.x,
      y: nearShoulder.y + pose.nearHandOffset.y,
    };
    const farHand = {
      x: farShoulder.x + pose.farHandOffset.x,
      y: farShoulder.y + pose.farHandOffset.y,
    };
    const farLeg = solveTwoBoneChain(farHip, farFoot, 44, 44, -1);
    const nearLeg = solveTwoBoneChain(nearHip, nearFoot, 44, 44, -1);
    const farArm = solveTwoBoneChain(farShoulder, farHand, 31, 30, 1);
    const nearArm = solveTwoBoneChain(nearShoulder, nearHand, 31, 30, -1);

    context.save();
    this.drawDebugGuide(context, canvas, groundY);
    this.drawDebugChain(context, farLeg, 13, '#9a8bff', 'rgba(117, 96, 244, .24)', 0.72);
    this.drawDebugFoot(context, farLeg.end, pose.farFoot, groundY, '#9a8bff', 'rgba(117, 96, 244, .24)', 0.72);
    this.drawDebugChain(context, farArm, 10, '#9a8bff', 'rgba(117, 96, 244, .24)', 0.72);

    this.drawDebugSegment(context, hip, shoulder, 32, '#ffd661', 'rgba(255, 190, 49, .23)');
    this.drawDebugSegment(context, farHip, nearHip, 16, '#ffd661', 'rgba(255, 190, 49, .23)');
    this.drawDebugJoint(context, hip, '#ffd661', 5);
    this.drawDebugJoint(context, shoulder, '#ffd661', 5);
    this.drawDebugJoint(context, neck, '#70f0b1', 4);

    this.drawDebugChain(context, nearLeg, 14, '#5ce9ff', 'rgba(40, 207, 239, .28)', 1);
    this.drawDebugFoot(context, nearLeg.end, pose.nearFoot, groundY, '#5ce9ff', 'rgba(40, 207, 239, .28)', 1);
    this.drawDebugChain(context, nearArm, 11, '#5ce9ff', 'rgba(40, 207, 239, .28)', 1);

    this.drawHeadHitbox(context, neck, pose.headAngle);
    this.drawRigPart(context, RigPart.head, neck, pose.headAngle, 0.3, { x: 160, y: 302 });

    context.fillStyle = 'rgba(4, 27, 55, .78)';
    context.fillRect(15, 15, 264, 46);
    context.fillStyle = '#dffaff';
    context.font = '700 12px "IBM Plex Mono", monospace';
    context.fillText(motion === 'run' ? 'CONTACT-SOLVED RUN CYCLE' : 'CONTACT-SOLVED JUMP ARC', 27, 34);
    context.fillStyle = '#8ab1ca';
    context.font = '600 10px "IBM Plex Mono", monospace';
    context.fillText('CYAN near · VIOLET far · AMBER body', 27, 50);
    context.restore();
    this.markFrame(preview, frame);
  }

  private drawDebugGuide(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    groundY: number,
  ): void {
    context.save();
    context.strokeStyle = 'rgba(9, 59, 91, .13)';
    context.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 25) {
      context.beginPath();
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, groundY);
      context.stroke();
    }
    for (let y = 0; y <= groundY; y += 25) {
      context.beginPath();
      context.moveTo(0, y + 0.5);
      context.lineTo(canvas.width, y + 0.5);
      context.stroke();
    }
    context.strokeStyle = 'rgba(255, 242, 177, .9)';
    context.lineWidth = 3;
    context.setLineDash([12, 7]);
    context.beginPath();
    context.moveTo(0, groundY - 1);
    context.lineTo(canvas.width, groundY - 1);
    context.stroke();
    context.restore();
  }

  private drawDebugChain(
    context: CanvasRenderingContext2D,
    chain: TwoBoneChain,
    width: number,
    stroke: string,
    fill: string,
    opacity: number,
  ): void {
    context.save();
    context.globalAlpha = opacity;
    this.drawDebugSegment(context, chain.root, chain.joint, width, stroke, fill);
    this.drawDebugSegment(context, chain.joint, chain.end, width * 0.88, stroke, fill);
    this.drawDebugJoint(context, chain.root, stroke, 4.5);
    this.drawDebugJoint(context, chain.joint, stroke, 4);
    this.drawDebugJoint(context, chain.end, stroke, 3.5);
    context.restore();
  }

  private drawDebugSegment(
    context: CanvasRenderingContext2D,
    start: RigPoint,
    end: RigPoint,
    width: number,
    stroke: string,
    fill: string,
  ): void {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const length = Math.hypot(deltaX, deltaY);
    context.save();
    context.translate(start.x, start.y);
    context.rotate(Math.atan2(deltaY, deltaX));
    context.fillStyle = fill;
    context.strokeStyle = stroke;
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(0, -width / 2, length, width, width / 2);
    context.fill();
    context.stroke();
    context.strokeStyle = stroke;
    context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(length, 0);
    context.stroke();
    context.restore();
  }

  private drawDebugJoint(
    context: CanvasRenderingContext2D,
    point: RigPoint,
    colour: string,
    radius: number,
  ): void {
    context.fillStyle = '#071b37';
    context.strokeStyle = colour;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  private drawDebugFoot(
    context: CanvasRenderingContext2D,
    ankle: RigPoint,
    relativeFoot: RigPoint,
    groundY: number,
    stroke: string,
    fill: string,
    opacity: number,
  ): void {
    const onGround = Math.abs(relativeFoot.y + 8) < 0.01;
    const toe = {
      x: ankle.x + 27,
      y: onGround ? ankle.y : ankle.y + 2,
    };
    context.save();
    context.globalAlpha = opacity;
    this.drawDebugSegment(context, ankle, toe, 15, stroke, fill);
    this.drawDebugJoint(context, toe, stroke, 3);
    if (onGround) {
      context.strokeStyle = '#fff0a6';
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(ankle.x - 4, groundY - 1);
      context.lineTo(toe.x + 4, groundY - 1);
      context.stroke();
    }
    context.restore();
  }

  private drawHeadHitbox(
    context: CanvasRenderingContext2D,
    neck: RigPoint,
    angle: number,
  ): void {
    context.save();
    context.translate(neck.x, neck.y);
    context.rotate(angle);
    context.fillStyle = 'rgba(78, 242, 159, .13)';
    context.strokeStyle = '#70f0b1';
    context.lineWidth = 2;
    context.setLineDash([5, 4]);
    context.beginPath();
    context.roundRect(-26, -62, 57, 61, 19);
    context.fill();
    context.stroke();
    context.restore();
  }

  private drawLayeredRig(
    preview: Preview,
    pose: LayeredRigPose,
    frame: number,
    groundY: number,
  ): void {
    const { context, canvas } = preview;
    const hip = {
      x: canvas.width / 2 + pose.hipX,
      y: groundY - 83 + pose.hipY,
    };
    const farHip = { x: hip.x - 7, y: hip.y + 1 };
    const nearHip = { x: hip.x + 7, y: hip.y };
    const shoulder = rigEndpoint(hip, pose.torsoAngle + Math.PI, 61);
    const farShoulder = { x: shoulder.x - 7, y: shoulder.y + 2 };
    const nearShoulder = { x: shoulder.x + 8, y: shoulder.y };
    const neck = rigEndpoint(hip, pose.torsoAngle + Math.PI, 82);

    context.save();
    context.globalAlpha = 0.96;
    this.drawRigLimb(
      context,
      RigPart.farThigh,
      RigPart.farShin,
      RigPart.farShoe,
      farHip,
      pose.farThighAngle,
      pose.farShinAngle,
      pose.shoeAngle,
      true,
    );
    this.drawRigArm(
      context,
      RigPart.farUpperArm,
      RigPart.farForearm,
      farShoulder,
      pose.farUpperArmAngle,
      pose.farForearmAngle,
      true,
    );
    context.restore();

    this.drawRigPart(context, RigPart.rearJacketTail, { x: hip.x - 8, y: hip.y - 34 }, pose.rearTailAngle, 0.22, { x: 104, y: 38 });
    this.drawRigPart(context, RigPart.hair, { x: neck.x - 8, y: neck.y + 5 }, pose.hairAngle, 0.2, { x: 178, y: 260 });
    this.drawRigPart(context, RigPart.hood, { x: neck.x - 7, y: neck.y + 16 }, pose.hoodAngle, 0.22, { x: 152, y: 283 });
    this.drawRigPart(context, RigPart.torso, hip, pose.torsoAngle, 0.38, { x: 192, y: 285 });
    this.drawRigPart(context, RigPart.frontJacketTail, { x: hip.x + 4, y: hip.y - 32 }, pose.frontTailAngle, 0.18, { x: 118, y: 37 });

    this.drawRigLimb(
      context,
      RigPart.nearThigh,
      RigPart.nearShin,
      RigPart.nearShoe,
      nearHip,
      pose.nearThighAngle,
      pose.nearShinAngle,
      pose.shoeAngle,
      false,
    );
    this.drawRigArm(
      context,
      RigPart.nearUpperArm,
      RigPart.nearForearm,
      nearShoulder,
      pose.nearUpperArmAngle,
      pose.nearForearmAngle,
      false,
    );
    this.drawRigPart(context, RigPart.head, neck, pose.headAngle, 0.3, { x: 160, y: 302 });

    this.markFrame(preview, frame);
  }

  private drawRigArm(
    context: CanvasRenderingContext2D,
    upperPart: number,
    forearmPart: number,
    shoulder: RigPoint,
    upperAngle: number,
    forearmAngle: number,
    farSide: boolean,
  ): void {
    const upperPivot = farSide ? { x: 160, y: 92 } : { x: 188, y: 8 };
    const forearmPivot = farSide ? { x: 130, y: 99 } : { x: 172, y: 8 };
    this.drawRigPart(context, upperPart, shoulder, upperAngle, farSide ? 0.16 : 0.145, upperPivot);
    const elbow = rigEndpoint(shoulder, upperAngle, 35);
    this.drawRigPart(context, forearmPart, elbow, forearmAngle, farSide ? 0.16 : 0.145, forearmPivot);
  }

  private drawRigLimb(
    context: CanvasRenderingContext2D,
    thighPart: number,
    shinPart: number,
    shoePart: number,
    hip: RigPoint,
    thighAngle: number,
    shinAngle: number,
    shoeAngle: number,
    farSide: boolean,
  ): void {
    const thighPivot = farSide ? { x: 135, y: 8 } : { x: 192, y: 8 };
    const shinPivot = farSide ? { x: 113, y: 40 } : { x: 170, y: 8 };
    const shoePivot = farSide ? { x: 92, y: 112 } : { x: 142, y: 15 };
    this.drawRigPart(context, thighPart, hip, thighAngle, 0.19, thighPivot);
    const knee = rigEndpoint(hip, thighAngle, 45);
    this.drawRigPart(context, shinPart, knee, shinAngle, 0.18, shinPivot);
    const ankle = rigEndpoint(knee, shinAngle, 43);
    this.drawRigPart(context, shoePart, ankle, shoeAngle, 0.18, shoePivot);
  }

  private drawRigPart(
    context: CanvasRenderingContext2D,
    part: number,
    position: RigPoint,
    angle: number,
    scale: number,
    pivot: RigPoint,
  ): void {
    if (!this.sprites.layeredRig.ready) return;
    const sourceX = part % RIG_PART_COLUMNS * RIG_PART_CELL_SIZE;
    const sourceY = Math.floor(part / RIG_PART_COLUMNS) * RIG_PART_CELL_SIZE;
    context.save();
    context.translate(position.x, position.y);
    context.rotate(angle);
    context.drawImage(
      this.sprites.layeredRig,
      sourceX,
      sourceY,
      RIG_PART_CELL_SIZE,
      RIG_PART_CELL_SIZE,
      -pivot.x * scale,
      -pivot.y * scale,
      RIG_PART_CELL_SIZE * scale,
      RIG_PART_CELL_SIZE * scale,
    );
    context.restore();
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

  private drawDoubleJumpV2(preview: Preview, elapsed: number, forcedFrame: number | null): void {
    const frameTime = forcedFrame === null
      ? elapsed % DOUBLE_JUMP_V2_DURATION
      : forcedFrame / 30;
    const frame = getDoubleJumpV2Frame(frameTime);
    const progress = frame.index / 15;
    const anticipation = progress < 0.25 ? Math.sin(progress / 0.25 * Math.PI) * 10 : 0;
    const impulseArc = Math.sin(Math.max(0, (progress - 0.2) / 0.8) * Math.PI) * preview.canvas.height * 0.17;
    this.drawAtlas(
      preview.context,
      this.sprites.doubleJumpV2,
      frame,
      DOUBLE_JUMP_V2_FRAME_WIDTH,
      DOUBLE_JUMP_V2_FRAME_HEIGHT,
      preview.canvas.width / 2,
      preview.canvas.height * 0.79 + anticipation - impulseArc,
      222,
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
    preview.frameReadout.textContent = `Frame ${preview.currentFrame + 1} / ${ANIMATION_CONFIG[preview.kind].frameCount} · ${activeCount} active · ${this.metricsText(preview.kind, activeCount, false)}`;
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

  private metricsText(kind: AnimationKind, frameCount: number, includeFrameCount = true): string {
    const config = ANIMATION_CONFIG[kind];
    const framesPerSecond = config.frameCount / config.duration;
    const duration = frameCount / framesPerSecond;
    const fpsLabel = Number.isInteger(framesPerSecond)
      ? String(framesPerSecond)
      : framesPerSecond.toFixed(2);
    const prefix = includeFrameCount ? `${frameCount} frames · ` : '';
    return `${prefix}${duration.toFixed(2)} s total · ${fpsLabel} FPS`;
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
    this.sprites.layeredRig.src = hugoLayeredRigPartsUrl;
    this.sprites.walkParts.src = hugoWalkV4PartsUrl;
    this.sprites.walkLegs.src = hugoWalkV4LegsUrl;
    this.sprites.doubleJump.src = hugoDoubleJumpCycleUrl;
    this.sprites.doubleJumpV2.src = hugoDoubleJumpV2CycleUrl;
    this.sprites.freefall.src = hugoFreefallCycleUrl;
    this.sprites.freefallV2.src = hugoFreefallV2CycleUrl;
    this.sprites.powered.src = hugoPoweredCycleUrl;
    this.sprites.glide.src = hugoGlideCycleUrl;
    this.sprites.grind.src = hugoGrindCycleUrl;
    this.sprites.wall.src = hugoWallRecoveryCycleUrl;
    this.sprites.flame.src = jetFlameCycleUrl;
  }
}
