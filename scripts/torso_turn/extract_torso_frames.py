"""Extract one coherent 24-view Hugo torso turn into registered PNG frames.

The source is a single 6 x 4 chroma-keyed atlas. Background removal happens
before this script runs. The extraction deliberately finds the 24 connected
torso silhouettes instead of assuming that generated artwork perfectly fills
an arithmetic grid: image generation can leave uneven outer margins even when
the visual layout is six columns by four rows.

No image from another generation may be inserted into this sequence.
"""

from __future__ import annotations

import argparse
from collections import deque
import hashlib
import json
import shutil
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


VIEW_COUNT = 24
COLUMNS = 6
ROWS = 4
STEP_DEGREES = 15
FRAME_SIZE = 320
ALPHA_HEIGHT = 260
TOP_GUTTER = 30
COMPONENT_ALPHA_THRESHOLD = 32
MINIMUM_COMPONENT_AREA = 5_000


@dataclass(frozen=True)
class Component:
    left: int
    top: int
    right: int
    bottom: int
    area: int

    @property
    def width(self) -> int:
        return self.right - self.left

    @property
    def height(self) -> int:
        return self.bottom - self.top

    @property
    def centre_x(self) -> float:
        return (self.left + self.right) / 2

    @property
    def centre_y(self) -> float:
        return (self.top + self.bottom) / 2


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def frame_filename(degrees: int) -> str:
    suffix = ""
    if degrees == 0:
        suffix = "-front"
    elif degrees == 90:
        suffix = "-left-profile"
    elif degrees == 180:
        suffix = "-back"
    elif degrees == 270:
        suffix = "-right-profile"
    return f"hugo-torso-yaw-cw-{degrees:03d}{suffix}.png"


def connected_components(alpha: Image.Image) -> list[Component]:
    width, height = alpha.size
    values = alpha.tobytes()
    foreground = bytearray(
        value > COMPONENT_ALPHA_THRESHOLD for value in values
    )
    visited = bytearray(width * height)
    components: list[Component] = []

    for start in range(width * height):
        if not foreground[start] or visited[start]:
            continue
        queue = deque([start])
        visited[start] = 1
        area = 0
        left = width
        top = height
        right = 0
        bottom = 0

        while queue:
            index = queue.popleft()
            y, x = divmod(index, width)
            area += 1
            left = min(left, x)
            top = min(top, y)
            right = max(right, x + 1)
            bottom = max(bottom, y + 1)

            for next_y in range(max(0, y - 1), min(height, y + 2)):
                row_start = next_y * width
                for next_x in range(max(0, x - 1), min(width, x + 2)):
                    neighbour = row_start + next_x
                    if foreground[neighbour] and not visited[neighbour]:
                        visited[neighbour] = 1
                        queue.append(neighbour)

        if area >= MINIMUM_COMPONENT_AREA:
            components.append(Component(left, top, right, bottom, area))

    if len(components) != VIEW_COUNT:
        raise ValueError(
            f"Expected {VIEW_COUNT} connected torso silhouettes, "
            f"found {len(components)}."
        )

    by_row = sorted(components, key=lambda component: component.centre_y)
    ordered: list[Component] = []
    for row_index in range(ROWS):
        row = by_row[row_index * COLUMNS:(row_index + 1) * COLUMNS]
        if len(row) != COLUMNS:
            raise ValueError(f"Row {row_index + 1} does not contain six torsos.")
        if max(item.centre_y for item in row) - min(item.centre_y for item in row) > 24:
            raise ValueError(f"Row {row_index + 1} is not vertically coherent.")
        ordered.extend(sorted(row, key=lambda component: component.centre_x))

    return ordered


def register_component(
    atlas: Image.Image,
    component: Component,
) -> Image.Image:
    isolated = atlas.crop(
        (component.left, component.top, component.right, component.bottom)
    )
    registered_width = round(isolated.width * ALPHA_HEIGHT / isolated.height)
    if registered_width >= FRAME_SIZE - 32:
        raise ValueError(
            f"Registered torso width {registered_width}px leaves less than "
            "a 16px horizontal gutter."
        )

    isolated = isolated.resize(
        (registered_width, ALPHA_HEIGHT),
        Image.Resampling.LANCZOS,
    )
    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    left_gutter = (FRAME_SIZE - registered_width) // 2
    frame.alpha_composite(isolated, (left_gutter, TOP_GUTTER))
    return frame


def alpha_bounds(image: Image.Image, filename: str) -> dict[str, float]:
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError(f"{filename}: frame is empty.")
    left, top, right, bottom = bounds
    if top != TOP_GUTTER or bottom != TOP_GUTTER + ALPHA_HEIGHT:
        raise ValueError(
            f"{filename}: alpha bounds must be y={TOP_GUTTER}.."
            f"{TOP_GUTTER + ALPHA_HEIGHT}, got {top}..{bottom}."
        )
    minimum_gutter = min(left, top, FRAME_SIZE - right, FRAME_SIZE - bottom)
    if minimum_gutter < 16:
        raise ValueError(f"{filename}: transparent gutter is smaller than 16px.")
    return {
        "left": left,
        "top": top,
        "right": right,
        "bottom": bottom,
        "centreX": (left + right) / 2,
        "centreY": (top + bottom) / 2,
        "alphaWidth": right - left,
        "alphaHeight": bottom - top,
    }


