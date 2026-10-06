# Archive plates for "Die Melasse-Flut": tone every photo/newspaper into the film's print palette.
#   python3 scripts/molasse_plates.py   (sources in .scratch/, credits in assets/molasse/SOURCES.md)
import os, json
import numpy as np
from PIL import Image, ImageOps, ImageFilter
import cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, '.scratch')
OUT = os.path.join(ROOT, 'assets/molasse/img')
Image.MAX_IMAGE_PIXELS = None
INK, PAPER = np.array([24, 21, 18]), np.array([238, 232, 220])

def tone(im, lift=0.06, gamma=1.0, news=False):
    g = ImageOps.autocontrast(im.convert('L'), cutoff=0.4 if not news else 1.5)
    a = (np.asarray(g).astype(np.float32) / 255) ** gamma
    a = lift + (0.95 - lift) * a
    paper = np.array([236, 226, 204]) if news else PAPER
    rgb = INK[None, None] * (1 - a[..., None]) + paper[None, None] * a[..., None]
    return Image.fromarray(rgb.clip(0, 255).astype(np.uint8))

def fit(im, w):
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    return im

PLATES = {
    'plate_street':    ('loc/wood_boston.jpg', None, 2400, {}),
    'plate_aerial':    ('raw/Boston_Mass._Boston_molasses_explosion_14968a.jpg', None, 2600, {}),
    'plate_elwreck':   ('raw/Boston_1919_molasses_disaster_-_el_train_structure.jpg', None, 1024, {}),
    'plate_ambulance': ('raw/1919_MolassesFlood_Boston.png', None, 588, {}),
    'plate_tank':      ('raw/North_End_molasses_tank.jpg', None, 417, {}),
    'plate_twharf':    ('loc/twharf.jpg', None, 1536, {}),
    'plate_rowes':     ('loc/rowes_wharf.jpg', (60, 60, 2940, 2260), 2400, {}),
    'plate_dudley':    ('loc/dudley_el.jpg', (60, 60, 2940, 2340), 2400, {}),
    'news_ledger':     ('news/ledger_0115.jpg', (900, 250, 2300, 1500), 1400, {'news': True}),
    'news_newbritain': ('news/newbritain_0115.jpg', (300, 250, 1300, 1300), 1000, {'news': True}),
    'news_globe':      ('raw/Boston_Daily_Globe_Jan._16_1919.png', None, 850, {'news': True}),
}
for name, (src, crop, w, kw) in PLATES.items():
    im = Image.open(os.path.join(S, src)).convert('RGB')
    if crop: im = im.crop(crop)
    out = tone(fit(im, w), **kw)
    out.save(os.path.join(OUT, name + '.jpg'), quality=90)
    print(name, out.size)

# firefighter photo: foreground cut-out exists (fire_fg.png, from crop at 280,1090 scaled x2);
# the background plate gets the foreground inpainted so the two layers can move in parallax.
src = Image.open(os.path.join(S, 'raw/GreatMolassesFlood_1919-Wreckage_under_the_elevated_tracks.jpg')).convert('RGB')
fg = Image.open(os.path.join(OUT, 'fire_fg.png'))
a = fg.getchannel('A').resize((fg.width // 2, fg.height // 2))
mask = Image.new('L', src.size, 0); mask.paste(a, (280 - 6, 1090 - 6))
mask = mask.point(lambda v: 255 if v > 20 else 0).filter(ImageFilter.MaxFilter(15))
small = 2  # inpaint at half resolution (fast), then upsample the filled region
s_img = cv2.cvtColor(np.asarray(src.resize((src.width // small, src.height // small))), cv2.COLOR_RGB2BGR)
s_msk = np.asarray(mask.resize((src.width // small, src.height // small)))
fill = cv2.inpaint(s_img, s_msk, 9, cv2.INPAINT_TELEA)
fill = Image.fromarray(cv2.cvtColor(fill, cv2.COLOR_BGR2RGB)).resize(src.size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(3))
plate = src.copy(); plate.paste(fill, (0, 0), mask.filter(ImageFilter.GaussianBlur(4)))
tone(plate).save(os.path.join(OUT, 'plate_fire.jpg'), quality=90)
print('plate_fire', plate.size)

# highlight boxes on the newspapers (pixel coords in the toned crops), from the LoC ALTO word coordinates
HL = {
    'news_ledger': {
        'date': [1328 - 900, 326 - 250, 214, 28],
        'headline': [1535 - 900, 822 - 250, 275, 44],
        'headline2': [1535 - 900, 868 - 250, 300, 44],
        'elevated': [1548 - 900, 980 - 250, 272, 30],
    },
    'news_newbritain': {
        'headline': [622 - 300, 396 - 250, 414, 36],
        'kills': [690 - 300, 446 - 250, 392, 36],
        'pillars': [622 - 300, 540 - 250, 460, 26],
        'buildings': [660 - 300, 580 - 250, 232, 26],
    },
}
json.dump(HL, open(os.path.join(OUT, 'highlights.json'), 'w'), indent=1)

