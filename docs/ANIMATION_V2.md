# HUGO GO! Animation V2

> **ARCHIVED VERSION 01 MATERIAL — DO NOT USE FOR NEW WORK.**
> The active direction is [`VERSION_03.md`](./VERSION_03.md).

> **Sandbox Version 01:** this document records the earlier 3D rotation,
> layered-rig, and full-frame animation experiments. The active 2D production
> direction is documented in
> [`2D_SANDBOX_V02.md`](./2D_SANDBOX_V02.md). The animation principles below
> remain useful; the Version 01 asset-construction strategy is archived.

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
5. **Generate controlled sheets.** For every new rotating body part or action,
   generate one coherent fixed-grid atlas before creating runtime files. Lock
   camera, scale, light, registration, cell dimensions, angle order, and
   character invariants. Do not spend one independent generation on every
   angle. Overlap boundary poses only when one action genuinely needs more
   than one sheet.
6. **Extract and normalize.** Generate on a removable chroma background,
   convert to alpha, isolate every connected figure, cut the approved sheet
   into individual files, and register each frame to equal dimensions and a
   fixed pivot with safe transparent margins. Runtime consumes the files and
   manifest, never the source sheet.
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

## Sheet-first body-part rotation rule

The default authoring unit for a new rotating head, torso, arm, hand, shoe, or
other painted part is **one coherent character sheet**. Generate the complete
angle set together on a strict grid, then:

1. review the sheet row-major as one continuous rotation;
2. reject the whole sheet if its direction reverses, count is wrong, identity
   changes, or any figure overlaps its neighbour;
3. remove the chroma background without damaging costume colours;
4. find and isolate every connected silhouette;
5. save every accepted view as its own degree-named transparent PNG;
6. normalize scale, pivot, alpha height, and safe gutters; and
7. write a manifest containing source cell, degrees, checksum, sockets, and
   playback order.

This gives generation the shared visual context needed for consistent costume,
materials, camera and lighting, while individual runtime files remain easy to
inspect, replace, diff, cache and address by degree. Uneven outer sheet margins
must not be mistaken for a different grid: extraction may locate connected
figures, but it must still find exactly the requested count in the requested
row and angle order.

Generating one image per angle is not the normal workflow. Pair-specific
generation remains a narrow repair/derivative tool for an already approved
adjacent anchor pair, such as the canonical head-turn midpoints; it must not be
used to assemble a new rotation from unrelated outputs.

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
pre-bent whole legs. A supplemental side torso was generated, but the V4
painted card silently used the front-facing atlas torso instead. V4 remains in
the Sandbox as an honest record of that mismatch; V5 corrects it.

## Walking V5: source-locked sockets

Walking V5 keeps V4's 36-frame, 1.2-second gait while replacing the visual
registration contract:

- `hugo-walk-v5-torso.png` is the generated side-on jacket and shorts. Its
  pelvis root, collar and visible armhole define the hip, neck and shoulder;
- upper-arm art spans the complete shoulder-to-elbow bone and forearm art spans
  the complete elbow-to-hand bone. Source anchors sit at the visible openings
  instead of being moved inward to crop away difficult joins;
- arms use 34-pixel upper bones and 32-pixel forearms so relaxed hands reach
  the upper thigh instead of stopping near the elbow;
- thighs render over shin openings, the torso covers hip openings, and shoes
  cover the distal shin openings. This is visual overlap only: joints and bone
  lengths never move to accommodate art; and
- each shoe has an authored ankle pivot inside its opening plus separate heel
  and toe contact nodes. Ground solving includes 19 pixels of sole depth, so
  the skeleton ankle is not mistaken for the bottom of the shoe.

## Walking V6: permanent sides and articulated hands

Walking V6 keeps the 36-frame, 1.2-second gait and makes the rig contract
unambiguous:

- public names use `left` and `right`, never the render-order terms `near` and
  `far`;
- each arm has shoulder, elbow, wrist and hand-end joints. The hand is its own
  wrist-to-fingertips part rather than being baked into the forearm;
- each leg has hip, knee and ankle joints, followed by separate heel and toe
  contacts;
- left and right elbows use permanent inverse-kinematics bend branches. A hand
  passing across its shoulder can no longer make the elbow flip to the other
  side; and
- the ankle pivot is registered in the shoe opening where the shin enters it,
  rather than on the rear collar or heel.

Elbows and knees are required for natural flexion: omitting either turns the
whole limb into a stiff plank. Wrists are separate because hand pose and
overlap should not rotate or replace the forearm. The bright front-layer art is
named left; the darker rear-layer art is named right. Those identities,
colours, bend branches and render layers stay fixed for every frame.

