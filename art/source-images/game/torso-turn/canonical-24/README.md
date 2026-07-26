# Torso Turn source atlas

This folder preserves the accepted one-generation torso atlas and its review
outputs.

- `hugo-torso-yaw-cw-24-magenta.png`: accepted built-in generated source.
- `hugo-torso-yaw-cw-24-transparent.png`: accepted local alpha conversion.
- `qa-contact-sheet.png`: registered torso-only review.
- `qa-head-torso-contact-sheet.png`: same-degree head and torso composite
  review.
- `qa-runtime-cardinal-composite.png`: browser-rendered front, left profile,
  back, and right profile neck/collar registration check.

The first generated draft was rejected for returning seven columns. The
accepted source is exactly six columns by four rows. Runtime never reads these
sheet files; it reads the individual frames and manifest under
`src/assets/game/torso-turn/canonical-24/`.
