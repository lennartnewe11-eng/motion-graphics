// Design system of the Assecor film: brand palette and type, word-synced typography,
// hand-drawn strokes (with "boil"), handwriting, photo cards with torn edges,
// the brand's pixel-block service icons, line icons that draw on, and the logo.
import { W, H, TAU, clamp, lerp, ease, seg, hash1, noise2 } from '../engine/core.js';
import { LOGO, PIXEL, LINE } from './brand-data.js';
import { line } from './timeline.js';

// ------------------------------------------------------------------ brand ---
// Colours taken from assecor.de: navy page colour, the four scheme colours and their light tints.
export const COL = {
  navy: '#071225', navy2: '#212A3B', navy3: '#2B3550',
  mint: '#00CDA5', mint2: '#4DDCC0', mintT: '#CCF5ED',
  blue: '#5564D7', blue2: '#8893E3', blueT: '#DDE0F7',
  coral: '#FF6464', coral2: '#FF9393', coralT: '#FFE0E0',
  yellow: '#FFFF58', yellowT: '#FFFFCC',
  white: '#FFFFFF', paper: '#F7F5EE', grey: '#ECEDEE',
};
export const FT = { serif: 'Merriweather', sans: 'Roboto', cond: 'Roboto Condensed', hand: 'Caveat' };
export const FONTS = [
  '300 40px Merriweather', 'italic 300 40px Merriweather', '400 40px Merriweather', 'italic 400 40px Merriweather',
  '700 40px Merriweather', 'italic 700 40px Merriweather', '900 40px Merriweather',
  '300 40px Roboto', '400 40px Roboto', '500 40px Roboto', '700 40px Roboto', '900 40px Roboto',
  '700 40px "Roboto Condensed"', '800 40px "Roboto Condensed"', '900 40px "Roboto Condensed"', '300 40px "Roboto Condensed"',
  '500 40px Caveat', '700 40px Caveat',
];
export function setFont(ctx, size, weight = 400, fam = FT.serif, style = 'normal') {
  ctx.font = `${style} ${weight} ${size}px "${fam}"`;
}
export function rgbaHex(hex, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
export const mixHex = (a, b, t) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const c = (s) => Math.round(lerp((A >> s) & 255, (B >> s) & 255, clamp(t)));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};

// --------------------------------------------------------------- assets ---
export const IMG = {};
let paperTex = null;
const pathLen = new Map();
let logoBoxes = [];

export async function loadAssets(names) {
  await Promise.all(names.map(async (n) => {
    const blob = await (await fetch(`/assets/assecor/img/${n}.jpg`)).blob();
    IMG[n] = await createImageBitmap(blob);
  }));
  // paper fibre texture (multiplied over light backgrounds)
  const c = new OffscreenCanvas(1024, 1024);
  const x = c.getContext('2d');
  const id = x.createImageData(1024, 1024);
  let s = 77;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < id.data.length; i += 4) {
    const px = (i / 4) % 1024, py = Math.floor(i / 4 / 1024);
    const v = 236 + r() * 19 - 9 * Math.max(0, noise2(px * 0.012, py * 0.05)) - 5 * noise2(px * 0.2, py * 0.01);
    id.data[i] = id.data[i + 1] = id.data[i + 2] = clamp(v, 0, 255);
    id.data[i + 3] = 255;
  }
  x.putImageData(id, 0, 0);
  paperTex = c;
  // exact path lengths for draw-on animation (measured with the SVG DOM)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.visibility = 'hidden';
  document.body.appendChild(svg);
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svg.appendChild(p);
  for (const icon of Object.values(LINE)) for (const e of icon) { p.setAttribute('d', e.d); pathLen.set(e.d, p.getTotalLength()); }
  logoBoxes = LOGO.paths.map((e) => {
    p.setAttribute('d', e.d);
    const b = p.getBBox();
    const [tx, ty] = (e.tr || 'translate(0 0)').match(/-?[\d.]+/g).map(Number);
    return { x: b.x + tx, y: b.y + ty, w: b.width, h: b.height };
  });
  svg.remove();
}

