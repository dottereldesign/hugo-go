# Neutral idle arm smoothing V3

Generated with the built-in image-generation workflow using three pair-specific
2 × 2 sheets. Each sheet contains only four poses:

1. exact start pose;
2. exact end pose;
3. generated 33% in-between; and
4. generated 66% in-between.

Final prompt pattern:

> Use case: identity-preserve precise 2D game animation in-between edit. The
> square is a 2 × 2 board. Top-left is exact start pose A and top-right is exact
> end pose B. Fill bottom-left with the 33% temporal in-between and bottom-right
> with the 66% temporal in-between. Preserve Hugo Outfit 03, body scale, front
> view, complete shoes and feet, and stable torso. His right arm (left side of
> image) moves smoothly between A and B. Gum must be dark navy blue. Each cell
> must contain exactly one complete full-body Hugo centred with 12% safe padding
> on every side. Absolutely no detached shoes, floating fragments, duplicate
> limbs, crop bleed, or clipping. Flat solid `#00ff00` chroma-key background,
> no shadow, grid, text or scenery.

The production extractor rejects a cell if its main silhouette is incomplete,
if a second meaningful disconnected component exists, or if its vertical bounds
leave the safe frame region. This is the guard that prevents detached shoes from
entering the animation again.
