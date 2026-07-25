import { describe, expect, it } from 'vitest';
import {
  FIXED_STEP,
  GROUND_Y,
  HUGO_HEIGHT,
  HUGO_WIDTH,
  advanceFlight,
  createFlightGame,
  getGrindingWire,
  getHugoHitbox,
  getWireSlopeAtX,
  getWireYAtX,
  rectanglesOverlap,
  setFlightThrust,
  sweptRectangleHits,
  type Obstacle,
} from '../src/game/engine';

function clearCourse() {
  const state = createFlightGame(123);
  state.obstacles = [];
  state.coins = [];
  return state;
}

function obstacle(overrides: Partial<Obstacle> = {}): Obstacle {
  return {
    id: 99,
    kind: 'log',
    x: 100,
    y: GROUND_Y - 80,
    width: 50,
    height: 80,
    ...overrides,
  };
}

function wire(overrides: Partial<Obstacle> = {}): Obstacle {
  return {
    id: 199,
    kind: 'wire',
    x: 20,
    y: 430,
    width: 300,
    height: GROUND_Y - 430,
    sag: 48,
    ...overrides,
  };
}

describe('HUGO GO! deterministic flight physics', () => {
  it('starts immediately in a safe ground-running state', () => {
    const state = createFlightGame();
    expect(state.phase).toBe('playing');
    expect(state.hugo.grounded).toBe(true);
    expect(state.hugo.y + HUGO_HEIGHT).toBe(GROUND_Y);
    expect(state.obstacles[0].x).toBeGreaterThan(500);
  });

  it('accelerates upward continuously while thrust is held', () => {
    const state = clearCourse();
    expect(setFlightThrust(state, true)).toBe(true);
    expect(state.hugo.grounded).toBe(false);
    expect(state.hugo.velocityY).toBeLessThan(0);
    expect(state.hugo.jumpTime).toBe(0);
    const startingY = state.hugo.y;
    advanceFlight(state, 0.2);
    expect(state.hugo.y).toBeLessThan(startingY);
    expect(state.hugo.velocityY).toBeLessThan(0);
    expect(state.hugo.thrusting).toBe(true);
    expect(state.hugo.thrustIntensity).toBeGreaterThan(0.9);
    expect(state.hugo.airborneTime).toBeGreaterThan(0);
  });

  it('releasing thrust smoothly hands control back to gravity', () => {
    const state = clearCourse();
    setFlightThrust(state, true);
    advanceFlight(state, 0.24);
    const risingVelocity = state.hugo.velocityY;
    const releaseY = state.hugo.y;
    setFlightThrust(state, false);
    advanceFlight(state, 0.18);
    expect(state.hugo.velocityY).toBeGreaterThan(risingVelocity);
    expect(state.hugo.thrustIntensity).toBeLessThan(0.1);
    advanceFlight(state, 0.25);
    advanceFlight(state, 0.2);
    advanceFlight(state, 0.2);
    expect(state.hugo.y).toBeGreaterThan(releaseY);
  });

  it('does not turn repeated press events into velocity impulses', () => {
    const state = clearCourse();
    setFlightThrust(state, true);
    advanceFlight(state, 0.12);
    const velocityBeforeRepeatedPress = state.hugo.velocityY;
    setFlightThrust(state, true);
    expect(state.hugo.velocityY).toBe(velocityBeforeRepeatedPress);
  });

  it('turns a fast second press into one stronger double jump', () => {
    const state = clearCourse();
    setFlightThrust(state, true);
    advanceFlight(state, 0.12);
    setFlightThrust(state, false);
    setFlightThrust(state, true);
    expect(state.hugo.velocityY).toBeLessThanOrEqual(-480);
    expect(state.hugo.doubleJumpTime).toBe(0);
    expect(state.hugo.doubleJumpAvailable).toBe(false);

    const doubleJumpVelocity = state.hugo.velocityY;
    setFlightThrust(state, false);
    setFlightThrust(state, true);
    expect(state.hugo.velocityY).toBe(doubleJumpVelocity);
  });

  it('adds double-jump impulse to the current vertical momentum', () => {
    const rising = clearCourse();
    setFlightThrust(rising, true);
    advanceFlight(rising, 0.08);
    setFlightThrust(rising, false);
    const velocityBeforeDoubleJump = rising.hugo.velocityY;
    setFlightThrust(rising, true);
    expect(rising.hugo.velocityY).toBeLessThan(velocityBeforeDoubleJump);
    expect(rising.hugo.velocityY).toBe(-560);
  });

  it('does not grant the double jump after the fast-press window closes', () => {
    const state = clearCourse();
    setFlightThrust(state, true);
    setFlightThrust(state, false);
    advanceFlight(state, 0.25);
    advanceFlight(state, 0.25);
    const velocityBeforeLatePress = state.hugo.velocityY;
    setFlightThrust(state, true);
    expect(state.hugo.velocityY).toBe(velocityBeforeLatePress);
    expect(state.hugo.doubleJumpTime).toBe(Number.POSITIVE_INFINITY);
  });

  it('lands precisely on clear ground and resumes running', () => {
    const state = clearCourse();
    state.hugo.y = GROUND_Y - HUGO_HEIGHT - 170;
    state.hugo.velocityY = 0;
    state.hugo.grounded = false;
    for (let index = 0; index < 8; index += 1) advanceFlight(state, 0.2);
    expect(state.phase).toBe('playing');
    expect(state.hugo.grounded).toBe(true);
    expect(state.hugo.y).toBe(GROUND_Y - HUGO_HEIGHT);
    expect(state.hugo.velocityY).toBe(0);
  });

  it('treats touching an obstacle edge as collision', () => {
    const first = { x: 10, y: 10, width: 20, height: 20 };
    const touching = { x: 30, y: 12, width: 10, height: 10 };
    expect(rectanglesOverlap(first, touching)).toBe(true);
  });

  it('does not collide across a real positive gap', () => {
    const state = clearCourse();
    state.speed = 0;
    state.obstacles = [obstacle({
      x: state.hugo.x + HUGO_WIDTH + 0.01,
      y: state.hugo.y,
      height: HUGO_HEIGHT,
    })];
    advanceFlight(state, FIXED_STEP);
    expect(state.phase).toBe('playing');
  });

  it('detects a high-speed swept collision instead of tunnelling', () => {
    const moving = { x: 0, y: 20, width: 20, height: 20 };
    const thinObstacle = { x: 100, y: 0, width: 3, height: 60 };
    expect(sweptRectangleHits(moving, 180, 0, thinObstacle)).toBe(true);
    expect(sweptRectangleHits(moving, 70, 0, thinObstacle)).toBe(false);
  });

  it('lands safely on an obstacle top while falling', () => {
    const state = clearCourse();
    const hazard = obstacle({ x: state.hugo.x - 4, width: HUGO_WIDTH + 8, height: 96, y: GROUND_Y - 96 });
    state.obstacles = [hazard];
    state.hugo.y = hazard.y - HUGO_HEIGHT - 4;
    state.hugo.velocityY = 420;
    state.hugo.grounded = false;
    advanceFlight(state, 0.08);
    expect(state.phase).toBe('playing');
    expect(state.hugo.grounded).toBe(true);
    expect(state.hugo.surfaceId).toBe(hazard.id);
    expect(state.hugo.y + HUGO_HEIGHT).toBe(hazard.y);
    expect(state.hugo.velocityY).toBe(0);
  });

  it('lands on a thin obstacle even after a long frame', () => {
    const state = clearCourse();
    const hazard = obstacle({ x: state.hugo.x - 3, y: 500, width: HUGO_WIDTH + 60, height: 8 });
    state.obstacles = [hazard];
    state.hugo.y = 390;
    state.hugo.velocityY = 560;
    state.hugo.grounded = false;
    advanceFlight(state, 0.25);
    expect(state.phase).toBe('playing');
    expect(state.hugo.grounded).toBe(true);
    expect(state.hugo.surfaceId).toBe(hazard.id);
    expect(state.hugo.y + HUGO_HEIGHT).toBe(hazard.y);
  });

  it('runs along an obstacle top and falls only after its trailing edge passes', () => {
    const state = clearCourse();
    const platform = obstacle({
      x: state.hugo.x - 15,
      y: 560,
      width: 120,
      height: GROUND_Y - 560,
    });
    state.obstacles = [platform];
    state.hugo.y = platform.y - HUGO_HEIGHT - 2;
    state.hugo.velocityY = 180;
    state.hugo.grounded = false;
    advanceFlight(state, 0.05);
    expect(state.hugo.surfaceId).toBe(platform.id);
    const platformRunY = state.hugo.y;

    advanceFlight(state, 0.25);
    expect(state.phase).toBe('playing');
    expect(state.hugo.grounded).toBe(true);
    expect(state.hugo.y).toBe(platformRunY);

    advanceFlight(state, 0.25);
    advanceFlight(state, 0.25);
    expect(state.phase).toBe('playing');
    expect(state.hugo.grounded).toBe(false);
    expect(state.hugo.surfaceId).toBeNull();
    expect(state.hugo.y).toBeGreaterThan(platformRunY);
  });

  it('uses one exact quadratic curve for the rendered and physical wire', () => {
    const cable = wire({ x: 100, y: 420, width: 320, sag: 50 });
    expect(getWireYAtX(cable, 100)).toBe(420);
    expect(getWireYAtX(cable, 420)).toBe(420);
    expect(getWireYAtX(cable, 260)).toBe(470);
    expect(getWireYAtX(cable, 180)).toBe(457.5);
    expect(getWireSlopeAtX(cable, 100)).toBeCloseTo(0.625);
    expect(getWireSlopeAtX(cable, 260)).toBeCloseTo(0);
    expect(getWireSlopeAtX(cable, 420)).toBeCloseTo(-0.625);
  });

  it('catches Hugo on a drooping wire only when he crosses it from above', () => {
    const state = clearCourse();
    const cable = wire();
    state.obstacles = [cable];
    const contactX = state.hugo.x + HUGO_WIDTH / 2;
    state.hugo.y = getWireYAtX(cable, contactX) - HUGO_HEIGHT - 5;
    state.hugo.velocityY = 420;
    state.hugo.grounded = false;
    advanceFlight(state, 0.05);

    const movedCable = state.obstacles[0];
    expect(state.hugo.surfaceId).toBe(cable.id);
    expect(getGrindingWire(state)?.id).toBe(cable.id);
    expect(state.hugo.grounded).toBe(true);
    expect(state.hugo.y + HUGO_HEIGHT).toBeCloseTo(
      getWireYAtX(movedCable, contactX),
      7,
    );
    expect(state.hugo.grindTime).toBeGreaterThanOrEqual(0);
  });

  it('does not snap Hugo onto the wire while he is rising from below', () => {
    const state = clearCourse();
    const cable = wire();
    state.obstacles = [cable];
    const contactX = state.hugo.x + HUGO_WIDTH / 2;
    state.hugo.y = getWireYAtX(cable, contactX) - HUGO_HEIGHT + 14;
    state.hugo.velocityY = -320;
    state.hugo.grounded = false;
    state.hugo.jumpAvailable = false;
    advanceFlight(state, 0.04);
    expect(state.hugo.surfaceId).toBeNull();
    expect(getGrindingWire(state)).toBeNull();
  });

  it('keeps Hugo shoe-locked to the changing sag while the wire scrolls', () => {
    const state = clearCourse();
    const cable = wire();
    state.obstacles = [cable];
    const contactX = state.hugo.x + HUGO_WIDTH / 2;
    state.hugo.y = getWireYAtX(cable, contactX) - HUGO_HEIGHT - 3;
    state.hugo.velocityY = 360;
    state.hugo.grounded = false;
    advanceFlight(state, 0.05);
    const startingGrindTime = state.hugo.grindTime;
    const startingY = state.hugo.y;

    advanceFlight(state, 0.2);
    const movedCable = state.obstacles[0];
    expect(state.hugo.surfaceId).toBe(cable.id);
    expect(state.hugo.grindTime).toBeGreaterThan(startingGrindTime);
    expect(state.hugo.y).not.toBe(startingY);
    expect(state.hugo.y + HUGO_HEIGHT).toBeCloseTo(
      getWireYAtX(movedCable, contactX),
      7,
    );
  });

  it('jumps cleanly off a grinding wire on a fresh press', () => {
    const state = clearCourse();
    const cable = wire();
    state.obstacles = [cable];
    const contactX = state.hugo.x + HUGO_WIDTH / 2;
    state.hugo.y = getWireYAtX(cable, contactX) - HUGO_HEIGHT;
    state.hugo.velocityY = 0;
    state.hugo.grounded = true;
    state.hugo.surfaceId = cable.id;
    state.hugo.grindTime = 0.4;
    state.hugo.jumpAvailable = true;

    expect(setFlightThrust(state, true)).toBe(true);
    expect(state.hugo.surfaceId).toBeNull();
    expect(state.hugo.grindTime).toBe(Number.POSITIVE_INFINITY);
    expect(state.hugo.grounded).toBe(false);
    expect(state.hugo.velocityY).toBeLessThan(0);
  });

  it('lifts Hugo clear when the far wire post passes behind him', () => {
    const state = clearCourse();
    const contactX = state.hugo.x + HUGO_WIDTH / 2;
    const cable = wire({ x: contactX - 300 + 10 });
    state.obstacles = [cable];
    state.hugo.y = getWireYAtX(cable, contactX) - HUGO_HEIGHT;
    state.hugo.velocityY = 0;
    state.hugo.grounded = true;
    state.hugo.surfaceId = cable.id;
    state.hugo.grindTime = 0.7;
    advanceFlight(state, FIXED_STEP);
    expect(state.hugo.surfaceId).toBeNull();
    expect(state.hugo.grounded).toBe(false);
    expect(state.hugo.velocityY).toBeLessThan(0);
  });

  it('treats both visible wire supports as solid wall-splat hazards', () => {
    for (const post of ['left', 'right'] as const) {
      const state = clearCourse();
      const hugoFront = state.hugo.x + HUGO_WIDTH;
      const cable = wire({
        x: post === 'left'
          ? hugoFront + 9
          : hugoFront + 9 - 300,
      });
      state.obstacles = [cable];
      advanceFlight(state, 0.04);
      expect(state.hugo.stuckObstacleId).toBe(cable.id);
      expect(state.hugo.stuckObstacleOffsetX).toBe(post === 'left' ? -8 : cable.width - 8);
      expect(state.phase).toBe('playing');
    }
  });

  it('sticks Hugo harmlessly to an obstacle front instead of ending immediately', () => {
    const state = clearCourse();
    state.obstacles = [obstacle({
      x: state.hugo.x + HUGO_WIDTH + 1,
      y: state.hugo.y - 10,
      height: HUGO_HEIGHT + 10,
    })];
    setFlightThrust(state, true);
    advanceFlight(state, 0.04);
    expect(state.phase).toBe('playing');
    expect(state.hugo.stuckObstacleId).toBe(99);
    expect(state.hugo.thrusting).toBe(false);
  });

  it('lets a stuck Hugo spring upward before the recovery window expires', () => {
    const state = clearCourse();
    state.obstacles = [obstacle({
      x: state.hugo.x + HUGO_WIDTH + 1,
      y: state.hugo.y - 10,
      height: HUGO_HEIGHT + 10,
    })];
    advanceFlight(state, 0.04);
    expect(state.hugo.stuckObstacleId).toBe(99);
    const stuckY = state.hugo.y;

    setFlightThrust(state, true);
    expect(state.hugo.stuckObstacleId).toBeNull();
    expect(state.hugo.recoveryTime).toBe(0);
    advanceFlight(state, 0.12);
    expect(state.phase).toBe('playing');
    expect(state.hugo.y).toBeLessThan(stuckY);
    expect(state.hugo.recoveryGrace).toBeGreaterThan(0);
  });

  it('ends only after an unrecovered wall impact pushes Hugo off screen', () => {
    const state = clearCourse();
    state.obstacles = [obstacle({
      x: state.hugo.x + HUGO_WIDTH + 1,
      y: state.hugo.y - 10,
      height: HUGO_HEIGHT + 10,
    })];
    advanceFlight(state, 0.04);
    expect(state.phase).toBe('playing');
    for (let index = 0; index < 6; index += 1) advanceFlight(state, 0.2);
    expect(state.phase).toBe('gameover');
    expect(state.hugo.x).toBeLessThanOrEqual(-HUGO_WIDTH);
  });

  it('keeps substantially more running room between obstacle groups', () => {
    const state = createFlightGame(123);
    const clearances = state.obstacles.slice(1).map((current, index) => (
      current.x - (state.obstacles[index].x + state.obstacles[index].width)
    ));
    expect(Math.min(...clearances)).toBeGreaterThanOrEqual(560);
    expect(state.obstacles.some(({ kind }) => kind === 'wire')).toBe(true);
  });

  it('collects each coin exactly once', () => {
    const state = clearCourse();
    const hitbox = getHugoHitbox(state);
    state.coins = [{
      id: 7,
      x: hitbox.x + hitbox.width / 2,
      y: hitbox.y + hitbox.height / 2,
      radius: 10,
      collected: false,
    }];
    advanceFlight(state, FIXED_STEP);
    expect(state.runCoins).toBe(1);
    advanceFlight(state, FIXED_STEP);
    expect(state.runCoins).toBe(1);
  });

  it('produces the same motion with different render-frame chunking', () => {
    const manyFrames = clearCourse();
    const fewerFrames = clearCourse();
    setFlightThrust(manyFrames, true);
    setFlightThrust(fewerFrames, true);
    for (let index = 0; index < 120; index += 1) advanceFlight(manyFrames, 1 / 120);
    for (let index = 0; index < 12; index += 1) advanceFlight(fewerFrames, 1 / 12);
    expect(fewerFrames.phase).toBe(manyFrames.phase);
    expect(fewerFrames.hugo.y).toBeCloseTo(manyFrames.hugo.y, 7);
    expect(fewerFrames.distance).toBeCloseTo(manyFrames.distance, 7);
  });
});
