// 01 — Timing & Spacing: a bouncing ball with squash & stretch, onion skins,
// animator's notes and a live speed graph. Ends by exploding into the next scene.
import { W, H, TAU, clamp, lerp, ease, seg, kf, spring, C, rgba, mix } from '../engine/core.js';
import { F, font, fillBg, trimPoly, ball } from '../engine/draw.js';

const GROUND = 700;
const R = 52;
const G = 9600; // px/s² — chosen so the bounces land exactly on the beat grid
const contacts = [1.0, 1.5, 1.75, 1.875, 1.9375];
const X0 = 330, X1 = 960;

// Height of the ball's bottom above the ground at time t (pure physics).
function heightAt(t) {
  if (t < 0.5) return 1300;
  if (t < contacts[0]) {
    const d = contacts[0] - t;
    return 0.5 * G * d * d;
  }
  for (let i = 0; i < contacts.length - 1; i++) {
    const a = contacts[i], b = contacts[i + 1];
    if (t >= a && t < b) {
      const T = b - a;
      const u = t - a;
      return 0.5 * G * u * (T - u);
    }
  }
  return 0;
}
const xAt = (t) => lerp(X0, X1, ease.outQuad(clamp((t - 0.5) / 1.5)));

// Squash amount from the most recent contact.
function squashAt(t) {
  const amps = [0.42, 0.26, 0.14, 0.06, 0.02];
  let s = 0;
  for (let i = 0; i < contacts.length; i++) {
    const d = t - contacts[i];
    if (d >= 0 && d < 0.4) s += amps[i] * Math.exp(-d * 28) * Math.cos(d * 55);
  }
  return s;
}

export function ballState(t) {
  const h = heightAt(t);
  const x = xAt(t);
  // velocity by central difference
  const e = 1 / 600;
  const vx = (xAt(t + e) - xAt(t - e)) / (2 * e);
  const vy = -(heightAt(t + e) - heightAt(t - e)) / (2 * e);
  const speed = Math.hypot(vx, vy);
  const sq = squashAt(t);
  let stretch = 1 + clamp(speed / 9000, 0, 0.45);
  let angle = Math.atan2(vy, vx) - Math.PI / 2;
  if (h <= 0.5) { stretch = 1; angle = 0; }
  // squash: wider and flatter, volume preserving
  const sy = (1 - sq) * stretch;
  const sx = (1 + sq * 0.9) / Math.sqrt(stretch);
  return { x, y: GROUND - h - R * (h <= 0.5 ? 1 - sq : 1), sx, sy, angle, h };
}

function gridLines(ctx, t) {
  const p = (d) => seg(t, 0.05 + d * 0.06, 0.75 + d * 0.06, ease.outExpo);
  ctx.save();
  ctx.strokeStyle = rgba(C.paper, 0.07);
  ctx.lineWidth = 1;
  for (let k = -6; k <= 6; k++) {
    const x = 960 + k * 160;
    const q = p(Math.abs(k));
    if (q <= 0) continue;
    ctx.beginPath();
    ctx.moveTo(x, 540 - 560 * q);
    ctx.lineTo(x, 540 + 560 * q);
    ctx.stroke();
  }
  for (let k = -4; k <= 4; k++) {
    const y = 540 + k * 160;
    const q = p(Math.abs(k) + 1);
    if (q <= 0) continue;
    ctx.beginPath();
    ctx.moveTo(960 - 1000 * q, y);
    ctx.lineTo(960 + 1000 * q, y);
    ctx.stroke();
  }
  // crosshair marks
  ctx.strokeStyle = rgba(C.paper, 0.22);
  for (let i = -5; i <= 5; i++) for (let j = -3; j <= 3; j++) {
    const d = Math.hypot(i, j);
    const q = seg(t, 0.3 + d * 0.05, 0.6 + d * 0.05, ease.outBack);
    if (q <= 0) continue;
    const x = 960 + i * 160, y = 540 + j * 160, s = 6 * q;
    ctx.beginPath();
    ctx.moveTo(x - s, y); ctx.lineTo(x + s, y);
    ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
    ctx.stroke();
  }
  ctx.restore();
}

