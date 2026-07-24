"""Prepare generated HUGO GO! art for the browser."""

from pathlib import Path

from PIL import Image, ImageChops, ImageStat


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
    ("hugo-freefall-sheet-transparent.png", "hugo-freefall-cycle.webp", 3, 3, 2),
    ("hugo-jump-land-sheet-transparent.png", "hugo-jump-land-cycle.webp", 4, 4, 2),
    ("hugo-double-jump-sheet-transparent.png", "hugo-double-jump-cycle.webp", 3, 3, 2),
    ("hugo-wall-recovery-sheet-transparent.png", "hugo-wall-recovery-cycle.webp", 3, 3, 2),
)
CHARACTER_POSE_REPLACEMENTS = {
    "hugo-wall-recovery-sheet-transparent.png": (
        "hugo-wall-splat-side-profile-transparent.png",
        (1, 2),
        (360, 395),
    ),
}
JET_FLAME_SOURCE_SHEETS = (
    "jet-flame-frames-01-10-transparent.png",
    "jet-flame-frames-11-20-transparent.png",
    "jet-flame-frames-21-30-transparent.png",
)
JET_FLAME_SOURCE_COLUMNS = 5
JET_FLAME_SOURCE_ROWS = 2
JET_FLAME_FRAME_SIZE = (96, 160)
JET_FLAME_ATLAS_COLUMNS = 10
JET_FLAME_ATLAS_ROWS = 3


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


def resize_to_fit(pose: Image.Image, maximum_size: tuple[int, int]) -> Image.Image:
    maximum_width, maximum_height = maximum_size
    scale = min(maximum_width / pose.width, maximum_height / pose.height, 1)
    if scale == 1:
        return pose
    return pose.resize(
        (round(pose.width * scale), round(pose.height * scale)),
        Image.Resampling.LANCZOS,
    )


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
    replacement = CHARACTER_POSE_REPLACEMENTS.get(source_name)
    if replacement is not None:
        replacement_name, replacement_indices, maximum_size = replacement
        replacement_poses = extract_character_poses(
            Image.open(SOURCE_DIRECTORY / replacement_name).convert("RGBA"),
            1,
            replacement_name,
        )
        if len(replacement_poses) != len(replacement_indices):
            raise ValueError(
                f"Expected {len(replacement_indices)} replacement poses in "
                f"{replacement_name}, found {len(replacement_poses)}"
            )
        for pose_index, replacement_pose in zip(replacement_indices, replacement_poses):
            poses[pose_index] = resize_to_fit(replacement_pose, maximum_size)
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


def process_trail_ground() -> None:
    source = SOURCE_DIRECTORY / "trail-ground-transparent.png"
    output = OUTPUT_DIRECTORY / "trail-ground.webp"
    image = Image.open(source).convert("RGBA")
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError(f"{source.name} contains no visible pixels")
    left, top, right, bottom = bounds
    image = image.crop((left, max(0, top - PADDING), right, bottom))
    if image.width > 1024:
        height = round(image.height * 1024 / image.width)
        image = image.resize((1024, height), Image.Resampling.LANCZOS)
    image.save(output, "WEBP", quality=88, method=6, exact=True)
    print(f"Wrote {output.relative_to(ROOT)} ({image.width}x{image.height})")


def process_jet_flame_sheets() -> None:
    flames: list[Image.Image] = []
    for source_name in JET_FLAME_SOURCE_SHEETS:
        sheet = Image.open(SOURCE_DIRECTORY / source_name).convert("RGBA")
        for row in range(JET_FLAME_SOURCE_ROWS):
            for column in range(JET_FLAME_SOURCE_COLUMNS):
                left = round(column * sheet.width / JET_FLAME_SOURCE_COLUMNS)
                top = round(row * sheet.height / JET_FLAME_SOURCE_ROWS)
                right = round((column + 1) * sheet.width / JET_FLAME_SOURCE_COLUMNS)
                bottom = round((row + 1) * sheet.height / JET_FLAME_SOURCE_ROWS)
                cell = sheet.crop((left, top, right, bottom))
                bounds = cell.getchannel("A").getbbox()
                if bounds is None:
                    raise ValueError(
                        f"{source_name} row {row + 1}, column {column + 1} has no flame"
                    )
                flame = cell.crop(bounds)
                flame_center = (bounds[0] + bounds[2]) / 2
                if abs(flame_center - cell.width / 2) > cell.width * 0.08:
                    raise ValueError(
                        f"{source_name} row {row + 1}, column {column + 1} "
                        "does not share the top-center nozzle origin"
                    )
                flames.append(flame)

    expected_count = JET_FLAME_ATLAS_COLUMNS * JET_FLAME_ATLAS_ROWS
    if len(flames) != expected_count:
        raise ValueError(f"Expected {expected_count} jet flames, found {len(flames)}")

    widths = [flame.width for flame in flames]
    heights = [flame.height for flame in flames]
    if max(widths) / min(widths) > 1.25 or max(heights) / min(heights) > 1.15:
        raise ValueError("Generated jet flames vary too much in scale for a stable animation")

    frame_width, frame_height = JET_FLAME_FRAME_SIZE
    scale = min((frame_width - 16) / max(widths), (frame_height - 12) / max(heights))
    atlas = Image.new(
        "RGBA",
        (
            frame_width * JET_FLAME_ATLAS_COLUMNS,
            frame_height * JET_FLAME_ATLAS_ROWS,
        ),
        (0, 0, 0, 0),
    )
    normalized_frames: list[Image.Image] = []
    for index, flame in enumerate(flames):
        resized = flame.resize(
            (round(flame.width * scale), round(flame.height * scale)),
            Image.Resampling.LANCZOS,
        )
        frame = Image.new("RGBA", JET_FLAME_FRAME_SIZE, (0, 0, 0, 0))
        frame.alpha_composite(resized, ((frame_width - resized.width) // 2, 4))
        normalized_frames.append(frame)
        atlas.alpha_composite(
            frame,
            (
                (index % JET_FLAME_ATLAS_COLUMNS) * frame_width,
                (index // JET_FLAME_ATLAS_COLUMNS) * frame_height,
            ),
        )

    if len({frame.tobytes() for frame in normalized_frames}) != expected_count:
        raise ValueError("Every jet-flame animation frame must be visually distinct")

    adjacent_deltas = []
    for index, frame in enumerate(normalized_frames):
        following_frame = normalized_frames[(index + 1) % expected_count]
        difference = ImageChops.difference(frame, following_frame)
        adjacent_deltas.append(sum(ImageStat.Stat(difference).mean) / 4)
    if min(adjacent_deltas) < 2 or max(adjacent_deltas) > 14:
        raise ValueError(
            "Jet-flame frames must change visibly without an abrupt sheet or loop seam"
        )

    output = OUTPUT_DIRECTORY / "jet-flame-cycle.webp"
    atlas.save(output, "WEBP", quality=94, method=6, exact=True)
    print(
        f"Wrote {output.relative_to(ROOT)} "
        f"({expected_count} frames, {atlas.width}x{atlas.height})"
    )


if __name__ == "__main__":
    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
    for source_asset, output_asset in TRANSPARENT_ASSETS.items():
        process_transparent_asset(source_asset, output_asset)
    for sheet in CHARACTER_SHEETS:
        process_character_sheet(*sheet)
    process_trail_ground()
    process_jet_flame_sheets()
