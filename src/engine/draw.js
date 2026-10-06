// Drawing helpers: typography, shape layers, morphing, trim paths.
import { TAU, clamp, lerp, ease, noise3, rgba } from './core.js';

export const F = {
  sans: 'InterV',
  serif: 'Instrument Serif',
  mono: 'JetBrains Mono',
  syne: 'Syne',
  playfair: 'Playfair Display',
  unbounded: 'Unbounded',
  bebas: 'Bebas Neue',
  fraunces: 'Fraunces',
  grotesk: 'Space Grotesk',
};

export function font(ctx, size, weight = 400, family = F.sans, style = 'normal') {
  ctx.font = `${style} ${weight} ${size}px "${family}"`;
}

// Measure a string glyph-by-glyph (kerning preserved through prefix measuring).
const layoutCache = new Map();
export function glyphs(ctx, str, tracking = 0) {
  const key = ctx.font + '|' + str + '|' + tracking;
  let g = layoutCache.get(key);
  if (g) return g;
  const prev = ctx.letterSpacing;
  ctx.letterSpacing = '0px';
  const out = [];
  let lastW = 0;
  for (let i = 0; i < str.length; i++) {
    const w = ctx.measureText(str.slice(0, i + 1)).width;
    const x = lastW + i * tracking;
    out.push({ ch: str[i], x, w: w - lastW, i });
    lastW = w;
  }
  const m = ctx.measureText(str);
  g = {
    list: out,
    width: lastW + (str.length - 1) * tracking,
    ascent: m.actualBoundingBoxAscent,
    descent: m.actualBoundingBoxDescent,
  };
  ctx.letterSpacing = prev;
  layoutCache.set(key, g);
  return g;
}

// Draw text glyph-by-glyph with a per-glyph transform callback.
// fn(glyph, index, count) -> { dx, dy, sx, sy, rot, alpha, color, weight } or null to skip
export function drawGlyphs(ctx, str, x, y, { tracking = 0, align = 'left', fn = null, fill = true, stroke = 0 } = {}) {
  const g = glyphs(ctx, str, tracking);
  let ox = x;
  if (align === 'center') ox = x - g.width / 2;
  else if (align === 'right') ox = x - g.width;
  ctx.textAlign = 'left';
  const baseFont = ctx.font;
  const baseFill = ctx.fillStyle;
  for (const gl of g.list) {
    if (gl.ch === ' ') continue;
    const o = fn ? fn(gl, gl.i, g.list.length) : {};
    if (o === null) continue;
    const { dx = 0, dy = 0, sx = 1, sy = 1, rot = 0, alpha = 1, color = null, fontStr = null } = o;
    if (alpha <= 0.001) continue;
    ctx.save();
    const cx = ox + gl.x + gl.w / 2;
    ctx.translate(cx + dx, y + dy);
    if (rot) ctx.rotate(rot);
    if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
    ctx.globalAlpha *= alpha;
    if (fontStr) ctx.font = fontStr;
    if (color) { ctx.fillStyle = color; ctx.strokeStyle = color; }
    ctx.textAlign = 'center';
    if (fill) ctx.fillText(gl.ch, 0, 0);
    if (stroke) { ctx.lineWidth = stroke; ctx.strokeText(gl.ch, 0, 0); }
    ctx.restore();
    ctx.font = baseFont;
    ctx.fillStyle = baseFill;
  }
  return g;
}

// Masked line reveal: text slides up from behind a clipping rect.
export function maskedLine(ctx, str, x, y, p, { align = 'left', tracking = 0, dir = 1, pad = 0.25 } = {}) {
  const g = glyphs(ctx, str, tracking);
  const asc = g.ascent, desc = g.descent;
  const h = asc + desc;
  let ox = x;
  if (align === 'center') ox = x - g.width / 2;
  else if (align === 'right') ox = x - g.width;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox - h, y - asc - h * pad, g.width + 2 * h, h * (1 + 2 * pad));
  ctx.clip();
  const off = (1 - p) * h * (1 + 2 * pad) * dir;
  ctx.letterSpacing = tracking + 'px';
  ctx.textAlign = 'left';
  ctx.fillText(str, ox, y + off);
  ctx.letterSpacing = '0px';
  ctx.restore();
  return g;
}

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// --------------------------------------------------------- shape layers ---
// Star-shaped outlines expressed as polar radius functions r(theta) in [0..~1].
const superellipse = (th, n) => Math.pow(Math.pow(Math.abs(Math.cos(th)), n) + Math.pow(Math.abs(Math.sin(th)), n), -1 / n);
function polygonR(th, k, round = 0) {
  const a = TAU / k;
  const m = ((th % a) + a) % a - a / 2;
  const r = Math.cos(Math.PI / k) / Math.cos(m);
  // soften corners by blending towards circle near vertices
  return lerp(r, Math.cos(Math.PI / k) * 1.12, round * Math.pow(Math.abs(m) / (a / 2), 6));
}
export const SHAPES = {
  circle: () => 1,
  square: (th) => superellipse(th + Math.PI / 4, 8) * 0.86,
  triangle: (th) => polygonR(th - Math.PI / 2, 3, 0.35) * 1.15,
  star: (th) => {
    const k = 5;
    const a = TAU / k;
    const m = Math.abs(((((th + Math.PI / 2) % a) + a) % a) - a / 2) / (a / 2);
    return lerp(1.12, 0.52, Math.pow(1 - m, 1.2));
  },
  blob: (th, t = 0) => 0.9 + 0.13 * noise3(Math.cos(th) * 1.2, Math.sin(th) * 1.2, t * 0.8),
  flower: (th) => 0.78 + 0.2 * Math.cos(th * 6),
  hex: (th) => polygonR(th, 6, 0.4),
  diamond: (th) => superellipse(th, 1.2) * 1.05,
  squircle: (th) => superellipse(th, 4) * 0.92,
};

