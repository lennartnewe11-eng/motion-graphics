// Kinetic typography for the shorts (style guide §1, §2): word-synced pop-ons, grotesk <-> italic didone
// mix, per-glyph gestures. Content words: tight black grotesk. Function words: italic didone.
import { clamp, lerp, ease, noise3, rgba, spring } from '../../engine/core.js';
import { glyphs } from '../../engine/draw.js';
import { P } from './collage.js';

export const ROLE = {
  G: { fam: 'Inter Tight', weight: 900, style: 'normal', track: -0.045 },  // content words
  G8: { fam: 'Inter Tight', weight: 800, style: 'normal', track: -0.035 },
  D: { fam: 'Bodoni Moda', weight: 500, style: 'italic', track: -0.01 },   // function words
  DB: { fam: 'Bodoni Moda', weight: 800, style: 'italic', track: -0.02 },
  T: { fam: 'Special Elite', weight: 400, style: 'normal', track: 0.02 },  // 1919 typewriter / telegram
  H: { fam: 'Caveat', weight: 700, style: 'normal', track: 0 },            // second voice, handwriting
  A: { fam: 'Anton', weight: 400, style: 'normal', track: 0.0 },           // format-filling numbers
  N: { fam: 'Old Standard TT', weight: 700, style: 'normal', track: 0 },   // newsprint
};
export const FONTS = [
  '900 40px "Inter Tight"', '800 40px "Inter Tight"', 'italic 500 40px "Bodoni Moda"', 'italic 800 40px "Bodoni Moda"',
  '400 40px "Special Elite"', '700 40px Caveat', '400 40px Anton', '700 40px "Old Standard TT"', '400 40px "League Gothic"',
];

export function setFont(ctx, role, size) {
  const r = typeof role === 'string' ? ROLE[role] : role;
  ctx.font = `${r.style} ${r.weight} ${size}px "${r.fam}"`;
  ctx.letterSpacing = (r.track * size).toFixed(2) + 'px';
  return r;
}
export function measure(ctx, text, role, size) {
  setFont(ctx, role, size);
  const m = ctx.measureText(text);
  const r = typeof role === 'string' ? ROLE[role] : role;
  return { w: m.width - r.track * size, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent };
}

// pop-on with a short overshoot (3–6 frames), 0 before t0
export const pop = (t, t0, k = 1) => (t < t0 ? 0 : spring(t - t0, { stiffness: 900 * k, damping: 26 * Math.sqrt(k) }));
// permanent micro-life (style guide 1.1: nothing stands still)
export const breathe = (t, seed, amt = 1) => ({
  r: noise3(t * 0.4, seed, 1) * 0.02 * amt,
  s: 1 + noise3(t * 0.35, seed, 2) * 0.012 * amt,
  dx: noise3(t * 0.3, seed, 3) * 3 * amt,
  dy: noise3(t * 0.3, seed, 4) * 3 * amt,
});

// A row of words, laid out centred on cx. items: { text, role, size, at, color, alpha, draw(ctx, t, box) , gap }
// Words appear hard on their spoken time with a tiny overshoot; everything breathes.
export function row(ctx, t, items, cx, y, o = {}) {
  const gap = o.gap ?? 0.26;
  const boxes = items.map((it) => ({ ...it, m: measure(ctx, it.text, it.role || 'G', it.size) }));
  let total = 0;
  boxes.forEach((b, i) => { total += b.m.w + (i ? (b.gapBefore ?? gap * Math.min(b.size, boxes[i - 1].size)) : 0); });
  let x = o.align === 'left' ? cx : o.align === 'right' ? cx - total : cx - total / 2;
  const out = [];
  boxes.forEach((b, i) => {
    if (i) x += b.gapBefore ?? gap * Math.min(b.size, boxes[i - 1].size);
    const box = { x, y, w: b.m.w, asc: b.m.asc, desc: b.m.desc, cx: x + b.m.w / 2, size: b.size };
    out.push(box);
    const p = b.at === undefined ? 1 : pop(t, b.at);
    if (p > 0 && (b.alpha ?? 1) > 0) {
      const br = breathe(t, (o.seed || 1) * 13 + i, o.breathe ?? 1);
      ctx.save();
      ctx.translate(box.cx + br.dx + (b.dx || 0), y + br.dy + (b.dy || 0) - b.m.asc * 0.35);
      ctx.rotate(br.r + (b.rot || 0));
      const sc = (b.at === undefined ? 1 : lerp(0.2, 1, p)) * br.s * (b.scale || 1);
      ctx.scale(sc, sc);
      ctx.translate(-b.m.w / 2, b.m.asc * 0.35);
      ctx.globalAlpha *= (b.alpha ?? 1) * clamp(p * 4);
      if (b.draw) b.draw(ctx, t, { ...box, x: 0, y: 0, cx: b.m.w / 2 });
      else {
        setFont(ctx, b.role || 'G', b.size);
        ctx.fillStyle = rgba(b.color || P.ink);
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(b.text, 0, 0);
      }
      ctx.restore();
    }
    x += b.m.w;
  });
  ctx.letterSpacing = '0px';
  return out;
}