def build_contact_sheet(
    frames: list[dict[str, object]],
    frames_dir: Path,
    output_path: Path,
) -> None:
    cell_size = 244
    preview_size = 208
    sheet = Image.new(
        "RGB",
        (COLUMNS * cell_size, ROWS * cell_size),
        (17, 31, 58),
    )
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()

    for index, frame in enumerate(frames):
        column = index % COLUMNS
        row = index // COLUMNS
        cell_x = column * cell_size
        cell_y = row * cell_size
        draw.rounded_rectangle(
            (
                cell_x + 4,
                cell_y + 4,
                cell_x + cell_size - 5,
                cell_y + cell_size - 5,
            ),
            radius=12,
            fill=(55, 209, 228),
            outline=(255, 214, 97),
            width=3,
        )
        frame_path = frames_dir / Path(str(frame["file"])).name
        preview = Image.open(frame_path).convert("RGBA").resize(
            (preview_size, preview_size),
            Image.Resampling.LANCZOS,
        )
        sheet.paste(preview, (cell_x + 18, cell_y + 10), preview)
        draw.text(
            (cell_x + 12, cell_y + 222),
            f"{index + 1:02d}  {int(frame['degrees']):03d} deg",
            font=font,
            fill=(8, 22, 41),
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output_path, optimize=True)


def extract(
    source_path: Path,
    output_dir: Path,
    manifest_path: Path,
    contact_sheet_path: Path,
) -> None:
    atlas = Image.open(source_path).convert("RGBA")
    if atlas.size != (1536, 1024):
        raise ValueError(f"Expected source atlas 1536x1024, got {atlas.size}.")

    components = connected_components(atlas.getchannel("A"))
    staging_dir = output_dir.with_name(f"{output_dir.name}-staging")
    if staging_dir.exists():
        shutil.rmtree(staging_dir)
    staging_dir.mkdir(parents=True)

    frames: list[dict[str, object]] = []
    registered_bounds: list[dict[str, float]] = []
    for index, component in enumerate(components):
        degrees = index * STEP_DEGREES
        filename = frame_filename(degrees)
        output_path = staging_dir / filename
        frame = register_component(atlas, component)
        frame.save(output_path, optimize=True)
        bounds = alpha_bounds(frame, filename)
        registered_bounds.append(bounds)
        frames.append(
            {
                "index": index,
                "degrees": degrees,
                "file": f"frames/{filename}",
                "sourceAtlasIndex": index,
                "sourceBounds": [
                    component.left,
                    component.top,
                    component.right,
                    component.bottom,
                ],
                "sha256": sha256(output_path),
            }
        )

    if output_dir.exists():
        shutil.rmtree(output_dir)
    staging_dir.rename(output_dir)

    centre_x_values = [bounds["centreX"] for bounds in registered_bounds]
    centre_y_values = [bounds["centreY"] for bounds in registered_bounds]
    alpha_heights = [bounds["alphaHeight"] for bounds in registered_bounds]
    manifest = {
        "schemaVersion": 1,
        "id": "hugo-torso-turn-canonical-24",
        "viewCount": VIEW_COUNT,
        "stepDegrees": STEP_DEGREES,
        "playbackFps": 12,
        "loopDurationSeconds": VIEW_COUNT / 12,
        "zeroDegrees": "front",
        "direction": "clockwise-viewed-from-above",
        "orientationNotes": {
            "90Degrees": "Hugo's left profile",
            "180Degrees": "exact back",
            "270Degrees": "Hugo's right profile",
        },
        "source": {
            "file": source_path.as_posix(),
            "sheetLayout": [COLUMNS, ROWS],
            "uniqueViews": VIEW_COUNT,
            "singleGenerationOnly": True,
            "connectedComponentExtraction": True,
            "crossSheetInterleaving": False,
        },
        "registration": {
            "canvas": [FRAME_SIZE, FRAME_SIZE],
            "alphaHeight": ALPHA_HEIGHT,
            "topGutter": TOP_GUTTER,
            "neckSocket": [160, 62],
            "centreXSpread": max(centre_x_values) - min(centre_x_values),
            "centreYSpread": max(centre_y_values) - min(centre_y_values),
            "alphaHeightSpread": max(alpha_heights) - min(alpha_heights),
        },
        "sync": {
            "headManifest": (
                "src/assets/game/head-turn/canonical-24/manifest.json"
            ),
            "rule": "same-index-same-degree",
            "headLayer": "behind-torso-collar",
        },
        "frames": frames,
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    build_contact_sheet(frames, output_dir, contact_sheet_path)
    print(
        f"Extracted {VIEW_COUNT} registered torso frames, wrote "
        f"{manifest_path}, and built {contact_sheet_path}."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        type=Path,
        default=Path(
            "art/source-images/game/torso-turn/canonical-24/"
            "hugo-torso-yaw-cw-24-transparent.png"
        ),
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("src/assets/game/torso-turn/canonical-24/frames"),
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path(
            "src/assets/game/torso-turn/canonical-24/manifest.json"
        ),
    )
    parser.add_argument(
        "--contact-sheet",
        type=Path,
        default=Path(
            "art/source-images/game/torso-turn/canonical-24/"
            "qa-contact-sheet.png"
        ),
    )
    args = parser.parse_args()
    extract(
        args.source,
        args.output_dir,
        args.manifest,
        args.contact_sheet,
    )


if __name__ == "__main__":
    main()
