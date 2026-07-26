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

Keep idle animation deliberately restrained by asking the generation for only
two or three small actions. Once the complete poses have been generated, keep
each pose intact. Never freeze the body by compositing isolated moving regions
over a different base drawing:

1. Generate exactly 12 drawings on a 4 × 3 sheet.
2. Extract every drawing to an individual transparent PNG.
3. Remove chroma spill from each complete figure.
4. Register each complete figure to one consistent whole-body anchor.
5. Keep every generated figure in sheet and cell order.
6. Never cut up, interleave, reverse, or mask the drawings unless Jamie asks.
7. End with an exact copy of the opening pose as a review-only loop bookend.

The Neutral Side groove moves only Hugo's head, front hand, and front shoe.
That restraint comes from the generated drawings themselves—not from an
overlay. Its runtime uses all 24 complete characters at 18 FPS: Sheet A cells
1–12 followed by Sheet B cells 1–12. Only whole-figure chroma cleanup, uniform
scale, and torso-anchor translation are allowed. Frame 25 is an exact copy of
frame 01 for seam review and is not played at runtime.

### Neutral Side head nod

The second animation is a single 12-drawing sheet played at 12 FPS:

- frames 1–6 move the head from neutral to the lowest nod;
- frames 7–12 bring the head back to neutral;
- the full character is redrawn and retained in every frame;
- only the generated head angle should change; and
- production may clean chroma and register the complete figure, but may not
  rotate the head in code or composite it over a frozen body.
