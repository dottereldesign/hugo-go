# HUGO GO!

HUGO GO! is a browser game in development: a fast, friendly flight game inspired by the immediate one-button rhythm of Flappy Bird and the momentum, boosts, pickups, and obstacle variety of Jetpack-style runners.

The polished home screen is the current product surface. It introduces Hugo, preserves six imaginative learning worlds, and hands Play off to a separate placeholder game page while the flight mechanics are built.

## Current experience

- Full-screen animated HUGO GO! home screen.
- Hugo as the player identity.
- Six selectable world themes: Forest, Workshop, Word, Number, Space, and Music.
- Responsive desktop and mobile layouts.
- Local world selection and accessibility preferences.
- Optional music and interface sound packs.
- A dedicated `#/game` page reached directly from Play.
- No maps, level selector, combat board, or legacy strategy-game flow.

The game page currently communicates the intended direction without pretending the flight game is already complete.

## Product direction

The first playable version should focus on one clear loop:

1. Hugo begins moving forward automatically.
2. The player taps or presses to flap upward.
3. A held input activates a limited jetpack boost.
4. Hugo passes through gaps, avoids obstacles, and collects useful items.
5. Distance and clean passes build the score.
6. A collision ends the run and offers a quick retry.

Worlds are visual and learning themes for future courses, not map packs. Each world may change scenery, obstacle behavior, pickups, audio, and lightweight learning moments without changing the core flight controls.

See [docs/GAME_SPEC.md](docs/GAME_SPEC.md) for the detailed product specification.

## Development

Requirements:

- Node.js 20+
- npm

Install and run:

```bash
npm ci
npm run dev
```

Open the local URL shown by Vite.

Windows note for this machine: its user-level npm configuration currently reports `script-shell=/bin/bash`, which is not present. Either remove that stale setting with `npm config delete script-shell`, or use a command-scoped override in PowerShell:

```powershell
$env:npm_config_script_shell='cmd.exe'
npm ci
npm test
npm run build
```

## Verification

```bash
npm test
npm run test:e2e
npm run build
```

- Vitest checks audio URL resolution and local player-state behavior.
- Playwright checks branding, world selection, the Play handoff, responsive navigation, artwork, and the placeholder game page.
- The production build is emitted to `dist/`.

## Static hosting

The Vite base is `./`, so the app works from a nested GitHub Pages path such as `username.github.io/hugo-go/`. The included GitHub Actions workflow tests, builds, and deploys `dist/` after updates to `main`.

## Code map

```text
index.html            home screen, flight placeholder, and shared overlays
src/main.ts           navigation and home-screen interaction controller
src/state.ts          small local player/settings state
src/worlds.ts         the six retained world themes
src/audio.ts          music and interface sounds
src/homeAssets.ts     fingerprinted home and world artwork
src/style.css         home presentation and placeholder game-page styling
tests/                unit and browser-level regression checks
docs/                 product, design, performance, and art guidance
```

The playable flight engine does not exist yet. It should be introduced as a focused module behind `#/game`, without reconnecting the removed strategy-game systems.