// Morph between shape a and b (keys of SHAPES or functions) with p in [0..1].
export function morphPath(ctx, cx, cy, r, a, b, p, rot = 0, t = 0, N = 180) {
  const fa = typeof a === 'function' ? a : SHAPES[a];
  const fb = typeof b === 'function' ? b : SHAPES[b];
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * TAU;
    const rr = r * lerp(fa(th, t), fb(th, t), p);
    const x = cx + Math.cos(th + rot) * rr;
    const y = cy + Math.sin(th + rot) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Shape sequence on a timeline. seq = [[time, shapeKey], ...]; morph duration d.
export function shapeAt(t, seq, d, e = ease.inOutBack) {
  let a = seq[0][1], b = seq[0][1], p = 0;
  for (let i = 1; i < seq.length; i++) {
    if (t >= seq[i][0]) { a = seq[i][1]; b = seq[i][1]; p = 0; }
    if (t >= seq[i][0] && t < seq[i][0] + d) {
      a = seq[i - 1][1]; b = seq[i][1]; p = e(clamp((t - seq[i][0]) / d));
    }
  }
  return { a, b, p };
}

// Trim path for arcs: draw arc from start to end fraction.
export function trimArc(ctx, cx, cy, r, start, end, rot = -Math.PI / 2) {
  if (end <= start) return;
  ctx.beginPath();
  ctx.arc(cx, cy, r, rot + start * TAU, rot + end * TAU);
  ctx.stroke();
}

// Trim path for polylines.
export function polyLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}
export function trimPoly(ctx, pts, start, end) {
  const L = polyLength(pts);
  const a = start * L, b = end * L;
  if (b <= a) return;
  ctx.beginPath();
  let acc = 0, started = false;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const l = Math.hypot(x1 - x0, y1 - y0);
    const s0 = acc, s1 = acc + l;
    acc = s1;
    if (s1 < a || s0 > b || l === 0) continue;
    const u0 = clamp((a - s0) / l), u1 = clamp((b - s0) / l);
    const px0 = lerp(x0, x1, u0), py0 = lerp(y0, y1, u0);
    const px1 = lerp(x0, x1, u1), py1 = lerp(y0, y1, u1);
    if (!started) { ctx.moveTo(px0, py0); started = true; }
    ctx.lineTo(px1, py1);
  }
  ctx.stroke();
}

// Radial "burst" lines — the classic motion design accent.
export function burst(ctx, x, y, p, { n = 8, r0 = 40, r1 = 120, width = 6, color = '#fff', rot = 0 } = {}) {
  if (p <= 0 || p >= 1) return;
  const head = ease.outExpo(clamp(p / 0.7));
  const tail = ease.inOutCubic(clamp((p - 0.15) / 0.85));
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = width * (1 - tail * 0.6);
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU;
    const ra = lerp(r0, r1, tail), rb = lerp(r0, r1, head);
    if (rb - ra < 0.5) continue;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * ra, y + Math.sin(a) * ra);
    ctx.lineTo(x + Math.cos(a) * rb, y + Math.sin(a) * rb);
    ctx.stroke();
  }
  ctx.restore();
}

// Expanding ring accent.
export function ring(ctx, x, y, p, { r0 = 10, r1 = 200, width = 8, color = '#fff' } = {}) {
  if (p <= 0 || p >= 1) return;
  const r = lerp(r0, r1, ease.outExpo(p));
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width * (1 - ease.inCubic(p));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

// Oversized so it still covers the frame when a transition scales the scene down.
export function fillBg(ctx, c) {
  ctx.fillStyle = typeof c === 'string' ? c : rgba(c);
  ctx.fillRect(-20000, -20000, 40000, 40000);
}

// Squash & stretch ellipse oriented along a direction (classic bouncing ball).
export function ball(ctx, x, y, r, sx, sy, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(sx, sy);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.restore();
}
