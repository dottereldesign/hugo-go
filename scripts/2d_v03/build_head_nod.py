"""Extract the 12-frame Version 03 head-nod sheet into complete character PNGs."""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = ROOT / "art/source-images/game/2d-v03/animations/head-nod"
SOURCE_SHEET = SOURCE_ROOT / "hugo-head-nod-sheet-transparent.png"
REGISTERED_SHEET = SOURCE_ROOT / "hugo-head-nod-sheet-registered.png"
BASE = (
    ROOT
    / "src/assets/game/2d-v03/sunrise-side/poses"
    / "hugo-sunrise-side-01-neutral-side.png"
)
OUTPUT = ROOT / "src/assets/game/2d-v03/animations/head-nod"
FRAME_ROOT = OUTPUT / "frames"
CANVAS = 512
BASE_FPS = 12

PROMPT = (
    "Create one 4-column × 3-row sheet containing exactly 12 complete full-body "
    "drawings of canonical Sunrise Hugo facing screen-right. Animate a restrained "
    "musical head nod only. Frames 1–6 move from neutral upright to the lowest "
    "chin-down pose at roughly 0%, 20%, 40%, 60%, 80%, and 100%. Frames 7–12 "
    "return upward at roughly 80%, 60%, 40%, 20%, almost neutral, and neutral. "
    "Use tiny ease-in/ease-out changes. Redraw the complete intact character in "
    "every cell, but keep everything below the neck unchanged: no foot tap, finger "
    "click, hand action, breathing, torso lean, body sway, weight shift, or clothing "
    "flutter. Keep identity, outfit, scale, baseline, lighting, and registration "
    "consistent. Use a perfectly flat #FF00FF background with no text, borders, "
    "shadows, fragments, crop, watermark, or extra objects."
)

FRAME_LABELS = (
    "Neutral start",
    "Nod down 20 percent",
    "Nod down 40 percent",
    "Nod down 60 percent",
    "Nod down 80 percent",
    "Lowest nod",
    "Nod return 20 percent",
    "Nod return 40 percent",
    "Nod return 60 percent",
    "Nod return 80 percent",
    "Almost neutral",
    "Neutral return",
)


