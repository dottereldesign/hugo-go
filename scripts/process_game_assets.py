"""Trim and compress generated HUGO GO! gameplay sprites for the browser."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIRECTORY = ROOT / "art" / "source-images" / "game"
OUTPUT_DIRECTORY = ROOT / "src" / "assets" / "game"
ASSETS = {
    "hugo-flight-transparent.png": "hugo-flight.webp",
    "hugo-run-transparent.png": "hugo-run.webp",
}
MAX_HEIGHT = 768
PADDING = 8


def process(source_name: str, output_name: str) -> None:
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


if __name__ == "__main__":
    for source_asset, output_asset in ASSETS.items():
        process(source_asset, output_asset)
