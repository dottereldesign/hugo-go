"""Extract the generated Version 03 side-profile extension sheets."""
from __future__ import annotations

import json
from hashlib import sha256
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "art/source-images/game/2d-v03/sunrise-side"
OUTPUT_DIR = ROOT / "src/assets/game/2d-v03/sunrise-side/poses"
MANIFEST_PATH = OUTPUT_DIR.parent / "extensions-manifest.json"


@dataclass(frozen=True)
class Pose:
    index: int
    source: str
    cell: int
    slug: str
    label: str


POSES = (
    Pose(13, "hugo-sunrise-side-parkour-poses-transparent.png", 1, "arms-back-dash", "Arms-back dash"),
    Pose(14, "hugo-sunrise-side-parkour-poses-transparent.png", 2, "stealth-crouch", "Stealth crouch"),
    Pose(15, "hugo-sunrise-side-parkour-poses-transparent.png", 3, "knee-slide", "Knee slide"),
    Pose(16, "hugo-sunrise-side-parkour-poses-transparent.png", 4, "ground-slide", "Ground slide"),
    Pose(17, "hugo-sunrise-side-parkour-poses-transparent.png", 5, "roll-entry", "Roll entry"),
    Pose(18, "hugo-sunrise-side-parkour-poses-transparent.png", 6, "somersault-tuck", "Somersault tuck"),
    Pose(19, "hugo-sunrise-side-parkour-poses-transparent.png", 7, "roll-recovery", "Roll recovery"),
    Pose(20, "hugo-sunrise-side-parkour-poses-transparent.png", 8, "shoulder-roll", "Shoulder roll"),
    Pose(21, "hugo-sunrise-side-parkour-poses-transparent.png", 9, "speed-vault", "Speed vault"),
    Pose(22, "hugo-sunrise-side-parkour-poses-transparent.png", 10, "lazy-vault", "Lazy vault"),
    Pose(23, "hugo-sunrise-side-parkour-poses-transparent.png", 11, "kong-vault", "Kong vault"),
    Pose(24, "hugo-sunrise-side-parkour-poses-transparent.png", 12, "precision-landing", "Precision landing"),
    Pose(25, "hugo-sunrise-side-wall-expression-poses-transparent.png", 1, "wall-run", "Wall run"),
    Pose(26, "hugo-sunrise-side-wall-expression-poses-transparent.png", 2, "ledge-reach", "Ledge reach"),
    Pose(27, "hugo-sunrise-side-wall-expression-poses-transparent.png", 3, "wall-brace", "Wall brace"),
    Pose(28, "hugo-sunrise-side-wall-expression-poses-transparent.png", 4, "wall-collision", "Wall collision"),
    Pose(29, "hugo-sunrise-side-wall-expression-poses-transparent.png", 7, "cheeky-wall-peek", "Cheeky wall peek"),
    Pose(30, "hugo-sunrise-side-wall-expression-poses-transparent.png", 8, "guarded-wall-charge", "Guarded wall charge"),
    Pose(31, "hugo-sunrise-side-shallow-dive-v2-transparent.png", 0, "shallow-dive", "Shallow dive"),
    Pose(32, "hugo-sunrise-side-wall-expression-poses-transparent.png", 10, "air-recovery-curl", "Air recovery curl"),
    Pose(33, "hugo-sunrise-side-wall-expression-poses-transparent.png", 11, "thumbs-up", "Thumbs up"),
    Pose(34, "hugo-sunrise-side-wall-expression-poses-transparent.png", 12, "finger-guns", "Finger guns"),
)


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.convert("RGBA"))[:, :, 3]
    ys, xs = np.where(alpha > 8)
    if not len(xs):
        raise ValueError("Empty pose cell")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def validate_figure(image: Image.Image, pose: Pose) -> tuple[int, int, int, int]:
    rgba = np.asarray(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    bounds = alpha_bounds(image)
    if bounds[0] <= 1 or bounds[1] <= 1 or bounds[2] >= image.width - 1 or bounds[3] >= image.height - 1:
        raise ValueError(f"Pose {pose.index:02d}: artwork reaches output edge {bounds}")

    count, _, stats, _ = cv2.connectedComponentsWithStats((alpha > 8).astype(np.uint8), 8)
    areas = sorted(
        (int(stats[label, cv2.CC_STAT_AREA]) for label in range(1, count)),
        reverse=True,
    )
    if not areas or areas[0] < 8_000:
        raise ValueError(f"Pose {pose.index:02d}: incomplete figure {areas[:4]}")
    if len(areas) > 1 and areas[1] > 1_200:
        raise ValueError(f"Pose {pose.index:02d}: detached artwork {areas[:4]}")
    return bounds


def extract_pose(sheet: Image.Image, pose: Pose) -> tuple[Image.Image, tuple[int, int, int, int]]:
    standalone = pose.cell == 0
    if standalone:
        cell = sheet
    else:
        if sheet.width % 4 or sheet.height % 3:
            raise ValueError(f"{pose.source}: expected a divisible 4 x 3 sheet, got {sheet.size}")
        cell_width = sheet.width // 4
        cell_height = sheet.height // 3
        if cell_width != cell_height:
            raise ValueError(f"{pose.source}: expected square cells, got {cell_width} x {cell_height}")

        row, column = divmod(pose.cell - 1, 4)
        cell = sheet.crop(
            (
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                (row + 1) * cell_height,
            )
        )
    left, top, right, bottom = alpha_bounds(cell)
    padding = 5
    figure = cell.crop(
        (
            max(0, left - padding),
            max(0, top - padding),
            min(cell.width, right + padding),
            min(cell.height, bottom + padding),
        )
    )
    if standalone and max(figure.size) > 300:
        scale = 300 / max(figure.size)
        figure = figure.resize(
            (
                round(figure.width * scale),
                round(figure.height * scale),
            ),
            Image.Resampling.LANCZOS,
        )

    canvas = Image.new("RGBA", (512, 512))
    target_x = (canvas.width - figure.width) // 2
    target_y = (canvas.height - figure.height) // 2
    canvas.alpha_composite(figure, (target_x, target_y))
    rgba = np.asarray(canvas).copy()
    rgba[rgba[:, :, 3] == 0, :3] = 0
    output = Image.fromarray(rgba)
    return output, validate_figure(output, pose)


def main() -> None:
    sources = {
        source: Image.open(SOURCE_DIR / source).convert("RGBA")
        for source in {pose.source for pose in POSES}
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, object]] = []

    for pose in POSES:
        output, bounds = extract_pose(sources[pose.source], pose)
        filename = f"hugo-sunrise-side-{pose.index:02d}-{pose.slug}.png"
        output_path = OUTPUT_DIR / filename
        output.save(output_path, optimize=True)
        row, column = divmod(pose.cell - 1, 4) if pose.cell else (None, None)
        manifest.append(
            {
                "index": pose.index,
                "slug": pose.slug,
                "label": pose.label,
                "filename": filename,
                "source": str((SOURCE_DIR / pose.source).relative_to(ROOT)).replace("\\", "/"),
                "sourceCell": pose.cell or None,
                "row": row + 1 if row is not None else None,
                "column": column + 1 if column is not None else None,
                "outputCanvas": [output.width, output.height],
                "alphaBounds": list(bounds),
                "sha256": sha256(output_path.read_bytes()).hexdigest(),
            }
        )

    MANIFEST_PATH.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "library": "Version 03 Sunrise side-profile extensions",
                "poseCount": len(POSES),
                "poses": manifest,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Extracted {len(POSES)} side-profile extension poses")


if __name__ == "__main__":
    main()
