// "Spaghetti": the house style (../lib/night.js) + a hand-drawn layer (chalk on night), a 2.5D camera rig and the
// noodle: a photograph sliced along its body axis and laid along a path (tidal stretching, spiral infall).
// Accent: amber — the hot accretion disk, and the colour of spaghetti.
import { TAU, clamp, lerp, ease, noise3, rng, rgba } from '../../engine/core.js';
import { SW, SH, img, canvas } from '../lib/collage.js';
import { setFont } from '../lib/type.js';
import { V, R } from '../lib/night.js';

export * from '../lib/night.js';
V.accent = [255, 184, 28];
export const CHALK = [236, 232, 222];
export const DEEP = [255, 92, 40]; // the far, redshifted end of the accent (only for "immer röter")

// ----------------------------------------------------------------- camera
// world: x right, y down, z into the screen. A point at depth z appears scaled by F / (z - cam.z).
export const F = 1000;
export function view(ctx, cam) {
  ctx.translate(SW / 2, SH / 2);
  ctx.rotate(cam.roll || 0);
  ctx.translate(-SW / 2, -SH / 2);
}
export function proj(cam, x, y, z) {
  const s = F / Math.max(1, z - cam.z);
  return [SW / 2 + (x - cam.x) * s, SH / 2 + (y - cam.y) * s, s];
}
// draw a layer that lives at depth z: everything inside fn is in world units around (x, y)
export function layer(ctx, cam, z, fn, { x = 0, y = 0, alpha = 1 } = {}) {
  const [px, py, s] = proj(cam, x, y, z);
  if (s <= 0 || s > 400) return;
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(s, s);
  ctx.globalAlpha *= alpha;
  fn(ctx, s);
  ctx.restore();
}

// ------------------------------------------------------------------ chalk
// a hand-drawn line: two or three slightly different passes, boiling on twos (12 fps), grainy alpha
const boilT = (t) => Math.floor(t * 12);
export function chalk(ctx, pts, { t = 0, color = CHALK, width = 4, passes = 2, jitter = 1.6, seed = 1, alpha = 1, p = 1, dash = null } = {}) {
  if (p <= 0 || pts.length < 2) return;
  const tb = boilT(t);
  // reveal p along the polyline
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
  const target = L * clamp(p);
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  for (let k = 0; k < passes; k++) {
    ctx.strokeStyle = rgba(color, alpha * (k ? 0.45 : 0.9));
    ctx.lineWidth = width * (k ? 0.6 : 1);
    ctx.beginPath();
    let acc = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = jitter * (k ? 1.6 : 1);
      const x = pts[i][0] + noise3(i * 0.37, tb * 0.71 + k * 3, seed) * j;
      const y = pts[i][1] + noise3(i * 0.37, tb * 0.71 + k * 3, seed + 9) * j;
      if (i === 0) { ctx.moveTo(x, y); continue; }
      if (acc + seg[i - 1] >= target) {
        const u = (target - acc) / seg[i - 1];
        ctx.lineTo(lerp(pts[i - 1][0], x, u), lerp(pts[i - 1][1], y, u));
        break;
      }
      ctx.lineTo(x, y);
      acc += seg[i - 1];
    }
    ctx.stroke();
  }
  ctx.restore();
}
export const ellipsePts = (cx, cy, rx, ry, a0 = 0, a1 = TAU, n = 72, rot = 0) => {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = lerp(a0, a1, i / n), x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return out;
};
export function chalkArrow(ctx, x0, y0, x1, y1, o = {}) {
  const p = o.p ?? 1;
  chalk(ctx, [[x0, y0], [lerp(x0, x1, 0.5) + (o.bend || 0), lerp(y0, y1, 0.5)], [x1, y1]], { ...o, p: clamp(p / 0.85) });
  if (p > 0.85) {
    const a = Math.atan2(y1 - y0, x1 - x0), L = o.head ?? 30, q = clamp((p - 0.85) / 0.15);
    chalk(ctx, [[x1 - Math.cos(a - 0.5) * L, y1 - Math.sin(a - 0.5) * L], [x1, y1], [x1 - Math.cos(a + 0.5) * L, y1 - Math.sin(a + 0.5) * L]], { ...o, p: q, seed: (o.seed || 1) + 5 });
  }
}
// hatching inside a circle (pencil shading)
export function hatch(ctx, cx, cy, r, { t = 0, color = CHALK, alpha = 0.25, step = 14, angle = -0.7, seed = 3 } = {}) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
  const ca = Math.cos(angle), sa = Math.sin(angle);
  for (let d = -r; d <= r; d += step) {
    const x0 = cx + ca * d - sa * r, y0 = cy + sa * d + ca * r, x1 = cx + ca * d + sa * r, y1 = cy + sa * d - ca * r;
    chalk(ctx, [[x0, y0], [x1, y1]], { t, color, width: 2, passes: 1, alpha, jitter: 2, seed: seed + d });
  }
  ctx.restore();
}

