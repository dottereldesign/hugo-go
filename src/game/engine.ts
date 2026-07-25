export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 780;
export const GROUND_Y = 704;
export const HUGO_X = 72;
export const HUGO_WIDTH = 32;
export const HUGO_HEIGHT = 50;
export const FIXED_STEP = 1 / 120;

const GRAVITY = 1_000;
const RELEASE_GRAVITY = 1_450;
const JET_ACCELERATION = 1_950;
const MAX_RISE_SPEED = -430;
const DOUBLE_JUMP_MAX_RISE_SPEED = -610;
const MAX_FALL_SPEED = 570;
const THRUST_RESPONSE_PER_SECOND = 8;
const BASE_WORLD_SPEED = 174;
const MAX_WORLD_SPEED = 244;
const SPEED_RAMP_PER_SECOND = 1.05;
const METRES_PER_PIXEL = 0.085;
const CEILING_Y = 34;
const JUMP_VELOCITY = -390;
const DOUBLE_JUMP_MIN_VELOCITY = -525;
const DOUBLE_JUMP_IMPULSE = 300;
export const DOUBLE_JUMP_WINDOW = 0.48;
const WALL_RECOVERY_VELOCITY = -450;
const WALL_RECOVERY_GRACE = 0.48;
const WALL_STUCK_TIMEOUT = 1.25;
const RECOVERY_X_SPEED = 170;
const COLLISION_EPSILON = 0.001;
const WIRE_CONTACT_INSET = 46;
const WIRE_EXIT_LIFT = -95;
const WIRE_POST_HALF_WIDTH = 8;
const WIRE_POST_TOP_OFFSET = 28;

export type GamePhase = 'playing' | 'gameover';
export type ObstacleKind = 'log' | 'boulder' | 'stump' | 'wire';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HugoState {
  x: number;
  y: number;
  velocityY: number;
  grounded: boolean;
  thrusting: boolean;
  thrustIntensity: number;
  airborneTime: number;
  groundedTime: number;
  jumpTime: number;
  jumpAvailable: boolean;
  doubleJumpAvailable: boolean;
  doubleJumpTime: number;
  grindTime: number;
  surfaceId: number | null;
  stuckObstacleId: number | null;
  stuckObstacleOffsetX: number;
  stuckTime: number;
  recoveryTime: number;
  recoveryGrace: number;
}

