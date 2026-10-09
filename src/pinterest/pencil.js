// Colored-pencil renderer. Shapes are polygons; fills are hatched with short, slightly bowed strokes
// (scanline-clipped, so the edges stay ragged like real pencil), shadows are cross-hatched in a second
// colour, outlines are broken into several lifted strokes, and a paper-tooth texture eats into the
// pigment. Everything is seeded: the same `boil` index always produces the same drawing, so the
// drawing "boils" (re-draws itself) at a fixed rate, like hand-drawn animation on threes.
import { TAU, clamp, lerp, noise3, rng } from '../engine/core.js';

// ------------------------------------------------------------- colour ---
export function rgb(c) {
  if (Array.isArray(c)) return c;
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const shadeOf = (c, k) => { const v = rgb(c); return k >= 0 ? v.map((x) => x + (255 - x) * k) : v.map((x) => x * (1 + k)); };
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

// ----------------------------------------------------------- geometry ---
export function ellipse(cx, cy, rx, ry = rx, rot = 0, n = 0) {
  n = n || Math.max(16, Math.round((rx + ry) * 0.35));
  const c = Math.cos(rot), s = Math.sin(rot), out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return out;
}
// Tapered capsule from (x0,y0) radius r0 to (x1,y1) radius r1.
export function capsule(x0, y0, x1, y1, r0, r1 = r0, n = 10) {
  const a = Math.atan2(y1 - y0, x1 - x0), out = [];
  for (let i = 0; i <= n; i++) { const t = a + Math.PI / 2 + (i / n) * Math.PI; out.push([x0 + Math.cos(t) * r0, y0 + Math.sin(t) * r0]); }
  for (let i = 0; i <= n; i++) { const t = a - Math.PI / 2 + (i / n) * Math.PI; out.push([x1 + Math.cos(t) * r1, y1 + Math.sin(t) * r1]); }
  return out;
}
export function rrect(x, y, w, h, r, n = 6) {
  r = Math.min(r, w / 2, h / 2);
  const out = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (Math.PI / 2); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(x + w - r, y + r, -Math.PI / 2);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2);
  corner(x + r, y + r, Math.PI);
  return out;
}
export function blob(cx, cy, r, seed = 1, amp = 0.12, n = 40, sy = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k = 1 + amp * noise3(Math.cos(a) * 1.3 + seed, Math.sin(a) * 1.3, seed * 0.37);
    out.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k * sy]);
  }
  return out;
}
// Catmull-Rom resampling of a control polygon into a smooth dense polyline.
export function smooth(pts, closed = true, per = 8) {
  const n = pts.length, out = [];
  const P = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
export const xf = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
export const mmul = (a, b) => [
  a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
];
export const mat = (x = 0, y = 0, rot = 0, sx = 1, sy = sx) => {
  const c = Math.cos(rot), s = Math.sin(rot);
  return [c * sx, s * sx, -s * sy, c * sy, x, y];
};
export const I = [1, 0, 0, 1, 0, 0];

// ------------------------------------------------------------- layers ---
const pools = new Map();
function layerFor(w, h) {
  const k = w + 'x' + h;
  let L = pools.get(k);
  if (!L) {
    const c = new OffscreenCanvas(w, h);
    L = { c, g: c.getContext('2d', { willReadFrequently: true }), w, h };
    pools.set(k, L);
  }
  return L;
}

let grainTex = null;
// Periodic paper tooth: white noise blurred with wrap-around at two scales, then contrast-shaped.
function grain() {
  if (grainTex) return grainTex;
  const S = 512, N = S * S;
  const r = rng(4242);
  const wn = new Float32Array(N);
  for (let i = 0; i < N; i++) wn[i] = r();
  const blur = (src, rad, sx = 1, sy = 1) => {
    let a = src, b = new Float32Array(N);
    for (const [dx, dy, rr] of [[1, 0, Math.round(rad * sx)], [0, 1, Math.round(rad * sy)]]) {
      if (rr < 1) continue;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        let acc = 0;
        for (let k = -rr; k <= rr; k++) acc += a[(((y + dy * k) + S) % S) * S + (((x + dx * k) + S) % S)];
        b[y * S + x] = acc / (2 * rr + 1);
      }
      [a, b] = [b, new Float32Array(N)];
    }
    return a;
  };
  const fine = blur(wn, 1, 1.6, 1);
  const coarse = blur(blur(wn, 5), 5);
  let mn = Infinity, mx = -Infinity;
  const v = new Float32Array(N);
  for (let i = 0; i < N; i++) { v[i] = fine[i] + (coarse[i] - 0.5) * 1.3; if (v[i] < mn) mn = v[i]; if (v[i] > mx) mx = v[i]; }
  const c = new OffscreenCanvas(S, S), g = c.getContext('2d', { willReadFrequently: true });
  const img = g.createImageData(S, S), d = img.data;
  for (let i = 0; i < N; i++) {
    const n = (v[i] - mn) / (mx - mn);
    const a = clamp((n - 0.42) * 3.2);
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255;
    d[i * 4 + 3] = a * 255;
  }
  g.putImageData(img, 0, 0);
  grainTex = c;
  return c;
}