// ------------------------------------------------------------- black hole
// drawn, not photographed: a black disc, a chalk photon ring, a rotating amber accretion disk (back half behind,
// front half in front), a lensed arc over the top, and a soft glow. r = horizon radius in current units.
export function blackHole(ctx, x, y, r, t, { tilt = 0.28, spin = 1, alpha = 1, disk = 1, glow = 1, seed = 4, rot = -0.12 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (glow > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 4.2);
    g.addColorStop(0, rgba(V.accent, 0.38 * glow)); g.addColorStop(0.35, rgba(DEEP, 0.12 * glow)); g.addColorStop(1, rgba(DEEP, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r * 4.2, y - r * 4.2, r * 8.4, r * 8.4);
    ctx.restore();
  }
  const rings = 9;
  const ring = (i, a0, a1) => {
    const rr = r * (1.6 + i * 0.32);
    const ph = t * spin * (2.2 - i * 0.15) + i * 0.7;
    ctx.save();
    ctx.lineDashOffset = -ph * rr * 0.6;
    chalk(ctx, ellipsePts(x, y, rr, rr * tilt, a0, a1, 64, rot), { t, color: i % 3 === 0 ? CHALK : V.accent, width: Math.max(1.5, r * (0.05 - i * 0.004)), passes: 1, alpha: disk * (0.95 - i * 0.07), jitter: r * 0.01, seed: seed + i, dash: [r * (0.5 + (i % 3) * 0.3), r * 0.18] });
    ctx.restore();
  };
  for (let i = 0; i < rings; i++) ring(i, Math.PI, TAU); // back half
  // lensed light bent over the top of the hole
  for (let i = 0; i < 4; i++) chalk(ctx, ellipsePts(x, y, r * (1.25 + i * 0.12), r * (1.25 + i * 0.12) * 0.98, Math.PI * 1.08, Math.PI * 1.92, 40), { t, color: V.accent, width: Math.max(1.5, r * 0.035), passes: 1, alpha: disk * (0.7 - i * 0.15), jitter: r * 0.008, seed: seed + 20 + i });
  ctx.fillStyle = '#020305';
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  chalk(ctx, ellipsePts(x, y, r * 1.04, r * 1.04, 0, TAU, 90), { t, color: CHALK, width: Math.max(2, r * 0.03), passes: 2, alpha: 0.85, jitter: r * 0.01, seed: seed + 40 });
  for (let i = 0; i < rings; i++) ring(i, 0, Math.PI); // front half
  ctx.restore();
}

// ------------------------------------------------------- spacetime grid
// a hand-drawn rubber sheet bent into a funnel at (cx, cy): perspective lines, depth by the well 1/r.
export function sheet(ctx, cx, cy, t, { w = 2600, d = 1800, n = 16, depth = 900, horizon = 0.36, alpha = 0.55, p = 1, seed = 7, color = CHALK } = {}) {
  const P = (u, v) => {
    // u, v in [-1, 1] on the sheet; perspective: v -> screen y
    const x = u * w / 2, z = (v + 1) / 2;
    const r = Math.hypot(u * 1.0, v * 0.9) + 0.06;
    const well = depth * (0.06 / r) * (1 - clamp(r));
    const k = lerp(horizon, 1, z);
    return [cx + x * k, cy + (z - 0.5) * d * k * 0.55 + well];
  };
  for (let i = 0; i <= n; i++) {
    const a = -1 + (2 * i) / n;
    const row = [], col = [];
    for (let j = 0; j <= 48; j++) { const b = -1 + (2 * j) / 48; row.push(P(b, a)); col.push(P(a, b)); }
    const q = clamp(p * (n + 6) / n - i / n);
    chalk(ctx, row, { t, color, width: 2.4, passes: 1, alpha: alpha * (0.4 + 0.6 * (i / n)), jitter: 1.5, seed: seed + i, p: q });
    chalk(ctx, col, { t, color, width: 2.4, passes: 1, alpha: alpha * 0.7, jitter: 1.5, seed: seed + 50 + i, p: q });
  }
  return P;
}

// ------------------------------------------------------------ the noodle
// Slice image `key` along its vertical axis (head at top) into n strips and lay them along a path.
// path(u) -> [x, y] for u in [0, 1] (0 = head, 1 = feet). widthAt(u) -> horizontal scale of the strip.
export function ribbon(ctx, key, path, { n = 90, widthAt = () => 1, scale = 1, alpha = 1, src = null, glow = 0 } = {}) {
  const im = typeof key === 'string' ? img(key) : key;
  const [sx0, sy0, sw, sh] = src || [0, 0, im.width, im.height];
  const sl = sh / n;
  ctx.save();
  ctx.globalAlpha *= alpha;
  let prev = path(0);
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n;
    const a = i ? prev : path(u0), b = path(u1);
    prev = b;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < 0.01) continue;
    const ang = Math.atan2(dy, dx) - Math.PI / 2;
    const wscale = widthAt((u0 + u1) / 2) * scale;
    ctx.save();
    ctx.translate(a[0], a[1]);
    ctx.rotate(ang);
    ctx.drawImage(im, sx0, sy0 + i * sl, sw, sl + 0.6, -sw * wscale / 2, 0, sw * wscale, len + 0.8);
    ctx.restore();
  }
  ctx.restore();
}
// a straight tidal stretch of a standing figure (feet at the bottom): k 0..1 stretches and narrows, more at the feet
export function stretchFigure(ctx, key, x, y, h, k, { rot = 0, alpha = 1, squeeze = 1 } = {}) {
  const im = typeof key === 'string' ? img(key) : key;
  const H = h * (1 + k * 2.4);
  const s = h / im.height;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  // non-linear: u^g puts more length into the lower body (the feet are pulled hardest)
  const g = 1 + k * 1.4;
  // the head stays where it is; the body is drawn out below it, toward the hole
  ribbon(ctx, key, (u) => [0, -h / 2 + H * Math.pow(u, 1 / g)], { n: 70, scale: s, alpha, widthAt: (u) => lerp(1, lerp(0.75, 0.32, u), clamp(k * squeeze)) });
  ctx.restore();
}

