"""Remove the painted-in checkerboard from the pose images and export transparent WebPs.

The PNGs in scroll-images(by-order)/ have no alpha channel: the "transparent"
checkerboard is part of the picture. This uses the BiRefNet portrait model
(via rembg) to find the person, then re-estimates the edge colours so hair
doesn't keep a light checkerboard fringe.

Usage (from the repo root):
    python3 -m venv .venv && .venv/bin/pip install "rembg[cpu]==2.0.61" pymatting pillow
    .venv/bin/python scripts/make_cutouts.py
Optional: --masks <dir> reuses already computed masks named <pose>.png.
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from pymatting import estimate_foreground_ml

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scroll-images(by-order)"
OUT = ROOT / "src" / "assets" / "poses"
WIDTHS = (1024, 640)


def model_mask(img, session):
    from rembg import remove

    return remove(img, session=session, only_mask=True, post_process_mask=False)


def cutout(img, mask):
    rgb = np.asarray(img.convert("RGB"), dtype=np.float64) / 255.0
    alpha = np.asarray(mask.convert("L"), dtype=np.float64) / 255.0
    # Snap near-certain values so flat areas stay clean.
    alpha[alpha < 0.03] = 0.0
    alpha[alpha > 0.97] = 1.0
    fg = estimate_foreground_ml(rgb, alpha)
    # The photos are black and white; keep the result neutral grey.
    grey = fg.mean(axis=2, keepdims=True).repeat(3, axis=2)
    rgba = np.dstack([grey, alpha])
    rgba[alpha == 0] = 0.0
    return Image.fromarray((np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--masks", type=Path, help="directory of precomputed masks")
    args = parser.parse_args()

    session = None
    if not args.masks:
        from rembg import new_session

        # CPU only: the CoreML provider can hang for a long time compiling this model.
        session = new_session("birefnet-portrait", providers=["CPUExecutionProvider"])

    OUT.mkdir(parents=True, exist_ok=True)
    for path in sorted(SRC.glob("*_D*.png"), key=lambda p: int(p.stem.split("_")[0])):
        img = Image.open(path).convert("RGB")
        mask = Image.open(args.masks / f"{path.stem}.png") if args.masks else model_mask(img, session)
        result = cutout(img, mask)
        for width in WIDTHS:
            size = (width, round(result.height * width / result.width))
            target = OUT / f"{path.stem}-{width}.webp"
            result.resize(size, Image.LANCZOS).save(target, "WEBP", quality=85, alpha_quality=100, method=6)
            print(f"{target.relative_to(ROOT)}  {target.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