The Sandbox's interactive V6 limb sheet is the naming contract for future
review. It exposes these plain-language IDs:

- `head`, `torso`;
- `left-upper-arm`, `left-forearm`, `left-hand`;
- `right-upper-arm`, `right-forearm`, `right-hand`;
- `left-thigh`, `left-shin`, `left-shoe`; and
- `right-thigh`, `right-shin`, `right-shoe`.

Hovering, focusing, or clicking a label isolates the exact source image and
joint path. Requests should name the part and both relevant joints, such as:
“move the `left-shoe` ankle socket deeper into the opening while preserving
its heel and toe contacts.”

Recommended refinements after V6 review:

1. generate small knee and elbow overlap caps that conceal texture seams
   without moving joints;
2. author relaxed-hand variants for forward and backward arm swing;
3. move source rectangles and anchors into validated asset metadata;
4. add delayed hair and jacket-hem bones only after the base gait is approved;
5. match the cycle's visual ground speed to gameplay metres per second before
   promoting it outside the Sandbox.

## Head Turn V2: isolated and registered rotation

The Head Turn cards test whether Hugo's approved head can be treated as a
genuinely three-dimensional asset without attaching it to a body. The four
V1/V2 cards use the same 24 unique 15-degree views. Frames 1, 7, 13 and 19 are the
right profile, front, left profile and back cardinal views.

The generated V1 source contains 24 valid disconnected head silhouettes, but
several silhouettes cross the nominal `256 x 256` grid boundaries. Slicing
that sheet by its visual grid cut off parts of some heads and copied small
pieces of neighbouring heads into other cells. The generated poses also had
different source centres and heights, producing visible horizontal and
vertical drift.

Head Turn V2 treats connected alpha silhouettes, rather than assumed grid
cells, as the source of truth:

- all 24 complete connected heads are extracted from the full transparent
  source sheet in reading order;
- every head is normalized to exactly 240 pixels high and registered to the
  centre of a transparent `320 x 320` cell;
- the stabilized `5 x 5`, `1600 x 1600` atlas stores the 24 unique views plus
  a 25th seam-validation cell that is pixel-identical to frame 1;
- playback omits that duplicate, so the closing 345-degree view advances
  directly to the opening profile with no repeated-frame pause; and
- runtime rendering clips each destination cell as an additional containment
  gate. Neighbouring head pixels cannot appear above or beside the active head.

The V2 geometry card displays the permanent centre, height box, rotation pivot
and landmarks. The V2 painted card uses the same registered source contract.
The original painted card also uses the corrected atlas so the reported bug is
not left behind in the earlier comparison.

Head-turn previews now default to `0.40x`: 12 displayed frames per second and a
two-second rotation. Every Sandbox card has an independent `0.10x` to `2.00x`
playback-speed control. The card reports the selected multiplier, effective
FPS and effective loop duration, and saves the setting locally. Frame buttons,
readouts and canvases update together. Off-screen previews advance their
timeline without repainting until they approach the viewport.

This remains an identity and volume experiment, not a gameplay animation. No
torso, shoulders or limbs appear; the small neck base belongs to the head
registration silhouette.

## Canonical head turn: individual degree files

The final two-card row beneath V2 uses one explicit angle contract:

- `0°` is front-facing;
- angles increase clockwise when Hugo is viewed from above;
- each next image advances exactly `15°`;
- `90°` is Hugo's left profile, `180°` is the exact back, and `270°` is
  Hugo's right profile; and
- `345°` loops directly to `0°`.

The painted card loads **24 separate `320 x 320` transparent PNG files** from
`src/assets/game/head-turn/canonical-24/frames/`. Each filename includes its
angle, for example `hugo-head-yaw-cw-000-front.png`,
`hugo-head-yaw-cw-090-left-profile.png`, and
`hugo-head-yaw-cw-180-back.png`. `manifest.json` is the only playback-order
source. Runtime does not slice a sheet or rely on filesystem enumeration.

The geometry card uses the same 24-angle map. Its 11 plain-language landmarks
are Crown, Hairline, Left/Right eye, Left/Right ear, Nose, Left/Right mouth
corner, Chin and Nape. Hovering, focusing or clicking a label isolates that
node, enlarges it and draws a leader line to its current projected location.
Holding the primary pointer and dragging horizontally pauses either card and
scrubs the same angle sequence.

### Rejected V3: why the 59-frame sequence reversed

The failed V3 files were individually cut out, but that did not make their
ordering valid. The builder alternated an approved 24-view sequence with a
separately generated midpoint sheet, then appended two more independently
generated bridge sheets. Those batches did not share a guaranteed direction,
angle ledger, identity registration, or spacing model. Alpha bounds, centres,
and dimensions all passed while frames 1, 2, and 3 visibly rotated right,
jumped toward front, and rotated right again.

