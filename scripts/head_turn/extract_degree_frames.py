"""Extract one degree-addressed Hugo head turn from one coherent source atlas.

The source atlas contains 24 unique registered views plus one pixel-identical
bookend. The unique views are reordered so 0 degrees is front-facing, then each
view is written unchanged as an individual 15-degree PNG. The JSON manifest is
the only source of playback order.

This script deliberately accepts only one source atlas. It cannot interpolate,
interleave, append, or patch frames from another generation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image


VIEW_COUNT = 24
SOURCE_COLUMNS = 5
STEP_DEGREES = 15
SOURCE_FRONT_INDEX = 6
CELL_SIZE = 320


def extract_source_views(atlas: Image.Image) -> list[Image.Image]:
    expected_size = (SOURCE_COLUMNS * CELL_SIZE, SOURCE_COLUMNS * CELL_SIZE)
    if atlas.size != expected_size:
        raise ValueError(f"Expected source atlas {expected_size}, got {atlas.size}.")

    source_cells = []
    for frame_index in range(VIEW_COUNT):
        left = frame_index % SOURCE_COLUMNS * CELL_SIZE
        top = frame_index // SOURCE_COLUMNS * CELL_SIZE
        source_cells.append(
            atlas.crop((left, top, left + CELL_SIZE, top + CELL_SIZE))
        )

    opening = source_cells[0].tobytes()
    bookend = atlas.crop(
        (
            4 * CELL_SIZE,
            4 * CELL_SIZE,
            5 * CELL_SIZE,
            5 * CELL_SIZE,
        )
    ).tobytes()
    if opening != bookend:
        raise ValueError("Source atlas bookend is not pixel-identical to frame 1.")

    # The approved source begins at a right profile. Frame 7 is the exact front,
    # so rotate the list—not the images—to make it the 0-degree source view.
    return [
        source_cells[(SOURCE_FRONT_INDEX + index) % VIEW_COUNT]
        for index in range(VIEW_COUNT)
    ]


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
    return f"hugo-head-yaw-cw-{degrees:03d}{suffix}.png"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def validate_frame(image: Image.Image, filename: str) -> None:
    if image.size != (CELL_SIZE, CELL_SIZE):
        raise ValueError(f"{filename}: expected {CELL_SIZE}px square.")
    alpha_bounds = image.getchannel("A").getbbox()
    if alpha_bounds is None:
        raise ValueError(f"{filename}: frame is empty.")
    left, top, right, bottom = alpha_bounds
    if min(left, top, CELL_SIZE - right, CELL_SIZE - bottom) < 16:
        raise ValueError(f"{filename}: transparent gutter is smaller than 16px.")


def extract_frames(source_path: Path, output_dir: Path, manifest_path: Path) -> None:
    source = Image.open(source_path).convert("RGBA")
    views = extract_source_views(source)

    staging_dir = output_dir.with_name(f"{output_dir.name}-staging")
    if staging_dir.exists():
        shutil.rmtree(staging_dir)
    staging_dir.mkdir(parents=True)

    manifest_frames = []
    for index, frame in enumerate(views):
        degrees = index * STEP_DEGREES
        filename = frame_filename(degrees)
        validate_frame(frame, filename)
        output_path = staging_dir / filename
        frame.save(output_path, optimize=True)
        manifest_frames.append(
            {
                "index": index,
                "degrees": degrees,
                "file": f"frames/{filename}",
                "sourceAtlasIndex": (SOURCE_FRONT_INDEX + index) % VIEW_COUNT,
                "sha256": sha256(output_path),
            }
        )

    if output_dir.exists():
        shutil.rmtree(output_dir)
    staging_dir.rename(output_dir)

    manifest = {
        "schemaVersion": 1,
        "id": "hugo-head-turn-canonical-24",
        "viewCount": VIEW_COUNT,
        "stepDegrees": STEP_DEGREES,
        "zeroDegrees": "front",
        "direction": "clockwise-viewed-from-above",
        "orientationNotes": {
            "90Degrees": "Hugo's left profile",
            "180Degrees": "exact back",
            "270Degrees": "Hugo's right profile",
        },
        "source": {
            "file": source_path.as_posix(),
            "uniqueViews": VIEW_COUNT,
            "stepDegrees": STEP_DEGREES,
            "frontSourceIndexOneBased": SOURCE_FRONT_INDEX + 1,
            "singleSequenceOnly": True,
            "pixelChangesDuringExtraction": False,
        },
        "frames": manifest_frames,
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Extracted {VIEW_COUNT} unchanged individual frames to {output_dir} "
        f"and manifest to {manifest_path}."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        type=Path,
        default=Path(
            "src/assets/game/head-turn/v2/"
            "hugo-head-turn-stabilized-24.png"
        ),
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("src/assets/game/head-turn/canonical-24/frames"),
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("src/assets/game/head-turn/canonical-24/manifest.json"),
    )
    args = parser.parse_args()
    extract_frames(args.source, args.output_dir, args.manifest)


if __name__ == "__main__":
    main()
