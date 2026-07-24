import { describe, expect, it } from 'vitest';
import {
  DOUBLE_JUMP_DURATION,
  FLIGHT_FRAME_COUNT,
  LANDING_FRAME_START,
  WALL_RECOVERY_DURATION,
  getDoubleJumpFrame,
  getDoubleJumpFrameLayout,
  getFlightLoopFrame,
  getFreefallLoopFrame,
  getJetFlameAnchors,
  getLandingFrame,
  getTakeoffFrame,
  getWallRecoveryFrame,
  getWallStuckFrame,
} from '../src/game/animation';
import { JET_FLAME_COLORS } from '../src/game/FlightGame';

describe('Hugo character animation timing', () => {
  it('loops all six powered or glide frames without leaving the atlas', () => {
    const frames = Array.from({ length: FLIGHT_FRAME_COUNT }, (_, index) => (
      getFlightLoopFrame(index / 12)
    ));
    expect(frames.map((frame) => frame.index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(getFlightLoopFrame(FLIGHT_FRAME_COUNT / 12).index).toBe(0);
    for (const frame of frames) {
      expect(frame.sourceX).toBeGreaterThanOrEqual(0);
      expect(frame.sourceY).toBeGreaterThanOrEqual(0);
    }
  });

  it('loops all six freefall banking frames at its own relaxed cadence', () => {
    const frames = Array.from({ length: FLIGHT_FRAME_COUNT }, (_, index) => (
      getFreefallLoopFrame(index / 10)
    ));
    expect(frames.map((frame) => frame.index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(getFreefallLoopFrame(FLIGHT_FRAME_COUNT / 10).index).toBe(0);
  });

  it('uses the two fluid crouch-and-airborne poses and skips stiff duplicate strides', () => {
    expect(getTakeoffFrame(0).index).toBe(2);
    expect(getTakeoffFrame(1 / 12).index).toBe(3);
    expect(getTakeoffFrame(10).index).toBe(3);
  });

  it('uses all four generated fall, toe-touch, compression, and recovery poses', () => {
    expect(getLandingFrame(0).index).toBe(LANDING_FRAME_START);
    expect(getLandingFrame(1 / 12).index).toBe(5);
    expect(getLandingFrame(2 / 12).index).toBe(6);
    expect(getLandingFrame(3 / 12).index).toBe(7);
    expect(getLandingFrame(10).index).toBe(7);
  });

  it('provides two shoe-port flame anchors for every moving in-air frame', () => {
    for (const pose of ['powered', 'glide'] as const) {
      const frameAnchors = Array.from({ length: FLIGHT_FRAME_COUNT }, (_, frame) => (
        getJetFlameAnchors(pose, frame)
      ));
      expect(frameAnchors.every((anchors) => anchors.length === 2)).toBe(true);
      for (const anchors of frameAnchors) {
        for (const anchor of anchors) {
          expect(anchor.x).toBeGreaterThan(0.15);
          expect(anchor.x).toBeLessThan(0.5);
          expect(anchor.y).toBeGreaterThan(0.7);
          expect(anchor.y).toBeLessThan(0.95);
          expect(anchor.angle).toBeGreaterThanOrEqual(0.45);
          expect(anchor.angle).toBeLessThanOrEqual(0.7);
        }
      }
      expect(new Set(frameAnchors.map((anchors) => (
        anchors.map(({ x, y }) => `${x},${y}`).join('|')
      ))).size).toBeGreaterThan(3);
    }
  });

  it('plays every double-jump spin frame once before returning to flight', () => {
    const frames = Array.from({ length: 6 }, (_, index) => (
      getDoubleJumpFrame(index / 14).index
    ));
    expect(frames).toEqual([0, 1, 2, 3, 4, 5]);
    expect(getDoubleJumpFrame(DOUBLE_JUMP_DURATION + 1).index).toBe(5);
  });

  it('normalizes double-jump frame scale and centers each transition', () => {
    const layouts = Array.from({ length: 6 }, (_, index) => getDoubleJumpFrameLayout(index));
    expect(new Set(layouts.map(({ scale }) => scale)).size).toBeGreaterThan(3);
    expect(layouts.every(({ scale }) => scale >= 0.8 && scale <= 0.93)).toBe(true);
    expect(layouts.some(({ verticalOffset }) => verticalOffset < 0)).toBe(true);
    expect(layouts.some(({ verticalOffset }) => verticalOffset > 0.09)).toBe(true);
  });

  it('holds the splat wobble and then plays all three recovery poses', () => {
    expect(getWallStuckFrame(0).index).toBe(0);
    expect([1, 2]).toContain(getWallStuckFrame(0.25).index);
    expect([1, 2]).toContain(getWallStuckFrame(0.4).index);
    expect(getWallRecoveryFrame(0).index).toBe(3);
    expect(getWallRecoveryFrame(1 / 12).index).toBe(4);
    expect(getWallRecoveryFrame(WALL_RECOVERY_DURATION).index).toBe(5);
  });

  it('uses a warm scorched-red fire palette without the old cyan flame', () => {
    expect(JET_FLAME_COLORS.outer).toBe('#e53b18');
    expect(JET_FLAME_COLORS.tip).toBe('#8f160f');
    expect(JET_FLAME_COLORS.glow).toContain('207, 39, 17');
    expect(Object.values(JET_FLAME_COLORS).join(' ')).not.toContain('#58e5ff');
  });
});
