# Assets for "Yamaguchi": every element cut from a real photograph (public domain, see assets/yamaguchi/SOURCES.md).
#   python3 scripts/yamaguchi_assets.py [name ...]      (sources in .scratch/yamaguchi/)
# Same grade as the house style (vesna_assets.grade): ink -> steel -> snow; the accent (crimson) is added in code.
import os, sys
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import vesna_assets as va

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
va.S = os.path.join(ROOT, '.scratch/yamaguchi')
va.OUT = os.path.join(ROOT, 'assets/yamaguchi/img')
OUT = va.OUT

def silhouette(name, path, box, scale=3.0):
    """a figure cut from a photo and filled with ink: an anonymous stand-in (no face, no identity)"""
    va.cutout(name + '_tmp', path, box=box, scale=scale)
    p = os.path.join(OUT, name + '_tmp.png')
    a = np.array(Image.open(p).convert('RGBA'))
    al = Image.fromarray(a[..., 3]).filter(ImageFilter.GaussianBlur(0.8))
    out = np.zeros_like(a); out[..., :3] = va.INK; out[..., 3] = np.asarray(al)
    Image.fromarray(out).save(os.path.join(OUT, name + '.png'))
    os.remove(p)
    print(name, a.shape[1], a.shape[0])

def mushroom(name, path, box=None, w=1400, lo=0.42, hi=0.78, keep_bottom=1.0):
    """mushroom cloud: matting first (birefnet); where the column dissolves into haze, brightness decides"""
    from rembg import remove, new_session
    im = va.src(path).convert('RGB')
    if box: im = im.crop(box)
    im = va.fit(im, w)
    m = np.asarray(remove(im, session=new_session('birefnet-general'), only_mask=True, post_process_mask=False)).astype(np.float32) / 255
    g = np.asarray(im.convert('L')).astype(np.float32) / 255
    lum = ((g - lo) / (hi - lo)).clip(0, 1)
    alpha = np.maximum(m * 0.85, lum * m.clip(0.25, 1))
    h = alpha.shape[0]
    fade = np.clip((keep_bottom * h - np.arange(h)) / (0.12 * h), 0, 1)[:, None]
    alpha *= fade
    rgb = np.asarray(va.grade(im, cutoff=0.3)).astype(np.float32)
    out = np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)
    bb = Image.fromarray((alpha * 255).astype(np.uint8)).point(lambda v: 255 if v > 20 else 0).getbbox()
    Image.fromarray(out, 'RGBA').crop(bb).save(os.path.join(OUT, name + '.png'))
    print(name, bb)

C = 'commons/'
JOBS = {
    # the two clouds (US Army Air Forces / George R. Caron; Charles Levy) — public domain
    'cloud_hiro': lambda: mushroom('cloud_hiro', C + '1280px-Atomic_cloud_over_Hiroshima.jpg', box=(60, 40, 1220, 1420)),
    'cloud_naga': lambda: mushroom('cloud_naga', C + '1280px-Nagasakibomb.jpg', box=(0, 0, 1280, 1460)),
    'cloud_naga2': lambda: mushroom('cloud_naga2', 'loc/naga_cloud.jpg', box=(150, 170, 2290, 2750), w=1400),
    # plates
    'plate_hiro': lambda: va.plate('plate_hiro', C + '1280px-Hiroshima_aftermath.jpg', box=(0, 250, 1280, 896), w=1280, scale=1.0),
    'plate_hiro2': lambda: va.plate('plate_hiro2', C + '1280px-AtomicEffects-Hiroshima.jpg', w=1280),
    'plate_bridge': lambda: va.plate('plate_bridge', 'loc/bridge.jpg', box=(300, 440, 2730, 2050), w=2000),
    'plate_b29': lambda: va.plate('plate_b29', 'loc/b29_hiro.jpg', box=(240, 210, 2700, 2100), w=2000),
    'plate_naga_before': lambda: va.plate('plate_naga_before', C + '960px-Nagasaki_1945_-_Before_and_after_(adjusted).jpg', box=(0, 0, 960, 512), w=960, scale=2.0),
    'plate_naga_map': lambda: va.plate('plate_naga_map', C + '960px-Nagasaki_1945_-_Before_and_after_(adjusted).jpg', box=(0, 530, 960, 1051), w=1920, scale=2.0),
    'plate_naga_after': lambda: va.plate('plate_naga_after', 'loc/naga_after.jpg', box=(110, 120, 2900, 2200), w=2200),
    'plate_ueno': lambda: va.plate('plate_ueno', 'loc/ueno_1920.jpg', box=(90, 90, 2880, 1830), w=2000),
    # the train (1902 platform, Universal Photo Art) and the man: an ink silhouette, not Yamaguchi himself
    'plate_train': lambda: va.plate('plate_train', 'loc/refresh_1902.jpg', box=(118, 170, 766, 670), w=2000, scale=3.0),
    'man': lambda: silhouette('man', 'loc/refresh_1902.jpg', box=(586, 362, 682, 560), scale=4.0),
}

if __name__ == '__main__':
    only = sys.argv[1:]
    for k, fn in JOBS.items():
        if only and k not in only: continue
        fn()
