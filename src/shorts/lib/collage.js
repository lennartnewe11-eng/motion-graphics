// Collage toolkit for the explainer shorts: archive images as paper material that moves like film.
// Everything is a pure function of time (any frame renders in any order), all randomness is seeded.
import { TAU, clamp, lerp, ease, noise3, rng, rgba } from '../../engine/core.js';

export const SW = 1080;
export const SH = 1920;

// ---------------------------------------------------------------- palette ---
export const P = {
  paper: [239, 234, 224],
  paper2: [230, 223, 209],
  card: [246, 242, 233],
  ink: [22, 19, 17],
  ink2: [58, 52, 46],
  grey: [140, 132, 122],
};

// ----------------------------------------------------------------- assets ---
const images = new Map();
const shadows = new Map();
export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}
export async function loadImages(map) {
  await Promise.all(Object.entries(map).map(([k, url]) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => { images.set(k, im); res(); };
    im.onerror = () => rej(new Error('image ' + url));
    im.src = url;
  })));
}
export const img = (k) => {
  const i = images.get(k);
  if (!i) throw new Error('missing image ' + k);
  return i;
};

// Soft contact shadow of a cut-out, rendered once (software canvases hate per-frame shadowBlur).
function shadowOf(k, blur = 10) {
  const key = k + '|' + blur;
  let s = shadows.get(key);
  if (s) return s;
  const im = img(k);
  const pad = blur * 3;
  s = canvas(im.width + pad * 2, im.height + pad * 2);
  const c = s.getContext('2d');
  c.filter = `blur(${blur}px)`;
  c.drawImage(im, pad, pad);
  c.filter = 'none';
  c.globalCompositeOperation = 'source-in';
  c.fillStyle = 'rgb(30,22,14)';
  c.fillRect(0, 0, s.width, s.height);
  s.pad = pad;
  shadows.set(key, s);
  return s;
}

