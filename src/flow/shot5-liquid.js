// Shot 5 (30–36 s): liquid. Metaballs (SVG goo filter) orbit, merge on "zusammenkommt",
// stretch into a liquid pill that carries "Flow." and finally split into three drops
// that harden into the three cards of the next shot.
import { W, H, TAU, clamp, lerp, ease, seg, spring, hash1, noise2, C, rgba, mix } from '../engine/core.js';
import { F, font, fillBg, glyphs, roundRect } from '../engine/draw.js';
import { spoken, wordAt, bgGlow } from './common.js';

let layer = null, lctx = null;
export const CARD = { w: 360, h: 480, r: 40, xs: [530, 960, 1390], y: 560 };

const SAT = Array.from({ length: 7 }, (_, i) => ({
  a0: (i / 7) * TAU, rad: 250 + hash1(i * 4.1) * 160, spd: (0.5 + hash1(i * 2.7) * 0.6) * (i % 2 ? 1 : -1), r: 34 + hash1(i * 9.3) * 40,
}));

function blobs(t) {
  const out = [];
  const tZ = wordAt('l6', 3); // "zusammenkommt,"
  const tF = wordAt('l6', 5); // "Flow."
  const merge = (i) => ease.inOutCubic(seg(t, tZ - 0.1 + i * 0.05, tZ + 0.55 + i * 0.05));
  const grow = seg(t, 30.0, 30.35, ease.outBack);
  const pill = ease.snappy(seg(t, tF - 0.12, tF + 0.35));
  const split = ease.inOutCubic(seg(t, 34.0, 35.0));
  const card = ease.snappy(seg(t, 34.8, 35.7));
  const breathe = 1 + 0.05 * Math.sin(t * 5);
  // main body: one circle that becomes a capsule (row of circles) and then three cards
  const mainR = lerp(140, 190, seg(t, tZ, tZ + 0.7)) * breathe;
  if (split <= 0) {
    const n = 9;
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1) - 0.5;
      const x = 960 + u * 980 * pill;
      const r = lerp(mainR, 175 + 16 * Math.sin(t * 6 + k), pill) * (1 - 0.12 * Math.abs(u) * pill * 2);
      out.push({ x, y: 540 + 18 * Math.sin(t * 4 + k * 0.9) * pill, r: r * grow });
    }
  } else {
    for (let c = 0; c < 3; c++) {
      const cx = lerp(960 + (c - 1) * 320, CARD.xs[c], split), cy = lerp(540, CARD.y, split);
      out.push({ x: cx, y: cy, r: lerp(170, 150, split), card, c });
    }
  }
  // satellites
  for (const [i, s] of SAT.entries()) {
    const m = merge(i);
    if (m >= 1) continue;
    const ang = s.a0 + (t - 30) * s.spd;
    const kiss = 1 - 0.35 * Math.max(0, Math.sin((t - 30) * Math.PI * 2 + i)); // beat-ish breathing towards the core
    const rad = s.rad * kiss * (1 - m);
    out.push({ x: 960 + Math.cos(ang) * rad * 1.35, y: 540 + Math.sin(ang) * rad * 0.8, r: s.r * seg(t, 30.0 + i * 0.04, 30.4 + i * 0.04, ease.outBack) * (1 - m * 0.4) });
  }
  return out;
}

export default {
  start: 30,
  end: 36,
  hud: C.paper,
  init() {
    layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    lctx = layer.getContext('2d');
  },
  draw(ctx, t) {
    fillBg(ctx, C.ink);
    bgGlow(ctx, 960, 560, 900, C.orange, 0.1 + 0.12 * Math.sin(t * 2) ** 2);

    // goo layer
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, W, H);
    lctx.filter = 'url(#goo)';
    lctx.fillStyle = '#fff';
    for (const b of blobs(t)) {
      lctx.beginPath();
      if (b.card) {
        const w = lerp(b.r * 2, CARD.w, b.card), h = lerp(b.r * 2, CARD.h, b.card);
        roundRect(lctx, b.x - w / 2, b.y - h / 2, w, h, lerp(b.r, CARD.r + 10, b.card));
      } else lctx.arc(b.x, b.y, Math.max(0, b.r), 0, TAU);
      lctx.fill();
    }
    lctx.filter = 'none';
    // paint the liquid: gradient body + specular highlight, cooling to paper as it becomes cards
    const cool = seg(t, 35.0, 35.9);
    lctx.globalCompositeOperation = 'source-in';
    const g = lctx.createLinearGradient(0, 300, 0, 800);
    g.addColorStop(0, rgba(mix(mix(C.orange, C.pink, 0.35), C.paper, cool)));
    g.addColorStop(0.55, rgba(mix(C.orange, C.paper, cool)));
    g.addColorStop(1, rgba(mix(mix(C.orange, C.violet, 0.45), C.paper, cool)));
    lctx.fillStyle = g;
    lctx.fillRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'source-atop';
    const hx = 960 + 200 * Math.sin(t * 0.9), hy = 420;
    const hg = lctx.createRadialGradient(hx, hy, 0, hx, hy, 380);
    hg.addColorStop(0, `rgba(255,255,255,${0.45 * (1 - cool)})`);
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    lctx.fillStyle = hg;
    lctx.fillRect(0, 0, W, H);
    // "Flow." knocked out of the liquid
    const tF = wordAt('l6', 5);
    const fp = seg(t, tF - 0.02, tF + 0.35, ease.outExpo) * (1 - seg(t, 33.7, 34.1, ease.inExpo));
    if (fp > 0) {
      lctx.globalCompositeOperation = 'destination-out';
      lctx.fillStyle = '#000';
      font(lctx, 300, 900);
      lctx.letterSpacing = '-12px';
      lctx.textAlign = 'center';
      lctx.save();
      lctx.translate(960, 540);
      const s = lerp(0.7, 1, fp);
      lctx.scale(s, s);
      lctx.globalAlpha = fp;
      lctx.fillText('Flow.', 0, 108);
      lctx.restore();
      lctx.letterSpacing = '0px';
    }
    lctx.globalCompositeOperation = 'source-over';
    // soft shadow under the liquid, then the liquid
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 30;
    ctx.drawImage(layer, 0, 0);
    ctx.restore();

    // crisp cards fade in on top of the hardened liquid for a seamless hand-over
    const crisp = seg(t, 35.55, 35.98);
    if (crisp > 0) {
      ctx.fillStyle = rgba(C.paper, crisp);
      for (const x of CARD.xs) { roundRect(ctx, x - CARD.w / 2, CARD.y - CARD.h / 2, CARD.w, CARD.h, CARD.r); ctx.fill(); }
    }
    spoken(ctx, 'l6', t, { y: 930, size: 50, upto: 5, out: 33.6 });
  },
  blur: (t) => (t > 31.8 && t < 32.5 ? 8 : 4),
  sfx: [
    { t: 30.0, type: 'drip', gain: 0.7 },
    ...SAT.map((_, i) => ({ t: wordAt('l6', 3) + 0.35 + i * 0.05, type: 'blob', gain: 0.45, pitch: 0.8 + i * 0.09 })),
    { t: wordAt('l6', 5) - 0.12, type: 'stretchGoo', gain: 0.8 },
    { t: 34.0, type: 'blob', gain: 0.7, pitch: 0.6 },
    { t: 34.85, type: 'harden', gain: 0.7 },
  ],
};
