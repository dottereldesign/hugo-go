# HUGO GO! 2D Sandbox Version 02

> **ARCHIVED VERSION 01 MATERIAL — DO NOT USE FOR NEW WORK.**
> The active direction is [`VERSION_03.md`](./VERSION_03.md).

Version 02 is the active character-animation direction. Version 01 remains in
the Sandbox as a useful archive, but its 3D rotation experiments and layered
rig are not the production model for new motion.

## Canonical Hugo: Outfit 03

**Outfit 03 / Sunrise Flight Suit is the reference for Hugo from this point.**

Future V02 art must preserve:

- Hugo's friendly ten-year-old face and child proportions;
- dark fauxhawk with closely shaved sides;
- burnt-orange suit, warm cream chest, golden wingsuit membranes, teal piping,
  and navy protection;
- the same wingsuit construction and silhouette;
- the same shoes and compact twin jet outlets at the heels/undersides; and
- the approved neutral-front and ready-profile scale and camera language.

Skyline and Night Comet remain outfit studies. They do not override Outfit 03's
identity, anatomy, or construction.

## Why the direction changed

The 3D approximation demanded too many generated views and made it easy for
identity, anatomy, clothing, and registration to drift. The early attempt to
combine drawings from different sheets also proved that plausible individual
images do not automatically form a coherent sequence. Interleaving sheet A,
sheet B, and sheet C created reversals and discontinuities because each
generation had its own pose rhythm and interpretation.

Version 02 uses a sheet only as an efficient generation and review format.
Production animation always uses individually extracted, named transparent PNGs.
The sheet is never sliced at runtime.

## Animation framework

### 1. Lock one readable idea

An animation loop should communicate one idea at phone size. Write its beat
order before making art:

```text
start → anticipation → action → reaction → recovery → settle → exact start
```

The neutral idle is “bored gum bubble goes wrong.” The ready-profile loop is
“a heel-jet check causes an accidental hover.”

### 2. Set timing before frame count

Choose the duration and rhythm before asking how many drawings are needed.
Frame count is not a quality target. A thoughtful hold can reuse one drawing
for several timing ticks, while a tap, ignition, or impact may need only one
tick.

Current V02 animation timing uses a 12-tick-per-second base:

- **Neutral Front · Bubble-gum idle:** 68 runtime drawings, each held one tick: 68 ticks, 2.83 s at 24 FPS.
- **Ready Profile · Mischievous jet check:** 23 runtime drawings, 51 ticks,
  4.25 s.

The page's speed control scales this authored timing without changing the art.

### 3. Apply the animation principles deliberately

The principles described by Frank Thomas and Ollie Johnston are practical
review tools, not decoration:

- **Squash and stretch:** compress the landing and stretch acceleration while
  preserving Hugo's apparent volume.
- **Anticipation:** raise the toe before the tap; crouch before ignition; lift
  the hand before peeling the gum.
- **Staging:** one silhouette, expression, and action must read clearly on a
  phone. Effects cannot hide the face or shoe contact.
- **Pose to pose:** approve story poses, contacts, and extremes first.
  Hair, fabric, gum, and flame may develop more freely between them.
- **Follow-through and overlap:** torso leads; hair, wingsuit fabric, hands,
  and shoes settle on slightly different drawings.
- **Slow in and slow out:** use tiny spacing near a gentle start or stop, then
  progressively wider spacing through acceleration.
- **Arcs:** track the head, hips, hand, lifted toe, heel, and hover trajectory.
- **Secondary action:** the toe tap, eye roll, fabric drag, and suit brush
  support the main idea without competing with it.
- **Timing:** a large purposeful gap can create speed. More in-betweens can
  make a snap feel slow.
- **Exaggeration:** push the splat, surprised recoil, hover correction, landing
  squash, and bored reaction while keeping the visual physics consistent.
- **Solid posing:** preserve anatomy, balance, perspective, volume, costume
  construction, shoe size, and camera angle.
- **Appeal:** every expression and silhouette must remain recognizably Hugo.

Useful spacing shorthand:

```text
gentle ease: tiny · small — wider —— widest —— wider — small · tiny
fast action: anticipate → large purposeful gap → contact → recoil → settle
```

