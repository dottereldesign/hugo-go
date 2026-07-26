"""Build the Version 03 head-nod experiment with generated midpoint poses."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = ROOT / "art/source-images/game/2d-v03/animations/head-nod-smooth-v1"
SOURCE_SHEET = SOURCE_ROOT / "hugo-head-nod-smooth-inbetweens-transparent.png"
REGISTERED_SHEET = SOURCE_ROOT / "hugo-head-nod-smooth-seven-drawings-registered.png"
APPROVED_ROOT = ROOT / "src/assets/game/2d-v03/animations/head-nod-soft/frames"
OUTPUT = ROOT / "src/assets/game/2d-v03/animations/head-nod-soft-inbetweens"
FRAME_ROOT = OUTPUT / "frames"

CANVAS = 512
TARGET_HEIGHT = 323
TARGET_BASELINE_Y = 417
TARGET_SHOE_CENTRE_X = 250
BASE_FPS = 12

APPROVED_FILES = (
    "hugo-head-nod-soft-01-neutral-start.png",
    "hugo-head-nod-soft-02-nod-down-20-percent.png",
    "hugo-head-nod-soft-03-nod-down-40-percent.png",
    "hugo-head-nod-soft-04-nod-down-60-percent.png",
)

DRAWINGS = (
    ("hugo-head-nod-smooth-01-approved-00-percent.png", "Approved 0 percent nod"),
    ("hugo-head-nod-smooth-02-new-10-percent.png", "New 10 percent midpoint"),
    ("hugo-head-nod-smooth-03-approved-20-percent.png", "Approved 20 percent nod"),
    ("hugo-head-nod-smooth-04-new-30-percent.png", "New 30 percent midpoint"),
    ("hugo-head-nod-smooth-05-approved-40-percent.png", "Approved 40 percent nod"),
    ("hugo-head-nod-smooth-06-new-50-percent.png", "New 50 percent midpoint"),
    ("hugo-head-nod-smooth-07-approved-60-percent.png", "Approved 60 percent nod"),
)

RUNTIME_SEQUENCE = (1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2)

PROMPT = """Create one strict 3-column x 1-row character sheet containing
exactly three complete full-body Hugo drawings. Use the approved Neutral Side
03 drawings at nod depths 0, 20, 40, and 60 percent as the motion guide.
Generate exact midpoint poses at 10, 30, and 50 percent nod depth. Interpolate
the head and neck angle, chin height, nose direction, eye line, ear angle, hair
angle, and neck compression exactly halfway between each adjacent approved
pair. Redraw the complete figure in every cell. Keep everything below the neck
unchanged: identical standing pose, arms, hands, legs, black shoes, scale,
baseline, centre, Sunrise outfit, lighting, and colour. Match canonical Outfit
03 Sunrise identity and healthy warm peach/tan skin with no yellow, olive,
green, grey, or sickly cast. Use one flat #FF00FF chroma background, generous
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


def source_cells() -> list[Image.Image]:
    sheet = Image.open(SOURCE_SHEET).convert("RGBA")
    if sheet.width % 3:
        raise ValueError(f"Sheet width {sheet.width} is not divisible by three")
    cell_width = sheet.width // 3
    cells = [
        sheet.crop((index * cell_width, 0, (index + 1) * cell_width, sheet.height))
        for index in range(3)
    ]
    for index, cell in enumerate(cells, 1):
        left, top, right, bottom = alpha_bounds(cell)
        if left <= 4 or right >= cell.width - 4 or top <= 4 or bottom >= cell.height - 4:
            raise ValueError(f"In-between source cell {index} touches a boundary")
    return cells


def shoe_anchor(image: Image.Image) -> tuple[float, float]:
    alpha = np.asarray(image.getchannel("A"))
    ys, _ = np.where(alpha > 8)
    bottom = float(ys.max() + 1)
    row_grid = np.indices(alpha.shape)[0]
    shoe_band = (alpha > 8) & (
        row_grid >= bottom - max(56, int((ys.max() - ys.min()) * 0.16))
    )
    _, shoe_xs = np.where(shoe_band)
    return float(np.median(shoe_xs)), bottom


def validate_frame(image: Image.Image, label: str) -> None:
    bounds = alpha_bounds(image)
    if bounds[0] < 120 or bounds[1] < 70 or bounds[2] > 390 or bounds[3] > 430:
        raise ValueError(f"{label}: unsafe registered bounds {bounds}")

    alpha = np.asarray(image.getchannel("A"))
    count, _, stats, _ = cv2.connectedComponentsWithStats(
        (alpha > 8).astype(np.uint8),
        8,
    )
    areas = sorted(
        (int(stats[index, cv2.CC_STAT_AREA]) for index in range(1, count)),
        reverse=True,
    )
    if not areas or areas[0] < 13_000:
        raise ValueError(f"{label}: incomplete character {areas[:5]}")
    if len(areas) > 1 and areas[1] > 500:
        raise ValueError(f"{label}: detached artwork {areas[:5]}")


