# Gameplay asset generation and processing

## Current generated assets

The first playable release requires two original Hugo poses. Both were generated specifically for this project and are stored with their full source images:

```text
art/source-images/game/hugo-flight-magenta.png
art/source-images/game/hugo-run-magenta.png
art/source-images/game/hugo-flight-transparent.png
art/source-images/game/hugo-run-transparent.png
src/assets/game/hugo-flight.webp
src/assets/game/hugo-run.webp
```

The exact prompts are recorded in `art/source-images/game/PROMPTS.md`.

## Processing pipeline

The generated poses use a flat magenta background. It is removed with the image-generation skill’s chroma-key helper using:

```text
--auto-key border
--soft-matte
--transparent-threshold 12
--opaque-threshold 220
--despill
```

`scripts/process_game_assets.py` then:

1. finds the non-transparent alpha bounds;
2. keeps an eight-pixel edge pad;
3. resizes to a maximum 768px height;
4. writes high-quality exact-alpha WebP runtime files.

The resulting runtime sprites are roughly 142 KB combined rather than roughly 1.4 MB combined.

## Procedural scene art

Background, ground, coins, particles, and obstacles are currently Canvas drawings. This is deliberate:

- collision silhouettes remain tied to the same rectangles the player sees;
- scenery can parallax without extra downloads;
- the portrait layout scales cleanly;
- color and motion can be adjusted without regenerating artwork.

Do not replace an obstacle with art whose visible silhouette is smaller than its collision bounds. If authored obstacle art is added, record per-sprite collision insets and test every edge.

## Character direction

Hugo should stay consistent with the current source:

- 10-year-old Japanese/New Zealand boy;
- natural, non-caricatured facial features;
- chunky wind-swept dark hair that keys cleanly;
- teal flight jacket, cream shirt, navy shorts/leggings;
- white and teal sneakers with compact heel/sole jets;
- subtle silver fern leaf badge and red circular badge;
- no ethnic stereotype, exaggerated eye treatment, costume shorthand, weapon, or franchise-specific design.

## Cultural guardrails

New Zealand and Japanese nature cues are welcome. Do not generate or introduce Māori patterns or motifs. Avoid a generic “Asian” visual category; prompts should describe Hugo as the same specific child and preserve his established identity.

Optional future generation is specified in `docs/ART_BACKLOG.md`. No required playable asset is missing from the current Forest release.
