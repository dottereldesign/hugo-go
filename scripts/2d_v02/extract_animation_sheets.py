"""Extract the approved Outfit 03 animation sheets into registered PNG frames.

The generated art is authored as sequential 4 x 3 sheets to reduce generation
cost and improve continuity. This script is the deterministic production step:
it isolates each complete silhouette, registers every pose to one canvas,
assigns a descriptive filename, writes timing metadata, and creates review
contact sheets. Runtime animation always loads the individual PNG files.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = ROOT / "art" / "source-images" / "game" / "2d-v02" / "animations"
OUTPUT_ROOT = ROOT / "src" / "assets" / "game" / "2d-v02" / "animations"
OUTFIT_ROOT = ROOT / "src" / "assets" / "game" / "2d-v02" / "sunrise" / "poses"
GRID_COLUMNS = 4
GRID_ROWS = 3
CANVAS_SIZE = 640
FIGURE_HEIGHT = 440
GROUND_BASELINE = 540
FLIGHT_BASELINE = 570
ALPHA_THRESHOLD = 16
MINIMUM_COMPONENT_AREA = 1000


ANIMATIONS = (
    {
        "id": "neutral-idle",
        "name": "Neutral Front · Bubble-gum idle",
        "description": (
            "Hugo grows bored, taps his shoe, blows a bubble, wears the splat, "
            "wipes it away, and settles back into the exact neutral pose."
        ),
        "canonical": OUTFIT_ROOT / "hugo-2d-sunrise-01-neutral-front.png",
        "sheets": (
            SOURCE_ROOT / "neutral-idle" / "hugo-neutral-idle-sheet-a-transparent.png",
            SOURCE_ROOT / "neutral-idle" / "hugo-neutral-idle-sheet-b-transparent.png",
        ),
        "chromaSheets": (
            SOURCE_ROOT / "neutral-idle" / "hugo-neutral-idle-sheet-a-magenta.png",
            SOURCE_ROOT / "neutral-idle" / "hugo-neutral-idle-sheet-b-magenta.png",
        ),
        "slugs": (
            "neutral-front",
            "eyelids-relax",
            "weight-shift",
            "toe-tap-anticipation",
            "toe-tap-contact",
            "toe-tap-rise",
            "gum-chew",
            "bubble-tiny",
            "bubble-small",
            "bubble-medium",
            "bubble-large",
            "gum-splat",
            "splat-hold",
            "stunned-blink",
            "annoyed-anticipation",
            "hand-rise",
            "gum-contact",
            "gum-peel",
            "gum-stretch",
            "gum-free",
            "wipe-smear",
            "bored-eye-roll",
            "settle",
            "loop-bookend",
        ),
        "labels": (
            "Neutral",
            "Eyelids relax",
            "Weight shift",
            "Toe tap anticipation",
            "Toe tap contact",
            "Toe tap rise",
            "Gum chew",
            "Tiny bubble",
            "Small bubble",
            "Medium bubble",
            "Large bubble",
            "Gum splat",
            "Splat hold",
            "Stunned blink",
            "Annoyed anticipation",
            "Hand rises",
            "Gum contact",
            "Peel",
            "Stretch",
            "Gum free",
            "Wipe",
            "Bored eye roll",
            "Settle",
            "Exact loop bookend",
        ),
        "durationTicks": (8, 2, 2, 2, 1, 2, 3, 2, 2, 2, 3, 4, 3, 2, 2, 2, 2, 2, 2, 2, 3, 4, 3, 0),
        "flightFrames": (),
    },
    {
        "id": "ready-profile",
        "name": "Ready Profile · Mischievous jet check",
        "description": (
            "Hugo checks a stubborn heel jet, accidentally pops into a hover, "
            "lands with squash and recovery, brushes off the suit, and returns "
            "to the exact ready profile."
        ),
        "canonical": OUTFIT_ROOT / "hugo-2d-sunrise-02-ready-profile.png",
        "sheets": (
            SOURCE_ROOT / "ready-profile" / "hugo-ready-profile-sheet-a-transparent.png",
            SOURCE_ROOT / "ready-profile" / "hugo-ready-profile-sheet-b-transparent.png",
        ),
        "chromaSheets": (
            SOURCE_ROOT / "ready-profile" / "hugo-ready-profile-sheet-a-magenta.png",
            SOURCE_ROOT / "ready-profile" / "hugo-ready-profile-sheet-b-magenta.png",
        ),
        "slugs": (
            "ready-profile",
            "inhale",
            "blink",
            "inspect-heel",
            "weight-anticipation",
            "heel-lift",
            "heel-tap",
            "jet-sputter",
            "surprised-recoil",
            "boost-crouch",
            "ignition",
            "low-hover",
            "hover-peak",
            "uneven-hover",
            "balance-correction",
            "descent",
            "landing-anticipation",
            "landing-squash",
            "rebound",
            "heel-check",
            "suit-brush",
            "hand-return",
            "settle",
            "loop-bookend",
        ),
        "labels": (
            "Ready profile",
            "Inhale",
            "Blink",
            "Inspect heel",
            "Weight anticipation",
            "Heel lift",
            "Heel tap",
            "Jet sputter",
            "Surprised recoil",
            "Boost crouch",
            "Ignition",
            "Low hover",
            "Hover peak",
            "Uneven hover",
            "Balance correction",
            "Descent",
            "Landing anticipation",
            "Landing squash",
            "Rebound",
            "Heel check",
            "Suit brush",
            "Hand return",
            "Settle",
            "Exact loop bookend",
        ),
        "durationTicks": (8, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1, 2, 3, 2, 2, 3, 0),
        "flightFrames": (11, 12, 13, 14, 15, 16, 17),
    },
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


def find_components(source: Image.Image) -> list[dict[str, object]]:
    alpha = np.asarray(source.getchannel("A"))
    mask = (alpha > ALPHA_THRESHOLD).astype(np.uint8)
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(mask, 8)
    components: list[dict[str, object]] = []

    for label_id in range(1, count):
        x, y, width, height, area = (int(value) for value in stats[label_id])
        if area < MINIMUM_COMPONENT_AREA:
            continue
        centre_x, centre_y = (float(value) for value in centroids[label_id])
        row = min(int(centre_y * GRID_ROWS / source.height), GRID_ROWS - 1)
        components.append(
            {
                "label": label_id,
                "bounds": (x, y, x + width, y + height),
                "centre": (centre_x, centre_y),
                "row": row,
                "area": area,
                "labels": labels,
            }
        )

    if len(components) != GRID_COLUMNS * GRID_ROWS:
        raise ValueError(f"Expected 12 complete silhouettes, found {len(components)}")

    ordered: list[dict[str, object]] = []
    for row in range(GRID_ROWS):
        row_components = sorted(
            (component for component in components if component["row"] == row),
            key=lambda component: component["centre"][0],
        )
        if len(row_components) != GRID_COLUMNS:
            raise ValueError(
                f"Expected {GRID_COLUMNS} silhouettes in row {row + 1}, "
                f"found {len(row_components)}"
            )
        ordered.extend(row_components)
    return ordered


def crop_component(source: Image.Image, component: dict[str, object]) -> Image.Image:
    x1, y1, x2, y2 = component["bounds"]
    pad = 8
    crop_box = (
        max(0, x1 - pad),
        max(0, y1 - pad),
        min(source.width, x2 + pad),
        min(source.height, y2 + pad),
    )
    crop = source.crop(crop_box)
    labels = component["labels"]
    label_id = int(component["label"])
    source_mask = (labels == label_id).astype(np.uint8) * 255
    component_mask = Image.fromarray(source_mask).crop(crop_box)
    crop.putalpha(
        Image.composite(crop.getchannel("A"), Image.new("L", crop.size), component_mask)
    )
    return crop


def registered_canonical(path: Path) -> tuple[Image.Image, tuple[int, int, int, int]]:
    source = Image.open(path).convert("RGBA")
    if source.size != (512, 512):
        raise ValueError(f"Canonical pose must remain 512 x 512: {path}")
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    offset = ((CANVAS_SIZE - source.width) // 2, (CANVAS_SIZE - source.height) // 2)
    canvas.alpha_composite(source, offset)
    return canvas, alpha_bounds(canvas)


def register_generated(
    crop: Image.Image,
    scale: float,
    baseline: int,
) -> tuple[Image.Image, tuple[int, int, int, int]]:
    bounds = alpha_bounds(crop)
    figure = crop.crop(bounds)
    width = max(1, round(figure.width * scale))
    height = max(1, round(figure.height * scale))
    figure = figure.resize((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    x = (CANVAS_SIZE - width) // 2
    y = baseline - height
    if x < 0 or y < 0 or x + width > CANVAS_SIZE or y + height > CANVAS_SIZE:
        raise ValueError(
            f"Registered frame does not fit {CANVAS_SIZE}px canvas: "
            f"{width} x {height} at {x}, {y}"
        )
    canvas.alpha_composite(figure, (x, y))
    return canvas, alpha_bounds(canvas)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    windows_fonts = Path("C:/Windows/Fonts")
    candidates = (
        windows_fonts / ("arialbd.ttf" if bold else "arial.ttf"),
        windows_fonts / ("segoeuib.ttf" if bold else "segoeui.ttf"),
    )
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def make_contact_sheet(animation: dict[str, object], frames: list[dict[str, object]]) -> Path:
    columns = 6
    rows = 4
    tile_width = 230
    tile_height = 260
    margin = 26
    header_height = 112
    width = margin * 2 + columns * tile_width
    height = header_height + margin + rows * tile_height + margin
    sheet = Image.new("RGB", (width, height), "#07162b")
    draw = ImageDraw.Draw(sheet)
    title_font = load_font(28, bold=True)
    label_font = load_font(15, bold=True)
    body_font = load_font(14)

    draw.text((margin, 22), f"OUTFIT 03 · {animation['name']}", fill="#f8fbff", font=title_font)
    draw.text(
        (margin, 64),
        "24 named PNGs · frame 24 is an exact review-only copy of frame 01",
        fill="#74e6ff",
        font=body_font,
    )

    for entry in frames:
        index = int(entry["index"])
        row = (index - 1) // columns
        column = (index - 1) % columns
        x = margin + column * tile_width
        y = header_height + row * tile_height
        card = (x + 5, y + 5, x + tile_width - 8, y + tile_height - 8)
        fill = "#223452" if entry["runtime"] else "#452b47"
        outline = "#367495" if entry["runtime"] else "#f0a84d"
        draw.rounded_rectangle(card, radius=16, fill=fill, outline=outline, width=2)

        frame_path = ROOT / str(entry["file"])
        frame = Image.open(frame_path).convert("RGBA")
        preview = frame.resize((190, 190), Image.Resampling.LANCZOS)
        sheet.paste(preview, (x + 19, y + 9), preview)
        draw.text((x + 18, y + 202), f"{index:02d}", fill="#ffd75c", font=label_font)
        draw.text((x + 54, y + 202), str(entry["label"]), fill="#f8fbff", font=label_font)
        draw.text(
            (x + 18, y + 228),
            f"{entry['durationTicks']} ticks · {entry['slug']}",
            fill="#9db1c8",
            font=body_font,
        )

    qa_dir = OUTPUT_ROOT / "qa"
    qa_dir.mkdir(parents=True, exist_ok=True)
    output_path = qa_dir / f"hugo-{animation['id']}-contact-sheet.jpg"
    sheet.save(output_path, quality=93, optimize=True)
    return output_path


def extract_animation(animation: dict[str, object]) -> dict[str, object]:
    sheet_sources = [Image.open(path).convert("RGBA") for path in animation["sheets"]]
    sheet_components = [find_components(source) for source in sheet_sources]
    sheet_crops = [
        [crop_component(source, component) for component in components]
        for source, components in zip(sheet_sources, sheet_components, strict=True)
    ]

    # Frame 01 is deliberately the established Outfit 03 reference. Generated
    # sheet A frame 01 only determines a single scale for the remaining art.
    reference_crop_height = alpha_bounds(sheet_crops[0][0])[3] - alpha_bounds(sheet_crops[0][0])[1]
    scale = FIGURE_HEIGHT / reference_crop_height
    output_dir = OUTPUT_ROOT / str(animation["id"]) / "frames"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Avoid stale frames if the authored sequence changes later.
    for stale in output_dir.glob("*.png"):
        stale.unlink()

    canonical, canonical_bounds = registered_canonical(Path(animation["canonical"]))
    frames: list[dict[str, object]] = []
    generated_crops = sheet_crops[0][1:] + sheet_crops[1][:11]
    for zero_index, (slug, label, duration_ticks) in enumerate(
        zip(
            animation["slugs"],
            animation["labels"],
            animation["durationTicks"],
            strict=True,
        )
    ):
        index = zero_index + 1
        filename = f"hugo-{animation['id']}-{index:02d}-{slug}.png"
        output_path = output_dir / filename
        source_info: dict[str, object]

        if index == 1:
            frame = canonical
            bounds = canonical_bounds
            source_info = {
                "type": "canonical-outfit-pose",
                "file": Path(animation["canonical"]).relative_to(ROOT).as_posix(),
            }
            frame.save(output_path, optimize=True)
        elif index == 24:
            first_path = output_dir / f"hugo-{animation['id']}-01-{animation['slugs'][0]}.png"
            shutil.copyfile(first_path, output_path)
            frame = Image.open(output_path).convert("RGBA")
            bounds = alpha_bounds(frame)
            source_info = {
                "type": "exact-loop-bookend",
                "copiedFromFrame": 1,
            }
        else:
            crop = generated_crops[index - 2]
            baseline = (
                FLIGHT_BASELINE
                if index in set(animation["flightFrames"])
                else GROUND_BASELINE
            )
            frame, bounds = register_generated(crop, scale, baseline)
            frame.save(output_path, optimize=True)
            source_sheet_index = 0 if index <= 12 else 1
            source_cell_index = index - 1 if index <= 12 else index - 13
            source_info = {
                "type": "generated-sheet-frame",
                "sheet": Path(animation["sheets"][source_sheet_index])
                .relative_to(ROOT)
                .as_posix(),
                "sheetFrame": source_cell_index + 1,
                "row": source_cell_index // GRID_COLUMNS + 1,
                "column": source_cell_index % GRID_COLUMNS + 1,
            }

        frames.append(
            {
                "index": index,
                "slug": slug,
                "label": label,
                "filename": filename,
                "file": output_path.relative_to(ROOT).as_posix(),
                "runtime": index < 24,
                "durationTicks": duration_ticks,
                "durationSeconds": round(duration_ticks / 12, 4),
                "source": source_info,
                "output": {
                    "width": CANVAS_SIZE,
                    "height": CANVAS_SIZE,
                    "alphaBounds": list(bounds),
                    "sha256": sha256(output_path),
                },
            }
        )

    contact_sheet = make_contact_sheet(animation, frames)
    runtime_ticks = sum(int(frame["durationTicks"]) for frame in frames if frame["runtime"])
    manifest = {
        "schemaVersion": 1,
        "sandboxVersion": "02",
        "canonicalOutfit": "sunrise",
        "animation": {
            "id": animation["id"],
            "name": animation["name"],
            "description": animation["description"],
        },
        "timing": {
            "baseFps": 12,
            "drawingCount": len(frames),
            "runtimeFrameCount": len([frame for frame in frames if frame["runtime"]]),
            "runtimeTicks": runtime_ticks,
            "loopDurationSeconds": round(runtime_ticks / 12, 4),
            "bookendFrame": 24,
            "bookendRuntime": False,
        },
        "source": {
            "method": "two-sequential-4x3-sheets-extracted-to-individual-pngs",
            "canonicalPose": Path(animation["canonical"]).relative_to(ROOT).as_posix(),
            "transparentSheets": [
                {
                    "file": Path(path).relative_to(ROOT).as_posix(),
                    "width": image.width,
                    "height": image.height,
                    "columns": GRID_COLUMNS,
                    "rows": GRID_ROWS,
                    "sha256": sha256(Path(path)),
                }
                for path, image in zip(animation["sheets"], sheet_sources, strict=True)
            ],
            "chromaSheets": [
                Path(path).relative_to(ROOT).as_posix() for path in animation["chromaSheets"]
            ],
            "unusedGeneratedSeamCandidates": [
                {"sheet": "A", "sheetFrame": 1, "replacedBy": "canonical Outfit 03 pose"},
                {"sheet": "B", "sheetFrame": 12, "replacedBy": "exact copy of frame 01"},
            ],
        },
        "registration": {
            "method": "single-animation-scale-centred-on-fixed-baseline",
            "outputCanvas": [CANVAS_SIZE, CANVAS_SIZE],
            "generatedFigureHeightFromFrame01": FIGURE_HEIGHT,
            "groundBaseline": GROUND_BASELINE,
            "flightEffectBaseline": FLIGHT_BASELINE,
            "generatedScale": round(scale, 6),
        },
        "frames": frames,
        "qaContactSheet": contact_sheet.relative_to(ROOT).as_posix(),
    }
    manifest_path = OUTPUT_ROOT / str(animation["id"]) / "manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    manifests = [extract_animation(animation) for animation in ANIMATIONS]
    library = {
        "schemaVersion": 1,
        "sandboxVersion": "02",
        "canonicalOutfit": {
            "id": "sunrise",
            "displayName": "Outfit 03 · Sunrise Flight Suit",
            "manifest": "src/assets/game/2d-v02/sunrise/manifest.json",
        },
        "animationCount": len(manifests),
        "animations": [
            {
                "id": manifest["animation"]["id"],
                "name": manifest["animation"]["name"],
                "manifest": (
                    OUTPUT_ROOT / str(manifest["animation"]["id"]) / "manifest.json"
                ).relative_to(ROOT).as_posix(),
                "frameCount": manifest["timing"]["drawingCount"],
                "runtimeFrameCount": manifest["timing"]["runtimeFrameCount"],
                "loopDurationSeconds": manifest["timing"]["loopDurationSeconds"],
            }
            for manifest in manifests
        ],
    }
    (OUTPUT_ROOT / "manifest.json").write_text(
        json.dumps(library, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Extracted {sum(item['timing']['drawingCount'] for item in manifests)} "
        f"named frames across {len(manifests)} Outfit 03 loops into {OUTPUT_ROOT}"
    )


if __name__ == "__main__":
    main()
