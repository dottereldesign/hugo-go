"""Build exact A / blank / B boards for every neutral-idle 24 FPS bridge.

Each centre cell is a single bounded interpolation request. The surrounding
drawings are current production PNGs, not regenerated lookalikes, so no new
sheet can be shuffled into the established chronology.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
ANIMATION_ROOT = ROOT / "src" / "assets" / "game" / "2d-v02" / "animations" / "neutral-idle"
OUTPUT_ROOT = (
    ROOT
    / "art"
    / "source-images"
    / "game"
    / "2d-v02"
    / "animations"
    / "neutral-idle"
    / "24fps-bridges"
)
CELL = 512
COLS = 3
ROWS = 4
MAGENTA = (255, 0, 255, 255)


def place(canvas: Image.Image, frame: Image.Image, column: int, row: int) -> None:
    # Scale the complete registered canvas rather than re-centering alpha. This
    # preserves the already-approved torso-root registration in the endpoint
    # reference cells.
    reference = frame.resize((CELL, CELL), Image.Resampling.LANCZOS)
    canvas.alpha_composite(reference, (column * CELL, row * CELL))


def main() -> None:
    manifest = json.loads((ANIMATION_ROOT / "manifest.json").read_text(encoding="utf-8"))
    runtime = [frame for frame in manifest["frames"] if frame["runtime"]]
    if len(runtime) != 34:
        raise ValueError(f"Expected 34 stabilized base drawings, found {len(runtime)}")
    frames = {
        int(frame["index"]): Image.open(ROOT / str(frame["file"])).convert("RGBA")
        for frame in runtime
    }
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    bridge_pairs = [
        (runtime[index], runtime[(index + 1) % len(runtime)])
        for index in range(len(runtime))
    ]
    boards: list[dict[str, object]] = []
    for board_index in range(0, len(bridge_pairs), ROWS):
        board_id = chr(ord("a") + board_index // ROWS)
        canvas = Image.new("RGBA", (CELL * COLS, CELL * ROWS), MAGENTA)
        rows: list[dict[str, object]] = []
        for local_row, (outgoing, incoming) in enumerate(bridge_pairs[board_index : board_index + ROWS]):
            place(canvas, frames[int(outgoing["index"])], 0, local_row)
            place(canvas, frames[int(incoming["index"])], 2, local_row)
            rows.append(
                {
                    "row": local_row + 1,
                    "outgoingFrame": int(outgoing["index"]),
                    "outgoingSlug": outgoing["slug"],
                    "incomingFrame": int(incoming["index"]),
                    "incomingSlug": incoming["slug"],
                    "targetColumn": 2,
                    "fraction": "50% temporal midpoint",
                }
            )
        filename = f"hugo-neutral-idle-24fps-bridge-board-{board_id}-input.png"
        canvas.convert("RGB").save(OUTPUT_ROOT / filename, optimize=True)
        boards.append(
            {
                "id": board_id,
                "file": (OUTPUT_ROOT / filename).relative_to(ROOT).as_posix(),
                "layout": {
                    "columns": COLS,
                    "rows": ROWS,
                    "cellSize": CELL,
                    "outgoingColumn": 1,
                    "targetColumn": 2,
                    "incomingColumn": 3,
                },
                "rows": rows,
            }
        )
    (OUTPUT_ROOT / "manifest.json").write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "animation": "neutral-idle",
                "purpose": "24fps-adjacent-pair-bridges",
                "background": "#ff00ff",
                "baseRuntimeFrameCount": len(runtime),
                "bridgeCount": len(bridge_pairs),
                "boards": boards,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(boards)} bridge boards for {len(bridge_pairs)} adjacent pairs to {OUTPUT_ROOT}")


if __name__ == "__main__":
    main()
