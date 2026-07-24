# Performance notes

## Current runtime

The game uses one `390 × 780` logical Canvas. Phones render at a capped `1×` backing resolution even on a simulated `3×` device, while larger screens may use up to `2×`. CSS preserves the same physical play size, so the mobile cap trades invisible excess pixels for steadier input and animation.

Physics and collision are render-rate independent and use fixed `1/120 s` substeps. Each frame:

- advances at most `0.05 s`;
- moves a short obstacle/coin list;
- uses one cached sky gradient;
- draws the scrolling trail, pickups, red obstacles, one Hugo atlas cell, up to 24 seasonal particles, and at most one giant SVG planet;
- writes HUD text only when a displayed value changes.

The animation loop pauses while the document is hidden. Planet glow is authored inside the SVGs, avoiding per-frame Canvas blur filters or offscreen buffers.

## Production audit

Run:

```bash
npm run build
npm run audit:performance
```

The audit serves the production build, opens a `390 × 844` Chromium viewport at simulated DPR 3, starts a powered jump, and samples 180 animation frames after load/input settling. The checked mobile budget is:

- backing store no larger than `390 × 780`;
- p95 frame interval no slower than `34 ms` in the constrained headless runner.

Latest local result on 24 July 2026:

- average frame interval: approximately `20 ms` (about 50 fps);
- p95 interval: `33.4 ms`;
- backing store: `390 × 780`;
- decoded resources: approximately `2.21 MB` across 30 requests.

This improved the first DPR-3 audit from a `50 ms` p95 at a `585 × 1170` backing store.

## Asset budget

Runtime character atlases are approximately:

- run: 167 KB;
- powered glide: 111 KB;
- free glide: 119 KB;
- jump/landing: 140 KB;
- double jump: 120 KB;
- wall impact/recovery: 111 KB.

The trail is 64 KB. The three planets are external SVG files between 1.3 and 1.6 KB each; `?no-inline` keeps their markup out of the JavaScript bundle. Full generation sources under `art/` are excluded from production.

Jet fire remains a few Canvas paths/gradients, so its color and intensity do not require another decoded atlas.

## Mobile behavior

- gameplay is fixed to `100dvh`;
- document overflow is hidden and overscroll is contained;
- Canvas touch action is disabled;
- safe-area insets are included;
- the board preserves its portrait aspect ratio;
- a high-density phone still uses only the `390 × 780` mobile backing store.

Browser tests assert the no-scroll viewport contract and backing-store cap.

## Regression checks

Before deployment:

```bash
npm test
npm run test:e2e
npm run build
npm run audit:performance
```

Investigate new full-screen images, per-frame filters, unnecessary DOM writes, growing entity lists, touch-driven page movement, or a changed Canvas backing size.
