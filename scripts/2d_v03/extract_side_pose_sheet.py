"""Extract the Version 03 Sunrise side-profile 4 x 3 character sheet."""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = (
    ROOT
    / "art/source-images/game/2d-v03/sunrise-side"
    / "hugo-sunrise-side-poses-transparent.png"
)
OUTPUT = ROOT / "src/assets/game/2d-v03/sunrise-side/poses"

POSES = (
    ("neutral-side", "Neutral side"),
    ("confident-walk", "Confident walk"),
    ("fast-sprint", "Fast sprint"),
    ("sprint-launch", "Sprint launch"),
    ("jump-takeoff", "Jump takeoff"),
    ("jump-tuck", "Jump tuck"),
    ("level-glide", "Level glide"),
    ("steep-dive", "Steep dive"),
    ("jet-boost", "Jet boost"),
    ("braking-flare", "Braking flare"),
    ("landing-crouch", "Landing crouch"),
    ("hero-finish", "Hero finish"),
)


def validate_cell(image: Image.Image, index: int) -> tuple[int, int, int, int]:
    rgba = np.asarray(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    ys, xs = np.where(alpha > 8)
    if not len(xs):
        raise ValueError(f"Pose {index:02d}: empty cell")
    bounds = (int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1))
    if bounds[0] <= 1 or bounds[1] <= 1 or bounds[2] >= image.width - 1 or bounds[3] >= image.height - 1:
        raise ValueError(f"Pose {index:02d}: artwork reaches cell edge {bounds}")
    count, _, stats, _ = cv2.connectedComponentsWithStats((alpha > 8).astype(np.uint8), 8)
    areas = sorted(
        (int(stats[label, cv2.CC_STAT_AREA]) for label in range(1, count)),
        reverse=True,
    )
    if not areas or areas[0] < 8_000:
        raise ValueError(f"Pose {index:02d}: incomplete figure {areas[:4]}")
    if len(areas) > 1 and areas[1] > 650:
        raise ValueError(f"Pose {index:02d}: detached artwork {areas[:4]}")
    return bounds


def extract_figures(sheet: Image.Image, cell_width: int, cell_height: int) -> dict[int, Image.Image]:
    rgba = np.asarray(sheet)
    alpha = rgba[:, :, 3]
    count, _, stats, centroids = cv2.connectedComponentsWithStats(
        (alpha > 8).astype(np.uint8),
        8,
    )
    components = [
        label
        for label in range(1, count)
        if int(stats[label, cv2.CC_STAT_AREA]) >= 8_000
    ]
    if len(components) != 12:
        raise ValueError(f"Expected 12 complete figures, found {len(components)}")

    figures: dict[int, Image.Image] = {}
    for label in components:
        centre_x, centre_y = centroids[label]
        column = min(3, max(0, int(centre_x // cell_width)))
        row = min(2, max(0, int(centre_y // cell_height)))
        cell_index = row * 4 + column
        if cell_index in figures:
            raise ValueError(f"Multiple figures assigned to cell {cell_index + 1:02d}")

        x = int(stats[label, cv2.CC_STAT_LEFT])
        y = int(stats[label, cv2.CC_STAT_TOP])
        width = int(stats[label, cv2.CC_STAT_WIDTH])
        height = int(stats[label, cv2.CC_STAT_HEIGHT])
        padding = 5
        left = max(0, x - padding)
        top = max(0, y - padding)
        right = min(sheet.width, x + width + padding)
        bottom = min(sheet.height, y + height + padding)
        figure = sheet.crop((left, top, right, bottom))

        canvas = Image.new("RGBA", (512, 512))
        target_x = (canvas.width - figure.width) // 2
        target_y = (canvas.height - figure.height) // 2
        canvas.alpha_composite(figure, (target_x, target_y))
        figures[cell_index] = canvas

    if set(figures) != set(range(12)):
        missing = sorted(set(range(12)) - set(figures))
        raise ValueError(f"Missing authored cells: {[value + 1 for value in missing]}")
    return figures


def main() -> None:
    sheet = Image.open(SOURCE).convert("RGBA")
    if sheet.width % 4 or sheet.height % 3:
        raise ValueError(f"Sheet must divide exactly into 4 x 3 cells, got {sheet.size}")
    cell_width = sheet.width // 4
    cell_height = sheet.height // 3
    if cell_width != cell_height:
        raise ValueError(f"Cells must be square, got {cell_width} x {cell_height}")

    figures = extract_figures(sheet, cell_width, cell_height)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, object]] = []
    for offset, (slug, label) in enumerate(POSES):
        row, column = divmod(offset, 4)
        cell = figures[offset]
        rgba = np.asarray(cell).copy()
        rgba[rgba[:, :, 3] == 0, :3] = 0
        cell = Image.fromarray(rgba)
        bounds = validate_cell(cell, offset + 1)
        filename = f"hugo-sunrise-side-{offset + 1:02d}-{slug}.png"
        cell.save(OUTPUT / filename, optimize=True)
        manifest.append(
            {
                "index": offset + 1,
                "slug": slug,
                "label": label,
                "filename": filename,
                "row": row + 1,
                "column": column + 1,
                "cellSize": [cell_width, cell_height],
                "outputCanvas": [cell.width, cell.height],
                "alphaBounds": list(bounds),
            }
        )

    (OUTPUT.parent / "manifest.json").write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "library": "Version 03 Sunrise side profiles",
                "source": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
                "grid": {"columns": 4, "rows": 3, "poseCount": 12},
                "poses": manifest,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(
        f"Extracted {len(POSES)} complete components from "
        f"{cell_width} x {cell_height} authored cells"
    )


if __name__ == "__main__":
    main()
