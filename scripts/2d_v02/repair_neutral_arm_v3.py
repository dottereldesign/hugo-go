"""Replace six faulty arm frames and enforce dark-blue gum."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from refine_neutral_idle import alpha_bounds, register
from neutral_registration import detect_torso_root, stabilize

ROOT = Path(__file__).resolve().parents[2]
ANIMATION = ROOT / "src/assets/game/2d-v02/animations/neutral-idle"
SOURCES = ROOT / "art/source-images/game/2d-v02/animations/neutral-idle/arm-smooth-v3"
REPLACEMENTS = {
    40: ("a", 0, 1),
    41: ("a", 1, 1),
    44: ("b", 0, 1),
    45: ("b", 1, 1),
    48: ("c", 0, 1),
    49: ("c", 1, 1),
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def dark_blue_gum(image: Image.Image, gum_active: bool) -> Image.Image:
    rgba = np.array(image.convert("RGBA"))
    if not gum_active:
        return Image.fromarray(rgba)
    rgb = rgba[:, :, :3]
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    red, green, blue = [rgb[:, :, channel].astype(np.int16) for channel in range(3)]
    pink_or_purple = (
        (rgba[:, :, 3] > 24)
        & (red > 115)
        & (blue > 75)
        & (blue > green * 1.12)
        & (red > green * 1.18)
    )
    generated_blue = (
        (rgba[:, :, 3] > 24)
        & (hsv[:, :, 0] >= 105)
        & (hsv[:, :, 0] <= 124)
        & (hsv[:, :, 1] > 145)
    )
    candidates = (pink_or_purple | generated_blue).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(candidates, 8)
    gum = np.zeros(candidates.shape, dtype=bool)
    for label in range(1, count):
        x, y, width, height, area = [int(value) for value in stats[label]]
        # Gum always intersects the face/action area; blue suit and shoe trim do not.
        if area >= 4 and x < 500 and x + width > 230 and y < 330 and y + height > 120:
            gum |= labels == label
    hsv[gum, 0] = 112
    hsv[gum, 1] = np.maximum(hsv[gum, 1], 220)
    hsv[gum, 2] = np.minimum(hsv[gum, 2], 125)
    rgba[:, :, :3] = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
    return Image.fromarray(rgba)


def extract_bottom_cell(sheet: Image.Image, column: int) -> Image.Image:
    width, height = sheet.width // 2, sheet.height // 2
    cell = sheet.crop((column * width, height, (column + 1) * width, sheet.height))
    return cell.crop(alpha_bounds(cell))


def assert_single_complete_character(image: Image.Image, frame: int) -> None:
    alpha = np.asarray(image.getchannel("A"))
    count, _, stats, _ = cv2.connectedComponentsWithStats((alpha > 8).astype(np.uint8), 8)
    components = sorted((int(stats[index, cv2.CC_STAT_AREA]) for index in range(1, count)), reverse=True)
    if not components or components[0] < 25_000:
        raise ValueError(f"Frame {frame}: missing complete character ({components[:4]})")
    if len(components) > 1 and components[1] > 200:
        raise ValueError(f"Frame {frame}: detached sprite component ({components[:4]})")
    bounds = alpha_bounds(image)
    if bounds[1] < 70 or bounds[3] > 565:
        raise ValueError(f"Frame {frame}: unsafe vertical bounds {bounds}")


def remove_disconnected_top_fragments(image: Image.Image) -> tuple[Image.Image, list[int]]:
    rgba = np.array(image.convert("RGBA"))
    count, labels, stats, _ = cv2.connectedComponentsWithStats(
        (rgba[:, :, 3] > 0).astype(np.uint8),
        8,
    )
    components = sorted(
        range(1, count),
        key=lambda label: int(stats[label, cv2.CC_STAT_AREA]),
        reverse=True,
    )
    removed: list[int] = []
    for label in components[1:]:
        y = int(stats[label, cv2.CC_STAT_TOP])
        x = int(stats[label, cv2.CC_STAT_LEFT])
        width = int(stats[label, cv2.CC_STAT_WIDTH])
        height = int(stats[label, cv2.CC_STAT_HEIGHT])
        area = int(stats[label, cv2.CC_STAT_AREA])
        if y < 80 and 20 <= area < 2_000:
            left = max(0, x - 2)
            top = max(0, y - 2)
            right = min(rgba.shape[1], x + width + 2)
            bottom = min(rgba.shape[0], y + height + 2)
            rgba[top:bottom, left:right, 3] = 0
            removed.append(area)
    # Do not retain discarded sheet artwork invisibly beneath zero-alpha pixels.
    # Keeping transparent RGB can make asset inspectors show "ghost" fragments
    # even though browsers composite them away.
    rgba[rgba[:, :, 3] == 0, :3] = 0
    return Image.fromarray(rgba), removed


def main() -> None:
    manifest_path = ANIMATION / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    target = detect_torso_root(Image.open(ROOT / manifest["frames"][0]["file"]).convert("RGBA"))
    sheets = {
        key: Image.open(SOURCES / f"hugo-neutral-arm-pair-{key}-transparent.png").convert("RGBA")
        for key in ("a", "b", "c")
    }

    for frame in manifest["frames"]:
        output_path = ROOT / frame["file"]
        if frame["index"] in REPLACEMENTS:
            sheet_id, column, row = REPLACEMENTS[frame["index"]]
            assert row == 1
            prepared = register(extract_bottom_cell(sheets[sheet_id], column))
            prepared, registration = stabilize(prepared, target)
            frame["source"] = {
                "type": "pair-specific-arm-inbetween-v3",
                "sheet": f"art/source-images/game/2d-v02/animations/neutral-idle/arm-smooth-v3/hugo-neutral-arm-pair-{sheet_id}-transparent.png",
                "row": 2,
                "column": column + 1,
                "sheetPoseCount": 4,
            }
            frame["rootRegistration"] = registration
        else:
            prepared = Image.open(output_path).convert("RGBA")
        prepared = dark_blue_gum(prepared, 17 <= int(frame["index"]) <= 63)
        prepared, removed_top_fragments = remove_disconnected_top_fragments(prepared)
        if removed_top_fragments:
            frame["topFragmentCleanup"] = {
                "method": "removed disconnected components above safe character region",
                "componentAreas": removed_top_fragments,
            }
        if frame["runtime"] and frame["index"] in REPLACEMENTS:
            assert_single_complete_character(prepared, frame["index"])
        prepared.save(output_path)
        frame["output"]["sha256"] = sha256(output_path)
        frame["output"]["alphaBounds"] = list(alpha_bounds(prepared))

    # Recreate the exact review-only loop seam after all colour changes.
    first, bookend = manifest["frames"][0], manifest["frames"][-1]
    Image.open(ROOT / first["file"]).save(ROOT / bookend["file"])
    bookend["output"]["sha256"] = sha256(ROOT / bookend["file"])
    bookend["output"]["alphaBounds"] = first["output"]["alphaBounds"]
    manifest["generationStrategy"] = (
        "uniform 24 FPS sequence; pair-specific four-pose arm sheets with full-body validation; "
        "dark-blue gum; exact frame-01 bookend"
    )
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("Replaced and validated frames:", sorted(REPLACEMENTS))


if __name__ == "__main__":
    main()
