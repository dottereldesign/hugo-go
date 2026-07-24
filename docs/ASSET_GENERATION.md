# HUGO GO! art pipeline

## Current runtime artwork

The live application uses:

```text
src/assets/home/background/   illustrated home and placeholder backdrop
src/assets/home/icons/        profile and quick-action art
src/assets/home/panels/       feature-card art
src/assets/home/worlds/       the six retained learning-world cards
src/assets/ui/                shared modal controls and textures
public/assets/                static store badges
public/audio/                 music and interface sounds
```

Source-quality images and prompt records live under `art/` and are not bundled unless imported.

## Home-screen rules

- HUGO GO! lettering remains editable HTML/CSS, not raster text.
- Generated images should not contain logos, interface labels, or watermarks.
- Preserve the existing deep navy, cyan, yellow, green, and purple palette.
- Keep character and world subjects readable at small mobile sizes.
- Export runtime images as WebP when transparency and quality allow.

Rebuild processed home assets with:

```text
python scripts/process_home_assets.py
```

## Future flight assets

The playable game will need a new, focused asset set:

```text
src/assets/flight/hugo/        flap, glide, boost, hit, and celebration states
src/assets/flight/obstacles/   readable world-specific hazards
src/assets/flight/pickups/     boost, score, and discovery items
src/assets/flight/effects/     restrained boost and collision effects
src/assets/flight/backgrounds/ parallax layers by world
```

Author the first world before creating a full content library. Every obstacle must have a clean collision silhouette and remain legible against its background.

## Prompt guidance

Future prompts should describe:

- a cheerful original flight hero named Hugo;
- chunky mobile-game forms;
- strong silhouettes;
- side-view readability;
- consistent camera and lighting;
- transparent backgrounds for gameplay sprites;
- no text, logos, UI, or watermarks.

Keep prompt records beside source art so results can be reproduced.
