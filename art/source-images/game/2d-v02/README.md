# 2D Sandbox Version 02 source sheets

These are generation and review sources. The application displays individually
extracted transparent PNGs from `src/assets/game/2d-v02/`; it does not slice
these sheets at runtime.

## Generation mode and references

- Mode: built-in ImageGen
- Asset type: polished 2D cel-shaded game character sheet
- Identity references:
  - `art/source-images/game/hugo-flight-transparent.png`
  - `src/assets/game/head-turn/canonical-24/frames/hugo-head-yaw-cw-000-front.png`
  - `src/assets/game/hugo-freefall-v2-cycle.png`
- Background: flat magenta chroma key for deterministic local removal
- Layout: exactly four columns by three rows, read left-to-right and top-to-bottom

## Shared pose prompt

Create exactly one coherent 4 × 3 character sheet containing 12 separate
full-body drawings of the same Hugo: neutral front, confident ready side
profile, forward sprint launch, airborne jump tuck, level wingsuit glide, steep
dive, bank left, rear three-quarter bank right, vertical shoe-jet boost, landing
crouch, braking flare, and confident hero finish.

Hugo is the same friendly 10-year-old Japanese/New Zealand boy from the
references. Preserve his face and child proportions without stereotypes or
cultural costume motifs. Give him dark textured hair with closely shaved sides
and a neat swept fauxhawk. Use a functional full-body wingsuit with fabric
membranes between arms and torso/legs. Keep compact mini-jet modules integrated
into the heel/underside of both shoes in every pose. Only the jet-boost pose has
active orange-yellow flames, aligned directly beneath the two heel outlets.

Use polished hand-drawn 2D animation art: clean confident ink lines, controlled
cel shading, readable phone-size silhouettes, stable identity, stable costume,
and no 3D-render look. Place one complete isolated figure in every position on
a perfectly flat magenta background. No labels, grid lines, scenery, shadows,
watermarks, cropped anatomy, duplicated figures, extra limbs, or overlapping
poses.

## Outfit variations

1. **Skyline:** deep navy base, bright cyan/teal wing membranes, cream chest,
   and restrained orange engineering accents.
2. **Night Comet:** midnight indigo base, violet panels, electric cyan wing
   membranes, silver shoulder/chest protection, and small coral details.
3. **Sunrise:** burnt-orange base, warm cream chest, golden-yellow wing
   membranes, teal piping, and navy protective details.

Outfit 03 / Sunrise is now the canonical V02 Hugo. New animation sheets use its
neutral-front or ready-profile drawing as the identity, scale, construction,
and colour reference.

The second and third sheets used the approved Skyline sheet as an additional
layout/pose reference. They were instructed to preserve the same 12 poses,
scale rhythm, rendering language, facial identity, fauxhawk, wingsuit
construction, and shoe-jet placement while changing only the outfit design.

## Chroma removal

The ImageGen chroma helper produced the transparent review sheets with automatic
border-key sampling, a soft matte, spill cleanup, and edge contraction `1`:

- Skyline: transparent threshold `12`, opaque threshold `220`
- Night Comet: transparent threshold `12`, opaque threshold `160`
- Sunrise: transparent threshold `12`, opaque threshold `220`

Night Comet uses the lower opaque threshold to preserve its violet costume
panels. The first hard-tolerance pass was rejected during page-level visual QA
because it left a fine magenta fringe around hair and wing edges.

## Extraction

Run:

```powershell
python -m pip install -r scripts\2d_v02\requirements.txt
python scripts\2d_v02\extract_pose_sheets.py
```

The extractor detects exactly 12 complete silhouettes per source, sorts them by
their authored 4 × 3 centres, preserves wide wings and tall flames, and writes
36 separately named 512 × 512 transparent PNGs plus manifests and QA contact
sheets.

## Outfit 03 animation sources

The `animations/` directory contains two sequential 4 × 3 sheets for each
animation. Sheet A and sheet B are chronological sections of one performance;
they must never be interleaved with other generations.

- `neutral-idle/`: bored toe tap, gum bubble, splat, wipe, and settle.
- `ready-profile/`: heel-jet check, accidental hover, landing, and settle.

The transparent neutral-idle sheets use a protected-colour restoration pass.
The normal spill cleanup removes the magenta background cleanly, while
`restore_protected_pink.py` restores the intentional candy-pink gum from a
no-despill matte.

Run the animation extraction after the transparent sheets are approved:

```powershell
python scripts\2d_v02\extract_animation_sheets.py
```

This produces 24 named 640 × 640 PNGs per loop. Frame 01 is the existing
canonical Outfit 03 pose; frames 02–23 are the approved generated progression;
frame 24 is a byte-for-byte copy of frame 01 for seam review and is excluded
from runtime playback.