def register_inbetweens(cells: list[Image.Image]) -> tuple[list[Image.Image], list[dict[str, object]]]:
    first_bounds = alpha_bounds(cells[0])
    scale = TARGET_HEIGHT / (first_bounds[3] - first_bounds[1])
    frames: list[Image.Image] = []
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
        frame = Image.fromarray(rgba)
        validate_frame(frame, f"Generated midpoint {index}")
        frames.append(frame)
        metadata.append(
            {
                "sourceCell": index,
                "sourceBounds": list(alpha_bounds(cell)),
                "uniformScale": round(scale, 6),
                "shoeAnchorX": round(source_x, 3),
                "sourceBaselineY": round(source_bottom, 3),
                "alphaBounds": list(alpha_bounds(frame)),
            }
        )
    return frames, metadata


def assemble_drawings(inbetweens: list[Image.Image]) -> list[Image.Image]:
    approved = [
        Image.open(APPROVED_ROOT / filename).convert("RGBA")
        for filename in APPROVED_FILES
    ]
    drawings = [
        approved[0],
        inbetweens[0],
        approved[1],
        inbetweens[1],
        approved[2],
        inbetweens[2],
        approved[3],
    ]
    for (_, label), drawing in zip(DRAWINGS, drawings, strict=True):
        validate_frame(drawing, label)
    return drawings


def save_registered_sheet(drawings: list[Image.Image]) -> None:
    sheet = Image.new("RGBA", (CANVAS * len(drawings), CANVAS))
    for index, drawing in enumerate(drawings):
        sheet.alpha_composite(drawing, (index * CANVAS, 0))
    sheet.save(REGISTERED_SHEET, optimize=True)


def write_manifest(paths: list[Path], midpoint_metadata: list[dict[str, object]]) -> None:
    runtime_frames = []
    for runtime_index, source_index in enumerate(RUNTIME_SEQUENCE, 1):
        filename, label = DRAWINGS[source_index - 1]
        direction = "down" if runtime_index <= 7 else "return"
        runtime_frames.append(
            {
                "index": runtime_index,
                "sourceFrame": source_index,
                "label": f"{label} · {direction}",
                "filename": filename,
                "runtime": True,
            }
        )

    unique_drawings = []
    midpoint_lookup = {2: midpoint_metadata[0], 4: midpoint_metadata[1], 6: midpoint_metadata[2]}
    for index, path in enumerate(paths, 1):
        unique_drawings.append(
            {
                "sourceFrame": index,
                "filename": path.name,
                "kind": "generated midpoint" if index in midpoint_lookup else "approved original",
                "nodDepthPercent": (index - 1) * 10,
                "sha256": sha256(path),
                "alphaBounds": list(alpha_bounds(Image.open(path).convert("RGBA"))),
                **midpoint_lookup.get(index, {}),
            }
        )

    manifest = {
        "schemaVersion": 1,
        "animation": {
            "id": "head-nod-soft-inbetweens",
            "assetDirectory": "head-nod-soft-inbetweens",
            "name": "Neutral Side · Head nod midpoint experiment",
            "description": (
                "The approved nod with new 10%, 30%, and 50% midpoint drawings."
            ),
            "prompt": PROMPT,
            "revisionOf": "head-nod-soft",
        },
        "timing": {
            "baseFps": BASE_FPS,
            "runtimeFrameCount": len(RUNTIME_SEQUENCE),
            "drawingCount": len(DRAWINGS),
            "loopDurationSeconds": round(len(RUNTIME_SEQUENCE) / BASE_FPS, 3),
            "loopReturnFrame": len(RUNTIME_SEQUENCE),
        },
        "productionMethod": (
            "four approved complete figures plus three complete generated midpoint "
            "figures; chroma cleanup and deterministic whole-figure shoe registration "
            "only; no body-part compositing, code interpolation, or runtime sheet slicing"
        ),
        "source": {
            "midpointSheet": str(SOURCE_SHEET.relative_to(ROOT)).replace("\\", "/"),
            "registeredSequence": str(REGISTERED_SHEET.relative_to(ROOT)).replace("\\", "/"),
            "uniqueDrawings": unique_drawings,
        },
        "frames": runtime_frames,
    }
    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    inbetweens, metadata = register_inbetweens(source_cells())
    drawings = assemble_drawings(inbetweens)
    FRAME_ROOT.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for drawing, (filename, _) in zip(drawings, DRAWINGS, strict=True):
        path = FRAME_ROOT / filename
        drawing.save(path, optimize=True)
        paths.append(path)
    save_registered_sheet(drawings)
    write_manifest(paths, metadata)
    print("Built 7-drawing Neutral Side midpoint experiment at 12 FPS")


if __name__ == "__main__":
    main()