// ------------------------------------------------------------ backgrounds ---
export function bg(ctx, color, paper = 0) {
  ctx.fillStyle = color;
  ctx.fillRect(-40, -40, W + 80, H + 80);
  if (paper > 0 && paperTex) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = paper;
    ctx.fillStyle = ctx.createPattern(paperTex, 'repeat');
    ctx.fillRect(-40, -40, W + 80, H + 80);
    ctx.restore();
  }
}

// camera: zoom/pan/rotate around the frame centre
export function camera(ctx, { x = 0, y = 0, z = 1, r = 0, cx = W / 2, cy = H / 2 } = {}) {
  ctx.translate(cx, cy);
  ctx.rotate(r);
  ctx.scale(z, z);
  ctx.translate(-cx + x, -cy + y);
}

// decaying hand-held shake after an impact
export function shake(t, t0, amp = 14, dur = 0.5) {
  if (t < t0 || t > t0 + dur) return [0, 0];
  const k = Math.pow(1 - (t - t0) / dur, 2);
  return [amp * k * noise2(t * 40, 1.3), amp * k * noise2(t * 40, 7.9)];
}

// -------------------------------------------------------------- typography ---
// A word that rises out of a mask (the base reveal of the film).
export function rise(ctx, str, x, y, t, t0, o = {}) {
  const { size = 80, weight = 400, fam = FT.serif, style = 'normal', color = COL.white, align = 'left', dur = 0.45, out = 1e9, outDur = 0.35, track = 0, from = 1 } = o;
  const pin = seg(t, t0, t0 + dur, ease.outExpo);
  const pout = seg(t, out, out + outDur, ease.inExpo);
  if (pin <= 0 || pout >= 1) return 0;
  setFont(ctx, size, weight, fam, style);
  ctx.letterSpacing = track + 'px';
  const w = ctx.measureText(str).width;
  const ox = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox - size, y - size * 1.15, w + size * 2, size * 1.55);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(str, ox, y + (1 - pin) * size * 1.25 * from - pout * size * 1.3);
  ctx.restore();
  ctx.letterSpacing = '0px';
  return w;
}

export function measure(ctx, str, size, weight = 400, fam = FT.serif, style = 'normal', track = 0) {
  setFont(ctx, size, weight, fam, style);
  ctx.letterSpacing = track + 'px';
  const w = ctx.measureText(str).width;
  ctx.letterSpacing = '0px';
  return w;
}

// A narration line laid out as one sentence with per-word styles, every word revealed when spoken.
// styles: array (per word) or function(i, word) -> partial style. Returns word boxes.
export function sentence(ctx, id, t, o = {}) {
  const l = line(id);
  const { x = W / 2, y = H / 2, size = 64, weight = 400, fam = FT.serif, style = 'normal', color = COL.white, align = 'center', gap = 0.3, styles = null, from = 0, to = 99, lead = 0.05, out = 1e9, reveal = 'rise', words: override = null, lh = 1.25, breaks = [] } = o;
  const words = l.words.slice(from, to).map((w, k) => {
    const i = k + from;
    const st = { size, weight, fam, style, color, ...(typeof styles === 'function' ? styles(i, w.w) : styles?.[i] || {}) };
    const text = override?.[i] ?? w.w;
    return { ...w, i, text, st, wd: measure(ctx, text, st.size, st.weight, st.fam, st.style, st.track || 0) };
  });
  // lines
  const rows = [[]];
  for (const w of words) { if (breaks.includes(w.i) && rows[rows.length - 1].length) rows.push([]); rows[rows.length - 1].push(w); }
  const boxes = [];
  rows.forEach((row, r) => {
    const sp = size * gap;
    const total = row.reduce((s, w) => s + w.wd, 0) + sp * (row.length - 1);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    const yy = y + r * size * lh;
    for (const w of row) {
      const t0 = l.t + w.s - lead;
      if (reveal === 'rise') rise(ctx, w.text, cx, yy, t, t0, { ...w.st, out: out + w.i * 0.03 });
      else reveal(ctx, w, cx, yy, t, t0);
      boxes.push({ x: cx, y: yy, w: w.wd, size: w.st.size, t0, i: w.i, text: w.text });
      cx += w.wd + sp;
    }
  });
  return boxes;
}

