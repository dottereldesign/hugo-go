# Design audit

## What now works

- Home keeps its polished HUGO GO! presentation.
- Play starts Forest immediately with no level or map screen.
- The first safe seconds visibly establish Hugo’s ground run.
- One input works across touch, mouse, and keyboard.
- Ground and flight use distinct generated poses.
- Ground running now uses eight generated stride phases at 12 fps.
- Jumping/landing uses eight authored phases, including a toe-contact frame.
- Shoe jets visibly fire from per-frame shoe anchors during flight.
- A clean wordmark-blue sky and generated forestry trail replace the full-screen Forest plate.
- Hugo can land on and run across obstacle tops; only frontal impacts end the run.
- Four seasons transition without swapping or decoding additional background images.
- Five unbuilt worlds remain discoverable without looking playable.
- Distance, coins, XP, best distance, and local top-five runs connect gameplay back to home.
- Retry is one action and never returns to a selector.
- Mobile portrait play has no document scroll.

## Readability choices

The game area is narrower than a desktop window because the target experience is portrait. Desktop side space is intentionally quiet and dark. The playable canvas contains:

- three compact HUD values;
- one temporary control hint;
- a clear ground line;
- strong obstacle outlines;
- coins above the obstacle route;
- a restrained bottom-right setting label.

Obstacle rectangles receive a subtle warm dashed edge so the hazard boundary is visible even when the internal rock/wood texture is irregular.

## Game feel

Hugo automatically runs, so an inactive player still sees forward motion. A fresh hold starts with a jump and then applies continuous shoe-jet acceleration; releasing hands control back to gravity. The jump, acceleration, and capped rise speed make takeoff readable without converting repeated events into stronger impulses, and the course speed ramps slowly.

The game borrows the immediate single-action readability associated with Flappy Bird and the energetic forward momentum associated with jetpack runners. Its character, shoe-jet mechanic, Forest presentation, rules, art, and progression are original.

## Respectful representation

The generated Hugo art uses the same individual face across every animation sheet. Heritage is not conveyed through distorted facial anatomy. New Zealand/Japanese cues stay in contemporary badges, plants, petals, and the forestry-trail setting.

No Māori motifs or patterns are present.

## Known intentional limits

- Forest is one endless course rather than a level campaign.
- Obstacles are procedural Canvas art.
- The local leaderboard is not global.
- Game-over still freezes the active pose; a dedicated non-injury reaction sheet remains optional.
- Existing home music/UI sounds remain; bespoke gameplay sound design is deferred.

These limits do not block the current playable loop. Optional visual upgrades are recorded separately in `docs/ART_BACKLOG.md`.
