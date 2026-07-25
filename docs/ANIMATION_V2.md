# HUGO GO! Animation V2

## Principle

Frame count is not the quality target. Continuity is the quality target.

Every animation must preserve Hugo's identity, anatomy, outfit, scale, camera,
registration point, and lighting while following a planned motion arc. A
sequence with fewer correct poses is preferable to a larger sequence containing
frozen limbs, duplicates, missing in-betweens, scale jumps, or costume drift.

## Production pipeline

1. **Lock the character.** Use one approved identity sheet with front, side,
   and three-quarter views; fixed proportions and palette; and separately
   documented pivots for the chest, feet, shoe exhaust ports, and collision
   silhouette.
2. **Write the motion map.** Identify contact, extreme, passing, recoil, and
   loop-seam poses. Document the path of both hands and both feet. No paired
   limb may remain frozen through a locomotion cycle.
3. **Choose the frame budget.** Set the playback rate and duration first. Add
   unique drawings only where the silhouette or secondary motion changes.
4. **Generate controlled groups.** Keep the camera, scale, light, registration,
   cell dimensions, and character invariants locked. Use overlapping boundary
   poses when an animation requires more than one generated sheet.
5. **Extract and normalize.** Generate on a flat removable chroma background,
   convert it to alpha, despill edges, isolate every character, and place every
   frame in an equal cell around the same pivot with safe transparent margins.
6. **Run continuity gates.** Reject extra or merged limbs, frozen anatomy,
   reversed or broken foot paths, face drift, clothing changes, duplicates,
   clipping, halos, registration jumps, and a visible loop seam.
7. **Review in the Sandbox.** Inspect the sequence at speed, paused, and one
   numbered frame at a time. Check its transition from the preceding animation
   and into the following animation before promoting it to gameplay.

## Frame policy

All gameplay can render at 60 Hz while character animation samples a deliberate
30 fps timeline.

| Animation | Suggested source poses | Timing |
| --- | ---: | --- |
| Run | 18–24 | 30 fps, 0.8–1.0 second loop |
| Freefall / glide | 24–30 | 30 fps, 1 second loop |
| Jump / land | 10–14 | 30 fps, non-looping |
| Double jump | 12–18 | 30 fps, non-looping |
| Grind | 16–24 | 30 fps, 0.8–1.0 second loop |
| Impact / recovery | 8–12 key poses | variable holds, non-looping |
| Shoe fire | 30 | 30 fps, 1 second loop |

## Recommended long-term authoring setup

Keep transparent sprite atlases as the review and runtime export format, but
author motion through a layered Hugo rig:

- head, face, and hair;
- jacket, shirt, and torso;
- upper and lower arms plus hands;
- thighs, calves, and shoes;
- separate jacket hems, hair tufts, and shoe-fire effects.

AI image generation should supply identity-locked texture art, key poses, and
cleanup references. A deterministic 2D bone/deform rig should produce
in-betweens, secondary jacket and hair movement, pivots, and repeatable exports.
That makes locomotion mechanically correct and prevents anatomy from changing
between frames.

## Reusable atlas prompt

```text
Use case: stylized-concept
Asset type: production game character sprite atlas
Input image: approved Hugo identity, outfit, proportions, palette, and render reference
Primary request: create [FRAME COUNT] sequential frames for [ACTION], arranged
in a strict equal-cell [COLUMNS] by [ROWS] atlas, read left-to-right and then
top-to-bottom.
Motion: follow the supplied contact, extreme, passing, recoil, and seam pose
map. Use small ordered changes between neighboring frames. Both arms and both
legs must follow complete natural arcs; no limb may remain frozen.
Invariants: lock face, anatomy, body proportions, outfit, camera, viewing
angle, character scale, center point, lighting, and rendering style.
Registration: one full-body Hugo per cell, aligned to the same pivot, with
generous safe padding. No body part crosses a cell boundary.
Backdrop: perfectly flat solid chroma-key color with no shadow, gradient,
texture, floor, grid, label, reflection, or lighting variation.
Avoid: extra, merged, or missing limbs; duplicate frames; pose jumps; camera
drift; scale changes; costume drift; clipping; motion blur; text; watermark.
Loop: the final pose must transition smoothly into the first pose.
```

## Freefall V2 prototype

The Sandbox prototype uses the approved first 24 isolated alpha frames in a
`6 × 4` atlas with `320 × 256` cells, played at 30 fps for a `0.8`-second loop. Hugo keeps his
existing outfit while adopting a forward-descending wingsuit-style posture.
The generated poses use subtle arm, knee, ankle, hair, and jacket changes.

The initial generated sheet failed the safe-margin gate on its final row. Those
six frames were rejected, leaving the clean first 24 characters detected from
their alpha silhouettes and registered into an atlas with verified transparent
margins. Freefall V2 remains a Sandbox prototype until its motion and seam are
approved for gameplay.

Sandbox edit mode is part of the approval workflow. A reviewer can mark any
numbered frame inactive; inactive frames turn red, remain available for manual
inspection, and are omitted from playback and loop traversal. The final active
set can therefore be evaluated before the source atlas is edited permanently.
The active set is saved locally per animation so the review survives a refresh;
**Use all** clears the exclusions for that animation.