This was a pipeline error:

1. file-level extraction was incorrectly treated as proof of motion
   continuity;
2. independently generated sheets were interleaved as if cell positions
   represented compatible angles;
3. corrective bridge batches compounded the mismatch; and
4. validation checked geometry and transparency but not monotonic yaw.

The entire 59-frame sequence is rejected and archived under
`art/source-images/game/head-turn/rejected-v3/`. It is no longer imported by
the application.

### Hard production rules for rotational art

1. Canonical anchors may use only one coherent source sequence.
2. Never interleave, append, or patch independently generated rotation sheets.
3. A derivative midpoint is allowed only when one generation uses exactly two
   adjacent approved anchors and produces exactly their named halfway angle.
   It must be reviewed between those same anchors before acceptance.
4. Extract every accepted head into an individual transparent PNG immediately.
5. Encode direction and degrees in every filename. Use `p5` for half degrees:
   `007p5` means `7.5°`.
6. Use a manifest as the only playback order. Record whether each file is an
   approved anchor or a generated midpoint, plus the midpoint's two source
   angles.
7. If the source has 24 clean views, keep those 24 anchors byte-identical. Do
   not replace them merely to reach a requested round number.
8. Reject any midpoint that overshoots either anchor, reverses, flips sides,
   changes identity, or breaks the fixed centre. Regenerate that pair alone;
   never repair it with another sheet.
9. Before release, inspect the first three views, both profile-to-back arcs,
   the exact `180°` side change, and the `345 → 352.5 → 000` seam at slow speed.

The source has 24 valid unique views, so the accepted set uses 24 exact
15-degree steps. A 30-view optical-flow resample was also rejected because it
created ghosted facial features. The final individual files are pixel-unchanged
extractions from the approved registered source.

## Paired-midpoint 60 FPS derivative

The 60 FPS row beneath the canonical cards preserves all 24 approved anchors
and inserts one separately generated midpoint into every adjacent pair:

`000 → 007.5 → 015 → 022.5 → 030 ... 345 → 352.5 → 000`.

This is **48 distinct individual files**, not a 48-cell sheet. Every whole
15-degree anchor is copied byte-for-byte from `canonical-24`. Every half-degree
file was generated from only its two neighbours, saved separately, recorded in
`canonical-48/manifest.json`, and registered to a `320 × 320` transparent
canvas with a `240 px` alpha height and permanent centre.

The loop is played at 60 FPS, so 48 frames last `48 ÷ 60 = 0.80 seconds`.
Frame rate describes how quickly images are presented; it does not mean every
loop must contain exactly 60 unique images. The Sandbox exposes all 48 numbers,
their exact degree labels, anchor/midpoint provenance, pause/seek controls, speed
dial, and drag-to-rotate inspection.

This derivative does not weaken the no-sheet rule. It is valid because each
new view has one explicit pair contract and one exact angle. The rejected V3
failed because unrelated multi-view sheets were interleaved by cell position
without compatible angles or directions.

## Torso Turn: sheet-first extraction and neck socket

The torso experiment returns to the default sheet-first rule. One built-in
image-generation call produced the complete 24-view outfit rotation as a
`6 × 4` atlas:

`000, 015, 030 ... 165, 180 ... 255, 270 ... 345`.

The first draft was rejected because it returned seven columns. The accepted
second draft contains exactly 24 large connected torso silhouettes. The source
sheet remains under
`art/source-images/game/torso-turn/canonical-24/`; extraction finds the 24
connected silhouettes instead of assuming generated outer margins form exact
arithmetic cells. It then writes one `320 × 320` alpha PNG per angle under
`src/assets/game/torso-turn/canonical-24/frames/` and records their row-major
source bounds and checksums in `manifest.json`.

The torso has no painted head, skin neck, arms, hands, lower legs, or shoes.
Its dark ribbed collar is an open socket. The composite Sandbox card:

- advances the canonical head and torso with the same frame index and degree;
- lets the head asset own the complete painted neck;
- renders the head first; and
- renders the torso second so the collar masks the neck base naturally.

The matte was also treated as a quality gate. A broad soft magenta despill pass
damaged cream and orange costume pixels, so it was rejected. The accepted hard
key uses a contracted, lightly feathered edge and preserves the costume
interior. Chroma settings are not sacred: the alpha result must be inspected,
and any pass that erases the subject is invalid even when it removes the
background.

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
animation; **Use all** clears the exclusions. Each animation also has an
independent persistent speed control so spacing can be judged slowly, at its
authored rate, and above speed without changing the source frames.
