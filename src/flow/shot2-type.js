// Shot 2 (6–13 s): the ring becomes the O of FLOW. Letters slam in, stretch, flip and hop on the beat.
// On "plötzlich" the word is sliced and smeared into streaks; the streaks become flowing lines,
// "Bewegung." rides the middle line as text-on-a-path, and the lines finally wrap into the tunnel's rings.
import { W, H, TAU, clamp, lerp, ease, seg, hash1, noise2, C, rgba, mix } from '../engine/core.js';
import { F, font, glyphs, fillBg } from '../engine/draw.js';
import { spoken, wordAt, wrapP, ringPt, bgGlow } from './common.js';
import { tunnelRadius } from './shot3-tunnel.js';

const SIZE = 330;
let L = null;
export function flowLayout() {
  if (L) return L;
  const c = document.createElement('canvas').getContext('2d');
  font(c, SIZE, 900);
  const tr = -0.03 * SIZE;
  const gFL = glyphs(c, 'FL', tr), gW = glyphs(c, 'W', 0);
  const capH = glyphs(c, 'F').ascent;
  const Ro = capH * 0.535, sw = capH * 0.25;
  const gap = SIZE * 0.035;
  const total = gFL.width + gap + 2 * Ro + gap + gW.width;
  const x0 = 960 - total / 2;
  const base = 540 + capH / 2;
  const letters = [
    { ch: 'F', cx: x0 + gFL.list[0].x + gFL.list[0].w / 2, w: gFL.list[0].w },
    { ch: 'L', cx: x0 + gFL.list[1].x + gFL.list[1].w / 2, w: gFL.list[1].w },
    { ch: 'O', cx: x0 + gFL.width + gap + Ro, w: 2 * Ro },
    { ch: 'W', cx: x0 + gFL.width + gap + 2 * Ro + gap + gW.width / 2, w: gW.width },
  ];
  L = { x0, total, base, capH, Ro, sw, r: Ro - sw / 2, cx: letters[2].cx, cy: base - capH / 2, letters };
  return L;
}

// per-letter transform for the beat tricks
function letterT(i, t) {
  let dx = 0, dy = 0, sx = 1, sy = 1, col = C.paper;
  const e = ease.outExpo(seg(t, 6.0 + i * 0.035, 6.42 + i * 0.035));
  if (i < 2) dx = -(1 - e) * 1300;
  if (i === 3) dx = (1 - e) * 1300;
  if (i === 2) { const u = t - 6.0; if (u > 0 && u < 0.5) { const k = 0.18 * Math.exp(-u * 10) * Math.cos(u * 30); sx += k; sy += k; } }
  // 6.5 stretch (anchored on the baseline)
  const b = Math.sin(Math.PI * seg(t, 6.5 + i * 0.02, 6.82 + i * 0.02));
  sy *= 1 + 0.5 * b; sx *= 1 - 0.18 * b;
  // 7.0 flip
  const f = ease.inOutCubic(seg(t, 7.0 + i * 0.06, 7.42 + i * 0.06));
  const c = Math.cos(TAU * f);
  sx *= c;
  if (c < 0) col = C.orange;
  // 7.5 hop
  dy -= 70 * Math.sin(Math.PI * seg(t, 7.5 + i * 0.05, 7.78 + i * 0.05));
  return { dx, dy, sx, sy, col };
}

function drawWord(ctx, t, { outline = false, alpha = 1, lift = 0, scale = 1 } = {}) {
  const Lay = flowLayout();
  font(ctx, SIZE, 900);
  ctx.textAlign = 'center';
  Lay.letters.forEach((lt, i) => {
    const T = letterT(i, t);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(960, Lay.base - lift);
    ctx.scale(scale, scale);
    ctx.translate(-960, 0);
    ctx.translate(lt.cx + T.dx, T.dy);
    ctx.scale(T.sx, T.sy);
    const col = rgba(T.col);
    if (lt.ch === 'O') {
      ctx.strokeStyle = col;
      ctx.lineWidth = outline ? 3 : Lay.sw;
      const chase = seg(t, 7.5, 8.0, ease.inOutCubic);
      const gapA = Math.sin(Math.PI * chase) * 0.85;
      ctx.beginPath();
      ctx.arc(0, -Lay.capH / 2, outline ? Lay.Ro : Lay.r, chase * TAU * 1.5 + gapA, chase * TAU * 1.5 + TAU);
      ctx.stroke();
    } else if (outline) {
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.strokeText(lt.ch, 0, 0);
    } else {
      ctx.fillStyle = col;
      ctx.fillText(lt.ch, 0, 0);
    }
    ctx.restore();
  });
}

let layer = null, lctx = null;
const N_LINES = 11;
const LINE_COLS = [C.orange, C.violet, C.lime, C.paper];
const lineCol = (k) => LINE_COLS[k % 4];

function waveY(k, x, t, spread, amp) {
  const Lay = flowLayout();
  const y0 = Lay.base - Lay.capH + ((k + 0.5) / N_LINES) * Lay.capH;
  const yW = 540 + (k - (N_LINES - 1) / 2) * 62;
  return lerp(y0, yW, spread) + amp * Math.sin(x * 0.0042 - t * 3.0 + k * 0.42) * (0.6 + 0.4 * Math.sin(x * 0.0011 + k));
}

