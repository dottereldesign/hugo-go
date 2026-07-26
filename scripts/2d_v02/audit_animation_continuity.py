"""Audit every adjacent pair in a registered V02 frame animation.

The diagnostic contact sheet renders frame A in red, frame B in cyan, and their
overlap in white. Large red/cyan regions reveal a pose jump; tight coloured
edge fringes reveal normal small motion. Metrics are evidence for review, not
an automatic instruction to add an in-between: impacts and fast actions often
need deliberate large gaps.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = (
    ROOT
    / "src"
    / "assets"
    / "game"
    / "2d-v02"
    / "animations"
    / "neutral-idle"
    / "manifest.json"
)
DEFAULT_OUTPUT = (
    ROOT
    / "src"
    / "assets"
    / "game"
    / "2d-v02"
    / "animations"
    / "qa"
    / "hugo-neutral-idle-adjacent-deltas.png"
)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    base = Path("C:/Windows/Fonts")
    for candidate in (
        base / ("arialbd.ttf" if bold else "arial.ttf"),
        base / ("segoeuib.ttf" if bold else "segoeui.ttf"),
    ):
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def centroid(mask: np.ndarray) -> tuple[float, float]:
    moments = cv2.moments(mask.astype(np.uint8))
    if moments["m00"] == 0:
        return 0.0, 0.0
    return moments["m10"] / moments["m00"], moments["m01"] / moments["m00"]


def bounds(mask: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return 0, 0, 0, 0
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def pair_metrics(a: np.ndarray, b: np.ndarray) -> dict[str, float]:
    intersection = np.logical_and(a, b).sum()
    union = np.logical_or(a, b).sum()
    changed = np.logical_xor(a, b).sum()
    ax, ay = centroid(a)
    bx, by = centroid(b)
    a_bounds = bounds(a)
    b_bounds = bounds(b)
    return {
        "silhouetteIou": round(float(intersection / max(union, 1)), 4),
        "changedUnionRatio": round(float(changed / max(union, 1)), 4),
        "centroidDistancePx": round(math.hypot(ax - bx, ay - by), 2),
        "maximumBoundsDeltaPx": max(
            abs(a_edge - b_edge) for a_edge, b_edge in zip(a_bounds, b_bounds, strict=True)
        ),
    }


def delta_preview(a: np.ndarray, b: np.ndarray, size: int = 226) -> Image.Image:
    overlap = np.logical_and(a, b)
    a_only = np.logical_and(a, np.logical_not(b))
    b_only = np.logical_and(b, np.logical_not(a))
    rgba = np.zeros((*a.shape, 4), dtype=np.uint8)
    rgba[overlap] = (238, 244, 255, 230)
    rgba[a_only] = (255, 57, 79, 240)
    rgba[b_only] = (42, 226, 255, 240)
    preview = Image.fromarray(rgba)
    return preview.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    manifest_path = args.manifest.resolve()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    runtime_frames = [frame for frame in manifest["frames"] if frame["runtime"]]
    images = [Image.open(ROOT / frame["file"]).convert("RGBA") for frame in runtime_frames]
    masks = [np.asarray(image.getchannel("A")) > 16 for image in images]

    pairs: list[dict[str, object]] = []
    for index in range(len(runtime_frames) - 1):
        first = runtime_frames[index]
        second = runtime_frames[index + 1]
        metrics = pair_metrics(masks[index], masks[index + 1])
        pairs.append(
            {
                "from": first["index"],
                "to": second["index"],
                "fromSlug": first["slug"],
                "toSlug": second["slug"],
                **metrics,
            }
        )

    columns = 4
    rows = math.ceil(len(pairs) / columns)
    tile_width = 330
    tile_height = 310
    margin = 26
    header_height = 126
    width = margin * 2 + columns * tile_width
    height = header_height + rows * tile_height + margin
    sheet = Image.new("RGB", (width, height), "#07152c")
    draw = ImageDraw.Draw(sheet)
    title_font = font(30, bold=True)
    subtitle_font = font(16)
    label_font = font(17, bold=True)
    metric_font = font(14)
    draw.text((margin, 22), "NEUTRAL IDLE · ADJACENT-PAIR DELTA AUDIT", fill="#f8fbff", font=title_font)
    draw.text(
        (margin, 68),
        "RED = outgoing only · CYAN = incoming only · WHITE = overlap · metrics guide human timing review",
        fill="#8eeaff",
        font=subtitle_font,
    )
    draw.text(
        (margin, 94),
        "A large delta may need an in-between—or may be the correct snap for an impact.",
        fill="#9fb0c4",
        font=subtitle_font,
    )

    for index, pair in enumerate(pairs):
        row = index // columns
        column = index % columns
        x = margin + column * tile_width
        y = header_height + row * tile_height
        draw.rounded_rectangle(
            (x + 5, y + 5, x + tile_width - 9, y + tile_height - 9),
            radius=17,
            fill="#112c4e",
            outline="#2d7194",
            width=2,
        )
        preview = delta_preview(masks[index], masks[index + 1])
        sheet.paste(preview, (x + 50, y + 13), preview)
        draw.text(
            (x + 18, y + 242),
            f"{pair['from']:02d} → {pair['to']:02d}",
            fill="#ffd466",
            font=label_font,
        )
        draw.text(
            (x + 105, y + 242),
            f"{pair['fromSlug']} → {pair['toSlug']}",
            fill="#f8fbff",
            font=metric_font,
        )
        draw.text(
            (x + 18, y + 270),
            (
                f"IoU {pair['silhouetteIou']:.3f} · changed {pair['changedUnionRatio']:.3f} · "
                f"centre {pair['centroidDistancePx']:.1f}px · bounds {pair['maximumBoundsDeltaPx']}px"
            ),
            fill="#a7b9cc",
            font=metric_font,
        )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.out, optimize=True)
    report_path = args.out.with_suffix(".json")
    report_path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "animation": manifest["animation"]["id"],
                "method": "registered-alpha-adjacent-pair-red-cyan-overlap",
                "interpretation": {
                    "red": "pixels present only in the outgoing frame",
                    "cyan": "pixels present only in the incoming frame",
                    "white": "overlapping silhouette",
                    "warning": (
                        "Metrics identify large visual changes but do not decide timing. "
                        "Impacts, snaps, and intentional fast action may require large gaps."
                    ),
                },
                "pairs": pairs,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(pairs)} adjacent-pair comparisons to {args.out}")
    print(f"Wrote machine-readable metrics to {report_path}")


if __name__ == "__main__":
    main()
