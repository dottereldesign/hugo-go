# Runtime asset layout

```text
home/
  background/   home-screen illustrated background
  icons/        profile and quick-action artwork
  panels/       feature-card artwork
  worlds/       six home world cards
game/
  trail-ground.webp          generated transparent scrolling forestry trail
  hugo-run-60-cycle.webp     60 transparent run frames in a 10×6 atlas
  hugo-powered-cycle.webp    six powered-glide frames in a 3×2 atlas
  hugo-glide-cycle.webp      six unpowered glide/fall frames in a 3×2 atlas
  hugo-jump-land-cycle.webp  eight jump/landing frames in a 4×2 atlas
  hugo-double-jump-cycle.webp six double-jump frames in a 3×2 atlas
  hugo-double-jump-v2-cycle.png sixteen Double Jump V2 frames in a 4×4 alpha atlas
  hugo-freefall-v2-cycle.png twenty-four Freefall V2 frames in a 6×4 alpha atlas
  hugo-layered-rig-parts.png sixteen reusable Hugo puppet parts in a 4×4 alpha atlas
  hugo-wall-recovery-cycle.webp six wall-impact/recovery frames in a 3×2 atlas
ui/
  buttons/      shared interface controls
  frames/       modal framing
  textures/     interface textures
```

Full generated gameplay sources belong in `art/source-images/game/`, not in the runtime tree. Rebuild the compressed Hugo sprites with:

```bash
python scripts/process_game_assets.py
```

The flat blue sky, seasonal particles, generated trail, and red obstacle rendering live in `src/game/FlightGame.ts`; deterministic collision bounds and wall recovery live in `src/game/engine.ts`.
