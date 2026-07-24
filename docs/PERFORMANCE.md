# Performance notes

## Current runtime

The game uses one `390 × 780` logical Canvas. Phones always render to a `2×` (`780 × 1560`) backing store, including browsers that report DPR 1; high-density phones are capped at 2×. This keeps the small character sprite crisp without paying the disproportionate fill-rate cost of a 3× full-screen Canvas. Larger screens use their reported density up to 2×.

Physics and collision are render-rate independent and use fixed `1/120 s` substeps. Each frame:

- advances at most `0.05 s`;
- moves a short obstacle/coin list;
- uses one cached sky gradient;
- draws the scrolling trail, pickups, red obstacles, one Hugo atlas cell, and up to 24 seasonal particles;
- writes HUD text only when a displayed value changes.

The animation loop pauses while the document is hidden. Character glow is limited to the active jet effect, avoiding full-scene per-frame filters or offscreen buffers.

## Production audit

Run:

```bash
npm run build
npm run audit:performance
```

The audit serves the production build, opens a `390 × 844` Chromium viewport at simulated DPR 3, starts a powered jump, and samples 180 animation frames after load/input settling. The checked mobile budget is:

- backing store exactly `780 × 1560`;
- p95 frame interval no slower than `34 ms` in the constrained headless runner.

Latest local result on 25 July 2026:

- average frame interval: approximately `19.4 ms` (about 52 fps);
- p95 interval: `33.4 ms`;
- backing store: `780 × 1560`;
- decoded resources: approximately `2.29 MB` across 27 requests;
- long tasks during the settled sample: `0`.

The 2× cap is a deliberate quality/performance balance: it doubles Hugo's physical render height compared with the former 1× mobile path while avoiding the 2.25× pixel-count increase from 2× to 3×. A controlled 3× comparison regressed the same audit to a `50 ms` p95 with repeated long tasks, so 3× is not used on phones.

## Asset budget

Runtime character atlases are approximately:

- run: 167 KB;
- powered glide: 111 KB;
- free glide: 119 KB;
- jump/landing: 140 KB;
- double jump: 120 KB;
- wall impact/recovery: 100 KB.

The trail is 64 KB. Full generation sources under `art/` are excluded from production.

Jet fire remains a few Canvas paths/gradients, so its color and intensity do not require another decoded atlas.

## Mobile behavior

- gameplay is fixed to `100dvh`;
- document overflow is hidden and overscroll is contained;
- Canvas touch action is disabled;
- safe-area insets are included;
- the board preserves its portrait aspect ratio;
- every phone uses the `780 × 1560` mobile backing store, regardless of a reported DPR from 1 through 3.

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
