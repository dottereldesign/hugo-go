"""Build the registered 24-view audit atlas from the transparent source sheet."""

from __future__ import annotations

import argparse
from collections import deque
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


FRAME_COUNT = 24
SOURCE_COLUMNS = 6
OUTPUT_COLUMNS = 5
CELL_SIZE = 320
REGISTERED_HEIGHT = 240


@dataclass
class Component:
    pixels: list[int]
    left: int
    top: int
    right: int
    bottom: int

    @property
    def center_x(self) -> float:
        return (self.left + self.right) / 2

    @property
    def center_y(self) -> float:
        return (self.top + self.bottom) / 2


def connected_components(image: Image.Image) -> list[Component]:
    width, height = image.size
    alpha = image.getchannel("A")
    occupied = bytearray(1 if value > 0 else 0 for value in alpha.getdata())
    visited = bytearray(width * height)
    components: list[Component] = []

    for start, present in enumerate(occupied):
        if not present or visited[start]:
            continue

        queue: deque[int] = deque([start])
        visited[start] = 1
        pixels: list[int] = []
        left = right = start % width
        top = bottom = start // width

        while queue:
            index = queue.pop()
            pixels.append(index)
            x = index % width
            y = index // width
            left = min(left, x)
            right = max(right, x)
            top = min(top, y)
            bottom = max(bottom, y)

            for next_x, next_y in (
                (x - 1, y),
                (x + 1, y),
                (x, y - 1),
                (x, y + 1),
            ):
                if not (0 <= next_x < width and 0 <= next_y < height):
                    continue
                next_index = next_y * width + next_x
                if occupied[next_index] and not visited[next_index]:
                    visited[next_index] = 1
                    queue.append(next_index)

        components.append(Component(pixels, left, top, right, bottom))

    return components


def ordered_heads(components: list[Component], source_height: int) -> list[Component]:
    heads = [component for component in components if len(component.pixels) >= 1_000]
    if len(heads) != FRAME_COUNT:
        raise ValueError(f"Expected {FRAME_COUNT} complete heads, found {len(heads)}.")

    row_height = source_height / 4
    heads.sort(key=lambda component: (int(component.center_y / row_height), component.center_x))
    for row in range(4):
        row_heads = [
            component
            for component in heads
            if int(component.center_y / row_height) == row
        ]
        if len(row_heads) != SOURCE_COLUMNS:
            raise ValueError(
                f"Expected {SOURCE_COLUMNS} heads in source row {row + 1}, found {len(row_heads)}."
            )
    return heads


def isolate_component(image: Image.Image, component: Component) -> Image.Image:
    width = component.right - component.left + 1
    height = component.bottom - component.top + 1
    crop = image.crop(
        (component.left, component.top, component.right + 1, component.bottom + 1)
    )
    source_alpha = image.getchannel("A")
    isolated_alpha = bytearray(width * height)
    image_width = image.width

    for index in component.pixels:
        source_x = index % image_width
        source_y = index // image_width
        target_x = source_x - component.left
        target_y = source_y - component.top
        isolated_alpha[target_y * width + target_x] = source_alpha.getpixel(
            (source_x, source_y)
        )

    crop.putalpha(Image.frombytes("L", (width, height), bytes(isolated_alpha)))
    return crop


def register_head(head: Image.Image) -> Image.Image:
    scale = REGISTERED_HEIGHT / head.height
    width = round(head.width * scale)
    resized = head.resize((width, REGISTERED_HEIGHT), Image.Resampling.LANCZOS)
    if width >= CELL_SIZE - 32:
        raise ValueError(f"Registered head width {width}px leaves an unsafe cell gutter.")

    cell = Image.new("RGBA", (CELL_SIZE, CELL_SIZE))
    cell.alpha_composite(
        resized,
        ((CELL_SIZE - width) // 2, (CELL_SIZE - REGISTERED_HEIGHT) // 2),
    )
    return cell


def validate_atlas(atlas: Image.Image) -> None:
    bounds: list[tuple[int, int, int, int]] = []
    for frame in range(FRAME_COUNT):
        x = frame % OUTPUT_COLUMNS * CELL_SIZE
        y = frame // OUTPUT_COLUMNS * CELL_SIZE
        cell = atlas.crop((x, y, x + CELL_SIZE, y + CELL_SIZE))
        alpha_box = cell.getchannel("A").getbbox()
        if alpha_box is None:
            raise ValueError(f"Frame {frame + 1} is empty.")
        bounds.append(alpha_box)
        if min(alpha_box[0], alpha_box[1], CELL_SIZE - alpha_box[2], CELL_SIZE - alpha_box[3]) < 16:
            raise ValueError(f"Frame {frame + 1} does not have a safe transparent gutter.")

    heights = [bottom - top for _, top, _, bottom in bounds]
    center_x = [(left + right) / 2 for left, _, right, _ in bounds]
    center_y = [(top + bottom) / 2 for _, top, _, bottom in bounds]
    if max(heights) - min(heights) > 1:
        raise ValueError("Registered frame heights are inconsistent.")
    if max(center_x) - min(center_x) > 1 or max(center_y) - min(center_y) > 1:
        raise ValueError("Registered frame centres are inconsistent.")

    opening = atlas.crop((0, 0, CELL_SIZE, CELL_SIZE)).tobytes()
    bookend = atlas.crop(
        (
            4 * CELL_SIZE,
            4 * CELL_SIZE,
            5 * CELL_SIZE,
            5 * CELL_SIZE,
        )
    ).tobytes()
    if opening != bookend:
        raise ValueError("The seam-validation cell is not pixel-identical to frame 1.")


def build_atlas(input_path: Path, output_path: Path) -> None:
    source = Image.open(input_path).convert("RGBA")
    heads = ordered_heads(connected_components(source), source.height)
    cells = [register_head(isolate_component(source, head)) for head in heads]

    atlas = Image.new(
        "RGBA",
        (OUTPUT_COLUMNS * CELL_SIZE, OUTPUT_COLUMNS * CELL_SIZE),
    )
    for frame, cell in enumerate(cells):
        x = frame % OUTPUT_COLUMNS * CELL_SIZE
        y = frame // OUTPUT_COLUMNS * CELL_SIZE
        atlas.alpha_composite(cell, (x, y))
    atlas.alpha_composite(cells[0], (4 * CELL_SIZE, 4 * CELL_SIZE))

    validate_atlas(atlas)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output_path, optimize=True)
    print(
        f"Wrote {output_path} with {FRAME_COUNT} registered views "
        f"plus one exact seam bookend ({atlas.width}x{atlas.height})."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(
            "art/source-images/game/head-turn/v2/"
            "hugo-head-turn-source-transparent.png"
        ),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(
            "src/assets/game/head-turn/v2/"
            "hugo-head-turn-stabilized-24.png"
        ),
    )
    args = parser.parse_args()
    build_atlas(args.input, args.output)


if __name__ == "__main__":
    main()
