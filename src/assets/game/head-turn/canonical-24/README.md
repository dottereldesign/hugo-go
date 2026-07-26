# Canonical 24-view Hugo head turn

This is the approved, directly extracted head-turn set.

- `000` is front-facing.
- Angles increase clockwise when Hugo is viewed from above.
- Every next file advances 15 degrees.
- `090` is Hugo's left profile.
- `180` is the exact back.
- `270` is Hugo's right profile.
- `345` loops directly to `000`.

Each PNG is a separate `320 x 320` transparent file containing one registered
head. The app reads playback order from `manifest.json`; it does not slice a
sheet or infer order from filesystem enumeration.

The source contains 24 valid unique views, so the canonical set remains 24
views. No generated in-between or optical-flow frame is mixed into this
folder merely to reach an arbitrary frame count.
