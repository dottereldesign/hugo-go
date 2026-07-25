# Design audit

## What now works

- Home keeps its polished HUGO GO! presentation.
- Play starts Forest immediately with no level or map screen.
- The first safe seconds visibly establish Hugo’s ground run.
- One input works across touch, mouse, and keyboard.
- Ground and flight use distinct generated poses.
- Ground running now uses 60 generated full-body poses at 60 fps, including continuous
  arms-back sprint, shoe, hair, hood, and jacket motion.
- Jumping/landing uses eight authored phases, including a toe-contact frame.
- A rapid second press produces an authored six-frame double-jump corkscrew.
- Shoe jets visibly fire from both measured metal heel ports in every powered/glide frame, using layered plasma rather than flat triangular exhaust.
- A clean wordmark-blue sky and generated forestry trail replace the full-screen Forest plate.
- Hugo can land on and run across obstacle tops; frontal impacts use a six-frame wall-splat/recovery sequence and only end the run if he is pushed off-screen.
- The clear sky keeps hazards and character silhouettes easy to read at speed.
- Four seasons transition without swapping or decoding additional background images.
- Five unbuilt worlds remain discoverable without looking playable.
- Distance, coins, XP, best distance, and local top-five runs connect gameplay back to home.
- Retry is one action and never returns to a selector.
- Mobile portrait play has no document scroll.
- Phone gameplay bleeds generated sky and ground to every physical edge, including when
  iOS notch padding changes the available aspect ratio; the core world is never stretched.

## Readability choices

The game area is narrower than a desktop window because the target experience is portrait. Desktop side space is intentionally quiet and dark. The playable canvas contains:

- three compact HUD values;
- one temporary control hint;
- a clear ground line;
- strong obstacle outlines;
- coins above the obstacle route;
- a restrained bottom-right setting label.

Obstacles are unmistakably red, retain large rectangular collision silhouettes, and use stripe, faceted, or panel detailing to represent different hazards.

## Game feel

Hugo automatically runs, so an inactive player still sees forward motion. A fresh hold starts with a jump and then applies continuous shoe-jet acceleration; releasing hands control back to gravity. A deliberate rapid re-press adds one stronger double jump. Obstacles are spaced farther apart to restore running rhythm before each large hazard.

The game borrows the immediate single-action readability associated with Flappy Bird and the energetic forward momentum associated with jetpack runners. Its character, shoe-jet mechanic, Forest presentation, rules, art, and progression are original.

## Respectful representation

The generated Hugo art uses the same individual face across every animation sheet. Heritage is not conveyed through distorted facial anatomy. New Zealand/Japanese cues stay in contemporary badges, plants, petals, and the forestry-trail setting.

No Māori motifs or patterns are present.

## Known intentional limits

- Forest is one endless course rather than a level campaign.
- Obstacles are procedural Canvas art.
- The local leaderboard is not global.
- The final game-over overlay follows the wall-splat recovery window; the active wall pose remains visible behind it.
- Existing home music/UI sounds remain; bespoke gameplay sound design is deferred.

These limits do not block the current playable loop. Optional visual upgrades are recorded separately in `docs/ART_BACKLOG.md`.
