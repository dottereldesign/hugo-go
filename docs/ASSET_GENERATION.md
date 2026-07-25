# Gameplay asset generation and processing

## Current generated assets

The playable release uses eight Hugo animation atlases, one 30-frame jet-flame atlas,
and one transparent forestry-trail strip. Full generation and alpha sources are retained:

```text
art/source-images/game/hugo-run-sheet-magenta.png
art/source-images/game/hugo-run-sheet-transparent.png
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
src/assets/game/hugo-run-cycle.webp
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

1. detects occupied sheet rows and two poses per source row;
2. extracts each generated full body without hard-coded source coordinates;
3. normalizes every pose to a `384 × 320` cell;
4. writes the run sheet as a `1536 × 640` exact-alpha WebP atlas;
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

- eight-frame run atlas: 167 KB;
- six-frame powered-glide atlas: 111 KB;
- six-frame unpowered glide/fall atlas: 119 KB;
- six-frame freefall atlas: 118 KB;
- eight-frame jump/landing atlas: 140 KB;
- six-frame double-jump atlas: 120 KB;
- six-frame wall-impact/recovery atlas: 100 KB;
- 30-frame side-profile grind atlas: 366 KB;
- 30-frame jet-flame atlas: 132 KB;
- scrolling trail strip: 64 KB.

The old single flight pose, single-pose run WebP, six-frame transition sheet, and full-screen
Forest plate are retired from runtime. The game now has 76 authored character frames
plus 30 authored jet-flame frames. The wall-splat atlas replaces its two camera-facing
wobble frames with generated strict side-profile poses. The grind atlas uses 30 authored
side-profile in-betweens at 30 fps, with one shoe leading and one trailing; both outer
sole edges share the normalized contact baseline. Runtime rendering rotates that baseline
to the quadratic cable tangent. Every powered and glide frame records the two measured
metal heel-port coordinates in source-atlas pixels, preventing normalized anchor drift as
Hugo moves his feet. The same flame atlas is reused by both shoes with a 13-frame offset,
while code retains thrust-responsive scale, opacity, and glow.

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
