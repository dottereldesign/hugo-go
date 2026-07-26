# Neutral Side 03 — canonical-colour regeneration

Built with the image-generation workflow in identity-preserving stylized game-art mode.

## Reference roles

- `hugo-2d-sunrise-01-neutral-front.png`: canonical identity, healthy skin tone, face, Sunrise palette, materials, and lighting.
- `hugo-2d-sunrise-02-ready-profile.png`: canonical side-profile identity, face, skin, hair, and outfit colour.
- `hugo-sunrise-side-01-neutral-side.png`: Version 03 screen-right silhouette, proportions, body registration, and black shoe design.
- The previous four Neutral Side 03 drawings: pose geometry only. Their yellow/olive colour cast was explicitly excluded.

## Generation prompt

Create one strict 4-column × 1-row game-animation sheet containing exactly four complete full-body drawings of Hugo, ordered left to right, for Neutral Side 03.

Lock Hugo's identity, healthy warm natural tan/peach skin, warm brown hair, lighting, and burnt-orange, cream, gold, and teal Sunrise wingsuit colours to the canonical Outfit 03 Sunrise neutral-front and ready-profile references. Use the Version 03 neutral-side reference for the screen-right silhouette, proportions, registration, and black sculpted shoes. Use the existing four approved drawings only as pose geometry; do not inherit their yellow, olive, green, grey, or sickly colour cast.

Draw:

1. Neutral upright profile, head level.
2. The same pose with a tiny restrained 20% downward nod.
3. The same pose with a restrained 40% downward nod.
4. The same pose with a restrained 60% downward nod; do not lower farther.

Only the head and neck angle change. Keep the complete body, scale, baseline, lighting, and colour consistent. Use a flat `#FF00FF` chroma background with generous gutters. No crop, fragments, text, borders, extra limbs, extra objects, or watermark. Exactly one complete Hugo per cell.

## Processing

The four complete figures are removed from the chroma background, cut into four individual transparent PNG files, and deterministically registered by shoe anchor on a shared 512 × 512 canvas. No head-only overlay, frozen-body composite, body-part mask, or runtime sprite-sheet slicing is used.

## Final targeted colour pass

The first generation removed the original green/olive cast but remained too
lemon-yellow beside the canonical Sunrise face. A targeted second pass froze
the four approved poses and corrected the identity palette with this brief:

> Freeze the exact four complete full-body screen-right poses, nod angles,
> order, body silhouette, black shoes, scale, baseline, spacing, and rendering.
> Repaint every visible skin area—face, ear, neck, and hands—to match the
> healthy warm natural medium peach/tan skin of the canonical Outfit 03 Sunrise
> neutral-front and ready-profile art. Make the skin visibly more peach,
> reddish-brown, and naturally tan, and visibly less yellow. Use no lemon,
> olive, green, grey, cyan, jaundiced, sickly, or artificial cast. Lock the hair
> to canonical deep warm chocolate brown and keep the outfit in saturated burnt
> orange, clean warm cream, gold, and dark teal. Keep exactly four complete
> figures on a uniform `#FF00FF` background with no other content.