// ------------------------------------------------------------ hatching ---
// Scanline intervals of a polygon along direction angle `ang`; yields [o, a, b] in rotated space.
function hatchLines(pts, ang, gap, r, jit = 0.25) {
  const c = Math.cos(ang), s = Math.sin(ang);
  // rotate into hatch space: u along stroke, v across
  const R = pts.map(([x, y]) => [x * c + y * s, -x * s + y * c]);
  let vmin = Infinity, vmax = -Infinity;
  for (const p of R) { if (p[1] < vmin) vmin = p[1]; if (p[1] > vmax) vmax = p[1]; }
  const lines = [];
  const n = R.length;
  for (let v = vmin + gap * r() * 0.8; v < vmax; v += gap * (1 - jit + 2 * jit * r())) {
    const xs = [];
    for (let i = 0; i < n; i++) {
      const p = R[i], q = R[(i + 1) % n];
      if ((p[1] <= v && q[1] > v) || (q[1] <= v && p[1] > v)) xs.push(p[0] + ((v - p[1]) / (q[1] - p[1])) * (q[0] - p[0]));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) lines.push([v, xs[i], xs[i + 1]]);
  }
  return { lines, c, s };
}

// Bucketed stroke batches to keep canvas state changes low.
function makeBuckets() { return new Map(); }
function bucketPush(B, key, seg) { let a = B.get(key); if (!a) B.set(key, (a = [])); a.push(seg); }
function flushBuckets(g, B) {
  for (const [key, segs] of B) {
    const [col, alpha, lw] = key.split('|');
    g.strokeStyle = col;
    g.globalAlpha = +alpha;
    g.lineWidth = +lw;
    g.beginPath();
    for (const s of segs) {
      g.moveTo(s[0], s[1]);
      if (s.length === 6) g.quadraticCurveTo(s[2], s[3], s[4], s[5]);
      else g.lineTo(s[2], s[3]);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
}

const ALPHAS = [0.42, 0.66, 0.9];

// Hatch-fill a polygon. weight(x,y) -> 0..1 scales pressure (used for shading/highlights).
function hatch(B, pts, o, r, cols, { ang, gap, len = [22, 60], lw = 2, pressure = 1, weight = null, reveal = 1, revealDir = 0, bow = 0.3, overshoot = 3 }) {
  const { lines, c, s } = hatchLines(pts, ang, gap, r);
  if (!lines.length) return;
  const vmin = lines[0][0], vmax = lines[lines.length - 1][0];
  const toW = (u, v) => [u * c - v * s, u * s + v * c];
  for (const [v, a0, b0] of lines) {
    const a = a0 - overshoot * r(), b = b0 + overshoot * r();
    let u = a - r() * 6;
    while (u < b) {
      const L = lerp(len[0], len[1], r());
      const u1 = Math.min(b + overshoot * r(), u + L);
      const vv = v + (r() - 0.5) * gap * 0.35;
      const tilt = (r() - 0.5) * gap * 0.8;
      const p0 = toW(u, vv - tilt * 0.5), p1 = toW(u1, vv + tilt * 0.5);
      const mid = toW((u + u1) / 2, vv + (r() - 0.5) * gap * bow * 2);
      let w = pressure;
      if (weight) w *= weight((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
      // reveal: sweep across the shape (revealDir 0 = along v, 1 = along u)
      if (reveal < 1) {
        const f = revealDir ? (u - a) / Math.max(1, b - a) * 0.25 + (v - vmin) / Math.max(1, vmax - vmin) * 0.75 : (v - vmin) / Math.max(1, vmax - vmin);
        if (f + (r() - 0.5) * 0.08 > reveal * 1.08) { u = u1 - 2; continue; }
      }
      if (w > 0.04) {
        const ai = clamp(Math.floor((w * (0.55 + r() * 0.7)) * 3), 0, 2);
        const col = cols[(r() * cols.length) | 0];
        const lwq = (lw * (0.8 + r() * 0.45)).toFixed(1);
        bucketPush(B, col + '|' + ALPHAS[ai] + '|' + lwq, [p0[0], p0[1], mid[0], mid[1], p1[0], p1[1]]);
      }
      u = u1 - 2 - r() * 4;
    }
  }
}

// Broken pencil outline: several lifted strokes with jitter, plus a lighter second pass.
function outline(g, pts, closed, col, lw, r, seed, boil, reveal = 1, amp = 1.1) {
  const n = pts.length;
  if (n < 2) return;
  const P = closed ? [...pts, pts[0]] : pts;
  const cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const T = cum[cum.length - 1];
  if (T < 1) return;
  const end = T * reveal;
  const at = (d) => {
    let lo = 1, hi = cum.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < d) lo = m + 1; else hi = m; }
    const i = lo;
    const t = clamp((d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]));
    const x = lerp(P[i - 1][0], P[i][0], t), y = lerp(P[i - 1][1], P[i][1], t);
    const dx = P[i][0] - P[i - 1][0], dy = P[i][1] - P[i - 1][1], l = Math.hypot(dx, dy) || 1;
    return [x, y, -dy / l, dx / l];
  };
  const step = 5;
  for (let pass = 0; pass < 2; pass++) {
    const w = pass ? lw * 0.55 : lw;
    const alphaBase = pass ? 0.45 : 0.85;
    let d = closed ? -r() * 30 : 0;
    while (d < end) {
      const L = closed ? lerp(70, 220, r()) : T + 10;
      const d0 = d, d1 = Math.min(end, d + L);
      const ox = (r() - 0.5) * 2.2 * amp, oy = (r() - 0.5) * 2.2 * amp;
      g.strokeStyle = col;
      g.lineWidth = w * (0.85 + r() * 0.3);
      // three alpha zones give a pencil taper at both ends of each lifted stroke
      const zones = [[d0, d0 + 10, 0.5], [d0 + 8, d1 - 8, 1], [d1 - 10, d1, 0.5]];
      for (const [z0, z1, za] of zones) {
        if (z1 <= z0) continue;
        g.globalAlpha = alphaBase * za * (0.8 + r() * 0.2);
        g.beginPath();
        for (let q = z0; q <= z1 + 0.01; q += step) {
          const dd = ((q % T) + T) % T;
          const [x, y, nx, ny] = at(closed ? dd : clamp(q, 0, T));
          const j = noise3(q * 0.012, seed * 1.7 + pass * 3, boil * 0.91) * 2.0 * amp;
          const X = x + nx * j + ox, Y = y + ny * j + oy;
          if (q === z0) g.moveTo(X, Y); else g.lineTo(X, Y);
        }
        g.stroke();
      }
      d += L - 6 - r() * 10;
    }
  }
  g.globalAlpha = 1;
}

// ---------------------------------------------------------- the API ---
// item: { pts (local), m (affine), fill, shade, light:[x,y], ang, gap, line, lw, seed, reveal, solid, open,
//         pressure, gloss, noOcclude, stroke (open polyline only), dash }
// Returns the item's world-space bbox.
function worldPts(it) { return it.m ? it.pts.map((p) => xf(it.m, p)) : it.pts; }

function paintItem(g, it, boil, scale) {
  const seed = it.seed ?? 1;
  const r = rng((seed * 7919 + boil * 104729) >>> 0);
  const pts = it.wp;
  const reveal = it.reveal ?? 1;
  if (reveal <= 0) return;
  if (it.open) {
    outline(g, pts, false, css(rgb(it.line || it.fill)), (it.lw || 2.4) * scale, r, seed, boil, reveal, it.amp ?? 1);
    return;
  }
  if (!it.noOcclude && reveal >= 1) {
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.closePath();
    g.fill();
    g.globalCompositeOperation = 'source-over';
  }
  // bbox centre & radius for shading
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = Math.max(6, (x1 - x0) / 2), hh = Math.max(6, (y1 - y0) / 2);
  const lv = it.light || [-0.55, -0.83];
  const ll = Math.hypot(lv[0], lv[1]) || 1;
  const lx = lv[0] / ll, ly = lv[1] / ll;
  const flat = it.flat ?? 0;
  // form light: directional term + rim falloff (reads as volume rather than a planar gradient)
  const lit = (x, y) => {
    const ux = (x - cx) / hw, uy = (y - cy) / hh;
    const d = ux * lx + uy * ly, rho = ux * ux + uy * uy;
    return d * 0.85 - (1 - flat) * 0.4 * rho + 0.22;
  };
  const B = makeBuckets();
  const ang = it.ang ?? -1.05;
  const gap = (it.gap ?? 4.2) * scale;
  const lw = (it.hw ?? 2.3) * scale;
  if (it.fill) {
    const base = rgb(it.fill);
    const cols = [css(base), css(shadeOf(base, -0.08)), css(shadeOf(base, 0.12))];
    const gloss = it.gloss ?? 0.45;
    const press = it.pressure ?? 1;
    hatch(B, pts, it, r, cols, {
      ang, gap: it.solid ? gap * 0.55 : gap, lw, pressure: press, reveal,
      len: [18 * scale, 58 * scale],
      weight: (x, y) => 1 - gloss * clamp((lit(x, y) - 0.15) * 1.6),
    });
    if (it.solid) hatch(B, pts, it, r, cols, { ang: ang + 0.5, gap: gap * 0.8, lw, pressure: press, reveal, len: [18 * scale, 50 * scale] });
  }
  if (it.shade !== null && (it.shade || it.fill)) {
    const sc = rgb(it.shade || shadeOf(it.fill, -0.35));
    const cols = [css(sc), css(shadeOf(sc, -0.12))];
    const depth = it.shadeDepth ?? 0.15;
    hatch(B, pts, it, r, cols, {
      ang: ang + 0.8, gap: gap * 0.85, lw: lw * 0.9, reveal, len: [12 * scale, 34 * scale],
      weight: (x, y) => { const k = clamp((-lit(x, y) - depth + 0.25) / 0.9); return k * k * (3 - 2 * k) * (it.shadePressure ?? 1); },
    });
  }
  flushBuckets(g, B);
  if (it.line !== null) {
    const lc = it.line ? rgb(it.line) : shadeOf(it.fill || '#444444', -0.45);
    outline(g, pts, true, css(lc), (it.lw ?? 2.6) * scale, r, seed, boil, reveal, it.amp ?? 1);
  }
}

// Draw a list of items as one pencil drawing onto ctx.
// opts: boil (int), paper (fill silhouettes white first), grain (0..1), shadow {dx,dy,blur,alpha}, alpha
export function drawPencil(ctx, items, { boil = 0, paper = false, grain: grainAmt = 0.55, shadow = null, alpha = 1, scale = 1, pad = 16 } = {}) {
  const vis = items.filter((it) => it && (it.reveal ?? 1) > 0);
  if (!vis.length) return;
  const T = ctx.getTransform();
  // world points (ctx transform folded in so the layer is in device pixels)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const tm = [T.a, T.b, T.c, T.d, T.e, T.f];
  const devScale = Math.sqrt(Math.abs(T.a * T.d - T.b * T.c));
  for (const it of vis) {
    it.wp = worldPts(it).map((p) => xf(tm, p));
    for (const [x, y] of it.wp) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const cw = ctx.canvas.width, chh = ctx.canvas.height;
  x0 = Math.max(0, Math.floor(x0 - pad)); y0 = Math.max(0, Math.floor(y0 - pad));
  x1 = Math.min(cw, Math.ceil(x1 + pad)); y1 = Math.min(chh, Math.ceil(y1 + pad));
  if (x1 <= x0 || y1 <= y0) return;
  const L = layerFor(cw, chh);
  const g = L.g;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.clearRect(x0, y0, x1 - x0, y1 - y0);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const it of vis) paintItem(g, it, boil, (it.scale ?? scale) * devScale);
  // paper tooth eats into the pigment
  if (grainAmt > 0) {
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = grainAmt;
    g.fillStyle = L.pat || (L.pat = g.createPattern(grain(), 'repeat'));
    g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha *= alpha;
  if (paper || shadow) {
    // white paper cut-out underneath (only the silhouettes that ask for it)
    ctx.save();
    if (shadow) {
      ctx.shadowColor = `rgba(40,20,20,${shadow.alpha ?? 0.18})`;
      ctx.shadowBlur = shadow.blur ?? 30;
      ctx.shadowOffsetX = shadow.dx ?? 0;
      ctx.shadowOffsetY = shadow.dy ?? 14;
    }
    ctx.fillStyle = '#fff';
    for (const it of vis) {
      if (it.open || it.noPaper) continue;
      ctx.beginPath();
      it.wp.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(L.c, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
  ctx.restore();
}

// Boil index from the frame number: the drawing re-draws itself `fps` times per second.
export const boilAt = (t, fps = 8) => Math.floor(t * fps + 1e-6);

// Pencil palette (Buntstifte) — warm, slightly desaturated pigments.
export const PC = {
  red: '#E0303C', crimson: '#B81D2C', coral: '#F2775E', orange: '#F39A3B', ochre: '#D9A53F', yellow: '#F5D04A',
  lemon: '#F8E27A', lime: '#A9CF54', green: '#4F9A57', forest: '#2F6B48', mint: '#8FD3B6', teal: '#2E8C8C',
  sky: '#7CC0E8', blue: '#3D6FC0', navy: '#283A73', lilac: '#B79BDA', violet: '#7A57B5', pink: '#F4A3B8',
  rose: '#E36A8C', brown: '#8A5A3C', umber: '#5A3A28', tan: '#D9B48F', sand: '#EED9B8', peach: '#F6C3A0',
  grey: '#9A9AA2', graphite: '#4A4A52', ink: '#2A2630', cream: '#FBF3E2', white: '#FFFFFF',
  skin1: '#F3C9A6', skin2: '#D9A07A', skin3: '#A8704C', skin4: '#6E4430',
};

// Handwritten text in pencil: fillText into the layer, paper tooth, multiply onto the page.
// opts: font, color, align, reveal (0..1 left-to-right wipe), rot, boil, grain
export function pencilText(ctx, str, x, y, { font = '700 48px Caveat', color = PC.graphite, align = 'left', reveal = 1, rot = 0, boil = 0, grain: ga = 0.5, alpha = 1 } = {}) {
  if (reveal <= 0) return;
  const cw = ctx.canvas.width, chh = ctx.canvas.height;
  const L = layerFor(cw, chh), g = L.g;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.clearRect(0, 0, cw, chh);
  const T = ctx.getTransform();
  g.setTransform(T);
  const r = rng(boil * 31 + 7);
  g.translate(x + (r() - 0.5) * 1.2, y + (r() - 0.5) * 1.2);
  g.rotate(rot + (r() - 0.5) * 0.006);
  g.font = font;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  const m = g.measureText(str);
  const x0 = align === 'center' ? -m.width / 2 : align === 'right' ? -m.width : 0;
  if (reveal < 1) {
    g.save();
    g.beginPath();
    g.rect(x0 - 10, -m.actualBoundingBoxAscent - 30, (m.width + 20) * reveal + 10, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + 60);
    g.clip();
  }
  g.fillStyle = css(rgb(color));
  g.globalAlpha = 0.92;
  g.fillText(str, 0, 0);
  g.globalAlpha = 0.35;
  g.fillText(str, 0.8, 0.5);
  if (reveal < 1) g.restore();
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (ga > 0) {
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = ga;
    g.fillStyle = L.pat || (L.pat = g.createPattern(grain(), 'repeat'));
    g.fillRect(0, 0, cw, chh);
  }
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha *= alpha;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(L.c, 0, 0);
  ctx.restore();
}
