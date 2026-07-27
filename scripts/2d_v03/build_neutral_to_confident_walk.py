"""Build the Version 03 Neutral Side to Confident Walk transition."""
from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = (
    ROOT
    / "art/source-images/game/2d-v03/animations/neutral-to-confident-walk-v1"
)
SOURCE_SHEET = (
    SOURCE_ROOT / "hugo-neutral-to-confident-walk-three-inbetweens-transparent.png"
)
CONTINUATION_ROOT = (
    ROOT
    / "art/source-images/game/2d-v03/animations/neutral-to-confident-walk-v2"
)
CONTINUATION_SOURCES = (
    (
        "hugo-neutral-to-confident-walk-06-rear-toe-off-transparent.png",
        "Rear-foot toe-off",
        25,
    ),
    (
        "hugo-neutral-to-confident-walk-07-opposite-leg-passing-transparent.png",
        "Opposite leg passing",
        50,
    ),
    (
        "hugo-neutral-to-confident-walk-08-opposite-leg-forward-swing-transparent.png",
        "Opposite leg forward swing",
        75,
    ),
    (
        "hugo-neutral-to-confident-walk-09-opposite-contact-transparent.png",
        "Opposite-leg contact",
        100,
    ),
)
REGISTERED_SHEET = (
    CONTINUATION_ROOT / "hugo-neutral-to-confident-walk-nine-drawings-registered.png"
)
POSE_ROOT = ROOT / "src/assets/game/2d-v03/sunrise-side/poses"
OUTPUT = ROOT / "src/assets/game/2d-v03/animations/neutral-to-confident-walk"
FRAME_ROOT = OUTPUT / "frames"

CANVAS = 512
BASE_FPS = 10
START_HEIGHT = 323
END_HEIGHT = 317
START_BASELINE = 417
END_BASELINE = 414
GENERATED_PROGRESS = (0.25, 0.5, 0.75)

START_POSE = (
    ROOT
    / "src/assets/game/2d-v03/animations/head-nod-soft-inbetweens/frames"
    / "hugo-head-nod-smooth-01-approved-00-percent.png"
)
END_POSE = POSE_ROOT / "hugo-sunrise-side-02-confident-walk.png"

DRAWINGS = (
    (
        "hugo-neutral-to-confident-01-approved-neutral-side.png",
        "Approved Neutral Side start",
        "approved original",
        0,
    ),
    (
        "hugo-neutral-to-confident-02-generated-weight-shift.png",
        "Generated early weight shift",
        "generated in-between",
        25,
    ),
    (
        "hugo-neutral-to-confident-03-generated-passing-step.png",
        "Generated passing step",
        "generated in-between",
        50,
    ),
    (
        "hugo-neutral-to-confident-04-generated-stride-open.png",
        "Generated stride opening",
        "generated in-between",
        75,
    ),
    (
        "hugo-neutral-to-confident-05-approved-confident-walk.png",
        "Approved Confident Walk contact",
        "approved original",
        100,
    ),
    (
        "hugo-neutral-to-confident-06-generated-rear-toe-off.png",
        "Generated rear-foot toe-off",
        "generated opposite-step continuation",
        125,
    ),
    (
        "hugo-neutral-to-confident-07-generated-opposite-leg-passing.png",
        "Generated opposite leg passing",
        "generated opposite-step continuation",
        150,
    ),
    (
        "hugo-neutral-to-confident-08-generated-opposite-leg-forward-swing.png",
        "Generated opposite leg forward swing",
        "generated opposite-step continuation",
        175,
    ),
    (
        "hugo-neutral-to-confident-09-generated-opposite-contact.png",
        "Generated opposite-leg contact",
        "generated opposite-step continuation",
        200,
    ),
)

RUNTIME_SEQUENCE = (1, 1, 2, 3, 4, 5, 6, 7, 8, 9)

