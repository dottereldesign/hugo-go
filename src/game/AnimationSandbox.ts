import hugoDoubleJumpCycleUrl from '../assets/game/hugo-double-jump-cycle.webp';
import hugoDoubleJumpV2CycleUrl from '../assets/game/hugo-double-jump-v2-cycle.png';
import hugoFreefallCycleUrl from '../assets/game/hugo-freefall-cycle.webp';
import hugoFreefallV2CycleUrl from '../assets/game/hugo-freefall-v2-cycle.png';
import hugoGlideCycleUrl from '../assets/game/hugo-glide-cycle.webp';
import hugoGrindCycleUrl from '../assets/game/hugo-grind-cycle.webp';
import hugoHeadTurnStabilizedCycleUrl from '../assets/game/hugo-head-turn-stabilized-cycle.png';
import hugoJumpLandCycleUrl from '../assets/game/hugo-jump-land-cycle.webp';
import hugoLayeredRigPartsUrl from '../assets/game/hugo-layered-rig-parts.png';
import hugoPoweredCycleUrl from '../assets/game/hugo-powered-cycle.webp';
import hugoRunCycleUrl from '../assets/game/hugo-run-60-cycle.webp';
import hugoWalkV4LegsUrl from '../assets/game/hugo-walk-v4-legs.png';
import hugoWalkV4PartsUrl from '../assets/game/hugo-walk-v4-parts.png';
import hugoWalkV5TorsoUrl from '../assets/game/hugo-walk-v5-torso.png';
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
  HEAD_TURN_FRAME_COUNT,
  HEAD_TURN_V3_FRAME_COUNT,
  WALK_V4_FRAME_COUNT,
  WALK_V5_FRAME_COUNT,
  WALK_V6_FRAME_COUNT,
  WALK_V6_LEFT_ARM_BEND,
  WALK_V6_RIGHT_ARM_BEND,
  RigPart,
  getDebugJumpPose,
  getDebugRunPose,
  getHeadTurnPose,
  getHeadTurnV3Pose,
  getRiggedJumpPose,
  getRiggedRunPose,
  getWalkV4Pose,
  getWalkV5Pose,
  getWalkV6Pose,
  rigEndpoint,
  solveTwoBoneChain,
  type DebugRigPose,
  type LayeredRigPose,
  type RigPoint,
  type TwoBoneChain,
  type WalkFootPose,
  type WalkV4Pose,
  type WalkV6Pose,
} from './layeredRig';

