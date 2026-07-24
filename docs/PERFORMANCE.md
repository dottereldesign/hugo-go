# HUGO GO! performance guide

## Current target

The current build is primarily an animated HTML/CSS home screen plus a lightweight game placeholder. It should:

- remain responsive during the entrance sequence;
- avoid loading music before the player interacts;
- lazy-load noncritical home artwork where practical;
- avoid errors when switching between `#/home` and `#/game`;
- build cleanly for GitHub Pages.

Use browser performance tools when the experience feels slow. Chrome DevTools Performance and the browser task manager are more useful than adding a permanent profiler to the current placeholder.

## Future flight-game budget

The flight engine should target:

- 60 frames per second during a run;
- one Canvas sized to a deliberate pixel budget;
- fixed-step or otherwise deterministic physics;
- pooled obstacles and pickups;
- no DOM updates every simulation tick;
- bounded particles and audio voices;
- pause when the tab is hidden;
- responsive scaling without changing physics.

HUD values such as distance and boost energy can update at a lower cadence than the visual scene.

## Verification

Current automated checks:

```bash
npm test
npm run test:e2e
npm run build
```

When the flight engine arrives, add a deterministic browser performance test that measures:

- frame-time distribution;
- active obstacle and pickup counts;
- Canvas backing resolution;
- allocations during a representative run;
- page errors;
- behavior after pause, restart, and tab visibility changes.

Do not add hardware-specific FPS gates until the structural budgets are stable.
