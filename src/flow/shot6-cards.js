// Shot 6 (36–42 s): the three drops are now cards — a tiny design system in motion:
// an easing curve, a variable-weight glyph and a wireframe cube. They flip, stack,
// and the top card flies into the lens to become the darkness of the final shot.
import { W, H, TAU, clamp, lerp, ease, seg, spring, C, rgba, mix } from '../engine/core.js';
import { F, font, fillBg, roundRect, trimPoly } from '../engine/draw.js';
import { spoken, wordAt, bgGlow } from './common.js';
import { CARD } from './shot5-liquid.js';

const BACKS = [C.orange, C.violet, C.lime];
const LABELS = ['TIMING', 'TYPO', 'RAUM'];
export const DOT_ON_CARD = 6; // radius of the dot printed on the top card's back

function front(ctx, i, t) {
  const ap = seg(t, 36.1 + i * 0.12, 36.6 + i * 0.12, ease.outExpo);
  font(ctx, 15, 700, F.mono);
  ctx.letterSpacing = '4px';
  ctx.fillStyle = rgba(C.ink, 0.6 * ap);
  ctx.fillText(`0${i + 1}`, -CARD.w / 2 + 30, -CARD.h / 2 + 46);
  ctx.fillText(LABELS[i], -CARD.w / 2 + 30, CARD.h / 2 - 32);
  ctx.letterSpacing = '0px';
  if (i === 0) {
    // easing curve + a dot riding it, looping on the bar
    const pts = [];
    for (let k = 0; k <= 60; k++) { const u = k / 60; pts.push([-120 + u * 240, 110 - ease.snappy(u) * 220]); }
    ctx.strokeStyle = rgba(C.ink, 0.15);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-120, -110, 240, 220);
    ctx.strokeStyle = rgba(C.orange);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    trimPoly(ctx, pts, 0, ap);
    const u = ((t - 36.2) % 1 + 1) % 1;
    ctx.fillStyle = rgba(C.ink);
    ctx.beginPath(); ctx.arc(-120 + u * 240, 110 - ease.snappy(u) * 220, 10 * ap, 0, TAU); ctx.fill();
  } else if (i === 1) {
    const w = 500 + 400 * Math.sin((t - 36) * 3.2);
    font(ctx, 190, Math.round(w));
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(C.ink, ap);
    ctx.fillText('Aa', 0, 66);
  } else {
    // wireframe cube
    const s = 85 * ap, a = (t - 36) * 1.2, b = 0.5 + 0.2 * Math.sin(t);
    const V = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      let X = x * Math.cos(a) + z * Math.sin(a), Z = -x * Math.sin(a) + z * Math.cos(a);
      let Y = y * Math.cos(b) - Z * Math.sin(b); Z = y * Math.sin(b) + Z * Math.cos(b);
      const p = 4 / (4 + Z);
      V.push([X * s * p, Y * s * p]);
    }
    const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    ctx.strokeStyle = rgba(C.ink);
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    for (const [p, q] of E) { ctx.beginPath(); ctx.moveTo(V[p][0], V[p][1]); ctx.lineTo(V[q][0], V[q][1]); ctx.stroke(); }
    ctx.fillStyle = rgba(C.violet);
    for (const v of V) { ctx.beginPath(); ctx.arc(v[0], v[1], 5 * ap, 0, TAU); ctx.fill(); }
  }
}

function back(ctx, i, t, top) {
  ctx.fillStyle = rgba(top ? C.ink : BACKS[i]);
  roundRect(ctx, -CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, CARD.r);
  ctx.fill();
  if (top) {
    ctx.fillStyle = rgba(C.orange);
    ctx.beginPath(); ctx.arc(0, 0, DOT_ON_CARD, 0, TAU); ctx.fill();
  } else {
    font(ctx, 220, 900);
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(C.ink, 0.9);
    ctx.fillText(String(i + 1), 0, 80);
  }
}

export function zoomScale(t) {
  // scale of the top card while it flies into the lens
  return Math.pow(7, ease.inQuart(seg(t, 40.7, 42.0)));
}

export default {
  start: 36,
  end: 42,
  hud: C.paper,
  draw(ctx, t) {
    fillBg(ctx, C.ink);
    bgGlow(ctx, 960, 560, 1000, C.violet, 0.22);
    const stack = (i) => clamp(spring(t - (39.55 + i * 0.07), { stiffness: 170, damping: 15 }), 0, 1.2);
    const order = [0, 2, 1]; // card 1 (middle) ends on top
    const z = zoomScale(t);
    for (const i of order) {
      const isTop = i === 1;
      const sp = stack(i);
      const flip = ease.inOutCubic(seg(t, 38.55 + i * 0.12, 39.15 + i * 0.12));
      const cx = lerp(CARD.xs[i], 960, sp);
      const cy = lerp(CARD.y, 560, sp) + (isTop ? 0 : (i - 1) * 6 * sp);
      const rot = lerp(0, [-0.12, 0, 0.1][i], sp);
      // idle float
      const fy = Math.sin(t * 2 + i) * 6 * (1 - sp);
      ctx.save();
      if (isTop && z > 1) {
        // fly into the lens: centre the dot, scale up, flatten the tilt
        ctx.translate(lerp(cx, 960, seg(t, 40.7, 41.2)), lerp(cy, 540, seg(t, 40.7, 41.2)));
        ctx.scale(z, z);
      } else {
        ctx.translate(cx, cy + fy);
        ctx.rotate(rot);
      }
      if (!isTop && z > 1.05) ctx.globalAlpha = clamp(1 - (z - 1) / 1.5);
      const sx = Math.cos(Math.PI * flip);
      ctx.scale(Math.abs(sx) < 0.001 ? 0.001 : Math.abs(sx), 1 + 0.04 * Math.sin(Math.PI * flip));
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 24;
      if (sx >= 0) {
        roundRect(ctx, -CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, CARD.r);
        ctx.fillStyle = rgba(C.paper);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        front(ctx, i, t);
      } else {
        back(ctx, i, t, isTop);
        ctx.shadowColor = 'transparent';
      }
      ctx.restore();
    }
    font(ctx, 72, 800);
    spoken(ctx, 'l7', t, { y: 220, size: 74, weight: 800, family: F.sans, style: 'normal', tracking: -2, out: 40.3, accent: { index: 3, family: F.serif, style: 'italic', weight: 400, size: 92, color: C.orange } });
  },
  blur: (t) => (t > 38.5 && t < 40.3 ? 6 : t > 40.7 ? 10 : 4),
  sfx: [
    ...[0, 1, 2].map((i) => ({ t: 36.1 + i * 0.12, type: 'click', gain: 0.5, pitch: 1 + i * 0.15 })),
    ...[0, 1, 2].map((i) => ({ t: 38.55 + i * 0.12, type: 'flip', gain: 0.5 })),
    ...[0, 1, 2].map((i) => ({ t: 39.6 + i * 0.07, type: 'cardSlap', gain: 0.6 })),
    { t: 40.7, type: 'zoom', gain: 0.85, dur: 1.3 },
  ],
};
