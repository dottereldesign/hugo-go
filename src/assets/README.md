# Runtime asset layout

```text
home/
  background/   home-screen illustrated background
  icons/        profile and quick-action artwork
  panels/       feature-card artwork
  worlds/       six home world cards
game/
  hugo-flight.webp   transparent airborne shoe-jet pose
  hugo-run.webp      transparent grounded sprint pose
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