@dataclass(frozen=True)
class TorsoRoot:
    x: float
    y: float
    height: float


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > 8)
    if not len(xs):
        raise ValueError("Image has no visible pixels")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def extract_sheet(path: Path) -> list[Image.Image]:
    sheet = Image.open(path).convert("RGBA")
    rgba = np.asarray(sheet)
    alpha = rgba[:, :, 3]
    count, _, stats, centroids = cv2.connectedComponentsWithStats(
        (alpha > 8).astype(np.uint8),
        8,
    )
    labels = [
        label
        for label in range(1, count)
        if int(stats[label, cv2.CC_STAT_AREA]) >= 8_000
    ]
    if len(labels) != 12:
        raise ValueError(f"{path.name}: expected 12 complete figures, found {len(labels)}")

    cell_width = sheet.width / 4
    cell_height = sheet.height / 3
    cells: dict[int, Image.Image] = {}
    for label in labels:
        centre_x, centre_y = centroids[label]
        column = min(3, max(0, int(centre_x // cell_width)))
        row = min(2, max(0, int(centre_y // cell_height)))
        index = row * 4 + column
        if index in cells:
            raise ValueError(f"{path.name}: multiple figures in cell {index + 1}")

        x = int(stats[label, cv2.CC_STAT_LEFT])
        y = int(stats[label, cv2.CC_STAT_TOP])
        width = int(stats[label, cv2.CC_STAT_WIDTH])
        height = int(stats[label, cv2.CC_STAT_HEIGHT])
        padding = 6
        crop = sheet.crop(
            (
                max(0, x - padding),
                max(0, y - padding),
                min(sheet.width, x + width + padding),
                min(sheet.height, y + height + padding),
            )
        )
        canvas = Image.new("RGBA", (CANVAS, CANVAS))
        canvas.alpha_composite(
            crop,
            ((CANVAS - crop.width) // 2, (CANVAS - crop.height) // 2),
        )
        cells[index] = canvas

    if set(cells) != set(range(12)):
        raise ValueError(f"{path.name}: incomplete 4 × 3 cell assignment")
    return [cells[index] for index in range(12)]


def remove_magenta_fringe(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA")).copy()
    red = rgba[:, :, 0].astype(np.int16)
    green = rgba[:, :, 1].astype(np.int16)
    blue = rgba[:, :, 2].astype(np.int16)
    alpha = rgba[:, :, 3]
    spill = (
        (alpha > 0)
        & (red > green + 22)
        & (blue > green + 22)
        & (red > 70)
        & (blue > 70)
    )
    neutral = np.clip(green + 12, 0, 255).astype(np.uint8)
    rgba[:, :, 0][spill] = np.minimum(rgba[:, :, 0][spill], neutral[spill])
    rgba[:, :, 2][spill] = np.minimum(rgba[:, :, 2][spill], neutral[spill])
    return Image.fromarray(rgba)


def detect_torso_root(image: Image.Image) -> TorsoRoot:
    rgba = np.asarray(image.convert("RGBA"))
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]
    yy, xx = np.indices(alpha.shape)
    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)
    mask = (
        (alpha > 50)
        & (yy >= image.height * 0.25)
        & (yy < image.height * 0.62)
        & (xx >= image.width * 0.30)
        & (xx < image.width * 0.70)
        & (rgb[:, :, 0] > 165)
        & (rgb[:, :, 1] > 125)
        & (rgb[:, :, 2] > 75)
        & ((maximum - minimum) < 120)
    )
    count, _, stats, centroids = cv2.connectedComponentsWithStats(
        mask.astype(np.uint8),
        8,
    )
    candidates = [
        label
        for label in range(1, count)
        if int(stats[label, cv2.CC_STAT_AREA]) >= 180
        and int(stats[label, cv2.CC_STAT_HEIGHT]) >= 45
    ]
    if not candidates:
        raise ValueError("Could not identify the cream side-torso panel")
    label = max(candidates, key=lambda value: int(stats[value, cv2.CC_STAT_AREA]))
    return TorsoRoot(
        x=float(centroids[label][0]),
        y=float(centroids[label][1]),
        height=float(stats[label, cv2.CC_STAT_HEIGHT]),
    )


def register(image: Image.Image, target: TorsoRoot) -> tuple[Image.Image, dict[str, float]]:
    root = detect_torso_root(image)
    scale = target.height / root.height
    matrix = np.array(
        [
            [scale, 0, target.x - scale * root.x],
            [0, scale, target.y - scale * root.y],
        ],
        dtype=np.float32,
    )
    registered = cv2.warpAffine(
        np.asarray(image.convert("RGBA")),
        matrix,
        (CANVAS, CANVAS),
        flags=cv2.INTER_LANCZOS4,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0, 0),
    )
    return Image.fromarray(registered), {
        "sourceRootX": round(root.x, 3),
        "sourceRootY": round(root.y, 3),
        "sourceTorsoHeight": round(root.height, 3),
        "uniformScale": round(scale, 6),
    }


def validate_frame(image: Image.Image, index: int) -> None:
    bounds = alpha_bounds(image)
    if bounds[0] < 110 or bounds[1] < 35 or bounds[2] > 410 or bounds[3] > 470:
        raise ValueError(f"Frame {index:02d}: unsafe bounds {bounds}")
    alpha = np.asarray(image.getchannel("A"))
    count, _, stats, _ = cv2.connectedComponentsWithStats(
        (alpha > 8).astype(np.uint8),
        8,
    )
    areas = sorted(
        (int(stats[label, cv2.CC_STAT_AREA]) for label in range(1, count)),
        reverse=True,
    )
    if not areas or areas[0] < 17_000:
        raise ValueError(f"Frame {index:02d}: incomplete character {areas[:4]}")
    if len(areas) > 1 and areas[1] > 400:
        raise ValueError(f"Frame {index:02d}: detached artwork {areas[:4]}")


def make_sheet(frames: list[Image.Image], path: Path) -> None:
    sheet = Image.new("RGBA", (CANVAS * 4, CANVAS * 3))
    for index, frame in enumerate(frames):
        row, column = divmod(index, 4)
        sheet.alpha_composite(frame, (column * CANVAS, row * CANVAS))
    sheet.save(path, optimize=True)


def main() -> None:
    target = detect_torso_root(Image.open(BASE).convert("RGBA"))
    registered_frames: list[Image.Image] = []
    registrations: list[dict[str, float]] = []
    for frame in extract_sheet(SOURCE_SHEET):
        registered, metadata = register(remove_magenta_fringe(frame), target)
        registered_frames.append(registered)
        registrations.append(metadata)

    make_sheet(registered_frames, REGISTERED_SHEET)
    FRAME_ROOT.mkdir(parents=True, exist_ok=True)
    for existing in FRAME_ROOT.glob("hugo-head-nod-*.png"):
        existing.unlink()

    frames: list[dict[str, object]] = []
    for index, (image, label, registration) in enumerate(
        zip(registered_frames, FRAME_LABELS, registrations, strict=True),
        1,
    ):
        validate_frame(image, index)
        slug = label.lower().replace(" ", "-")
        filename = f"hugo-head-nod-{index:02d}-{slug}.png"
        path = FRAME_ROOT / filename
        image.save(path, optimize=True)
        frames.append(
            {
                "index": index,
                "label": label,
                "filename": filename,
                "runtime": True,
                "sourceSheet": "head-nod",
                "sourceCell": index,
                "registration": registration,
                "alphaBounds": list(alpha_bounds(image)),
                "sha256": sha256(path),
            }
        )

    manifest = {
        "schemaVersion": 1,
        "animation": {
            "id": "head-nod",
            "name": "Neutral Side · Head nod",
            "description": "Six drawings nod Hugo down to the beat; six bring him back up.",
            "prompt": PROMPT,
        },
        "timing": {
            "baseFps": BASE_FPS,
            "runtimeFrameCount": len(frames),
            "drawingCount": len(frames),
            "loopDurationSeconds": round(len(frames) / BASE_FPS, 3),
            "loopReturnFrame": len(frames),
        },
        "productionMethod": (
            "all 12 complete generated characters in 4 x 3 cell order; "
            "whole-figure chroma cleanup and deterministic torso registration "
            "only; no body-part masks, frozen-body compositing, or code rotation"
        ),
        "frames": frames,
    }
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    print("Built 12 complete head-nod frames at 12 FPS")


if __name__ == "__main__":
    main()
