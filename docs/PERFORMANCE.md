# Performance notes

> **ARCHIVED VERSION 01 MATERIAL — DO NOT USE FOR NEW WORK.**
> The active direction is [`VERSION_03.md`](./VERSION_03.md).

## Current runtime

The game uses one `390 × 780` logical playfield. Its core always renders at a stable `2×`
(`780 × 1560`), including desktop displays that report DPR 1. On phones the Canvas fills
the entire available region and its backing store grows only along the wider dimension
needed by that device. The renderer draws additional sky and ground into this scene bleed;
the `390 × 780` playfield, character, hazards, and collisions retain one uniform scale.
This keeps Hugo crisp and removes safe-area gutters without stretching the game or paying
the disproportionate fill-rate cost of a 3× full-screen Canvas.

Physics and collision are render-rate independent and use fixed `1/120 s` substeps. Each frame:

- advances at most `0.05 s`;
- moves a short obstacle/coin list;
- uses one cached sky gradient;
- draws the scrolling trail, pickups, red obstacles or one quadratic wire, one Hugo atlas
  cell, and up to 24 seasonal particles;
- writes HUD text only when a displayed value changes.

The animation loop pauses while the document is hidden. Character glow is limited to the active jet effect, avoiding full-scene per-frame filters or offscreen buffers.

## Production audit

Run:

```bash
npm run build
npm run audit:performance
```

The audit serves the production build, opens a `390 × 844` Chromium viewport at simulated
DPR 3, then separately forces, warms, and samples the 30 fps ground-run animation path and the
30 fps cable-grind path for 180 settled frames each. Headless Chromium uses software
rasterization so unrelated desktop GPU contention does not distort this render-loop
regression check. The checked mobile budget is:

- backing store at least `780 × 1560`, with equal horizontal and vertical scale;
- p95 frame interval no slower than `34 ms` in the constrained headless runner.

Latest local result on 25 July 2026:

- 60-frame run average: approximately `18.51 ms`;
- 60-frame run p95: `33.4 ms`;
- 60-frame run maximum: `50 ms`;
- 30-frame grind average: approximately `16.88 ms` (about 60 fps);
- 30-frame grind p95: `16.8 ms`;
- 30-frame grind maximum: `33.4 ms`;
- tested backing store: `780 × 1564` for a `390 × 782` phone play region,
  preserving the `2×` scale while adding two logical pixels of vertical scene bleed;
- decoded resources: approximately `3.05 MB` across 23 requests;
- long tasks during both settled samples: `0`.

The 2× cap is a deliberate quality/performance balance: it doubles Hugo's physical render height compared with the former 1× mobile path while avoiding the 2.25× pixel-count increase from 2× to 3×. A controlled 3× comparison regressed the same audit to a `50 ms` p95 with repeated long tasks, so 3× is not used on phones.

## Asset budget

Runtime character atlases are approximately:

- 60-frame run: 541 KB;
- powered glide: 111 KB;
- free glide: 119 KB;
- freefall: 118 KB;
- jump/landing: 140 KB;
- double jump: 120 KB;
- wall impact/recovery: 100 KB.

The run atlas is packed into a `1920 × 1008` texture using 60 `192 × 168` cells.
That gives the stable 2× Canvas enough physical source pixels for crisp rendering while
using about 7.7 MB of decoded RGBA memory instead of roughly 29.5 MB at the other
character atlases' `384 × 320` cell size. The 30-frame side-profile grind atlas is
366 KB, the 30-frame jet-flame atlas is
approximately 132 KB, and the trail is 64 KB. The grind atlas is packed into a near-square
`1120 × 1176` texture using `224 × 196` cells: enough source resolution for the stable
2× Canvas while avoiding the first draft’s overly wide texture. Images request async
decoding as soon as they load without blocking their render-ready state. Full generation
sources under `art/` are excluded from production.

## Mobile behavior

- gameplay is fixed to `100dvh`;
- document overflow is hidden and overscroll is contained;
- Canvas touch action is disabled;
- safe-area insets are included;
- phones fill the available width and height without page-colored gutters;
- the playable `1:2` world remains uniformly scaled while extra sky/ground fills any
  device-specific remainder;
- tablet and desktop layouts retain the centered `1:2` presentation;
- the backing store always includes the `780 × 1560` core at 2×, regardless of DPR.

Browser tests assert the no-scroll viewport contract, edge-to-edge phone coverage, safe-area
behavior, backing-store scale, and undistorted playfield across phone, tablet, and desktop
viewports. The phone matrix covers widths from 320 through 600 CSS pixels and includes an
iPhone 11-sized viewport with simulated notch and home-indicator insets.

## Regression checks

Before deployment:

```bash
npm test
npm run test:e2e
npm run build
npm run audit:performance
```

Investigate new full-screen images, per-frame filters, unnecessary DOM writes, growing entity lists, touch-driven page movement, or a changed Canvas backing size.
