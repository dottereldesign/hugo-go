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
