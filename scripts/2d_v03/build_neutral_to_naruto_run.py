"""Build the Version 03 Neutral Side to Naruto Run transition."""
from __future__ import annotations

import hashlib
import json
import shutil
from math import hypot
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = (
    ROOT
    / "art/source-images/game/2d-v03/animations/neutral-to-naruto-run-v1"
)
OUTPUT = ROOT / "src/assets/game/2d-v03/animations/neutral-to-naruto-run"
FRAME_ROOT = OUTPUT / "frames"
REGISTERED_SEQUENCE = (
    SOURCE_ROOT / "hugo-neutral-to-naruto-six-drawings-registered.png"
)

CANVAS = 512
BASE_FPS = 10

START_POSE = (
    ROOT
    / "src/assets/game/2d-v03/animations/head-nod-soft-inbetweens/frames"
    / "hugo-head-nod-smooth-01-approved-00-percent.png"
)
END_POSE = (
    ROOT
    / "src/assets/game/2d-v03/sunrise-side/poses"
    / "hugo-sunrise-side-35-naruto-run.png"
)

GENERATED_SOURCES = (
    (
        "hugo-neutral-to-naruto-02-anticipation-transparent.png",
        "hugo-neutral-to-naruto-02-generated-anticipation.png",
        "Generated weight shift and heel lift",
        20,
        {
            "nearLeg": "loads forward foot and flexes at the knee",
            "farLeg": "lifts the rear heel and begins its independent drive",
        },
    ),
    (
        "hugo-neutral-to-naruto-03-first-stride-transparent.png",
        "hugo-neutral-to-naruto-03-generated-first-stride.png",
        "Generated first stride",
        40,
        {
            "nearLeg": "reaches forward with a flexed knee and separated shoe",
            "farLeg": "extends rearward through toe-off",
        },
    ),
    (
        "hugo-neutral-to-naruto-04-leg-passing-transparent.png",
        "hugo-neutral-to-naruto-04-generated-leg-passing.png",
        "Generated opposite-leg passing exchange",
        60,
        {
            "nearLeg": "folds and retracts beneath the hips",
            "farLeg": "passes forward with a raised knee and shoe",
        },
    ),
    (
        "hugo-neutral-to-naruto-05-opposite-drive-transparent.png",
        "hugo-neutral-to-naruto-05-generated-opposite-drive.png",
        "Generated opposite-leg drive",
        80,
        {
            "nearLeg": "extends into the rearward drive",
            "farLeg": "holds the forward knee drive toward the final pose",
        },
    ),
)

DRAWINGS = (
    (
        "hugo-neutral-to-naruto-01-approved-neutral-side.png",
        "Approved Neutral Side start",
        "approved original",
        0,
        {
            "nearLeg": "planted beneath the hip",
            "farLeg": "planted independently beneath the hip",
        },
    ),
    *(
        (filename, label, "generated in-between", progress, leg_mechanics)
        for _, filename, label, progress, leg_mechanics in GENERATED_SOURCES
    ),
    (
        "hugo-neutral-to-naruto-06-approved-naruto-run.png",
        "Approved Naruto run finish",
        "approved original",
        100,
        {
            "nearLeg": "extends fully rearward",
            "farLeg": "tucks forward beneath the torso",
        },
    ),
)

RUNTIME_SEQUENCE = (1, 2, 3, 4, 5, 6, 5, 4, 3, 2)

