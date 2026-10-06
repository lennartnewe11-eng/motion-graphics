// Shared worlds and props of "Vesna": night sky, streaming clouds, the DC-9 and its pieces, split-flap boards,
// altimeter digits. Cool monochrome photographs on near-black; the only colour is signal orange.
import { TAU, clamp, lerp, ease, noise3, rng, rgba, seg } from '../../engine/core.js';
import { SW, SH, img, canvas, sticker, tornPath, pathPts, tornShadow } from '../lib/collage.js';
import { setFont, measure, pop, breathe } from '../lib/type.js';

export { TAU, clamp, lerp, ease, noise3, rng, rgba, seg };
export const inR = (t, a, b) => t >= a && t < b;

// ------------------------------------------------------------- palette ---
export const V = {
  ink: [9, 12, 17],
  night: [14, 18, 26],
  slate: [27, 34, 46],
  steel: [92, 101, 112],
  fog: [168, 176, 186],
  snow: [232, 235, 238],
  orange: [255, 84, 26],
  ember: [255, 140, 60],
  carbon: [30, 44, 70], // carbon-copy blue paper
};
// local type roles (setFont accepts role objects)
export const R = {
  LG: { fam: 'League Gothic', weight: 400, style: 'normal', track: 0.0 },
  M: { fam: 'JetBrains Mono', weight: 800, style: 'normal', track: -0.02 },
  M5: { fam: 'JetBrains Mono', weight: 500, style: 'normal', track: 0.04 },
  G: { fam: 'Inter Tight', weight: 900, style: 'normal', track: -0.045 },
  G2: { fam: 'Inter Tight', weight: 300, style: 'normal', track: -0.02 },
  D: { fam: 'Bodoni Moda', weight: 500, style: 'italic', track: -0.01 },
  DB: { fam: 'Bodoni Moda', weight: 800, style: 'italic', track: -0.02 },
  DN: { fam: 'Bodoni Moda', weight: 700, style: 'normal', track: -0.01 },
  A: { fam: 'Anton', weight: 400, style: 'normal', track: 0.0 },
  T: { fam: 'Special Elite', weight: 400, style: 'normal', track: 0.02 },
  H: { fam: 'Caveat', weight: 700, style: 'normal', track: 0 },
};

