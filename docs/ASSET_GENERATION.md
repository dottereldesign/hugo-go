# Gameplay asset generation and processing

## Current generated assets

The playable release uses eight Hugo animation atlases, one 30-frame jet-flame atlas,
and one transparent forestry-trail strip. Full generation and alpha sources are retained:

```text
art/source-images/game/hugo-run-sheet-magenta.png
art/source-images/game/hugo-run-sheet-transparent.png
art/source-images/game/hugo-run-60-frames-01-10-magenta.png
art/source-images/game/hugo-run-60-frames-01-10-transparent.png
art/source-images/game/hugo-run-60-frames-11-20-magenta.png
art/source-images/game/hugo-run-60-frames-11-20-transparent.png
art/source-images/game/hugo-run-60-frames-21-30-magenta.png
art/source-images/game/hugo-run-60-frames-21-30-transparent.png
art/source-images/game/hugo-run-60-frames-31-40-magenta.png
art/source-images/game/hugo-run-60-frames-31-40-transparent.png
art/source-images/game/hugo-run-60-frames-41-50-magenta.png
art/source-images/game/hugo-run-60-frames-41-50-transparent.png
art/source-images/game/hugo-run-60-frames-51-60-magenta.png
art/source-images/game/hugo-run-60-frames-51-60-transparent.png
art/source-images/game/hugo-powered-sheet-magenta.png
art/source-images/game/hugo-powered-sheet-transparent.png
art/source-images/game/hugo-glide-sheet-magenta.png
art/source-images/game/hugo-glide-sheet-transparent.png
art/source-images/game/hugo-freefall-sheet-magenta.png
art/source-images/game/hugo-freefall-sheet-transparent.png
art/source-images/game/hugo-jump-land-sheet-magenta.png
art/source-images/game/hugo-jump-land-sheet-transparent.png
art/source-images/game/hugo-double-jump-sheet-magenta.png
art/source-images/game/hugo-double-jump-sheet-transparent.png
art/source-images/game/hugo-wall-recovery-sheet-magenta.png
art/source-images/game/hugo-wall-recovery-sheet-transparent.png
art/source-images/game/hugo-grind-frames-01-10-magenta.png
art/source-images/game/hugo-grind-frames-01-10-transparent.png
art/source-images/game/hugo-grind-frames-11-20-magenta.png
art/source-images/game/hugo-grind-frames-11-20-transparent.png
art/source-images/game/hugo-grind-frames-21-30-magenta.png
art/source-images/game/hugo-grind-frames-21-30-transparent.png
art/source-images/game/jet-flame-frames-01-10-green.png
art/source-images/game/jet-flame-frames-01-10-transparent.png
art/source-images/game/jet-flame-frames-11-20-green.png
art/source-images/game/jet-flame-frames-11-20-transparent.png
art/source-images/game/jet-flame-frames-21-30-green.png
art/source-images/game/jet-flame-frames-21-30-transparent.png
art/source-images/game/trail-ground-magenta.png
art/source-images/game/trail-ground-transparent.png
src/assets/game/hugo-run-60-cycle.webp
src/assets/game/hugo-powered-cycle.webp
src/assets/game/hugo-glide-cycle.webp
src/assets/game/hugo-freefall-cycle.webp
src/assets/game/hugo-jump-land-cycle.webp
src/assets/game/hugo-double-jump-cycle.webp
src/assets/game/hugo-wall-recovery-cycle.webp
src/assets/game/hugo-grind-cycle.webp
src/assets/game/jet-flame-cycle.webp
src/assets/game/trail-ground.webp
```

The exact prompts are recorded in `art/source-images/game/PROMPTS.md`.

Gameplay now promotes the 24-frame Freefall V2 and 16-frame Double Jump V2
atlases. The Sandbox retains both V2 animations alongside their legacy versions
for review:

```text
art/source-images/game/hugo-double-jump-v2-sheet-magenta.png
art/source-images/game/hugo-double-jump-v2-sheet-transparent.png
src/assets/game/hugo-double-jump-v2-cycle.png
src/assets/game/hugo-freefall-v2-cycle.png
```

Double Jump V2 is a non-looping `4 × 4` atlas with `384 × 320` cells. The
source matte was removed, all 16 full-body connected components were verified,
and each pose was extracted and registered without crossing a cell boundary.

The layered-rig prototype uses one generated `4 × 4` puppet-part atlas:

```text
art/source-images/game/hugo-layered-rig-parts-magenta.png
art/source-images/game/hugo-layered-rig-parts-transparent.png
src/assets/game/hugo-layered-rig-parts.png
```

Each normalized cell is `320 × 320`. The same torso, head, hair, hood, limb
segments, shoes, and jacket tails are assembled by deterministic canvas
transforms for both Running V2 and Normal Jump V2.

The head-only 360-degree experiment adds one generated review source and one
processed Sandbox atlas:

```text
art/source-images/game/hugo-head-turn-source.png
src/assets/game/hugo-head-turn-cycle.png
```

The accepted source is a strict `6 x 4` atlas. Chroma removal uses the same
soft-matte/despill settings documented below. Its 24 unique `256 x 256` views
are packed into a `5 x 5`, `1280 x 1280` exact-alpha PNG, followed by a 25th
seam-validation cell that is a deterministic pixel copy of the first. The two
Sandbox cards play only the 24 evenly spaced views for `0.8` seconds at 30 fps;
the stored bookend proves the loop seam without adding a repeated-frame pause.

## Processing pipeline

The generated poses use a flat magenta background. It is removed with the image-generation skill’s chroma-key helper using:

