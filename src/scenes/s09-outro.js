// 09 — Logo reveal & end card. The bouncing ball from scene 01 becomes part of the mark,
// lands as the full stop of the last line, and closes the reel.
import { W, H, TAU, clamp, lerp, ease, seg, spring, C, rgba } from '../engine/core.js';
import { F, font, fillBg, glyphs, trimArc, burst, ball, maskedLine } from '../engine/draw.js';

const RING_R = 118, RING_W = 44, BALL_R = 36;
let layer = null, lctx = null;

function markCenter(lt) {
  const m = seg(lt, 1.3, 1.95, ease.snappy);
  return [lerp(960, 640, m), 520];
}

// ball for the mark: drops in, squashes, settles in the ring's opening
function markBall(lt, cx, cy) {
  const tx = cx + RING_R + 4, ty = cy;
  const fall = seg(lt, 0.3, 0.58, ease.inQuad);
  if (lt < 0.58) return { x: tx, y: lerp(-80, ty, fall), sx: 1 / Math.sqrt(1 + fall * 0.4), sy: 1 + fall * 0.4, a: fall > 0 };
  const u = lt - 0.58;
  const sq = 0.32 * Math.exp(-u * 14) * Math.cos(u * 34);
  const bounce = Math.max(0, Math.sin(u * 13) * 34 * Math.exp(-u * 7));
  return { x: tx, y: ty - bounce, sx: 1 + sq * 0.8, sy: 1 - sq, a: true };
}

function drawMark(ctx, lt) {
  const [cx, cy] = markCenter(lt);
  const p = seg(lt, 0.05, 0.62, ease.snappy);
  const rot = lerp(-Math.PI * 1.1, 0, ease.outCubic(seg(lt, 0.05, 0.7)));
  ctx.strokeStyle = rgba(C.paper);
  ctx.lineWidth = RING_W;
  ctx.lineCap = 'round';
  // the C: an arc that leaves an opening on the right
  if (p > 0) trimArc(ctx, cx, cy, RING_R, 0.5 - 0.37 * p, 0.5 + 0.37 * p, rot);
  const b = markBall(lt, cx, cy);
  if (b.a) {
    ctx.fillStyle = rgba(C.orange);
    const breathe = 1 + 0.03 * Math.sin(lt * 4) * seg(lt, 1.9, 2.4);
    ball(ctx, b.x, b.y, BALL_R * breathe, b.sx, b.sy);
    ctx.fill();
  }
  return [cx, cy];
}

function shine(ctx, lt) {
  const sp = seg(lt, 0.85, 1.45, ease.inOutCubic);
  if (sp <= 0 || sp >= 1) return;
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const x = lerp(300, 1500, sp);
  const g = ctx.createLinearGradient(x - 160, 0, x + 160, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.translate(x, 540);
  ctx.rotate(0.35);
  ctx.translate(-x, -540);
  ctx.fillStyle = g;
  ctx.fillRect(x - 200, -400, 400, 1900);
  ctx.restore();
}

function wordmark(ctx, lt, cx, cy) {
  const x = cx + RING_R + BALL_R * 2 + 52;
  const rp = seg(lt, 1.45, 2.0, ease.outExpo);
  if (rp <= 0) return;
  font(ctx, 168, 800);
  ctx.fillStyle = rgba(C.paper);
  ctx.letterSpacing = '-6px';
  const g = glyphs(ctx, 'Claude', -6);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 10, cy - 200, g.width + 60, 400);
  ctx.clip();
  ctx.fillText('Claude', x - (1 - rp) * (g.width + 80), cy + g.ascent / 2 - 4);
  ctx.restore();
  ctx.letterSpacing = '0px';
  font(ctx, 19, 500, F.mono);
  ctx.fillStyle = rgba(C.paper, 0.6);
  maskedLine(ctx, 'MOTION DESIGNER  ·  BEWERBUNG 2026', x + 6, cy + g.ascent / 2 + 66, seg(lt, 1.75, 2.2, ease.outExpo), { tracking: 6 });
}

// end card ---------------------------------------------------------------
const L1 = 'Lass uns zusammen', L2a = 'etwas ', L2b = 'bewegen';
function endCard(ctx, lt) {
  if (lt < 4.15) return null;
  const out = seg(lt, 7.15, 7.45, ease.inExpo);
  // centre the two-line block optically
  font(ctx, 128, 800);
  const w1 = glyphs(ctx, L1, -5).width, w2a = glyphs(ctx, L2a, -5).width;
  font(ctx, 178, 400, F.serif, 'italic');
  const w2 = w2a + 18 + glyphs(ctx, L2b).width + 50;
  const x = Math.round(960 - Math.max(w1, w2) / 2);
  font(ctx, 128, 800);
  ctx.letterSpacing = '-5px';
  ctx.fillStyle = rgba(C.paper);
  ctx.save();
  ctx.translate(0, out * 300);
  maskedLine(ctx, L1, x, 470, seg(lt, 4.2, 4.65, ease.outExpo) * (1 - out), { tracking: -5 });
  const ga = glyphs(ctx, L2a, -5);
  maskedLine(ctx, L2a, x, 640, seg(lt, 4.3, 4.75, ease.outExpo) * (1 - out), { tracking: -5 });
  ctx.letterSpacing = '0px';
  font(ctx, 178, 400, F.serif, 'italic');
  ctx.fillStyle = rgba(C.orange);
  const gb = glyphs(ctx, L2b);
  maskedLine(ctx, L2b, x + ga.width + 18, 640, seg(lt, 4.4, 4.85, ease.outExpo) * (1 - out), { pad: 0.35 });
  font(ctx, 19, 500, F.mono);
  ctx.fillStyle = rgba(C.paper, 0.6);
  maskedLine(ctx, 'JEDES FRAME UND JEDER TON IN DIESEM VIDEO: CODE.  0 KEYFRAMES.', x + 6, 780, seg(lt, 5.4, 5.85, ease.outExpo) * (1 - out), { tracking: 5 });
  ctx.restore();
  return { px: x + ga.width + 18 + gb.width + 34, py: 640 - 18 };
}

