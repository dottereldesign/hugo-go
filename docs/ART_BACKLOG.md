# Animation and art ledger

No character image required for the current Forest controls is missing.

## Completed now

- One wide transparent ochre/scorched-red New Zealand forestry trail.
- Flat home-wordmark-blue sky with Spring, Summer, Autumn, and Winter tint/particles.
- Lightweight seasonal petals, light motes, leaves, and snow.
- Eight-frame Hugo run cycle:
  1. right contact;
  2. right recoil/down;
  3. left-leg passing;
  4. left-leading airborne/up;
  5. left contact;
  6. left recoil/down;
  7. right-leg passing;
  8. right-leading airborne/up.
- Six-frame powered-glide loop with stable shoe anchors, wind-rustled hair, and jacket flutter.
- Six-frame unpowered glide/fall loop with calmer secondary motion.
- Eight-frame jump/landing sheet: push-off, rise, airborne, fall, toe-contact, compression, and run recovery.
- Six-frame double-jump sheet: tuck, corkscrew, open, and stabilized flight.
- Six-frame non-injury wall sheet: approach, splat, wobble, peel, crouch, and upward recovery.
- Two animated shoe flames drawn in Canvas code, with measured per-frame metal heel-port anchors, a cyan-white/gold/orange plasma palette, tapered motion, sparks, and thrust-responsive length/glow.

The run cycle plays at 12 fps and repeats every `0.667 s`. The two flight loops each repeat every `0.5 s`; the double jump plays at 14 fps and the wall action at 12 fps. Across all six atlases there are **40 authored full-body frames**. More generated in-betweens should be added only when they improve silhouette continuity enough to justify their download/decode cost.

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
