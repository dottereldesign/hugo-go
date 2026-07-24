# Gameplay asset generation and processing

## Current generated assets

The playable release uses an original Hugo flight pose, an eight-pose run sheet, and one season-neutral Forest background. Full generation and alpha sources are retained:

```text
art/source-images/game/hugo-flight-magenta.png
art/source-images/game/hugo-flight-transparent.png
art/source-images/game/hugo-run-magenta.png
art/source-images/game/hugo-run-transparent.png
art/source-images/game/hugo-run-sheet-magenta.png
art/source-images/game/hugo-run-sheet-transparent.png
art/source-images/game/forest-season-source.png
src/assets/game/hugo-flight.webp
src/assets/game/hugo-run-cycle.webp
src/assets/game/forest-season-base.webp
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

1. finds four occupied sheet rows and two poses per row;
2. extracts all eight generated bodies without relying on hard-coded source coordinates;
3. normalizes them to eight `384 × 320` cells;
4. writes one `1536 × 640` exact-alpha WebP atlas;
5. trims and compresses the flight sprite;
6. compresses the Forest plate to a `1024 × 1536` WebP.

Current runtime sizes are approximately:

- flight sprite: 67 KB;
- eight-frame run atlas: 167 KB;
- Forest background: 308 KB.

The single-pose run WebP is retired from runtime. The eight-frame atlas costs one request and about 93 KB more, while providing the complete natural stride.

## Generated and procedural scene art

Mountain, forest, tree, blossom, and fern scenery comes from the generated Forest background. Ground, coins, seasonal particles, and obstacles remain Canvas drawings. This is deliberate:

- collision silhouettes remain tied to the same rectangles the player sees;
- one backdrop can be season-graded without four decoded textures;
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
