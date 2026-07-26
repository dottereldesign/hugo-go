"""Extract the approved HUGO GO! 2D V02 pose sheets into individual PNGs.

Each approved source is arranged as a 4 x 3 atlas. Figures are isolated by
their complete connected silhouettes, then ordered by their authored row and
column centres. This avoids rectangular cell cuts through wide wings or tall
jet flames while retaining the intended pose order.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = ROOT / "art" / "source-images" / "game" / "2d-v02"
OUTPUT_ROOT = ROOT / "src" / "assets" / "game" / "2d-v02"
CANVAS_SIZE = 512
FIGURE_LIMIT = 440
GRID_COLUMNS = 4
GRID_ROWS = 3

POSES = (
    ("neutral-front", "Neutral front"),
    ("ready-profile", "Ready profile"),
    ("sprint-launch", "Sprint launch"),
    ("jump-tuck", "Jump tuck"),
    ("level-glide", "Level glide"),
    ("steep-dive", "Steep dive"),
    ("bank-left", "Bank left"),
    ("bank-right", "Bank right"),
    ("jet-boost", "Jet boost"),
    ("landing-crouch", "Landing crouch"),
    ("braking-flare", "Braking flare"),
    ("hero-finish", "Hero finish"),
)

OUTFITS = (
    {
        "id": "skyline",
        "name": "Skyline Flight Suit",
        "description": "Navy, cyan and teal with orange flight accents.",
        "source": SOURCE_ROOT / "skyline" / "hugo-2d-skyline-poses-transparent.png",
        "chroma_source": SOURCE_ROOT / "skyline" / "hugo-2d-skyline-poses-magenta.png",
    },
    {
        "id": "night-comet",
        "name": "Night Comet Flight Suit",
        "description": "Midnight indigo, violet and electric cyan with silver panels.",
        "source": SOURCE_ROOT / "night-comet" / "hugo-2d-night-comet-poses-transparent.png",
        "chroma_source": SOURCE_ROOT / "night-comet" / "hugo-2d-night-comet-poses-magenta.png",
    },
    {
        "id": "sunrise",
        "name": "Sunrise Flight Suit",
        "description": "Burnt orange, cream and gold with teal engineering details.",
        "source": SOURCE_ROOT / "sunrise" / "hugo-2d-sunrise-poses-transparent.png",
        "chroma_source": SOURCE_ROOT / "sunrise" / "hugo-2d-sunrise-poses-magenta.png",
    },
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError("Pose cell contains no visible pixels")
    return bounds


def fit_pose(cell: Image.Image) -> tuple[Image.Image, tuple[int, int, int, int]]:
    bounds = alpha_bounds(cell)
    figure = cell.crop(bounds)
    scale = min(FIGURE_LIMIT / figure.width, FIGURE_LIMIT / figure.height)
    width = max(1, round(figure.width * scale))
    height = max(1, round(figure.height * scale))
    figure = figure.resize((width, height), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    x = (CANVAS_SIZE - width) // 2
    y = (CANVAS_SIZE - height) // 2
    canvas.alpha_composite(figure, (x, y))
    return canvas, (x, y, x + width, y + height)


def find_pose_components(source: Image.Image) -> list[dict[str, object]]:
    alpha = np.asarray(source.getchannel("A"))
    mask = (alpha > 16).astype(np.uint8)
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(mask, 8)
    components: list[dict[str, object]] = []

    for label_id in range(1, count):
        x, y, width, height, area = (int(value) for value in stats[label_id])
        if area < 1000:
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

    if len(components) != len(POSES):
        raise ValueError(
            f"Expected {len(POSES)} complete pose silhouettes, found {len(components)}"
        )

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
    crop.putalpha(Image.composite(crop.getchannel("A"), Image.new("L", crop.size), component_mask))
    return crop


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


def make_contact_sheet(outfit: dict[str, object], pose_entries: list[dict[str, object]]) -> Path:
    tile_width = 290
    tile_height = 346
    margin = 28
    header_height = 116
    sheet_width = margin * 2 + GRID_COLUMNS * tile_width
    sheet_height = header_height + margin + GRID_ROWS * tile_height + margin
    sheet = Image.new("RGB", (sheet_width, sheet_height), "#06172f")
    draw = ImageDraw.Draw(sheet)
    title_font = load_font(31, bold=True)
    body_font = load_font(17)
    label_font = load_font(17, bold=True)

    draw.text((margin, 24), f"2D SANDBOX V02 · {outfit['name']}", fill="#f8fbff", font=title_font)
    draw.text(
        (margin, 68),
        "12 extracted transparent PNGs · fixed 4 × 3 source order",
        fill="#83e8ff",
        font=body_font,
    )

    for entry in pose_entries:
        index = int(entry["index"])
        row = (index - 1) // GRID_COLUMNS
        column = (index - 1) % GRID_COLUMNS
        x = margin + column * tile_width
        y = header_height + row * tile_height
        card = (x + 6, y + 6, x + tile_width - 8, y + tile_height - 10)
        draw.rounded_rectangle(card, radius=18, fill="#102c50", outline="#2e7194", width=2)

        pose_path = ROOT / str(entry["file"])
        pose = Image.open(pose_path).convert("RGBA")
        preview = pose.resize((246, 246), Image.Resampling.LANCZOS)
        sheet.paste(preview, (x + 21, y + 18), preview)
        draw.text((x + 22, y + 278), f"{index:02d}", fill="#ffd35f", font=label_font)
        draw.text((x + 60, y + 278), str(entry["label"]), fill="#f8fbff", font=label_font)
        draw.text(
            (x + 22, y + 308),
            f"{index:02d} · {entry['slug']}.png",
            fill="#91aac5",
            font=body_font,
        )

    qa_dir = OUTPUT_ROOT / "qa"
    qa_dir.mkdir(parents=True, exist_ok=True)
    qa_path = qa_dir / f"hugo-2d-{outfit['id']}-contact-sheet.jpg"
    sheet.save(qa_path, quality=92, optimize=True)
    return qa_path


def extract_outfit(outfit: dict[str, object]) -> dict[str, object]:
    source_path = Path(outfit["source"])
    source = Image.open(source_path).convert("RGBA")
    if source.width <= 0 or source.height <= 0:
        raise ValueError(f"Invalid source dimensions: {source_path}")

    output_dir = OUTPUT_ROOT / str(outfit["id"]) / "poses"
    output_dir.mkdir(parents=True, exist_ok=True)
    pose_entries: list[dict[str, object]] = []

    components = find_pose_components(source)

    for zero_index, (slug, label) in enumerate(POSES):
        row = zero_index // GRID_COLUMNS
        column = zero_index % GRID_COLUMNS
        component = components[zero_index]
        cell = crop_component(source, component)
        normalized, output_bounds = fit_pose(cell)
        filename = f"hugo-2d-{outfit['id']}-{zero_index + 1:02d}-{slug}.png"
        output_path = output_dir / filename
        normalized.save(output_path, optimize=True)
        relative_path = output_path.relative_to(ROOT).as_posix()

        pose_entries.append(
            {
                "index": zero_index + 1,
                "slug": slug,
                "label": label,
                "filename": filename,
                "file": relative_path,
                "sourceCell": {
                    "row": row + 1,
                    "column": column + 1,
                    "componentBounds": list(component["bounds"]),
                    "componentCentre": [
                        round(float(component["centre"][0]), 2),
                        round(float(component["centre"][1]), 2),
                    ],
                    "componentArea": component["area"],
                },
                "output": {
                    "width": CANVAS_SIZE,
                    "height": CANVAS_SIZE,
                    "alphaBounds": list(output_bounds),
                    "sha256": sha256(output_path),
                },
            }
        )

    qa_path = make_contact_sheet(outfit, pose_entries)
    manifest = {
        "schemaVersion": 1,
        "sandboxVersion": "02",
        "outfit": {
            "id": outfit["id"],
            "name": outfit["name"],
            "description": outfit["description"],
        },
        "source": {
            "transparentSheet": source_path.relative_to(ROOT).as_posix(),
            "chromaSheet": Path(outfit["chroma_source"]).relative_to(ROOT).as_posix(),
            "width": source.width,
            "height": source.height,
            "columns": GRID_COLUMNS,
            "rows": GRID_ROWS,
            "sha256": sha256(source_path),
        },
        "extraction": {
            "method": "connected-silhouette-ordered-by-grid-centre",
            "alphaThreshold": 16,
            "minimumComponentArea": 1000,
            "outputCanvas": [CANVAS_SIZE, CANVAS_SIZE],
            "figureLimit": FIGURE_LIMIT,
            "poseCount": len(pose_entries),
        },
        "poses": pose_entries,
        "qaContactSheet": qa_path.relative_to(ROOT).as_posix(),
    }
    manifest_path = OUTPUT_ROOT / str(outfit["id"]) / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    manifests = [extract_outfit(outfit) for outfit in OUTFITS]
    library = {
        "schemaVersion": 1,
        "sandboxVersion": "02",
        "direction": "2D pose library",
        "sheetCount": len(manifests),
        "poseCountPerSheet": len(POSES),
        "individualPoseCount": len(manifests) * len(POSES),
        "outfits": [
            {
                "id": manifest["outfit"]["id"],
                "name": manifest["outfit"]["name"],
                "manifest": (
                    OUTPUT_ROOT / str(manifest["outfit"]["id"]) / "manifest.json"
                ).relative_to(ROOT).as_posix(),
            }
            for manifest in manifests
        ],
    }
    (OUTPUT_ROOT / "manifest.json").write_text(
        json.dumps(library, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Extracted {library['individualPoseCount']} poses from "
        f"{library['sheetCount']} approved sheets into {OUTPUT_ROOT}"
    )


if __name__ == "__main__":
    main()
