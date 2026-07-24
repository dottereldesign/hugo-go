# Runtime asset layout

```text
home/
  background/   home-screen illustrated background
  icons/        profile and quick-action artwork
  panels/       feature-card artwork
  worlds/       six home world cards
game/
  forest-season-base.webp  generated season-neutral Forest background
  hugo-run-cycle.webp        eight transparent run frames in a 4×2 atlas
  hugo-powered-cycle.webp    six powered-glide frames in a 3×2 atlas
  hugo-glide-cycle.webp      six unpowered glide/fall frames in a 3×2 atlas
  hugo-transition-cycle.webp six takeoff/landing frames in a 3×2 atlas
ui/
  buttons/      shared interface controls
  frames/       modal framing
  textures/     interface textures
```

Full generated gameplay sources belong in `art/source-images/game/`, not in the runtime tree. Rebuild the compressed Hugo sprites with:

```bash
python scripts/process_game_assets.py
```

Canvas scenery and obstacle rendering live in `src/game/FlightGame.ts`; deterministic collision bounds live in `src/game/engine.ts`.