// --------------------------------------------------------------- textures ---
let paperTex = null;
let fibreTex = null;
export function paperTexture() {
  if (paperTex) return paperTex;
  paperTex = canvas(SW, SH);
  const c = paperTex.getContext('2d');
  // low-frequency mottling, built at 1/8 resolution and smoothly upscaled
  const lw = SW / 8, lh = SH / 8;
  const low = canvas(lw, lh);
  const lc = low.getContext('2d');
  const id = lc.createImageData(lw, lh);
  for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
    const n = noise3(x * 0.035, y * 0.035, 3.1) * 0.6 + noise3(x * 0.11, y * 0.11, 7.7) * 0.4;
    const v = 1 + n * 0.035;
    const i = (y * lw + x) * 4;
    id.data[i] = P.paper[0] * v; id.data[i + 1] = P.paper[1] * v; id.data[i + 2] = P.paper[2] * v * 0.995; id.data[i + 3] = 255;
  }
  lc.putImageData(id, 0, 0);
  c.imageSmoothingQuality = 'high';
  c.drawImage(low, 0, 0, SW, SH);
  // fibres + specks
  const r = rng(77);
  for (let i = 0; i < 2600; i++) {
    const x = r() * SW, y = r() * SH, a = r() * TAU, l = 4 + r() * 22;
    c.strokeStyle = r() < 0.5 ? 'rgba(120,100,80,0.07)' : 'rgba(255,255,250,0.18)';
    c.lineWidth = 0.6 + r() * 0.8;
    c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  for (let i = 0; i < 900; i++) {
    c.fillStyle = `rgba(70,55,40,${0.05 + r() * 0.12})`;
    c.fillRect(r() * SW, r() * SH, 1 + r() * 1.6, 1 + r() * 1.6);
  }
  return paperTex;
}
// a fibre overlay that sits on top of everything (prints and stickers get paper tooth too)
export function fibreTexture() {
  if (fibreTex) return fibreTex;
  fibreTex = canvas(SW, SH);
  const c = fibreTex.getContext('2d');
  const r = rng(91);
  for (let i = 0; i < 1600; i++) {
    const x = r() * SW, y = r() * SH, a = r() * TAU, l = 3 + r() * 16;
    c.strokeStyle = `rgba(255,252,244,${0.05 + r() * 0.08})`;
    c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  return fibreTex;
}

export function bg(ctx, col = P.paper, tex = true) {
  ctx.fillStyle = rgba(col);
  ctx.fillRect(-4000, -4000, 9000, 9000);
  if (tex && col === P.paper) ctx.drawImage(paperTexture(), 0, 0);
}

// ----------------------------------------------------------------- camera ---
// cam = { x, y, z, r } : looks at (x, y) of the scene, zoom z, roll r. Micro-drift is always on.
export function camera(ctx, t, cam = {}, drift = 1, seed = 1) {
  const { x = SW / 2, y = SH / 2, z = 1, r = 0 } = cam;
  const dx = noise3(t * 0.31, seed, 0.2) * 9 * drift;
  const dy = noise3(t * 0.27, seed, 5.1) * 12 * drift;
  const dr = noise3(t * 0.21, seed, 9.7) * 0.006 * drift;
  ctx.translate(SW / 2, SH / 2);
  ctx.rotate(r + dr);
  ctx.scale(z, z);
  ctx.translate(-x + dx, -y + dy);
}
// trauma-style shake (decays), deterministic
export function shake(t, t0, amp = 30, dur = 0.6, f = 23) {
  const k = clamp((t - t0) / dur);
  if (k <= 0 || k >= 1) return [0, 0, 0];
  const a = amp * Math.pow(1 - k, 2);
  return [noise3(t * f, 1.3, t0) * a, noise3(t * f, 7.9, t0) * a, noise3(t * f, 4.4, t0) * a * 0.0016];
}
// stepped time: animation "on twos/threes" (handmade feel for cut-outs)
export const onTwos = (t, fps = 12) => Math.floor(t * fps) / fps;

// --------------------------------------------------------------- stickers ---
// Cut-out with paper edge (baked into the PNG) and a contact shadow. lift: 0 = flat on paper, 1 = held up.
export function sticker(ctx, k, x, y, o = {}) {
  const { s = 1, rot = 0, ax = 0.5, ay = 1, alpha = 1, lift = 0.25, flip = false, sx = 1, sy = 1, shadow = true, filter = null } = o;
  const im = img(k);
  const w = im.width, h = im.height;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s * sx * (flip ? -1 : 1), s * sy);
  ctx.globalAlpha *= alpha;
  if (shadow && lift > 0) {
    const sh = shadowOf(k, 8);
    ctx.save();
    ctx.globalAlpha *= 0.25 + 0.2 * lift;
    const off = 6 + lift * 26;
    ctx.translate(off * 0.45 / s, off / s);
    ctx.drawImage(sh, -ax * w - sh.pad, -ay * h - sh.pad);
    ctx.restore();
  }
  if (filter) ctx.filter = filter;
  ctx.drawImage(im, -ax * w, -ay * h);
  ctx.restore();
}

// ----------------------------------------------------------- torn paper ---
// Jagged outline of a w*h rectangle (torn on the chosen sides), cached per seed.
const tornCache = new Map();
export function tornPath(w, h, seed = 1, { sides = 'trbl', amp = 7, step = 9 } = {}) {
  const key = [w | 0, h | 0, seed, sides, amp, step].join('|');
  let pts = tornCache.get(key);
  if (!pts) {
    const r = rng(seed);
    pts = [];
    const edge = (x0, y0, x1, y1, torn) => {
      const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / step));
      const nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let i = 0; i < n; i++) {
        const u = i / n;
        const j = torn ? (r() - 0.5) * amp + noise3(u * 6, seed, 2) * amp * 0.9 : 0;
        pts.push([lerp(x0, x1, u) + nx * j, lerp(y0, y1, u) + ny * j]);
      }
    };
    edge(0, 0, w, 0, sides.includes('t'));
    edge(w, 0, w, h, sides.includes('r'));
    edge(w, h, 0, h, sides.includes('b'));
    edge(0, h, 0, 0, sides.includes('l'));
    tornCache.set(key, pts);
  }
  return pts;
}
export function pathPts(ctx, pts, ox = 0, oy = 0) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0] + ox, pts[0][1] + oy);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + ox, pts[i][1] + oy);
  ctx.closePath();
}

