import { describe, expect, it } from 'vitest';
import {
  DOUBLE_JUMP_DURATION,
  FLIGHT_FRAME_COUNT,
  JET_FLAME_FRAME_COUNT,
  JET_FLAME_FRAME_HEIGHT,
  JET_FLAME_FRAME_WIDTH,
  LANDING_FRAME_START,
  RUN_FRAME_HEIGHT,
  RUN_FRAME_WIDTH,
  WALL_RECOVERY_DURATION,
  getDoubleJumpFrame,
  getDoubleJumpFrameLayout,
  getFlightLoopFrame,
  getFreefallLoopFrame,
  getJetFlameAnchors,
  getJetFlameFrame,
  getLandingFrame,
  getTakeoffFrame,
  getWallRecoveryFrame,
  getWallStuckFrame,
} from '../src/game/animation';

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
          expect(anchor.angle).toBeLessThanOrEqual(0.75);
        }
      }
      expect(new Set(frameAnchors.map((anchors) => (
        anchors.map(({ x, y }) => `${x},${y}`).join('|')
      ))).size).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps each exhaust origin on its measured metal heel port', () => {
    for (const pose of ['powered', 'glide'] as const) {
      for (let frame = 0; frame < FLIGHT_FRAME_COUNT; frame += 1) {
        const [rearShoe, frontShoe] = getJetFlameAnchors(pose, frame);
        expect(rearShoe.x * RUN_FRAME_WIDTH).toBeGreaterThanOrEqual(95);
        expect(rearShoe.x * RUN_FRAME_WIDTH).toBeLessThanOrEqual(98);
        expect(rearShoe.y * RUN_FRAME_HEIGHT).toBeGreaterThanOrEqual(284);
        expect(rearShoe.y * RUN_FRAME_HEIGHT).toBeLessThanOrEqual(291);
        expect(frontShoe.x * RUN_FRAME_WIDTH).toBeGreaterThanOrEqual(139);
        expect(frontShoe.x * RUN_FRAME_WIDTH).toBeLessThanOrEqual(143);
        expect(frontShoe.y * RUN_FRAME_HEIGHT).toBeGreaterThanOrEqual(280);
        expect(frontShoe.y * RUN_FRAME_HEIGHT).toBeLessThanOrEqual(286);
      }
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

  it('plays all 30 authored jet-flame frames in one second at 30 fps', () => {
    const frames = Array.from({ length: JET_FLAME_FRAME_COUNT }, (_, index) => (
      getJetFlameFrame(index / 30)
    ));
    expect(frames.map((frame) => frame.index)).toEqual(
      Array.from({ length: 30 }, (_, index) => index),
    );
    expect(getJetFlameFrame(1).index).toBe(0);
    expect(new Set(frames.map(({ sourceX, sourceY }) => `${sourceX},${sourceY}`)).size).toBe(30);
    expect(frames.every(({ sourceX }) => sourceX % JET_FLAME_FRAME_WIDTH === 0)).toBe(true);
    expect(frames.every(({ sourceY }) => sourceY % JET_FLAME_FRAME_HEIGHT === 0)).toBe(true);
  });

  it('offsets the second shoe without changing the 30 fps flame cadence', () => {
    expect(getJetFlameFrame(0, 13).index).toBe(13);
    expect(getJetFlameFrame(1 / 30, 13).index).toBe(14);
    expect(getJetFlameFrame(17 / 30, 13).index).toBe(0);
  });
});
