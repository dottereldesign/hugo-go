"""Rebuild the neutral idle from approved originals plus targeted in-betweens.

This script intentionally does not generate a replacement sequence. It keeps
the approved production drawings in chronological order, removes rejected old
frame 21, inserts only the centre drawing from each exact A/target/B board, and
records the provenance of every inserted drawing.
"""

from __future__ import annotations

import hashlib
import json
import math
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
ANIMATION_ROOT = ROOT / "src" / "assets" / "game" / "2d-v02" / "animations"
OUTPUT_ROOT = ANIMATION_ROOT / "neutral-idle"
FRAME_ROOT = OUTPUT_ROOT / "frames"
SOURCE_ROOT = (
    ROOT
    / "art"
    / "source-images"
    / "game"
    / "2d-v02"
    / "animations"
    / "neutral-idle"
)
INBETWEEN_ROOT = SOURCE_ROOT / "inbetween-v2"
CANVAS_SIZE = 640
FIGURE_HEIGHT = 440
GROUND_BASELINE = 540
BASE_FPS = 12


# kind, source id, slug, label, duration ticks
SEQUENCE = (
    ("old", 1, "neutral-front", "Neutral", 8),
    ("old", 2, "eyelids-relax", "Eyelids relax", 2),
    ("old", 3, "weight-shift", "Weight shift", 1),
    ("new", ("a", 1), "weight-to-toe-mid", "Weight to toe midpoint", 1),
    ("old", 4, "toe-tap-anticipation", "Toe tap anticipation", 2),
    ("old", 5, "toe-tap-contact", "Toe tap contact", 1),
    ("old", 6, "toe-tap-rise", "Toe tap rise", 1),
    ("new", ("a", 2), "toe-settle", "Toe settles", 1),
    ("old", 7, "gum-chew", "Gum chew", 3),
    ("old", 8, "bubble-tiny", "Tiny purple bubble", 2),
    ("old", 9, "bubble-small", "Small purple bubble", 2),
    ("old", 10, "bubble-medium", "Medium purple bubble", 1),
    ("new", ("a", 3), "bubble-medium-large", "Bubble growth midpoint", 1),
    ("old", 11, "bubble-large", "Large purple bubble", 3),
    ("old", 12, "gum-splat", "Purple gum splat", 4),
    ("old", 13, "splat-hold", "Splat hold", 3),
    ("old", 14, "stunned-blink", "Stunned blink", 1),
    ("new", ("a", 4), "stunned-to-annoyed", "Stunned to annoyed", 1),
    ("old", 15, "annoyed-anticipation", "Annoyed anticipation", 1),
    ("new", ("b", 1), "arm-rise-half", "Arm rise midpoint", 1),
    ("old", 16, "hand-rise", "Hand rises", 1),
    ("new", ("b", 2), "reach-close", "Reach closes", 1),
    ("old", 17, "gum-contact", "Purple gum contact", 1),
    ("new", ("b", 3), "peel-start", "Peel starts", 1),
    ("old", 18, "gum-peel", "Purple gum peel", 1),
    ("new", ("b", 4), "stretch-mid", "Stretch midpoint", 1),
    ("old", 19, "gum-stretch", "Purple gum stretch", 1),
    ("new", ("c", 1), "detach-recoil", "Detach and recoil", 1),
    ("old", 20, "gum-free", "Purple gum free", 2),
    ("new", ("c", 2), "inspect-to-eye-roll", "Inspect to eye roll", 1),
    ("old", 22, "bored-eye-roll", "Bored eye roll", 4),
    ("new", ("c", 3), "gum-flick", "Purple gum flick", 1),
    ("new", ("c", 4), "arm-lower", "Arm lowers", 1),
    ("old", 23, "settle", "Settle", 3),
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("Frame contains no visible pixels")
    return bounds


def crop_middle_cell(board: Image.Image, row: int) -> Image.Image:
    cell_width = board.width // 3
    cell_height = board.height // 4
    cell = board.crop(
        (
            cell_width,
            (row - 1) * cell_height,
            cell_width * 2,
            row * cell_height,
        )
    )
    bounds = alpha_bounds(cell)
    return cell.crop(bounds)


def register(crop: Image.Image) -> Image.Image:
    bounds = alpha_bounds(crop)
    figure = crop.crop(bounds)
    scale = FIGURE_HEIGHT / figure.height
    size = (max(1, round(figure.width * scale)), FIGURE_HEIGHT)
    figure = figure.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    x = (CANVAS_SIZE - figure.width) // 2
    y = GROUND_BASELINE - figure.height
    if x < 0 or x + figure.width > CANVAS_SIZE:
        raise ValueError(f"In-between is too wide after registration: {figure.size}")
    canvas.alpha_composite(figure, (x, y))
    return canvas


def recolour_gum(image: Image.Image) -> Image.Image:
    rgba = np.array(image.convert("RGBA"))
    rgb = rgba[:, :, :3]
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    red = rgb[:, :, 0].astype(np.int16)
    green = rgb[:, :, 1].astype(np.int16)
    blue = rgb[:, :, 2].astype(np.int16)
    pink = (red > 170) & (blue > 90) & (blue > green * 1.02)
    purple = (red > 70) & (green < 160) & (blue > red * 1.05) & (blue > green * 1.35)
    gum = (rgba[:, :, 3] > 16) & (pink | purple)
    hsv[gum, 0] = 137
    hsv[gum, 1] = np.maximum(hsv[gum, 1], 170)
    rgb[:] = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
    return Image.fromarray(rgba)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    filename = "arialbd.ttf" if bold else "arial.ttf"
    path = Path("C:/Windows/Fonts") / filename
    return ImageFont.truetype(str(path), size) if path.exists() else ImageFont.load_default()


def make_contact_sheet(frames: list[dict[str, object]]) -> Path:
    columns = 6
    rows = math.ceil(len(frames) / columns)
    tile_width = 230
    tile_height = 260
    margin = 26
    header_height = 112
    sheet = Image.new(
        "RGB",
        (margin * 2 + columns * tile_width, header_height + margin * 2 + rows * tile_height),
        "#07162b",
    )
    draw = ImageDraw.Draw(sheet)
    draw.text(
        (margin, 22),
        "OUTFIT 03 · Neutral Front · Bubble-gum idle",
        fill="#f8fbff",
        font=load_font(28, bold=True),
    )
    draw.text(
        (margin, 64),
        f"{len(frames)} named PNGs · final file is an exact review-only copy of frame 01",
        fill="#74e6ff",
        font=load_font(14),
    )
    for entry in frames:
        index = int(entry["index"])
        row = (index - 1) // columns
        column = (index - 1) % columns
        x = margin + column * tile_width
        y = header_height + row * tile_height
        card = (x + 5, y + 5, x + tile_width - 8, y + tile_height - 8)
        draw.rounded_rectangle(
            card,
            radius=16,
            fill="#223452" if entry["runtime"] else "#452b47",
            outline="#367495" if entry["runtime"] else "#f0a84d",
            width=2,
        )
        frame = Image.open(ROOT / str(entry["file"])).convert("RGBA")
        preview = frame.resize((190, 190), Image.Resampling.LANCZOS)
        sheet.paste(preview, (x + 19, y + 9), preview)
        draw.text((x + 18, y + 202), f"{index:02d}", fill="#ffd75c", font=load_font(15, True))
        draw.text(
            (x + 54, y + 202),
            str(entry["label"]),
            fill="#f8fbff",
            font=load_font(13, True),
        )
        draw.text(
            (x + 18, y + 228),
            f"{entry['durationTicks']} ticks · {entry['slug']}",
            fill="#9db1c8",
            font=load_font(13),
        )
    qa_root = ANIMATION_ROOT / "qa"
    qa_root.mkdir(parents=True, exist_ok=True)
    path = qa_root / "hugo-neutral-idle-contact-sheet.jpg"
    sheet.save(path, quality=93, optimize=True)
    return path


def main() -> None:
    old_manifest_path = OUTPUT_ROOT / "manifest.json"
    old_manifest = json.loads(old_manifest_path.read_text(encoding="utf-8"))
    old_entries = {int(frame["index"]): frame for frame in old_manifest["frames"]}
    old_images = {
        index: Image.open(ROOT / str(entry["file"])).convert("RGBA").copy()
        for index, entry in old_entries.items()
    }
    boards = {
        board_id: Image.open(
            INBETWEEN_ROOT
            / f"hugo-neutral-idle-inbetween-board-{board_id}-transparent.png"
        ).convert("RGBA")
        for board_id in ("a", "b", "c")
    }

    FRAME_ROOT.mkdir(parents=True, exist_ok=True)
    for stale in FRAME_ROOT.glob("*.png"):
        stale.unlink()

    frames: list[dict[str, object]] = []
    for index, (kind, source, slug, label, duration_ticks) in enumerate(SEQUENCE, start=1):
        if kind == "old":
            old_index = int(source)
            image = old_images[old_index]
            source_info = {
                **old_entries[old_index]["source"],
                "originalFrame": old_index,
                "refinement": "preserved-approved-drawing",
            }
        else:
            board_id, row = source
            image = register(crop_middle_cell(boards[str(board_id)], int(row)))
            board_path = (
                INBETWEEN_ROOT
                / f"hugo-neutral-idle-inbetween-board-{board_id}-transparent.png"
            )
            board_manifest = json.loads(
                (INBETWEEN_ROOT / "manifest.json").read_text(encoding="utf-8")
            )
            row_info = next(
                entry
                for board in board_manifest["boards"]
                if board["id"] == board_id
                for entry in board["rows"]
                if int(entry["row"]) == int(row)
            )
            source_info = {
                "type": "adjacent-pair-inbetween",
                "board": board_path.relative_to(ROOT).as_posix(),
                "row": int(row),
                "column": 2,
                "betweenOriginalFrames": [
                    int(row_info["outgoingFrame"]),
                    int(row_info["incomingFrame"]),
                ],
                "interpolation": row_info["instruction"],
            }
        # Visible gum begins at the tiny bubble and ends with the flick. Keep
        # skin/lip highlights outside that story section completely untouched.
        if 10 <= index <= 32:
            image = recolour_gum(image)
        filename = f"hugo-neutral-idle-{index:02d}-{slug}.png"
        path = FRAME_ROOT / filename
        image.save(path, optimize=True)
        frames.append(
            {
                "index": index,
                "slug": slug,
                "label": label,
                "filename": filename,
                "file": path.relative_to(ROOT).as_posix(),
                "runtime": True,
                "durationTicks": duration_ticks,
                "durationSeconds": round(duration_ticks / BASE_FPS, 4),
                "source": source_info,
                "output": {
                    "width": CANVAS_SIZE,
                    "height": CANVAS_SIZE,
                    "alphaBounds": list(alpha_bounds(image)),
                    "sha256": sha256(path),
                },
            }
        )

    bookend_index = len(frames) + 1
    bookend_slug = "loop-bookend"
    bookend_name = f"hugo-neutral-idle-{bookend_index:02d}-{bookend_slug}.png"
    first_path = ROOT / str(frames[0]["file"])
    bookend_path = FRAME_ROOT / bookend_name
    shutil.copyfile(first_path, bookend_path)
    bookend_image = Image.open(bookend_path).convert("RGBA")
    frames.append(
        {
            "index": bookend_index,
            "slug": bookend_slug,
            "label": "Exact loop bookend",
            "filename": bookend_name,
            "file": bookend_path.relative_to(ROOT).as_posix(),
            "runtime": False,
            "durationTicks": 0,
            "durationSeconds": 0,
            "source": {"type": "exact-loop-bookend", "copiedFromFrame": 1},
            "output": {
                "width": CANVAS_SIZE,
                "height": CANVAS_SIZE,
                "alphaBounds": list(alpha_bounds(bookend_image)),
                "sha256": sha256(bookend_path),
            },
        }
    )

    runtime_ticks = sum(int(frame["durationTicks"]) for frame in frames if frame["runtime"])
    if runtime_ticks != 60:
        raise ValueError(f"Neutral loop must remain exactly 60 ticks, got {runtime_ticks}")
    contact_sheet = make_contact_sheet(frames)
    manifest = {
        "schemaVersion": 2,
        "sandboxVersion": "02",
        "canonicalOutfit": "sunrise",
        "animation": {
            "id": "neutral-idle",
            "name": "Neutral Front · Bubble-gum idle",
            "description": (
                "Hugo grows bored, taps his shoe, blows a purple bubble, wears "
                "the splat, peels it away, flicks it off, and settles."
            ),
        },
        "timing": {
            "baseFps": BASE_FPS,
            "drawingCount": len(frames),
            "runtimeFrameCount": len(frames) - 1,
            "runtimeTicks": runtime_ticks,
            "loopDurationSeconds": runtime_ticks / BASE_FPS,
            "bookendFrame": bookend_index,
            "bookendRuntime": False,
        },
        "source": {
            "method": "approved-originals-plus-exact-adjacent-pair-inbetweens",
            "rejectedOriginalFrames": [
                {
                    "frame": 21,
                    "slug": "wipe-smear",
                    "reason": "three arms / detached extra hand",
                }
            ],
            "inbetweenBoards": [
                {
                    "file": (
                        INBETWEEN_ROOT
                        / f"hugo-neutral-idle-inbetween-board-{board_id}-transparent.png"
                    ).relative_to(ROOT).as_posix(),
                    "columns": 3,
                    "rows": 4,
                    "targetColumn": 2,
                }
                for board_id in ("a", "b", "c")
            ],
            "continuityAudit": (
                ANIMATION_ROOT / "qa" / "hugo-neutral-idle-adjacent-deltas.json"
            ).relative_to(ROOT).as_posix(),
        },
        "registration": {
            "method": "preserved-original-registration-plus-fixed-inbetween-registration",
            "outputCanvas": [CANVAS_SIZE, CANVAS_SIZE],
            "inbetweenFigureHeight": FIGURE_HEIGHT,
            "groundBaseline": GROUND_BASELINE,
        },
        "frames": frames,
        "qaContactSheet": contact_sheet.relative_to(ROOT).as_posix(),
    }
    old_manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    library_path = ANIMATION_ROOT / "manifest.json"
    library = json.loads(library_path.read_text(encoding="utf-8"))
    neutral = next(item for item in library["animations"] if item["id"] == "neutral-idle")
    neutral.update(
        {
            "frameCount": len(frames),
            "runtimeFrameCount": len(frames) - 1,
            "loopDurationSeconds": runtime_ticks / BASE_FPS,
        }
    )
    library_path.write_text(json.dumps(library, indent=2) + "\n", encoding="utf-8")
    print(
        f"Built {len(frames) - 1} runtime drawings + exact bookend; "
        f"{runtime_ticks / BASE_FPS:.2f} s at {BASE_FPS} timing FPS"
    )


if __name__ == "__main__":
    main()
