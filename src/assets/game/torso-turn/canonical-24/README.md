# Canonical 24-view Hugo torso turn

- 24 individual transparent PNG files.
- `000` is front; angles increase clockwise viewed from above.
- `090` is Hugo's left profile, `180` is back, and `270` is his right profile.
- Every frame comes from one generated `6 x 4` atlas.
- Each runtime frame is `320 x 320` with a registered `260 px` alpha height.
- The collar socket is registered at `[160, 62]` in source-frame coordinates.
- `manifest.json` is the only playback and head-sync order.

The matching composite uses the same index from
`head-turn/canonical-24/manifest.json`, renders the head first, and renders the
torso second so the collar hides the base of the head asset's painted neck.