export default {
  start: 6,
  end: 13,
  hud: C.paper,
  init() {
    layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    lctx = layer.getContext('2d');
  },
  draw(ctx, t) {
    fillBg(ctx, C.ink);
    bgGlow(ctx, 960, 540, 1000, C.violet, 0.2);
    const Lay = flowLayout();
    const tS = wordAt('l3', 1); // "plötzlich"
    const tB = wordAt('l3', 4); // "Bewegung."

    // small shake on the slam
    const u = t - 6.0;
    if (u > 0 && u < 0.4) ctx.translate(noise2(u * 50, 3) * 16 * Math.exp(-u * 10), noise2(9, u * 50) * 16 * Math.exp(-u * 10));

    if (t < tS) {
      // echoes emitted on each beat trick
      for (const tb of [6.5, 7.0, 7.5]) {
        const q = seg(t, tb, tb + 0.6);
        if (q > 0 && q < 1) drawWord(ctx, t, { outline: true, alpha: 0.5 * (1 - q), lift: ease.outCubic(q) * 140, scale: 1 + 0.12 * q });
      }
      drawWord(ctx, t);
    } else {
      // slice & smear
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.clearRect(0, 0, W, H);
      drawWord(lctx, tS);
      const strips = 12;
      const top = Math.round(Lay.base - Lay.capH - 20), hh = Math.ceil((Lay.capH + 40) / strips);
      for (let k = 0; k < strips; k++) {
        const q = ease.inQuart(seg(t, tS + k * 0.022, tS + 0.6 + k * 0.022));
        if (q >= 1) continue;
        const shift = -q * (2300 + 600 * hash1(k * 7.3));
        const sxF = 1 + 7 * q;
        ctx.globalAlpha = 1 - q * 0.4;
        if (q <= 0) { ctx.drawImage(layer, 0, top + k * hh, W, hh, 0, top + k * hh, W, hh); continue; }
        ctx.drawImage(layer, Lay.x0 - 40, top + k * hh, Lay.total + 80, hh, Lay.x0 - 40 + shift, top + k * hh, (Lay.total + 80) * sxF, hh);
      }
      ctx.globalAlpha = 1;

      // flowing lines emerge from the smear
      const spread = ease.inOutCubic(seg(t, tS + 0.35, tS + 1.1));
      const amp = 78 * seg(t, tS + 0.5, tS + 1.3) * (1 - 0.7 * seg(t, 11.7, 12.3));
      const P = seg(t, 12.0, 12.98);
      ctx.lineCap = 'round';
      for (let k = 0; k < N_LINES; k++) {
        const draw = ease.outExpo(seg(t, tS + 0.18 + k * 0.02, tS + 0.9 + k * 0.02));
        if (draw <= 0) continue;
        const x1 = W + 60, x0 = lerp(W + 60, -60, draw);
        const R = tunnelRadius(k, 13.0);
        ctx.strokeStyle = rgba(lineCol(k), 0.9);
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        const N = 220;
        for (let i = 0; i <= N; i++) {
          const uu = i / N;
          const x = lerp(x0, x1, uu);
          let px = x, py = waveY(k, x, t, spread, amp);
          if (P > 0) {
            const [rx, ry] = ringPt(960, 540, R, uu, k * 0.3 + (1 - P) * 0.8);
            const w = wrapP(P, uu, 1.2);
            px = lerp(px, rx, w); py = lerp(py, ry, w);
          }
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        if (P >= 1) ctx.closePath();
        ctx.stroke();
      }

      // "Bewegung." as text on a path, riding the middle line
      const enter = ease.outExpo(seg(t, tB - 0.05, tB + 0.75));
      const exit = ease.inExpo(seg(t, 11.3, 12.0));
      if (enter > 0 && exit < 1) {
        font(ctx, 150, 900);
        const word = 'Bewegung.';
        const g = glyphs(ctx, word, -4);
        const start = lerp(2050, 960 - g.width / 2, enter) - (t - tB) * 40 - exit * 2600;
        ctx.fillStyle = rgba(C.paper);
        ctx.textAlign = 'center';
        for (const gl of g.list) {
          const x = start + gl.x + gl.w / 2;
          const y = waveY(5, x, t, spread, amp);
          const y2 = waveY(5, x + 4, t, spread, amp);
          const ang = Math.atan2(y2 - y, 4);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(ang);
          ctx.fillText(gl.ch, 0, 52);
          ctx.restore();
        }
      }
    }

    spoken(ctx, 'l3', t, { y: 250, size: 26, family: F.mono, style: 'normal', weight: 500, tracking: 6, upto: 4, upper: true, out: 10.9, color: C.paper });
  },
  blur: (t) => (t < 6.5 ? 10 : t > 8.1 && t < 9.2 ? 10 : 5),
  sfx: [
    { t: 6.0, type: 'impact', gain: 0.9 },
    { t: 6.02, type: 'whoosh', gain: 0.5, pan: -0.5, dur: 0.35 },
    { t: 6.06, type: 'whoosh', gain: 0.45, pan: 0.5, dur: 0.35 },
    { t: 6.5, type: 'boing', gain: 0.45 },
    { t: 7.0, type: 'flip', gain: 0.6 },
    ...[0, 1, 2, 3].map((i) => ({ t: 7.5 + i * 0.05, type: 'blip', gain: 0.35, pitch: 1.2 + i * 0.2 })),
    { t: 8.2, type: 'slice', gain: 0.9 },
    { t: 8.98, type: 'swish', gain: 0.5, pan: 0.6 },
    { t: 11.3, type: 'whoosh', gain: 0.5, pan: -0.6, dur: 0.6 },
    { t: 12.0, type: 'swirl', gain: 0.55, dur: 1.0 },
  ],
};
