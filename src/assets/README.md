# Runtime asset layout

Only artwork imported by the application belongs under `src/assets`.

```text
home/
  background/   home and placeholder backdrop
  icons/        profile and quick-action art
  panels/       event and crew feature cards
  worlds/       six world-selection cards
ui/
  buttons/      shared modal controls
  frames/       decorative panel frames
  textures/     reusable interface textures
```

The future playable flight game should use a new `flight/` tree for Hugo, obstacles, pickups, effects, and parallax backgrounds. Do not mix those assets into the home-screen folders.

Source-quality generations and visual references stay in the repository-level `art/` directory and are not bundled by Vite.
