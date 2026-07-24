import { describe, expect, it } from 'vitest';
import {
  FLIGHT_FRAME_COUNT,
  LANDING_FRAME_START,
  getFlightLoopFrame,
  getJetFlameAnchors,
  getLandingFrame,
  getTakeoffFrame,
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
          expect(anchor.angle).toBeGreaterThan(0);
          expect(anchor.angle).toBeLessThan(0.35);
        }
      }
      expect(new Set(frameAnchors.map((anchors) => (
        anchors.map(({ x, y }) => `${x},${y}`).join('|')
      ))).size).toBeGreaterThan(3);
    }
  });

  it('uses a warm scorched-red fire palette without the old cyan flame', () => {
    expect(JET_FLAME_COLORS.outer).toBe('#e53b18');
    expect(JET_FLAME_COLORS.tip).toBe('#8f160f');
    expect(JET_FLAME_COLORS.glow).toContain('207, 39, 17');
    expect(Object.values(JET_FLAME_COLORS).join(' ')).not.toContain('#58e5ff');
  });
});
