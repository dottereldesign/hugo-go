# HUGO GO! home-screen image prompts

These assets were generated individually with the built-in image-generation workflow. All interface borders, labels, counters, badges, buttons, and the `HUGO GO!` wordmark are HTML/CSS; generated images intentionally contain no text.

Runtime outputs live under `src/assets/home/`:

- `background/` — full-screen environment art
- `icons/` — transparent profile and activity cutouts
- `panels/` — event and crew illustrations
- `worlds/` — portrait illustrations for the six learning worlds

## Shared visual direction

> Polished glossy 3D mobile-game art for a family-friendly flight adventure. Use chunky rounded toy forms, clean dark navy outlines, beveled materials, saturated color, strong readable silhouettes, cinematic cyan and gold rim lighting, and an original cast. No letters, numbers, readable text, interface chrome, logos, or watermarks.

Transparent icons use a perfectly flat solid `#ff00ff` chroma-key background with no gradient, floor, shadow, texture, reflection, or magenta in the subject.

## Background

### `home-background.png`

> Cinematic whimsical launch room inside a magical learning fortress, viewed straight-on toward a huge warm glowing central portal. Shadowy toy-like shelves and oversized learning objects at the side edges; lush leaves and subtle blue crystals along the bottom corners. Deep navy framing around a radiant peach, lavender, cyan, and golden central glow. Landscape composition with the brightest center reserved as clean negative space for a coded logo and play controls, quiet side zones for panels, and a darker lower card band. Environment only; no characters or UI.

## Profile and activity icons

- `profile-avatar-magenta.png` — Hugo, a friendly heroic acorn flight explorer shown from the chest up, with oversized teal adventure goggles and a joyful grin.
- `missions-magenta.png` — chunky mission clipboard with check marks and a gold star badge.
- `daily-rewards-magenta.png` — wrapped turquoise reward chest with a golden bow.
- `achievements-magenta.png` — golden trophy with a cyan jewel.
- `collection-magenta.png` — fanned stack of collectible learning cards.

## Feature panels

- `summer-event.png` — a mischievous lime-green mold creature emerging from a summer picnic cooler; active subject on the right and clear copy space on the left.
- `squad.png` — heroic lineup of four friendly flight-world companions against a navy-to-teal glow.

## World cards

All world prompts use portrait-friendly, full-bleed compositions with centered focal characters, readable silhouettes, layered depth, safe margins, and no generated border or labels.

- `world-forest.png` — enchanted forest, oak guardian, mushroom scouts, ferns, flowers, and drifting seed currents.
- `world-workshop.png` — whimsical flying workshop with a cheerful robot inventor, gears, fans, pipes, and teal energy.
- `world-word.png` — magical storybook realm with blank parchment, quills, speech ribbons, and colorful abstract blocks.
- `world-number.png` — logic-and-pattern garden with geometric companions, beads, nested shapes, and repeating paths.
- `world-space.png` — friendly rocket explorer, moon companion, planets, asteroids, orbit trails, and a glowing gateway.
- `world-music.png` — instrument companions on a glowing stage surrounded by rhythmic light ribbons and colored orbs.

After removing chroma keys into `tmp/imagegen/home-alpha/`, rebuild optimized runtime assets with `python scripts/process_home_assets.py`.

## HUGO GO! brand icon

The master icon is a wordless magical flight-and-discovery emblem:

- `public/favicon.webp` — 64 × 64 favicon
- `public/hugo-go-icon-512.webp` — 512 × 512 app icon

> Create one bold magical blue hat with a playful curled tip and a gold four-point discovery sparkle, centered inside a chunky circular badge. Use polished glossy 3D mobile-game materials, dark navy outlines, cyan, electric blue, gold, royal purple, and one small lime accent. Keep the silhouette readable at 16 pixels. No words, letters, numbers, faces, extra objects, or watermark.