```text
--auto-key border
--soft-matte
--transparent-threshold 12
--opaque-threshold 220
--despill
```

`scripts/process_game_assets.py` then:

1. detects occupied legacy-sheet rows and two poses per source row;
2. extracts each generated full body without hard-coded source coordinates;
3. extracts six strict `5 × 2` run sheets, verifies 60 complete, distinct, stable-scale
   poses and every adjacent sheet/loop seam, normalizes them to `192 × 168` cells, and
   writes a `1920 × 1008` exact-alpha WebP atlas;
4. normalizes the other character poses to a `384 × 320` cell;
5. writes each six-frame flight sheet as a `1152 × 640` exact-alpha WebP atlas;
6. writes the eight-frame jump/landing sheet as a `1536 × 640` exact-alpha WebP atlas;
7. crops and compresses the transparent trail to a `1024 × 200` exact-alpha WebP;
8. extracts the three strict `5 × 2` flame sheets, verifies 30 distinct and consistently
   aligned cells, normalizes each to `96 × 160`, and writes a `960 × 480` exact-alpha
   WebP atlas;
9. extracts the three corrected side-profile `5 × 2` grind sheets, verifies 30 complete
   distinct poses and stable scale, aligns every shoe-edge baseline in a `224 × 196`
   cell, and writes a near-square `1120 × 1176` exact-alpha WebP atlas.

Current runtime sizes are approximately:

- 60-frame run atlas: 541 KB;
- six-frame powered-glide atlas: 111 KB;
- six-frame unpowered glide/fall atlas: 119 KB;
- 24-frame Freefall V2 atlas: 987 KB;
- eight-frame jump/landing atlas: 140 KB;
- 16-frame Double Jump V2 atlas: 1,194 KB;
- six-frame wall-impact/recovery atlas: 100 KB;
- 30-frame side-profile grind atlas: 366 KB;
- 30-frame jet-flame atlas: 132 KB;
- Walking V4 modular-parts atlas: 692 KB;
- Walking V4 corrective straight-leg atlas: 481 KB;
- Walking V5 side-profile torso: 752 KB;
- 24-view head-turn review atlas plus seam bookend: 1,716 KB;
- scrolling trail strip: 64 KB.

The old single flight pose, single-pose run WebP, six-frame transition sheet, and full-screen
Forest plate are retired from runtime. Live gameplay now uses 156 authored character
frames plus 30 authored jet-flame frames. Including the legacy freefall and double-jump
comparisons in the Sandbox, the repository contains 168 full-body frames. The wall-splat atlas replaces its two camera-facing
wobble frames with generated strict side-profile poses. The grind atlas uses 30 authored
side-profile in-betweens at 30 fps, with one shoe leading and one trailing; both outer
sole edges share the normalized contact baseline. The run atlas plays one distinct pose
at 30 authored poses per second, with two code-normalized seven-pixel stride arcs that meet
the ground without a seam hitch. Runtime rendering rotates the grind baseline
to the quadratic cable tangent. Every powered and glide frame records the two measured
metal heel-port coordinates in source-atlas pixels, preventing normalized anchor drift as
Hugo moves his feet. The same flame atlas is reused by both shoes with a 13-frame offset,
while code retains thrust-responsive scale, opacity, and glow.

Walking V5 deliberately reuses the accepted V4 head, arm, leg, hand and shoe
sources and promotes the previously generated side-profile torso. It does not
add generated in-between frames: one deterministic 36-frame skeleton drives
both the debug and painted previews. The interactive Sandbox limb sheet records
the public part IDs and source socket paths used to register those images.

Walking V6 also adds no generated bitmap. It divides each accepted forearm
source into separately registered forearm and hand crops, moves both shoe ankle
anchors into the visible openings, and uses code-driven shoulder, elbow, wrist,
hand, hip, knee, ankle, heel, and toe joints. The public asset names are
left/right (`left-hand`, `right-shoe`, and so on); render-order terminology is
kept internal. Fixed left/right elbow bend branches prevent the limb art from
changing direction as a wrist crosses its shoulder.

## Generated and procedural scene art

The sky is a code-rendered cyan gradient. Generated ochre/scorched-red earth, stones,
roots, grass, and fern tips come from the transparent trail strip, and generated jet
flames are composited at the measured heel ports. Coins, seasonal particles, flame glow,
solid red obstacles, and the two-post drooping wire remain Canvas drawings. The wire is
code-native because its rendered quadratic curve must exactly match the landing surface
and the character tangent. This is deliberate:

- collision silhouettes remain tied to the same rectangles the player sees;
- the wide trail can scroll without an obvious repeated motif inside one viewport;
- the portrait layout scales cleanly;
- color and motion can be adjusted without regenerating artwork.

Do not replace an obstacle with art whose visible silhouette is smaller than its collision bounds. If authored obstacle art is added, record per-sprite collision insets and test every edge.

## Character direction

Hugo should stay consistent with the current source:

- 10-year-old Japanese/New Zealand boy;
- natural, non-caricatured facial features;
- chunky wind-swept dark hair that keys cleanly;
- teal flight jacket, cream shirt, navy shorts/leggings;
- white and teal sneakers with compact heel/sole jets;
- subtle silver fern leaf badge and red circular badge;
- no ethnic stereotype, exaggerated eye treatment, costume shorthand, weapon, or franchise-specific design.

## Cultural guardrails

New Zealand and Japanese nature cues are welcome. Do not generate or introduce Māori patterns or motifs. Avoid a generic “Asian” visual category; prompts should describe Hugo as the same specific child and preserve his established identity.

Optional future generation is specified in `docs/ART_BACKLOG.md`. No required playable asset is missing from the current Forest release.