// Glyph-level drawing with a per-letter transform: fn(i, n, g) -> { dx, dy, sx, sy, rot, alpha, color, role, size }
export function letters(ctx, text, x, y, role, size, fn, { align = 'left', color = P.ink } = {}) {
  const r = setFont(ctx, role, size);
  ctx.letterSpacing = '0px';
  const g = glyphs(ctx, text, r.track * size);
  let ox = align === 'center' ? x - g.width / 2 : align === 'right' ? x - g.width : x;
  for (const gl of g.list) {
    if (gl.ch === ' ') continue;
    const o = fn ? fn(gl.i, g.list.length, gl) : {};
    if (!o || o.alpha === 0) continue;
    ctx.save();
    ctx.translate(ox + gl.x + gl.w / 2 + (o.dx || 0), y + (o.dy || 0));
    if (o.rot) ctx.rotate(o.rot);
    if (o.sx || o.sy) ctx.scale(o.sx ?? 1, o.sy ?? 1);
    ctx.globalAlpha *= o.alpha ?? 1;
    if (o.role) setFont(ctx, o.role, o.size || size); else setFont(ctx, role, size);
    ctx.letterSpacing = '0px';
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(o.color || color);
    ctx.fillText(gl.ch, 0, 0);
    ctx.restore();
  }
  ctx.letterSpacing = '0px';
  return { x: ox, w: g.width, list: g.list, asc: g.ascent, desc: g.descent };
}

// Typewriter: characters appear one per `cps` from t0 (used for 1919 telegram/date text)
export function typed(ctx, text, x, y, t, t0, { cps = 22, size = 48, color = P.ink, align = 'left', cursor = true } = {}) {
  const n = clamp(Math.floor((t - t0) * cps), 0, text.length);
  if (t < t0) return 0;
  setFont(ctx, 'T', size);
  ctx.fillStyle = rgba(color);
  const full = ctx.measureText(text).width;
  const sx = align === 'center' ? x - full / 2 : x;
  ctx.textAlign = 'left';
  ctx.fillText(text.slice(0, n), sx, y);
  if (cursor && n < text.length && Math.floor(t * 6) % 2 === 0) {
    const w = ctx.measureText(text.slice(0, n)).width;
    ctx.fillRect(sx + w + 4, y - size * 0.75, size * 0.08, size * 0.9);
  }
  ctx.letterSpacing = '0px';
  return n;
}

// Handwritten note (second voice): written on with a sliding reveal mask
export function hand(ctx, text, x, y, t, t0, { size = 64, color = P.ink, dur = 0.5, rot = -0.06, align = 'center' } = {}) {
  if (t < t0) return;
  const p = ease.outCubic(clamp((t - t0) / dur));
  setFont(ctx, 'H', size);
  const w = ctx.measureText(text).width;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot + noise3(Math.floor(t * 8), 3, 1) * 0.008);
  const ox = align === 'center' ? -w / 2 : align === 'right' ? -w : 0;
  ctx.beginPath();
  ctx.rect(ox - 10, -size * 1.2, (w + 20) * p, size * 1.8);
  ctx.clip();
  ctx.fillStyle = rgba(color);
  ctx.fillText(text, ox, 0);
  ctx.restore();
}