// Blurred shadow of a torn shape, rendered once per (size, seed, blur) and reused every frame.
const tornShadows = new Map();
export function tornShadow(w, h, seed, sides, amp, blur) {
  const key = [w | 0, h | 0, seed, sides, amp, Math.round(blur)].join('|');
  let c = tornShadows.get(key);
  if (c) return c;
  const pad = Math.ceil(blur * 2.5) + 4;
  c = canvas(w + pad * 2, h + pad * 2);
  const x = c.getContext('2d');
  x.filter = `blur(${Math.round(blur)}px)`;
  x.fillStyle = 'rgb(30,22,14)';
  pathPts(x, tornPath(w, h, seed, { sides, amp }), pad, pad);
  x.fill();
  c.pad = pad;
  if (tornShadows.size > 400) tornShadows.clear();
  tornShadows.set(key, c);
  return c;
}

// ------------------------------------------------------------------ prints ---
// A photo print: paper card (white border, torn or cut edge) + toned photo, with an inner camera
// (pan/zoom inside the frame, so the archive image itself keeps moving).
// o: { w, h, rot, border, torn, seed, lift, crop:[sx,sy,sw,sh], inner:{x,y,z} (0..1 focus + zoom), alpha, ax, ay }
export function print(ctx, k, x, y, o = {}) {
  const im = img(k);
  const { w = 600, rot = 0, border = 18, torn = 'trbl', seed = 3, lift = 0.4, alpha = 1, ax = 0.5, ay = 0.5, card = P.card, shadow = true, after = null } = o;
  const crop = o.crop || [0, 0, im.width, im.height];
  const h = o.h ?? (w - 2 * border) * (crop[3] / crop[2]) + 2 * border;
  const inner = o.inner || { x: 0.5, y: 0.5, z: 1 };
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha *= alpha;
  ctx.translate(-ax * w, -ay * h);
  const amp = border > 6 ? 7 : 4;
  const pts = tornPath(w, h, seed, { sides: torn, amp });
  if (shadow) {
    const sh = tornShadow(w, h, seed, torn, amp, 6 + Math.round(lift * 4) * 2.5);
    ctx.save();
    ctx.globalAlpha *= 0.18 + 0.16 * lift;
    ctx.drawImage(sh, 5 + lift * 10 - sh.pad, 8 + lift * 22 - sh.pad);
    ctx.restore();
  }
  ctx.fillStyle = rgba(card);
  pathPts(ctx, pts);
  ctx.fill();
  // photo area
  const pw = w - 2 * border, ph = h - 2 * border;
  ctx.save();
  if (border > 0) { ctx.beginPath(); ctx.rect(border, border, pw, ph); } else pathPts(ctx, pts);
  ctx.clip();
  // inner camera: crop window scaled by z around focus
  const z = inner.z || 1;
  const cw = crop[2] / z, ch = crop[3] / z;
  const cx = clamp(crop[0] + inner.x * crop[2] - cw / 2, crop[0], crop[0] + crop[2] - cw);
  const cy = clamp(crop[1] + inner.y * crop[3] - ch / 2, crop[1], crop[1] + crop[3] - ch);
  ctx.drawImage(im, cx, cy, cw, ch, border, border, pw, ph);
  if (after) after(ctx, { x: border, y: border, w: pw, h: ph, sx: pw / cw, sy: ph / ch, cx, cy });
  ctx.restore();
  ctx.restore();
  return { w, h };
}

// Full-bleed plate (no card): covers the frame, with its own pan/zoom. Returns the mapping image->screen.
export function plate(ctx, k, { x = 0.5, y = 0.5, z = 1, crop = null, dx = 0, dy = 0, alpha = 1 } = {}) {
  const im = img(k);
  const c = crop || [0, 0, im.width, im.height];
  const sc = Math.max(SW / c[2], SH / c[3]) * z;
  const vw = SW / sc, vh = SH / sc;
  const sx = clamp(c[0] + x * c[2] - vw / 2, c[0], c[0] + c[2] - vw);
  const sy = clamp(c[1] + y * c[3] - vh / 2, c[1], c[1] + c[3] - vh);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(im, sx, sy, vw, vh, dx, dy, SW, SH);
  ctx.restore();
  return { sc, sx, sy, map: (px, py) => [(px - sx) * sc + dx, (py - sy) * sc + dy] };
}