PROMPT = """Extend the exact Neutral Side to approved Confident Walk transition
with four new complete full-body drawings after source frame 5. In source frame
5 Hugo faces screen-right with one leg leading toward screen-right and the
other leg trailing toward screen-left. Lock those leg identities: the trailing
leg must now perform the next step while the current leading leg accepts the
weight and moves behind. Draw, in order, rear-foot toe-off, the same rear leg
passing beneath and ahead of the hips, its forward swing, and a clear
opposite-leg contact. Counter-swing the arms naturally and keep every adjacent
drawing a small chronological motion delta. Do not let the already-leading leg
take a second step. Preserve Hugo's exact face, spiky brown hair, proportions,
warm peach/tan skin, orange-and-cream Outfit 03 Sunrise suit, yellow/orange back
panel, dark trim, knee pads, and black basketball shoes. Match the canonical
polished 2D game-character linework, lighting, shading, colour, scale, and
strict screen-right side-profile perspective. Redraw the complete figure in
every image on a perfectly flat solid #FF00FF chroma background with generous
padding. No duplicate poses, cropped hair, hands, legs, or shoes; no extra
people, props, fragments, text, labels, borders, shadows, reflections, or
watermark."""


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
        raise ValueError(f"Source sheet must divide into three columns, got {sheet.size}")
    cell_width = sheet.width // 3
    cells = [
        sheet.crop((index * cell_width, 0, (index + 1) * cell_width, sheet.height))
        for index in range(3)
    ]
    for index, cell in enumerate(cells, 1):
        left, top, right, bottom = alpha_bounds(cell)
        if left <= 8 or right >= cell.width - 8 or top <= 8 or bottom >= cell.height - 8:
            raise ValueError(f"Generated source cell {index} touches a boundary")
    return cells


def validate_frame(image: Image.Image, label: str) -> None:
    bounds = alpha_bounds(image)
    if bounds[0] < 90 or bounds[1] < 60 or bounds[2] > 422 or bounds[3] > 438:
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
    if not areas or areas[0] < 10_000:
        raise ValueError(f"{label}: incomplete character {areas[:5]}")
    if len(areas) > 1 and areas[1] > 500:
        raise ValueError(f"{label}: detached artwork {areas[:5]}")


