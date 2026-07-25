"""Build the 48-view V3 head turn as individually registered PNG files."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

from process_head_turn_atlas import (
    CELL_SIZE,
    FRAME_COUNT,
    connected_components,
    isolate_component,
    ordered_heads,
    register_head,
)


BRIDGE_FRAME_COUNT = 8
EYE_REVEAL_FRAME_COUNT = 6
OUTPUT_FRAME_COUNT = 45 + BRIDGE_FRAME_COUNT + EYE_REVEAL_FRAME_COUNT


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int]:
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("Registered frame is empty.")
    return bounds


def validate_frames(frames: list[Image.Image]) -> None:
    if len(frames) != OUTPUT_FRAME_COUNT:
        raise ValueError(
            f"Expected {OUTPUT_FRAME_COUNT} interleaved frames, found {len(frames)}."
        )

    bounds = [alpha_bounds(frame) for frame in frames]
    heights = [bottom - top for _, top, _, bottom in bounds]
    center_x = [(left + right) / 2 for left, _, right, _ in bounds]
    center_y = [(top + bottom) / 2 for _, top, _, bottom in bounds]
    gutters = [
        min(left, top, CELL_SIZE - right, CELL_SIZE - bottom)
        for left, top, right, bottom in bounds
    ]

    if max(heights) - min(heights) > 1:
        raise ValueError("V3 frame heights are not registered.")
    if max(center_x) - min(center_x) > 1 or max(center_y) - min(center_y) > 1:
        raise ValueError("V3 frame centres are not registered.")
    if min(gutters) < 16:
        raise ValueError(f"V3 frame gutter is unsafe ({min(gutters)} px).")


def ordered_generated_heads(
    image: Image.Image,
    frame_count: int,
    rows: int,
) -> list:
    heads = [
        component
        for component in connected_components(image)
        if len(component.pixels) >= 1_000
    ]
    if len(heads) != frame_count:
        raise ValueError(
            f"Expected {frame_count} bridge heads, "
            f"found {len(heads)}."
        )
    row_height = image.height / rows
    heads.sort(
        key=lambda component: (
            int(component.center_y / row_height),
            component.center_x,
        )
    )
    return heads


def build_frames(
    approved_atlas_path: Path,
    inbetweens_path: Path,
    bridge_path: Path,
    eye_reveal_path: Path,
    output_directory: Path,
) -> None:
    approved_atlas = Image.open(approved_atlas_path).convert("RGBA")
    approved_frames = [
        approved_atlas.crop(
            (
                frame % 5 * CELL_SIZE,
                frame // 5 * CELL_SIZE,
                frame % 5 * CELL_SIZE + CELL_SIZE,
                frame // 5 * CELL_SIZE + CELL_SIZE,
            )
        )
        for frame in range(FRAME_COUNT)
    ]

    inbetweens = Image.open(inbetweens_path).convert("RGBA")
    generated_heads = ordered_heads(
        connected_components(inbetweens),
        inbetweens.height,
    )
    generated_frames = [
        register_head(isolate_component(inbetweens, head))
        for head in generated_heads
    ]
    bridge = Image.open(bridge_path).convert("RGBA")
    bridge_frames = [
        register_head(isolate_component(bridge, head))
        for head in ordered_generated_heads(bridge, BRIDGE_FRAME_COUNT, 2)
    ]
    eye_reveal = Image.open(eye_reveal_path).convert("RGBA")
    eye_reveal_frames = [
        register_head(isolate_component(eye_reveal, head))
        for head in ordered_generated_heads(
            eye_reveal,
            EYE_REVEAL_FRAME_COUNT,
            2,
        )
    ]

    interleaved_frames: list[Image.Image] = []
    for approved, generated in zip(approved_frames, generated_frames, strict=True):
        interleaved_frames.extend((approved, generated))
    # The generated contact sheet skipped the rear-right quarter in its final
    # three cells. Keep the verified sequence through frame 45, then replace
    # that faulty tail with a dedicated eight-view bridge into frame 1.
    frames = (
        interleaved_frames[:45]
        + bridge_frames[:4]
        + eye_reveal_frames
        + bridge_frames[4:]
    )
    validate_frames(frames)

    output_directory.mkdir(parents=True, exist_ok=True)
    expected_names = {
        f"frame-{index + 1:02d}.png" for index in range(OUTPUT_FRAME_COUNT)
    }
    for existing in output_directory.glob("frame-*.png"):
        if existing.name not in expected_names:
            existing.unlink()
    for index, frame in enumerate(frames):
        frame.save(output_directory / f"frame-{index + 1:02d}.png", optimize=True)

    print(
        f"Wrote {OUTPUT_FRAME_COUNT} individual registered frames to "
        f"{output_directory} (verified frames 1–45 + "
        f"{BRIDGE_FRAME_COUNT}-view rear-right bridge + "
        f"{EYE_REVEAL_FRAME_COUNT}-view eye-reveal bridge)."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--approved-atlas",
        type=Path,
        default=Path("src/assets/game/hugo-head-turn-stabilized-cycle.png"),
    )
    parser.add_argument(
        "--inbetweens",
        type=Path,
        default=Path(
            "art/source-images/game/"
            "hugo-head-turn-v3-inbetweens-transparent.png"
        ),
    )
    parser.add_argument(
        "--bridge",
        type=Path,
        default=Path(
            "art/source-images/game/"
            "hugo-head-turn-v3-rear-right-bridge-transparent.png"
        ),
    )
    parser.add_argument(
        "--eye-reveal",
        type=Path,
        default=Path(
            "art/source-images/game/"
            "hugo-head-turn-v3-eye-reveal-bridge-transparent.png"
        ),
    )
    parser.add_argument(
        "--output-directory",
        type=Path,
        default=Path("src/assets/game/hugo-head-turn-v3"),
    )
    args = parser.parse_args()
    build_frames(
        args.approved_atlas,
        args.inbetweens,
        args.bridge,
        args.eye_reveal,
        args.output_directory,
    )


if __name__ == "__main__":
    main()
