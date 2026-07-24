# Optional art generation backlog

No image required for the current Forest game is missing. Hugo’s run and flight poses are generated, processed, and used at runtime. The Forest environment and hazards are intentionally procedural.

The following assets would improve a later release, but were deferred to keep identity consistency, download size, and collision readability under control.

## 1. Hugo run cycle

Create six transparent frames using `hugo-run-magenta.png` as the exact identity reference:

- contact;
- down;
- passing;
- up;
- opposite contact;
- opposite passing.

Keep the same forward lean and arms-back silhouette. Shoe jets remain inactive. Every frame needs the same crop, ground line, scale, face, clothing, and lighting.

## 2. Hugo flight reactions

Create three matching transparent poses from `hugo-flight-magenta.png`:

- boost anticipation with knees slightly compressed;
- steady glide with shorter flames;
- safe landing recovery with no flame.

Do not add smoke that obscures the body collision area. Do not create a violent crash pose; a surprised, non-injury stumble is sufficient.

## 3. Forest obstacle set

Optional authored obstacle sprites:

- rimu stump;
- mossy boulder;
- fallen log/root cluster;
- dense flowering bramble.

Each must be side-view, fill a documented rectangular silhouette, have no transparent holes inside the collision body, and use no Māori pattern or motif. Generate on chroma and preserve exact collision inset metadata.

## 4. Effects

- compact shoe-jet ignition burst;
- coin pickup sparkle;
- new-best celebration;
- soft landing dust/petals.

Effects should be sprite sheets with consistent frame cells and transparent backgrounds. Avoid large smoke clouds.

## 5. Future world art

Do not generate Workshop, Word, Number, Space, or Music gameplay art until each course has approved mechanics and collision geometry. Their current home cards are sufficient for **Coming soon**.

## Identity prompt guardrail

Every Hugo prompt must include: “same exact Hugo identity; natural non-caricatured facial anatomy; no exaggerated eye shape or ethnic stereotype; no franchise costume; no weapon; no Māori pattern.”