// ------------------------------------------------------------ hand layer ---
// Hand-drawn stroke: polyline with wobble, revealed by p (0..1), boiling on twos.
export function handStroke(ctx, pts, p, { width = 6, color = P.ink, t = 0, seed = 1, boil = 1.2 } = {}) {
  if (p <= 0) return;
  const tb = Math.floor(t * 8);
  const q = pts.map(([x, y], i) => [x + noise3(i * 0.7, tb * 0.9, seed) * boil, y + noise3(i * 0.7, tb * 0.9, seed + 4) * boil]);
  let L = 0; const seg = [];
  for (let i = 1; i < q.length; i++) { const l = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); seg.push(l); L += l; }
  const target = L * clamp(p);
  ctx.save();
  ctx.strokeStyle = rgba(color);
  ctx.lineWidth = width;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(q[0][0], q[0][1]);
  let acc = 0;
  for (let i = 1; i < q.length; i++) {
    if (acc + seg[i - 1] >= target) {
      const u = (target - acc) / seg[i - 1];
      ctx.lineTo(lerp(q[i - 1][0], q[i][0], u), lerp(q[i - 1][1], q[i][1], u));
      break;
    }
    ctx.lineTo(q[i][0], q[i][1]);
    acc += seg[i - 1];
  }
  ctx.stroke();
  ctx.restore();
}
// loose hand-drawn ellipse (overshooting like a real marker circle)
export function handCircle(ctx, cx, cy, rx, ry, p, o = {}) {
  const pts = [];
  const n = 64, turns = 1.12, a0 = o.a0 ?? -2.2;
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = a0 + u * TAU * turns;
    const k = 1 + 0.06 * Math.sin(u * 9 + (o.seed || 1)) + u * 0.05;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  handStroke(ctx, pts, p, o);
}
export function handArrow(ctx, x0, y0, x1, y1, p, o = {}) {
  const mx = (x0 + x1) / 2 + (o.bend ?? 0.2) * (y1 - y0), my = (y0 + y1) / 2 - (o.bend ?? 0.2) * (x1 - x0);
  const pts = [];
  for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([(1 - u) ** 2 * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * my + u * u * y1]); }
  handStroke(ctx, pts, clamp(p / 0.8), o);
  const hp = clamp((p - 0.8) / 0.2);
  if (hp > 0) {
    const a = Math.atan2(y1 - pts[22][1], x1 - pts[22][0]), L = o.head ?? 34;
    handStroke(ctx, [[x1 - Math.cos(a - 0.5) * L, y1 - Math.sin(a - 0.5) * L], [x1, y1], [x1 - Math.cos(a + 0.5) * L, y1 - Math.sin(a + 0.5) * L]], hp, { ...o, seed: (o.seed || 1) + 9 });
  }
}

// Highlighter swipe over a box (newspaper evidence): grows left->right, slightly uneven, multiply blend.
export function highlight(ctx, x, y, w, h, p, { color = [226, 140, 38], alpha = 0.78, seed = 2 } = {}) {
  if (p <= 0) return;
  const r = rng(seed);
  const ww = w * ease.outCubic(clamp(p));
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  const pad = h * 0.12;
  ctx.moveTo(x - pad, y - pad + r() * 3);
  const n = 8;
  for (let i = 1; i <= n; i++) ctx.lineTo(x - pad + (ww + 2 * pad) * (i / n), y - pad + (r() - 0.5) * 3);
  for (let i = n; i >= 0; i--) ctx.lineTo(x - pad + (ww + 2 * pad) * (i / n), y + h + pad + (r() - 0.5) * 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Paper-tear wipe: everything below a jagged line moving across the frame shows `drawB`.
export function tearWipe(ctx, p, drawA, drawB, { seed = 5, angle = -0.12, vertical = false } = {}) {
  drawA(ctx);
  if (p <= 0) return;
  const r = rng(seed);
  const pts = [];
  const n = 40;
  const pos = lerp(-120, (vertical ? SW : SH) + 120, ease.inOutCubic(p));
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const j = (r() - 0.5) * 26 + noise3(u * 7, seed, 1) * 30;
    if (vertical) pts.push([pos + j + u * SH * angle, u * SH]); else pts.push([u * SW, pos + j + u * SW * angle]);
  }
  ctx.save();
  ctx.beginPath();
  if (vertical) { ctx.moveTo(-10, -10); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(-10, SH + 10); }
  else { ctx.moveTo(-10, -10); ctx.lineTo(SW + 10, -10); pts.slice().reverse().forEach(([x, y]) => ctx.lineTo(x, y)); }
  ctx.closePath();
  ctx.clip();
  drawB(ctx);
  ctx.restore();
  // white torn fibre edge
  ctx.save();
  ctx.strokeStyle = rgba(P.card);
  ctx.lineWidth = 9;
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  ctx.restore();
}