// Letters type on one by one behind a block cursor (brand pixel as caret).
export function typeOn(ctx, str, x, y, t, t0, o = {}) {
  const { size = 60, weight = 400, fam = FT.sans, style = 'normal', color = COL.white, cps = 22, cursor = COL.mint, align = 'left', hold = 1e9 } = o;
  const n = clamp(Math.floor((t - t0) * cps), 0, str.length);
  if (t < t0 - 0.3) return;
  setFont(ctx, size, weight, fam, style);
  const fullW = ctx.measureText(str).width;
  const ox = align === 'center' ? x - fullW / 2 : x;
  const s = str.slice(0, n);
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(s, ox, y);
  const cw = ctx.measureText(s).width;
  const blink = n < str.length || (Math.floor(t * 2.5) % 2 === 0 && t < hold);
  if (blink && cursor) { ctx.fillStyle = cursor; ctx.fillRect(ox + cw + size * 0.08, y - size * 0.78, size * 0.5, size * 0.92); }
}

// Glyphs resolve from coloured pixel blocks into type.
export function pixelWord(ctx, str, x, y, t, t0, o = {}) {
  const { size = 120, weight = 300, fam = FT.serif, style = 'normal', color = COL.white, align = 'center', stagger = 0.035, dur = 0.35, palette = [COL.mint, COL.blue, COL.coral, COL.yellow] } = o;
  setFont(ctx, size, weight, fam, style);
  const total = ctx.measureText(str).width;
  let ox = align === 'center' ? x - total / 2 : x;
  ctx.textAlign = 'left';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const pre = ctx.measureText(str.slice(0, i)).width;
    const cw = ctx.measureText(ch).width;
    const p = seg(t, t0 + i * stagger, t0 + i * stagger + dur);
    if (p <= 0 || ch === ' ') continue;
    const gx = ox + pre;
    if (p < 1) {
      const b = size * 0.62 * (1 - ease.inQuad(p)) + size * 0.1;
      ctx.fillStyle = palette[i % palette.length];
      const k = ease.outBack(clamp(p * 3));
      ctx.fillRect(gx + cw / 2 - (b * k) / 2, y - size * 0.36 - (b * k) / 2, b * k, b * k);
    }
    if (p > 0.45) {
      ctx.globalAlpha = seg(p, 0.45, 0.8);
      ctx.fillStyle = color;
      ctx.fillText(ch, gx, y);
      ctx.globalAlpha = 1;
    }
  }
  return total;
}

// Small editorial label (uppercase, tracked) — the "UI layer" of the storytelling reference.
export function label(ctx, str, x, y, o = {}) {
  const { size = 15, color = COL.white, alpha = 1, align = 'left', weight = 500, track = 3 } = o;
  setFont(ctx, size, weight, FT.sans);
  ctx.letterSpacing = track + 'px';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(str.toUpperCase(), x, y);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.letterSpacing = '0px';
}

// Corner brackets, crosshairs and running labels framing a shot.
export function frameMarks(ctx, t, o = {}) {
  const { color = COL.white, alpha = 0.55, idx = '', title = '', t0 = 0, inset = 56 } = o;
  const a = alpha * seg(t, t0, t0 + 0.3);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  const L = 22, m = inset;
  const corners = [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]];
  ctx.beginPath();
  for (const [x, y, sx, sy] of corners) { ctx.moveTo(x + sx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * L); }
  // crosshairs
  for (const [x, y] of [[W / 2, m - 10], [W / 2, H - m + 10]]) { ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9); }
  ctx.stroke();
  ctx.restore();
  if (idx) label(ctx, idx, m + 36, m + 6, { color, alpha: a, size: 13 });
  if (title) label(ctx, title, W - m - 36, m + 6, { color, alpha: a, size: 13, align: 'right' });
}

// ----------------------------------------------------------- hand-drawn ---
// Jitter a polyline with low-frequency noise; "boil" re-seeds it 8x a second like hand-drawn animation.
export function wobble(pts, { seed = 1, amp = 2.2, t = 0, boil = 8, freq = 0.012 } = {}) {
  const b = boil ? Math.floor(t * boil) : 0;
  return pts.map(([x, y], i) => [
    x + amp * noise2(x * freq + seed * 3.1 + b * 7.3, y * freq + i * 0.03),
    y + amp * noise2(y * freq + seed * 5.7 + b * 3.1, x * freq - i * 0.03),
  ]);
}

