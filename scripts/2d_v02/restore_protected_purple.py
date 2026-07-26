"""Restore intentional grape-purple pixels after magenta chroma despill.

Purple bubble gum sits close enough to the magenta key colour that global
despill makes it grey. The clean matte remains authoritative for alpha and
edges; only high-confidence blue-dominant grape RGB pixels are copied from a
matching no-despill matte. This avoids restoring the red-dominant magenta
background fringe.
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

    red = protected[:, :, 0].astype(np.int16)
    green = protected[:, :, 1].astype(np.int16)
    blue = protected[:, :, 2].astype(np.int16)
    purple = (
        (protected[:, :, 3] > 0)
        & (red > 70)
        & (green < 150)
        & (blue > 110)
        & (blue > red * 1.08)
        & (blue > green * 1.45)
    )
    clean[purple, :3] = protected[purple, :3]

    args.out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(clean).save(args.out, optimize=True)
    print(f"Restored {int(purple.sum())} protected purple pixels into {args.out}")


if __name__ == "__main__":
    main()
