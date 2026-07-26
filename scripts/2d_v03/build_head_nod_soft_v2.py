"""Build the four canonical-colour drawings used by Neutral Side 03.

The source is one generated 4 x 1 sheet. This script performs deterministic
whole-figure extraction and registration only; it never composites body parts.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = ROOT / "art/source-images/game/2d-v03/animations/head-nod-soft-v2"
SOURCE_SHEET = SOURCE_ROOT / "hugo-head-nod-soft-v2-sheet-transparent.png"
REGISTERED_SHEET = SOURCE_ROOT / "hugo-head-nod-soft-v2-sheet-registered.png"
OUTPUT = ROOT / "src/assets/game/2d-v03/animations/head-nod-soft"
FRAME_ROOT = OUTPUT / "frames"

CANVAS = 512
TARGET_HEIGHT = 323
TARGET_BASELINE_Y = 417
TARGET_SHOE_CENTRE_X = 250
BASE_FPS = 6

UNIQUE_FRAMES = (
    ("hugo-head-nod-soft-01-neutral-start.png", "Neutral start"),
    ("hugo-head-nod-soft-02-nod-down-20-percent.png", "Nod down 20 percent"),
    ("hugo-head-nod-soft-03-nod-down-40-percent.png", "Nod down 40 percent"),
    ("hugo-head-nod-soft-04-nod-down-60-percent.png", "Nod down 60 percent"),
)

RUNTIME_SEQUENCE = (1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2)
RUNTIME_LABELS = (
    "Neutral start",
    "Nod down 20 percent",
    "Nod down 40 percent",
    "Nod down 60 percent",
    "Nod returns through source frame 3",
    "Nod returns through source frame 2",
    "Neutral midpoint",
    "Second nod through source frame 2",
    "Second nod through source frame 3",
    "Second nod peak",
    "Second return through source frame 3",
    "Second return through source frame 2",
)

PROMPT = """Create one strict 4-column x 1-row game-animation sheet containing
exactly four complete full-body drawings of Hugo, ordered left to right, for
Neutral Side 03. Lock Hugo's identity, healthy warm natural tan/peach skin,
warm brown hair, lighting, and burnt-orange, cream, gold, and teal Sunrise
wingsuit colours to the canonical Outfit 03 Sunrise neutral-front and
ready-profile references. Use the Version 03 neutral-side reference for the
screen-right silhouette, proportions, registration, and black sculpted shoes.
Use the existing four approved drawings only as pose geometry; do not inherit
their yellow, olive, green, grey, or sickly colour cast. Draw: neutral, a tiny
20-percent nod, a restrained 40-percent nod, and a restrained 60-percent nod.
Only the head and neck angle change. Keep the complete body, scale, baseline,
lighting, and colour consistent. Use a flat #FF00FF chroma background, generous
gutters, no crop, no fragments, no text, and exactly one complete Hugo per
cell."""


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > 8)
    if not len(xs):
        raise ValueError("Image has no visible pixels")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def sheet_cells() -> list[Image.Image]:
    sheet = Image.open(SOURCE_SHEET).convert("RGBA")
    if sheet.width % 4:
        raise ValueError(f"Sheet width {sheet.width} is not divisible by four")

    cell_width = sheet.width // 4
    cells = [
        sheet.crop((index * cell_width, 0, (index + 1) * cell_width, sheet.height))
        for index in range(4)
    ]
    for index, cell in enumerate(cells, 1):
        bounds = alpha_bounds(cell)
        if bounds[0] <= 4 or bounds[2] >= cell.width - 4:
            raise ValueError(f"Source frame {index}: artwork touches its cell edge")
        if bounds[1] <= 4 or bounds[3] >= cell.height - 4:
            raise ValueError(f"Source frame {index}: artwork touches the sheet edge")
    return cells


def shoe_anchor(image: Image.Image) -> tuple[float, float]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > 8)
    bottom = float(ys.max() + 1)
    shoe_band = (alpha > 8) & (
        np.indices(alpha.shape)[0] >= bottom - max(56, int((ys.max() - ys.min()) * 0.16))
    )
    _, shoe_xs = np.where(shoe_band)
    return float(np.median(shoe_xs)), bottom


def register_cells(cells: list[Image.Image]) -> tuple[list[Image.Image], list[dict[str, object]]]:
    first_bounds = alpha_bounds(cells[0])
    scale = TARGET_HEIGHT / (first_bounds[3] - first_bounds[1])
    registered: list[Image.Image] = []
    metadata: list[dict[str, object]] = []

    for index, cell in enumerate(cells, 1):
        source_x, source_bottom = shoe_anchor(cell)
        matrix = np.array(
            [
                [scale, 0, TARGET_SHOE_CENTRE_X - scale * source_x],
                [0, scale, TARGET_BASELINE_Y - scale * source_bottom],
            ],
            dtype=np.float32,
        )
        rgba = cv2.warpAffine(
            np.asarray(cell),
            matrix,
            (CANVAS, CANVAS),
            flags=cv2.INTER_LANCZOS4,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(0, 0, 0, 0),
        )
        image = Image.fromarray(rgba)
        validate_frame(image, index)
        registered.append(image)
        metadata.append(
            {
                "sourceCell": index,
                "sourceBounds": list(alpha_bounds(cell)),
                "uniformScale": round(scale, 6),
                "shoeAnchorX": round(source_x, 3),
                "sourceBaselineY": round(source_bottom, 3),
                "alphaBounds": list(alpha_bounds(image)),
            }
        )
    return registered, metadata


def validate_frame(image: Image.Image, index: int) -> None:
    bounds = alpha_bounds(image)
    if bounds[0] < 120 or bounds[1] < 75 or bounds[2] > 390 or bounds[3] > 430:
        raise ValueError(f"Frame {index}: unsafe registered bounds {bounds}")

    alpha = np.asarray(image.getchannel("A"))
    count, _, stats, _ = cv2.connectedComponentsWithStats(
        (alpha > 8).astype(np.uint8),
        8,
    )
    areas = sorted(
        (int(stats[label, cv2.CC_STAT_AREA]) for label in range(1, count)),
        reverse=True,
    )
    if not areas or areas[0] < 13_000:
        raise ValueError(f"Frame {index}: incomplete character {areas[:5]}")
    if len(areas) > 1 and areas[1] > 500:
        raise ValueError(f"Frame {index}: detached artwork {areas[:5]}")


def save_registered_sheet(frames: list[Image.Image]) -> None:
    sheet = Image.new("RGBA", (CANVAS * 4, CANVAS))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * CANVAS, 0))
    sheet.save(REGISTERED_SHEET, optimize=True)


def write_manifest(metadata: list[dict[str, object]], paths: list[Path]) -> None:
    runtime_frames: list[dict[str, object]] = []
    for runtime_index, (source_index, label) in enumerate(
        zip(RUNTIME_SEQUENCE, RUNTIME_LABELS, strict=True),
        1,
    ):
        filename, _ = UNIQUE_FRAMES[source_index - 1]
        runtime_frames.append(
            {
                "index": runtime_index,
                "sourceFrame": source_index,
                "label": label,
                "filename": filename,
                "runtime": True,
            }
        )

    manifest = {
        "schemaVersion": 1,
        "animation": {
            "id": "head-nod-soft",
            "assetDirectory": "head-nod-soft",
            "name": "Neutral Side · Head nod 03",
            "description": (
                "A restrained two-beat nod using four canonically coloured "
                "Outfit 03 Sunrise drawings."
            ),
            "prompt": PROMPT,
            "revisionOf": "head-nod",
        },
        "timing": {
            "baseFps": BASE_FPS,
            "runtimeFrameCount": len(RUNTIME_SEQUENCE),
            "drawingCount": len(UNIQUE_FRAMES),
            "loopDurationSeconds": round(len(RUNTIME_SEQUENCE) / BASE_FPS, 3),
            "loopReturnFrame": len(RUNTIME_SEQUENCE),
        },
        "productionMethod": (
            "four complete figures generated together in one 4 x 1 sheet with "
            "canonical Outfit 03 Sunrise palette lock; chroma cleanup and "
            "deterministic whole-figure shoe registration only; no body-part "
            "masking, frozen-body compositing, interpolation, or runtime sheet slicing"
        ),
        "source": {
            "sheet": str(SOURCE_SHEET.relative_to(ROOT)).replace("\\", "/"),
            "registeredSheet": str(REGISTERED_SHEET.relative_to(ROOT)).replace("\\", "/"),
            "uniqueFrames": [
                {
                    "sourceFrame": index,
                    "filename": path.name,
                    "sha256": sha256(path),
                    **metadata[index - 1],
                }
                for index, path in enumerate(paths, 1)
            ],
        },
        "frames": runtime_frames,
    }
    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    frames, metadata = register_cells(sheet_cells())
    FRAME_ROOT.mkdir(parents=True, exist_ok=True)
    output_paths: list[Path] = []
    for frame, (filename, _) in zip(frames, UNIQUE_FRAMES, strict=True):
        path = FRAME_ROOT / filename
        frame.save(path, optimize=True)
        output_paths.append(path)

    save_registered_sheet(frames)
    write_manifest(metadata, output_paths)
    print("Built four canonical-colour Neutral Side 03 drawings and 12-step loop")


if __name__ == "__main__":
    main()
