"""Build the Version 03 neutral-side groove from two sequential 4 x 3 sheets.

The model supplies subtle head, hand, and shoe variants. The production pass
registers every drawing to the cream torso panel, then composites only those
three motion regions over the exact approved neutral-side body.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = ROOT / "art/source-images/game/2d-v03/animations/neutral-groove"
SHEET_A = SOURCE_ROOT / "hugo-neutral-groove-sheet-a-transparent.png"
SHEET_B = SOURCE_ROOT / "hugo-neutral-groove-sheet-b-transparent.png"
CONTINUITY = SOURCE_ROOT / "hugo-neutral-groove-a12-continuity.png"
LOCKED_A = SOURCE_ROOT / "hugo-neutral-groove-sheet-a-locked.png"
LOCKED_B = SOURCE_ROOT / "hugo-neutral-groove-sheet-b-locked.png"
BASE = (
    ROOT
    / "src/assets/game/2d-v03/sunrise-side/poses"
    / "hugo-sunrise-side-01-neutral-side.png"
)
OUTPUT = ROOT / "src/assets/game/2d-v03/animations/neutral-groove"
FRAME_ROOT = OUTPUT / "frames"
CANVAS = 512
BASE_FPS = 18

FRAME_LABELS = (
    "Neutral side",
    "Groove anticipation 1",
    "Groove anticipation 2",
    "Groove anticipation 3",
    "Head and toe begin",
    "Finger prepares",
    "Nod deepens",
    "Toe rises",
    "Click anticipation",
    "Near groove peak",
    "Finger click",
    "Groove peak",
    "Release begins",
    "Head rises 1",
    "Toe lowers 1",
    "Finger releases",
    "Head rises 2",
    "Toe lowers 2",
    "Return easing 1",
    "Return easing 2",
    "Near neutral",
    "Neutral settle",
    "Exact neutral loop bookend",
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
        raise ValueError(f"{path.name}: expected 12 figures, found {len(labels)}")

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

        x, y, width, height = (
            int(stats[label, cv2.CC_STAT_LEFT]),
            int(stats[label, cv2.CC_STAT_TOP]),
            int(stats[label, cv2.CC_STAT_WIDTH]),
            int(stats[label, cv2.CC_STAT_HEIGHT]),
        )
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
        raise ValueError(f"{path.name}: incomplete 4 x 3 cell assignment")
    return [cells[index] for index in range(12)]


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


def motion_mask() -> Image.Image:
    mask = Image.new("L", (CANVAS, CANVAS))
    draw = ImageDraw.Draw(mask)
    # Head/neck, front clicking hand/wrist, and front tapping shoe/ankle only.
    draw.rounded_rectangle((184, 72, 319, 195), radius=24, fill=255)
    draw.rounded_rectangle((258, 204, 337, 316), radius=20, fill=255)
    draw.rounded_rectangle((236, 338, 344, 448), radius=24, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(2.0))


def lock_body(base: Image.Image, generated: Image.Image, mask: Image.Image) -> Image.Image:
    return Image.composite(generated, base, mask)


def make_sheet(frames: list[Image.Image], path: Path) -> None:
    sheet = Image.new("RGBA", (CANVAS * 4, CANVAS * 3))
    for index, frame in enumerate(frames):
        row, column = divmod(index, 4)
        sheet.alpha_composite(frame, (column * CANVAS, row * CANVAS))
    sheet.save(path, optimize=True)


def validate_frame(image: Image.Image, index: int) -> None:
    bounds = alpha_bounds(image)
    if bounds[0] < 120 or bounds[1] < 45 or bounds[2] > 405 or bounds[3] > 465:
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


def main() -> None:
    base = Image.open(BASE).convert("RGBA")
    target = detect_torso_root(base)
    registered_a: list[Image.Image] = []
    registrations_a: list[dict[str, float]] = []
    for frame in extract_sheet(SHEET_A):
        registered, metadata = register(frame, target)
        registered_a.append(registered)
        registrations_a.append(metadata)

    registered_a[-1].save(CONTINUITY, optimize=True)
    if not SHEET_B.exists():
        print(f"Prepared Sheet B continuity reference: {CONTINUITY.relative_to(ROOT)}")
        return

    registered_b: list[Image.Image] = []
    registrations_b: list[dict[str, float]] = []
    for frame in extract_sheet(SHEET_B):
        registered, metadata = register(frame, target)
        registered_b.append(registered)
        registrations_b.append(metadata)

    mask = motion_mask()
    locked_a = [base if index == 0 else lock_body(base, frame, mask) for index, frame in enumerate(registered_a)]
    # The generated B exploration introduced too large a head jump after its
    # first cell. Build the approved B sheet from A in exact reverse instead:
    # A12, A11 ... A01. This preserves every adjacent spacing decision and
    # guarantees both the A→B join and the loop seam.
    locked_b = list(reversed(locked_a))
    make_sheet(locked_a, LOCKED_A)
    make_sheet(locked_b, LOCKED_B)

    runtime = [*locked_a, *locked_b[1:11]]
    review = [*runtime, base]
    FRAME_ROOT.mkdir(parents=True, exist_ok=True)
    frames: list[dict[str, object]] = []
    for index, (image, label) in enumerate(zip(review, FRAME_LABELS, strict=True), 1):
        validate_frame(image, index)
        slug = label.lower().replace(" ", "-")
        filename = f"hugo-neutral-groove-{index:02d}-{slug}.png"
        path = FRAME_ROOT / filename
        image.save(path, optimize=True)
        source_sheet = "A" if index <= 12 else "B-locked-reverse-of-A"
        source_cell = index if index <= 12 else 24 - index
        registration_index = index - 1 if index <= 12 else max(0, 23 - index)
        frames.append(
            {
                "index": index,
                "label": label,
                "filename": filename,
                "runtime": index <= len(runtime),
                "sourceSheet": source_sheet,
                "sourceCell": source_cell,
                "registration": registrations_a[registration_index],
                "alphaBounds": list(alpha_bounds(image)),
                "sha256": sha256(path),
            }
        )

    manifest = {
        "schemaVersion": 1,
        "animation": {
            "id": "neutral-groove",
            "name": "Neutral Side · Groove idle",
            "description": "Hugo nods, taps one shoe, and clicks his fingers to an unheard beat.",
            "prompt": (
                "Create a two-sheet, 4-column × 3-row neutral-side groove loop. "
                "Lock Hugo's torso, hips, standing leg, back foot, wingsuit, back arm, "
                "scale, lighting, and registration. Animate only a gentle head nod, "
                "one restrained front-shoe toe tap with its heel anchored, and one "
                "tiny front-hand finger click. Use 1–3 pixel or 1–2 degree changes "
                "between adjacent drawings. Sheet A starts from the approved neutral "
                "side pose and ends at the groove peak. Sheet B must begin from Sheet "
                "A's exact final drawing, ease all three actions back to neutral, and "
                "finish on an exact copy of the opening pose. Exactly 12 drawings per "
                "sheet; flat #FF00FF chroma background; no body sway, torso lean, "
                "clothing flutter, hair motion, crop, extra limbs, detached parts, "
                "text, borders, shadows, or watermark."
            ),
        },
        "timing": {
            "baseFps": BASE_FPS,
            "runtimeFrameCount": len(runtime),
            "drawingCount": len(review),
            "loopDurationSeconds": round(len(runtime) / BASE_FPS, 3),
            "bookendFrame": len(review),
        },
        "productionMethod": (
            "two sequential generated 4 x 3 source sheets; Sheet B was rejected "
            "for a large A-to-B head jump; approved locked Sheet B starts from "
            "exact Sheet A frame 12 and reverses A11 through A01; deterministic "
            "torso registration; only head, front hand, and front shoe regions "
            "are composited over the exact base body"
        ),
        "frames": frames,
    }
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Built {len(runtime)} runtime frames + one exact loop bookend")


if __name__ == "__main__":
    main()