// the ball lands as the full stop, then closes the film
function finalBall(ctx, lt, pos) {
  if (!pos || lt < 5.0) return;
  const contacts = [5.45, 5.8, 5.98, 6.07];
  const G = 9000;
  let h = 0;
  if (lt < contacts[0]) { const d = contacts[0] - lt; h = 0.5 * G * d * d; }
  else for (let i = 0; i < contacts.length - 1; i++) {
    if (lt >= contacts[i] && lt < contacts[i + 1]) { const T = contacts[i + 1] - contacts[i], u = lt - contacts[i]; h = 0.5 * G * u * (T - u); }
  }
  let sq = 0;
  contacts.forEach((c, i) => { const d = lt - c; if (d >= 0 && d < 0.3) sq += [0.4, 0.22, 0.1, 0.04][i] * Math.exp(-d * 26) * Math.cos(d * 50); });
  const r = 26;
  let x = pos.px, y = pos.py - h + 18 - r * (1 - sq);
  let sx = 1 + sq * 0.9, sy = 1 - sq, rr = r;
  // finale: hop to the centre, grow, and blink out
  const go = seg(lt, 7.35, 7.7, ease.snappy);
  if (go > 0) {
    x = lerp(x, 960, go);
    y = lerp(y, 540, go) - Math.sin(go * Math.PI) * 160;
    rr = lerp(r, 70, go);
  }
  const end = seg(lt, 7.78, 7.98, ease.inBack);
  rr *= 1 - end;
  if (rr <= 0.2) return;
  ctx.fillStyle = rgba(C.orange);
  ball(ctx, x, y, rr, sx, sy);
  ctx.fill();
  burst(ctx, x, y, (lt - 7.72) / 0.5, { n: 10, r0: 90, r1: 170, width: 6, color: rgba(C.orange) });
}

export default {
  id: 'outro',
  label: 'Logo & Abspann',
  num: '09',
  start: 46,
  end: 56,
  hud: C.paper,
  init() {
    layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    lctx = layer.getContext('2d');
  },
  draw(ctx, lt) {
    fillBg(ctx, C.ink);
    if (lt >= 8) return;
    // logo section
    const exit = seg(lt, 3.85, 4.25, ease.inExpo);
    if (lt < 4.3) {
      const push = 1 + 0.035 * ease.inOutSine(seg(lt, 1.9, 3.85));
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.clearRect(0, 0, W, H);
      lctx.translate(960, 540);
      lctx.scale(push, push);
      lctx.translate(-960, -540 - exit * 700);
      const [cx, cy] = drawMark(lctx, lt);
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      shine(lctx, lt);
      lctx.translate(960, 540);
      lctx.scale(push, push);
      lctx.translate(-960, -540 - exit * 700);
      wordmark(lctx, lt, cx, cy);
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(layer, 0, 0);
      const [bx, by] = [cx + RING_R + 4, cy];
      burst(ctx, bx, by - exit * 700, (lt - 0.58) / 0.5, { n: 10, r0: 56, r1: 120, width: 6, color: rgba(C.orange) });
    }
    const pos = endCard(ctx, lt);
    finalBall(ctx, lt, pos);
  },
  blur: (lt) => (lt < 0.7 || (lt > 7.3 && lt < 8) ? 8 : 0),
  sfx: [
    { t: 0.0, type: 'impact', gain: 1.25, big: true },
    { t: 0.05, type: 'zip', gain: 0.6, dur: 0.55 },
    { t: 0.58, type: 'bonk', gain: 0.9, pitch: 1.0 },
    { t: 0.85, type: 'shimmer', gain: 0.55 },
    { t: 1.3, type: 'swish', gain: 0.45 },
    { t: 3.85, type: 'whooshUp', gain: 0.5, dur: 0.4 },
    { t: 4.2, type: 'swish', gain: 0.35, pan: -0.3 },
    { t: 4.4, type: 'swish', gain: 0.35, pan: 0.3 },
    { t: 5.45, type: 'bonk', gain: 0.8, pitch: 1.0 },
    { t: 5.8, type: 'bonk', gain: 0.55, pitch: 1.12 },
    { t: 5.98, type: 'bonk', gain: 0.35, pitch: 1.25 },
    { t: 6.07, type: 'bonk', gain: 0.2, pitch: 1.4 },
    { t: 7.15, type: 'swish', gain: 0.4 },
    { t: 7.35, type: 'boing', gain: 0.6 },
    { t: 7.78, type: 'pop', gain: 0.9, pitch: 0.7 },
    { t: 7.95, type: 'final', gain: 1.0 },
  ],
};
