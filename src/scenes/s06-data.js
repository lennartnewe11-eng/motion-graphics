// 06 — Data visualisation: odometer counters, spring bar chart, donut with trim paths,
// and the reel's own energy curve with a live playhead.
import { W, H, TAU, clamp, lerp, ease, seg, spring, noise2, C, rgba, mix } from '../engine/core.js';
import { F, font, fillBg, trimPoly, trimArc, glyphs } from '../engine/draw.js';
import { FRAMES_TOTAL } from '../meta.js';

const INK = C.ink;
const L = 120, R = 1800;
const COLX = [120, 700, 1280];
const COLW = 520;

function rule(ctx, x0, y0, x1, y1, p, a = 1) {
  if (p <= 0) return;
  ctx.strokeStyle = rgba(INK, 0.9 * a);
  ctx.lineWidth = 1.5;
  trimPoly(ctx, [[x0, y0], [x1, y1]], 0, p);
}

function label(ctx, str, x, y, p, align = 'left', alpha = 0.65) {
  if (p <= 0) return;
  font(ctx, 16, 500, F.mono);
  ctx.letterSpacing = '3px';
  ctx.textAlign = align;
  ctx.save();
  ctx.beginPath();
  ctx.rect(align === 'left' ? x - 2 : x - 600, y - 18, 602, 26);
  ctx.clip();
  ctx.fillStyle = rgba(INK, alpha);
  ctx.fillText(str, x, y + 24 * (1 - p));
  ctx.restore();
  ctx.letterSpacing = '0px';
}

// Rolling odometer: each digit column scrolls continuously.
function odometer(ctx, value, x, y, size, digits, p, { sep = true, color = INK } = {}) {
  font(ctx, size, 800);
  const dw = Math.max(...'0123456789'.split('').map((d) => ctx.measureText(d).width)) * 0.92;
  const asc = glyphs(ctx, '0').ascent;
  const v = value;
  let cx = x;
  ctx.fillStyle = rgba(color);
  ctx.textAlign = 'center';
  for (let k = digits - 1; k >= 0; k--) {
    // true odometer: a digit only rolls while every lower digit carries over
    const unit = Math.pow(10, k);
    const base = Math.floor(v / unit) % 10;
    const rem = v - Math.floor(v / unit) * unit;
    const off = k === 0 ? v - Math.floor(v) : clamp(rem - (unit - 1));
    const visible = v >= unit * 0.999 || k === 0 || off > 0;
    if (visible) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - 6, y - asc - size * 0.12, dw + 12, asc + size * 0.24);
      ctx.clip();
      const step = asc * 1.35;
      ctx.globalAlpha = p;
      ctx.fillText(String(base % 10), cx + dw / 2, y - off * step);
      ctx.fillText(String((base + 1) % 10), cx + dw / 2, y + step - off * step);
      ctx.restore();
    }
    cx += dw;
    if (sep && k === 3 && visible) {
      ctx.fillText('.', cx + size * 0.08, y);
      cx += size * 0.22;
    }
  }
}

