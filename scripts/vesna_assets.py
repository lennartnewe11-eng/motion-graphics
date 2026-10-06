# Assets for "Vesna": every element is cut from a real photograph (public domain, see assets/vesna/SOURCES.md).
#   python3 scripts/vesna_assets.py [name ...]      (sources in .scratch/vesna/)
# Graded into one cool monochrome (ink -> steel -> snow); the only colour left is the fireball's orange.
import os, sys, json
import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, '.scratch/vesna')
OUT = os.path.join(ROOT, 'assets/vesna/img')
os.makedirs(OUT, exist_ok=True)
Image.MAX_IMAGE_PIXELS = None
INK, MID, SNOW = np.array([9, 12, 17]), np.array([92, 101, 112]), np.array([232, 235, 238])

def grade(im, cutoff=0.4, gamma=1.0, lift=0.02):
    """cool monochrome: shadows blue-black, mids steel, highlights snow"""
    g = ImageOps.autocontrast(im.convert('L'), cutoff=cutoff)
    a = (np.asarray(g).astype(np.float32) / 255) ** gamma
    a = lift + (1 - lift) * a
    lo = INK[None, None] * (1 - a[..., None] * 2).clip(0, 1) + MID[None, None] * (1 - abs(a[..., None] * 2 - 1))
    hi = SNOW[None, None] * (a[..., None] * 2 - 1).clip(0, 1)
    rgb = lo + hi
    return Image.fromarray(rgb.clip(0, 255).astype(np.uint8))

def fit(im, w):
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if im.width > w else im

def src(p):
    return Image.open(os.path.join(S, p))

def cutout(name, path, box=None, scale=1.0, model='birefnet-general', edge=0):
    from rembg import remove, new_session
    im = src(path).convert('RGB')
    if box: im = im.crop(box)
    if scale != 1: im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    m = remove(im, session=new_session(model), only_mask=True, post_process_mask=True)
    rgba = grade(im).convert('RGBA'); rgba.putalpha(m)
    bb = m.point(lambda v: 255 if v > 30 else 0).getbbox()
    rgba = rgba.crop(bb)
    rgba.save(os.path.join(OUT, name + '.png'))
    print(name, rgba.size)

def cloud(name, path, box, lo=0.38, hi=0.78, w=1600, feather=40):
    """cloud mass with alpha from brightness (dark sky -> transparent), soft feathered crop edges"""
    im = src(path).convert('L').crop(box)
    im = fit(im, w)
    a = np.asarray(im).astype(np.float32) / 255
    alpha = ((a - lo) / (hi - lo)).clip(0, 1) ** 0.8
    h, ww = alpha.shape
    yy, xx = np.mgrid[0:h, 0:ww]
    f = np.minimum.reduce([xx, ww - 1 - xx, yy, h - 1 - yy]).astype(np.float32)
    alpha *= (f / feather).clip(0, 1)
    rgb = np.asarray(grade(im.convert('RGB'), cutoff=0.2)).astype(np.float32)
    out = np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(os.path.join(OUT, name + '.png'))
    print(name, im.size)

def plate(name, path, box=None, w=2200, **kw):
    im = src(path).convert('RGB')
    if box: im = im.crop(box)
    grade(fit(im, w), **kw).save(os.path.join(OUT, name + '.jpg'), quality=90)
    print(name)

