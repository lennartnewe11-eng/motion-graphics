// 03 — Shape Layers & Morphing: polar shape morphs on the beat, repeaters, trim paths,
// bursts, a ripple-staggered grid and a phyllotaxis choreography.
import { W, H, TAU, clamp, lerp, ease, seg, spring, C, rgba, mix } from '../engine/core.js';
import { fillBg, morphPath, shapeAt, trimArc, burst } from '../engine/draw.js';

const SEQ = [[-99, 'circle'], [0.5, 'squircle'], [1.0, 'triangle'], [1.5, 'star'], [2.0, 'flower']];
const COLS = { circle: C.ink, squircle: C.orange, triangle: C.violet, star: C.ink, flower: C.orange };
const GRID_SEQ = ['flower', 'circle', 'triangle', 'squircle', 'star', 'hex', 'circle'];
const PAL = [C.ink, C.orange, C.violet];
const GOLD = 137.50776 * Math.PI / 180;

// grid cells, sorted by distance from the centre
const cells = [];
for (let j = -3; j <= 3; j++) for (let i = -5; i <= 5; i++) {
  cells.push({ i, j, x: 960 + i * 160, y: 540 + j * 140, d: Math.hypot(i, j * 1.15) });
}
cells.sort((a, b) => a.d - b.d);
cells.forEach((c, m) => {
  c.m = m;
  const a = m * GOLD, r = 44 * Math.sqrt(m + 0.6);
  c.px = Math.cos(a) * r; c.py = Math.sin(a) * r;
  c.col = PAL[Math.floor(c.d * 0.9) % 3];
});

function rotAt(lt) {
  let r = 0;
  for (let k = 1; k < SEQ.length; k++) r += ease.inOutBack(clamp((lt - SEQ[k][0]) / 0.42)) * (Math.PI / 2);
  return r;
}

function hero(ctx, lt) {
  const { a, b, p } = shapeAt(lt, SEQ, 0.42);
  let pulse = 0;
  for (const tt of [0, 0.5, 1.0, 1.5, 2.0]) {
    const u = lt - tt;
    if (u >= 0 && u < 0.6) pulse += 0.16 * Math.exp(-u * 9) * Math.cos(u * 22);
  }
  const col = p > 0 ? COLS[b] : COLS[a]; // colour cuts on the beat
  return { a, b, p, pulse, col, rot: rotAt(lt) };
}

function ornaments(ctx, lt, fade) {
  if (lt < -0.2 || fade >= 1) return;
  const a = 1 - fade;
  ctx.save();
  ctx.globalAlpha = a;
  // dashed orbit
  const o = seg(lt, 0.0, 0.5, ease.outExpo);
  ctx.strokeStyle = rgba(C.ink, 0.5);
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 12]);
  ctx.lineDashOffset = -lt * 60;
  trimArc(ctx, 960, 540, 330, 0, o, -Math.PI / 2 + lt * 0.4);
  ctx.setLineDash([]);
  // repeater: 12 dots on the orbit, pulsing in sequence
  for (let k = 0; k < 12; k++) {
    const ap = seg(lt, 0.1 + k * 0.03, 0.45 + k * 0.03, ease.outBack);
    if (ap <= 0) continue;
    const ang = (k / 12) * TAU + lt * 0.4;
    const pul = 0.5 + 0.5 * Math.sin(lt * 9 - k * 0.6);
    ctx.fillStyle = rgba(k % 3 === 0 ? C.orange : C.ink);
    ctx.beginPath();
    ctx.arc(960 + Math.cos(ang) * 330, 540 + Math.sin(ang) * 330, (5 + 5 * pul) * ap, 0, TAU);
    ctx.fill();
  }
  // trim path ring, re-drawn every beat
  ctx.strokeStyle = rgba(C.violet);
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const bt = ((lt % 0.5) + 0.5) % 0.5;
  const s0 = ease.inOutCubic(clamp((bt - 0.12) / 0.36)), s1 = ease.outExpo(clamp(bt / 0.3));
  if (lt > 0) trimArc(ctx, 960, 540, 262, s0, s1, -Math.PI / 2 + Math.floor(lt / 0.5) * 1.3);
  // registration ticks
  ctx.strokeStyle = rgba(C.ink, 0.8);
  ctx.lineWidth = 2;
  for (let k = 0; k < 4; k++) {
    const ang = k * Math.PI / 2 + Math.PI / 4 - lt * 0.6;
    const r = 420 * o;
    const x = 960 + Math.cos(ang) * r, y = 540 + Math.sin(ang) * r;
    ctx.beginPath();
    ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10);
    ctx.stroke();
  }
  ctx.restore();
  for (const tt of [0, 0.5, 1.0, 1.5, 2.0]) {
    burst(ctx, 960, 540, (lt - tt) / 0.55, { n: 10, r0: 230, r1: 390, width: 7, color: rgba(tt === 1.0 ? C.orange : C.ink, a), rot: tt * 2 });
  }
}

