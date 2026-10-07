# Assets for "Vesna": every element is cut from a real photograph (public domain, see assets/vesna/SOURCES.md).
#   python3 scripts/vesna_assets.py [name ...]      (sources in .scratch/vesna/)
# Graded into one cool monochrome (ink -> steel -> snow); the only colour left is the fireball's orange.
import os, sys, json
import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, '.scratch/vesna')
OUT = os.path.join(ROOT, 'assets/vesna/img')
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

ORANGE = np.array([255, 84, 26])

def red_to_orange(src_rgb, graded):
    """JAT's red (lettering, cheatline, tail logo) becomes the film's one colour"""
    a = np.asarray(src_rgb).astype(np.float32) / 255
    red = ((a[..., 0] - np.maximum(a[..., 1], a[..., 2])) - 0.12).clip(0, 1) / 0.25
    red = np.asarray(Image.fromarray((red.clip(0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32)[..., None] / 255
    g = np.asarray(graded).astype(np.float32)
    lum = g.mean(axis=2, keepdims=True) / 255
    tint = ORANGE[None, None] * (0.55 + 0.6 * lum)
    return Image.fromarray((g * (1 - red) + tint * red).clip(0, 255).astype(np.uint8))

def fit(im, w):
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if im.width > w else im

def src(p):
    os.makedirs(OUT, exist_ok=True)
    return Image.open(os.path.join(S, p))

def cutout(name, path, box=None, scale=1.0, model='birefnet-general', edge=0, orange=False, keep=None, poly=None):
    from rembg import remove, new_session
    im = src(path).convert('RGB')
    if box: im = im.crop(box)
    if scale != 1: im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    m = remove(im, session=new_session(model), only_mask=True, post_process_mask=True)
    if keep:  # polygon (in output pixels) the subject lives in; anything birefnet found outside it is dropped
        from PIL import ImageDraw
        k = Image.new('L', im.size, 0); ImageDraw.Draw(k).polygon([(x * scale, y * scale) for x, y in keep], fill=255)
        m = Image.fromarray(np.minimum(np.asarray(m), np.asarray(k.filter(ImageFilter.GaussianBlur(1.5)))))
    if poly:  # hand-traced outline (source pixels) where white-on-white defeats the matting model: union with it
        from PIL import ImageDraw
        ox, oy = (box[0], box[1]) if box else (0, 0)
        k = Image.new('L', im.size, 0); ImageDraw.Draw(k).polygon([((x - ox) * scale, (y - oy) * scale) for x, y in poly], fill=255)
        m = Image.fromarray(np.maximum(np.asarray(m), np.asarray(k.filter(ImageFilter.GaussianBlur(1.2)))))
    g = grade(im)
    if orange: g = red_to_orange(im, g)
    rgba = g.convert('RGBA'); rgba.putalpha(m)
    bb = m.point(lambda v: 255 if v > 30 else 0).getbbox()
    rgba = rgba.crop(bb)
    rgba.save(os.path.join(OUT, name + '.png'))
    print(name, rgba.size)

def cloud(name, path, box, lo=0.4, hi=0.74, w=1600, feather=0.3, chan=None, edges='lrtb'):
    """cloud mass with alpha from brightness (dark sky -> transparent); the crop edges dissolve along the
    cloud's own texture (a smooth ramp x the brightness), so no rectangle ever shows.
    chan='r' for colour skies: the red channel keeps blue sky dark while white cloud stays bright."""
    im = src(path).convert('RGB').crop(box)
    im = fit(im, w)
    rgb0 = np.asarray(im).astype(np.float32) / 255
    a = rgb0[..., 0] if chan == 'r' else rgb0.mean(axis=2)
    alpha = ((a - lo) / (hi - lo)).clip(0, 1)
    alpha = alpha * alpha * (3 - 2 * alpha)
    h, ww = alpha.shape
    yy, xx = np.mgrid[0:h, 0:ww].astype(np.float32)
    F = feather * min(h, ww)
    ramp = np.ones_like(alpha)
    for side, d in (('l', xx), ('r', ww - 1 - xx), ('t', yy), ('b', h - 1 - yy)):
        if side in edges: ramp = np.minimum(ramp, (d / F).clip(0, 1))
    # dissolve along an irregular, billowing boundary: ramp + two octaves of blurred noise, dense cores last
    import cv2
    rng = np.random.default_rng(abs(hash(name)) % 2 ** 32)
    def octave(sig, amp):
        n = cv2.GaussianBlur(rng.normal(0, 1, (h, ww)).astype(np.float32), (0, 0), sig)
        return n / (n.std() + 1e-6) * amp
    noise = octave(min(h, ww) * 0.06, 0.28) + octave(min(h, ww) * 0.015, 0.12)
    edge = (ramp * 1.5 - 0.5 + noise + alpha * 0.25).clip(0, 1)
    edge = edge * edge * (3 - 2 * edge)
    alpha = (alpha * edge).clip(0, 1)
    rgb = np.asarray(grade(im, cutoff=0.2)).astype(np.float32)
    out = np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(os.path.join(OUT, name + '.png'))
    print(name, im.size)

def plate(name, path, box=None, w=2200, orange=False, scale=1.0, **kw):
    im = src(path).convert('RGB')
    if box: im = im.crop(box)
    if scale != 1: im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    im = fit(im, w)
    g = grade(im, **kw)
    if orange: g = red_to_orange(im, g)
    g.save(os.path.join(OUT, name + '.jpg'), quality=90)
    print(name)

def fire(name, path, box, w=1600):
    """the fireball keeps its colour (the film's one colour): alpha from warmth x brightness"""
    im = src(path).convert('RGB').crop(box)
    im = fit(im, w)
    a = np.asarray(im).astype(np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    warm = ((r - b) - 0.3).clip(0, 1) / 0.4
    bright = ((r + g) / 2 - 0.4).clip(0, 1) / 0.45
    alpha = (warm.clip(0, 1) * bright.clip(0, 1)) ** 0.7
    # elliptical falloff around the fire mass: set walls, roof and pole at the crop edges drop out
    h, w = alpha.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx / w - 0.63) / 0.4) ** 2 + ((yy / h - 0.5) / 0.6) ** 2)
    alpha *= (1 - ((d - 0.7) / 0.3).clip(0, 1)) ** 2
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255
    # pushed from sodium yellow towards the film's signal orange
    col = np.dstack([a[..., 0] ** 0.9, a[..., 1] ** 1.35 * 0.82, a[..., 2] ** 1.6 * 0.5])
    out = np.dstack([col * 255, alpha * 255]).clip(0, 255).astype(np.uint8)
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

JAT = 'commons/1280px-Jugoslovenski_Aerotransport_(JAT)_McDonnell_Douglas_DC-9-32_YU-AHT_at_Long_Beach,_24_January_1971.jpg'
JOBS = {
    # aircraft (NASA's DC-9 / C-9: same type as JAT 367)
    'plane_dive':  lambda: (cutout('plane_dive', 'raw/GRC-1996-C-01436.jpg'), retouch_tail()),
    'plane_bank':  lambda: cutout('plane_bank', 'raw/GRC-1994-C-04159.jpg', scale=0.4),
    # YU-AHT itself, the aircraft of JAT 367 — delivery photo, Long Beach, 24 January 1971 (Commons, PD)
    'yuaht': lambda: cutout('yuaht', JAT, box=(20, 40, 1180, 345), scale=2, orange=True,
                            keep=[(30, 244), (60, 214), (100, 191), (400, 170), (700, 172), (900, 173), (962, 166), (1050, 45), (1180, 45), (1180, 230), (1000, 270), (780, 345), (20, 345)],
                            poly=[(38, 246), (48, 228), (70, 207), (100, 192), (135, 182), (180, 174), (250, 171), (400, 170), (700, 172),
                                  (900, 173), (962, 166), (1012, 110), (1050, 72), (1058, 58), (1120, 56), (1172, 62), (1175, 80), (1165, 95),
                                  (1120, 150), (1080, 180), (1040, 198), (1060, 203), (1112, 212), (1105, 220), (1000, 245), (960, 262),
                                  (900, 278), (760, 282), (700, 290), (757, 326), (735, 330), (560, 288), (135, 288), (75, 282), (50, 268), (40, 258)]),
    'plate_jat': lambda: plate('plate_jat', JAT, scale=2, orange=True, cutoff=0.2),
    # Vesna Vulović: portrait (1971/72), hospital (UPI, 2 March 1972), with a reporter (UPI, 1973), Czechoslovakia (Nov 1972)
    'vesna': lambda: cutout('vesna', 'commons/Vesna_Vulovic.webp'),
    'plate_vesna': lambda: plate('plate_vesna', 'commons/Vesna_Vulovic.webp', w=1661, cutoff=0.3),
    'plate_hospital': lambda: plate('plate_hospital', 'commons/Vesna_Vulovic_in_hospital.webp', scale=2, cutoff=0.3),
    'plate_reporter': lambda: plate('plate_reporter', 'commons/1280px-Vesna_Vulovic_with_reporter_1973.jpg', cutoff=0.3),
    'vesna_1973': lambda: cutout('vesna_1973', 'commons/1280px-Vesna_Vulovic_with_reporter_1973.jpg', box=(0, 60, 700, 1002)),
    'plate_czech': lambda: plate('plate_czech', 'commons/Vesna_Vulovi_right_during_her_visit_in_Czechoslovakia_November_1972.png', cutoff=0.5),
    # clouds (Van Rossem / Northrop 1931, B-17 formation 1940 — LoC; NOAA)
    'cloud_a': lambda: cloud('cloud_a', 'loc/cloud_lanes.jpg', (0, 0, 560, 1030)),
    'cloud_b': lambda: cloud('cloud_b', 'loc/cloud_lanes.jpg', (0, 640, 1440, 1030)),
    'cloud_c': lambda: cloud('cloud_c', 'loc/cloud_lines.jpg', (0, 0, 560, 1150)),
    'cloud_d': lambda: cloud('cloud_d', 'loc/cloud_lines.jpg', (0, 700, 1500, 1150)),
    'cloud_e': lambda: cloud('cloud_e', 'loc/cloud_lanes.jpg', (300, 30, 1440, 470), lo=0.45),
    'cloud_f': lambda: cloud('cloud_f', 'loc/b17_clouds.jpg', (240, 1450, 2640, 2150), lo=0.55, hi=0.85, w=1800),
    'plate_cloudsea': lambda: plate('plate_cloudsea', 'loc/b17_clouds.jpg', (240, 1300, 2700, 2300)),
    'plate_sky': lambda: plate('plate_sky', 'loc/cloud_lines.jpg', (600, 0, 1500, 460), w=1500),
    # the ground: snow-covered forest (Highsmith, LoC)
    'plate_snow_v': lambda: plate('plate_snow_v', 'loc/snow1.jpg', w=1400),
    'plate_snow_a': lambda: plate('plate_snow_a', 'loc/snow3.jpg', w=1840),
    'plate_snow_b': lambda: plate('plate_snow_b', 'loc/snow2.jpg', w=2200),
    # fire (Highsmith, Old Tucson)
    'fireball': lambda: fire('fireball', 'loc/fireball.jpg', (1000, 300, 2720, 980)),
}

if __name__ == '__main__':  # importable: other films reuse grade()/cutout()/plate() with their own S/OUT
    only = sys.argv[1:]
    for k, fn in JOBS.items():
        if only and k not in only: continue
        fn()