// the astronaut stood upright (head up, feet down): the photo is rotated once and trimmed to its alpha
let upright = null;
export function astro() {
  if (upright) return upright;
  const im = img('astro'), a = -0.7;
  const D = Math.ceil(Math.hypot(im.width, im.height));
  const c = canvas(D, D), x = c.getContext('2d', { willReadFrequently: true });
  x.translate(D / 2, D / 2); x.rotate(a); x.drawImage(im, -im.width / 2, -im.height / 2);
  const d = x.getImageData(0, 0, D, D).data;
  let x0 = D, y0 = D, x1 = 0, y1 = 0;
  for (let yy = 0; yy < D; yy += 2) for (let xx = 0; xx < D; xx += 2) if (d[(yy * D + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
  upright = canvas(x1 - x0 + 4, y1 - y0 + 4);
  upright.getContext('2d').drawImage(c, -x0 + 2, -y0 + 2);
  return upright;
}

// -------------------------------------------------------------- star layers
// photographic deep fields as depth layers (screen-blended), plus 3D star particles that streak when we move
export function deepField(ctx, cam, key, z, { alpha = 1, scale = 1.6, x = 0, y = 0 } = {}) {
  layer(ctx, cam, z, (c, s) => {
    const im = img(key);
    const need = (Math.hypot(SW, SH) * 1.15) / s;
    const k = Math.max(scale, need / Math.min(im.width, im.height));
    const w = im.width * k, h = im.height * k;
    c.globalCompositeOperation = 'screen';
    c.drawImage(im, -w / 2, -h / 2, w, h);
  }, { x, y, alpha });
}
export function stars(ctx, cam, prev, { n = 260, seed = 11, spread = 4000, zmin = 200, zmax = 6000, size = 3, color = CHALK, alpha = 1 } = {}) {
  const r = rng(seed);
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha); ctx.fillStyle = rgba(color, alpha);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = (r() - 0.5) * spread, y = (r() - 0.5) * spread * 1.4, z0 = lerp(zmin, zmax, r()), tw = r();
    // wrap stars in depth so a camera flying forward never runs out
    const span = zmax - zmin;
    const z = cam.z + zmin + ((((z0 - cam.z - zmin) % span) + span) % span);
    const [px, py, s] = proj(cam, x, y, z);
    if (px < -50 || px > SW + 50 || py < -50 || py > SH + 50) continue;
    const rad = Math.max(0.6, size * s * 0.35);
    if (prev) {
      const [qx, qy] = proj(prev, x, y, z);
      if (Math.hypot(px - qx, py - qy) > 2) {
        ctx.lineWidth = rad * 1.4;
        ctx.globalAlpha = alpha * (0.4 + 0.6 * tw);
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
        continue;
      }
    }
    ctx.globalAlpha = alpha * (0.35 + 0.65 * tw) * (0.7 + 0.3 * Math.sin(tw * 40));
    ctx.beginPath(); ctx.arc(px, py, rad, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------- hand-drawn props
// fork (tines up), toothpaste tube, eye — simple outlines in chalk, drawn on with p
export function fork(ctx, x, y, s, rot, t, { p = 1, color = CHALK } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const o = { t, color, width: 5 / s, jitter: 1.2 / s, seed: 61 };
  chalk(ctx, [[0, 340], [0, 40]], { ...o, p: clamp(p * 2) });
  chalk(ctx, [[-46, -20], [-40, 30], [0, 52], [40, 30], [46, -20]], { ...o, p: clamp(p * 2 - 0.5), seed: 62 });
  for (let i = -1.5; i <= 1.5; i++) chalk(ctx, [[i * 30, 20], [i * 30, -150]], { ...o, p: clamp(p * 2 - 1), seed: 63 + i });
  ctx.restore();
}
export function tube(ctx, x, y, s, rot, t, squeeze, { p = 1, color = CHALK } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const o = { t, color, width: 5 / s, jitter: 1.2 / s, seed: 71, p };
  const pinch = lerp(1, 0.35, squeeze);
  // body: crimped end at the left, nozzle at the right
  chalk(ctx, [[-260, -70], [-260, 70]], o);
  chalk(ctx, [[-260, -70], [-60, -90 * pinch], [140, -80], [190, -36], [230, -30], [230, 30], [190, 36], [140, 80], [-60, 90 * pinch], [-260, 70]], { ...o, seed: 72 });
  for (let i = 0; i < 4; i++) chalk(ctx, [[-250 + i * 10, -66], [-250 + i * 10, 66]], { ...o, width: 2 / s, seed: 73 + i, alpha: 0.6 });
  // the hand squeezing it
  if (squeeze > 0) {
    chalkArrow(ctx, -60, -260, -60, -110 * pinch, { t, color: V.accent, width: 6 / s, p: clamp(squeeze * 3), seed: 75, head: 30 });
    chalkArrow(ctx, -60, 260, -60, 110 * pinch, { t, color: V.accent, width: 6 / s, p: clamp(squeeze * 3), seed: 76, head: 30 });
  }
  ctx.restore();
}
export function eye(ctx, x, y, s, t, { p = 1, color = CHALK, look = 0 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const o = { t, color, width: 5 / s, jitter: 1.4 / s, p };
  chalk(ctx, [[-160, 0], [-80, -70], [0, -86], [80, -70], [160, 0]], { ...o, seed: 81 });
  chalk(ctx, [[-160, 0], [-80, 70], [0, 86], [80, 70], [160, 0]], { ...o, seed: 82 });
  chalk(ctx, ellipsePts(look * 40, 0, 56, 56, 0, TAU, 40), { ...o, seed: 83 });
  ctx.fillStyle = rgba(color, 0.9 * p);
  ctx.beginPath(); ctx.arc(look * 40, 0, 24, 0, TAU); ctx.fill();
  ctx.restore();
}
// a stopwatch face whose hand slows down (rate 1 -> 0)
export function clockFace(ctx, x, y, r, t, ang, { p = 1, color = CHALK } = {}) {
  ctx.save(); ctx.translate(x, y);
  chalk(ctx, ellipsePts(0, 0, r, r, 0, TAU, 60), { t, color, width: 5, p, seed: 91 });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; chalk(ctx, [[Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82], [Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.94]], { t, color, width: 3, p, seed: 92 + i }); }
  chalk(ctx, [[0, 0], [Math.cos(ang - Math.PI / 2) * r * 0.75, Math.sin(ang - Math.PI / 2) * r * 0.75]], { t, color: V.accent, width: 6, p, seed: 110 });
  ctx.restore();
}