PROMPT = """Create a minimalist full-body transition from the exact approved
Neutral Side start into the exact approved Naruto-run finish in strict
screen-right side profile. Preserve the two supplied endpoint drawings
unchanged. Between them, redraw four complete chronological in-between figures:
(1) anticipation, with the near foot loading while the far heel lifts;
(2) first stride, with one knee reaching forward and the other leg extending
through toe-off; (3) a compact passing pose where the two legs visibly exchange
roles beneath the hips; and (4) the opposite-leg drive, with the formerly
trailing leg moving forward while the other extends behind. Both legs must
change position independently, both knee pads and both black shoes must remain
visible, and no pose may duplicate an adjacent drawing. Progress the torso from
upright into the approved forward lean while both arms sweep gradually behind
the hips. Preserve Hugo's exact identity, face, spiky brown hair, warm
peach/tan skin, proportions, orange-and-cream Outfit 03 Sunrise suit,
yellow/orange back panel, dark trim, knee pads, and black basketball shoes.
Match the canonical polished 2D game-character linework, lighting, shading,
colour, and scale. Draw exactly one complete Hugo on a perfectly flat solid
#FF00FF chroma background with generous padding. No crop, floor, shadow, glow,
text, labels, borders, extra people, duplicate anatomy, fragments, props, or
watermark."""


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > 8)
    if not len(xs):
        raise ValueError("Image has no visible pixels")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def validate_single_figure(image: Image.Image, label: str) -> None:
    left, top, right, bottom = alpha_bounds(image)
    if left < 48 or top < 48 or right > CANVAS - 48 or bottom > CANVAS - 48:
        raise ValueError(f"{label}: unsafe registered bounds {(left, top, right, bottom)}")

    alpha = np.asarray(image.getchannel("A"))
    count, _, stats, _ = cv2.connectedComponentsWithStats(
        (alpha > 8).astype(np.uint8),
        8,
    )
    areas = sorted(
        (int(stats[index, cv2.CC_STAT_AREA]) for index in range(1, count)),
        reverse=True,
    )
    if not areas or areas[0] < 8_000:
        raise ValueError(f"{label}: incomplete character {areas[:5]}")
    if len(areas) > 1 and areas[1] > 450:
        raise ValueError(f"{label}: detached artwork {areas[:5]}")


def register_generated() -> tuple[list[Image.Image], list[dict[str, object]]]:
    start_bounds = alpha_bounds(Image.open(START_POSE).convert("RGBA"))
    end_bounds = alpha_bounds(Image.open(END_POSE).convert("RGBA"))
    start_diagonal = hypot(
        start_bounds[2] - start_bounds[0],
        start_bounds[3] - start_bounds[1],
    )
    end_diagonal = hypot(
        end_bounds[2] - end_bounds[0],
        end_bounds[3] - end_bounds[1],
    )
    start_baseline = start_bounds[3]
    end_baseline = end_bounds[3]

    frames: list[Image.Image] = []
    metadata: list[dict[str, object]] = []
    for source_name, _, label, progress_percent, _ in GENERATED_SOURCES:
        source_path = SOURCE_ROOT / source_name
        source = Image.open(source_path).convert("RGBA")
        source_bounds = alpha_bounds(source)
        left, top, right, bottom = source_bounds
        if (
            left <= 8
            or top <= 8
            or right >= source.width - 8
            or bottom >= source.height - 8
        ):
            raise ValueError(f"{label}: generated source touches a boundary")

        crop = source.crop(source_bounds)
        source_diagonal = hypot(crop.width, crop.height)
        progress = progress_percent / 100
        target_diagonal = (
            start_diagonal + (end_diagonal - start_diagonal) * progress
        )
        scale = target_diagonal / source_diagonal
        target_width = round(crop.width * scale)
        target_height = round(crop.height * scale)
        resized = crop.resize((target_width, target_height), Image.Resampling.LANCZOS)

        target_baseline = round(
            start_baseline + (end_baseline - start_baseline) * progress
        )
        frame = Image.new("RGBA", (CANVAS, CANVAS))
        frame_left = round((CANVAS - target_width) / 2)
        frame_top = target_baseline - target_height
        frame.alpha_composite(resized, (frame_left, frame_top))
        validate_single_figure(frame, label)
        frames.append(frame)
        metadata.append(
            {
                "sourceFile": str(source_path.relative_to(ROOT)).replace("\\", "/"),
                "sourceBounds": list(source_bounds),
                "uniformScale": round(scale, 6),
                "targetDiagonal": round(target_diagonal, 3),
                "targetBaselineY": target_baseline,
                "alphaBounds": list(alpha_bounds(frame)),
            }
        )
    return frames, metadata


