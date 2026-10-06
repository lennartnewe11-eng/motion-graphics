# Slice multi-take ElevenLabs foley into round-robin variants + normalise single takes.
#   python3 scripts/slice.py molasse
# in:  .scratch/<film>-sfx-raw/*.mp3      out: assets/<film>/sfx/<id>_<n>.ogg  + assets/<film>/sfx/index.json
import json, os, subprocess, sys, importlib.util, re
import numpy as np

film = sys.argv[1] if len(sys.argv) > 1 else 'molasse'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, f'.scratch/{film}-sfx-raw')
OUT = os.path.join(ROOT, f'assets/{film}/sfx')
os.makedirs(OUT, exist_ok=True)
SR = 48000
src = open(os.path.join(ROOT, f'src/shorts/{film}/sfx-prompts.js')).read()
slice_ids = set(re.findall(r"id: '([a-z_0-9]+)'[^}]*slice: true", src))

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)

def save(path, x):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-', '-c:a', 'libvorbis', '-q:a', '7', path], stdin=subprocess.PIPE)
    p.communicate(x.astype(np.float32).tobytes())

def env_db(x, win=0.01):
    m = np.abs(x).max(axis=1)
    n = int(SR * win)
    m = np.convolve(m, np.ones(n) / n, mode='same')
    return 20 * np.log10(m + 1e-9)

index = {}
for f in sorted(os.listdir(RAW)):
    if not f.endswith('.mp3'): continue
    sid = f[:-4]
    x = load(os.path.join(RAW, f))
    peak = np.abs(x).max() + 1e-9
    x = x / peak * 0.89                       # normalise to -1 dBFS
    for old in [g for g in os.listdir(OUT) if g.startswith(sid + '_') or g == sid + '.ogg']: os.remove(os.path.join(OUT, old))
    if sid not in slice_ids:
        save(os.path.join(OUT, sid + '.ogg'), x)
        index[sid] = [f'{sid}.ogg']
        print(f'{sid:14} single {len(x)/SR:.2f}s')
        continue
    e = env_db(x, 0.006)
    hi, lo = e.max() - 26, e.max() - 46       # hysteresis gate: open loud, close only when really quiet
    segs, i, N = [], 0, len(e)
    gap = int(0.035 * SR)
    while i < N:
        if e[i] > hi:
            a = i
            while a > 0 and e[a - 1] > lo: a -= 1          # walk back to the true onset
            j = i
            while j < N:
                if e[j] > lo: j += 1; continue
                k = j
                while k < min(N, j + gap) and e[k] <= lo: k += 1
                if k < N and k < j + gap: j = k; continue   # short dip: same event
                break
            if j - a > 0.02 * SR and (not segs or a > segs[-1][1]): segs.append((a, j))
            i = j + 1
        else: i += 1
    MAXD = {'brush': 0.9, 'calendar': 0.35, 'paper_slide': 0.8, 'paper_crumple': 0.9, 'newspaper': 0.7, 'matches': 0.3, 'typewriter': 0.22, 'drip': 0.4, 'gloop': 0.5}
    if len(segs) < 5:
        # continuous take: cut at onsets (spectral-flux-like rise of the envelope) instead of at silences
        w = int(0.008 * SR)
        sm = np.zeros(N); sm[w:N - w] = e[2 * w:] - e[:N - 2 * w]
        step = int(0.002 * SR)
        cand = [i for i in range(w, N - w, step) if sm[i] > 9 and e[min(N - 1, i + w)] > e.max() - 32]
        md = MAXD.get(sid, 0.6)
        ons = []
        for c in sorted(cand, key=lambda i: -sm[i]):
            if all(abs(c - o) > 0.12 * SR for o in ons): ons.append(c)
        ons = sorted(ons)[:12]
        segs = [(o, min(N, o + int(md * SR), (ons[k + 1] if k + 1 < len(ons) else N))) for k, o in enumerate(ons)]
        segs = [(a, b) for a, b in segs if b - a > 0.08 * SR]
        if len(segs) < 4:   # smooth take: evenly spaced windows, each starting just before a loud stretch
            L = int(md * SR); segs = []
            for a in range(0, N - L, L):
                win = e[a:a + L]
                if win.max() > e.max() - 18: segs.append((a, a + L))
    files = []
    for k, (a, b) in enumerate(segs):
        a = max(0, a - int(0.004 * SR)); b = min(N, b + int(0.03 * SR))
        seg = x[a:b].copy()
        fade = min(len(seg) // 4, int(0.03 * SR))
        seg[-fade:] *= np.linspace(1, 0, fade)[:, None]
        fin = int((0.03 if sid == 'paper_slide' else 0.002) * SR)
        seg[:fin] *= np.linspace(0, 1, fin)[:, None]
        seg = seg / (np.abs(seg).max() + 1e-9) * 0.89
        name = f'{sid}_{k + 1}.ogg'
        save(os.path.join(OUT, name), seg)
        files.append(name)
    index[sid] = files
    print(f'{sid:14} {len(files):2} variants  ' + ' '.join(f'{(b - a) / SR:.2f}' for a, b in segs))
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), indent=1)
