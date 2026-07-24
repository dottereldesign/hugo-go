# Animation and art ledger

No image required for the current Forest game is missing.

## Completed now

- One season-neutral illustrated Forest background.
- Spring, Summer, Autumn, and Winter grading from that single image.
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
- One airborne shoe-jet pose.

The run cycle plays at 12 fps and repeats every `0.667 s`. Thirty unique running drawings are unnecessary: they would make the atlas roughly four times heavier while most frames would only interpolate between the eight key poses. The current eight cover every biomechanical phase needed for a smooth loop.

## Recommended next animation frames

These are optional improvements, in priority order.

### 1. Takeoff transition — 2 frames

- crouched ground compression with thrusters beginning to glow;
- toe-off with short ignition flames.

### 2. Landing transition — 2 frames

- descending feet-forward pose with shrinking flames;
- soft ground recovery pose returning to run contact.

### 3. Flight variation — 3 frames

- boost anticipation with knees tucked slightly;
- full-thrust pose with longer compact flames;
- steady glide with shorter flames.

### 4. Non-injury game-over reaction — 2 frames

- surprised midair wobble;
- safe seated/soft tumble result pose.

That is **9 useful future character frames**, not 30 more run frames.

## Optional authored obstacle set

- rimu stump;
- mossy boulder;
- fallen log/root cluster;
- dense flowering bramble.

Every obstacle image must fill a documented rectangular collision silhouette, contain no transparent hole inside its solid body, and use no Māori pattern or motif.

## Optional effects

- compact shoe-jet ignition burst;
- coin pickup sparkle;
- new-best celebration;
- soft landing dust/petals.

Effects should use small consistent sprite-sheet cells and transparent backgrounds. Avoid large smoke clouds that hide collision space.

## Future world art

Do not generate Workshop, Word, Number, Space, or Music gameplay art until each course has approved mechanics and collision geometry. Their current home cards are sufficient for **Coming soon**.

## Identity prompt guardrail

Every Hugo prompt must include: “same exact Hugo identity; natural non-caricatured facial anatomy; no exaggerated eye shape or ethnic stereotype; no franchise costume; no weapon; no Māori pattern.”