def save_registered_sequence(drawings: list[Image.Image]) -> None:
    sheet = Image.new("RGBA", (CANVAS * len(drawings), CANVAS))
    for index, drawing in enumerate(drawings):
        sheet.alpha_composite(drawing, (index * CANVAS, 0))
    sheet.save(REGISTERED_SEQUENCE, optimize=True)


def write_manifest(paths: list[Path], metadata: list[dict[str, object]]) -> None:
    runtime_frames = []
    for runtime_index, source_index in enumerate(RUNTIME_SEQUENCE, 1):
        filename, label, _, _, _ = DRAWINGS[source_index - 1]
        direction = "launch" if runtime_index <= 6 else "recover"
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
    for index, (path, drawing) in enumerate(zip(paths, DRAWINGS, strict=True), 1):
        _, _, kind, progress_percent, leg_mechanics = drawing
        unique_drawings.append(
            {
                "sourceFrame": index,
                "filename": path.name,
                "kind": kind,
                "progressPercent": progress_percent,
                "legMechanics": leg_mechanics,
                "sha256": sha256(path),
                "alphaBounds": list(
                    alpha_bounds(Image.open(path).convert("RGBA"))
                ),
                **(metadata[index - 2] if 2 <= index <= 5 else {}),
            }
        )

    manifest = {
        "schemaVersion": 1,
        "animation": {
            "id": "neutral-to-naruto-run",
            "assetDirectory": "neutral-to-naruto-run",
            "name": "Neutral Side · Launch into Naruto run",
            "description": (
                "The exact Neutral Side start uses a clear two-leg exchange "
                "to reach the approved arms-back Naruto run."
            ),
            "stageLabel": "OUTFIT 03 · RUN START",
            "prompt": PROMPT,
        },
        "timing": {
            "baseFps": BASE_FPS,
            "runtimeFrameCount": len(RUNTIME_SEQUENCE),
            "drawingCount": len(DRAWINGS),
            "loopDurationSeconds": round(len(RUNTIME_SEQUENCE) / BASE_FPS, 3),
            "loopReturnFrame": len(RUNTIME_SEQUENCE),
        },
        "productionMethod": (
            "two exact approved endpoint figures plus four complete generated "
            "in-between drawings; chroma cleanup and deterministic whole-body "
            "registration only; no body-part compositing, code interpolation, "
            "or runtime sheet slicing"
        ),
        "source": {
            "generatedDrawings": [
                str((SOURCE_ROOT / source_name).relative_to(ROOT)).replace("\\", "/")
                for source_name, *_ in GENERATED_SOURCES
            ],
            "registeredSequence": str(REGISTERED_SEQUENCE.relative_to(ROOT)).replace(
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
    generated, metadata = register_generated()
    start = Image.open(START_POSE).convert("RGBA")
    end = Image.open(END_POSE).convert("RGBA")
    drawings = [start, *generated, end]

    for drawing, (_, label, _, _, _) in zip(drawings, DRAWINGS, strict=True):
        validate_single_figure(drawing, label)

    FRAME_ROOT.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for index, (drawing, (filename, _, kind, _, _)) in enumerate(
        zip(drawings, DRAWINGS, strict=True)
    ):
        path = FRAME_ROOT / filename
        if kind == "approved original":
            shutil.copyfile(START_POSE if index == 0 else END_POSE, path)
        else:
            drawing.save(path, optimize=True)
        paths.append(path)

    save_registered_sequence(drawings)
    write_manifest(paths, metadata)
    print("Built 6-drawing Neutral Side to Naruto Run transition at 10 FPS")


if __name__ == "__main__":
    main()
