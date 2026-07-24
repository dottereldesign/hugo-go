# Performance notes

## Current runtime

The game uses one `390 × 780` logical Canvas and caps device pixel ratio at `2`. Physics and collision are independent of render rate and run in fixed `1/120 s` substeps.

Each animation frame:

- advances at most `0.05 s` in the browser controller;
- moves a small obstacle/coin list;
- draws one filtered background texture, pickups, obstacles, one Hugo atlas cell, and at most 24 simple seasonal particles;
- updates three compact HUD values.

Expired entities are removed and course content is generated only a short distance ahead.

## Asset budget

The eight-frame run atlas is about 167 KB. The powered, glide/fall, and transition atlases are approximately 111 KB, 119 KB, and 107 KB. The Forest background is about 308 KB. Full-resolution generation sources live under `art/` and are not included in the Vite output.

Jet fire is drawn from a handful of Canvas paths and gradients. No flame texture or particle atlas is decoded, and color/intensity changes do not require new artwork.

The seasonal system reuses the same background for all four profiles. It does not decode or cross-fade four separate multi-megabyte plates. Filter parameters and particle alpha weights are interpolated numerically.

Gameplay images are not requested on the home route. `FlightGame.start()` begins their lazy load only after Play opens `#/game`, so the new textures do not compete with the existing home illustrations.

Background filtering is cached in a `390 × 704` offscreen canvas. A steady season filters once. During each ten-second blend the cache updates in 120 small transition steps (about 12 times per second), while the regular render loop only copies the cached plate. This avoids applying a full-resolution filter on every 2× mobile frame.

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
