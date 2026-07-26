# Canonical 48-view paired-midpoint Hugo head turn

This is a derivative 60 FPS review loop built beneath the approved 24-view
rotation. It does not replace or modify `canonical-24`.

- The 24 whole-degree anchors (`000`, `015`, ... `345`) are copied
  byte-for-byte from `canonical-24`.
- Each half-degree frame (`007p5`, `022p5`, ... `352p5`) was generated from
  exactly its two adjacent approved anchors.
- Every frame is an individual `320 x 320` transparent PNG.
- `manifest.json` is the only source of playback order.
- Runtime never slices a sheet or infers order from directory enumeration.
- `000` is front, angles increase clockwise viewed from above, `090` is
  Hugo's left profile, `180` is back, and `270` is Hugo's right profile.

The sequence contains 48 distinct views at 7.5-degree steps. Played at 60 FPS,
one complete rotation lasts 0.80 seconds. “60 FPS” is the playback rate; it
does not require 60 unique frames for a 0.80-second loop.

Generated midpoint sources and the QA contact sheet live in
`art/source-images/game/head-turn/canonical-48/`. The contact sheet is review
material only and is never used by the application.