// Marker stroke: trimmed, wobbly, with a second faint pass for the ink texture.
export function stroke(ctx, pts, p, o = {}) {
  const { color = COL.white, width = 5, seed = 1, amp = 2.2, t = 0, from = 0, alpha = 1, boil = 8, double = true } = o;
  if (p <= from) return;
  const q = wobble(pts, { seed, amp, t, boil });
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  trim(ctx, q, from, p);
  if (double) {
    ctx.globalAlpha = alpha * 0.35;
    ctx.lineWidth = width * 0.55;
    trim(ctx, wobble(pts, { seed: seed + 9, amp: amp * 1.3, t, boil }), from, p * 0.985);
  }
  ctx.restore();
}

function trim(ctx, pts, a, b) {
  let L = 0;
  const seglen = [];
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seglen.push(l); L += l; }
  const A = a * L, B = b * L;
  ctx.beginPath();
  let acc = 0, started = false;
  for (let i = 1; i < pts.length; i++) {
    const l = seglen[i - 1];
    const s0 = acc, s1 = acc + l;
    acc = s1;
    if (s1 < A || s0 > B || l === 0) continue;
    const u0 = clamp((A - s0) / l), u1 = clamp((B - s0) / l);
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (!started) { ctx.moveTo(lerp(x0, x1, u0), lerp(y0, y1, u0)); started = true; }
    ctx.lineTo(lerp(x0, x1, u1), lerp(y0, y1, u1));
  }
  ctx.stroke();
}

export const pts = {
  line(x0, y0, x1, y1, n = 24) { return Array.from({ length: n + 1 }, (_, i) => [lerp(x0, x1, i / n), lerp(y0, y1, i / n)]); },
  // hand circle that overshoots its start (like a marker loop)
  loop(cx, cy, rx, ry, { turns = 1.12, start = -2.2, n = 90, tilt = -0.08 } = {}) {
    return Array.from({ length: n + 1 }, (_, i) => {
      const a = start + (i / n) * turns * TAU;
      const r = 1 + 0.05 * Math.sin(a * 2.3) + (i / n) * 0.06;
      const x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
      return [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)];
    });
  },
  // quadratic arc between two points (bend = sideways offset in px)
  arc(x0, y0, x1, y1, bend = 60, n = 40) {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const cx = mx - (dy / L) * bend, cy = my + (dx / L) * bend;
    return Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return [(1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1]; });
  },
  // zig-zag scribble across a box (crossing something out)
  scratch(x, y, w, h, n = 7) {
    const o = [];
    for (let i = 0; i <= n; i++) o.push([x + (i % 2 ? w : 0) + (i % 2 ? -1 : 1) * 6, y + (i / n) * h]);
    return o.flatMap((p, i) => (i ? pts.line(o[i - 1][0], o[i - 1][1], p[0], p[1], 8).slice(1) : [p]));
  },
  // underline swoosh
  swoosh(x, y, w, lift = 14) { return Array.from({ length: 41 }, (_, i) => { const u = i / 40; return [x + u * w, y - Math.sin(u * Math.PI) * lift * 0.4 + u * u * lift * -0.6 + 3]; }); },
};

// arrow = shaft + two head strokes
export function arrow(ctx, shaft, p, o = {}) {
  const { head = 22, color = COL.white, width = 5, seed = 1, t = 0 } = o;
  stroke(ctx, shaft, seg(p, 0, 0.75), { ...o, color, width, seed, t });
  const hp = seg(p, 0.7, 1);
  if (hp <= 0) return;
  const n = shaft.length;
  const [x1, y1] = shaft[n - 1], [x0, y0] = shaft[Math.max(0, n - 4)];
  const a = Math.atan2(y1 - y0, x1 - x0);
  for (const s of [-1, 1]) {
    const hx = x1 - head * Math.cos(a + s * 0.55), hy = y1 - head * Math.sin(a + s * 0.55);
    stroke(ctx, pts.line(x1, y1, hx, hy, 6), hp, { ...o, color, width, seed: seed + s * 3, t, double: false });
  }
}

