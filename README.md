# HUGO GO!

HUGO GO! is a portrait browser game about Hugo, a 10-year-old Japanese/New Zealand boy who runs through Forest World and flies over obstacles using two tiny shoe jets.

Pressing **Play** on the home screen opens `#/game` and starts the run immediately. There is no map, level selector, loadout, tower system, or pre-run menu.

## Play

- Mobile: press and hold anywhere in the game to jump, then fly upward; release to descend.
- Desktop: hold the primary mouse button, Space, Up Arrow, or W to jump/fly; release to descend.
- Hugo automatically runs on the ground and on obstacle tops.
- Ground running uses all 60 authored full-body poses at 30 fps in a smoother two-second loop.
- Settings includes a fullscreen Animation Sandbox at `#/sandbox` for reviewing every live character and shoe-fire animation. Each preview has independent play, pause, restart, loop, frame-step, and numbered frame-selection controls.
- The bottom of the Sandbox documents the Animation V2 production framework and includes its approved first 24 Freefall V2 wingsuit-posture frames at 30 fps for comparison with the original.
- Sandbox edit mode can deactivate individual frames; red frames remain inspectable but are skipped by playback and looping.
- The reusable authoring, validation, rigging, and prompt standard is documented in [`docs/ANIMATION_V2.md`](docs/ANIMATION_V2.md).
- Occasional two-post drooping wires can be landed on from above. Hugo automatically
  grinds their curved cable with a 30-frame side-profile cycle; press again to jump off.
- A quick second press after takeoff triggers one stronger animated double jump.
- Obstacle tops are safe platforms. A direct front impact splats Hugo against the red obstacle; press and hold quickly to peel away before the scrolling world pushes him off-screen.
- Collect coins, increase distance, and set a local best.
- Failing to recover from a splat opens an immediate **Fly again** action.
- Forest World moves through Spring, Summer, Autumn, and Winter at 30-second boundaries, with a gradual ten-second blend before each change.
- The clean sky keeps Hugo and the oversized red obstacles readable at speed.

Forest World is the one playable course. The other five world cards remain on the home screen in a muted, locked **Coming soon** state.

## Progress

Runs are stored locally under `hugo-go-player-v1`. A completed run updates:

- total coins;
- XP and player level;
- flight power;
- best distance;
- total run count;
- the five best local Forest runs.

There is no account or online/global leaderboard yet.

## Development

```bash
npm install
npm run dev
npm test
npm run test:e2e
npm run build
```

The tests cover deterministic held-thrust physics, double jumps, smooth release to gravity,
ground and obstacle-top landing, swept drooping-wire entry, curve following, grind exits
and jumps, wall splats and recovery, pushed-off loss, obstacle spacing, coin collection,
all 60 sequential run frames, all 30 sequential grind and flame frames, animation timing, persistence, direct
Play-to-game navigation, retry, and mobile no-scroll behavior.

## Project map

```text
index.html                    home and playable game markup
src/main.ts                   routing, home controls, progress persistence
src/game/engine.ts            deterministic physics and collision rules
src/game/FlightGame.ts        canvas rendering, input, HUD, game lifecycle
src/game/animation.ts         run, flight, grind, impact, and VFX atlas timing
src/game/seasons.ts           seasonal timing, filters, blends, and weights
src/state.ts                  local player state and top-five runs
src/style.css                 home and portrait-game presentation
src/assets/game/              compressed terrain and character atlases
art/source-images/game/       full generated sources and prompt record
tests/engine.test.ts          physics/collision unit tests
tests/e2e/                    desktop and mobile browser tests
docs/GAME_SPEC.md             implemented game contract
docs/ART_BACKLOG.md           optional future visual assets
```

## Creative direction

Hugo is presented as an individual child with natural facial features, never through racial caricature or exaggerated ethnic markers. Forest World combines New Zealand and Japanese nature cues such as silver-fern-like plants, rimu/sakura naming, petals, evergreen forest, and a distant volcanic mountain.

Do not add Māori patterns or motifs. Do not use stereotyped eye treatment, costumes, accents, or other shorthand to signal Hugo’s heritage.