Do not ease through a collision or ignition contact. Transfer the energy
sharply, then show recoil and overlapping recovery.

### 4. Generate sequential sheets

Use exactly 4 × 3 drawings on one flat chroma background, ordered left-to-right
and top-to-bottom. Each sheet covers one chronological section of one
animation.

If an action requires another sheet:

1. provide the preceding sheet and Outfit 03 reference;
2. describe the exact state at the hand-off;
3. start the next sheet from that state;
4. continue forward in time; and
5. never alternate drawings from independently generated sheets.

One sheet reduces generation cost. It does not excuse weaker planning.

### 5. Review before extraction

Inspect every full sheet for:

- identity, face, fauxhawk, age, and expression continuity;
- complete anatomy, correct limb order, and consistent proportions;
- wingsuit construction and outfit colour;
- shoes connected to legs and jet effects aligned to heel outlets;
- clear pose progression with no reversal or skipped beat;
- complete isolated silhouettes with no overlap or cropping; and
- protected subject colours that may resemble the chroma key, such as pink gum.

Reject a bad sheet. Do not repair chronology by mixing it with a different
generation.

### 5A. Refine an existing loop pair by pair

“Make it smoother” is not a sufficient generation instruction. A continuity
pass must preserve the accepted sequence and work through adjacent pairs in
strict order:

1. freeze the approved PNG order and remove any rejected anatomy outright;
2. compare 01→02, then 02→03, then 03→04, continuing without skipping;
3. overlay A-only silhouette pixels in red, B-only pixels in cyan, and shared
   pixels in white;
4. track head, hips, shoulders, elbows, wrists, knees, feet, eye line, prop
   shape, balance, centroid, and silhouette bounds;
5. classify each gap as a hold/micro-change, purposeful snap or impact, or
   genuinely missing motion;
6. for a missing beat, build an **A / blank target / B** row from the exact
   registered production PNGs;
7. request only the stated temporal fraction (usually ½; sometimes ⅓ or ⅔),
   plus explicit anatomy, identity, costume, registration, and action
   invariants;
8. extract only the new target—not altered copies of A or B—and insert it
   between its named endpoints;
9. rerun the same audit on A→new and new→B; reject the in-between unless both
   joins improve; and
10. retime exposures so added drawings do not accidentally slow the action.

Silhouette IoU, changed-pixel ratio, centroid travel, and bounds changes are
diagnostic signals, not automatic verdicts. A bubble pop, foot contact, punch,
or ignition can require a large intentional gap. The animator decides whether
the spacing communicates the intended force.

The July 2026 neutral-idle pass removed original frame 21 because it contained
three arms. It added 12 bracketed in-betweens for the toe path, bubble growth,
expression transition, hand approach, gum peel/stretch/recoil, gum flick, and
arm recovery. Toe contact and bubble splat remained sharp. Nine outgoing
two-tick exposures became one tick plus one new drawing; the rejected frame's
three ticks fund the final three recovery drawings. The loop therefore remains
exactly 68 equal ticks / 2.83 seconds at 24 FPS. Each new bridge is generated from
only its adjacent pair (A / midpoint / B), never mixed with another sheet.

### 5B. Lock the root, not the full silhouette

Do not centre a character animation from the complete alpha bounds. A moving
hand, lifted shoe, wing, flame, or stretched prop changes those bounds and
causes the torso to slide in the opposite direction. That error was visible in
the gum-peel section: as the hand extended right, full-silhouette centring
pushed Hugo's body left.

Neutral-idle registration uses the two cream chest panels as a stable root:

1. isolate the two largest cream components inside the torso ROI;
2. calculate their shared centre and combined height;
3. use frame 01 as the target root and torso scale;
4. apply one uniform affine scale plus X/Y translation to the complete RGBA
   drawing;
5. never stretch X and Y independently; and
6. rerun the detector after transformation and record both measurements.

The QA overlay places frame 01 in translucent cyan and the current drawing in
translucent orange. Crosshairs show both detected roots. Moving limbs and gum
are expected to separate; the chest crosshairs should overlap.

Before correction, the pass measured 36.9 px maximum horizontal root drift,
5.2 px vertical drift, and 3.23% scale drift. After correction, measured root
error is below 0.5 px and residual scale quantisation is about 1%. This
stabilises the body without changing pose timing or removing intentional
secondary action.