def register_generated(
    cells: list[Image.Image],
) -> tuple[list[Image.Image], list[dict[str, object]]]:
    frames: list[Image.Image] = []
    metadata: list[dict[str, object]] = []
    for index, (cell, progress) in enumerate(
        zip(cells, GENERATED_PROGRESS, strict=True),
        1,
    ):
        source_bounds = alpha_bounds(cell)
        crop = cell.crop(source_bounds)
        target_height = round(
            START_HEIGHT + (END_HEIGHT - START_HEIGHT) * progress
        )
        target_baseline = round(
            START_BASELINE + (END_BASELINE - START_BASELINE) * progress
        )
        target_width = round(crop.width * target_height / crop.height)
        resized = crop.resize((target_width, target_height), Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", (CANVAS, CANVAS))
        left = round((CANVAS - target_width) / 2)
        top = target_baseline - target_height
        frame.alpha_composite(resized, (left, top))
        validate_frame(frame, f"Generated in-between {index}")
        frames.append(frame)
        metadata.append(
            {
                "sourceCell": index,
                "sourceBounds": list(source_bounds),
                "progressPercent": round(progress * 100),
                "uniformScale": round(target_height / crop.height, 6),
                "targetHeight": target_height,
                "targetBaselineY": target_baseline,
                "alphaBounds": list(alpha_bounds(frame)),
            }
        )
    return frames, metadata


def register_continuation() -> tuple[list[Image.Image], list[dict[str, object]]]:
    frames: list[Image.Image] = []
    metadata: list[dict[str, object]] = []
    for filename, label, phase_percent in CONTINUATION_SOURCES:
        source_path = CONTINUATION_ROOT / filename
        source = Image.open(source_path).convert("RGBA")
        source_bounds = alpha_bounds(source)
        left, top, right, bottom = source_bounds
        if left <= 8 or right >= source.width - 8 or top <= 8 or bottom >= source.height - 8:
            raise ValueError(f"{label}: generated source touches a boundary")

        crop = source.crop(source_bounds)
        target_height = END_HEIGHT
        target_baseline = END_BASELINE
        target_width = round(crop.width * target_height / crop.height)
        resized = crop.resize((target_width, target_height), Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", (CANVAS, CANVAS))
        frame_left = round((CANVAS - target_width) / 2)
        frame_top = target_baseline - target_height
        frame.alpha_composite(resized, (frame_left, frame_top))
        validate_frame(frame, label)
        frames.append(frame)
        metadata.append(
            {
                "sourceFile": str(source_path.relative_to(ROOT)).replace("\\", "/"),
                "sourceBounds": list(source_bounds),
                "oppositeStepPhasePercent": phase_percent,
                "uniformScale": round(target_height / crop.height, 6),
                "targetHeight": target_height,
                "targetBaselineY": target_baseline,
                "alphaBounds": list(alpha_bounds(frame)),
            }
        )
    return frames, metadata


def save_registered_sheet(drawings: list[Image.Image]) -> None:
    sheet = Image.new("RGBA", (CANVAS * len(drawings), CANVAS))
    for index, drawing in enumerate(drawings):
        sheet.alpha_composite(drawing, (index * CANVAS, 0))
    sheet.save(REGISTERED_SHEET, optimize=True)


def write_manifest(
    paths: list[Path],
    generated_metadata: list[dict[str, object]],
    continuation_metadata: list[dict[str, object]],
) -> None:
    runtime_frames = []
    for runtime_index, source_index in enumerate(RUNTIME_SEQUENCE, 1):
        filename, label, _, _ = DRAWINGS[source_index - 1]
        hold = " · hold" if runtime_index in (1, 2) else ""
        runtime_frames.append(
            {
                "index": runtime_index,
                "sourceFrame": source_index,
                "label": f"{label}{hold}",
                "filename": filename,
                "runtime": True,
            }
        )

    metadata_lookup = {
        2: generated_metadata[0],
        3: generated_metadata[1],
        4: generated_metadata[2],
        6: continuation_metadata[0],
        7: continuation_metadata[1],
        8: continuation_metadata[2],
        9: continuation_metadata[3],
    }
    unique_drawings = []
    for index, (path, drawing) in enumerate(zip(paths, DRAWINGS, strict=True), 1):
        _, _, kind, progress_percent = drawing
        unique_drawings.append(
            {
                "sourceFrame": index,
                "filename": path.name,
                "kind": kind,
                "progressPercent": progress_percent,
                "sha256": sha256(path),
                "alphaBounds": list(
                    alpha_bounds(Image.open(path).convert("RGBA"))
                ),
                **metadata_lookup.get(index, {}),
            }
        )

    manifest = {
        "schemaVersion": 1,
        "animation": {
            "id": "neutral-to-confident-walk",
            "assetDirectory": "neutral-to-confident-walk",
            "name": "Neutral Side · Step into confident walk",
            "description": (
                "The exact Neutral Side start transitions through three new "
                "whole-body drawings into the approved Confident Walk, then "
                "continues through the opposite leg's complete next step."
            ),
            "stageLabel": "OUTFIT 03 · WALK START",
            "prompt": PROMPT,
        },
        "timing": {
            "baseFps": BASE_FPS,
            "runtimeFrameCount": len(RUNTIME_SEQUENCE),
            "drawingCount": len(DRAWINGS),
            "loopDurationSeconds": round(len(RUNTIME_SEQUENCE) / BASE_FPS, 3),
            "bookendFrame": len(RUNTIME_SEQUENCE),
        },
        "productionMethod": (
            "two exact approved figures plus three complete generated transition "
            "drawings and four complete generated opposite-step drawings; chroma "
            "cleanup and deterministic whole-body registration only; no body-part "
            "compositing, code interpolation, or runtime sheet slicing"
        ),
        "source": {
            "generatedSheet": str(SOURCE_SHEET.relative_to(ROOT)).replace("\\", "/"),
            "continuationDrawings": [
                str((CONTINUATION_ROOT / filename).relative_to(ROOT)).replace("\\", "/")
                for filename, _, _ in CONTINUATION_SOURCES
            ],
            "registeredSequence": str(REGISTERED_SHEET.relative_to(ROOT)).replace(
                "\\", "/"
            ),
            "startEndpoint": str(START_POSE.relative_to(ROOT)).replace("\\", "/"),
            "endEndpoint": str(END_POSE.relative_to(ROOT)).replace("\\", "/"),
            "uniqueDrawings": unique_drawings,
        },
        "frames": runtime_frames,
    }
    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    generated, metadata = register_generated(source_cells())
    continuation, continuation_metadata = register_continuation()
    start = Image.open(START_POSE).convert("RGBA")
    end = Image.open(END_POSE).convert("RGBA")
    drawings = [start, *generated, end, *continuation]
    for drawing, (_, label, _, _) in zip(drawings, DRAWINGS, strict=True):
        validate_frame(drawing, label)

    FRAME_ROOT.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for index, (drawing, (filename, _, kind, _)) in enumerate(
        zip(drawings, DRAWINGS, strict=True)
    ):
        path = FRAME_ROOT / filename
        if kind == "approved original":
            shutil.copyfile(START_POSE if index == 0 else END_POSE, path)
        else:
            drawing.save(path, optimize=True)
        paths.append(path)

    save_registered_sheet(drawings)
    write_manifest(paths, metadata, continuation_metadata)
    print("Built 9-drawing Neutral Side to Confident Walk transition at 10 FPS")


if __name__ == "__main__":
    main()
