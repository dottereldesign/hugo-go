"""Prepare generated HUGO GO! art for the browser."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIRECTORY = ROOT / "art" / "source-images" / "game"
OUTPUT_DIRECTORY = ROOT / "src" / "assets" / "game"
TRANSPARENT_ASSETS: dict[str, str] = {}
MAX_HEIGHT = 768
PADDING = 8
FRAME_SIZE = (384, 320)
CHARACTER_SHEETS = (
    ("hugo-run-sheet-transparent.png", "hugo-run-cycle.webp", 4, 4, 2),
    ("hugo-powered-sheet-transparent.png", "hugo-powered-cycle.webp", 3, 3, 2),
    ("hugo-glide-sheet-transparent.png", "hugo-glide-cycle.webp", 3, 3, 2),
    ("hugo-transition-sheet-transparent.png", "hugo-transition-cycle.webp", 3, 3, 2),
)


def process_transparent_asset(source_name: str, output_name: str) -> None:
    source = SOURCE_DIRECTORY / source_name
    output = OUTPUT_DIRECTORY / output_name
    image = Image.open(source).convert("RGBA")
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError(f"{source_name} contains no visible pixels")
    left, top, right, bottom = bounds
    bounds_with_padding = (
        max(0, left - PADDING),
        max(0, top - PADDING),
        min(image.width, right + PADDING),
        min(image.height, bottom + PADDING),
    )
    image = image.crop(bounds_with_padding)
    if image.height > MAX_HEIGHT:
        width = round(image.width * MAX_HEIGHT / image.height)
        image = image.resize((width, MAX_HEIGHT), Image.Resampling.LANCZOS)

    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "WEBP", quality=92, method=6, exact=True)
    print(f"Wrote {output.relative_to(ROOT)} ({image.width}x{image.height})")


def find_occupied_spans(image: Image.Image, axis: str) -> list[tuple[int, int]]:
    alpha = image.getchannel("A")
    if axis == "rows":
        samples = list(alpha.resize((1, alpha.height), Image.Resampling.BOX).getdata())
    elif axis == "columns":
        samples = list(alpha.resize((alpha.width, 1), Image.Resampling.BOX).getdata())
    else:
        raise ValueError(f"Unsupported axis: {axis}")

    spans: list[tuple[int, int]] = []
    start: int | None = None
    for index, value in enumerate(samples):
        occupied = value > 3
        if occupied and start is None:
            start = index
        elif not occupied and start is not None:
            if index - start > 20:
                spans.append((start, index))
            start = None
    if start is not None:
        spans.append((start, len(samples)))
    return spans


def extract_character_poses(
    sheet: Image.Image,
    expected_source_rows: int,
    source_name: str,
) -> list[Image.Image]:
    row_spans = find_occupied_spans(sheet, "rows")
    if len(row_spans) != expected_source_rows:
        raise ValueError(
            f"Expected {expected_source_rows} occupied rows in {source_name}, found {row_spans}"
        )

    poses: list[Image.Image] = []
    for row_start, row_end in row_spans:
        row = sheet.crop((0, max(0, row_start - PADDING), sheet.width, min(sheet.height, row_end + PADDING)))
        column_spans = find_occupied_spans(row, "columns")
        if len(column_spans) != 2:
            raise ValueError(f"Expected 2 poses in {source_name} row, found {column_spans}")
        for column_start, column_end in column_spans:
            cell = row.crop((
                max(0, column_start - PADDING),
                0,
                min(row.width, column_end + PADDING),
                row.height,
            ))
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                raise ValueError(f"{source_name} pose contains no visible pixels")
            poses.append(cell.crop(bounds))

    return poses


def process_character_sheet(
    source_name: str,
    output_name: str,
    expected_source_rows: int,
    atlas_columns: int,
    atlas_rows: int,
) -> None:
    source = SOURCE_DIRECTORY / source_name
    poses = extract_character_poses(
        Image.open(source).convert("RGBA"),
        expected_source_rows,
        source_name,
    )
    expected_frame_count = atlas_columns * atlas_rows
    if len(poses) != expected_frame_count:
        raise ValueError(
            f"Expected {expected_frame_count} poses in {source_name}, found {len(poses)}"
        )

    frame_width, frame_height = FRAME_SIZE
    maximum_pose_width = max(pose.width for pose in poses)
    maximum_pose_height = max(pose.height for pose in poses)
    scale = min((frame_width - 24) / maximum_pose_width, (frame_height - 18) / maximum_pose_height)

    atlas = Image.new(
        "RGBA",
        (frame_width * atlas_columns, frame_height * atlas_rows),
        (0, 0, 0, 0),
    )
    for index, pose in enumerate(poses):
        resized = pose.resize(
            (round(pose.width * scale), round(pose.height * scale)),
            Image.Resampling.LANCZOS,
        )
        frame = Image.new("RGBA", FRAME_SIZE, (0, 0, 0, 0))
        x = (frame_width - resized.width) // 2
        y = frame_height - resized.height - 8
        frame.alpha_composite(resized, (x, y))
        atlas_x = (index % atlas_columns) * frame_width
        atlas_y = (index // atlas_columns) * frame_height
        atlas.alpha_composite(frame, (atlas_x, atlas_y))

    output = OUTPUT_DIRECTORY / output_name
    atlas.save(output, "WEBP", quality=91, method=6, exact=True)
    print(
        f"Wrote {output.relative_to(ROOT)} "
        f"({expected_frame_count} frames, {atlas.width}x{atlas.height})"
    )


def process_forest_background() -> None:
    source = SOURCE_DIRECTORY / "forest-season-source.png"
    output = OUTPUT_DIRECTORY / "forest-season-base.webp"
    image = Image.open(source).convert("RGB")
    if image.width > 1024:
        height = round(image.height * 1024 / image.width)
        image = image.resize((1024, height), Image.Resampling.LANCZOS)
    image.save(output, "WEBP", quality=84, method=6)
    print(f"Wrote {output.relative_to(ROOT)} ({image.width}x{image.height})")


if __name__ == "__main__":
    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
    for source_asset, output_asset in TRANSPARENT_ASSETS.items():
        process_transparent_asset(source_asset, output_asset)
    for sheet in CHARACTER_SHEETS:
        process_character_sheet(*sheet)
    process_forest_background()