// --------------------------------------------------------------- night ---
let darkTex = null;
function darkTexture() {
  if (darkTex) return darkTex;
  darkTex = canvas(SW, SH);
  const c = darkTex.getContext('2d');
  const r = rng(31);
  for (let i = 0; i < 1400; i++) {
    const x = r() * SW, y = r() * SH, a = r() * TAU, l = 3 + r() * 18;
    c.strokeStyle = `rgba(190,205,225,${0.025 + r() * 0.04})`;
    c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  for (let i = 0; i < 700; i++) {
    c.fillStyle = `rgba(200,210,230,${0.03 + r() * 0.06})`;
    c.fillRect(r() * SW, r() * SH, 1 + r() * 1.5, 1 + r() * 1.5);
  }
  return darkTex;
}
export function night(ctx, top = V.night, bot = V.ink, tex = true) {
  const g = ctx.createLinearGradient(0, 0, 0, SH);
  g.addColorStop(0, rgba(top)); g.addColorStop(1, rgba(bot));
  ctx.fillStyle = g;
  ctx.fillRect(-2000, -2000, SW + 4000, SH + 4000);
  if (tex) ctx.drawImage(darkTexture(), 0, 0);
}

// -------------------------------------------------------------- clouds ---
// A deterministic field of cloud cut-outs (real photographs, 1931/1940) at depths z. dir 'up': the camera falls,
// clouds stream upward (speed ~ z); dir 'left': level flight. layer 'back' (z<1), 'front' (z>=1) or 'all',
// so the plane can sit between them. Far clouds are darker and lower in contrast (aerial perspective).
const CLOUDS = ['cloud_a', 'cloud_b', 'cloud_c', 'cloud_d', 'cloud_e', 'cloud_f'];
export function cloudField(ctx, t, { seed = 1, n = 14, speed = 900, dir = 'up', layer = 'all', zmin = 0.35, zmax = 2.6, alpha = 1, t0 = 0, drift = 0, lane = 0, size = 1 } = {}) {
  const r = rng(seed);
  const list = [];
  for (let i = 0; i < n; i++) {
    const z = lerp(zmin, zmax, Math.pow(r(), 1.6));
    let x = r();
    // lane: keep a clear corridor of that half-width around the centre (the plane flies there)
    if (lane > 0) x = x < 0.5 ? lerp(-0.15, 0.5 - lane, x * 2) : lerp(0.5 + lane, 1.15, (x - 0.5) * 2);
    list.push({ k: CLOUDS[Math.floor(r() * CLOUDS.length)], z, x, ph: r(), flip: r() < 0.5, rot: (r() - 0.5) * 0.5, s: (0.9 + r() * 0.6) * size });
  }
  list.sort((a, b) => a.z - b.z);
  for (const c of list) {
    if (layer === 'back' && c.z >= 1) continue;
    if (layer === 'front' && c.z < 1) continue;
    const im = img(c.k);
    const sc = c.z * c.s * (SW / im.width) * 1.25;
    const w = im.width * sc, h = im.height * sc;
    let x, y;
    if (dir === 'up') {
      const span = SH + h + 400;
      y = SH + h / 2 + 200 - (((c.ph * span + (t - t0) * speed * c.z) % span) + span) % span;
      x = (lane > 0 ? c.x : lerp(-0.1, 1.1, c.x)) * SW + drift * c.z * (t - t0);
    } else {
      const span = SW + w + 400;
      x = SW + w / 2 + 200 - (((c.ph * span + (t - t0) * speed * c.z) % span) + span) % span;
      y = (lane > 0 ? c.x : lerp(0.05, 0.95, c.x)) * SH;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(c.rot);
    ctx.scale(c.flip ? -1 : 1, 1);
    const far = clamp(1 - c.z);
    ctx.globalAlpha *= alpha * lerp(1, 0.45, far) * (c.z > 1.8 ? 0.85 : 1);
    if (far > 0.3) ctx.filter = `brightness(${lerp(1, 0.55, far).toFixed(2)})`;
    ctx.drawImage(im, -w / 2, -h / 2, w, h);
    ctx.filter = 'none';
    ctx.restore();
  }
}

// ---------------------------------------------------------------- snow ---
// falling snow / ash specks (particles over the photographs), deterministic
export function specks(ctx, t, { n = 90, seed = 3, vy = 60, vx = 10, size = 3, alpha = 0.7, color = V.snow, streak = 0 } = {}) {
  const r = rng(seed);
  ctx.save();
  ctx.fillStyle = rgba(color);
  ctx.strokeStyle = rgba(color);
  for (let i = 0; i < n; i++) {
    const z = 0.3 + r() * 1.2;
    const x0 = r() * (SW + 200) - 100, y0 = r() * (SH + 200), ph = r() * TAU;
    const y = ((y0 + t * vy * z) % (SH + 200) + SH + 200) % (SH + 200) - 100;
    const x = ((x0 + t * vx * z + Math.sin(t * 0.8 + ph) * 18 * z) % (SW + 200) + SW + 200) % (SW + 200) - 100;
    ctx.globalAlpha = alpha * clamp(z / 1.2) * 0.9;
    if (streak > 0) {
      ctx.lineWidth = size * z * 0.6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - vx * z * streak, y - vy * z * streak); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(x, y, size * z * 0.5, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

// ----------------------------------------------------------- the DC-9 ---
// yuaht.png (2277 x 551): YU-AHT herself, side view, nose left. Window row and the forward hold in image pixels.
export const YU = { w: 2277, h: 551, nose: [4, 386], hold: [430, 380, 330, 120], reg: [1785, 296, 180, 50], logo: [1985, 92, 220, 120] };
export const windowAt = (k) => { const x = 383 + 31.9 * k; return [x, 332 + (x - 383) * 0.0094]; };
// jagged break lines across the fuselage (image x), shared by all pieces so they fit together
const CUTS = [560, 1000, 1640];
const cutCache = new Map();
function cutLine(i) {
  if (cutCache.has(i)) return cutCache.get(i);
  const r = rng(40 + i), pts = [];
  for (let y = -10; y <= YU.h + 10; y += 22) pts.push([CUTS[i] + (r() - 0.5) * 46 + noise3(y * 0.01, i, 3) * 40, y]);
  cutCache.set(i, pts);
  return pts;
}
// piece i: 0 nose, 1 forward fuselage (the hold with the bomb), 2 centre with wing (Vesna), 3 tail
export function piecePath(ctx, i) {
  ctx.beginPath();
  const L = i === 0 ? [[-20, -10], [-20, YU.h + 10]] : cutLine(i - 1);
  const Rr = i === 3 ? [[YU.w + 20, -10], [YU.w + 20, YU.h + 10]] : cutLine(i);
  L.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  for (let k = Rr.length - 1; k >= 0; k--) ctx.lineTo(Rr[k][0], Rr[k][1]);
  ctx.closePath();
}
export const PIECE_CX = [280, 780, 1320, 1960];
// one piece of YU-AHT, rendered once per burn level: clipped by its break lines, the breaks scorched
// (soot, then an orange-hot rim) — only on the aircraft's pixels, never on the empty corners
const pieceCache = new Map();
function pieceCanvas(i, burn) {
  const q = Math.round(clamp(burn) * 4);
  const key = i + '|' + q;
  if (pieceCache.has(key)) return pieceCache.get(key);
  const c = canvas(YU.w, YU.h), x = c.getContext('2d');
  piecePath(x, i); x.clip();
  x.drawImage(img('yuaht'), 0, 0);
  if (q > 0) {
    x.globalCompositeOperation = 'source-atop';
    x.lineJoin = 'round'; x.lineCap = 'round';
    const lines = [i > 0 ? cutLine(i - 1) : null, i < 3 ? cutLine(i) : null].filter(Boolean);
    for (const [w, col, a] of [[90, V.ink, 0.7], [34, V.orange, 0.85], [10, V.ember, 1]]) {
      x.lineWidth = w; x.strokeStyle = rgba(col, a * q / 4);
      x.filter = w > 50 ? 'blur(14px)' : w > 20 ? 'blur(5px)' : 'none';
      for (const pts of lines) { x.beginPath(); pts.forEach(([px, py], k) => (k ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke(); }
    }
    x.filter = 'none';
  }
  pieceCache.set(key, c);
  return c;
}
// draw YU-AHT (or one piece) centred on the image point (ix, iy) at screen (x, y)
export function yuaht(ctx, x, y, s, rot = 0, { piece = -1, ix = YU.w / 2, iy = YU.h / 2, alpha = 1, burn = 0, flip = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s * (flip ? -1 : 1), s);
  ctx.translate(-ix, -iy);
  ctx.globalAlpha *= alpha;
  ctx.drawImage(piece >= 0 ? pieceCanvas(piece, burn) : img('yuaht'), 0, 0);
  ctx.restore();
}
// the NASA C-9 in a dive (plane_dive.png 1428 x 1144: nose at upper right, tail lower left)
export function divePlane(ctx, x, y, s, rot, { flip = false, alpha = 1 } = {}) {
  sticker(ctx, 'plane_dive', x, y, { s, rot, ax: 0.55, ay: 0.45, flip, shadow: false, alpha });
}

// ----------------------------------------------------------- split-flap ---
// Departure-board characters: each cell flips through letters (half-flap squash) and settles on its char.
const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export function flap(ctx, text, x, y, t, t0, { size = 90, cellW = null, gap = 8, stagger = 0.035, dur = 0.42, color = V.snow, bg = [20, 24, 32], align = 'left', seed = 1, accent = null } = {}) {
  const cw = cellW ?? size * 0.78, ch = size * 1.22;
  const n = text.length;
  const total = n * cw + (n - 1) * gap;
  let ox = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const r = rng(seed);
  setFont(ctx, R.M, size);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const out = [];
  for (let i = 0; i < n; i++) {
    const cx = ox + i * (cw + gap) + cw / 2;
    const ti = t0 + i * stagger;
    const k = clamp((t - ti) / dur);
    const show = t >= ti - 0.15;
    const target = text[i];
    // cell
    ctx.save();
    ctx.globalAlpha *= show ? clamp((t - ti + 0.15) / 0.1) : 0;
    ctx.fillStyle = rgba(bg);
    ctx.beginPath(); ctx.roundRect(cx - cw / 2, y - ch / 2, cw, ch, size * 0.08); ctx.fill();
    if (target !== ' ') {
      let c = target, sq = 1;
      if (k < 1) {
        const flips = 4 + Math.floor(r() * 5);
        const f = k * flips, fi = Math.floor(f);
        c = fi >= flips - 1 ? target : FLAP_CHARS[(Math.floor(r() * 36) + fi * 7) % 36];
        sq = Math.abs(Math.cos((f - fi) * Math.PI)) * 0.85 + 0.15;
      } else r(), r();
      ctx.save();
      ctx.beginPath(); ctx.rect(cx - cw / 2, y - ch / 2, cw, ch); ctx.clip();
      ctx.translate(cx, y + size * 0.04);
      ctx.scale(1, sq);
      ctx.fillStyle = rgba(accent && accent.includes(i) ? V.orange : color);
      ctx.fillText(c, 0, 0);
      ctx.restore();
    } else r(), r();
    // hinge
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(cx - cw / 2, y - 1.5, cw, 3);
    ctx.restore();
    out.push({ x: cx, flipEnd: ti + dur, ch: target });
  }
  ctx.textBaseline = 'alphabetic';
  return { x: ox, w: total, h: ch, cells: out };
}

// --------------------------------------------------------------- digits ---
// rolling digit counter (altimeter): value in metres, digits roll like a drum; colour on a dark plate
export function drum(ctx, x, y, value, digits, { size = 140, color = V.orange, bg = null, sep = ' ', unit = 'm', role = R.M } = {}) {
  setFont(ctx, role, size);
  ctx.letterSpacing = '0px';
  const dw = ctx.measureText('0').width * 1.02, sw = size * 0.28, h = size * 1.12;
  const groups = Math.floor((digits - 1) / 3);
  const w = digits * dw + groups * sw;
  const x0 = x - w / 2;
  if (bg) { ctx.fillStyle = rgba(bg); ctx.fillRect(x0 - size * 0.25, y - h * 0.62, w + size * 0.5, h * 1.1); }
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 - 10, y - h * 0.62, w + 20, h * 1.02); ctx.clip();
  ctx.fillStyle = rgba(color);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let cx = x0 + dw / 2;
  const v0 = Math.max(0, Math.round(value / 10) * 10); // the ones digit would only be a blur
  for (let i = 0; i < digits; i++) {
    const place = Math.pow(10, digits - 1 - i);
    const v = v0 / place;
    const d = Math.floor(v) % 10;
    const frac = v - Math.floor(v);
    const roll = place === 10 ? frac : 0; // the tens roll, everything above snaps (a falling altimeter reads cleaner)
    if (v0 >= place || i === digits - 1) {
      for (const [dd, off] of [[d, roll], [(d + 1) % 10, roll - 1]]) ctx.fillText(String(dd), cx, y + off * h);
    }
    cx += dw;
    if ((digits - 1 - i) % 3 === 0 && i < digits - 1) cx += sw;
  }
  ctx.restore();
  if (unit) {
    setFont(ctx, R.DB, size * 0.6);
    ctx.fillStyle = rgba(color);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(unit, x0 + w + size * 0.12, y + size * 0.36);
  }
  ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = '0px';
  return { x: x0, w, h };
}

// ----------------------------------------------------------- typography ---
// a word that pops on with overshoot and breathes; returns its width. o: { role, size, color, align, rot, sx, sy, stroke }
export function word(ctx, t, text, x, y, at, o = {}) {
  if (t < at) return 0;
  const { role = R.G, size = 120, color = V.snow, align = 'center', rot = 0, sx = 1, sy = 1, seed = 1, stroke = 0, strokeCol = V.ink, k: kk = 1, alpha = 1, from = 0.3 } = o;
  const p = pop(t, at, kk);
  const br = breathe(t, seed, 1);
  const m = measure(ctx, text, role, size);
  ctx.save();
  ctx.translate(x + br.dx, y + br.dy);
  ctx.rotate(rot + br.r);
  const sc = lerp(from, 1, p) * br.s;
  ctx.scale(sc * sx, sc * sy);
  ctx.globalAlpha *= clamp(p * 4) * alpha;
  setFont(ctx, role, size);
  ctx.textAlign = align;
  if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = stroke; ctx.strokeStyle = rgba(strokeCol); ctx.strokeText(text, 0, 0); }
  ctx.fillStyle = rgba(color);
  ctx.fillText(text, 0, 0);
  ctx.letterSpacing = '0px';
  ctx.restore();
  return m.w;
}
// torn dark-paper label behind a word (instead of white strips: the film keeps its night)
export function tag(ctx, t, text, cx, cy, at, { role = R.G, size = 90, col = V.snow, bgc = V.ink, seed = 1, rot = 0, padX = 0.3, padY = 0.22 } = {}) {
  if (t < at) return null;
  const k = clamp((t - at) / 0.1);
  const sc = lerp(1.2, 1, ease.outBack(k));
  const m = measure(ctx, text, role, size);
  const w = m.w + size * padX * 2, h = m.asc + m.desc + size * padY * 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot + noise3(t * 0.5, seed, 1) * 0.012);
  ctx.scale(sc, sc);
  ctx.translate(-w / 2, -h / 2);
  const sh = tornShadow(w, h, seed, 'lr', 6, 8);
  ctx.save(); ctx.globalAlpha *= 0.45; ctx.drawImage(sh, 4 - sh.pad, 10 - sh.pad); ctx.restore();
  ctx.fillStyle = rgba(bgc);
  pathPts(ctx, tornPath(w, h, seed, { sides: 'lr', amp: 6, step: 7 }));
  ctx.fill();
  setFont(ctx, role, size);
  ctx.fillStyle = rgba(col);
  ctx.textAlign = 'left';
  ctx.fillText(text, size * padX, h / 2 + (m.asc - m.desc) / 2);
  ctx.letterSpacing = '0px';
  ctx.restore();
  return { w, h };
}
// glyphs that fall away under gravity one after another (from t0), staggered
export function fallingWord(ctx, t, text, x, y, at, t0, { role = R.G, size = 120, color = V.snow, align = 'center', stagger = 0.05, g = 5200, seed = 2 } = {}) {
  if (t < at) return;
  setFont(ctx, role, size);
  ctx.letterSpacing = '0px';
  const ws = [...text].map((c) => ctx.measureText(c).width);
  const total = ws.reduce((a, b) => a + b, 0);
  let ox = align === 'center' ? x - total / 2 : x;
  const r = rng(seed);
  const p = pop(t, at);
  [...text].forEach((c, i) => {
    const tf = t0 + i * stagger + r() * 0.03;
    const dt = Math.max(0, t - tf);
    const dy = 0.5 * g * dt * dt, rot = dt * (r() - 0.5) * 6, dx = dt * (r() - 0.5) * 160;
    ctx.save();
    ctx.translate(ox + ws[i] / 2 + dx, y + dy);
    ctx.rotate(rot);
    ctx.scale(lerp(0.3, 1, p), lerp(0.3, 1, p) * (1 + clamp(dt * 3) * 0.25));
    ctx.globalAlpha *= clamp(p * 4);
    ctx.fillStyle = rgba(color);
    ctx.textAlign = 'center';
    ctx.fillText(c, 0, 0);
    ctx.restore();
    ox += ws[i];
  });
}
// orange marker swipe for light photographs (multiply keeps the print's grain visible)
export function marker(ctx, x, y, w, h, p, { seed = 2, alpha = 0.85, color = V.orange } = {}) {
  if (p <= 0) return;
  const r = rng(seed);
  const ww = w * ease.outCubic(clamp(p));
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  const pad = h * 0.14;
  ctx.moveTo(x - pad, y - pad + r() * 3);
  for (let i = 1; i <= 8; i++) ctx.lineTo(x - pad + (ww + 2 * pad) * (i / 8), y - pad + (r() - 0.5) * 4);
  for (let i = 8; i >= 0; i--) ctx.lineTo(x - pad + (ww + 2 * pad) * (i / 8), y + h + pad + (r() - 0.5) * 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
// white flash (camera flash / impact), decays from t0
export function flash(ctx, t, t0, { dur = 0.25, peak = 1, color = V.snow } = {}) {
  if (t < t0 || t > t0 + dur) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = peak * Math.pow(1 - (t - t0) / dur, 2);
  ctx.fillStyle = rgba(color);
  ctx.fillRect(0, 0, SW, SH);
  ctx.restore();
}
// fireball cut-out (Old Tucson, Highsmith) — the one colour, added as light
export function fireball(ctx, x, y, s, t, t0, { alpha = 1, rot = 0, comp = 'screen' } = {}) {
  if (t < t0) return;
  const k = clamp((t - t0) / 1.4);
  const im = img('fireball');
  const sc = s * lerp(0.15, 1.1, ease.outExpo(clamp((t - t0) / 0.5))) * (1 + k * 0.15);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot + k * 0.2);
  ctx.scale(sc, sc);
  ctx.globalCompositeOperation = comp;
  ctx.globalAlpha *= alpha * (1 - ease.inCubic(k));
  ctx.drawImage(im, -im.width * 0.63, -im.height * 0.5);
  ctx.restore();
}