export default {
  id: 'shapes',
  label: 'Shape Layers & Morphing',
  num: '03',
  start: 12,
  end: 18,
  hud: C.ink,
  draw(ctx, lt) {
    fillBg(ctx, C.paper);
    const toGrid = seg(lt, 2.05, 2.55, ease.snappy);
    ornaments(ctx, lt, seg(lt, 1.9, 2.3, ease.inCubic));

    if (toGrid <= 0) {
      const h = hero(ctx, lt);
      ctx.fillStyle = rgba(h.col);
      morphPath(ctx, 960, 540, 175 * (1 + h.pulse), h.a, h.b, h.p, h.rot, lt);
      ctx.fill();
      return;
    }

    // ---- grid / phyllotaxis choreography
    const toSpiral = (c) => seg(lt, 4.0 + c.m * 0.005, 4.6 + c.m * 0.005, ease.snappy);
    const collapse = (c) => seg(lt, 5.15 + (76 - c.m) * 0.004, 5.6 + (76 - c.m) * 0.004, ease.inExpo);
    const spin = (lt - 4.0) * 0.9 + ease.inOutCubic(seg(lt, 4.0, 5.6)) * 2.2;
    const ripple = seg(lt, 2.9, 3.2) * (1 - seg(lt, 3.9, 4.2));
    for (const c of cells) {
      const isHero = c.m === 0;
      const ap = isHero ? 1 : clamp(spring(lt - (2.12 + c.d * 0.045), { stiffness: 260, damping: 15 }), 0, 1.3);
      if (ap <= 0.001) continue;
      // morph steps rippling out from the centre
      let step = 0, sp = 0;
      for (let n = 0; n < GRID_SEQ.length - 1; n++) {
        const tt = 2.6 + n * 0.5 + c.d * 0.07;
        if (lt >= tt) { step = n; sp = ease.inOutBack(clamp((lt - tt) / 0.4)); }
      }
      const sa = GRID_SEQ[step], sb = GRID_SEQ[Math.min(step + 1, GRID_SEQ.length - 1)];
      const p2 = toSpiral(c);
      const k = collapse(c);
      // position
      let gx = c.x, gy = c.y;
      if (isHero) {
        gx = lerp(960, c.x, toGrid); gy = lerp(540, c.y, toGrid);
      }
      const sa2 = Math.cos(spin), sb2 = Math.sin(spin);
      const sx = 960 + (c.px * sa2 - c.py * sb2) * (1 - k);
      const sy = 540 + (c.px * sb2 + c.py * sa2) * (1 - k);
      const x = lerp(gx, sx, p2), y = lerp(gy, sy, p2);
      // size
      let r = 50 * (1 + 0.32 * ripple * Math.sin(c.d * 1.1 - lt * 9));
      if (isHero) {
        const h = hero(ctx, Math.min(lt, 2.1));
        r = lerp(175 * (1 + h.pulse), r, toGrid);
      }
      r = lerp(r, 30 + 10 * (1 - c.m / 77), p2) * (1 - k * 0.85);
      if (!isHero) r *= ap;
      const rot = step * (Math.PI / 2) + sp * (Math.PI / 2) + p2 * c.m * 0.3;
      let col = isHero ? mix(C.orange, c.col, toGrid) : c.col;
      ctx.fillStyle = rgba(col);
      const shapeA = isHero && toGrid < 1 ? 'flower' : sa;
      morphPath(ctx, x, y, r, p2 > 0.5 ? 'circle' : shapeA, p2 > 0 ? 'circle' : sb, p2 > 0 ? Math.max(p2, sp * (1 - p2)) : sp, rot, lt, 72);
      ctx.fill();
    }
    // final: dense dot expands into the next scene's darkness
    const ex = seg(lt, 5.62, 6.0, ease.inExpo);
    if (lt > 5.45) {
      const r = lerp(18 * seg(lt, 5.45, 5.62, ease.outBack), 1200, ex);
      ctx.fillStyle = rgba(C.ink);
      ctx.beginPath();
      ctx.arc(960, 540, r, 0, TAU);
      ctx.fill();
    }
  },
  blur: (lt) => (lt > 5.5 ? 8 : 0),
  sfx: [
    { t: 0.0, type: 'pop', gain: 0.8, pitch: 0.8 },
    { t: 0.5, type: 'morph', gain: 0.55, pitch: 1.0 },
    { t: 1.0, type: 'morph', gain: 0.55, pitch: 1.19 },
    { t: 1.5, type: 'morph', gain: 0.55, pitch: 1.33 },
    { t: 2.0, type: 'morph', gain: 0.55, pitch: 1.5 },
    ...Array.from({ length: 14 }, (_, i) => ({ t: 2.12 + i * 0.028, type: 'tick', gain: 0.32 - i * 0.015, pitch: 1 + i * 0.05 })),
    { t: 2.6, type: 'pluckFx', gain: 0.35, pitch: 1.0 },
    { t: 3.1, type: 'pluckFx', gain: 0.35, pitch: 1.12 },
    { t: 3.6, type: 'pluckFx', gain: 0.35, pitch: 1.26 },
    { t: 4.0, type: 'swirl', gain: 0.6, dur: 0.9 },
    { t: 5.12, type: 'suck', gain: 0.6, dur: 0.5 },
    { t: 5.62, type: 'whooshUp', gain: 0.7, dur: 0.38 },
  ],
};
