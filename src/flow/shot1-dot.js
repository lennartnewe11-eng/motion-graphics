// Shot 1 (0–6 s): a dot breathes, stretches into a line, the line becomes a travelling wave,
// and the wave wraps itself into a ring — which becomes the "O" of FLOW.
import { W, H, TAU, clamp, lerp, ease, seg, spring, C, rgba, mix } from '../engine/core.js';
import { F, fillBg } from '../engine/draw.js';
import { spoken, wordAt, sample, wrapP, ringPt, bgGlow } from './common.js';
import { flowLayout } from './shot2-type.js';

const PULSES = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

export function dotRadius(t) {
  let r = 13 * clamp(spring(t - 0.15, { stiffness: 260, damping: 12 }), 0, 1.4);
  for (const p of PULSES) { const u = t - p; if (u >= 0 && u < 0.4) r *= 1 + 0.35 * Math.exp(-u * 12); }
  return r;
}

const RING_R = 170;

export default {
  start: 0,
  end: 6,
  hud: C.paper,
  draw(ctx, t) {
    fillBg(ctx, C.ink);
    bgGlow(ctx, 960, 540, 900, C.violet, 0.12 + 0.08 * seg(t, 3.8, 5.5));

    // sonar ripples on every heartbeat
    for (const p of PULSES) {
      const u = (t - p) / 1.4;
      if (u <= 0 || u >= 1) continue;
      ctx.strokeStyle = rgba(C.paper, 0.22 * (1 - u));
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(960, 540, 14 + ease.outCubic(u) * 260, 0, TAU);
      ctx.stroke();
    }

    const tLine = wordAt('l2', 2); // "Linie."
    const L = 1150 * ease.outExpo(seg(t, tLine, tLine + 0.6)) * lerp(1, 0.38, ease.inOutCubic(seg(t, 4.9, 5.75)));
    const amp = 150 * ease.inOutCubic(seg(t, 4.25, 5.0)) * (1 - ease.inOutCubic(seg(t, 4.95, 5.6)));
    const P = seg(t, 5.1, 5.85);
    const O = flowLayout();
    const toO = ease.snappy(seg(t, 5.72, 6.0));

    if (L < 2) {
      // the dot: anticipation squash before it becomes a line
      const pre = seg(t, tLine - 0.45, tLine, ease.inOutCubic);
      const r = dotRadius(t);
      const sx = 1 + pre * 0.9, sy = 1 - pre * 0.45;
      ctx.fillStyle = rgba(C.paper);
      ctx.beginPath();
      ctx.ellipse(960, 540, r * sx, r * sy, 0, 0, TAU);
      ctx.fill();
    } else {
      const N = 320;
      const pts = sample(N, (u) => {
        const env = Math.sin(Math.PI * u);
        const lx = 960 + (u - 0.5) * 2 * L;
        const ly = 540 + amp * env * Math.sin(u * TAU * 2.5 - t * 7);
        if (P <= 0) return [lx, ly];
        const [rx, ry] = ringPt(960, 540, RING_R, u, (1 - P) * 0.6);
        const w = wrapP(P, u);
        return [lerp(lx, rx, w), lerp(ly, ry, w)];
      });
      // hand over to the O of FLOW
      const cx = lerp(960, O.cx, toO), cy = lerp(540, O.cy, toO);
      const rr = lerp(RING_R, O.r, toO);
      const sc = rr / RING_R;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);
      ctx.translate(-960, -540);
      const g = ctx.createLinearGradient(960 - L, 0, 960 + L, 0);
      const fade = seg(t, 5.5, 5.9);
      g.addColorStop(0, rgba(mix(C.orange, C.paper, fade)));
      g.addColorStop(0.5, rgba(mix(C.paper, C.paper, fade)));
      g.addColorStop(1, rgba(mix(C.violet, C.paper, fade)));
      ctx.strokeStyle = g;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = lerp(5, O.sw, toO) / sc;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      if (P >= 1) ctx.closePath();
      ctx.stroke();
      ctx.restore();
      // glowing head where the line is drawn from
      if (t < tLine + 0.6) {
        const k = 1 - seg(t, tLine + 0.2, tLine + 0.6);
        bgGlow(ctx, 960 - L, 540, 60, C.orange, 0.8 * k);
        bgGlow(ctx, 960 + L, 540, 60, C.violet, 0.8 * k);
      }
    }

    // narration
    spoken(ctx, 'l1', t, { y: 690, size: 54, out: 2.75 });
    spoken(ctx, 'l2', t, { y: 690, size: 54, out: 4.55, accent: { index: 2, color: C.orange } });
  },
  blur: (t) => (t > 3.8 && t < 4.6 ? 10 : t > 5.6 ? 8 : 4),
  sfx: [
    ...PULSES.map((p, i) => ({ t: p, type: 'heart', gain: 0.55 + i * 0.05 })),
    { t: 0.15, type: 'pop', gain: 0.5, pitch: 1.6 },
    { t: 3.45, type: 'stretch', gain: 0.5, dur: 0.42 },
    { t: 3.86, type: 'laser', gain: 0.8 },
    { t: 4.25, type: 'wobble', gain: 0.35, dur: 0.95 },
    { t: 5.1, type: 'swirl', gain: 0.5, dur: 0.8 },
    { t: 5.55, type: 'whooshUp', gain: 0.6, dur: 0.45 },
  ],
};
