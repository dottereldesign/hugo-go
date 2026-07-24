# Performance notes

## Current runtime

The game uses one `390 × 780` logical Canvas and caps device pixel ratio at `2`. Physics and collision are independent of render rate and run in fixed `1/120 s` substeps.

Each animation frame:

- advances at most `0.05 s` in the browser controller;
- moves a small obstacle/coin list;
- draws procedural scenery, pickups, obstacles, and one Hugo sprite;
- updates three compact HUD values.

Expired entities are removed and course content is generated only a short distance ahead.

## Asset budget

The two runtime Hugo WebP sprites are approximately 142 KB combined. Full-resolution generation sources live under `art/` and are not included in the Vite output.

The Forest environment, coins, and hazards do not require bitmap downloads.

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
