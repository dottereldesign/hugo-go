"""Restore intentional candy-pink pixels after magenta chroma despill.

The chroma helper correctly removes the magenta edge fringe from Hugo, but a
global despill also neutralizes the intentionally pink bubble gum. This script
combines the alpha and clean edges from the despilled matte with the protected
pink RGB pixels from an otherwise identical no-despill matte.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--clean", required=True, type=Path, help="Despilled RGBA sheet")
    parser.add_argument(
        "--protected-source",
        required=True,
        type=Path,
        help="Matching RGBA sheet created without despill",
    )
    parser.add_argument("--out", required=True, type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    clean = np.array(Image.open(args.clean).convert("RGBA"))
    protected = np.array(Image.open(args.protected_source).convert("RGBA"))
    if clean.shape != protected.shape:
        raise ValueError("Clean and protected sheets must have identical dimensions")

    red = protected[:, :, 0]
    green = protected[:, :, 1]
    blue = protected[:, :, 2]
    pink = (
        (protected[:, :, 3] > 0)
        & (red > 170)
        & (green > 40)
        & (blue > 90)
        & (blue > green * 1.02)
    )
    clean[pink, :3] = protected[pink, :3]

    args.out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(clean).save(args.out, optimize=True)
    print(f"Restored {int(pink.sum())} protected pink pixels into {args.out}")


if __name__ == "__main__":
    main()
