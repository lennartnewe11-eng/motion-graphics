// Shared helpers for the "Flow" film: narration timing, word-synced typography, curve morphs.
import { TAU, clamp, lerp, ease, seg, C, rgba } from '../engine/core.js';
import { F, font, glyphs } from '../engine/draw.js';
import VOICE from './voice.json' with { type: 'json' };

export { VOICE };
export const line = (id) => VOICE.find((l) => l.id === id);
// absolute time a word is spoken (index into the line's words)
export const wordAt = (id, i) => { const l = line(id); return l.t + l.words[Math.min(i, l.words.length - 1)].s; };
export const lineEnd = (id) => { const l = line(id); return l.t + l.dur; };

// Draw a narration line word by word, each word rising out of a mask exactly when spoken.
// opts: x, y, size, weight, family, style, color, align, out (time to exit), tracking, accent {index, color, family, style, weight}
export function spoken(ctx, id, t, o) {
  const l = line(id);
  const { x = 960, y = 540, size = 64, weight = 400, family = F.serif, style = 'italic', color = C.paper, align = 'center', out = l.t + l.dur + 1.2, tracking = 0, accent = null, lead = 0.06, gap = 0.28, upto = 99, upper = false } = o;
  const exitP = seg(t, out, out + 0.45, ease.inExpo);
  if (t < l.t - lead || exitP >= 1) return null;
  const parts = l.words.slice(0, upto).map((w0, i) => {
    const w = upper ? { ...w0, w: w0.w.toUpperCase() } : w0;
    const a = accent && accent.index === i ? accent : null;
    const fam = a?.family ?? family, sty = a?.style ?? style, wgt = a?.weight ?? weight, sz = a?.size ?? size;
    font(ctx, sz, wgt, fam, sty);
    const g = glyphs(ctx, w.w, tracking);
    return { ...w, g, fam, sty, wgt, sz, col: a?.color ?? color };
  });
  font(ctx, size, weight, family, style);
  const space = ctx.measureText(' ').width + size * gap * 0.2;
  const total = parts.reduce((s, p) => s + p.g.width, 0) + space * (parts.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const boxes = [];
  for (const [i, p] of parts.entries()) {
    const t0 = l.t + p.s - lead;
    const pin = seg(t, t0, t0 + 0.42, ease.outExpo);
    if (pin > 0) {
      font(ctx, p.sz, p.wgt, p.fam, p.sty);
      ctx.letterSpacing = tracking + 'px';
      const asc = p.g.ascent, desc = p.g.descent;
      const h = asc + desc;
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - 20, y - asc - h * 0.4, p.g.width + 40, h * 1.8);
      ctx.clip();
      ctx.fillStyle = rgba(p.col);
      ctx.textAlign = 'left';
      const stagger = exitP > 0 ? seg(t, out + i * 0.03, out + 0.4 + i * 0.03, ease.inExpo) : 0;
      ctx.fillText(p.w, cx, y + (1 - pin) * h * 1.3 - stagger * h * 1.4);
      ctx.restore();
      ctx.letterSpacing = '0px';
    }
    boxes.push({ x: cx, w: p.g.width, word: p.w, t0 });
    cx += p.g.width + space;
  }
  return boxes;
}

// Sample a parametric curve into points.
export function sample(n, fn) {
  const pts = new Array(n + 1);
  for (let i = 0; i <= n; i++) pts[i] = fn(i / n);
  return pts;
}

export function strokePts(ctx, pts, closed = false) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (closed) ctx.closePath();
  ctx.stroke();
}

// Point on a ring for parameter u (0..1), starting on the left, running over the top.
export const ringPt = (cx, cy, r, u, rot = 0) => [cx + r * Math.cos(Math.PI + TAU * u + rot), cy + r * Math.sin(Math.PI + TAU * u + rot)];

// Morph of a curve into a ring: ends curl first (like a ribbon wrapping round).
export function wrapP(P, u, spread = 1.4) {
  const d = 0.5 - Math.abs(u - 0.5); // 0 at the ends, 0.5 in the middle
  return ease.inOutCubic(clamp(P * (1 + spread) - d * 2 * spread));
}

export function bgGlow(ctx, x, y, r, col, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
}
