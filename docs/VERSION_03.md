# HUGO GO! — Version 03

Version 03 is the active character-pose direction. Earlier project notes are
archived as Version 01 material and are not instructions for new art.

## Canonical character

Outfit 03 / Sunrise remains Hugo's canonical identity and outfit:

- friendly ten-year-old Japanese/New Zealand boy;
- dark fauxhawk with closely shaved sides;
- burnt-orange and cream wingsuit with gold membranes;
- teal engineering details and dark knee protection; and
- compact twin jet outlets integrated into the shoes.

The twelve existing Sunrise poses remain the canonical general pose library.
Version 03 adds a dedicated side-profile library for readable gameplay motion.

## Character-sheet format — mandatory

Every new HUGO GO! character sheet must contain:

- exactly **4 columns**;
- exactly **3 rows**;
- no more than **12 poses total**;
- one complete figure centred inside each equal cell;
- generous empty padding around hair, hands, wings, shoes, soles, and flames;
- no artwork crossing or touching a cell boundary; and
- a flat removable chroma background before alpha extraction.

Do not generate four or more rows. Do not generate more than four columns.
Previous denser sheets caused cropped heads, legs, shoes, and fragments from
neighbouring cells to leak into extracted frames.

## Version 03 side-profile library

All twelve poses face screen-right and use the new black sculpted basketball
shoe shape supplied for this version:

1. Neutral side
2. Confident walk
3. Fast sprint
4. Sprint launch
5. Jump takeoff
6. Jump tuck
7. Level glide
8. Steep dive
9. Jet boost
10. Braking flare
11. Landing crouch
12. Hero finish

Source sheets live under `art/source-images/game/2d-v03/`. Individually
extracted production PNGs live under `src/assets/game/2d-v03/`.

## Version 03 animation rule

Keep idle animation deliberately restrained. Once the complete poses have been
generated, keep each pose intact. Never freeze the body by compositing isolated
moving regions over a different base drawing:

1. Generate no more than 12 drawings on a sheet.
2. Extract every drawing to an individual transparent PNG.
3. Remove chroma spill from each complete figure.
4. Register each complete figure to one consistent whole-body anchor.
5. Keep every generated figure in sheet and cell order.
6. Never cut up, interleave, reverse, or mask the drawings unless Jamie asks.
7. End with an exact copy of the opening pose as a review-only loop bookend.

### Neutral Side head nod 03

Neutral Side 03 is the approved Version 03 animation. It uses four complete
canonically coloured Outfit 03 Sunrise drawings and plays this exact 6-step
sequence at 6 FPS over exactly 1 second at `1.00×`:
`1, 2, 3, 4, 3, 2`. The numbered buttons show
the source drawing used by each runtime step and pause the loop on selection.

The earlier Groove Idle and 12-frame Head Nod experiments remain archived as
source material, but they are not displayed or bundled in the active Version
03 animation library.

### Music reference

Version 03 includes the `Sleepy.mp3` reference track imported from the sibling
`dottereldesign/jetpack_beats` repository. Its fixed Play/Pause and Restart
controls sit 16 px from the bottom-right safe area. Sleepy loops on this page,
stops when the page closes, and cannot overlap the normal Hugo Go background
music.

Each Version 03 animation also has an independent playback-speed dial from
`0.10×` to `2.00×`. Its live readout shows the multiplier, effective FPS, and
resulting loop duration, and the selected speed is remembered per animation.
