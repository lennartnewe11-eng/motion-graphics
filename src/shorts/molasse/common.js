// Shared worlds and props of "Die Melasse-Flut": the 1919 street, the wave, the tank, paper strips.
import { TAU, clamp, lerp, ease, noise3, rng, rgba, seg } from '../../engine/core.js';
import { SW, SH, P, img, plate, sticker, tornPath, pathPts, onTwos, tornShadow } from '../lib/collage.js';
import { liquidBegin, liquidEnd, drip, blob, strand, surface, fillBelow } from '../lib/liquid.js';
import { setFont, measure } from '../lib/type.js';

export { TAU, clamp, lerp, ease, noise3, rng, rgba, seg };
export const S = seg;
export const inR = (t, a, b) => t >= a && t < b;

// ------------------------------------------------------------- street ---
// Hine, "Bringing Home the Wood", Boston 1909: right half (market stalls) as the street plate.
export const STREET_CROP = [1150, 300, 1250, 1393];
export function street(ctx, t, { x = 0.5, z = 1, dx = 0, dy = 0 } = {}) {
  return plate(ctx, 'plate_street', { crop: STREET_CROP, x, y: 0.5, z, dx, dy });
}

// A cut-out person running: bobbing and rocking on twos (cut-out animation, style guide §2.2)
export function runner(ctx, k, x, y, s, t, { phase = 0, dir = 1, speed = 1, lift = 0.35, alpha = 1 } = {}) {
  const tt = onTwos(t * speed + phase, 12);
  const step = Math.floor(tt * 6) % 2;
  const bob = Math.abs(Math.sin(tt * Math.PI * 3)) * 14 * s;
  const rock = (step ? 0.05 : -0.035) + 0.06 * dir;
  sticker(ctx, k, x, y - bob, { s, rot: rock, flip: dir < 0, lift, alpha });
}

// --------------------------------------------------------- paper strip ---
// Word on a torn paper strip (legible over photos; ransom-note collage)
export function strip(ctx, x, y, w, h, { seed = 1, rot = 0, col = P.card, lift = 0.3 } = {}) {
  const pts = tornPath(w, h, seed, { sides: 'lr', amp: 6, step: 7 });
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.translate(-w / 2, -h / 2);
  const sh = tornShadow(w, h, seed, 'lr', 6, 6);
  ctx.save();
  ctx.globalAlpha *= 0.22;
  ctx.drawImage(sh, 4 + lift * 6 - sh.pad, 6 + lift * 14 - sh.pad);
  ctx.restore();
  ctx.fillStyle = rgba(col);
  pathPts(ctx, pts);
  ctx.fill();
  ctx.restore();
}
// A word set on its own strip; pops on at `at` (hard, with 2-frame overshoot)
export function stripWord(ctx, t, text, role, size, cx, cy, at, { seed = 1, rot = 0, padX = 0.32, padY = 0.2, col = P.ink, bgc = P.card } = {}) {
  if (t < at) return null;
  const k = clamp((t - at) / 0.1);
  const sc = lerp(1.18, 1, ease.outBack(k));
  const m = measure(ctx, text, role, size);
  const w = m.w + size * padX * 2, h = (m.asc + m.desc) + size * padY * 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot + noise3(t * 0.5, seed, 1) * 0.012);
  ctx.scale(sc, sc);
  strip(ctx, 0, 0, w, h, { seed, col: bgc });
  setFont(ctx, role, size);
  ctx.fillStyle = rgba(col);
  ctx.textAlign = 'left';
  ctx.fillText(text, -m.w / 2, (m.asc - m.desc) / 2);
  ctx.letterSpacing = '0px';
  ctx.restore();
  return { w, h };
}

