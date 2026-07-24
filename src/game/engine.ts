export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 780;
export const GROUND_Y = 704;
export const HUGO_X = 82;
export const HUGO_WIDTH = 38;
export const HUGO_HEIGHT = 58;
export const FIXED_STEP = 1 / 120;

const GRAVITY = 1_000;
const JET_ACCELERATION = 1_950;
const MAX_RISE_SPEED = -310;
const MAX_FALL_SPEED = 570;
const THRUST_RESPONSE_PER_SECOND = 6;
const BASE_WORLD_SPEED = 142;
const MAX_WORLD_SPEED = 202;
const SPEED_RAMP_PER_SECOND = 0.72;
const METRES_PER_PIXEL = 0.085;
const CEILING_Y = 34;

export type GamePhase = 'playing' | 'gameover';
export type ObstacleKind = 'log' | 'boulder' | 'stump';

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
}

export interface Obstacle extends Rect {
  id: number;
  kind: ObstacleKind;
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
    },
    obstacles: [],
    coins: [],
    nextEntityId: 1,
    randomSeed: randomSeed >>> 0,
  };

  spawnObstacleGroup(state, 520, 'log', 70, 54);
  spawnObstacleGroup(state, 805, 'boulder', 94, 62);
  spawnObstacleGroup(state, 1_110, 'stump', 112, 52);
  return state;
}

export function setFlightThrust(state: FlightGameState, thrusting: boolean): boolean {
  if (state.phase !== 'playing') return false;
  state.hugo.thrusting = thrusting;
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

  for (const obstacle of state.obstacles) obstacle.x -= worldMovement;
  for (const coin of state.coins) coin.x -= worldMovement;

  const jetAcceleration = state.hugo.thrusting ? JET_ACCELERATION : 0;
  state.hugo.velocityY = clamp(
    state.hugo.velocityY + (GRAVITY - jetAcceleration) * elapsedSeconds,
    MAX_RISE_SPEED,
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
  for (const obstacle of state.obstacles) {
    const previousObstacle = { ...obstacle, x: obstacle.x + worldMovement };
    if (
      sweptRectangleHits(previousHugo, worldMovement, hugoDeltaY, previousObstacle)
      || rectanglesOverlap(currentHugo, obstacle)
    ) {
      state.phase = 'gameover';
      state.hugo.thrusting = false;
      return;
    }
  }

  if (state.hugo.y + HUGO_HEIGHT >= GROUND_Y) {
    state.hugo.y = GROUND_Y - HUGO_HEIGHT;
    state.hugo.velocityY = 0;
    state.hugo.grounded = true;
  }

  if (state.hugo.grounded) {
    state.hugo.airborneTime = 0;
    state.hugo.groundedTime = wasGrounded ? state.hugo.groundedTime + elapsedSeconds : 0;
  } else {
    state.hugo.airborneTime = wasGrounded ? elapsedSeconds : state.hugo.airborneTime + elapsedSeconds;
    state.hugo.groundedTime = 0;
  }

  const landedHugo = getHugoHitbox(state);
  for (const coin of state.coins) {
    if (!coin.collected && circleTouchesRectangle(coin, landedHugo)) {
      coin.collected = true;
      state.runCoins += 1;
    }
  }

  removeExpiredEntities(state);
  ensureCourseAhead(state);
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

function removeExpiredEntities(state: FlightGameState): void {
  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -30);
  state.coins = state.coins.filter((coin) => !coin.collected && coin.x + coin.radius > -30);
}

function ensureCourseAhead(state: FlightGameState): void {
  const lastObstacle = state.obstacles.at(-1);
  if (lastObstacle && lastObstacle.x > GAME_WIDTH + 470) return;

  const previousRight = lastObstacle ? lastObstacle.x + lastObstacle.width : GAME_WIDTH + 250;
  const gap = randomBetween(state, 235, 315);
  const height = randomBetween(state, 66, 124);
  const width = randomBetween(state, 48, 70);
  const kinds: readonly ObstacleKind[] = ['log', 'boulder', 'stump'];
  const kind = kinds[Math.floor(randomBetween(state, 0, kinds.length)) % kinds.length];
  spawnObstacleGroup(state, previousRight + gap, kind, height, width);
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

function moveTowards(value: number, target: number, maximumDelta: number): number {
  if (value < target) return Math.min(target, value + maximumDelta);
  return Math.max(target, value - maximumDelta);
}