def fire(name, path, box, w=1600):
    """the fireball keeps its colour (the film's one colour): alpha from warmth x brightness"""
    im = src(path).convert('RGB').crop(box)
    im = fit(im, w)
    a = np.asarray(im).astype(np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    warm = ((r - b) - 0.18).clip(0, 1) / 0.5
    bright = ((r + g) / 2 - 0.35).clip(0, 1) / 0.5
    alpha = (warm.clip(0, 1) * bright.clip(0, 1)) ** 0.7
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255
    out = np.dstack([a * 255, alpha * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(os.path.join(OUT, name + '.png'))
    print(name, im.size)

def retouch_tail():
    """NASA's C-9 carries a flag, '650' and the NASA logo on the tail — painted out (JAT 367 had none of it):
    tone interpolated between the clean rows above and below, grain borrowed from the clean elevator skin below"""
    import cv2
    p = os.path.join(OUT, 'plane_dive.png')
    a = np.array(Image.open(p).convert('RGBA')).astype(np.float32)
    x0, x1, y0, y1 = 272, 440, 912, 1000
    top, bot = a[y0 - 4, x0:x1, :3], a[y1 + 2, x0:x1, :3]
    top = cv2.GaussianBlur(top[None], (0, 0), 6)[0]; bot = cv2.GaussianBlur(bot[None], (0, 0), 6)[0]
    t = np.linspace(0, 1, y1 - y0)[:, None, None]
    base = top[None] * (1 - t) + bot[None] * t
    tex = a[y0 + 100:y1 + 100, x0:x1, :3]
    grain = tex - cv2.GaussianBlur(tex, (0, 0), 3)
    patch = base + grain
    m = np.zeros(a.shape[:2], np.float32); m[y0:y1, x0:x1] = 1
    m = cv2.GaussianBlur(m, (0, 0), 3) * (a[..., 3] > 200)
    full = a[..., :3].copy(); full[y0:y1, x0:x1] = patch
    a[..., :3] = a[..., :3] * (1 - m[..., None]) + full * m[..., None]
    # registration 'N650UG' on the nacelle: a band along the lettering, inpainted, film grain re-synthesised
    rgb = a[..., :3].astype(np.uint8)
    m = np.zeros(rgb.shape[:2], np.uint8)
    cv2.line(m, (701, 887), (765, 811), 255, 26)
    fixed = cv2.inpaint(rgb, m, 9, cv2.INPAINT_TELEA).astype(np.float32)
    lum = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    sd = float(np.std((lum - cv2.GaussianBlur(lum, (0, 0), 2))[700:800, 600:700]))
    noise = cv2.GaussianBlur(np.random.default_rng(7).normal(0, sd * 1.4, lum.shape).astype(np.float32), (0, 0), 0.7)[..., None]
    mm = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 2)[..., None]
    a[..., :3] = a[..., :3] * (1 - mm) + (fixed + noise) * mm
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(p)

JOBS = {
    # aircraft (NASA's DC-9 / C-9: same type as JAT 367)
    'plane_dive':  lambda: (cutout('plane_dive', 'raw/GRC-1996-C-01436.jpg'), retouch_tail()),
    'plane_bank':  lambda: cutout('plane_bank', 'raw/GRC-1994-C-04159.jpg', scale=0.4),
    # clouds (Van Rossem / Northrop 1931, B-17 formation 1940 — LoC; NOAA)
    'cloud_a': lambda: cloud('cloud_a', 'loc/cloud_lanes.jpg', (0, 0, 560, 1030)),
    'cloud_b': lambda: cloud('cloud_b', 'loc/cloud_lanes.jpg', (0, 640, 1440, 1030)),
    'cloud_c': lambda: cloud('cloud_c', 'loc/cloud_lines.jpg', (0, 0, 560, 1150)),
    'cloud_d': lambda: cloud('cloud_d', 'loc/cloud_lines.jpg', (0, 700, 1500, 1150)),
    'cloud_e': lambda: cloud('cloud_e', 'loc/cloud_lanes.jpg', (300, 30, 1440, 470), lo=0.42),
    'plate_cloudsea': lambda: plate('plate_cloudsea', 'loc/b17_clouds.jpg', (240, 1300, 2700, 2300)),
    'plate_sky': lambda: plate('plate_sky', 'loc/cloud_lines.jpg', (600, 0, 1500, 460), w=1500),
    # the ground: snow-covered forest (Highsmith, LoC)
    'plate_snow_v': lambda: plate('plate_snow_v', 'loc/snow1.jpg', w=1400),
    'plate_snow_a': lambda: plate('plate_snow_a', 'loc/snow3.jpg', w=1840),
    'plate_snow_b': lambda: plate('plate_snow_b', 'loc/snow2.jpg', w=2200),
    # fire (Highsmith, Old Tucson)
    'fireball': lambda: fire('fireball', 'loc/fireball.jpg', (330, 120, 1900, 1320)),
}

only = sys.argv[1:]
for k, fn in JOBS.items():
    if only and k not in only: continue
    fn()
