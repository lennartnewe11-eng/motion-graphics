// Shot 3 (13–22 s): the wrapped lines are the first rings of a tunnel. The camera flies through,
// rings morph shape on the beat (a wave travelling down the tunnel), words fly past, then light.
import { W, H, TAU, clamp, lerp, ease, seg, kf, hash1, C, rgba, mix } from '../engine/core.js';
import { F, font, fillBg, SHAPES } from '../engine/draw.js';
import { wordAt, bgGlow } from './common.js';

const FOC = 900, RT = 5, DZ = 5.9;
const COLS = [C.orange, C.violet, C.lime, C.paper];
const SEQ = ['circle', 'hex', 'triangle', 'squircle', 'flower', 'diamond', 'circle'];

export const camZ = (t) => kf(t, [[13, -5], [14, -2.5, ease.inQuad], [20, 52, ease.linear], [21.95, 150, ease.inCubic]]);
export function tunnelRadius(k, t) { return (FOC * RT) / (k * DZ - camZ(t)); }

function vanish(t) {
  const s = seg(t, 13.2, 14.5, ease.inOutCubic);
  return [960 + 70 * Math.sin((t - 13) * 0.8) * s, 540 + 40 * Math.sin((t - 13) * 1.1) * s];
}

function shapeFor(tau) {
  if (tau < 14) return { a: 'circle', b: 'circle', p: 0 };
  const n = Math.floor((tau - 14) / 0.5);
  const p = ease.inOutBack(clamp(((tau - 14) % 0.5) / 0.3));
  return { a: SEQ[n % SEQ.length], b: SEQ[(n + 1) % SEQ.length], p };
}

function beatPulse(t) {
  if (t < 14) return 0;
  const u = (t - 14) % 0.5;
  return Math.exp(-u * 9);
}

const WORDS = [
  { i: 0, text: 'Rhythmus.', col: C.paper },
  { i: 1, text: 'Spannung.', col: C.paper },
  { i: 2, text: 'Tiefe.', col: C.orange },
];

export default {
  start: 13,
  end: 22,
  hud: C.paper,
  draw(ctx, t) {
    fillBg(ctx, C.ink);
    const [vx, vy] = vanish(t);
    const zc = camZ(t);
    const light = seg(t, 19.8, 21.9, ease.inCubic);
    bgGlow(ctx, vx, vy, 700, C.violet, 0.25 + 0.3 * seg(t, 14, 15));
    bgGlow(ctx, vx, vy, 120 + 900 * light, C.paper, 0.15 + 0.85 * light);

    const twist = seg(t, 14, 16, ease.inOutCubic) + seg(t, 18, 20, ease.inOutCubic);
    const thin = seg(t, 13.0, 13.6);
    const pulse = beatPulse(t);

    // speed streaks
    const streak = seg(t, 13.6, 14.5);
    if (streak > 0) {
      ctx.lineCap = 'round';
      for (let s = 0; s < 140; s++) {
        const a = hash1(s * 3.1) * TAU, rad = 3.5 + hash1(s * 7.7) * 7;
        const period = 70;
        const z = ((hash1(s * 1.9) * period - zc) % period + period) % period + 1.5;
        const len = 2 + 10 * seg(t, 19.5, 21.8);
        const p0 = [vx + Math.cos(a) * rad * FOC / z, vy + Math.sin(a) * rad * FOC / z];
        const p1 = [vx + Math.cos(a) * rad * FOC / (z + len), vy + Math.sin(a) * rad * FOC / (z + len)];
        ctx.strokeStyle = rgba(C.paper, 0.35 * streak * clamp(1 - z / period));
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      }
    }

    // rings, far to near
    const kNear = Math.max(0, Math.ceil((zc + 0.6) / DZ));
    const kFar = kNear + 16;
    ctx.lineJoin = 'round';
    for (let k = kFar; k >= kNear; k--) {
      const d = k * DZ - zc;
      if (d < 0.6) continue;
      const R = (FOC * RT) / d;
      const fogA = clamp(1 - (d - 45) / 45) * (k <= 10 ? 1 : seg(t, 13.0 + (k - 10) * 0.08, 13.6 + (k - 10) * 0.08));
      if (fogA <= 0) continue;
      const near = clamp(1 - (d - 1) / 4); // fade when passing the camera
      const { a, b, p } = shapeFor(t - d * 0.012);
      const rot = k * 0.3 + twist * (k * 0.22 + t * 0.6);
      const col = mix(COLS[k % 4], C.paper, light * 0.8);
      ctx.strokeStyle = rgba(col, fogA * (1 - near * 0.7));
      const wPersp = (0.42 * FOC) / d * (1 + pulse * 0.9 * clamp(1 - d / 40));
      ctx.lineWidth = lerp(3.2, wPersp, thin);
      ctx.beginPath();
      const N = 120;
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * TAU;
        const rr = R * lerp(SHAPES[a](th, t), SHAPES[b](th, t), p);
        const x = vx + Math.cos(th + rot + Math.PI) * rr;
        const y = vy + Math.sin(th + rot + Math.PI) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // narration words fly towards the camera
    for (const w of WORDS) {
      const ts = wordAt('l4', w.i);
      if (t < ts - 0.05) continue;
      const zw = camZ(ts) + 10;
      const d = zw - zc;
      if (d < 0.8) continue;
      const s = 8 / d;
      const a = seg(t, ts - 0.05, ts + 0.2) * clamp((d - 1.2) / 3.5);
      font(ctx, 190, 900);
      ctx.save();
      ctx.translate(vx, vy);
      ctx.scale(s, s);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(w.col);
      ctx.textAlign = 'center';
      ctx.letterSpacing = '-6px';
      ctx.fillText(w.text, 0, 68);
      ctx.restore();
    }

    const white = seg(t, 21.55, 22.0, ease.inCubic);
    if (white > 0) { ctx.fillStyle = rgba(C.paper, white); ctx.fillRect(0, 0, W, H); }
  },
  blur: (t) => (t > 19.5 ? 10 : 6),
  sfx: [
    { t: 13.05, type: 'air', gain: 0.6, dur: 1.4 },
    { t: 14.0, type: 'impact', gain: 0.6 },
    ...[0, 1, 2].map((i) => ({ t: 15.06 + [0, 0.94, 1.75][i], type: 'passby', gain: 0.55, pan: [-0.5, 0.5, 0][i] })),
    { t: 18.0, type: 'swirl', gain: 0.45, dur: 2.0 },
    { t: 19.8, type: 'riser', gain: 0.9, dur: 2.0 },
    { t: 21.5, type: 'suck', gain: 0.6, dur: 0.5 },
  ],
};