function colA(ctx, lt) {
  const x = COLX[0];
  label(ctx, 'FRAMES IN DIESEM VIDEO', x, 320, seg(lt, 0.25, 0.6, ease.outExpo));
  const cnt = ease.inOutQuart(seg(lt, 0.35, 2.3)) * FRAMES_TOTAL;
  odometer(ctx, cnt, x - 6, 470, 150, 4, seg(lt, 0.3, 0.5));
  rule(ctx, x, 540, x + COLW, 540, seg(lt, 0.6, 1.2, ease.outExpo), 0.25);
  label(ctx, 'KEYFRAMES VON HAND', x, 590, seg(lt, 0.7, 1.05, ease.outExpo));
  label(ctx, 'SAMPLES & LOOPS', x + 270, 590, seg(lt, 0.78, 1.13, ease.outExpo));
  const zp = seg(lt, 0.9, 1.3, ease.outBack);
  font(ctx, 110, 800);
  ctx.fillStyle = rgba(INK);
  ctx.textAlign = 'left';
  for (const [dx, d] of [[0, 0], [270, 0.08]]) {
    const q = seg(lt, 0.9 + d, 1.4 + d, ease.outExpo);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + dx - 4, 600, 260, 130);
    ctx.clip();
    ctx.fillText('0', x + dx - 4, 712 + 130 * (1 - q));
    ctx.restore();
  }
  // "alles Code" tag
  const tp = seg(lt, 1.6, 2.0, ease.outBack);
  if (tp > 0) {
    ctx.save();
    ctx.translate(x + 4, 770);
    ctx.rotate(-0.08);
    ctx.scale(tp, tp);
    ctx.fillStyle = rgba(C.orange);
    const w = 168, h = 44;
    ctx.beginPath();
    ctx.roundRect(-8, -h / 2, w, h, 22);
    ctx.fill();
    font(ctx, 26, 400, F.serif, 'italic');
    ctx.fillStyle = rgba(C.paper);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('alles Code', w / 2 - 8, 1);
    ctx.restore();
  }
}

const BARS = [['TYPO', 0.72], ['SHAPES', 0.84], ['PARTIKEL', 0.62], ['3D', 0.77], ['UI', 0.9], ['SOUND', 0.68]];
function colB(ctx, lt) {
  const x = COLX[1] + 20, base = 760, maxH = 360;
  label(ctx, 'SKILL-LEVEL IN %', COLX[1], 320, seg(lt, 0.35, 0.7, ease.outExpo));
  rule(ctx, COLX[1], base, COLX[1] + COLW, base, seg(lt, 0.4, 1.0, ease.outExpo));
  // 100% guide
  const gp = seg(lt, 2.7, 3.1, ease.outExpo);
  if (gp > 0) {
    ctx.save();
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = rgba(C.orange, 0.9);
    ctx.lineWidth = 2;
    trimPoly(ctx, [[COLX[1], base - maxH], [COLX[1] + COLW, base - maxH]], 0, gp);
    ctx.restore();
  }
  const bw = 52, gap = (COLW - 40 - bw * BARS.length) / (BARS.length - 1);
  BARS.forEach(([name, v], i) => {
    const s1 = clamp(spring(lt - (0.6 + i * 0.08), { stiffness: 180, damping: 13 }), 0, 1.2);
    const s2 = clamp(spring(lt - (3.0 + i * 0.05), { stiffness: 260, damping: 11 }), 0, 1.3);
    const val = lerp(v * s1, 1, s2 > 0 ? Math.min(s2, 1.2) : 0);
    const bh = Math.max(0, val * maxH);
    const bx = x + i * (bw + gap);
    const hot = s2 > 0.01;
    ctx.fillStyle = rgba(hot ? (i % 2 ? C.orange : C.violet) : INK);
    ctx.fillRect(bx, base - bh, bw, bh);
    // value
    if (s1 > 0.05) {
      font(ctx, 18, 700, F.mono);
      ctx.fillStyle = rgba(INK);
      ctx.textAlign = 'center';
      ctx.fillText(String(Math.round(clamp(val) * 100)), bx + bw / 2, base - bh - 14);
    }
    // name (rotated)
    const np = seg(lt, 0.7 + i * 0.06, 1.1 + i * 0.06, ease.outExpo);
    if (np > 0) {
      ctx.save();
      ctx.translate(bx + bw / 2, base + 22);
      font(ctx, 14, 500, F.mono);
      ctx.letterSpacing = '2px';
      ctx.fillStyle = rgba(INK, 0.7 * np);
      ctx.textAlign = 'center';
      ctx.fillText(name, 0, 12 + 10 * (1 - np));
      ctx.restore();
    }
  });
}

