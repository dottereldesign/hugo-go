# HUGO GO!

HUGO GO! is a portrait browser game about Hugo, a 10-year-old Japanese/New Zealand boy who runs through Forest World and flies over obstacles using two tiny shoe jets.

Pressing **Play** on the home screen opens `#/game` and starts the run immediately. There is no map, level selector, loadout, tower system, or pre-run menu.

## Play

- Mobile: press and hold anywhere in the game to glide upward; release to descend.
- Desktop: hold the primary mouse button, Space, Up Arrow, or W; release to descend.
- Hugo automatically runs on safe ground.
- Ground running uses an eight-pose generated cycle at 12 fps.
- Ground is the only landable surface.
- Obstacles are solid hazards from every direction, including their tops.
- Collect coins, increase distance, and set a local best.
- A crash opens an immediate **Fly again** action.
- Forest World moves through Spring, Summer, Autumn, and Winter at 30-second boundaries, with a gradual ten-second blend before each change.

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

The tests cover deterministic held-thrust physics, smooth release to gravity, safe ground landing, forbidden obstacle landing, edge contact, positive-gap near misses, swept collision/tunnelling, coin collection, animation timing, persistence, direct Play-to-game navigation, retry, and mobile no-scroll behavior.

## Project map

```text
index.html                    home and playable game markup
src/main.ts                   routing, home controls, progress persistence
src/game/engine.ts            deterministic physics and collision rules
src/game/FlightGame.ts        canvas rendering, input, HUD, game lifecycle
src/game/animation.ts         eight-frame run-cycle timing and atlas coordinates
src/game/seasons.ts           seasonal timing, filters, blends, and weights
src/state.ts                  local player state and top-five runs
src/style.css                 home and portrait-game presentation
src/assets/game/              compressed background, run atlas, and flight sprite
art/source-images/game/       full generated sources and prompt record
tests/engine.test.ts          physics/collision unit tests
tests/e2e/                    desktop and mobile browser tests
docs/GAME_SPEC.md             implemented game contract
docs/ART_BACKLOG.md           optional future visual assets
```

## Creative direction

Hugo is presented as an individual child with natural facial features, never through racial caricature or exaggerated ethnic markers. Forest World combines New Zealand and Japanese nature cues such as silver-fern-like plants, rimu/sakura naming, petals, evergreen forest, and a distant volcanic mountain.

Do not add Māori patterns or motifs. Do not use stereotyped eye treatment, costumes, accents, or other shorthand to signal Hugo’s heritage.