const HEAD_TURN_V3_FRAME_URLS = Object.entries(
  import.meta.glob('../assets/game/hugo-head-turn-v3/frame-*.png', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([, url]) => url as string);
const HEAD_TURN_V3_ART_FRAME_COUNT = HEAD_TURN_V3_FRAME_URLS.length;

type AnimationKind = 'run' | 'jump' | 'rig-run-v2' | 'rig-jump-v2' | 'rig-run-debug' | 'rig-jump-debug' | 'walk-v4-debug' | 'walk-v4-painted' | 'walk-v5-debug' | 'walk-v5-painted' | 'walk-v6-debug' | 'walk-v6-painted' | 'head-turn-debug' | 'head-turn-painted' | 'head-turn-fixed-debug' | 'head-turn-fixed-painted' | 'head-turn-v3-debug' | 'head-turn-v3-painted' | 'double-jump' | 'double-jump-v2' | 'freefall' | 'freefall-v2' | 'powered' | 'glide' | 'grind' | 'wall' | 'flame';
type LoadedSprite = HTMLImageElement & { ready?: boolean };
type AnatomySprite = 'parts' | 'legs' | 'torso';

interface Preview {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  kind: AnimationKind;
  controls: HTMLElement;
  playButton: HTMLButtonElement;
  loopButton: HTMLButtonElement;
  editButton: HTMLButtonElement;
  metrics: HTMLElement | null;
  frameReadout: HTMLElement;
  frameButtons: HTMLButtonElement[];
  speedInput: HTMLInputElement;
  speedOutput: HTMLOutputElement;
  elapsed: number;
  frameAccumulator: number;
  currentFrame: number;
  speed: number;
  visible: boolean;
  playing: boolean;
  looping: boolean;
  editing: boolean;
  activeFrames: boolean[];
  dragging: boolean;
  dragPointerId: number | null;
  dragStartX: number;
  dragStartFrame: number;
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

interface WalkArmGeometry {
  root: RigPoint;
  elbow: RigPoint;
  wrist: RigPoint;
  hand: RigPoint;
}

interface WalkV6RigGeometry {
  hip: RigPoint;
  rightHip: RigPoint;
  leftHip: RigPoint;
  spine: RigPoint;
  chest: RigPoint;
  neck: RigPoint;
  rightShoulder: RigPoint;
  leftShoulder: RigPoint;
  rightLeg: TwoBoneChain;
  leftLeg: TwoBoneChain;
  rightArm: WalkArmGeometry;
  leftArm: WalkArmGeometry;
  rightFoot: WalkFootGeometry;
  leftFoot: WalkFootGeometry;
}

interface AtlasPartRegistration {
  part: number;
  columns: number;
  rows: number;
  sourceStart: RigPoint;
  sourceEnd: RigPoint;
}

interface AtlasSubpartRegistration extends AtlasPartRegistration {
  crop: DrawRect;
}

interface AnatomyPart {
  id: string;
  label: string;
  sockets: string;
  sprite: AnatomySprite;
  part: number;
  columns: number;
  rows: number;
  crop: DrawRect;
  start: RigPoint;
  end: RigPoint;
  colour: string;
}

interface HeadTurnLandmark {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  point: { x: number; y: number; z: number };
  colour: string;
}

const HEAD_TURN_LANDMARKS: HeadTurnLandmark[] = [
  { id: 'crown', label: 'Crown', shortLabel: 'CROWN', description: 'Top-of-head height anchor', point: { x: 0, y: -72, z: 0 }, colour: '#ffd661' },
  { id: 'hairline', label: 'Hairline', shortLabel: 'HAIRLINE', description: 'Front hair and forehead anchor', point: { x: 0, y: -43, z: 39 }, colour: '#70f0b1' },
  { id: 'left-eye', label: 'Left eye', shortLabel: 'LEFT EYE', description: 'Hugo’s anatomical left eye', point: { x: -17, y: -14, z: 42 }, colour: '#5ce9ff' },
  { id: 'right-eye', label: 'Right eye', shortLabel: 'RIGHT EYE', description: 'Hugo’s anatomical right eye', point: { x: 17, y: -14, z: 42 }, colour: '#5ce9ff' },
  { id: 'left-ear', label: 'Left ear', shortLabel: 'LEFT EAR', description: 'Left-side skull anchor', point: { x: -43, y: -5, z: -1 }, colour: '#9a8bff' },
  { id: 'right-ear', label: 'Right ear', shortLabel: 'RIGHT EAR', description: 'Right-side skull anchor', point: { x: 43, y: -5, z: -1 }, colour: '#9a8bff' },
  { id: 'nose', label: 'Nose', shortLabel: 'NOSE', description: 'Furthest-forward facial anchor', point: { x: 0, y: 1, z: 61 }, colour: '#ff8e6e' },
  { id: 'left-mouth', label: 'Left mouth corner', shortLabel: 'LEFT MOUTH', description: 'Left end of the mouth line', point: { x: -11, y: 24, z: 46 }, colour: '#ff8e6e' },
  { id: 'right-mouth', label: 'Right mouth corner', shortLabel: 'RIGHT MOUTH', description: 'Right end of the mouth line', point: { x: 11, y: 24, z: 46 }, colour: '#ff8e6e' },
  { id: 'chin', label: 'Chin', shortLabel: 'CHIN', description: 'Lower face and jaw-height anchor', point: { x: 0, y: 61, z: 29 }, colour: '#ffd661' },
  { id: 'nape', label: 'Nape', shortLabel: 'NAPE', description: 'Back-of-neck rotation anchor', point: { x: 0, y: 52, z: -35 }, colour: '#70f0b1' },
];

const WALK_V6_ANATOMY: AnatomyPart[] = [
  { id: 'head', label: 'Head', sockets: 'neck → crown', sprite: 'parts', part: 1, columns: 4, rows: 4, crop: { x: 0.12, y: 0.06, width: 0.78, height: 0.91 }, start: { x: 0.57, y: 0.93 }, end: { x: 0.52, y: 0.12 }, colour: '#70f0b1' },
  { id: 'torso', label: 'Torso', sockets: 'hips → neck', sprite: 'torso', part: 0, columns: 1, rows: 1, crop: { x: 0.28, y: 0.06, width: 0.4, height: 0.84 }, start: { x: 0.5, y: 0.742 }, end: { x: 0.48, y: 0.092 }, colour: '#ffd661' },
  { id: 'left-upper-arm', label: 'Left upper arm', sockets: 'left shoulder → elbow', sprite: 'parts', part: 2, columns: 4, rows: 4, crop: { x: 0.13, y: 0.4, width: 0.69, height: 0.36 }, start: { x: 0.17, y: 0.6 }, end: { x: 0.77, y: 0.6 }, colour: '#5ce9ff' },
  { id: 'left-forearm', label: 'Left forearm', sockets: 'left elbow → wrist', sprite: 'parts', part: 3, columns: 4, rows: 4, crop: { x: 0.06, y: 0.4, width: 0.58, height: 0.4 }, start: { x: 0.1, y: 0.6 }, end: { x: 0.59, y: 0.62 }, colour: '#5ce9ff' },
  { id: 'left-hand', label: 'Left hand', sockets: 'left wrist → fingertips', sprite: 'parts', part: 3, columns: 4, rows: 4, crop: { x: 0.55, y: 0.45, width: 0.39, height: 0.37 }, start: { x: 0.59, y: 0.62 }, end: { x: 0.88, y: 0.68 }, colour: '#5ce9ff' },
  { id: 'right-upper-arm', label: 'Right upper arm', sockets: 'right shoulder → elbow', sprite: 'parts', part: 4, columns: 4, rows: 4, crop: { x: 0.26, y: 0.29, width: 0.68, height: 0.41 }, start: { x: 0.3, y: 0.52 }, end: { x: 0.89, y: 0.52 }, colour: '#9a8bff' },
  { id: 'right-forearm', label: 'Right forearm', sockets: 'right elbow → wrist', sprite: 'parts', part: 5, columns: 4, rows: 4, crop: { x: 0.16, y: 0.31, width: 0.58, height: 0.47 }, start: { x: 0.2, y: 0.53 }, end: { x: 0.7, y: 0.55 }, colour: '#9a8bff' },
  { id: 'right-hand', label: 'Right hand', sockets: 'right wrist → fingertips', sprite: 'parts', part: 5, columns: 4, rows: 4, crop: { x: 0.66, y: 0.37, width: 0.32, height: 0.41 }, start: { x: 0.7, y: 0.55 }, end: { x: 0.94, y: 0.62 }, colour: '#9a8bff' },
  { id: 'left-thigh', label: 'Left thigh', sockets: 'left hip → knee', sprite: 'legs', part: 0, columns: 2, rows: 2, crop: { x: 0.12, y: 0.36, width: 0.79, height: 0.3 }, start: { x: 0.15, y: 0.525 }, end: { x: 0.893, y: 0.525 }, colour: '#5ce9ff' },
  { id: 'left-shin', label: 'Left shin', sockets: 'left knee → ankle', sprite: 'legs', part: 1, columns: 2, rows: 2, crop: { x: 0.08, y: 0.39, width: 0.82, height: 0.25 }, start: { x: 0.11, y: 0.52 }, end: { x: 0.864, y: 0.52 }, colour: '#5ce9ff' },
  { id: 'left-shoe', label: 'Left shoe', sockets: 'left ankle → toe', sprite: 'parts', part: 8, columns: 4, rows: 4, crop: { x: 0.12, y: 0.22, width: 0.87, height: 0.51 }, start: { x: 0.52, y: 0.32 }, end: { x: 0.95, y: 0.61 }, colour: '#5ce9ff' },
  { id: 'right-thigh', label: 'Right thigh', sockets: 'right hip → knee', sprite: 'legs', part: 2, columns: 2, rows: 2, crop: { x: 0.12, y: 0.36, width: 0.79, height: 0.3 }, start: { x: 0.15, y: 0.515 }, end: { x: 0.893, y: 0.515 }, colour: '#9a8bff' },
  { id: 'right-shin', label: 'Right shin', sockets: 'right knee → ankle', sprite: 'legs', part: 3, columns: 2, rows: 2, crop: { x: 0.08, y: 0.39, width: 0.82, height: 0.25 }, start: { x: 0.11, y: 0.52 }, end: { x: 0.864, y: 0.52 }, colour: '#9a8bff' },
  { id: 'right-shoe', label: 'Right shoe', sockets: 'right ankle → toe', sprite: 'parts', part: 11, columns: 4, rows: 4, crop: { x: 0.11, y: 0.22, width: 0.87, height: 0.51 }, start: { x: 0.4, y: 0.32 }, end: { x: 0.95, y: 0.61 }, colour: '#9a8bff' },
];

const ANIMATION_CONFIG: Record<AnimationKind, { frameCount: number; duration: number }> = {
  run: { frameCount: 60, duration: 2 },
  jump: { frameCount: 8, duration: 2.4 },
  'rig-run-v2': { frameCount: RIGGED_RUN_FRAME_COUNT, duration: 1 },
  'rig-jump-v2': { frameCount: RIGGED_JUMP_FRAME_COUNT, duration: 1.2 },
  'rig-run-debug': { frameCount: RIGGED_RUN_FRAME_COUNT, duration: 1 },
  'rig-jump-debug': { frameCount: RIGGED_JUMP_FRAME_COUNT, duration: 1.2 },
  'walk-v4-debug': { frameCount: WALK_V4_FRAME_COUNT, duration: 1.2 },
  'walk-v4-painted': { frameCount: WALK_V4_FRAME_COUNT, duration: 1.2 },
  'walk-v5-debug': { frameCount: WALK_V5_FRAME_COUNT, duration: 1.2 },
  'walk-v5-painted': { frameCount: WALK_V5_FRAME_COUNT, duration: 1.2 },
  'walk-v6-debug': { frameCount: WALK_V6_FRAME_COUNT, duration: 1.2 },
  'walk-v6-painted': { frameCount: WALK_V6_FRAME_COUNT, duration: 1.2 },
  'head-turn-debug': { frameCount: HEAD_TURN_FRAME_COUNT, duration: 0.8 },
  'head-turn-painted': { frameCount: HEAD_TURN_FRAME_COUNT, duration: 0.8 },
  'head-turn-fixed-debug': { frameCount: HEAD_TURN_FRAME_COUNT, duration: 0.8 },
  'head-turn-fixed-painted': { frameCount: HEAD_TURN_FRAME_COUNT, duration: 0.8 },
  'head-turn-v3-debug': { frameCount: HEAD_TURN_V3_FRAME_COUNT, duration: 0.8 },
  'head-turn-v3-painted': {
    frameCount: HEAD_TURN_V3_ART_FRAME_COUNT,
    duration: HEAD_TURN_V3_ART_FRAME_COUNT / 60,
  },
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

const SPEED_MIN = 0.1;
const SPEED_MAX = 2;
const SPEED_STEP = 0.05;
const HEAD_TURN_DEFAULT_SPEED = 0.4;

export class AnimationSandbox {
  private readonly previews: Preview[];
  private readonly sprites = {
    run: this.createSprite(),
    jump: this.createSprite(),
    layeredRig: this.createSprite(),
    walkParts: this.createSprite(),
    walkLegs: this.createSprite(),
    walkV5Torso: this.createSprite(),
    headTurnStabilized: this.createSprite(),
    headTurnV3: HEAD_TURN_V3_FRAME_URLS.map(() => this.createSprite()),
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
  private headTurnV3AssetsStarted = false;
  private running = false;
  private animationFrame = 0;
  private previousTime = 0;
  private readonly visibilityObserver: IntersectionObserver | null;
  private readonly anatomyCanvas: HTMLCanvasElement | null;
  private readonly anatomyContext: CanvasRenderingContext2D | null;
  private activeAnatomyPart = 'all';
  private anatomyDirty = true;
  private activeHeadLandmark = 'all';

  constructor(private readonly root: HTMLElement) {
    this.anatomyCanvas = root.querySelector<HTMLCanvasElement>('[data-rig-anatomy-canvas]');
    this.anatomyContext = this.anatomyCanvas?.getContext('2d') ?? null;
    this.previews = Array.from(root.querySelectorAll<HTMLCanvasElement>('[data-sandbox-animation]')).map((canvas) => {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Animation Sandbox requires a 2D canvas context.');
      const kind = canvas.dataset.sandboxAnimation as AnimationKind;
      const metrics = canvas.closest<HTMLElement>('[data-sandbox-card]')?.querySelector<HTMLElement>('[data-sandbox-metrics]');
      const speed = this.loadSpeed(kind);
      const controls = this.createControls(canvas, kind, speed);
      const frameButtons = Array.from(controls.querySelectorAll<HTMLButtonElement>('[data-frame]'));
      return {
        canvas,
        context,
        kind,
        controls,
        playButton: this.controlButton(controls, '[data-sandbox-control="play"]'),
        loopButton: this.controlButton(controls, '[data-sandbox-control="loop"]'),
        editButton: this.controlButton(controls, '[data-sandbox-control="edit"]'),
        metrics: metrics ?? null,
        frameReadout: this.controlElement(controls, '[data-sandbox-frame-readout]'),
        frameButtons,
        speedInput: this.controlInput(controls, '[data-sandbox-speed]'),
        speedOutput: this.controlOutput(controls, '[data-sandbox-speed-output]'),
        elapsed: 0,
        frameAccumulator: 0,
        currentFrame: 0,
        speed,
        visible: typeof IntersectionObserver === 'undefined',
        playing: true,
        looping: true,
        editing: false,
        activeFrames: this.loadActiveFrames(kind, ANIMATION_CONFIG[kind].frameCount),
        dragging: false,
        dragPointerId: null,
        dragStartX: 0,
        dragStartFrame: 0,
      };
    });
    for (const preview of this.previews) {
      this.syncControls(preview);
      if (preview.kind === 'head-turn-v3-debug' || preview.kind === 'head-turn-v3-painted') {
        this.setupHeadTurnScrubbing(preview);
      }
    }
    this.visibilityObserver = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const preview = this.previews.find((candidate) => candidate.canvas === entry.target);
            if (!preview) continue;
            preview.visible = entry.isIntersecting;
            if (preview.visible) {
              if (preview.kind === 'head-turn-v3-painted') {
                this.ensureHeadTurnV3Assets();
              }
              this.syncControls(preview);
              this.drawPreview(preview, preview.elapsed, preview.currentFrame);
            }
          }
        },
        { rootMargin: '180px 0px' },
      );
    for (const preview of this.previews) this.visibilityObserver?.observe(preview.canvas);
    this.root.addEventListener('click', (event) => this.handleControl(event));
    this.root.addEventListener('input', (event) => this.handleSpeedControl(event));
    this.root.addEventListener('click', (event) => this.handleAnatomySelection(event));
    this.root.addEventListener('pointerover', (event) => this.handleAnatomyHover(event));
    this.root.addEventListener('focusin', (event) => this.handleAnatomyHover(event));
    this.root.addEventListener('click', (event) => this.handleHeadLandmarkSelection(event));
    this.root.addEventListener('pointerover', (event) => this.handleHeadLandmarkSelection(event));
    this.root.addEventListener('focusin', (event) => this.handleHeadLandmarkSelection(event));
    this.syncAnatomyControls();
    this.syncHeadLandmarkControls();
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
      const frameChanged = preview.playing ? this.advance(preview, delta) : false;
      if (!preview.visible) continue;
      if (frameChanged) this.syncControls(preview);
      this.drawPreview(preview, preview.elapsed, preview.currentFrame);
    }
    if (this.anatomyDirty) {
      this.drawAnatomySheet();
      this.anatomyDirty = false;
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
        || kind === 'walk-v4-painted'
        || kind === 'walk-v5-debug'
        || kind === 'walk-v5-painted'
        || kind === 'walk-v6-debug'
        || kind === 'walk-v6-painted',
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
      case 'walk-v5-debug':
        this.drawWalkingV5Debug(preview, forcedFrame);
        break;
      case 'walk-v5-painted':
        this.drawWalkingV5Painted(preview, forcedFrame);
        break;
      case 'walk-v6-debug':
        this.drawWalkingV6Debug(preview, forcedFrame);
        break;
      case 'walk-v6-painted':
        this.drawWalkingV6Painted(preview, forcedFrame);
        break;
      case 'head-turn-debug':
        this.drawHeadTurnDebug(preview, forcedFrame);
        break;
      case 'head-turn-painted':
        this.drawHeadTurnPainted(preview, forcedFrame);
        break;
      case 'head-turn-fixed-debug':
        this.drawHeadTurnFixedDebug(preview, forcedFrame);
        break;
      case 'head-turn-fixed-painted':
        this.drawHeadTurnFixedPainted(preview, forcedFrame);
        break;
      case 'head-turn-v3-debug':
        this.drawHeadTurnV3Debug(preview, forcedFrame);
        break;
      case 'head-turn-v3-painted':
        this.drawHeadTurnV3Painted(preview, forcedFrame);
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

  private drawWalkingV5Debug(preview: Preview, forcedFrame: number | null): void {
    const frame = forcedFrame ?? 0;
    const pose = getWalkV5Pose(frame);
    const groundY = preview.canvas.height * 0.82;
    const geometry = this.buildWalkingV5Rig(preview.canvas, pose, groundY);
    const { context, canvas } = preview;

    context.save();
    this.drawDebugGuide(context, canvas, groundY);
    this.drawDebugChain(context, geometry.farLeg, 13, '#9a8bff', 'rgba(117, 96, 244, .24)', 0.72);
    this.drawWalkingDebugFoot(context, geometry.farFoot, groundY, '#9a8bff', 'rgba(117, 96, 244, .24)', 0.72);
    this.drawDebugChain(context, geometry.farArm, 11, '#9a8bff', 'rgba(117, 96, 244, .24)', 0.72);

    this.drawDebugSegment(context, geometry.hip, geometry.spine, 35, '#ffd661', 'rgba(255, 190, 49, .23)');
    this.drawDebugSegment(context, geometry.spine, geometry.chest, 33, '#ffd661', 'rgba(255, 190, 49, .23)');
    this.drawDebugSegment(context, geometry.chest, geometry.neck, 23, '#70f0b1', 'rgba(66, 216, 149, .2)');
    this.drawDebugSegment(context, geometry.farHip, geometry.nearHip, 16, '#ffd661', 'rgba(255, 190, 49, .23)');
    this.drawDebugJoint(context, geometry.hip, '#ffd661', 5);
    this.drawDebugJoint(context, geometry.spine, '#ffd661', 4.5);
    this.drawDebugJoint(context, geometry.chest, '#ffd661', 5);
    this.drawDebugJoint(context, geometry.neck, '#70f0b1', 4);

    this.drawDebugChain(context, geometry.nearLeg, 14, '#5ce9ff', 'rgba(40, 207, 239, .28)', 1);
    this.drawWalkingDebugFoot(context, geometry.nearFoot, groundY, '#5ce9ff', 'rgba(40, 207, 239, .28)', 1);
    this.drawDebugChain(context, geometry.nearArm, 12, '#5ce9ff', 'rgba(40, 207, 239, .28)', 1);

    this.drawHeadHitbox(context, geometry.neck, pose.headAngle);
    this.drawRigPart(context, RigPart.head, geometry.neck, pose.headAngle, 0.3, { x: 160, y: 302 });
    this.drawWalkLabel(context, 'V5 SOURCE-ALIGNED WALK', 'FULL LIMBS · ANKLE-TO-SHOE SOCKETS');
    context.restore();
    this.markFrame(preview, frame);
  }

  private drawWalkingV5Painted(preview: Preview, forcedFrame: number | null): void {
    const frame = forcedFrame ?? 0;
    const pose = getWalkV5Pose(frame);
    const groundY = preview.canvas.height * 0.82;
    const geometry = this.buildWalkingV5Rig(preview.canvas, pose, groundY);
    const { context } = preview;

    context.save();
    context.globalAlpha = 0.82;
    this.drawWalkAtlasBone(context, this.sprites.walkLegs, {
      part: 3,
      columns: 2,
      rows: 2,
      sourceStart: { x: 0.11, y: 0.52 },
      sourceEnd: { x: 0.864, y: 0.52 },
    }, geometry.farLeg.joint, geometry.farLeg.end, 1.12);
    this.drawWalkAtlasBone(context, this.sprites.walkLegs, {
      part: 2,
      columns: 2,
      rows: 2,
      sourceStart: { x: 0.15, y: 0.515 },
      sourceEnd: { x: 0.893, y: 0.515 },
    }, geometry.farLeg.root, geometry.farLeg.joint, 1.08);
    this.drawWalkShoeV5(context, 11, geometry.farFoot, 1);
    this.drawWalkAtlasBone(context, this.sprites.walkParts, {
      part: 5,
      columns: 4,
      rows: 4,
      sourceStart: { x: 0.2, y: 0.53 },
      sourceEnd: { x: 0.94, y: 0.62 },
    }, geometry.farArm.joint, geometry.farArm.end, 1.08);
    this.drawWalkAtlasBone(context, this.sprites.walkParts, {
      part: 4,
      columns: 4,
      rows: 4,
      sourceStart: { x: 0.3, y: 0.52 },
      sourceEnd: { x: 0.89, y: 0.52 },
    }, geometry.farArm.root, geometry.farArm.joint, 1.08);
    context.restore();

    this.drawWalkAtlasBone(context, this.sprites.walkLegs, {
      part: 1,
      columns: 2,
      rows: 2,
      sourceStart: { x: 0.11, y: 0.52 },
      sourceEnd: { x: 0.864, y: 0.52 },
    }, geometry.nearLeg.joint, geometry.nearLeg.end, 1.12);
    this.drawWalkAtlasBone(context, this.sprites.walkLegs, {
      part: 0,
      columns: 2,
      rows: 2,
      sourceStart: { x: 0.15, y: 0.525 },
      sourceEnd: { x: 0.893, y: 0.525 },
    }, geometry.nearLeg.root, geometry.nearLeg.joint, 1.08);
    this.drawWalkShoeV5(context, 8, geometry.nearFoot, 1);

    this.drawWalkingV5Torso(context, geometry.hip, geometry.neck);
    this.drawWalkAtlasBone(context, this.sprites.walkParts, {
      part: 3,
      columns: 4,
      rows: 4,
      sourceStart: { x: 0.1, y: 0.6 },
      sourceEnd: { x: 0.88, y: 0.68 },
    }, geometry.nearArm.joint, geometry.nearArm.end, 1.05);
    this.drawWalkAtlasBone(context, this.sprites.walkParts, {
      part: 2,
      columns: 4,
      rows: 4,
      sourceStart: { x: 0.17, y: 0.6 },
      sourceEnd: { x: 0.77, y: 0.6 },
    }, geometry.nearArm.root, geometry.nearArm.joint, 1.08);
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
    this.drawWalkLabel(context, 'PAINTED V5 · TRUE SIDE TORSO', 'VISIBLE SOCKETS · FULL-LENGTH LIMBS');
    context.restore();
    this.markFrame(preview, frame);
  }

  private drawWalkingV6Debug(preview: Preview, forcedFrame: number | null): void {
    const frame = forcedFrame ?? 0;
    const pose = getWalkV6Pose(frame);
    const groundY = preview.canvas.height * 0.82;
    const geometry = this.buildWalkingV6Rig(preview.canvas, pose, groundY);
    const { context, canvas } = preview;

    context.save();
    this.drawDebugGuide(context, canvas, groundY);
    this.drawDebugChain(context, geometry.rightLeg, 13, '#9a8bff', 'rgba(117, 96, 244, .24)', 0.72);
    this.drawWalkingDebugFoot(context, geometry.rightFoot, groundY, '#9a8bff', 'rgba(117, 96, 244, .24)', 0.72);
    this.drawWalkingV6DebugArm(context, geometry.rightArm, '#9a8bff', 'rgba(117, 96, 244, .24)', 0.72);

    this.drawDebugSegment(context, geometry.hip, geometry.spine, 35, '#ffd661', 'rgba(255, 190, 49, .23)');
    this.drawDebugSegment(context, geometry.spine, geometry.chest, 33, '#ffd661', 'rgba(255, 190, 49, .23)');
    this.drawDebugSegment(context, geometry.chest, geometry.neck, 23, '#70f0b1', 'rgba(66, 216, 149, .2)');
    this.drawDebugSegment(context, geometry.rightHip, geometry.leftHip, 16, '#ffd661', 'rgba(255, 190, 49, .23)');
    this.drawDebugJoint(context, geometry.hip, '#ffd661', 5);
    this.drawDebugJoint(context, geometry.spine, '#ffd661', 4.5);
    this.drawDebugJoint(context, geometry.chest, '#ffd661', 5);
    this.drawDebugJoint(context, geometry.neck, '#70f0b1', 4);

    this.drawDebugChain(context, geometry.leftLeg, 14, '#5ce9ff', 'rgba(40, 207, 239, .28)', 1);
    this.drawWalkingDebugFoot(context, geometry.leftFoot, groundY, '#5ce9ff', 'rgba(40, 207, 239, .28)', 1);
    this.drawWalkingV6DebugArm(context, geometry.leftArm, '#5ce9ff', 'rgba(40, 207, 239, .28)', 1);

    this.drawHeadHitbox(context, geometry.neck, pose.headAngle);
    this.drawRigPart(context, RigPart.head, geometry.neck, pose.headAngle, 0.3, { x: 160, y: 302 });
    this.drawWalkLabel(context, 'WALKING V6 · STABLE JOINTS', 'LEFT CYAN · RIGHT VIOLET · NO IK FLIPS');
    context.restore();
    this.markFrame(preview, frame);
  }

  private drawWalkingV6Painted(preview: Preview, forcedFrame: number | null): void {
    const frame = forcedFrame ?? 0;
    const pose = getWalkV6Pose(frame);
    const groundY = preview.canvas.height * 0.82;
    const geometry = this.buildWalkingV6Rig(preview.canvas, pose, groundY);
    const { context } = preview;

    context.save();
    context.globalAlpha = 0.82;
    this.drawWalkAtlasBone(context, this.sprites.walkLegs, {
      part: 3,
      columns: 2,
      rows: 2,
      sourceStart: { x: 0.11, y: 0.52 },
      sourceEnd: { x: 0.864, y: 0.52 },
    }, geometry.rightLeg.joint, geometry.rightLeg.end, 1.12);
    this.drawWalkAtlasBone(context, this.sprites.walkLegs, {
      part: 2,
      columns: 2,
      rows: 2,
      sourceStart: { x: 0.15, y: 0.515 },
      sourceEnd: { x: 0.893, y: 0.515 },
    }, geometry.rightLeg.root, geometry.rightLeg.joint, 1.08);
    this.drawWalkShoeV6(context, 'right', geometry.rightFoot, 1);
    this.drawWalkAtlasSubpart(context, this.sprites.walkParts, {
      part: 5,
      columns: 4,
      rows: 4,
      crop: { x: 0.66, y: 0.37, width: 0.32, height: 0.41 },
      sourceStart: { x: 0.7, y: 0.55 },
      sourceEnd: { x: 0.94, y: 0.62 },
    }, geometry.rightArm.wrist, geometry.rightArm.hand, 1.08);
    this.drawWalkAtlasSubpart(context, this.sprites.walkParts, {
      part: 5,
      columns: 4,
      rows: 4,
      crop: { x: 0.16, y: 0.31, width: 0.58, height: 0.47 },
      sourceStart: { x: 0.2, y: 0.53 },
      sourceEnd: { x: 0.7, y: 0.55 },
    }, geometry.rightArm.elbow, geometry.rightArm.wrist, 1.08);
    this.drawWalkAtlasBone(context, this.sprites.walkParts, {
      part: 4,
      columns: 4,
      rows: 4,
      sourceStart: { x: 0.3, y: 0.52 },
      sourceEnd: { x: 0.89, y: 0.52 },
    }, geometry.rightArm.root, geometry.rightArm.elbow, 1.08);
    context.restore();

    this.drawWalkAtlasBone(context, this.sprites.walkLegs, {
      part: 1,
      columns: 2,
      rows: 2,
      sourceStart: { x: 0.11, y: 0.52 },
      sourceEnd: { x: 0.864, y: 0.52 },
    }, geometry.leftLeg.joint, geometry.leftLeg.end, 1.12);
    this.drawWalkAtlasBone(context, this.sprites.walkLegs, {
      part: 0,
      columns: 2,
      rows: 2,
      sourceStart: { x: 0.15, y: 0.525 },
      sourceEnd: { x: 0.893, y: 0.525 },
    }, geometry.leftLeg.root, geometry.leftLeg.joint, 1.08);
    this.drawWalkShoeV6(context, 'left', geometry.leftFoot, 1);

    this.drawWalkingV5Torso(context, geometry.hip, geometry.neck);
    this.drawWalkAtlasSubpart(context, this.sprites.walkParts, {
      part: 3,
      columns: 4,
      rows: 4,
      crop: { x: 0.55, y: 0.45, width: 0.39, height: 0.37 },
      sourceStart: { x: 0.59, y: 0.62 },
      sourceEnd: { x: 0.88, y: 0.68 },
    }, geometry.leftArm.wrist, geometry.leftArm.hand, 1.05);
    this.drawWalkAtlasSubpart(context, this.sprites.walkParts, {
      part: 3,
      columns: 4,
      rows: 4,
      crop: { x: 0.06, y: 0.4, width: 0.58, height: 0.4 },
      sourceStart: { x: 0.1, y: 0.6 },
      sourceEnd: { x: 0.59, y: 0.62 },
    }, geometry.leftArm.elbow, geometry.leftArm.wrist, 1.05);
    this.drawWalkAtlasBone(context, this.sprites.walkParts, {
      part: 2,
      columns: 4,
      rows: 4,
      sourceStart: { x: 0.17, y: 0.6 },
      sourceEnd: { x: 0.77, y: 0.6 },
    }, geometry.leftArm.root, geometry.leftArm.elbow, 1.08);
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

    this.drawPaintedWalkV6Nodes(context, geometry);
    this.drawWalkLabel(context, 'PAINTED V6 · MODULAR HANDS', 'ELBOW · WRIST · KNEE · ANKLE SOCKETS');
    context.restore();
    this.markFrame(preview, frame);
  }

  private drawHeadTurnDebug(
    preview: Preview,
    forcedFrame: number | null,
    labelled = false,
  ): void {
    const frame = forcedFrame ?? 0;
    const pose = labelled ? getHeadTurnV3Pose(frame) : getHeadTurnPose(frame);
    const { context, canvas } = preview;
    const center = { x: canvas.width / 2, y: canvas.height * 0.54 };
    const cosine = Math.cos(pose.yaw);
    const sine = Math.sin(pose.yaw);
    const shellWidth = 47 + Math.abs(cosine) * 8;
    const project = (point: { x: number; y: number; z: number }): RigPoint & { depth: number } => ({
      x: center.x + point.x * cosine - point.z * sine,
      y: center.y + point.y,
      depth: point.x * sine + point.z * cosine,
    });
    context.save();
    context.strokeStyle = 'rgba(6, 49, 84, .2)';
    context.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 24) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 24) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }

    context.translate(center.x, center.y);
    context.fillStyle = 'rgba(7, 31, 66, .14)';
    context.strokeStyle = '#dffaff';
    context.lineWidth = 2.5;
    context.beginPath();
    context.ellipse(0, 0, shellWidth, 73, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.strokeStyle = 'rgba(223, 250, 255, .42)';
    context.lineWidth = 1.5;
    context.setLineDash([6, 5]);
    context.beginPath();
    context.ellipse(0, -10, shellWidth, 31, 0, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.ellipse(0, 8, Math.max(6, Math.abs(cosine) * shellWidth), 72, 0, 0, Math.PI * 2);
    context.stroke();
    context.restore();

    const projected = HEAD_TURN_LANDMARKS.map((landmark) => ({
      ...landmark,
      screen: project(landmark.point),
    })).sort((a, b) => a.screen.depth - b.screen.depth);
    for (const landmark of projected) {
      const visible = landmark.screen.depth > -8 || landmark.id === 'crown' || landmark.id === 'nape';
      const selected = !labelled
        || this.activeHeadLandmark === 'all'
        || this.activeHeadLandmark === landmark.id;
      context.save();
      context.globalAlpha = selected ? (visible ? 1 : 0.25) : 0.08;
      if (!visible) context.setLineDash([3, 4]);
      this.drawDebugJoint(
        context,
        landmark.screen,
        landmark.colour,
        selected && this.activeHeadLandmark === landmark.id ? 7 : visible ? 4 : 3,
      );
      if (selected && this.activeHeadLandmark === landmark.id) {
        context.strokeStyle = landmark.colour;
        context.lineWidth = 2;
        context.setLineDash([]);
        context.beginPath();
        context.arc(landmark.screen.x, landmark.screen.y, 12, 0, Math.PI * 2);
        context.stroke();
      }
      context.restore();
    }

    const hairline = project({ x: 0, y: -43, z: 39 });
    const nose = project({ x: 0, y: 1, z: 61 });
    const chin = project({ x: 0, y: 61, z: 29 });
    const faceVisible = Math.cos(pose.yaw) > -0.2;
    context.save();
    context.globalAlpha = faceVisible ? 0.9 : 0.18;
    context.strokeStyle = '#70f0b1';
    context.lineWidth = 2;
    if (!faceVisible) context.setLineDash([4, 5]);
    context.beginPath();
    context.moveTo(hairline.x, hairline.y);
    context.quadraticCurveTo(nose.x, nose.y - 18, nose.x, nose.y);
    context.quadraticCurveTo(nose.x - sine * 8, chin.y - 15, chin.x, chin.y);
    context.stroke();
    context.restore();

    context.save();
    context.translate(center.x, center.y + 97);
    context.strokeStyle = 'rgba(223, 250, 255, .48)';
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(0, 0, 86, 16, 0, 0, Math.PI * 2);
    context.stroke();
    const orbitX = -Math.sin(pose.yaw) * 86;
    context.fillStyle = '#ffd661';
    context.beginPath();
    context.arc(orbitX, 0, 5, 0, Math.PI * 2);
    context.fill();
    context.restore();

    const activeLandmark = labelled
      ? HEAD_TURN_LANDMARKS.find(({ id }) => id === this.activeHeadLandmark)
      : undefined;
    if (activeLandmark) {
      const projectedLandmark = projected.find(({ id }) => id === activeLandmark.id);
      if (projectedLandmark) {
        const boxX = 15;
        const boxY = 73;
        context.save();
        context.strokeStyle = activeLandmark.colour;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(projectedLandmark.screen.x, projectedLandmark.screen.y);
        context.lineTo(210, boxY + 22);
        context.stroke();
        context.fillStyle = 'rgba(4, 27, 55, .9)';
        context.fillRect(boxX, boxY, 198, 46);
        context.fillStyle = activeLandmark.colour;
        context.font = '800 11px "IBM Plex Mono", monospace';
        context.fillText(activeLandmark.label.toUpperCase(), boxX + 12, boxY + 18);
        context.fillStyle = '#b9d6e8';
        context.font = '600 9px "IBM Plex Mono", monospace';
        context.fillText(activeLandmark.description.toUpperCase(), boxX + 12, boxY + 35);
        context.restore();
      }
    }

    preview.canvas.dataset.activeHeadLandmark = labelled ? this.activeHeadLandmark : 'none';
    this.drawWalkLabel(
      context,
      labelled ? 'HEAD TURN V3 · LABELLED RIG' : 'HEAD TURN · 3D LANDMARKS',
      labelled ? '48 STEPS · HOVER OR SELECT A LANDMARK' : 'HEAD ONLY · FIXED PIVOT · 15° STEPS',
    );
    this.drawHeadTurnReadout(
      context,
      canvas,
      frame,
      pose.yaw,
      labelled ? HEAD_TURN_V3_FRAME_COUNT : HEAD_TURN_FRAME_COUNT,
    );
    this.markFrame(preview, frame);
  }

  private drawHeadTurnFixedDebug(preview: Preview, forcedFrame: number | null): void {
    this.drawHeadTurnDebug(preview, forcedFrame);
    const { context, canvas } = preview;
    this.drawHeadRegistrationGuide(context, canvas.width / 2, canvas.height * 0.54);
    this.drawWalkLabel(context, 'HEAD TURN V2 · REGISTRATION', 'FIXED CENTRE · FIXED HEIGHT · SAFE GUTTER');
  }

  private drawHeadTurnV3Debug(preview: Preview, forcedFrame: number | null): void {
    this.drawHeadTurnDebug(preview, forcedFrame, true);
    const { context, canvas } = preview;
    this.drawHeadRegistrationGuide(context, canvas.width / 2, canvas.height * 0.54);
  }

  private drawHeadTurnPainted(preview: Preview, forcedFrame: number | null): void {
    this.drawRegisteredHeadTurn(preview, forcedFrame, false);
  }

  private drawHeadTurnFixedPainted(preview: Preview, forcedFrame: number | null): void {
    this.drawRegisteredHeadTurn(preview, forcedFrame, true);
  }

  private drawHeadTurnV3Painted(preview: Preview, forcedFrame: number | null): void {
    const frame = forcedFrame ?? 0;
    const angleDegrees = frame <= 44
      ? frame * 7.5
      : 330 + (frame - 44) * 2;
    const yaw = -Math.PI / 2 + angleDegrees * Math.PI / 180;
    const { context, canvas } = preview;
    const sprite = this.sprites.headTurnV3[frame];
    const drawSize = 304;
    const drawX = (canvas.width - drawSize) / 2;
    const drawY = (canvas.height - drawSize) / 2 + 4;

    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    if (sprite?.ready) {
      context.drawImage(sprite, drawX, drawY, drawSize, drawSize);
    }
    context.restore();
    this.drawHeadRegistrationGuide(context, canvas.width / 2, canvas.height / 2 + 4);
    this.drawWalkLabel(
      context,
      'HEAD TURN V3 · 59 INDIVIDUAL FILES',
      '14 EXTRA VIEWS REPAIR THE REAR-RIGHT TURN',
    );
    this.drawHeadTurnReadout(
      context,
      canvas,
      frame,
      yaw,
      HEAD_TURN_V3_ART_FRAME_COUNT,
      angleDegrees,
    );
    this.markFrame(preview, frame);
  }

  private drawRegisteredHeadTurn(
    preview: Preview,
    forcedFrame: number | null,
    showRegistration: boolean,
  ): void {
    const frame = forcedFrame ?? 0;
    const pose = getHeadTurnPose(frame);
    const { context, canvas } = preview;
    const cellSize = 320;
    const sourceX = frame % 5 * cellSize;
    const sourceY = Math.floor(frame / 5) * cellSize;
    const drawSize = 304;
    const drawX = (canvas.width - drawSize) / 2;
    const drawY = (canvas.height - drawSize) / 2 + 4;

    context.save();
    context.strokeStyle = 'rgba(7, 45, 79, .16)';
    context.lineWidth = 1;
    context.setLineDash([5, 7]);
    context.beginPath();
    context.ellipse(canvas.width / 2, canvas.height * 0.55, 112, 26, 0, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.rect(drawX, drawY, drawSize, drawSize);
    context.clip();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    if (this.sprites.headTurnStabilized.ready) {
      context.drawImage(
        this.sprites.headTurnStabilized,
        sourceX,
        sourceY,
        cellSize,
        cellSize,
        drawX,
        drawY,
        drawSize,
        drawSize,
      );
    }
    context.restore();

    if (showRegistration) {
      this.drawHeadRegistrationGuide(context, canvas.width / 2, canvas.height / 2 + 4);
    }
    this.drawWalkLabel(
      context,
      showRegistration ? 'HEAD TURN V2 · STABILIZED ART' : 'HEAD TURN · CLEAN GENERATED 360°',
      showRegistration
        ? '24 ISOLATED HEADS · REGISTERED CENTRE · STRICT CLIP'
        : 'NO CELL LEAKS · FIXED CENTRE · HEAD ONLY',
    );
    this.drawHeadTurnReadout(context, canvas, frame, pose.yaw);
    this.markFrame(preview, frame);
  }

  private drawHeadRegistrationGuide(
    context: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
  ): void {
    context.save();
    context.strokeStyle = 'rgba(255, 214, 97, .62)';
    context.fillStyle = '#ffd661';
    context.lineWidth = 1.5;
    context.setLineDash([5, 5]);
    context.strokeRect(centerX - 120, centerY - 120, 240, 240);
    context.beginPath();
    context.moveTo(centerX - 132, centerY);
    context.lineTo(centerX + 132, centerY);
    context.moveTo(centerX, centerY - 132);
    context.lineTo(centerX, centerY + 132);
    context.stroke();
    context.setLineDash([]);
    context.beginPath();
    context.arc(centerX, centerY, 4, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  private drawHeadTurnReadout(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    frame: number,
    yaw: number,
    frameCount = HEAD_TURN_FRAME_COUNT,
    degreesOverride?: number,
  ): void {
    const degrees = degreesOverride ?? frame * 360 / frameCount;
    const atAngle = (target: number): boolean => Math.abs(degrees - target) < 0.01;
    const label = atAngle(0)
      ? 'RIGHT PROFILE'
      : atAngle(90)
        ? 'FRONT'
        : atAngle(180)
          ? 'LEFT PROFILE'
          : atAngle(270)
            ? 'BACK'
            : degrees < 90
              ? 'RIGHT → FRONT'
              : degrees < 180
                ? 'FRONT → LEFT'
                : degrees < 270
                  ? 'LEFT → BACK'
                  : 'BACK → RIGHT';
    context.save();
    context.fillStyle = 'rgba(4, 27, 55, .78)';
    context.fillRect(canvas.width - 184, canvas.height - 49, 169, 34);
    context.fillStyle = '#dffaff';
    context.font = '700 10px "IBM Plex Mono", monospace';
    context.textAlign = 'right';
    context.fillText(label, canvas.width - 27, canvas.height - 34);
    context.fillStyle = '#ffd661';
    context.fillText(`${degrees.toFixed(degrees % 1 === 0 ? 0 : 1)}° · YAW ${yaw.toFixed(2)}`, canvas.width - 27, canvas.height - 21);
    context.restore();
  }

  private buildWalkingV6Rig(
    canvas: HTMLCanvasElement,
    pose: WalkV6Pose,
    groundY: number,
  ): WalkV6RigGeometry {
    const worldPoint = (point: RigPoint): RigPoint => ({
      x: canvas.width / 2 + point.x,
      y: groundY + point.y,
    });
    const hip = worldPoint(pose.hip);
    const torsoVector = {
      x: -Math.sin(pose.torsoAngle),
      y: -Math.cos(pose.torsoAngle),
    };
    const sideVector = { x: torsoVector.y, y: -torsoVector.x };
    const spine = {
      x: hip.x + torsoVector.x * 23,
      y: hip.y + torsoVector.y * 23,
    };
    const chest = {
      x: hip.x + torsoVector.x * 49,
      y: hip.y + torsoVector.y * 49,
    };
    const neck = {
      x: hip.x + torsoVector.x * 69,
      y: hip.y + torsoVector.y * 69,
    };
    const hipSpread = {
      x: Math.cos(pose.pelvisAngle) * 6,
      y: Math.sin(pose.pelvisAngle) * 6,
    };
    const rightHip = { x: hip.x - hipSpread.x, y: hip.y - hipSpread.y + 1 };
    const leftHip = { x: hip.x + hipSpread.x, y: hip.y + hipSpread.y };
    const shoulderBase = {
      x: hip.x + torsoVector.x * 52 + sideVector.x * 10,
      y: hip.y + torsoVector.y * 52 + sideVector.y * 10,
    };
    const rightShoulder = { x: shoulderBase.x + 3, y: shoulderBase.y + 2 };
    const leftShoulder = { ...shoulderBase };
    const rightFoot = this.buildWalkingV6Foot(worldPoint(pose.rightFoot), pose.rightFoot, groundY, 'right');
    const leftFoot = this.buildWalkingV6Foot(worldPoint(pose.leftFoot), pose.leftFoot, groundY, 'left');
    const rightWrist = {
      x: rightShoulder.x + pose.rightWristOffset.x,
      y: rightShoulder.y + pose.rightWristOffset.y,
    };
    const leftWrist = {
      x: leftShoulder.x + pose.leftWristOffset.x,
      y: leftShoulder.y + pose.leftWristOffset.y,
    };
    const rightArmChain = solveTwoBoneChain(
      rightShoulder,
      rightWrist,
      34,
      30,
      WALK_V6_RIGHT_ARM_BEND,
    );
    const leftArmChain = solveTwoBoneChain(
      leftShoulder,
      leftWrist,
      34,
      30,
      WALK_V6_LEFT_ARM_BEND,
    );

    return {
      hip,
      rightHip,
      leftHip,
      spine,
      chest,
      neck,
      rightShoulder,
      leftShoulder,
      rightLeg: solveTwoBoneChain(rightHip, rightFoot.ankle, 43, 43, -1),
      leftLeg: solveTwoBoneChain(leftHip, leftFoot.ankle, 43, 43, -1),
      rightArm: {
        root: rightArmChain.root,
        elbow: rightArmChain.joint,
        wrist: rightArmChain.end,
        hand: {
          x: rightArmChain.end.x + Math.cos(pose.rightHandAngle) * 12,
          y: rightArmChain.end.y + Math.sin(pose.rightHandAngle) * 12,
        },
      },
      leftArm: {
        root: leftArmChain.root,
        elbow: leftArmChain.joint,
        wrist: leftArmChain.end,
        hand: {
          x: leftArmChain.end.x + Math.cos(pose.leftHandAngle) * 12,
          y: leftArmChain.end.y + Math.sin(pose.leftHandAngle) * 12,
        },
      },
      rightFoot,
      leftFoot,
    };
  }

  private buildWalkingV6Foot(
    target: RigPoint,
    pose: WalkFootPose,
    groundY: number,
    side: 'left' | 'right',
  ): WalkFootGeometry {
    const cosine = Math.cos(pose.angle);
    const sine = Math.sin(pose.angle);
    const heelX = side === 'left' ? -23 : -16;
    const toeX = side === 'left' ? 29 : 31;
    const soleDepth = 19;
    const heelOffset = {
      x: heelX * cosine - soleDepth * sine,
      y: heelX * sine + soleDepth * cosine,
    };
    const toeOffset = {
      x: toeX * cosine - soleDepth * sine,
      y: toeX * sine + soleDepth * cosine,
    };
    const lowestOffset = Math.max(heelOffset.y, toeOffset.y);
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

  private buildWalkingV5Rig(
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
    const sideVector = { x: torsoVector.y, y: -torsoVector.x };
    const spine = {
      x: hip.x + torsoVector.x * 23,
      y: hip.y + torsoVector.y * 23,
    };
    const chest = {
      x: hip.x + torsoVector.x * 49,
      y: hip.y + torsoVector.y * 49,
    };
    const neck = {
      x: hip.x + torsoVector.x * 69,
      y: hip.y + torsoVector.y * 69,
    };
    const hipSpread = {
      x: Math.cos(pose.pelvisAngle) * 6,
      y: Math.sin(pose.pelvisAngle) * 6,
    };
    const farHip = { x: hip.x - hipSpread.x, y: hip.y - hipSpread.y + 1 };
    const nearHip = { x: hip.x + hipSpread.x, y: hip.y + hipSpread.y };
    const shoulderBase = {
      x: hip.x + torsoVector.x * 52 + sideVector.x * 10,
      y: hip.y + torsoVector.y * 52 + sideVector.y * 10,
    };
    const farShoulder = { x: shoulderBase.x + 3, y: shoulderBase.y + 2 };
    const nearShoulder = { ...shoulderBase };
    const farFoot = this.buildWalkingV5Foot(worldPoint(pose.farFoot), pose.farFoot, groundY);
    const nearFoot = this.buildWalkingV5Foot(worldPoint(pose.nearFoot), pose.nearFoot, groundY);
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
      farArm: solveTwoBoneChain(farShoulder, farHand, 34, 32, farArmBend),
      nearArm: solveTwoBoneChain(nearShoulder, nearHand, 34, 32, nearArmBend),
      farFoot,
      nearFoot,
    };
  }

  private buildWalkingV5Foot(
    target: RigPoint,
    pose: WalkFootPose,
    groundY: number,
  ): WalkFootGeometry {
    const cosine = Math.cos(pose.angle);
    const sine = Math.sin(pose.angle);
    const heelOffset = {
      x: -4 * cosine - 19 * sine,
      y: -4 * sine + 19 * cosine,
    };
    const toeOffset = {
      x: 37 * cosine - 19 * sine,
      y: 37 * sine + 19 * cosine,
    };
    const lowestOffset = Math.max(heelOffset.y, toeOffset.y);
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

  private drawWalkingV6DebugArm(
    context: CanvasRenderingContext2D,
    arm: WalkArmGeometry,
    stroke: string,
    fill: string,
    opacity: number,
  ): void {
    context.save();
    context.globalAlpha = opacity;
    this.drawDebugSegment(context, arm.root, arm.elbow, 12, stroke, fill);
    this.drawDebugSegment(context, arm.elbow, arm.wrist, 10, stroke, fill);
    this.drawDebugSegment(context, arm.wrist, arm.hand, 8, stroke, fill);
    this.drawDebugJoint(context, arm.root, stroke, 4.5);
    this.drawDebugJoint(context, arm.elbow, stroke, 4);
    this.drawDebugJoint(context, arm.wrist, stroke, 3.5);
    this.drawDebugJoint(context, arm.hand, stroke, 3);
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

  private drawWalkAtlasSubpart(
    context: CanvasRenderingContext2D,
    sprite: LoadedSprite,
    registration: AtlasSubpartRegistration,
    targetStart: RigPoint,
    targetEnd: RigPoint,
    thicknessScale = 1,
  ): void {
    if (!sprite.ready) return;
    const cellWidth = sprite.naturalWidth / registration.columns;
    const cellHeight = sprite.naturalHeight / registration.rows;
    const cropX = registration.crop.x * cellWidth;
    const cropY = registration.crop.y * cellHeight;
    const sourceRect = {
      x: registration.part % registration.columns * cellWidth + cropX,
      y: Math.floor(registration.part / registration.columns) * cellHeight + cropY,
      width: registration.crop.width * cellWidth,
      height: registration.crop.height * cellHeight,
    };
    this.drawMappedSprite(
      context,
      sprite,
      sourceRect,
      {
        x: registration.sourceStart.x * cellWidth - cropX,
        y: registration.sourceStart.y * cellHeight - cropY,
      },
      {
        x: registration.sourceEnd.x * cellWidth - cropX,
        y: registration.sourceEnd.y * cellHeight - cropY,
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

  private drawWalkingV5Torso(
    context: CanvasRenderingContext2D,
    hip: RigPoint,
    neck: RigPoint,
  ): void {
    if (!this.sprites.walkV5Torso.ready) return;
    this.drawMappedSprite(
      context,
      this.sprites.walkV5Torso,
      {
        x: 0,
        y: 0,
        width: this.sprites.walkV5Torso.naturalWidth,
        height: this.sprites.walkV5Torso.naturalHeight,
      },
      { x: 620, y: 930 },
      { x: 603, y: 115 },
      hip,
      neck,
      1,
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

  private drawWalkShoeV5(
    context: CanvasRenderingContext2D,
    part: number,
    foot: WalkFootGeometry,
    opacity: number,
  ): void {
    const pivot = part === 8 ? { x: 0.35, y: 0.3 } : { x: 0.24, y: 0.3 };
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

  private drawWalkShoeV6(
    context: CanvasRenderingContext2D,
    side: 'left' | 'right',
    foot: WalkFootGeometry,
    opacity: number,
  ): void {
    this.drawWalkAtlasAtPivot(
      context,
      this.sprites.walkParts,
      side === 'left' ? 8 : 11,
      4,
      4,
      foot.ankle,
      foot.angle,
      0.18,
      side === 'left' ? { x: 0.52, y: 0.32 } : { x: 0.4, y: 0.32 },
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

  private drawPaintedWalkV6Nodes(
    context: CanvasRenderingContext2D,
    geometry: WalkV6RigGeometry,
  ): void {
    context.save();
    context.globalAlpha = 0.3;
    const nodes = [
      geometry.hip,
      geometry.spine,
      geometry.chest,
      geometry.neck,
      geometry.rightHip,
      geometry.leftHip,
      geometry.rightShoulder,
      geometry.leftShoulder,
      geometry.rightLeg.joint,
      geometry.leftLeg.joint,
      geometry.rightFoot.ankle,
      geometry.leftFoot.ankle,
      geometry.rightFoot.heel,
      geometry.leftFoot.heel,
      geometry.rightFoot.toe,
      geometry.leftFoot.toe,
      geometry.rightArm.elbow,
      geometry.leftArm.elbow,
      geometry.rightArm.wrist,
      geometry.leftArm.wrist,
      geometry.rightArm.hand,
      geometry.leftArm.hand,
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

  private drawAnatomySheet(): void {
    const canvas = this.anatomyCanvas;
    const context = this.anatomyContext;
    if (!canvas || !context) return;

    const background = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    background.addColorStop(0, '#071b37');
    background.addColorStop(1, '#0b3153');
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const columnWidth = canvas.width / 2;
    const rowHeight = canvas.height / Math.ceil(WALK_V6_ANATOMY.length / 2);
    WALK_V6_ANATOMY.forEach((part, index) => {
      const x = index % 2 * columnWidth;
      const y = Math.floor(index / 2) * rowHeight;
      this.drawAnatomyPart(context, part, x, y, columnWidth, rowHeight);
    });
    canvas.dataset.activeRigPart = this.activeAnatomyPart;
  }

  private drawAnatomyPart(
    context: CanvasRenderingContext2D,
    part: AnatomyPart,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const selected = this.activeAnatomyPart === 'all' || this.activeAnatomyPart === part.id;
    const sprite = part.sprite === 'parts'
      ? this.sprites.walkParts
      : part.sprite === 'legs'
        ? this.sprites.walkLegs
        : this.sprites.walkV5Torso;
    const padding = 10;

    context.save();
    context.globalAlpha = selected ? 1 : 0.18;
    context.fillStyle = selected && this.activeAnatomyPart !== 'all'
      ? 'rgba(40, 207, 239, .13)'
      : 'rgba(3, 16, 40, .34)';
    context.strokeStyle = selected && this.activeAnatomyPart !== 'all'
      ? part.colour
      : 'rgba(133, 218, 255, .13)';
    context.lineWidth = selected && this.activeAnatomyPart !== 'all' ? 2 : 1;
    context.beginPath();
    context.roundRect(x + padding, y + 6, width - padding * 2, height - 12, 13);
    context.fill();
    context.stroke();

    if (sprite.ready) {
      const cellWidth = sprite.naturalWidth / part.columns;
      const cellHeight = sprite.naturalHeight / part.rows;
      const cellX = part.part % part.columns * cellWidth;
      const cellY = Math.floor(part.part / part.columns) * cellHeight;
      const source = {
        x: cellX + part.crop.x * cellWidth,
        y: cellY + part.crop.y * cellHeight,
        width: part.crop.width * cellWidth,
        height: part.crop.height * cellHeight,
      };
      const imageArea = { x: x + 22, y: y + 14, width: 174, height: height - 28 };
      const scale = Math.min(imageArea.width / source.width, imageArea.height / source.height);
      const drawWidth = source.width * scale;
      const drawHeight = source.height * scale;
      const drawX = imageArea.x + (imageArea.width - drawWidth) / 2;
      const drawY = imageArea.y + (imageArea.height - drawHeight) / 2;
      context.drawImage(
        sprite,
        source.x,
        source.y,
        source.width,
        source.height,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
      );

      const mapAnchor = (anchor: RigPoint): RigPoint => ({
        x: drawX + (anchor.x - part.crop.x) / part.crop.width * drawWidth,
        y: drawY + (anchor.y - part.crop.y) / part.crop.height * drawHeight,
      });
      const start = mapAnchor(part.start);
      const end = mapAnchor(part.end);
      const labelX = x + 218;
      const labelY = y + height * 0.57;
      context.strokeStyle = part.colour;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.lineTo(labelX - 10, labelY);
      context.stroke();
      this.drawDebugJoint(context, start, part.colour, 4);
      this.drawDebugJoint(context, end, part.colour, 4);
    }

    context.fillStyle = '#f4fbff';
    context.font = '800 15px Inter, sans-serif';
    context.fillText(part.label, x + 218, y + 39);
    context.fillStyle = part.colour;
    context.font = '700 11px "IBM Plex Mono", monospace';
    context.fillText(part.sockets.toUpperCase(), x + 218, y + 62);
    context.fillStyle = '#809bb8';
    context.font = '600 10px "IBM Plex Mono", monospace';
    context.fillText(`ID: ${part.id}`, x + 218, y + 82);
    context.restore();
  }

  private advance(preview: Preview, delta: number): boolean {
    const { duration, frameCount } = ANIMATION_CONFIG[preview.kind];
    const scaledDelta = delta * preview.speed;
    preview.elapsed += scaledDelta;
    preview.frameAccumulator += scaledDelta;
    const frameDuration = duration / frameCount;
    let frameChanged = false;
    while (preview.frameAccumulator >= frameDuration) {
      preview.frameAccumulator -= frameDuration;
      const nextFrame = this.findNextActiveFrame(preview, preview.currentFrame, 1);
      if (nextFrame === null) {
        preview.playing = false;
        preview.frameAccumulator = 0;
        this.syncControls(preview);
        return frameChanged;
      }
      preview.currentFrame = nextFrame;
      preview.elapsed = this.seekElapsed(preview.kind, nextFrame);
      frameChanged = true;
    }
    return frameChanged;
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

  private handleSpeedControl(event: Event): void {
    const input = (event.target as HTMLElement).closest<HTMLInputElement>('[data-sandbox-speed]');
    if (!input) return;
    const controls = input.closest<HTMLElement>('.sandbox-controls');
    const preview = this.previews.find((candidate) => candidate.controls === controls);
    if (!preview) return;

    preview.speed = this.clampSpeed(Number(input.value));
    preview.speedInput.value = preview.speed.toFixed(2);
    preview.frameAccumulator = 0;
    this.saveSpeed(preview);
    this.syncControls(preview);
  }

  private handleAnatomySelection(event: Event): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-rig-part]');
    if (!button) return;
    this.setActiveAnatomyPart(button.dataset.rigPart ?? 'all');
  }

  private handleAnatomyHover(event: Event): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-rig-part]');
    if (!button) return;
    this.setActiveAnatomyPart(button.dataset.rigPart ?? 'all');
  }

  private setActiveAnatomyPart(partId: string): void {
    if (partId !== 'all' && !WALK_V6_ANATOMY.some((part) => part.id === partId)) return;
    this.activeAnatomyPart = partId;
    this.syncAnatomyControls();
    this.anatomyDirty = true;
    this.drawAnatomySheet();
    this.anatomyDirty = false;
  }

  private syncAnatomyControls(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-rig-part]').forEach((button) => {
      const selected = button.dataset.rigPart === this.activeAnatomyPart;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  private handleHeadLandmarkSelection(event: Event): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-head-landmark]');
    if (!button) return;
    this.setActiveHeadLandmark(button.dataset.headLandmark ?? 'all');
  }

  private setActiveHeadLandmark(landmarkId: string): void {
    if (
      landmarkId !== 'all'
      && !HEAD_TURN_LANDMARKS.some(({ id }) => id === landmarkId)
    ) return;
    this.activeHeadLandmark = landmarkId;
    this.syncHeadLandmarkControls();
    const preview = this.previews.find(({ kind }) => kind === 'head-turn-v3-debug');
    if (preview) this.drawPreview(preview, preview.elapsed, preview.currentFrame);
  }

  private syncHeadLandmarkControls(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-head-landmark]').forEach((button) => {
      const selected = button.dataset.headLandmark === this.activeHeadLandmark;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  private setupHeadTurnScrubbing(preview: Preview): void {
    const { canvas } = preview;
    canvas.classList.add('sandbox-canvas--scrubbable');
    canvas.dataset.scrubbable = 'true';
    const finishDrag = (event: PointerEvent): void => {
      if (!preview.dragging || preview.dragPointerId !== event.pointerId) return;
      preview.dragging = false;
      preview.dragPointerId = null;
      canvas.classList.remove('is-dragging');
      canvas.dataset.scrubbing = 'false';
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    canvas.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      preview.dragging = true;
      preview.dragPointerId = event.pointerId;
      preview.dragStartX = event.clientX;
      preview.dragStartFrame = preview.currentFrame;
      preview.playing = false;
      preview.frameAccumulator = 0;
      canvas.classList.add('is-dragging');
      canvas.dataset.scrubbing = 'true';
      canvas.setPointerCapture(event.pointerId);
      this.syncControls(preview);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!preview.dragging || preview.dragPointerId !== event.pointerId) return;
      event.preventDefault();
      const frameWidth = Math.max(
        5,
        canvas.getBoundingClientRect().width / ANIMATION_CONFIG[preview.kind].frameCount,
      );
      const offset = Math.round((event.clientX - preview.dragStartX) / frameWidth);
      const requestedFrame = preview.dragStartFrame + offset;
      if (requestedFrame !== preview.currentFrame) this.selectFrame(preview, requestedFrame);
    });
    canvas.addEventListener('pointerup', finishDrag);
    canvas.addEventListener('pointercancel', finishDrag);
    canvas.addEventListener('lostpointercapture', (event) => {
      if (!preview.dragging || preview.dragPointerId !== event.pointerId) return;
      preview.dragging = false;
      preview.dragPointerId = null;
      canvas.classList.remove('is-dragging');
      canvas.dataset.scrubbing = 'false';
    });
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

  private loadSpeed(kind: AnimationKind): number {
    try {
      const saved = Number(localStorage.getItem(`hugo-go:sandbox-speed:${kind}`));
      if (Number.isFinite(saved) && saved >= SPEED_MIN && saved <= SPEED_MAX) {
        return this.clampSpeed(saved);
      }
    } catch {
      // Storage can be unavailable in restrictive browser contexts.
    }
    return kind.startsWith('head-turn') ? HEAD_TURN_DEFAULT_SPEED : 1;
  }

  private saveSpeed(preview: Preview): void {
    try {
      localStorage.setItem(
        `hugo-go:sandbox-speed:${preview.kind}`,
        preview.speed.toFixed(2),
      );
    } catch {
      // The speed still works for this session when persistence is unavailable.
    }
  }

  private clampSpeed(value: number): number {
    if (!Number.isFinite(value)) return 1;
    const stepped = Math.round(value / SPEED_STEP) * SPEED_STEP;
    return Math.min(SPEED_MAX, Math.max(SPEED_MIN, stepped));
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

  private createControls(canvas: HTMLCanvasElement, kind: AnimationKind, speed: number): HTMLElement {
    const { frameCount } = ANIMATION_CONFIG[kind];
    const speedId = `sandbox-speed-${kind}`;
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
      <label class="sandbox-speed-control" for="${speedId}">
        <span>Playback speed</span>
        <input
          id="${speedId}"
          type="range"
          min="${SPEED_MIN}"
          max="${SPEED_MAX}"
          step="${SPEED_STEP}"
          value="${speed.toFixed(2)}"
          data-sandbox-speed
          aria-label="${kind} playback speed"
        >
        <output for="${speedId}" data-sandbox-speed-output></output>
      </label>
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
    const frameCount = ANIMATION_CONFIG[preview.kind].frameCount;
    const metrics = this.metricsText(preview.kind, activeCount, false, preview.speed);
    preview.frameReadout.textContent = `Frame ${preview.currentFrame + 1} / ${frameCount} · ${activeCount} active · ${metrics}`;
    if (preview.metrics) {
      preview.metrics.textContent = this.metricsText(preview.kind, frameCount, true, preview.speed);
    }
    const effectiveFramesPerSecond = frameCount / ANIMATION_CONFIG[preview.kind].duration * preview.speed;
    const loopDuration = activeCount / effectiveFramesPerSecond;
    preview.speedOutput.value = `${preview.speed.toFixed(2)}× · ${effectiveFramesPerSecond.toFixed(2)} FPS · ${loopDuration.toFixed(2)} s loop`;
    preview.speedOutput.textContent = preview.speedOutput.value;
    preview.speedInput.setAttribute('aria-valuetext', `${preview.speed.toFixed(2)} times speed`);
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

  private metricsText(
    kind: AnimationKind,
    frameCount: number,
    includeFrameCount = true,
    speed = 1,
  ): string {
    const config = ANIMATION_CONFIG[kind];
    const framesPerSecond = config.frameCount / config.duration * speed;
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

  private controlInput(root: HTMLElement, selector: string): HTMLInputElement {
    const input = root.querySelector<HTMLInputElement>(selector);
    if (!input) throw new Error(`Missing Animation Sandbox input ${selector}.`);
    return input;
  }

  private controlOutput(root: HTMLElement, selector: string): HTMLOutputElement {
    const output = root.querySelector<HTMLOutputElement>(selector);
    if (!output) throw new Error(`Missing Animation Sandbox output ${selector}.`);
    return output;
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
      this.anatomyDirty = true;
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
    this.sprites.walkV5Torso.src = hugoWalkV5TorsoUrl;
    this.sprites.headTurnStabilized.src = hugoHeadTurnStabilizedCycleUrl;
    if (typeof IntersectionObserver === 'undefined') this.ensureHeadTurnV3Assets();
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

  private ensureHeadTurnV3Assets(): void {
    if (this.headTurnV3AssetsStarted) return;
    this.headTurnV3AssetsStarted = true;
    this.sprites.headTurnV3.forEach((sprite, index) => {
      sprite.src = HEAD_TURN_V3_FRAME_URLS[index];
    });
  }
}