// Handwritten note (Caveat), written on from left to right.
export function hand(ctx, str, x, y, p, o = {}) {
  const { size = 54, color = COL.white, rot = -0.06, weight = 700, align = 'left', alpha = 1 } = o;
  if (p <= 0) return 0;
  setFont(ctx, size, weight, FT.hand);
  const w = ctx.measureText(str).width;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const ox = align === 'center' ? -w / 2 : align === 'right' ? -w : 0;
  ctx.beginPath();
  ctx.rect(ox - 10, -size * 1.2, (w + 20) * ease.inOutSine(clamp(p)), size * 1.8);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(str, ox, 0);
  ctx.restore();
  return w;
}

// Highlighter swipe behind a word (rough edges).
export function highlight(ctx, x, y, w, h, p, color = COL.yellow, o = {}) {
  if (p <= 0) return;
  const { seed = 3, skew = -0.02, alpha = 1 } = o;
  const e = ease.outCubic(clamp(p));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  const N = 24, ww = w * e;
  for (let i = 0; i <= N; i++) { const u = i / N; ctx.lineTo(x + u * ww, y + 3 * noise2(u * 6, seed) + u * w * skew); }
  for (let i = N; i >= 0; i--) { const u = i / N; ctx.lineTo(x + u * ww, y + h + 4 * noise2(u * 5, seed + 4) + u * w * skew); }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- photos ---
// Draw an image to cover a rect (centre focus fx/fy in 0..1, extra zoom).
export function cover(ctx, img, x, y, w, h, { zoom = 1, fx = 0.5, fy = 0.5, alpha = 1 } = {}) {
  const s = Math.max(w / img.width, h / img.height) * zoom;
  const sw = w / s, sh = h / s;
  const sx = clamp(fx * img.width - sw / 2, 0, img.width - sw), sy = clamp(fy * img.height - sh / 2, 0, img.height - sh);
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.globalAlpha = 1;
}

// torn-paper outline around a rect (deterministic per seed)
function tornPath(ctx, x, y, w, h, seed, depth = 9, edges = [1, 1, 1, 1]) {
  ctx.beginPath();
  const side = (x0, y0, x1, y1, nx, ny, k, on) => {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.floor(L / 9));
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const d = on ? depth * (0.5 * hash1(seed * 31 + k * 977 + i) + 0.5 * (0.5 + 0.5 * noise2(i * 0.15, seed + k))) : 0;
      ctx.lineTo(lerp(x0, x1, u) + nx * d, lerp(y0, y1, u) + ny * d);
    }
  };
  side(x, y, x + w, y, 0, 1, 0, edges[0]);
  side(x + w, y, x + w, y + h, -1, 0, 1, edges[1]);
  side(x + w, y + h, x, y + h, 0, -1, 2, edges[2]);
  side(x, y + h, x, y, 1, 0, 3, edges[3]);
  ctx.closePath();
}

// Photo card: white border, optional torn edges, soft shadow, rotation. (cx, cy) is the centre.
export function photo(ctx, img, cx, cy, w, h, o = {}) {
  const { rot = 0, border = 14, torn = false, seed = 1, shadow = 0.35, zoom = 1, fx = 0.5, fy = 0.5, scale = 1, alpha = 1, tint = null, edges = [1, 1, 1, 1] } = o;
  if (alpha <= 0 || scale <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  const x = -w / 2, y = -h / 2;
  if (shadow > 0) {
    ctx.fillStyle = `rgba(0,0,0,${shadow * 0.55})`;
    ctx.filter = 'blur(14px)';
    ctx.fillRect(x - border + 10, y - border + 18, w + border * 2, h + border * 2);
    ctx.filter = 'none';
  }
  if (border > 0) {
    ctx.fillStyle = '#FBFAF6';
    if (torn) { tornPath(ctx, x - border, y - border, w + border * 2, h + border * 2, seed, 8, edges); ctx.fill(); }
    else ctx.fillRect(x - border, y - border, w + border * 2, h + border * 2);
  }
  ctx.save();
  if (torn && !border) { tornPath(ctx, x, y, w, h, seed, 10, edges); ctx.clip(); }
  else { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); }
  cover(ctx, img, x, y, w, h, { zoom, fx, fy });
  if (tint) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = tint; ctx.fillRect(x, y, w, h); }
  ctx.restore();
  ctx.restore();
}