// ---------------------------------------------------------------- wave ---
// The breaking syrup wave, drawn into a liquid mask. front: x of the toe; top: crest y; base: street y.
export function waveMask(m, t, { front: X, top, base, seed = 1, left = -300 } = {}) {
  const H = base - top;
  const n = (a, f, k) => noise3(a * f, t * 0.7, seed + k);
  const crestX = X - 0.12 * H, tipX = X + 0.24 * H, tipY = base - 0.72 * H;
  m.beginPath();
  m.moveTo(left, base + 2000);
  // back of the wave: a heavy, slowly heaving slope
  for (let x = left; x <= crestX - 0.55 * H; x += 24) {
    const k = clamp((x - left) / (crestX - 0.55 * H - left));
    m.lineTo(x, base - H * (0.62 + 0.3 * ease.inQuad(k)) + n(x, 0.004, 1) * H * 0.06);
  }
  // up to the rounded crest
  m.bezierCurveTo(crestX - 0.3 * H, top + n(1, 1, 2) * H * 0.04, crestX - 0.05 * H, top - 0.02 * H, crestX + 0.12 * H, top + 0.03 * H);
  // over and down to the curling tip
  m.bezierCurveTo(crestX + 0.3 * H, top + 0.08 * H, tipX + 0.06 * H, tipY - 0.12 * H, tipX, tipY + n(2, 1, 3) * H * 0.02);
  // under the lip back into the barrel, then the concave front face down to the toe
  m.bezierCurveTo(tipX - 0.04 * H, tipY + 0.08 * H, X + 0.02 * H, base - 0.66 * H, X - 0.06 * H, base - 0.55 * H);
  m.bezierCurveTo(X - 0.14 * H, base - 0.4 * H, X - 0.1 * H, base - 0.16 * H, X + 0.02 * H, base - 0.06 * H);
  // the foot: a heavy tongue rolling ahead along the ground
  const tongue = X + 0.3 * H + noise3(t * 0.8, seed, 5) * H * 0.03;
  m.bezierCurveTo(X + 0.1 * H, base - 0.02 * H, tongue - 0.06 * H, base - 0.05 * H, tongue, base + 0.01 * H);
  m.bezierCurveTo(tongue + 0.04 * H, base + 0.04 * H, tongue + 0.02 * H, base + 0.08 * H, tongue + 0.1 * H, base + 0.4 * H);
  m.lineTo(tongue + 0.1 * H, base + 2000);
  m.lineTo(left, base + 2000);
  m.closePath();
  m.fill();
  const r = rng(seed * 31);
  // drips and strings hanging from the lip, stretching under gravity
  for (let i = 0; i < 6; i++) {
    const u = 0.15 + r() * 0.85;
    const x = lerp(X + 0.02 * H, tipX, u), y = lerp(base - 0.62 * H, tipY + 0.02 * H, u);
    const L = H * (0.06 + 0.2 * ((t * (0.35 + r() * 0.5) + r()) % 1));
    drip(m, x, y, L, H * (0.022 + r() * 0.02));
  }
  // thick droplets thrown off the tip (slow arcs: the stuff is heavy)
  for (let i = 0; i < 10; i++) {
    const ph = (t * (0.5 + r() * 0.35) + r()) % 1;
    const x = tipX + ph * H * (0.2 + r() * 0.45);
    const y = tipY - H * 0.04 + (-0.25 * ph + 1.25 * ph * ph) * H * (0.6 + r() * 0.4);
    if (y < base) blob(m, x, y, H * (0.01 + r() * 0.022) * (1 - ph * 0.5), t, i + seed);
  }
}
// streaks of light flowing over the wave body (drawn source-atop inside the liquid)
export function waveDetail(t, { front: X, top, base, seed = 1 }) {
  const H = base - top;
  return (a) => {
    a.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const off = (i / 9) * 0.9 + ((t * 0.35) % (1 / 9));
      const x0 = X - H * (0.35 + off * 1.4), y0 = top + H * (0.08 + off * 0.12);
      a.strokeStyle = `rgba(230,150,60,${0.1 + 0.12 * Math.sin(i * 2.1 + t)})`;
      a.lineWidth = H * (0.008 + 0.01 * ((i * 7) % 3));
      a.beginPath();
      a.moveTo(x0, y0);
      a.bezierCurveTo(x0 + H * 0.4, y0 - H * 0.04, X - H * 0.02, base - H * 0.62, X - H * 0.1, base - H * 0.3);
      a.stroke();
    }
  };
}
// flood surface across the street (in front of everything at ground level)
export function floodMask(m, t, level, { seed = 2, amp = 14, x0 = -40, x1 = SW + 40 } = {}) {
  const pts = surface(x0, x1, level, t, { amp, seed, freq: 0.004, speed: 0.5 });
  fillBelow(m, pts);
  return pts;
}

