"""Shared torso-root detection and registration for the neutral idle.

The neutral idle's hands, lifted shoe, and gum change the full silhouette, so
centering on the full alpha bounds makes the body counter-slide. The two cream
chest panels stay visible throughout the loop and provide a stable root proxy
that is independent of those secondary actions.
"""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image


@dataclass(frozen=True)
class TorsoRoot:
    x: float
    y: float
    height: float
    left_component: tuple[int, int, int, int]
    right_component: tuple[int, int, int, int]


def detect_torso_root(image: Image.Image) -> TorsoRoot:
    rgba = np.asarray(image.convert("RGBA"))
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]
    height, width = alpha.shape
    yy, xx = np.indices(alpha.shape)
    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)

    # Warm cream fabric, constrained to the torso. Skin and white shoes are
    # excluded by the ROI; orange/gold fabric is excluded by chroma.
    mask = (
        (alpha > 50)
        & (yy >= round(height * 0.27))
        & (yy < round(height * 0.62))
        & (xx >= round(width * 0.30))
        & (xx < round(width * 0.70))
        & (rgb[:, :, 0] > 165)
        & (rgb[:, :, 1] > 125)
        & (rgb[:, :, 2] > 80)
        & ((maximum - minimum) < 115)
    )
    count, _, stats, centroids = cv2.connectedComponentsWithStats(
        mask.astype(np.uint8),
        8,
    )
    candidates: list[tuple[int, int, int, int, int, float, float]] = []
    for label in range(1, count):
        x, y, component_width, component_height, area = (
            int(value) for value in stats[label]
        )
        if area < 500 or component_height < 60:
            continue
        centre_x, centre_y = (float(value) for value in centroids[label])
        candidates.append(
            (
                area,
                x,
                y,
                component_width,
                component_height,
                centre_x,
                centre_y,
            )
        )
    if len(candidates) < 2:
        raise ValueError("Could not identify both cream torso panels")

    panels = sorted(sorted(candidates, reverse=True)[:2], key=lambda item: item[5])
    left, right = panels
    root_x = (left[5] + right[5]) / 2
    root_y = (left[6] + right[6]) / 2
    top = min(left[2], right[2])
    bottom = max(left[2] + left[4], right[2] + right[4])
    return TorsoRoot(
        x=root_x,
        y=root_y,
        height=float(bottom - top),
        left_component=(left[1], left[2], left[3], left[4]),
        right_component=(right[1], right[2], right[3], right[4]),
    )


def correction(
    root: TorsoRoot,
    target: TorsoRoot,
    maximum_scale_change: float = 0.04,
) -> tuple[float, float, float]:
    raw_scale = target.height / root.height
    scale = min(1 + maximum_scale_change, max(1 - maximum_scale_change, raw_scale))
    return target.x - root.x, target.y - root.y, scale


def stabilize(
    image: Image.Image,
    target: TorsoRoot,
) -> tuple[Image.Image, dict[str, float]]:
    source = image.convert("RGBA")
    root = detect_torso_root(source)
    delta_x, delta_y, scale = correction(root, target)
    matrix = np.array(
        [
            [scale, 0, target.x - scale * root.x],
            [0, scale, target.y - scale * root.y],
        ],
        dtype=np.float32,
    )
    registered = cv2.warpAffine(
        np.asarray(source),
        matrix,
        source.size,
        flags=cv2.INTER_LANCZOS4,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0, 0),
    )
    output = Image.fromarray(registered)
    after = detect_torso_root(output)
    return output, {
        "beforeRootX": round(root.x, 3),
        "beforeRootY": round(root.y, 3),
        "beforeTorsoHeight": round(root.height, 3),
        "translationX": round(delta_x, 3),
        "translationY": round(delta_y, 3),
        "uniformScale": round(scale, 6),
        "afterRootX": round(after.x, 3),
        "afterRootY": round(after.y, 3),
        "afterTorsoHeight": round(after.height, 3),
    }
