// Shot 7 (42–50 s): the dot from the card becomes the ball of the mark, the ring draws itself,
// "Claude." lands exactly on the spoken word, then everything folds back into the first dot.
import { W, H, TAU, clamp, lerp, ease, seg, spring, C, rgba } from '../engine/core.js';
import { F, font, fillBg, glyphs, trimArc, burst, ball } from '../engine/draw.js';
import { spoken, wordAt, bgGlow } from './common.js';
import { DOT_ON_CARD } from './shot6-cards.js';

const RING_R = 112, RING_W = 42, BALL_R = 34;
const START_R = DOT_ON_CARD * 7;

function markCenter(t) {
  const m = ease.snappy(seg(t, wordAt('l8', 2) - 0.1, wordAt('l8', 2) + 0.5));
  const back = ease.inOutCubic(seg(t, 47.3, 48.1));
  return [lerp(lerp(900, 610, m), 960 - RING_R - 4, back), lerp(470, 540, back)];
}

export default {
  start: 42,
  end: 50,
  hud: C.paper,
  draw(ctx, t) {
    fillBg(ctx, C.ink);
    bgGlow(ctx, 960, 540, 900, C.violet, 0.16 * (1 - seg(t, 48.4, 49.6)));
    const [mx, my] = markCenter(t);
    const tC = wordAt('l8', 2);

    // ring: draws in, later un-draws as everything folds back
    const pIn = ease.snappy(seg(t, 42.35, 42.95));
    const pOut = ease.inOutCubic(seg(t, 47.2, 47.9));
    const p = pIn * (1 - pOut);
    const rot = lerp(-Math.PI * 1.1, 0, ease.outCubic(seg(t, 42.35, 43.0))) + pOut * Math.PI;
    if (p > 0.001) {
      ctx.strokeStyle = rgba(C.paper, Math.min(1, p / 0.18));
      ctx.lineWidth = RING_W;
      ctx.lineCap = 'round';
      trimArc(ctx, mx, my, RING_R, 0.5 - 0.37 * p, 0.5 + 0.37 * p, rot);
    }

    // the ball
    const go = ease.snappy(seg(t, 42.15, 42.6));
    const home = [mx + RING_R + 4, my];
    let bx = lerp(960, home[0], go), by = lerp(540, home[1], go) - Math.sin(Math.PI * go) * 120;
    let r = lerp(START_R, BALL_R, go);
    const back = ease.inOutCubic(seg(t, 47.4, 48.15));
    r = lerp(r, 13, back);
    let sq = 0;
    for (const tt of [42.0, 42.6, 48.15]) { const u = t - tt; if (u >= 0 && u < 0.4) sq += 0.28 * Math.exp(-u * 13) * Math.cos(u * 34); }
    let pulse = 1;
    for (const tt of [48.5, 49.0]) { const u = t - tt; if (u >= 0 && u < 0.4) pulse *= 1 + 0.35 * Math.exp(-u * 12); }
    const fade = 1 - ease.inBack(seg(t, 49.3, 49.75));
    r *= pulse * fade;
    if (t > 48.15) { bx = 960; by = 540; }
    if (r > 0.3) {
      ctx.fillStyle = rgba(t > 48.0 ? (t > 48.6 ? C.paper : C.orange) : C.orange);
      ball(ctx, bx, by, r, 1 + sq * 0.8, 1 - sq);
      ctx.fill();
    }
    burst(ctx, home[0], home[1], (t - 42.6) / 0.5, { n: 10, r0: 54, r1: 115, width: 6, color: rgba(C.orange) });
    // sonar ripples, like the very first seconds
    for (const tt of [48.5, 49.0]) {
      const u = (t - tt) / 1.2;
      if (u <= 0 || u >= 1) continue;
      ctx.strokeStyle = rgba(C.paper, 0.22 * (1 - u));
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(960, 540, 14 + ease.outCubic(u) * 260, 0, TAU); ctx.stroke();
    }

    // wordmark — lands on the spoken "Claude."
    const wx = mx + RING_R + BALL_R * 2 + 48;
    const rp = ease.outExpo(seg(t, tC - 0.04, tC + 0.5));
    const wout = ease.inExpo(seg(t, 47.15, 47.5));
    if (rp > 0 && wout < 1) {
      font(ctx, 168, 800);
      ctx.letterSpacing = '-6px';
      const g = glyphs(ctx, 'Claude', -6);
      ctx.save();
      ctx.beginPath();
      ctx.rect(wx - 10, my - 200, g.width + 80, 400);
      ctx.clip();
      ctx.fillStyle = rgba(C.paper);
      ctx.fillText('Claude', wx - (1 - rp) * (g.width + 90) - wout * (g.width + 90), my + g.ascent / 2 - 4);
      // shine
      const sp = seg(t, 44.3, 44.95, ease.inOutCubic);
      if (sp > 0 && sp < 1) {
        ctx.globalCompositeOperation = 'source-atop';
        const x = lerp(wx - 200, wx + g.width + 200, sp);
        const gr = ctx.createLinearGradient(x - 120, 0, x + 120, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,170,130,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(x - 150, my - 200, 300, 400);
      }
      ctx.restore();
      ctx.letterSpacing = '0px';
    }
    spoken(ctx, 'l8', t, { x: wx + 4, y: my - 118, size: 46, upto: 2, align: 'left', out: 47.1 });
    spoken(ctx, 'l9', t, { y: 800, size: 64, weight: 700, family: F.sans, style: 'normal', tracking: -1, out: 47.1, accent: { index: 4, family: F.serif, style: 'italic', weight: 400, size: 86, color: C.orange } });
  },
  blur: (t) => (t < 42.7 || (t > 47.1 && t < 48.3) ? 8 : 4),
  sfx: [
    { t: 42.0, type: 'impact', gain: 1.1, big: true },
    { t: 42.15, type: 'boing', gain: 0.5 },
    { t: 42.35, type: 'zip', gain: 0.6, dur: 0.6 },
    { t: 42.6, type: 'bonk', gain: 0.9 },
    { t: wordAt('l8', 2) - 0.04, type: 'swish', gain: 0.5 },
    { t: 44.3, type: 'shimmer', gain: 0.55 },
    { t: 47.15, type: 'whoosh', gain: 0.5, dur: 0.5, pan: -0.4 },
    { t: 47.4, type: 'suck', gain: 0.6, dur: 0.75 },
    { t: 48.15, type: 'bonk', gain: 0.7, pitch: 1.3 },
    { t: 48.5, type: 'heart', gain: 0.8 },
    { t: 49.0, type: 'heart', gain: 0.65 },
    { t: 49.4, type: 'final', gain: 0.9 },
  ],
};