export interface Obstacle extends Rect {
  id: number;
  kind: ObstacleKind;
  sag?: number;
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

export interface FlightGameState {
  phase: GamePhase;
  elapsed: number;
  distance: number;
  runCoins: number;
  speed: number;
  hugo: HugoState;
  obstacles: Obstacle[];
  coins: Coin[];
  nextEntityId: number;
  randomSeed: number;
}

export function createFlightGame(randomSeed = 0x48_55_47_4f): FlightGameState {
  const state: FlightGameState = {
    phase: 'playing',
    elapsed: 0,
    distance: 0,
    runCoins: 0,
    speed: BASE_WORLD_SPEED,
    hugo: {
      x: HUGO_X,
      y: GROUND_Y - HUGO_HEIGHT,
      velocityY: 0,
      grounded: true,
      thrusting: false,
      thrustIntensity: 0,
      airborneTime: 0,
      groundedTime: 1,
      jumpTime: Number.POSITIVE_INFINITY,
      jumpAvailable: true,
      doubleJumpAvailable: false,
      doubleJumpTime: Number.POSITIVE_INFINITY,
      grindTime: Number.POSITIVE_INFINITY,
      surfaceId: null,
      stuckObstacleId: null,
      stuckObstacleOffsetX: 0,
      stuckTime: 0,
      recoveryTime: Number.POSITIVE_INFINITY,
      recoveryGrace: 0,
    },
    obstacles: [],
    coins: [],
    nextEntityId: 1,
    randomSeed: randomSeed >>> 0,
  };

  spawnObstacleGroup(state, 720, 'log', 70, 100);
  spawnObstacleGroup(state, 1_420, 'boulder', 94, 120);
  spawnWireGroup(state, 2_160, 340, 438, 44);
  return state;
}

export function setFlightThrust(state: FlightGameState, thrusting: boolean): boolean {
  if (state.phase !== 'playing') return false;
  const freshPress = thrusting && !state.hugo.thrusting;
  state.hugo.thrusting = thrusting;
  if (freshPress && state.hugo.stuckObstacleId !== null) {
    recoverFromWall(state);
  } else if (freshPress && state.hugo.jumpAvailable) {
    state.hugo.velocityY = JUMP_VELOCITY;
    state.hugo.grounded = false;
    state.hugo.surfaceId = null;
    state.hugo.grindTime = Number.POSITIVE_INFINITY;
    state.hugo.jumpAvailable = false;
    state.hugo.doubleJumpAvailable = true;
    state.hugo.jumpTime = 0;
  } else if (
    freshPress
    && state.hugo.doubleJumpAvailable
    && state.hugo.jumpTime <= DOUBLE_JUMP_WINDOW
  ) {
    state.hugo.velocityY = Math.max(
      DOUBLE_JUMP_MAX_RISE_SPEED,
      Math.min(DOUBLE_JUMP_MIN_VELOCITY, state.hugo.velocityY - DOUBLE_JUMP_IMPULSE),
    );
    state.hugo.grounded = false;
    state.hugo.surfaceId = null;
    state.hugo.grindTime = Number.POSITIVE_INFINITY;
    state.hugo.doubleJumpAvailable = false;
    state.hugo.doubleJumpTime = 0;
  }
  return true;
}

export function advanceFlight(state: FlightGameState, elapsedSeconds: number): void {
  if (state.phase !== 'playing' || !Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return;

  let remaining = Math.min(elapsedSeconds, 0.25);
  while (remaining > 0 && state.phase === 'playing') {
    const step = Math.min(FIXED_STEP, remaining);
    advanceFixedStep(state, step);
    remaining -= step;
  }
}

export function getHugoHitbox(state: FlightGameState): Rect {
  return {
    x: state.hugo.x,
    y: state.hugo.y,
    width: HUGO_WIDTH,
    height: HUGO_HEIGHT,
  };
}

export function rectanglesOverlap(first: Rect, second: Rect): boolean {
  return (
    first.x <= second.x + second.width
    && first.x + first.width >= second.x
    && first.y <= second.y + second.height
    && first.y + first.height >= second.y
  );
}

/**
 * Continuous AABB test. Touching an obstacle counts as contact, so grazing a
 * solid top or side cannot become a platform through floating-point rounding.
 */
export function sweptRectangleHits(
  moving: Rect,
  deltaX: number,
  deltaY: number,
  target: Rect,
): boolean {
  if (rectanglesOverlap(moving, target)) return true;

  const [xEntry, xExit] = axisEntryExit(
    moving.x,
    moving.x + moving.width,
    target.x,
    target.x + target.width,
    deltaX,
  );
  const [yEntry, yExit] = axisEntryExit(
    moving.y,
    moving.y + moving.height,
    target.y,
    target.y + target.height,
    deltaY,
  );
  const entryTime = Math.max(xEntry, yEntry);
  const exitTime = Math.min(xExit, yExit);
  return entryTime <= exitTime && entryTime >= 0 && entryTime <= 1;
}

export function circleTouchesRectangle(coin: Pick<Coin, 'x' | 'y' | 'radius'>, rectangle: Rect): boolean {
  const closestX = clamp(coin.x, rectangle.x, rectangle.x + rectangle.width);
  const closestY = clamp(coin.y, rectangle.y, rectangle.y + rectangle.height);
  const deltaX = coin.x - closestX;
  const deltaY = coin.y - closestY;
  return deltaX * deltaX + deltaY * deltaY <= coin.radius * coin.radius;
}

export function getWireYAtX(obstacle: Obstacle, worldX: number): number {
  if (obstacle.kind !== 'wire' || !Number.isFinite(obstacle.sag)) return obstacle.y;
  const progress = clamp((worldX - obstacle.x) / obstacle.width, 0, 1);
  return obstacle.y + (obstacle.sag ?? 0) * 4 * progress * (1 - progress);
}

export function getWireSlopeAtX(obstacle: Obstacle, worldX: number): number {
  if (obstacle.kind !== 'wire' || !Number.isFinite(obstacle.sag)) return 0;
  const progress = clamp((worldX - obstacle.x) / obstacle.width, 0, 1);
  return (4 * (obstacle.sag ?? 0) / obstacle.width) * (1 - 2 * progress);
}

export function getGrindingWire(state: FlightGameState): Obstacle | null {
  if (state.hugo.surfaceId === null) return null;
  const surface = state.obstacles.find((obstacle) => obstacle.id === state.hugo.surfaceId);
  return surface?.kind === 'wire' ? surface : null;
}

function advanceFixedStep(state: FlightGameState, elapsedSeconds: number): void {
  const previousHugo = getHugoHitbox(state);
  const wasGrounded = state.hugo.grounded;
  const worldMovement = state.speed * elapsedSeconds;

  state.elapsed += elapsedSeconds;
  state.speed = Math.min(MAX_WORLD_SPEED, BASE_WORLD_SPEED + state.elapsed * SPEED_RAMP_PER_SECOND);
  state.distance += worldMovement * METRES_PER_PIXEL;
  state.hugo.thrustIntensity = moveTowards(
    state.hugo.thrustIntensity,
    state.hugo.thrusting ? 1 : 0,
    THRUST_RESPONSE_PER_SECOND * elapsedSeconds,
  );
  state.hugo.jumpTime += elapsedSeconds;
  state.hugo.doubleJumpTime += elapsedSeconds;
  state.hugo.recoveryTime += elapsedSeconds;
  state.hugo.recoveryGrace = Math.max(0, state.hugo.recoveryGrace - elapsedSeconds);

  for (const obstacle of state.obstacles) obstacle.x -= worldMovement;
  for (const coin of state.coins) coin.x -= worldMovement;

  if (state.hugo.stuckObstacleId !== null) {
    advanceWallStuck(state, elapsedSeconds);
    removeExpiredEntities(state);
    ensureCourseAhead(state);
    return;
  }

  const grindingWire = getGrindingWire(state);
  if (grindingWire) {
    const shoeContactX = state.hugo.x + HUGO_WIDTH / 2;
    if (wireContainsX(grindingWire, shoeContactX)) {
      state.hugo.x = moveTowards(state.hugo.x, HUGO_X, RECOVERY_X_SPEED * elapsedSeconds);
      state.hugo.y = getWireYAtX(grindingWire, shoeContactX) - HUGO_HEIGHT;
      state.hugo.velocityY = 0;
      state.hugo.grounded = true;
      state.hugo.airborneTime = 0;
      state.hugo.groundedTime += elapsedSeconds;
      state.hugo.grindTime += elapsedSeconds;
      state.hugo.jumpAvailable = true;
      state.hugo.doubleJumpAvailable = false;
      state.hugo.doubleJumpTime = Number.POSITIVE_INFINITY;
      collectCoins(state);
      removeExpiredEntities(state);
      ensureCourseAhead(state);
      return;
    }

    state.hugo.surfaceId = null;
    state.hugo.grounded = false;
    state.hugo.velocityY = Math.min(state.hugo.velocityY, WIRE_EXIT_LIFT);
    state.hugo.grindTime = Number.POSITIVE_INFINITY;
    state.hugo.jumpTime = 0;
  }

  state.hugo.x = moveTowards(state.hugo.x, HUGO_X, RECOVERY_X_SPEED * elapsedSeconds);
  const jetAcceleration = state.hugo.thrusting ? JET_ACCELERATION : 0;
  const effectiveGravity = GRAVITY
    + (RELEASE_GRAVITY - GRAVITY) * (1 - state.hugo.thrustIntensity);
  const doubleJumpProgress = clamp(state.hugo.doubleJumpTime / DOUBLE_JUMP_WINDOW, 0, 1);
  const riseSpeedLimit = DOUBLE_JUMP_MAX_RISE_SPEED
    + (MAX_RISE_SPEED - DOUBLE_JUMP_MAX_RISE_SPEED) * doubleJumpProgress;
  state.hugo.velocityY = clamp(
    state.hugo.velocityY + (effectiveGravity - jetAcceleration) * elapsedSeconds,
    riseSpeedLimit,
    MAX_FALL_SPEED,
  );
  state.hugo.y += state.hugo.velocityY * elapsedSeconds;
  state.hugo.grounded = false;

  if (state.hugo.y < CEILING_Y) {
    state.hugo.y = CEILING_Y;
    state.hugo.velocityY = Math.max(0, state.hugo.velocityY);
  }

  const currentHugo = getHugoHitbox(state);
  const hugoDeltaY = currentHugo.y - previousHugo.y;
  let landingSurface: Obstacle | null = null;
  let landingY = Number.POSITIVE_INFINITY;
  for (const obstacle of state.obstacles) {
    const previousObstacle = { ...obstacle, x: obstacle.x + worldMovement };
    if (obstacle.kind === 'wire') {
      if (landsOnWire(previousHugo, currentHugo, previousObstacle, obstacle)) {
        const wireY = getWireYAtX(obstacle, currentHugo.x + currentHugo.width / 2);
        if (wireY < landingY) {
          landingSurface = obstacle;
          landingY = wireY;
        }
      }
      if (state.hugo.recoveryGrace <= 0) {
        const previousPosts = getWirePostRects(previousObstacle);
        const currentPosts = getWirePostRects(obstacle);
        const hitPostIndex = previousPosts.findIndex((post) => (
          runsIntoObstacle(previousHugo, hugoDeltaY, worldMovement, post)
        ));
        if (hitPostIndex >= 0) {
          stickHugoToObstacle(state, obstacle, currentPosts[hitPostIndex].x);
          removeExpiredEntities(state);
          ensureCourseAhead(state);
          return;
        }
      }
      continue;
    }
    if (landsOnObstacle(previousHugo, worldMovement, hugoDeltaY, previousObstacle)) {
      if (obstacle.y < landingY) {
        landingSurface = obstacle;
        landingY = obstacle.y;
      }
      continue;
    }
    if (
      state.hugo.recoveryGrace <= 0
      && runsIntoObstacle(previousHugo, hugoDeltaY, worldMovement, previousObstacle)
    ) {
      stickHugoToObstacle(state, obstacle);
      removeExpiredEntities(state);
      ensureCourseAhead(state);
      return;
    }
  }

  if (landingSurface) {
    state.hugo.y = landingY - HUGO_HEIGHT;
    state.hugo.velocityY = 0;
    state.hugo.grounded = true;
    state.hugo.surfaceId = landingSurface.id;
    state.hugo.grindTime = landingSurface.kind === 'wire'
      ? 0
      : Number.POSITIVE_INFINITY;
  } else if (state.hugo.y + HUGO_HEIGHT >= GROUND_Y) {
    state.hugo.y = GROUND_Y - HUGO_HEIGHT;
    state.hugo.velocityY = 0;
    state.hugo.grounded = true;
    state.hugo.surfaceId = null;
    state.hugo.grindTime = Number.POSITIVE_INFINITY;
  } else {
    state.hugo.surfaceId = null;
    state.hugo.grindTime = Number.POSITIVE_INFINITY;
  }

  if (state.hugo.grounded) {
    state.hugo.airborneTime = 0;
    state.hugo.groundedTime = wasGrounded ? state.hugo.groundedTime + elapsedSeconds : 0;
    state.hugo.jumpAvailable = true;
    state.hugo.doubleJumpAvailable = false;
    state.hugo.doubleJumpTime = Number.POSITIVE_INFINITY;
  } else {
    state.hugo.airborneTime = wasGrounded ? elapsedSeconds : state.hugo.airborneTime + elapsedSeconds;
    state.hugo.groundedTime = 0;
  }

  collectCoins(state);

  removeExpiredEntities(state);
  ensureCourseAhead(state);
}

function landsOnWire(
  previousHugo: Rect,
  currentHugo: Rect,
  previousWire: Obstacle,
  currentWire: Obstacle,
): boolean {
  const hugoDeltaY = currentHugo.y - previousHugo.y;
  if (hugoDeltaY < 0) return false;

  const shoeContactX = currentHugo.x + currentHugo.width / 2;
  if (!wireContainsX(currentWire, shoeContactX)) return false;

  const previousBottom = previousHugo.y + previousHugo.height;
  const currentBottom = currentHugo.y + currentHugo.height;
  const previousWireY = getWireYAtX(previousWire, shoeContactX);
  const currentWireY = getWireYAtX(currentWire, shoeContactX);
  return (
    previousBottom <= previousWireY + COLLISION_EPSILON
    && currentBottom >= currentWireY - COLLISION_EPSILON
  );
}

function wireContainsX(obstacle: Obstacle, worldX: number): boolean {
  return (
    obstacle.kind === 'wire'
    && worldX >= obstacle.x + WIRE_CONTACT_INSET
    && worldX <= obstacle.x + obstacle.width - WIRE_CONTACT_INSET
  );
}

function getWirePostRects(obstacle: Obstacle): readonly Rect[] {
  const top = obstacle.y - WIRE_POST_TOP_OFFSET;
  const height = GROUND_Y - top;
  return [
    {
      x: obstacle.x - WIRE_POST_HALF_WIDTH,
      y: top,
      width: WIRE_POST_HALF_WIDTH * 2,
      height,
    },
    {
      x: obstacle.x + obstacle.width - WIRE_POST_HALF_WIDTH,
      y: top,
      width: WIRE_POST_HALF_WIDTH * 2,
      height,
    },
  ];
}

function axisEntryExit(
  movingMin: number,
  movingMax: number,
  targetMin: number,
  targetMax: number,
  movement: number,
): [number, number] {
  if (movement > 0) return [(targetMin - movingMax) / movement, (targetMax - movingMin) / movement];
  if (movement < 0) return [(targetMax - movingMin) / movement, (targetMin - movingMax) / movement];
  if (movingMax < targetMin || movingMin > targetMax) return [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
  return [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
}

function landsOnObstacle(
  previousHugo: Rect,
  worldMovement: number,
  hugoDeltaY: number,
  previousObstacle: Obstacle,
): boolean {
  if (hugoDeltaY < 0) return false;

  const previousBottom = previousHugo.y + previousHugo.height;
  const currentBottom = previousBottom + hugoDeltaY;
  if (
    previousBottom > previousObstacle.y + COLLISION_EPSILON
    || currentBottom < previousObstacle.y - COLLISION_EPSILON
  ) {
    return false;
  }

  const contactTime = hugoDeltaY > COLLISION_EPSILON
    ? clamp((previousObstacle.y - previousBottom) / hugoDeltaY, 0, 1)
    : 0;
  const relativeLeft = previousHugo.x + worldMovement * contactTime;
  const relativeRight = relativeLeft + previousHugo.width;
  return (
    relativeRight > previousObstacle.x + COLLISION_EPSILON
    && relativeLeft < previousObstacle.x + previousObstacle.width - COLLISION_EPSILON
  );
}

function runsIntoObstacle(
  previousHugo: Rect,
  hugoDeltaY: number,
  worldMovement: number,
  previousObstacle: Rect,
): boolean {
  if (worldMovement <= 0) return false;

  const hugoFront = previousHugo.x + previousHugo.width;
  const previousObstacleFront = previousObstacle.x;
  const currentObstacleFront = previousObstacleFront - worldMovement;
  if (
    previousObstacleFront < hugoFront - COLLISION_EPSILON
    || currentObstacleFront > hugoFront + COLLISION_EPSILON
  ) {
    return false;
  }

  const contactTime = clamp((previousObstacleFront - hugoFront) / worldMovement, 0, 1);
  const hugoTop = previousHugo.y + hugoDeltaY * contactTime;
  const hugoBottom = hugoTop + previousHugo.height;
  return (
    hugoBottom > previousObstacle.y + COLLISION_EPSILON
    && hugoTop < previousObstacle.y + previousObstacle.height - COLLISION_EPSILON
  );
}

function removeExpiredEntities(state: FlightGameState): void {
  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -30);
  state.coins = state.coins.filter((coin) => !coin.collected && coin.x + coin.radius > -30);
}

function ensureCourseAhead(state: FlightGameState): void {
  const lastObstacle = state.obstacles.at(-1);
  if (lastObstacle && lastObstacle.x > GAME_WIDTH + 470) return;

  const previousRight = lastObstacle ? lastObstacle.x + lastObstacle.width : GAME_WIDTH + 250;
  const gap = randomBetween(state, 560, 740);
  const shouldSpawnWire = randomBetween(state, 0, 1) < 0.24;
  if (shouldSpawnWire) {
    spawnWireGroup(
      state,
      previousRight + gap,
      randomBetween(state, 310, 390),
      randomBetween(state, 405, 485),
      randomBetween(state, 34, 56),
    );
    return;
  }

  const height = randomBetween(state, 66, 124);
  const width = randomBetween(state, 82, 130);
  const kinds: readonly ObstacleKind[] = ['log', 'boulder', 'stump'];
  const kind = kinds[Math.floor(randomBetween(state, 0, kinds.length)) % kinds.length];
  spawnObstacleGroup(state, previousRight + gap, kind, height, width);
}

function spawnWireGroup(
  state: FlightGameState,
  x: number,
  width: number,
  cableY: number,
  sag: number,
): void {
  const wire: Obstacle = {
    id: state.nextEntityId++,
    kind: 'wire',
    x,
    y: cableY,
    width,
    height: GROUND_Y - cableY,
    sag,
  };
  state.obstacles.push(wire);

  for (let index = 0; index < 5; index += 1) {
    const progress = (index + 1) / 6;
    const coinX = x + progress * width;
    state.coins.push({
      id: state.nextEntityId++,
      x: coinX,
      y: getWireYAtX(wire, coinX) - 42,
      radius: 10,
      collected: false,
    });
  }
}

function spawnObstacleGroup(
  state: FlightGameState,
  x: number,
  kind: ObstacleKind,
  height: number,
  width: number,
): void {
  const obstacle: Obstacle = {
    id: state.nextEntityId++,
    kind,
    x,
    y: GROUND_Y - height,
    width,
    height,
  };
  state.obstacles.push(obstacle);

  const coinHeight = Math.max(116, height + 68);
  for (let index = 0; index < 4; index += 1) {
    const progress = index / 3;
    state.coins.push({
      id: state.nextEntityId++,
      x: x - 34 + progress * (width + 68),
      y: GROUND_Y - coinHeight - Math.sin(progress * Math.PI) * 28,
      radius: 10,
      collected: false,
    });
  }
}

function randomBetween(state: FlightGameState, minimum: number, maximum: number): number {
  state.randomSeed = (Math.imul(state.randomSeed, 1_664_525) + 1_013_904_223) >>> 0;
  return minimum + (state.randomSeed / 0x1_0000_0000) * (maximum - minimum);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function stickHugoToObstacle(
  state: FlightGameState,
  obstacle: Obstacle,
  obstacleFrontX = obstacle.x,
): void {
  state.hugo.stuckObstacleOffsetX = obstacleFrontX - obstacle.x;
  state.hugo.x = obstacleFrontX - HUGO_WIDTH;
  state.hugo.velocityY = 0;
  state.hugo.grounded = false;
  state.hugo.thrusting = false;
  state.hugo.surfaceId = null;
  state.hugo.grindTime = Number.POSITIVE_INFINITY;
  state.hugo.stuckObstacleId = obstacle.id;
  state.hugo.stuckTime = 0;
  state.hugo.jumpAvailable = false;
  state.hugo.doubleJumpAvailable = false;
}

function recoverFromWall(state: FlightGameState): void {
  state.hugo.stuckObstacleId = null;
  state.hugo.stuckObstacleOffsetX = 0;
  state.hugo.stuckTime = 0;
  state.hugo.velocityY = WALL_RECOVERY_VELOCITY;
  state.hugo.grounded = false;
  state.hugo.jumpAvailable = false;
  state.hugo.doubleJumpAvailable = true;
  state.hugo.jumpTime = 0;
  state.hugo.recoveryTime = 0;
  state.hugo.recoveryGrace = WALL_RECOVERY_GRACE;
  state.hugo.grindTime = Number.POSITIVE_INFINITY;
}

function advanceWallStuck(state: FlightGameState, elapsedSeconds: number): void {
  const obstacle = state.obstacles.find((candidate) => candidate.id === state.hugo.stuckObstacleId);
  state.hugo.stuckTime += elapsedSeconds;
  state.hugo.velocityY = 0;
  state.hugo.thrustIntensity = moveTowards(
    state.hugo.thrustIntensity,
    0,
    THRUST_RESPONSE_PER_SECOND * elapsedSeconds,
  );

  if (!obstacle) {
    state.phase = 'gameover';
    return;
  }

  state.hugo.x = obstacle.x + state.hugo.stuckObstacleOffsetX - HUGO_WIDTH;
  if (state.hugo.x <= -HUGO_WIDTH || state.hugo.stuckTime >= WALL_STUCK_TIMEOUT) {
    state.phase = 'gameover';
  }
}

function moveTowards(value: number, target: number, maximumDelta: number): number {
  if (value < target) return Math.min(target, value + maximumDelta);
  return Math.max(target, value - maximumDelta);
}

function collectCoins(state: FlightGameState): void {
  const hugo = getHugoHitbox(state);
  for (const coin of state.coins) {
    if (!coin.collected && circleTouchesRectangle(coin, hugo)) {
      coin.collected = true;
      state.runCoins += 1;
    }
  }
}
