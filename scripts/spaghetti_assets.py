# Assets for "Spaghetti": NASA photographs (public domain, see assets/spaghetti/SOURCES.md), graded to the house
# style; the Sun keeps its gold (the film's accent: amber — spaghetti, the hot accretion disk).
#   python3 scripts/spaghetti_assets.py [name ...]      (sources in .scratch/spaghetti/nasa)
import os, sys
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import vesna_assets as va

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
va.S = os.path.join(ROOT, '.scratch/spaghetti/nasa')
va.OUT = os.path.join(ROOT, 'assets/spaghetti/img')
OUT = va.OUT
Image.MAX_IMAGE_PIXELS = None

def disc(name, path, cx, cy, r, w=1400, keep_color=True, halo=1.25):
    """a round body (Sun, Earth) cut by its own circle, soft corona kept out to halo*r"""
    os.makedirs(OUT, exist_ok=True)
    im = va.src(path).convert('RGB')
    R = int(r * halo)
    im = im.crop((cx - R, cy - R, cx + R, cy + R))
    im = im.resize((w, w), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    yy, xx = np.mgrid[0:w, 0:w].astype(np.float32)
    d = np.hypot(xx - w / 2, yy - w / 2) / (w / 2 / halo)
    lum = a.mean(axis=2)
    alpha = np.where(d <= 1.0, 1.0, (lum / 0.35).clip(0, 1) * (1 - ((d - 1) / (halo - 1)).clip(0, 1)) ** 1.5)
    rgb = a * 255 if keep_color else np.asarray(va.grade(im)).astype(np.float32)
    Image.fromarray(np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8), 'RGBA').save(os.path.join(OUT, name + '.png'))
    print(name, w)

JOBS = {
    # Bruce McCandless, first untethered spacewalk (MMU), STS-41B, 7 Feb 1984 — NASA s84-27017
    'astro': lambda: va.cutout('astro', 'mmu.jpg', box=(1500, 300, 5600, 4000), scale=0.45),
    'plate_earthlimb': lambda: va.plate('plate_earthlimb', 'mmu.jpg', box=(0, 4150, 6852, 6904), w=2400, cutoff=0.5),
    # deep fields (Hubble eXtreme Deep Field; "Hubble Sees a Legion of Galaxies") — NASA/GSFC
    'plate_xdf': lambda: va.plate('plate_xdf', 'xdf.jpg', w=2382, cutoff=0.5, gamma=1.25),
    'plate_legion': lambda: va.plate('plate_legion', 'legion.jpg', w=1280, cutoff=0.5, gamma=1.25),
    # the Sun (SDO/AIA 171), kept in its own gold
    'sun': lambda: disc('sun', 'sun.jpg', 2075, 2056, 1600, w=1400, halo=1.22),
    # Earth (LRO "Earthrise" composite, NASA/GSFC/ASU)
    'earth': lambda: disc('earth', 'earthrise.png', 480, 372, 212, w=900, keep_color=False, halo=1.04),
}

if __name__ == '__main__':
    only = sys.argv[1:]
    for k, fn in JOBS.items():
        if only and k not in only: continue
        fn()
