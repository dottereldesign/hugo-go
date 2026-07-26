"""Render opacity overlays and root metrics for every neutral-idle drawing."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from neutral_registration import correction, detect_torso_root


ROOT = Path(__file__).resolve().parents[2]
ANIMATION_ROOT = (
    ROOT / "src" / "assets" / "game" / "2d-v02" / "animations" / "neutral-idle"
)
QA_ROOT = ANIMATION_ROOT.parent / "qa"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    path = Path("C:/Windows/Fonts") / ("arialbd.ttf" if bold else "arial.ttf")
    return ImageFont.truetype(str(path), size) if path.exists() else ImageFont.load_default()


def tint_alpha(
    image: Image.Image,
    colour: tuple[int, int, int],
    opacity: float,
) -> Image.Image:
    alpha = image.convert("RGBA").getchannel("A").point(lambda value: round(value * opacity))
    layer = Image.new("RGBA", image.size, (*colour, 0))
    layer.putalpha(alpha)
    return layer


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--label", required=True, choices=("before", "after", "24fps-before", "24fps-after"))
    args = parser.parse_args()

    manifest = json.loads((ANIMATION_ROOT / "manifest.json").read_text(encoding="utf-8"))
    frames = [frame for frame in manifest["frames"] if frame["runtime"]]
    images = [Image.open(ROOT / frame["file"]).convert("RGBA") for frame in frames]
    target = detect_torso_root(images[0])
    reference = tint_alpha(images[0], (30, 220, 255), 0.34)

    metrics: list[dict[str, object]] = []
    for frame, image in zip(frames, images, strict=True):
        root = detect_torso_root(image)
        delta_x, delta_y, scale = correction(root, target)
        metrics.append(
            {
                "frame": frame["index"],
                "slug": frame["slug"],
                "rootX": round(root.x, 3),
                "rootY": round(root.y, 3),
                "torsoHeight": round(root.height, 3),
                "requiredTranslationX": round(delta_x, 3),
                "requiredTranslationY": round(delta_y, 3),
                "requiredUniformScale": round(scale, 6),
            }
        )

    columns = 5
    rows = math.ceil(len(frames) / columns)
    tile_width = 278
    tile_height = 300
    margin = 24
    header_height = 128
    sheet = Image.new(
        "RGB",
        (
            margin * 2 + columns * tile_width,
            header_height + margin + rows * tile_height,
        ),
        "#07152c",
    )
    draw = ImageDraw.Draw(sheet)
    draw.text(
        (margin, 20),
        f"NEUTRAL IDLE · TORSO-ROOT OPACITY OVERLAY · {args.label.upper()}",
        fill="#f8fbff",
        font=font(28, True),
    )
    draw.text(
        (margin, 62),
        "CYAN ghost = frame 01 · ORANGE = current frame · crosses = detected chest root",
        fill="#8eeaff",
        font=font(16),
    )
    draw.text(
        (margin, 89),
        "Moving limbs and gum may differ; the cream chest panels should remain registered.",
        fill="#a9b9cc",
        font=font(15),
    )

    for index, (frame, image, item) in enumerate(zip(frames, images, metrics, strict=True)):
        row = index // columns
        column = index % columns
        x = margin + column * tile_width
        y = header_height + row * tile_height
        draw.rounded_rectangle(
            (x + 4, y + 4, x + tile_width - 9, y + tile_height - 9),
            radius=16,
            fill="#102b49",
            outline="#2e7396",
            width=2,
        )
        overlay = Image.new("RGBA", (640, 640), (0, 0, 0, 0))
        overlay.alpha_composite(reference)
        overlay.alpha_composite(tint_alpha(image, (255, 151, 45), 0.56))
        overlay_draw = ImageDraw.Draw(overlay)
        current = detect_torso_root(image)
        for root, colour in ((target, "#28e5ff"), (current, "#ff9b2f")):
            overlay_draw.line((root.x - 14, root.y, root.x + 14, root.y), fill=colour, width=4)
            overlay_draw.line((root.x, root.y - 14, root.x, root.y + 14), fill=colour, width=4)
        preview = overlay.resize((230, 230), Image.Resampling.LANCZOS)
        sheet.paste(preview, (x + 24, y + 7), preview)
        draw.text(
            (x + 16, y + 239),
            f"{int(frame['index']):02d} · {frame['slug']}",
            fill="#f8fbff",
            font=font(14, True),
        )
        draw.text(
            (x + 16, y + 264),
            (
                f"fix x {float(item['requiredTranslationX']):+.1f}px · "
                f"y {float(item['requiredTranslationY']):+.1f}px · "
                f"s {float(item['requiredUniformScale']):.3f}"
            ),
            fill="#ffd364",
            font=font(13),
        )

    QA_ROOT.mkdir(parents=True, exist_ok=True)
    image_path = QA_ROOT / f"hugo-neutral-idle-root-registration-{args.label}.png"
    report_path = image_path.with_suffix(".json")
    sheet.save(image_path, optimize=True)
    report_path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "animation": "neutral-idle",
                "label": args.label,
                "method": "cream-chest-panel-root-opacity-overlay",
                "target": {
                    "frame": 1,
                    "rootX": round(target.x, 3),
                    "rootY": round(target.y, 3),
                    "torsoHeight": round(target.height, 3),
                },
                "maximumAbsoluteRequiredTranslationX": round(
                    max(abs(float(item["requiredTranslationX"])) for item in metrics),
                    3,
                ),
                "maximumAbsoluteRequiredTranslationY": round(
                    max(abs(float(item["requiredTranslationY"])) for item in metrics),
                    3,
                ),
                "maximumAbsoluteScaleDelta": round(
                    max(abs(float(item["requiredUniformScale"]) - 1) for item in metrics),
                    6,
                ),
                "frames": metrics,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {image_path}")
    print(f"Wrote {report_path}")


if __name__ == "__main__":
    main()