// ------------------------------------------------------------ pixel icons ---
// The three service icons of assecor.de are built from square blocks; here every block can fly.
// mode: blocks start scattered (dist px) and spring into place, staggered by distance from the centre.
export function pixelIcon(ctx, name, cx, cy, size, t, t0, o = {}) {
  const { dist = 420, dur = 0.55, stagger = 0.03, map = null, alpha = 1, out = 1e9, outDur = 0.4, seed = 1, spin = 1 } = o;
  const k = size / 464;
  const blocks = PIXEL[name];
  ctx.save();
  ctx.globalAlpha = alpha;
  blocks.forEach((b, i) => {
    const t1 = t0 + i * stagger;
    const p = clamp((t - t1) / dur);
    const po = clamp((t - out - i * 0.02) / outDur);
    if (p <= 0 || po >= 1) return;
    const e = 1 - Math.pow(1 - p, 3) * Math.cos(p * 5.5) * 0.9 - (p < 1 ? 0 : 0); // springy settle
    const a = hash1(i * 13.7 + seed) * TAU, d = dist * (0.6 + 0.6 * hash1(i * 3.3 + seed));
    const ex = ease.inBack(po);
    const ox = Math.cos(a) * d * ((1 - e) + ex * 1.4), oy = Math.sin(a) * d * ((1 - e) + ex * 1.4);
    const rot = (b.rot || 0) * Math.PI / 180;
    ctx.save();
    ctx.translate(cx - size / 2 + ox, cy - size / 2 + oy);
    ctx.scale(k, k);
    if (b.rot !== undefined) { ctx.translate(b.ox, b.oy); ctx.rotate(rot); ctx.translate(-b.ox, -b.oy); }
    const bx = b.x + b.w / 2, by = b.y + b.h / 2;
    ctx.translate(bx, by);
    ctx.rotate(spin * (1 - e) * (hash1(i * 7.1 + seed) - 0.5) * 2.5);
    const s = Math.max(0, 1 - ex);
    ctx.scale(s, s);
    ctx.fillStyle = map?.[b.fill] ?? (b.fill === 'white' ? '#FFFFFF' : b.fill);
    ctx.fillRect(-b.w / 2 - 0.5, -b.h / 2 - 0.5, b.w + 1, b.h + 1);
    ctx.restore();
  });
  ctx.restore();
}

// ------------------------------------------------------------- line icons ---
// White line icons of assecor.de (viewBox 140), drawn on stroke by stroke.
const P2D = new Map();
const path2d = (d) => { let p = P2D.get(d); if (!p) { p = new Path2D(d); P2D.set(d, p); } return p; };
export function lineIcon(ctx, name, cx, cy, size, p, o = {}) {
  const { color = COL.white, width = 4, stagger = 0.5, alpha = 1, accent = null } = o;
  if (p <= 0) return;
  const els = LINE[name];
  const k = size / 140;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(k, k);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const n = els.length;
  els.forEach((e, i) => {
    // element i draws during [i/n * stagger, i/n * stagger + (1 - stagger)]
    const a = (i / n) * stagger;
    const q = clamp((p - a) / (1 - stagger));
    if (q <= 0) return;
    ctx.save();
    if (e.tr) { const [tx, ty] = e.tr.match(/-?[\d.]+/g).map(Number); ctx.translate(tx, ty); }
    const col = accent && accent(i) ? accent(i) : color;
    if (e.sw) {
      const L = pathLen.get(e.d) || 400;
      ctx.strokeStyle = col;
      ctx.lineWidth = (e.sw / 4) * width;
      ctx.setLineDash([L, L + 1]);
      ctx.lineDashOffset = L * (1 - ease.inOutCubic(q));
      ctx.stroke(path2d(e.d));
    } else {
      ctx.globalAlpha = alpha * ease.outCubic(q);
      ctx.fillStyle = col;
      ctx.fill(path2d(e.d));
    }
    ctx.restore();
  });
  ctx.restore();
}

