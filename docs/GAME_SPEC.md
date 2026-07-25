# HUGO GO! implemented game specification

## Product shape

HUGO GO! is a single-input, portrait-first endless runner/flight game. Hugo begins every run automatically on the Forest World ground. The player decides when to fire the two shoe jets and move upward.

Home **Play** goes directly to `#/game` and starts a fresh run. There is no level selection or intermediate screen.

## Current course

**Forest World — Rimu & Sakura Run** is the only playable course.

The home screen still shows Workshop, Word, Number, Space, and Music so the product can grow later. Those cards are visually muted, expose `aria-disabled="true"`, say **Coming soon**, and cannot replace Forest as the active course.

## Controls

| Device | Input | Action |
| --- | --- | --- |
| Touch | Press and hold the game | Jump once, then apply continuous upward shoe-jet acceleration |
| Mouse/trackpad | Hold the primary button in the game | Jump once, then apply continuous upward shoe-jet acceleration |
| Keyboard | Hold Space, Up Arrow, or W | Jump once, then apply continuous upward shoe-jet acceleration |
| Any gameplay input | Release and press again within `0.48 s` | Trigger one stronger double jump |
| Any gameplay input | Descend onto a wire | Automatically enter a shoe-edge grind |
| Any gameplay input | Press while grinding | Jump cleanly away from the cable |
| Any gameplay input | Press while wall-splatted | Peel upward from the obstacle and resume flight |
| Any | Back home | End the active view and return home |

The main input is press-and-hold rather than repeated impulses. A fresh press jumps from the current running surface; one deliberate rapid re-press within `0.48 s` supplies a stronger double jump. It cannot be repeated before landing. Thrust ramps smoothly while held, and releasing returns control to gravity. Browser-generated repeated pointer/key events do not reset or multiply velocity.

## Run rules

1. The game begins in `playing` state with Hugo running on the ground.
2. The world scrolls automatically and gradually accelerates.
3. A fresh hold begins with a jump animation, then smoothly changes Hugo to powered flight.
4. Gravity returns Hugo to the first clear surface below him.
5. The fixed ground and obstacle tops are safe running surfaces.
6. Hugo remains grounded while an obstacle scrolls beneath him and falls when its trailing edge passes.
7. A direct horizontal impact splats Hugo against the obstacle instead of ending the run immediately.
8. Two-post wires appear occasionally. A downward crossing lands on the visible sagging
   cable, follows its curve, collects its coin line, and exits with a small lift at the
   far post. Rising through a cable from below does not attach Hugo; either support uses
   the same recoverable wall-splat response as a solid obstacle.
9. Pressing while grinding jumps immediately away from the wire.
10. Pressing while splatted peels Hugo upward with a short side-collision grace window. If he is pushed fully off-screen or remains stuck for `1.25 s`, the run ends.
11. Coins are collected once and removed.
12. A failed recovery freezes the run, saves its result, and shows **Fly again**.

The opening obstacle is placed far enough away for the player to see the running state and learn the control.

## Physics and collision contract

The logical canvas is `390 × 780` with ground at `y = 704`. Hugo uses a deliberately readable body hitbox separate from decorative hair, hands, and flame edges.

Simulation is split into fixed `1/120 s` substeps. The public advance function caps a single browser-frame contribution and subdivides it, so slow frames do not create large collision jumps.

Obstacle detection combines:

- inclusive axis-aligned overlap, where exact edge contact counts;
- swept rectangle helpers for diagnostic coverage;
- swept top-crossing tests using relative world motion for platform landings;
- swept downward-only crossings against the exact quadratic wire curve;
- front-face crossing tests for wall attachment;
- fixed-step integration for vertical falls and horizontal scrolling.

This makes these outcomes explicit:

- a measurable positive gap is safe;
- exact horizontal front-face contact is a collision;
- fast downward travel through a thin platform still lands on its top;
- a fall toward an obstacle top lands precisely on that top;
- a supported Hugo runs at the platform height until its trailing edge passes;
- the same quadratic function drives wire drawing, shoe height, collision, and sprite
  tangent rotation;
- a grinding Hugo remains shoe-locked to the scrolling sag, can jump at any point, and
  cannot be caught while moving upward from below;
- front contact attaches Hugo to the scrolling obstacle without an immediate loss;
- a recovery press clears the attachment and provides upward velocity;
- an unrecovered Hugo is eventually pushed out and loses;
- clear-ground descent lands exactly on the ground plane;
- a coin can increment the run total only once.

