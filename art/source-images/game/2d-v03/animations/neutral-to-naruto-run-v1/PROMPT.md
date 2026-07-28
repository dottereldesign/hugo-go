# Neutral Side to Naruto Run

Use case: `sprite-asset`

Reference endpoints:

- `src/assets/game/2d-v03/animations/head-nod-soft-inbetweens/frames/hugo-head-nod-smooth-01-approved-00-percent.png`
- `src/assets/game/2d-v03/sunrise-side/poses/hugo-sunrise-side-35-naruto-run.png`

Production brief:

> Create a minimalist full-body transition from the exact approved Neutral
> Side start into the exact approved Naruto-run finish in strict screen-right
> side profile. Preserve the two supplied endpoint drawings unchanged. Between
> them, redraw four complete chronological in-between figures: (1)
> anticipation, with the near foot loading while the far heel lifts; (2) first
> stride, with one knee reaching forward and the other leg extending through
> toe-off; (3) a compact passing pose where the two legs visibly exchange roles
> beneath the hips; and (4) the opposite-leg drive, with the formerly trailing
> leg moving forward while the other extends behind. Both legs must change
> position independently, both knee pads and both black shoes must remain
> visible, and no pose may duplicate an adjacent drawing. Progress the torso
> from upright into the approved forward lean while both arms sweep gradually
> behind the hips. Preserve Hugo's exact identity, face, spiky brown hair, warm
> peach/tan skin, proportions, orange-and-cream Outfit 03 Sunrise suit,
> yellow/orange back panel, dark trim, knee pads, and black basketball shoes.
> Match the canonical polished 2D game-character linework, lighting, shading,
> colour, and scale. Draw exactly one complete Hugo on a perfectly flat solid
> `#FF00FF` chroma background with generous padding. No crop, floor, shadow,
> glow, text, labels, borders, extra people, duplicate anatomy, fragments,
> props, or watermark.

The four drawings were generated individually with phase-specific refinements
for anticipation, first stride, leg passing, and opposite-leg drive. Chroma
removal used the image-generation helper with border sampling, hard distance
tolerance `145`, edge contraction `1`, and edge feather `0.25`. The build
script performs deterministic whole-figure scaling and placement only.