// ------------------------------------------------------------------- logo ---
// The assecor wordmark; letters rise out of their own masks in sequence.
export function logo(ctx, cx, cy, width, t, t0, o = {}) {
  const { color = COL.white, stagger = 0.06, dur = 0.6, alpha = 1 } = o;
  const k = width / LOGO.w;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx - width / 2, cy - (LOGO.h * k) / 2);
  ctx.scale(k, k);
  ctx.fillStyle = color;
  LOGO.paths.forEach((e, i) => {
    const p = ease.outExpo(clamp((t - t0 - i * stagger) / dur));
    if (p <= 0) return;
    const b = logoBoxes[i] || { x: 0, y: 0, w: LOGO.w, h: LOGO.h };
    ctx.save();
    ctx.beginPath();
    ctx.rect(b.x - 2, -2, b.w + 4, LOGO.h + 4);
    ctx.clip();
    ctx.translate(0, (1 - p) * LOGO.h * 1.2);
    if (e.tr) { const [tx, ty] = e.tr.match(/-?[\d.]+/g).map(Number); ctx.translate(tx, ty); }
    ctx.fill(path2d(e.d));
    ctx.restore();
  });
  ctx.restore();
}
export const logoBox = (i) => logoBoxes[i];

// -------------------------------------------------------------- blocks ---
// Brand "stage" blocks (as in the homepage hero): solid rectangles that slide in from an edge.
export function block(ctx, x, y, w, h, color, p, dir = 'left') {
  if (p <= 0) return;
  const e = ease.outExpo(clamp(p));
  ctx.fillStyle = color;
  if (dir === 'left') ctx.fillRect(x, y, w * e, h);
  else if (dir === 'right') ctx.fillRect(x + w * (1 - e), y, w * e, h);
  else if (dir === 'up') ctx.fillRect(x, y + h * (1 - e), w, h * e);
  else ctx.fillRect(x, y, w, h * e);
}

// grid wipe: square cells (size px) pop in by a diagonal wave; colour per cell from palette
export function cellWipe(ctx, t, t0, dur, o = {}) {
  const { size = 120, palette = [COL.navy], dir = 1, out = false, seed = 2 } = o;
  const cols = Math.ceil(W / size) + 1, rows = Math.ceil(H / size) + 1;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const d = (dir > 0 ? i + j * 0.6 : cols - i + j * 0.6) / (cols + rows * 0.6);
    const jitter = hash1(i * 31 + j * 17 + seed) * 0.12;
    let p = clamp((t - t0 - (d * 0.75 + jitter) * dur) / (dur * 0.25));
    if (out) p = 1 - p;
    if (p <= 0) continue;
    const s = size * ease.outCubic(p);
    ctx.fillStyle = palette[Math.floor(hash1(i * 7 + j * 13 + seed) * palette.length)];
    ctx.fillRect(i * size + (size - s) / 2, j * size + (size - s) / 2, s + 0.5, s + 0.5);
  }
}

// VHS-style horizontal tearing of what has been drawn so far (used on glitch accents).
export function vhsTear(ctx, amount, seed = 1) {
  if (amount <= 0) return;
  const n = 7;
  for (let i = 0; i < n; i++) {
    const y = Math.floor(hash1(seed * 13 + i * 7.7) * H);
    const h = 6 + Math.floor(hash1(seed * 3 + i) * 70);
    const dx = (hash1(seed * 5 + i * 3.1) - 0.5) * 120 * amount;
    ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h);
  }
}

// dust / hair specks of the analog look (deterministic per frame)
export function dust(ctx, frame, o = {}) {
  const { n = 5, dark = true } = o;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const r = hash1(frame * 17.3 + i * 91.1);
    if (r > 0.55) continue;
    const x = hash1(frame * 3.1 + i * 7.9) * W, y = hash1(frame * 5.7 + i * 2.3) * H;
    const s = 1 + hash1(frame + i * 11) * 3.5;
    ctx.fillStyle = (dark ? (i % 2 ? 'rgba(10,10,10,0.5)' : 'rgba(255,255,255,0.55)') : 'rgba(255,255,255,0.5)');
    ctx.beginPath();
    ctx.ellipse(x, y, s, s * (0.5 + hash1(i + frame) * 0.8), hash1(i * 3 + frame) * 3, 0, TAU);
    ctx.fill();
    if (r < 0.06) { // a hair
      ctx.strokeStyle = 'rgba(20,20,20,0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 30, y + 20 * (r * 10 - 0.3), x + 60, y - 10);
      ctx.stroke();
    }
  }
  ctx.restore();
}
