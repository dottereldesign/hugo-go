import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import extensions from '../src/assets/game/2d-v03/sunrise-side/extensions-manifest.json';

describe('Version 03 side-profile extensions', () => {
  it('registers 22 consecutive pose ideas after the canonical twelve', () => {
    expect(extensions.poseCount).toBe(22);
    expect(extensions.poses.map(({ index }) => index)).toEqual(
      Array.from({ length: 22 }, (_, index) => index + 13),
    );
    expect(new Set(extensions.poses.map(({ filename }) => filename)).size).toBe(22);
  });

  it('binds every extension to a transparent 512px PNG with a safety gutter', () => {
    for (const pose of extensions.poses) {
      const path = resolve(
        'src/assets/game/2d-v03/sunrise-side/poses',
        pose.filename,
      );
      const bytes = readFileSync(path);
      const digest = createHash('sha256').update(bytes).digest('hex');
      const [left, top, right, bottom] = pose.alphaBounds;

      expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
      expect(bytes.readUInt32BE(16)).toBe(512);
      expect(bytes.readUInt32BE(20)).toBe(512);
      expect(bytes[25]).toBe(6);
      expect(digest).toBe(pose.sha256);
      expect(left).toBeGreaterThanOrEqual(36);
      expect(top).toBeGreaterThanOrEqual(36);
      expect(512 - right).toBeGreaterThanOrEqual(36);
      expect(512 - bottom).toBeGreaterThanOrEqual(36);
    }
  });
});
