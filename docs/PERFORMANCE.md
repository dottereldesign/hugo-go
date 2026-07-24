# Performance notes

## Current runtime

The game uses one `390 × 780` logical Canvas and caps device pixel ratio at `2`. Physics and collision are independent of render rate and run in fixed `1/120 s` substeps.

Each animation frame:

- advances at most `0.05 s` in the browser controller;
- moves a small obstacle/coin list;
- fills a flat sky, draws the scrolling trail, pickups, obstacles, one Hugo atlas cell, and at most 24 simple seasonal particles;
- updates three compact HUD values.

Expired entities are removed and course content is generated only a short distance ahead.

## Asset budget

The eight-frame run atlas is about 167 KB. The powered, glide/fall, and eight-frame jump/landing atlases are approximately 111 KB, 119 KB, and 140 KB. The wide transparent trail is about 64 KB. Full-resolution generation sources live under `art/` and are not included in the Vite output.

Jet fire is drawn from a handful of Canvas paths and gradients. No flame texture or particle atlas is decoded, and color/intensity changes do not require new artwork.

The seasonal system does not decode or cross-fade full-screen plates. Tint and particle alpha weights are interpolated numerically over the flat blue sky and lightweight trail.

Gameplay images are not requested on the home route. `FlightGame.start()` begins their lazy load only after Play opens `#/game`, so the new textures do not compete with the existing home illustrations.

The previous `390 × 704` filtered-background buffer has been removed. The main renderer now uses one sky fill and at most two trail draws, avoiding both the offscreen allocation and full-plate copy.

## Mobile behavior

- gameplay is fixed to `100dvh`;
- page overflow is hidden;
- Canvas touch action is disabled;
- overscroll is contained;
- the board uses a fixed portrait aspect ratio;
- safe-area insets are included;
- the render backing store never exceeds 2× logical resolution.

The browser tests assert that a 390×844 game view has equal viewport/document height and `overflow: hidden`.

## Regression checks

Before deployment:

```bash
npm test
npm run test:e2e
npm run build
```

Review the production build for:

- unexpectedly large new runtime images;
- long main-thread frames while many obstacles are visible;
- touch input causing page movement;
- a changed canvas aspect ratio;
- HUD or overlay DOM triggering layout outside the fixed game view.
