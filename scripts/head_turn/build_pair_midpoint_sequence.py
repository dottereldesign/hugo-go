"""Build the 48-view Hugo head turn from approved anchors and paired midpoints.

The 24 canonical anchor PNGs are copied byte-for-byte. Each generated midpoint
is accepted only for the adjacent 15-degree pair named in its filename, then
registered to the anchors' permanent 320px canvas, 240px alpha height, and
centre. No sprite sheet is read, sliced, interleaved, or used for playback.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
ANCHOR_MANIFEST_PATH = (
    ROOT / "src/assets/game/head-turn/canonical-24/manifest.json"
)
MIDPOINT_SOURCE_DIR = (
    ROOT
    / "art/source-images/game/head-turn/canonical-48/midpoint-transparent"
)
OUTPUT_ROOT = ROOT / "src/assets/game/head-turn/canonical-48"
OUTPUT_FRAMES_DIR = OUTPUT_ROOT / "frames"
OUTPUT_MANIFEST_PATH = OUTPUT_ROOT / "manifest.json"
QA_CONTACT_PATH = (
    ROOT / "art/source-images/game/head-turn/canonical-48/qa-contact-sheet.png"
)

FRAME_SIZE = 320
ALPHA_HEIGHT = 240
TOP_GUTTER = 40
VIEW_COUNT = 48
STEP_DEGREES = 7.5


def angle_token(degrees: float) -> str:
    whole = int(degrees)
    if degrees.is_integer():
        return f"{whole:03d}"
    return f"{whole:03d}p5"


def frame_filename(degrees: float) -> str:
    suffix = ""
    if degrees == 0:
        suffix = "-front"
    elif degrees == 90:
        suffix = "-left-profile"
    elif degrees == 180:
        suffix = "-back"
    elif degrees == 270:
        suffix = "-right-profile"
    return f"hugo-head-yaw-cw-{angle_token(degrees)}{suffix}.png"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("Head image has no non-transparent pixels.")
    return bounds


def register_midpoint(source_path: Path) -> Image.Image:
    source = Image.open(source_path).convert("RGBA")
    left, top, right, bottom = alpha_bounds(source)
    isolated = source.crop((left, top, right, bottom))
    source_width, source_height = isolated.size
    registered_width = round(source_width * ALPHA_HEIGHT / source_height)
    if registered_width >= FRAME_SIZE - 32:
        raise ValueError(
            f"{source_path.name}: registered width {registered_width}px leaves "
            "less than a 16px horizontal gutter."
        )

    isolated = isolated.resize(
        (registered_width, ALPHA_HEIGHT),
        Image.Resampling.LANCZOS,
    )
    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    left_gutter = (FRAME_SIZE - registered_width) // 2
    frame.alpha_composite(isolated, (left_gutter, TOP_GUTTER))
    return frame


def validate_registered_frame(image: Image.Image, filename: str) -> dict[str, float]:
    if image.size != (FRAME_SIZE, FRAME_SIZE):
        raise ValueError(f"{filename}: expected {FRAME_SIZE}px square.")
    left, top, right, bottom = alpha_bounds(image)
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
    manifest_frames: list[dict[str, object]],
    frames_dir: Path,
) -> None:
    columns = 8
    rows = 6
    cell_width = 220
    cell_height = 244
    preview_size = 200
    sheet = Image.new(
        "RGB",
        (columns * cell_width, rows * cell_height),
        (17, 31, 58),
    )
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()

    for index, frame in enumerate(manifest_frames):
        column = index % columns
        row = index // columns
        cell_x = column * cell_width
        cell_y = row * cell_height
        is_midpoint = frame["kind"] == "generated-midpoint"
        background = (55, 209, 228) if is_midpoint else (116, 240, 177)
        border = (255, 214, 97) if is_midpoint else (255, 255, 255)
        draw.rectangle(
            (
                cell_x + 4,
                cell_y + 4,
                cell_x + cell_width - 5,
                cell_y + cell_height - 5,
            ),
            fill=background,
            outline=border,
            width=4,
        )
        frame_path = frames_dir / Path(str(frame["file"])).name
        preview = Image.open(frame_path).convert("RGBA").resize(
            (preview_size, preview_size),
            Image.Resampling.LANCZOS,
        )
        sheet.paste(preview, (cell_x + 10, cell_y + 10), preview)
        label = (
            f"{index + 1:02d}  {float(frame['degrees']):05.1f} deg  "
            f"{'MID' if is_midpoint else 'ANCHOR'}"
        )
        draw.text(
            (cell_x + 9, cell_y + 216),
            label,
            font=font,
            fill=(8, 22, 41),
        )

    QA_CONTACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(QA_CONTACT_PATH, optimize=True)


def build() -> None:
    anchor_manifest = json.loads(
        ANCHOR_MANIFEST_PATH.read_text(encoding="utf-8")
    )
    anchors_by_angle = {
        float(frame["degrees"]): frame for frame in anchor_manifest["frames"]
    }
    if sorted(anchors_by_angle) != [float(angle) for angle in range(0, 360, 15)]:
        raise ValueError("Canonical anchor manifest is not the expected 15-degree set.")

    staging_dir = OUTPUT_FRAMES_DIR.with_name("frames-staging")
    if staging_dir.exists():
        shutil.rmtree(staging_dir)
    staging_dir.mkdir(parents=True)

    manifest_frames: list[dict[str, object]] = []
    registered_bounds: list[dict[str, float]] = []
    for index in range(VIEW_COUNT):
        degrees = index * STEP_DEGREES
        filename = frame_filename(degrees)
        output_path = staging_dir / filename
        if index % 2 == 0:
            anchor = anchors_by_angle[degrees]
            source_path = ANCHOR_MANIFEST_PATH.parent / str(anchor["file"])
            shutil.copy2(source_path, output_path)
            if sha256(output_path) != anchor["sha256"]:
                raise ValueError(f"{filename}: copied anchor bytes changed.")
            kind = "approved-anchor"
            provenance = {
                "sourceFile": str(
                    source_path.relative_to(ROOT).as_posix()
                ),
                "canonical24Index": anchor["index"],
            }
        else:
            source_path = MIDPOINT_SOURCE_DIR / (
                f"hugo-head-yaw-cw-{angle_token(degrees)}.png"
            )
            if not source_path.exists():
                raise FileNotFoundError(
                    f"Missing paired midpoint source: {source_path}"
                )
            registered = register_midpoint(source_path)
            registered.save(output_path, optimize=True)
            start_degrees = (degrees - STEP_DEGREES) % 360
            end_degrees = (degrees + STEP_DEGREES) % 360
            kind = "generated-midpoint"
            provenance = {
                "sourceFile": str(
                    source_path.relative_to(ROOT).as_posix()
                ),
                "generatedFromDegrees": [start_degrees, end_degrees],
                "generationContract": "one-adjacent-pair-per-call",
            }

        image = Image.open(output_path).convert("RGBA")
        bounds = validate_registered_frame(image, filename)
        registered_bounds.append(bounds)
        manifest_frames.append(
            {
                "index": index,
                "degrees": degrees,
                "file": f"frames/{filename}",
                "kind": kind,
                **provenance,
                "sha256": sha256(output_path),
            }
        )

    if OUTPUT_FRAMES_DIR.exists():
        shutil.rmtree(OUTPUT_FRAMES_DIR)
    staging_dir.rename(OUTPUT_FRAMES_DIR)

    centre_x_values = [bounds["centreX"] for bounds in registered_bounds]
    centre_y_values = [bounds["centreY"] for bounds in registered_bounds]
    alpha_heights = [bounds["alphaHeight"] for bounds in registered_bounds]
    minimum_gutter = min(
        min(
            bounds["left"],
            bounds["top"],
            FRAME_SIZE - bounds["right"],
            FRAME_SIZE - bounds["bottom"],
        )
        for bounds in registered_bounds
    )
    manifest = {
        "schemaVersion": 1,
        "id": "hugo-head-turn-paired-midpoints-48",
        "viewCount": VIEW_COUNT,
        "stepDegrees": STEP_DEGREES,
        "playbackFps": 60,
        "loopDurationSeconds": VIEW_COUNT / 60,
        "zeroDegrees": "front",
        "direction": "clockwise-viewed-from-above",
        "orientationNotes": {
            "90Degrees": "Hugo's left profile",
            "180Degrees": "exact back",
            "270Degrees": "Hugo's right profile",
        },
        "derivation": {
            "approvedAnchorCount": 24,
            "generatedMidpointCount": 24,
            "anchorStepDegrees": 15,
            "midpointStepDegrees": 7.5,
            "pairSpecificGeneration": True,
            "sheetSlicing": False,
            "independentSheetInterleaving": False,
            "anchorsCopiedByteForByte": True,
        },
        "registration": {
            "canvas": [FRAME_SIZE, FRAME_SIZE],
            "alphaHeight": ALPHA_HEIGHT,
            "topGutter": TOP_GUTTER,
            "centreXSpread": max(centre_x_values) - min(centre_x_values),
            "centreYSpread": max(centre_y_values) - min(centre_y_values),
            "alphaHeightSpread": max(alpha_heights) - min(alpha_heights),
            "minimumGutter": minimum_gutter,
        },
        "frames": manifest_frames,
    }
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    OUTPUT_MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    build_contact_sheet(manifest_frames, OUTPUT_FRAMES_DIR)
    print(
        f"Built {VIEW_COUNT} individual registered frames, manifest "
        f"{OUTPUT_MANIFEST_PATH.relative_to(ROOT)}, and QA contact sheet "
        f"{QA_CONTACT_PATH.relative_to(ROOT)}."
    )


if __name__ == "__main__":
    build()
