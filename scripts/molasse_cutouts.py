# Cut-outs for "Die Melasse-Flut": crops archive photos and removes the background with rembg.
#   python3 scripts/molasse_cutouts.py      (sources in .scratch/, see assets/molasse/SOURCES.md)
# Output: assets/molasse/img/<name>.png  (RGBA, sepia/greyscale normalised, white paper edge baked in)
import os, sys, json
import numpy as np
from PIL import Image, ImageFilter, ImageOps
from rembg import remove, new_session

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, '.scratch')
OUT = os.path.join(ROOT, 'assets/molasse/img')
os.makedirs(OUT, exist_ok=True)
Image.MAX_IMAGE_PIXELS = None

# name: (source, crop box, model)
CUTS = {
    'p_woman':     ('loc/wood_boston.jpg', (150, 730, 390, 1240), 'birefnet-general'),
    'p_boy_wood':  ('loc/wood_boston.jpg', (330, 870, 490, 1275), 'birefnet-general'),
    'p_girl_box':  ('loc/wood_boston.jpg', (455, 895, 700, 1410), 'birefnet-general'),
    'p_girl_wood': ('loc/wood_boston.jpg', (680, 940, 890, 1385), 'birefnet-general'),
    'p_man_bowler':('loc/wood_boston.jpg', (1295, 760, 1455, 1280), 'birefnet-general'),
    'p_boy_walk':  ('loc/wood_boston.jpg', (2185, 895, 2365, 1400), 'birefnet-general'),
    'lewis_gun':   ('loc/lewis_gun.jpg', (1290, 1240, 1820, 1650), 'birefnet-general'),
    'fire_fg':     ('raw/GreatMolassesFlood_1919-Wreckage_under_the_elevated_tracks.jpg', (280, 1090, 1790, 1684), 'birefnet-general'),
}

def tone(im):
    """Archive print look: greyscale, lifted blacks, warm paper whites (matches the paper background)."""
    g = ImageOps.autocontrast(im.convert('L'), cutoff=0.5)
    a = np.asarray(g).astype(np.float32) / 255
    a = 0.07 + 0.88 * a
    ink, paper = np.array([24, 21, 18]), np.array([238, 232, 220])
    rgb = ink[None, None] * (1 - a[..., None]) + paper[None, None] * a[..., None]
    return Image.fromarray(rgb.clip(0, 255).astype(np.uint8))

def sticker(rgba, edge=5):
    """Hand-cut paper edge: dilated, slightly wobbly white border under the subject."""
    a = rgba.getchannel('A').point(lambda v: 255 if v > 110 else 0)
    big = a.filter(ImageFilter.MaxFilter(edge * 2 + 1)).filter(ImageFilter.GaussianBlur(1.6)).point(lambda v: 255 if v > 100 else 0)
    w, h = rgba.size
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.paste(Image.new('RGBA', (w, h), (244, 240, 231, 255)), (0, 0), big)
    subj = rgba.copy(); subj.putalpha(a.filter(ImageFilter.GaussianBlur(0.7)))
    out.alpha_composite(subj)
    return out

sessions = {}
only = sys.argv[1:]
for name, (src, box, model) in CUTS.items():
    if only and name not in only: continue
    im = Image.open(os.path.join(S, src)).convert('RGB')
    pad = 24
    x0, y0, x1, y1 = box
    crop = im.crop((x0, y0, x1, y1))
    crop = ImageOps.expand(crop, pad, fill=(0, 0, 0)).crop((0, 0, crop.width + 2 * pad, crop.height + 2 * pad)) if False else crop
    up = crop.resize((crop.width * 2, crop.height * 2), Image.LANCZOS)
    if model not in sessions: sessions[model] = new_session(model)
    cut = remove(up, session=sessions[model], post_process_mask=True)
    rgba = tone(up).convert('RGBA'); rgba.putalpha(cut.getchannel('A'))
    bb = rgba.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    rgba = rgba.crop(bb)
    canvas = Image.new('RGBA', (rgba.width + 24, rgba.height + 24), (0, 0, 0, 0)); canvas.paste(rgba, (12, 12))
    st = sticker(canvas, edge=6)
    st.save(os.path.join(OUT, name + '.png'))
    # where the cut-out sat in its source photo (source px of the PNG's top-left; PNG px = 0.5 source px)
    meta_f = os.path.join(OUT, 'cutouts.json')
    meta = json.load(open(meta_f)) if os.path.exists(meta_f) else {}
    meta[name] = {'src': src, 'x': x0 + (bb[0] - 12) / 2, 'y': y0 + (bb[1] - 12) / 2, 'scale': 0.5}
    json.dump(meta, open(meta_f, 'w'), indent=1)
    print(name, st.size)