### 6. Extract and register individual files

After approval:

1. remove the chroma background with a soft matte;
2. restore intentional subject colours from the protected source where needed;
3. isolate each complete connected silhouette;
4. preserve one uniform scale per animation;
5. centre drawings on a 640 × 640 transparent canvas;
6. use a fixed ground baseline and a documented alternate effect baseline for
   flight frames;
7. name each file by animation, sequence number, and action slug; and
8. record source cell, timing, bounds, checksum, and runtime status in JSON.

Animation frame naming:

```text
hugo-{animation}-{NN}-{action}.png
```

Examples:

```text
hugo-neutral-idle-08-bubble-tiny.png
hugo-neutral-idle-19-gum-stretch.png
hugo-ready-profile-11-ignition.png
hugo-ready-profile-18-landing-squash.png
```

### 7. Prove the seam

The last review file must be a byte-for-byte copy of frame 01. It proves that
the end state can return to the start without a visual jump.

The duplicate is **not** played at runtime:

- the manifest identifies every runtime drawing;
- the final file is the exact seam bookend;
- held time belongs in `durationTicks`, not duplicate image files.

## Current Outfit 03 loops

## Jamie's notes

- Keep generated character sheets to **12 poses maximum**. Larger sheets make
  each figure too small, increase cell bleed/cropping risk, and make the model
  lose limb continuity between poses.
- For fast arm actions, generate 33% and 66% in-betweens from one exact
  adjacent pair rather than jumping from start directly to end. This keeps the
  elbow and wrist arc legible at 24 FPS.
- Use flat chroma green when bubble-gum pink must survive background removal;
  magenta is too close to pink/purple gum and risks colour damage.

### Neutral Front · Bubble-gum idle

Neutral hold, eyelid relaxation, weight shift, toe-tap anticipation/contact,
gum chew, five purple-bubble sizes, splat, stunned reaction, annoyed
anticipation, staged hand rise/contact, peel, stretch, gum release, inspection,
eye roll, flick, arm recovery, settle, and exact bookend.

### Ready Profile · Mischievous jet check

Ready hold, inhale, blink, heel inspection, weight anticipation, heel lift/tap,
tiny sputter, surprised recoil, boost crouch, ignition, low/peak/uneven hover,
balance correction, descent, landing anticipation/squash/rebound, heel check,
suit brush, hand return, settle, exact bookend.

## File map

- Outfit source sheets: `art/source-images/game/2d-v02/{outfit}/`
- Animation source sheets:
  `art/source-images/game/2d-v02/animations/{animation}/`
- Outfit 03 reference poses: `src/assets/game/2d-v02/sunrise/poses/`
- Animation PNGs:
  `src/assets/game/2d-v02/animations/{animation}/frames/`
- Animation manifests:
  `src/assets/game/2d-v02/animations/{animation}/manifest.json`
- Animation QA contact sheets: `src/assets/game/2d-v02/animations/qa/`
- In-app source browser: `#/character-sheets` indexes the original files under
  `art/source-images/game/2d-v02/`, groups them by folder, and opens full-size
  previews from each thumbnail.
- Chroma restoration helpers: `scripts/2d_v02/restore_protected_pink.py` and
  `scripts/2d_v02/restore_protected_purple.py`
- Adjacent-pair audit: `scripts/2d_v02/audit_animation_continuity.py`
- Torso-root detector and stabiliser:
  `scripts/2d_v02/neutral_registration.py`
- Before/after opacity overlay:
  `scripts/2d_v02/audit_neutral_registration.py`
- A/target/B board builder:
  `scripts/2d_v02/prepare_neutral_inbetween_boards.py`
- Neutral-idle refinement: `scripts/2d_v02/refine_neutral_idle.py`
- Deterministic extractor: `scripts/2d_v02/extract_animation_sheets.py`

Run:

```powershell
python scripts\2d_v02\extract_animation_sheets.py
python scripts\2d_v02\refine_neutral_idle.py
```

The Outfit 03 page in the application is the human review surface: it shows the
canonical 12 poses, both loops, every numbered file, the true loop duration,
pause/start/step/loop controls, adjustable playback speed, and the documented
pairwise continuity workflow.