const SEGS = [['EASING-KURVEN', 0.41, C.orange], ['TIMING', 0.27, C.violet], ['TYPOGRAFIE', 0.19, C.ink], ['KAFFEE', 0.13, C.paper2]];
function colC(ctx, lt) {
  const cx = COLX[2] + 150, cy = 560, r = 122;
  label(ctx, 'WOFÜR MEINE ZEIT DRAUFGEHT', COLX[2], 320, seg(lt, 0.45, 0.8, ease.outExpo));
  let a0 = 0;
  const rot = -Math.PI / 2 + (1 - ease.outExpo(seg(lt, 0.8, 2.0))) * -1.2;
  SEGS.forEach(([name, v, col], i) => {
    const p = ease.inOutCubic(seg(lt, 0.9 + i * 0.22, 1.5 + i * 0.22));
    ctx.strokeStyle = rgba(col);
    ctx.lineWidth = 50;
    ctx.lineCap = 'butt';
    const gapA = 0.012;
    if (p > 0) trimArc(ctx, cx, cy, r, a0 + gapA, a0 + gapA + (v - gapA * 2) * p, rot);
    a0 += v;
    // legend row
    const lp = seg(lt, 1.0 + i * 0.22, 1.4 + i * 0.22, ease.outExpo);
    if (lp > 0) {
      const lx = COLX[2] + 330, ly = 470 + i * 58;
      ctx.save();
      ctx.beginPath();
      ctx.rect(lx - 4, ly - 26, 220, 54);
      ctx.clip();
      ctx.translate(0, 40 * (1 - lp));
      ctx.fillStyle = rgba(col);
      ctx.beginPath();
      ctx.arc(lx + 8, ly - 6, 8, 0, TAU);
      ctx.fill();
      if (col === C.paper2) { ctx.strokeStyle = rgba(INK, 0.3); ctx.lineWidth = 1; ctx.stroke(); }
      font(ctx, 15, 600, F.mono);
      ctx.letterSpacing = '2px';
      ctx.textAlign = 'left';
      ctx.fillStyle = rgba(INK);
      ctx.fillText(name, lx + 26, ly);
      font(ctx, 15, 400, F.mono);
      ctx.fillStyle = rgba(INK, 0.55);
      ctx.fillText(`${Math.round(v * 100 * ease.outCubic(lp))} %`, lx + 26, ly + 20);
      ctx.letterSpacing = '0px';
      ctx.restore();
    }
  });
  // centre value
  const cp = seg(lt, 1.0, 1.6, ease.outExpo);
  if (cp > 0) {
    font(ctx, 58, 800);
    ctx.fillStyle = rgba(INK);
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(41 * ease.outCubic(seg(lt, 1.0, 1.9)))}%`, cx, cy + 18);
    font(ctx, 12, 500, F.mono);
    ctx.letterSpacing = '3px';
    ctx.fillStyle = rgba(INK, 0.6 * cp);
    ctx.fillText('EASING', cx, cy + 44);
    ctx.letterSpacing = '0px';
  }
}

// energy of the reel over time — mirrors the soundtrack's arrangement
const ENERGY = [[0, 0.12], [3.9, 0.3], [4, 0.62], [11.9, 0.68], [12, 0.72], [18, 0.6], [20, 0.34], [23.9, 0.82], [24, 1.0], [30, 0.84], [36, 0.8], [42, 0.9], [45.9, 0.98], [46, 0.55], [50, 0.4], [54, 0.12], [56, 0.02]];
function energyAt(t) {
  for (let i = 1; i < ENERGY.length; i++) if (t <= ENERGY[i][0]) {
    const [t0, v0] = ENERGY[i - 1], [t1, v1] = ENERGY[i];
    return lerp(v0, v1, (t - t0) / (t1 - t0)) + 0.05 * noise2(t * 1.3, 2.2);
  }
  return 0;
}
function bottom(ctx, lt, t) {
  const y0 = 850, y1 = 975;
  label(ctx, 'ENERGIE-KURVE DIESES REELS', L, y0 - 16, seg(lt, 0.9, 1.3, ease.outExpo));
  rule(ctx, L, y1, R, y1, seg(lt, 0.8, 1.5, ease.outExpo), 0.4);
  const p = ease.inOutCubic(seg(lt, 1.1, 2.9));
  if (p <= 0) return;
  const pts = [];
  for (let k = 0; k <= 280; k++) {
    const tt = (k / 280) * 56;
    pts.push([L + (k / 280) * (R - L), y1 - energyAt(tt) * (y1 - y0 - 10)]);
  }
  // area
  const n = Math.floor(p * 280);
  const grad = ctx.createLinearGradient(0, y0, 0, y1);
  grad.addColorStop(0, rgba(C.orange, 0.35));
  grad.addColorStop(1, rgba(C.orange, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], y1);
  for (let k = 0; k <= n; k++) ctx.lineTo(pts[k][0], pts[k][1]);
  ctx.lineTo(pts[n][0], y1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(C.orange);
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  trimPoly(ctx, pts, 0, p);
  // playhead = actual position in the reel
  const ph = seg(lt, 2.6, 3.0, ease.outBack);
  if (ph > 0) {
    const x = L + (t / 56) * (R - L), y = y1 - energyAt(t) * (y1 - y0 - 10);
    ctx.strokeStyle = rgba(INK, 0.8);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y1); ctx.lineTo(x, lerp(y1, y - 30, ph));
    ctx.stroke();
    ctx.fillStyle = rgba(INK);
    ctx.beginPath(); ctx.arc(x, y, 8 * ph, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(C.paper);
    ctx.beginPath(); ctx.arc(x, y, 3.5 * ph, 0, TAU); ctx.fill();
    font(ctx, 14, 700, F.mono);
    ctx.letterSpacing = '2px';
    ctx.fillStyle = rgba(INK, ph);
    ctx.textAlign = 'left';
    ctx.fillText('JETZT', x + 12, lerp(y1, y - 30, ph) + 4);
    ctx.letterSpacing = '0px';
  }
}

export default {
  id: 'data',
  label: 'Datenvisualisierung',
  num: '06',
  start: 30,
  end: 36,
  hud: C.ink,
  draw(ctx, lt, t) {
    fillBg(ctx, C.paper);
    // headline
    const hp = seg(lt, 0.05, 0.5, ease.outExpo);
    font(ctx, 66, 800);
    ctx.letterSpacing = '-2px';
    ctx.fillStyle = rgba(INK);
    ctx.save();
    ctx.beginPath();
    ctx.rect(L - 10, 150, 1200, 90);
    ctx.clip();
    ctx.fillText('Zahlen, die sich bewegen.', L, 220 + 90 * (1 - hp));
    ctx.restore();
    ctx.letterSpacing = '0px';
    rule(ctx, L, 260, R, 260, seg(lt, 0.15, 0.8, ease.outExpo));
    rule(ctx, 670, 290, 670, 800, seg(lt, 0.3, 0.9, ease.outExpo), 0.25);
    rule(ctx, 1250, 290, 1250, 800, seg(lt, 0.36, 0.96, ease.outExpo), 0.25);
    colA(ctx, lt);
    colB(ctx, lt);
    colC(ctx, lt);
    bottom(ctx, lt, t);
  },
  blur: (lt) => (lt < 2.4 ? 6 : 0),
  sfx: [
    { t: 0.05, type: 'swish', gain: 0.5 },
    { t: 0.35, type: 'counter', gain: 0.45, dur: 1.95 },
    ...BARS.map((_, i) => ({ t: 0.62 + i * 0.08, type: 'pop', gain: 0.35, pitch: 1 + i * 0.1 })),
    ...SEGS.map((_, i) => ({ t: 0.9 + i * 0.22, type: 'swish', gain: 0.3, pan: 0.5 })),
    { t: 1.6, type: 'pop', gain: 0.6, pitch: 1.5 },
    { t: 1.1, type: 'scribble', gain: 0.35, dur: 1.8 },
    ...BARS.map((_, i) => ({ t: 3.0 + i * 0.05, type: 'blip', gain: 0.35, pitch: 1.3 + i * 0.12 })),
    { t: 3.3, type: 'chime', gain: 0.35 },
  ],
};