See `tests/engine.test.ts` for executable examples.

## Scoring and persistence

Distance is derived from world travel. A run result contains whole metres and collected coins.

`recordRun` updates:

- coins;
- XP (`distance + coins × 20`);
- level (`floor(total XP / 1000) + 1`);
- flight power;
- best distance;
- total run count;
- top five runs, sorted by distance then coins.

The home profile, missions, resource counters, best-distance footer, and local leaderboard use this state. Storage is device-local; no online identity is implied.

## Presentation

Hugo has eight generated full-body animation atlases:

- a 60-frame grounded forward-leaning sprint cycle with arms swept back, wind-following
  hair and jacket, and two smooth stride arcs;
- an eight-frame jump/landing sheet with push-off, airborne, falling, toe-contact, compression, and recovery poses;
- a six-frame powered-glide loop with wind-rustled hair and jacket;
- a six-frame unpowered glide loop with distinct secondary motion;
- a six-frame freefall loop with banking and calmer cloth motion;
- a six-frame double-jump sheet with tuck, corkscrew, opening, and stabilization;
- a six-frame non-injury wall-impact sheet with splat, wobble, peel, crouch, and upward recovery;
- a 30-frame right-facing grind loop with one shoe leading, one trailing, and the outer
  side edges of both soles aligned to the cable contact line.

The run atlas plays all 60 authored poses at 30 fps in a seamless two-second loop. Flight,
transition, and wall atlases play at their specified 10–14 fps cadences; the grind atlas
plays all 30 authored frames at 30 fps. Jumping uses the clean crouch and
airborne silhouettes in transition frames 3–4; the two stiffer duplicate stride poses are
intentionally skipped. Landing uses frames 5–8 before returning to the run cycle. The
authored frames keep Hugo as a complete rendered character so cloth, lighting, hands,
and joint occlusion stay coherent; splitting this particular 3D art into separately
generated limbs would introduce seams and identity drift.

The two shoe flames use a generated 30-frame atlas played at 30 fps as a seamless one-second loop. Both shoes share the atlas but the rear flame starts 13 frames later, avoiding mirrored flicker. Every powered and glide character frame has two independently measured source-pixel coordinates on the visible metal heel ports plus its own down/back angle. The generated exhaust supplies the white/cyan plasma core, gold/orange body, coral-red tip, and sequential shape motion; a lightweight Canvas glow remains behind it. Flame length, opacity, and glow respond to smoothed thrust intensity.

The old full-screen Forest image is not loaded. The play corridor uses a clean cyan sky,
while a generated transparent ochre/scorched-red New Zealand forestry trail scrolls below
it. Solid obstacles are large red procedural silhouettes with stripe, facet, or panel
identities. The occasional wire is also procedural: two red support posts and a highlighted
dark cable drawn from the same quadratic curve used by collision.

## Seasonal cycle

Forest World uses four visual profiles in this order:

1. Spring — fresh color and drifting pink petals.
2. Summer — richer saturation and warm light motes.
3. Autumn — warmer hue/sepia grading and falling orange leaves.
4. Winter — cooler/desaturated grading, snowfall, and a pale ground layer.

Each season owns a 30-second slot. Its first 20 seconds hold steady; its final 10 seconds use smooth-step interpolation into the next profile. The sequence loops from Winter back to Spring after 120 seconds.

No full-screen background texture or offscreen filter buffer is held in memory. One translucent tint and at most 24 simple particles create the seasonal transitions over the blue sky and 64 KB trail strip.

## Cultural and character guardrails

Hugo is 10 years old and has Japanese/New Zealand family heritage.

- Use natural, individual facial anatomy.
- Do not use exaggerated eye shapes or visual shorthand for ethnicity.
- Do not turn heritage into a costume.
- Do not add Māori patterns or motifs.
- Japanese and New Zealand nature, food, language, geography, family life, and ordinary contemporary details can inform future worlds when handled specifically and respectfully.

## Mobile and accessibility

- Gameplay is designed for portrait orientation.
- The page and game canvas use `touch-action: none`.
- The game view is fixed to `100dvh` with hidden overflow and no document scrolling.
- Safe-area insets are respected by the game header and controls.
- Landscape phones receive a portrait-play message.
- HUD values are HTML text.
- Run start and game-over results are announced through an ARIA live region.
- Keyboard control is supported.

## Out of scope for this release

- additional playable worlds;
- multiple levels or maps;
- accounts and global leaderboards;
- monetization;
- multiplayer;
- authored audio specifically for shoe jets, coins, and impacts.
