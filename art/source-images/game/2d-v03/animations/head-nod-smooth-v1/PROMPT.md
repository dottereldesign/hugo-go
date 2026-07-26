# Neutral Side midpoint experiment

Built with the built-in image-generation workflow in identity-preserving
stylized game-art mode.

## Generation prompt

Create one strict 3-column × 1-row character sheet containing exactly three
complete full-body Hugo drawings. Use the approved Neutral Side 03 drawings at
nod depths 0%, 20%, 40%, and 60% as the motion guide.

Generate:

1. An exact 10% nod, halfway between approved 0% and 20%.
2. An exact 30% nod, halfway between approved 20% and 40%.
3. An exact 50% nod, halfway between approved 40% and 60%.

Interpolate the head and neck angle, chin height, nose direction, eye line, ear
angle, hair silhouette angle, and neck compression exactly halfway between
each adjacent approved pair. The complete progression must read as evenly
spaced angular increments with no overshoot, reversal, sideways turn, or body
lean.

Redraw the complete figure in every cell. Keep everything below the neck
unchanged: identical standing pose, arms, hands, legs, black shoes, scale,
baseline, centre, Sunrise outfit, lighting, and colour. Match the canonical
Outfit 03 Sunrise identity and healthy warm peach/tan skin with no yellow,
olive, green, grey, or sickly cast.

Use one perfectly flat uniform `#FF00FF` chroma background with generous
gutters. No crop, fragments, text, labels, numbers, borders, shadows, extra
limbs, extra objects, or watermark. Exactly one complete Hugo per cell.

## Runtime assembly

The three complete generated midpoints are cut into separate transparent PNGs,
registered by whole-figure shoe anchor, and placed between the four approved
drawings:

`0%, 10%, 20%, 30%, 40%, 50%, 60%, 50%, 40%, 30%, 20%, 10%`

The 12-step loop runs at 12 FPS, preserving the original 1.00-second duration.
No head-only overlay, body-part mask, code interpolation, or runtime sheet
slicing is used.
