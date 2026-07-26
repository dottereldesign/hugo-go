"""Build exact A / blank target / B boards for neutral-idle in-betweens.

Each row contains the actual registered outgoing and incoming production frames.
The centre cell is deliberately empty chroma space for ImageGen to fill. This
keeps interpolation requests grounded in the adjacent pair instead of asking a
model to recreate a whole animation from prose.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
FRAMES = (
    ROOT
    / "src"
    / "assets"
    / "game"
    / "2d-v02"
    / "animations"
    / "neutral-idle"
    / "frames"
)
OUTPUT = (
    ROOT
    / "art"
    / "source-images"
    / "game"
    / "2d-v02"
    / "animations"
    / "neutral-idle"
    / "inbetween-v2"
)
CELL = 512
COLUMNS = 3
ROWS = 4
CHROMA = (255, 0, 255, 255)


FRAME_FILES = {
    3: "hugo-neutral-idle-03-weight-shift.png",
    4: "hugo-neutral-idle-04-toe-tap-anticipation.png",
    6: "hugo-neutral-idle-06-toe-tap-rise.png",
    7: "hugo-neutral-idle-07-gum-chew.png",
    10: "hugo-neutral-idle-10-bubble-medium.png",
    11: "hugo-neutral-idle-11-bubble-large.png",
    14: "hugo-neutral-idle-14-stunned-blink.png",
    15: "hugo-neutral-idle-15-annoyed-anticipation.png",
    16: "hugo-neutral-idle-16-hand-rise.png",
    17: "hugo-neutral-idle-17-gum-contact.png",
    18: "hugo-neutral-idle-18-gum-peel.png",
    19: "hugo-neutral-idle-19-gum-stretch.png",
    20: "hugo-neutral-idle-20-gum-free.png",
    22: "hugo-neutral-idle-22-bored-eye-roll.png",
    23: "hugo-neutral-idle-23-settle.png",
}


BOARDS = (
    {
        "id": "a",
        "rows": (
            (3, 4, "weight-to-toe-mid", "50% between weight shift and toe-lift anticipation"),
            (6, 7, "toe-settle", "50% between raised toe and both shoes grounded"),
            (10, 11, "bubble-medium-large", "50% bubble size between medium and large"),
            (14, 15, "stunned-to-annoyed", "50% expression and head turn"),
        ),
    },
    {
        "id": "b",
        "rows": (
            (15, 16, "arm-rise-half", "right hand halfway from side to face on a clean arc"),
            (16, 17, "reach-close", "right hand halfway from raised position to gum contact"),
            (17, 18, "peel-start", "first visible peel with gum still mostly on the face"),
            (18, 19, "stretch-mid", "halfway arm extension and elastic gum length"),
        ),
    },
    {
        "id": "c",
        "rows": (
            (19, 20, "detach-recoil", "gum just detached; right hand recoiling halfway inward"),
            (20, 22, "inspect-to-eye-roll", "right wrist and elbow halfway lowering; exactly two arms"),
            (22, 23, "gum-flick", "one-third transition: wrist flicks purple gum away"),
            (22, 23, "arm-lower", "two-thirds transition: gum is gone and right arm is halfway down"),
        ),
    },
)


def place_reference(board: Image.Image, frame_number: int, column: int, row: int) -> None:
    frame = Image.open(FRAMES / FRAME_FILES[frame_number]).convert("RGBA")
    alpha_bounds = frame.getchannel("A").getbbox()
    if alpha_bounds is None:
        raise ValueError(f"Frame {frame_number} has no visible pixels")
    figure = frame.crop(alpha_bounds)
    scale = min(458 / figure.width, 458 / figure.height)
    size = (round(figure.width * scale), round(figure.height * scale))
    figure = figure.resize(size, Image.Resampling.LANCZOS)
    x = column * CELL + (CELL - figure.width) // 2
    y = row * CELL + CELL - 26 - figure.height
    board.alpha_composite(figure, (x, y))


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest_boards: list[dict[str, object]] = []
    for definition in BOARDS:
        board = Image.new("RGBA", (COLUMNS * CELL, ROWS * CELL), CHROMA)
        rows: list[dict[str, object]] = []
        for row_index, (start, end, slug, instruction) in enumerate(definition["rows"]):
            place_reference(board, start, 0, row_index)
            place_reference(board, end, 2, row_index)
            rows.append(
                {
                    "row": row_index + 1,
                    "outgoingFrame": start,
                    "targetColumn": 2,
                    "incomingFrame": end,
                    "slug": slug,
                    "instruction": instruction,
                }
            )
        filename = f"hugo-neutral-idle-inbetween-board-{definition['id']}-input.png"
        path = OUTPUT / filename
        board.convert("RGB").save(path, optimize=True)
        manifest_boards.append(
            {
                "id": definition["id"],
                "file": path.relative_to(ROOT).as_posix(),
                "layout": {
                    "columns": COLUMNS,
                    "rows": ROWS,
                    "cellSize": CELL,
                    "outgoingColumn": 1,
                    "targetColumn": 2,
                    "incomingColumn": 3,
                },
                "rows": rows,
            }
        )

    manifest = {
        "schemaVersion": 1,
        "animation": "neutral-idle",
        "method": "exact-adjacent-production-frames-with-blank-middle-target",
        "background": "#ff00ff",
        "boards": manifest_boards,
    }
    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(manifest_boards)} A/target/B reference boards to {OUTPUT}")


if __name__ == "__main__":
    main()
