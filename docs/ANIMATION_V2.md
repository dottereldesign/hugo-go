# HUGO GO! Animation V2

## Principle

Frame count is not the quality target. Continuity, timing, spacing, and
readability are the quality targets.

Every animation must preserve Hugo's identity, anatomy, outfit, scale, camera,
registration point, and lighting while following a planned motion arc. A
sequence with fewer correct poses is preferable to a larger sequence containing
frozen limbs, weak in-betweens, duplicates, scale jumps, or costume drift.

## Mandatory loop bookend

Every generated **looping** animation sheet must begin and end on the exact
same image: the generated final frame must be pixel-identical to generated
frame 1. This proves that the motion can return cleanly to the opening pose.

The matching final frame is a generation and seam-validation bookend. Exclude
that duplicate from discrete runtime playback so the opening pose is not held
twice. Sandbox frame totals and durations describe runtime frames after that
duplicate is omitted. Non-looping actions must instead end on a pose that
transitions cleanly into the next gameplay state.

## The 12 animation principles in HUGO GO!

Frank Thomas and Ollie Johnston codified the principles in *The Illusion of
Life* from Disney studio practice. They are a durable motion vocabulary, not a
requirement to copy a Disney visual style. HUGO GO! applies them as follows:

1. **Squash and stretch:** compress on anticipation and impact, stretch during
   acceleration, and preserve apparent volume. Keep collision shapes
   independent from the deformed art.
2. **Anticipation:** use a compact crouch, tuck, eye-line, or counter-motion
   before the main action without making controls feel delayed.
3. **Staging:** make one action readable at phone size. Protect the silhouette
   from scenery, particles, fire, and merged limbs.
4. **Straight-ahead action and pose-to-pose:** lock gameplay contacts and
   extremes pose-to-pose; use freer straight-ahead motion for hair, jacket
   hems, and fire between those anchors.
5. **Follow-through and overlapping action:** lead with hips and torso; let
   jacket, hair, arms, and shoes arrive and settle on different frames.
6. **Slow in and slow out:** begin and end with close spacing, with ordered
   increasingly wider spacing through acceleration and the reverse through
   deceleration.
7. **Arcs:** chart head, hip, wrist, knee, ankle, and shoe paths. Break an arc
   only when a clear external force redirects the body.
8. **Secondary action:** hair, jacket, expression, and shoe fire support the
   primary action rather than competing with it.
9. **Timing:** decide duration and rhythm before frame count. Frame rate is only
   the sampling clock; it does not determine energy or smoothness.
10. **Exaggeration:** push tucks, tilts, hang time, recoil, and release enough
    to read instantly while preserving the game's internal physical rules.
11. **Solid posing:** preserve anatomy, perspective, balance, weight, volume,
    costume construction, and camera through every frame.
12. **Appeal:** keep Hugo's pose confident, friendly, specific, and readable.
    A stylish pose must still communicate the gameplay state.

Sources:

