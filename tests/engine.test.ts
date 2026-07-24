import { describe, expect, it } from 'vitest';
import {
  FIXED_STEP,
  GROUND_Y,
  HUGO_HEIGHT,
  HUGO_WIDTH,
  advanceFlight,
  createFlightGame,
  getHugoHitbox,
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
    expect(state.hugo.grounded).toBe(true);
    expect(state.hugo.velocityY).toBe(0);
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

  it('never converts an obstacle top into landable ground', () => {
    const state = clearCourse();
    const hazard = obstacle({ x: state.hugo.x - 4, width: HUGO_WIDTH + 8, height: 96, y: GROUND_Y - 96 });
    state.obstacles = [hazard];
    state.hugo.y = hazard.y - HUGO_HEIGHT - 4;
    state.hugo.velocityY = 420;
    state.hugo.grounded = false;
    advanceFlight(state, 0.08);
    expect(state.phase).toBe('gameover');
    expect(state.hugo.grounded).toBe(false);
    expect(state.hugo.y + HUGO_HEIGHT).toBeLessThan(GROUND_Y);
  });

  it('catches a fall through a thin obstacle even after a long frame', () => {
    const state = clearCourse();
    const hazard = obstacle({ x: state.hugo.x - 3, y: 500, width: HUGO_WIDTH + 6, height: 8 });
    state.obstacles = [hazard];
    state.hugo.y = 390;
    state.hugo.velocityY = 560;
    state.hugo.grounded = false;
    advanceFlight(state, 0.25);
    expect(state.phase).toBe('gameover');
  });

  it('still collides with a solid obstacle while thrust is held', () => {
    const state = clearCourse();
    state.obstacles = [obstacle({
      x: state.hugo.x + HUGO_WIDTH + 1,
      y: state.hugo.y - 10,
      height: HUGO_HEIGHT + 10,
    })];
    setFlightThrust(state, true);
    advanceFlight(state, 0.04);
    expect(state.phase).toBe('gameover');
    expect(state.hugo.thrusting).toBe(false);
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