function note(ctx, t, t0, t1, label, x, y, lx, ly, align = 'left') {
  const pin = seg(t, t0, t0 + 0.25, ease.outExpo);
  const pout = seg(t, t1, t1 + 0.25, ease.inExpo);
  if (pin <= 0 || pout >= 1) return;
  ctx.save();
  ctx.strokeStyle = rgba(C.paper, 0.55);
  ctx.lineWidth = 1.5;
  trimPoly(ctx, [[x, y], [lx, ly]], pout, pin);
  ctx.fillStyle = rgba(C.paper, 0.85);
  ctx.beginPath();
  ctx.arc(x, y, 3.5 * (pin - pout), 0, TAU);
  ctx.fill();
  font(ctx, 17, 500, F.mono);
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  ctx.letterSpacing = '2px';
  const tx = lx + (align === 'left' ? 10 : -10);
  ctx.beginPath();
  const w = 260;
  ctx.rect(align === 'left' ? tx : tx - w, ly - 14, w, 28);
  ctx.clip();
  ctx.fillText(label, tx, ly + 28 * (1 - pin) - 28 * pout);
  ctx.letterSpacing = '0px';
  ctx.restore();
}

function speedGraph(ctx, t) {
  const x0 = 1430, y0 = 330, w = 330, h = 190;
  const pin = seg(t, 0.9, 1.4, ease.outExpo);
  const pout = seg(t, 3.0, 3.35, ease.inExpo);
  if (pin <= 0 || pout >= 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - pout;
  ctx.translate(0, 30 * pout);
  // frame
  ctx.strokeStyle = rgba(C.paper, 0.18);
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, w * pin, h);
  font(ctx, 15, 500, F.mono);
  ctx.letterSpacing = '2px';
  ctx.fillStyle = rgba(C.paper, 0.5);
  ctx.fillText('VALUE GRAPH — POS X', x0, y0 - 14);
  ctx.letterSpacing = '0px';
  // curve: ease.outQuad mapped into the box
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const u = i / 60;
    pts.push([x0 + 20 + u * (w - 40), y0 + h - 20 - ease.outQuad(u) * (h - 40)]);
  }
  ctx.strokeStyle = rgba(C.orange);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  trimPoly(ctx, pts, 0, seg(t, 1.0, 1.6, ease.inOutCubic));
  // bezier handles
  const hp = seg(t, 1.4, 1.7, ease.outBack);
  ctx.strokeStyle = rgba(C.paper, 0.4);
  ctx.lineWidth = 1.5;
  const a = pts[0], b = pts[60];
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + 110 * hp, a[1] - 110 * hp);
  ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - 110 * hp, b[1]);
  ctx.stroke();
  ctx.fillStyle = rgba(C.paper);
  for (const [hx, hy] of [[a[0] + 110 * hp, a[1] - 110 * hp], [b[0] - 110 * hp, b[1]]]) {
    ctx.beginPath(); ctx.arc(hx, hy, 5 * hp, 0, TAU); ctx.fill();
  }
  // playhead dot following the ball's x progress
  const u = clamp((t - 0.5) / 1.5);
  const px = x0 + 20 + u * (w - 40), py = y0 + h - 20 - ease.outQuad(u) * (h - 40);
  ctx.fillStyle = rgba(C.paper);
  ctx.beginPath(); ctx.arc(px, py, 7 * pin, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(C.paper, 0.25);
  ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.moveTo(px, y0 + h); ctx.lineTo(px, py); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

export default {
  id: 'timing',
  label: 'Timing & Spacing',
  num: '01',
  start: 0,
  end: 4,
  hud: C.paper,
  draw(ctx, t) {
    fillBg(ctx, C.ink);
    const fadeAll = 1 - seg(t, 3.05, 3.5, ease.inCubic);

    ctx.save();
    ctx.globalAlpha = fadeAll;
    gridLines(ctx, t);

    // ground line
    const gp = seg(t, 0.35, 1.0, ease.outExpo);
    ctx.strokeStyle = rgba(C.paper, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(960 - 820 * gp, GROUND);
    ctx.lineTo(960 + 820 * gp, GROUND);
    ctx.stroke();

    // onion skins / spacing chart
    const onionOut = seg(t, 2.2, 2.9, ease.inOutCubic);
    if (t > 0.5 && onionOut < 1) {
      ctx.strokeStyle = rgba(C.paper, 0.28 * (1 - onionOut));
      ctx.lineWidth = 1.5;
      for (let f = 0; f * (1 / 30) + 0.5 < Math.min(t, 2.0); f++) {
        const ts = 0.5 + f / 30;
        const s = ballState(ts);
        if (s.y < -R) continue;
        ball(ctx, s.x, s.y, R, s.sx, s.sy, s.angle);
        ctx.stroke();
      }
      // arc path
      ctx.strokeStyle = rgba(C.orange, 0.6 * (1 - onionOut));
      ctx.setLineDash([2, 8]);
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let ts = 0.75; ts <= Math.min(t, 2.0); ts += 1 / 240) {
        const s = ballState(ts);
        if (ts === 0.75) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // animator notes
    note(ctx, t, 0.72, 2.9, 'STRETCH', 455, 300, 520, 250);
    note(ctx, t, 1.0, 2.9, 'SQUASH', 640, GROUND + 4, 600, GROUND + 70, 'right');
    note(ctx, t, 1.22, 2.95, 'SLOW IN / SLOW OUT', 815, 315, 890, 255);
    note(ctx, t, 1.9, 3.0, 'SETTLE', 960, GROUND + 4, 1010, GROUND + 70);
    note(ctx, t, 2.55, 3.05, 'ANTICIPATION', 1010, 640, 1110, 560);
    speedGraph(ctx, t);
    ctx.restore();

    // --- the ball ---
    let s = ballState(Math.min(t, 2.4));
    let { x, y, sx, sy, angle } = s;
    let r = R;
    let col = C.paper;
    // anticipation: slow squash down
    const ant = seg(t, 2.5, 3.35, ease.inOutCubic);
    if (ant > 0) {
      sy = lerp(1, 0.58, ant);
      sx = lerp(1, 1.36, ant);
      y = GROUND - R * sy;
      // nervous tremble
      x += Math.sin(t * 90) * 1.6 * ant;
    }
    // release: shoot up to the centre with stretch
    const rel = seg(t, 3.35, 3.62, ease.outExpo);
    if (t >= 3.35) {
      y = lerp(GROUND - R * 0.58, 540, rel);
      const st = 1 + 0.9 * Math.sin(Math.PI * clamp((t - 3.35) / 0.3)) * (1 - rel * 0.3);
      sy = lerp(0.58, 1, clamp((t - 3.35) / 0.05)) * st;
      sx = 1 / Math.sqrt(st);
      x = 960;
    }
    // overshoot settle in the centre
    if (t >= 3.55) {
      const sp = spring(t - 3.55, { stiffness: 400, damping: 14 });
      sx = lerp(sx, 1, clamp(sp));
      sy = lerp(sy, 1, clamp(sp));
    }
    // expand to fill the frame
    const ex = seg(t, 3.58, 3.98, ease.inExpo);
    if (ex > 0) {
      r = lerp(R, 1200, ex);
      col = mix(C.paper, C.orange, seg(t, 3.5, 3.75, ease.outCubic));
      sx = 1; sy = 1;
    } else if (t > 3.45) {
      col = mix(C.paper, C.orange, seg(t, 3.5, 3.75, ease.outCubic));
    }
    // contact shadow
    if (t < 3.4) {
      const hh = clamp(s.h / 500);
      ctx.fillStyle = rgba(C.paper, 0.12 * (1 - hh));
      ctx.beginPath();
      ctx.ellipse(x, GROUND + 6, R * (1.2 - hh * 0.6) * sx, 6 * (1 - hh * 0.5), 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(col);
    ball(ctx, x, y, r, sx, sy, angle);
    ctx.fill();
  },
  sfx: [
    { t: 0.05, type: 'tick', gain: 0.5 },
    { t: 0.25, type: 'shimmer', gain: 0.25 },
    { t: 1.0, type: 'bonk', gain: 1.0, pitch: 1.0 },
    { t: 1.5, type: 'bonk', gain: 0.7, pitch: 1.12 },
    { t: 1.75, type: 'bonk', gain: 0.45, pitch: 1.25 },
    { t: 1.875, type: 'bonk', gain: 0.25, pitch: 1.4 },
    { t: 2.5, type: 'stretch', gain: 0.6, dur: 0.85 },
    { t: 3.35, type: 'boing', gain: 0.8 },
    { t: 3.4, type: 'whooshUp', gain: 0.9, dur: 0.6 },
  ],
};