- Frank Thomas and Ollie Johnston, *The Illusion of Life*, listed by
  [Disney Books](https://books.disney.com/book-author/ollie-johnston/).
- John Lasseter, [*Principles of Traditional Animation Applied to 3D Computer
  Animation*](https://dl.acm.org/doi/10.1145/37402.37407),
  ACM SIGGRAPH, 1987.

## Timing, spacing, and energy

Timing is how long the action lasts. Spacing is how far the pose moves from one
drawing to the next. At a fixed 30 fps, even spacing looks mechanical; close
spacing at the ends and wider spacing through the middle creates an ease.

- **Acceleration:** each successive spacing grows until peak speed. It must not
  accidentally shrink before deceleration starts.
- **Fast action:** one large middle gap can communicate speed when the entry
  and exit poses are staged clearly. A missing drawing is not automatically a
  continuity error.
- **Frame deletion test:** A/B playback with questionable in-betweens disabled.
  Remove a drawing when it makes a spin or jump feel slow without improving the
  path or silhouette.
- **Impact exception:** do not ease through contact. Snap into the collision,
  show energy transfer, then use squash, recoil, and follow-through.
- **Settle:** after the primary body stops, allow a small overshoot and
  diminishing reversals in jacket, hair, and limbs. Avoid endless wobble.
- **Consistency:** physics can be exaggerated, but the same force, weight, and
  material should produce a recognizably consistent response.

## Production pipeline

1. **Lock the character.** Use one approved identity sheet with front, side,
   and three-quarter views, fixed proportions and palette, and documented
   pivots for chest, feet, exhaust ports, and collision silhouette.
2. **Write the motion map.** Identify anticipation, contact, extreme, passing,
   impact, recoil, settle, and loop-seam poses. Plot head, hips, hands, knees,
   and feet. No paired limb may remain frozen through locomotion.
3. **Chart timing and spacing.** Set duration first, then plot per-frame
   translation, rotation, and scale. Mark ease regions, the widest speed gaps,
   sharp contacts, overshoot, and settle.
4. **Choose the frame budget.** Add drawings only where the silhouette or
   secondary motion changes. A/B test questionable in-betweens in the Sandbox.
5. **Generate controlled groups.** Lock camera, scale, light, registration,
   cell dimensions, and character invariants. Overlap boundary poses when an
   action needs multiple generated sheets.
6. **Extract and normalize.** Generate on a removable chroma background,
   convert to alpha, despill edges, isolate every figure, and register each
   frame in an equal cell with safe transparent margins.
7. **Run continuity gates.** Reject extra or merged limbs, frozen anatomy,
   accidental spacing reversals, broken arcs, face or clothing drift, duplicate
   poses, clipping, halos, registration jumps, and visible loop seams.
8. **Review in the Sandbox.** Inspect at speed, paused, and frame-by-frame.
   Review collision silhouettes and transitions into the preceding and
   following gameplay states before promotion.

## Frame policy

Gameplay can render at 60 Hz while character animation samples a deliberate
30 fps timeline.

| Animation | Suggested source poses | Timing |
| --- | ---: | --- |
| Run | 18-24 | 30 fps, 0.8-1.0 second loop |
| Freefall / glide | 24-30 | 30 fps, 1 second loop |
| Jump / land | 10-14 | 30 fps, non-looping |
| Double jump | 12-18 | 30 fps, non-looping |
| Grind | 16-24 | 30 fps, 0.8-1.0 second loop |
| Impact / recovery | 8-12 key poses | variable holds, non-looping |
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
in-betweens, secondary movement, pivots, and repeatable exports. This prevents
missing limbs, frozen legs, costume drift, and random changes between frames.

## Layered-rig prototype (rejected V2)

The Sandbox now includes two deterministic examples that reuse the same
16-piece Hugo atlas. They remain visible as failure references, not approved
production animation:

- **Running V2:** a 30-frame, one-second cycle with opposing leg arcs, stable
  arms-back posture, hip bounce, and delayed hair, hood, and jacket tails.
- **Normal Jump V2:** a 36-frame, 1.2-second cycle with anticipation, takeoff,
  airborne tuck, apex, landing compression, and secondary settle.

The atlas contains one approved torso, head, hair, hood, near/far upper arms,
near/far forearms and hands, near/far thighs, near/far shins, near/far shoes,
and two jacket-tail layers. Code connects them as a hierarchy:

```text
hips
├── torso → neck → head → hair / hood
├── near thigh → knee → shin → ankle → shoe
├── far thigh → knee → shin → ankle → shoe
├── near shoulder → upper arm → elbow → forearm / hand
└── far shoulder → upper arm → elbow → forearm / hand
```

Reusing pixels prevented frame-to-frame identity drift, but it did not make the
parts rig-compatible. Visual review rejected both examples for six reasons:

1. the separately illustrated parts use inconsistent scale, thickness and
   perspective;
2. joint pivots were inferred from painted edges instead of authored sockets;
3. code bone lengths do not match the painted limb lengths;
4. upper and lower limb angles were posed independently;
5. the run had no planted-foot constraint; and
6. decorative overlaps hid rather than clarified the broken anatomy.

## Geometry-first V3 gate

Running V3 and Normal Jump V3 keep only Hugo's approved head artwork. The body
is intentionally rendered as a debug skeleton:

- cyan boxes and lines are the near-side limbs;
- violet boxes and lines are the far-side limbs;
- amber boxes and lines are the pelvis and torso;
- every rectangle is drawn directly between its two actual joint coordinates;
- knees and elbows use deterministic two-bone inverse kinematics; and
- run feet follow explicit alternating contact and swing paths.

The debug geometry is also the proposed collision geometry, so the display
cannot conceal a detached joint or disagree with the underlying rig. Painted
limbs may be attached only after the head, hip, hand and foot paths read
correctly at speed, at the extreme frames and through the loop seam.

## Walking V4: geometry, then skin

Walking V4 is the first side-by-side proof of the production workflow. Both
Sandbox cards evaluate the same 36-frame, 1.2-second pose function:

- the left card renders Hugo's head plus bones, hit rectangles and contact
  nodes;
- the right card renders generated clothing and body-part textures on those
  exact coordinates;
- neither card has its own timing, foot targets, joint angles or body path.

The walk uses a tall, slightly chest-proud hero posture with a stable eye-line
and relaxed opposing arm swing. Each foot spends 62% of the cycle in stance and
38% in swing. The stance path includes heel strike, flat support and toe-off;
the swing path lifts the ankle before easing into the next contact.

V4 adds explicit pelvis, lower-spine, chest, neck, ankle, heel and toe nodes.
The extra torso nodes make posture reviewable instead of hiding the body line
inside one rectangle. Heel and toe nodes make it possible to reject foot
sliding or a shoe that rolls through the floor.

Generated assets:

- `hugo-walk-v4-parts.png`: head, torso, near/far sleeves and hands, shoes and
  optional clothing pieces on a keyed 4-by-4 source atlas;
- `hugo-walk-v4-legs.png`: a corrective 2-by-2 atlas of straight near/far
  thighs and shins.

The first generated atlas's leg cells were rejected because they contained
pre-bent whole legs. A supplemental torso was also generated and tested, but
its oversized arm opening and separated open-jacket silhouette read worse on
the rig, so it remains a documented source experiment rather than runtime art.
The accepted torso comes from the primary V4 parts atlas.

Recommended V5 refinements:

1. generate small knee and elbow overlap caps that conceal texture seams
   without moving sockets;
2. author two relaxed-hand variants for forward and backward arm swing;
3. store source and destination pivots in asset metadata rather than code;
4. add delayed hair and jacket-hem bones only after the base gait is approved;
5. match the cycle's visual ground speed to gameplay metres per second before
   promoting it outside the Sandbox.

## Reusable atlas prompt

```text
Use case: stylized-concept
Asset type: production game character sprite atlas
Input image: approved Hugo identity, outfit, proportions, palette, and render reference
Primary request: create [FRAME COUNT] sequential frames for [ACTION], arranged
in a strict equal-cell [COLUMNS] by [ROWS] atlas, read left-to-right and then
top-to-bottom.
Motion: follow the supplied anticipation, contact, extreme, passing, impact,
recoil, settle, and seam map. Follow the supplied timing and spacing chart:
close spacing at intended eases, wider spacing through speed, sharp contact
where required, then recoil, overlap, and settle. Both arms and both legs must
follow complete natural arcs; no limb may remain frozen.
Invariants: lock face, anatomy, proportions, outfit, camera, viewing angle,
character scale, registration point, lighting, and rendering style.
Registration: one full-body Hugo per cell, aligned to the same pivot, with
generous safe padding. No body part crosses a cell boundary.
Backdrop: perfectly flat solid chroma-key color with no shadow, gradient,
texture, floor, grid, label, reflection, or lighting variation.
Avoid: extra, merged, or missing limbs; accidental spacing reversals; duplicate
poses; camera drift; scale changes; costume drift; clipping; motion blur; text;
watermark.
Loop only: generated frame 1 and the generated final frame must be
pixel-identical. Treat the final frame as a seam-validation bookend and omit it
from discrete runtime playback.
```

## Freefall V2 prototype

Freefall V2 uses the approved first 24 isolated alpha frames in a `6 x 4` atlas
with `320 x 256` cells, played at 30 fps for a `0.8`-second loop. The initial
sheet failed the safe-margin gate on its final row, so those six frames were
rejected. It remains a Sandbox prototype until its motion and seam are approved
for gameplay.

## Double Jump V2 prototype

Double Jump V2 is a non-looping `4 x 4` transparent atlas with 16 frames at
30 fps, lasting approximately `0.53` seconds:

- frames 1-4 use close spacing and increasing compression for airborne
  anticipation;
- frame 5 releases a strong squash-to-stretch impulse;
- frames 6-9 use wider spacing through the fastest corkscrew instead of
  sluggish extra in-betweens;
- frames 10-13 decelerate and open the silhouette;
- frames 14-16 ease into flight while jacket and hair settle behind the torso.

Because the action transitions into flight, its last drawing intentionally
differs from its first. The identical-bookend rule applies only to loops.

Sandbox edit mode is part of the approval workflow. A reviewer can mark any
numbered frame inactive; inactive frames turn red, remain available for manual
inspection, and are omitted from playback. The active set is saved locally per
animation; **Use all** clears the exclusions.