// ---------------------------------------------------------------- tank ---
// The riveted steel tank (Purity Distilling Co., 15 m tall, 27 m wide), as a collage object:
// steel plate rings drawn in print greys with rivet rows. rings: how many rings are built (0..R).
export const TANK_RINGS = 7;
export function tank(ctx, cx, base, w, h, { rings = TANK_RINGS, t = 0, cut = 0, fill = 0, seed = 5, label = 1, cracks = 0 } = {}) {
  const ringH = h / TANK_RINGS;
  const rx = w / 2, ry = w * 0.09;
  ctx.save();
  // body rings from the bottom up
  for (let i = 0; i < Math.min(TANK_RINGS, Math.ceil(rings)); i++) {
    const k = clamp(rings - i);
    const y1 = base - i * ringH, y0 = y1 - ringH * ease.outBack(k);
    const shade = 150 + ((i * 37) % 3) * 8;
    const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
    g.addColorStop(0, `rgb(${shade - 70},${shade - 72},${shade - 74})`);
    g.addColorStop(0.3, `rgb(${shade + 40},${shade + 38},${shade + 34})`);
    g.addColorStop(0.55, `rgb(${shade + 5},${shade + 3},${shade})`);
    g.addColorStop(1, `rgb(${shade - 90},${shade - 92},${shade - 95})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - rx, y0);
    ctx.lineTo(cx - rx, y1);
    ctx.ellipse(cx, y1, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rx, y0);
    ctx.ellipse(cx, y0, rx, ry, 0, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    // seam + rivet row
    ctx.strokeStyle = 'rgba(30,26,22,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, y1, rx, ry, 0, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = 'rgba(25,22,19,0.75)';
    for (let a = 0.08; a < Math.PI - 0.05; a += 0.085) {
      const x = cx + Math.cos(a) * rx * 0.995, y = y1 - 7 + Math.sin(a) * ry;
      ctx.beginPath(); ctx.arc(x, y, 2.6 * (0.6 + Math.sin(a) * 0.5), 0, TAU); ctx.fill();
    }
    // vertical plate seams
    ctx.strokeStyle = 'rgba(30,26,22,0.3)';
    ctx.lineWidth = 1.5;
    for (let j = 0; j < 5; j++) {
      const a = ((j * 0.63 + i * 0.31) % 1) * Math.PI;
      const x = cx + Math.cos(a) * rx;
      ctx.beginPath(); ctx.moveTo(x, y0 + Math.sin(a) * ry); ctx.lineTo(x, y1 + Math.sin(a) * ry); ctx.stroke();
    }
  }
  // roof cone when finished
  if (rings >= TANK_RINGS) {
    const top = base - h;
    ctx.fillStyle = 'rgb(118,114,108)';
    ctx.beginPath();
    ctx.ellipse(cx, top, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgb(150,146,139)';
    ctx.beginPath();
    ctx.moveTo(cx - rx, top); ctx.quadraticCurveTo(cx, top - ry * 2.6, cx + rx, top); ctx.ellipse(cx, top, rx, ry, 0, 0, Math.PI); ctx.fill();
    // stencil lettering on the tank (the owner, Purity Distilling Co.)
    if (label > 0) {
      ctx.save();
      ctx.globalAlpha *= label * 0.8;
      ctx.font = `400 ${Math.round(w * 0.075)}px "League Gothic"`;
      ctx.letterSpacing = `${Math.round(w * 0.012)}px`;
      ctx.fillStyle = 'rgba(28,24,20,0.85)';
      ctx.textAlign = 'center';
      ctx.fillText('PURITY DISTILLING CO.', cx, base - h * 0.62);
      ctx.letterSpacing = '0px';
      ctx.restore();
    }
  }
  ctx.restore();
}

// A row of strip-words laid out by measured width (centred on cx). items: [text, role, size, at, rot?]
export function stripRow(ctx, t, items, cx, cy, { gap = 18, seed = 1 } = {}) {
  const ws = items.map(([text, role, size]) => { const m = measure(ctx, text, role, size); return m.w + size * 0.64; });
  const total = ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = cx - total / 2;
  items.forEach(([text, role, size, at, rot = 0, dy = 0], i) => {
    stripWord(ctx, t, text, role, size, x + ws[i] / 2, cy + dy, at, { seed: seed * 10 + i, rot });
    x += ws[i] + gap;
  });
}

// --------------------------------------------------------------- clock ---
// Pocket-watch face (engraving style) — hands at hours h (0..12, fractional)
export function clock(ctx, x, y, r, h, { alpha = 1 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = rgba(P.card);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(P.ink); ctx.lineWidth = r * 0.06;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.97, 0, TAU); ctx.stroke();
  ctx.lineWidth = r * 0.015;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.86, 0, TAU); ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU, l = i % 5 ? 0.04 : 0.1;
    ctx.lineWidth = i % 5 ? r * 0.012 : r * 0.03;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86); ctx.lineTo(Math.cos(a) * r * (0.86 - l), Math.sin(a) * r * (0.86 - l)); ctx.stroke();
  }
  ctx.fillStyle = rgba(P.ink);
  ctx.font = `italic 600 ${Math.round(r * 0.2)}px "Bodoni Moda"`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const rom = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU - Math.PI / 2;
    ctx.fillText(rom[i], Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66);
  }
  ctx.textBaseline = 'alphabetic';
  const hand = (a, len, w) => {
    ctx.save(); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(-w, r * 0.1); ctx.lineTo(0, -len); ctx.lineTo(w, r * 0.1); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  hand((h / 12) * TAU, r * 0.48, r * 0.05);
  hand(((h % 1) * TAU), r * 0.74, r * 0.032);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.06, 0, TAU); ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------- counter ---
// Odometer in a black box (style guide 2.4: numbers as events). value is fractional: digits roll.
export function odometer(ctx, x, y, value, digits, { size = 110, unit = '', sep = '.' } = {}) {
  const dw = size * 0.62, pad = size * 0.22, sw = size * 0.22;
  const groups = Math.floor((digits - 1) / 3);
  const unitW = unit ? size * 0.9 : 0;
  const w = digits * dw + groups * sw + pad * 2 + unitW, h = size * 1.3;
  ctx.save();
  ctx.translate(x - w / 2, y - h / 2);
  ctx.fillStyle = rgba(P.ink);
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath(); ctx.rect(pad * 0.5, h * 0.08, w - pad - unitW, h * 0.84); ctx.clip();
  ctx.font = `900 ${size}px "Inter Tight"`;
  ctx.textAlign = 'center';
  ctx.fillStyle = rgba(P.card);
  let cx = pad + dw / 2;
  for (let i = 0; i < digits; i++) {
    const place = Math.pow(10, digits - 1 - i);
    const v = value / place;
    const d = Math.floor(v) % 10;
    // only the last moving digit rolls smoothly; higher digits snap with an ease near the carry
    const frac = v - Math.floor(v);
    const roll = place === 1 ? frac : (frac > 0.9 ? ease.inOutCubic((frac - 0.9) / 0.1) : 0);
    if (value >= place || i === digits - 1) {
      for (const [dd, off] of [[d, -roll], [(d + 1) % 10, 1 - roll]]) ctx.fillText(String(dd), cx, h * 0.5 + size * 0.36 + off * h);
    }
    cx += dw;
    if ((digits - 1 - i) % 3 === 0 && i < digits - 1) { if (value >= place) ctx.fillText(sep, cx - dw * 0.15, h * 0.5 + size * 0.36); cx += sw; }
  }
  ctx.restore();
  if (unit) {
    ctx.save();
    ctx.font = `italic 600 ${size * 0.8}px "Bodoni Moda"`;
    ctx.fillStyle = rgba(P.card);
    ctx.textAlign = 'center';
    ctx.fillText(unit, x + w / 2 - unitW / 2 - pad * 0.3, y + size * 0.3);
    ctx.restore();
  }
  return { w, h };
}

// ------------------------------------------------------- photo in type ---
let TT = null;
export function imageInText(ctx, text, role, size, x, y, k, crop, { inner = { x: 0.5, y: 0.5, z: 1 }, align = 'center', outline = 0, fn = null } = {}) {
  if (!TT) TT = document.createElement('canvas'), TT.width = SW, TT.height = SH;
  const c = TT.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over';
  c.clearRect(0, 0, SW, SH);
  c.setTransform(ctx.getTransform());
  setFont(c, role, size);
  c.textAlign = align;
  c.fillStyle = '#000';
  if (fn) fn(c); else c.fillText(text, x, y);
  c.globalCompositeOperation = 'source-in';
  const im = img(k);
  const m = measure(c, text, role, size);
  const bw = m.w, bh = m.asc + m.desc;
  const bx = align === 'center' ? x - bw / 2 : x, by = y - m.asc;
  const cr = crop || [0, 0, im.width, im.height];
  const z = inner.z || 1;
  const sc = Math.max(bw / cr[2], bh / cr[3]) * z;
  const vw = bw / sc, vh = bh / sc;
  const sx = cr[0] + clamp(inner.x * cr[2] - vw / 2, 0, cr[2] - vw), sy = cr[1] + clamp(inner.y * cr[3] - vh / 2, 0, cr[3] - vh);
  c.drawImage(im, sx, sy, vw, vh, bx, by, bw, bh);
  c.letterSpacing = '0px';
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(TT, 0, 0);
  ctx.restore();
}
