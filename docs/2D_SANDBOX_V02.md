# HUGO GO! 2D Sandbox Version 02

Version 02 is the active character-art direction. Version 01 remains in the
Sandbox as an archive of the 3D rotation, layered rig, and early full-frame
animation experiments.

## Why the direction changed

The rotating 3D approximation demanded too many generated views and made it
easy for identity, anatomy, clothing, and registration to drift. Version 02
uses authored 2D drawings instead. It treats a character sheet as an efficient
generation and review format, then uses separate transparent PNGs in production.

The sheet itself is never a runtime dependency.

## Sheet-to-pose workflow

1. Define the exact pose list, order, outfit construction, character identity,
   camera language, and silhouette requirements before generation.
2. Generate one coherent fixed-layout character sheet for one outfit. Do not
   interleave poses from independently generated sheets.
3. Review every figure on the complete sheet for identity, anatomy, clothing,
   pose readability, wing construction, and the heel-mounted mini jets.
4. Remove the chroma background without erasing costume colours.
5. Isolate each complete connected silhouette. Use the authored row and column
   centres only to establish order; do not blindly crop equal rectangles when
   wide wings or tall flames extend beyond those theoretical cells.
6. Normalize every extracted figure to the same transparent canvas without
   stretching it.
7. Name the individual PNG with the character, direction version, outfit,
   source order, and pose slug.
8. Register the source bounds, centre, checksum, output bounds, and filename in
   a manifest.
9. Build animation only after the key poses are approved. Generate
   purpose-built in-betweens for a named transition rather than assuming a set
   of unrelated poses is already an animation.

## Version 02 naming

```text
hugo-2d-{outfit}-{NN}-{pose}.png
```

Examples:

```text
hugo-2d-skyline-01-neutral-front.png
hugo-2d-night-comet-05-level-glide.png
hugo-2d-sunrise-09-jet-boost.png
```

The number records sheet order. The slug records meaning. Renaming or reordering
an approved pose requires a manifest change.

## Approved V02 pose order

| Number | Pose |
| --- | --- |
| 01 | Neutral front |
| 02 | Ready profile |
| 03 | Sprint launch |
| 04 | Jump tuck |
| 05 | Level glide |
| 06 | Steep dive |
| 07 | Bank left |
| 08 | Bank right |
| 09 | Jet boost |
| 10 | Landing crouch |
| 11 | Braking flare |
| 12 | Hero finish |

## Current outfit studies

- **Skyline Flight Suit:** navy, cyan and teal with orange accents.
- **Night Comet Flight Suit:** midnight indigo, violet, electric cyan, silver,
  and restrained coral details.
- **Sunrise Flight Suit:** burnt orange, cream, gold, teal, and navy.

Every variation keeps Hugo's dark fauxhawk with closely shaved sides, the
wingsuit membrane, the same child proportions, and the mini jet modules built
into the heel/underside of both shoes.

## Animation standard from here

The 12-pose sets are a pose library, not a 12-frame loop. For a gameplay action:

- choose the key pose and the next gameplay state;
- plan anticipation, action, recovery, timing, spacing, arcs, and overlap;
- generate or draw only the missing in-betweens for that exact transition;
- keep the collision body independent of art deformation;
- validate the sequence at phone size and at its actual playback speed;
- for a loop, use a pixel-identical final bookend for seam validation and omit
  the duplicate endpoint at runtime.

Version 01's Disney-principles reference remains useful craft guidance. Its 3D
rotation and layered-rig asset strategy does not carry forward into Version 02.

## Files

- Source sheets: `art/source-images/game/2d-v02/`
- Individual production PNGs: `src/assets/game/2d-v02/{outfit}/poses/`
- Per-outfit manifests: `src/assets/game/2d-v02/{outfit}/manifest.json`
- Library manifest: `src/assets/game/2d-v02/manifest.json`
- QA contact sheets: `src/assets/game/2d-v02/qa/`
- Reproducible extractor: `scripts/2d_v02/extract_pose_sheets.py`
- Extractor dependencies: `scripts/2d_v02/requirements.txt`
