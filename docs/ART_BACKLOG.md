# Animation and art ledger

No character image required for the current Forest controls is missing.

## Completed now

- One wide transparent ochre/scorched-red New Zealand forestry trail.
- Flat home-wordmark-blue sky with Spring, Summer, Autumn, and Winter tint/particles.
- Lightweight seasonal petals, light motes, leaves, and snow.
- Procedural two-post drooping grind wire whose visible quadratic cable is also its
  collision and character-tangent curve.
- Sixty-frame Hugo run cycle: a complete right-facing arms-back sprint with two foot
  contacts, compression, passing, push-off, and airborne arcs, plus sequential hair,
  hood, jacket, sleeve, shorts, hand, and shoe follow-through.
- Six-frame powered-glide loop with stable shoe anchors, wind-rustled hair, and jacket flutter.
- Six-frame unpowered glide/fall loop with calmer secondary motion.
- Eight-frame jump/landing sheet: push-off, rise, airborne, fall, toe-contact, compression, and run recovery.
- Six-frame double-jump sheet: tuck, corkscrew, open, and stabilized flight.
- Six-frame non-injury wall sheet: approach, splat, wobble, peel, crouch, and upward recovery.
- Thirty-frame right-facing cable-grind loop: forward and rear shoes separated inline,
  outer sole edges sharing one contact baseline, with sequential balance, jacket, and
  hair motion at 30 fps.
- One generated 30-frame shoe-jet flame loop played at 30 fps, reused across two measured per-frame metal heel-port anchors with a 13-frame offset and thrust-responsive length/opacity/glow.

The run cycle plays all 60 poses at 60 fps and repeats every `1 s`. The flight loops repeat every
`0.5–0.6 s`; the double jump plays at 14 fps, the wall action at 12 fps, and both the
grind and jet flame complete their 30-frame loops every second. Across the character
atlases there are **128 authored full-body frames**, plus **30 authored flame frames**.
More generated in-betweens should be added only when they improve silhouette continuity
enough to justify their download/decode cost.

Full-body normalized cells are intentional. Separately generated heads, arms, jacket panels, and legs would be useful for a purpose-built 2D skeletal rig, but this established stylized 3D render contains overlapping cloth, hands, hair, soft lighting, and self-shadowing. Cutting it apart would create seams and inconsistent occlusion. If a future art direction changes to rigged 2D, author layered source parts together from one turnaround rather than slicing these rendered poses.

## Optional future character sheet

No control or collision animation is currently missing. A future new-best celebration could add three short poses, but it is not required for gameplay.

## Optional authored obstacle set

- rimu stump;
- mossy boulder;
- fallen log/root cluster;
- dense flowering bramble.

Every obstacle image must fill a documented rectangular collision silhouette, contain no transparent hole inside its solid body, and use no Māori pattern or motif.

## Optional effects

- coin pickup sparkle;
- new-best celebration;
- soft landing dust/petals.

Effects should use small consistent sprite-sheet cells and transparent backgrounds. Avoid large smoke clouds that hide collision space.

## Future world art

Do not generate Workshop, Word, Number, Space, or Music gameplay art until each course has approved mechanics and collision geometry. Their current home cards are sufficient for **Coming soon**.

## Identity prompt guardrail

Every Hugo prompt must include: “same exact Hugo identity; natural non-caricatured facial anatomy; no exaggerated eye shape or ethnic stereotype; no franchise costume; no weapon; no Māori pattern.”
