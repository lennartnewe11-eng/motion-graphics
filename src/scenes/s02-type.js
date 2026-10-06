// 02 — Kinetic Typography: slams, masked line reveals, variable-font weight waves,
// letter hops, a step-marquee and a zoom through the counter of an "O".
import { W, H, TAU, clamp, lerp, ease, seg, spring, noise2, C, rgba } from '../engine/core.js';
import { F, font, glyphs, maskedLine, fillBg, ball, burst } from '../engine/draw.js';

const BIG = 340;
let counter = null; // measured inner counter of the "O" in the marquee font

function shake(lt, t0, amp, dur = 0.35) {
  const u = lt - t0;
  if (u < 0 || u > dur) return [0, 0];
  const a = amp * Math.exp(-u * 12);
  return [noise2(u * 40, 1.3) * a, noise2(7.1, u * 40) * a];
}

// ---------------------------------------------------------------- HALLO ---
function partHallo(ctx, lt) {
  if (lt > 1.15) return;
  // ink shock ring behind
  const rp = seg(lt, 0.0, 0.7, ease.linear);
  if (rp > 0 && rp < 1) {
    ctx.strokeStyle = rgba(C.ink, 0.9);
    ctx.lineWidth = 90 * (1 - ease.outCubic(rp));
    ctx.beginPath();
    ctx.arc(960, 540, lerp(120, 1250, ease.outExpo(rp)), 0, TAU);
    ctx.stroke();
  }
  font(ctx, BIG, 900);
  const str = 'HALLO';
  const tr = -0.045 * BIG;
  const g = glyphs(ctx, str, tr);
  const base = 540 + g.ascent / 2;
  const ox = 960 - g.width / 2;
  const [sx, sy] = shake(lt, 0.08, 22);
  ctx.save();
  ctx.translate(sx, sy);
  // mask for exit
  ctx.beginPath();
  ctx.rect(0, base - g.ascent - 60, W, g.ascent + 120);
  ctx.clip();
  ctx.fillStyle = rgba(C.ink);
  ctx.textAlign = 'center';
  for (const gl of g.list) {
    const i = gl.i;
    const ti = i * 0.035;
    const p = ease.outExpo(clamp((lt - ti) / 0.42));
    const a = clamp((lt - ti) / 0.05);
    if (a <= 0) continue;
    const out = seg(lt, 0.82 + i * 0.03, 1.08 + i * 0.03, ease.inExpo);
    const s = lerp(2.6, 1, p);
    const cx = ox + gl.x + gl.w / 2;
    ctx.save();
    ctx.translate(lerp(960, cx, p), base - g.ascent / 2 - out * (g.ascent + 120));
    ctx.rotate(lerp((i - 2) * 0.22, 0, p));
    ctx.scale(s, s);
    ctx.globalAlpha = a;
    ctx.fillText(gl.ch, 0, g.ascent / 2);
    ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------ ICH BIN / CLAUDE ---
const L2 = { x: 150, y1: 455, y2: 715, size: 250 };
function partIntro(ctx, lt) {
  if (lt < 0.95 || lt > 2.4) return;
  ctx.fillStyle = rgba(C.ink);
  font(ctx, L2.size, 900);
  const tr = -0.045 * L2.size;
  ctx.letterSpacing = tr + 'px';
  const out1 = seg(lt, 1.82, 2.05, ease.inExpo);
  // line 1 (reveals up, exits up)
  ctx.save();
  ctx.translate(0, 0);
  if (out1 < 1) {
    const p1 = seg(lt, 1.0, 1.45, ease.outExpo);
    ctx.save();
    const g = glyphs(ctx, 'ICH BIN', tr);
    ctx.beginPath();
    ctx.rect(0, L2.y1 - g.ascent - 30, W, g.ascent + 60);
    ctx.clip();
    ctx.translate(0, -out1 * (g.ascent + 60));
    maskedLine(ctx, 'ICH BIN', L2.x, L2.y1, p1, { tracking: tr, pad: 0.15 });
    ctx.restore();
    // serif annotation
    const pa = seg(lt, 1.3, 1.75, ease.outExpo);
    font(ctx, 78, 400, F.serif, 'italic');
    ctx.letterSpacing = '0px';
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, L2.y1 - 120, W, 160);
    ctx.clip();
    ctx.translate(0, -out1 * 160);
    maskedLine(ctx, '— und ich bewerbe mich.', L2.x + g.width + 60, L2.y1 - 8, pa, { pad: 0.3 });
    ctx.restore();
  }
  ctx.restore();
}

// CLAUDE — travels from line-2 position to centre, then a variable-weight wave.
function partClaude(ctx, lt) {
  if (lt < 1.05 || lt > 3.05) return;
  const str = 'CLAUDE';
  const reveal = seg(lt, 1.08, 1.53, ease.outExpo);
  const move = seg(lt, 1.9, 2.35, ease.snappy);
  const size = lerp(L2.size, 330, move);
  const amp = seg(lt, 2.0, 2.3, ease.inOutCubic) * (1 - seg(lt, 2.62, 2.8, ease.inOutCubic));
  const phase = (lt - 2.0) * TAU * 1.6;
  // per-glyph weights and widths
  const ws = [];
  let total = 0;
  const tr = -0.04 * size;
  for (let i = 0; i < str.length; i++) {
    const s = 0.5 + 0.5 * Math.sin(phase - i * 0.75);
    const wgt = Math.round(900 - amp * 780 * s);
    font(ctx, size, wgt);
    const w = ctx.measureText(str[i]).width;
    ws.push({ wgt, w, s });
    total += w + (i ? tr : 0);
  }
  font(ctx, size, 900);
  const asc = glyphs(ctx, 'CLAUDE', tr).ascent;
  const leftX = lerp(L2.x, 960 - total / 2, move);
  const base = lerp(L2.y2, 540 + asc / 2, move);
  const fall = (i) => seg(lt, 2.78 + i * 0.03, 3.0 + i * 0.03, ease.inBack);
  ctx.save();
  // reveal mask (line 2) – released once it starts moving
  if (move <= 0) {
    ctx.beginPath();
    ctx.rect(0, L2.y2 - asc - 40, W, asc + 80);
    ctx.clip();
  }
  let x = leftX;
  ctx.fillStyle = rgba(C.ink);
  ctx.textAlign = 'left';
  for (let i = 0; i < str.length; i++) {
    const { wgt, w, s } = ws[i];
    const yo = (1 - reveal) * (asc + 80) + fall(i) * 900;
    font(ctx, size, wgt);
    const sy = 1 + amp * 0.22 * (s - 0.5);
    ctx.save();
    ctx.translate(x + w / 2, base + yo);
    ctx.rotate(fall(i) * (i % 2 ? 0.5 : -0.4));
    ctx.scale(1, sy);
    ctx.textAlign = 'center';
    ctx.fillText(str[i], 0, 0);
    ctx.restore();
    x += w + tr;
  }
  // the full stop is our ball from scene 01
  const bp = spring(lt - 1.38, { stiffness: 320, damping: 13 });
  if (lt > 1.38 && move < 0.2) {
    const by = base - 22 - (1 - clamp(bp)) * 120;
    ctx.fillStyle = rgba(C.paper);
    ball(ctx, x + 40, by, 30 * clamp(bp * 1.3), 1, 1);
    ctx.globalAlpha = 1 - move * 5;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ------------------------------------------------ ICH BRINGE DINGE IN BEWEGUNG
function partBewegung(ctx, lt) {
  if (lt < 2.95 || lt >= 4) return;
  const lines = ['ICH BRINGE', 'DINGE IN', 'BEWEGUNG.'];
  const size = 196;
  const tr = -0.045 * size;
  font(ctx, size, 900);
  ctx.fillStyle = rgba(C.ink);
  for (let l = 0; l < 3; l++) {
    const p = seg(lt, 3.0 + l * 0.1, 3.42 + l * 0.1, ease.swift);
    if (p <= 0) continue;
    const dir = l % 2 ? 1 : -1;
    const g = glyphs(ctx, lines[l], tr);
    const base = 540 + (l - 1) * 200 + g.ascent / 2;
    const ox = 960 - g.width / 2 + dir * (1 - p) * 1700;
    const skew = dir * (1 - p) * 0.35;
    for (const gl of g.list) {
      if (gl.ch === ' ') continue;
      let dy = 0, sx = 1, sy = 1, col = C.ink;
      if (l === 2) {
        const h0 = 3.5 + gl.i * 0.045;
        const u = clamp((lt - h0) / 0.26);
        if (u > 0 && u < 1) {
          dy = -58 * Math.sin(Math.PI * u);
          const st = 1 + 0.2 * Math.sin(Math.PI * u);
          sy = st; sx = 1 / Math.sqrt(st);
          col = C.paper;
        }
        const land = lt - (h0 + 0.26);
        if (land > 0 && land < 0.2) {
          const q = Math.exp(-land * 25) * Math.cos(land * 60) * 0.18;
          sy = 1 - q; sx = 1 + q;
        }
      }
      ctx.save();
      ctx.translate(ox + gl.x + gl.w / 2, base + dy);
      ctx.transform(1, 0, skew, 1, 0, 0);
      ctx.scale(sx, sy);
      ctx.fillStyle = rgba(col);
      ctx.textAlign = 'center';
      ctx.fillText(gl.ch, 0, 0);
      ctx.restore();
    }
  }
}

// ---------------------------------------------------------- MARQUEE ------
const ROWS = [
  { word: 'TIMING', style: 'outline', col: C.paper },
  { word: 'RHYTHMUS', style: 'fill', col: C.orange },
  { word: 'MOTION', style: 'fill', col: C.paper },
  { word: 'KONTRAST', style: 'fill', col: C.orange },
  { word: 'GEFÜHL', style: 'outline', col: C.paper },
];
const MQ = { size: 166, gap: 186, dot: 15, spacing: 64 };

function rowOffset(lt, r) {
  const dir = r % 2 ? 1 : -1;
  let steps = 0;
  for (let b = 4.5; b <= 6.0; b += 0.5) steps += ease.snappy(clamp((lt - b) / 0.32));
  return dir * (steps * 360 + (lt - 4) * 60) + r * 137;
}

function marqueeRow(ctx, lt, r, exitP, centerOnly) {
  const row = ROWS[r];
  font(ctx, MQ.size, 900);
  const tr = -0.03 * MQ.size;
  const g = glyphs(ctx, row.word, tr);
  const unit = g.width + MQ.spacing * 2 + MQ.dot * 2;
  const base = 540 + (r - 2) * MQ.gap + g.ascent / 2;
  const off = rowOffset(lt, r);
  const reveal = seg(lt, 4.0 + Math.abs(r - 2) * 0.05, 4.45 + Math.abs(r - 2) * 0.05, ease.outExpo);
  const vy = (r < 2 ? -1 : 1) * exitP * 900;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-50, base - g.ascent - 30 + vy, W + 100, g.ascent + 60);
  ctx.clip();
  const ry = base + (1 - reveal) * (g.ascent + 60) + vy;
  ctx.letterSpacing = tr + 'px';
  ctx.fillStyle = rgba(row.col);
  ctx.strokeStyle = rgba(row.col);
  ctx.lineWidth = 2.5;
  let start = ((off % unit) + unit) % unit - unit;
  for (let x = start - unit; x < W + unit; x += unit) {
    if (row.style === 'fill') ctx.fillText(row.word, x, ry);
    else ctx.strokeText(row.word, x, ry);
    ctx.beginPath();
    ctx.arc(x + g.width + MQ.spacing + MQ.dot, ry - g.ascent / 2, MQ.dot, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  return { g, base, off, unit };
}

// Centre row resolves to a single MOTION that we zoom into.
function centerMotion(ctx, lt) {
  font(ctx, MQ.size, 900);
  const tr = -0.03 * MQ.size;
  const g = glyphs(ctx, 'MOTION', tr);
  const unit = g.width + MQ.spacing * 2 + MQ.dot * 2;
  const base = 540 + g.ascent / 2;
  const off = rowOffset(Math.min(lt, 6.0), 2);
  const start = ((off % unit) + unit) % unit - unit;
  // instance nearest to centre at lt = 6
  let best = start, bd = 1e9;
  for (let x = start - unit; x < W + unit; x += unit) {
    const d = Math.abs(x + g.width / 2 - 960);
    if (d < bd) { bd = d; best = x; }
  }
  const c = seg(lt, 6.0, 6.5, ease.snappy);
  const x0 = lerp(best, 960 - g.width / 2, c);
  return { g, base, x0, best, start, unit, c, tr };
}

function drawCenterRow(ctx, lt, M) {
  const { g, base, x0, best, start, unit, c, tr } = M;
  ctx.fillStyle = rgba(C.paper);
  ctx.letterSpacing = tr + 'px';
  const away = seg(lt, 6.0, 6.4, ease.inExpo);
  for (let x = start - unit; x < W + unit; x += unit) {
    if (x === best) continue;
    const dir = x < best ? -1 : 1;
    ctx.fillText('MOTION', x + dir * away * 2000, base);
  }
  // dots fly too
  for (let x = start - unit; x < W + unit; x += unit) {
    const dir = x < best ? -1 : 1;
    ctx.beginPath();
    ctx.arc(x + g.width + MQ.spacing + MQ.dot + dir * away * 2000, base - g.ascent / 2, MQ.dot * (1 - away), 0, TAU);
    ctx.fill();
  }
  ctx.fillText('MOTION', x0, base);
  ctx.letterSpacing = '0px';
}

function measureCounter() {
  const cv = document.createElement('canvas');
  cv.width = 400; cv.height = 400;
  const c = cv.getContext('2d', { willReadFrequently: true });
  font(c, MQ.size, 900);
  c.fillStyle = '#000';
  c.textAlign = 'center';
  c.fillText('O', 200, 300);
  const g = glyphs(c, 'O');
  const d = c.getImageData(0, 0, 400, 400).data;
  const cy = Math.round(300 - g.ascent / 2);
  const solid = (x, y) => d[(y * 400 + x) * 4 + 3] > 128;
  let l = 200, r = 200, t = cy, b = cy;
  while (l > 0 && !solid(l - 1, cy)) l--;
  while (r < 399 && !solid(r + 1, cy)) r++;
  while (t > 0 && !solid(200, t - 1)) t--;
  while (b < 399 && !solid(200, b + 1)) b++;
  counter = { rx: (r - l) / 2, ry: (b - t) / 2, dx: (l + r) / 2 - 200, dy: (t + b) / 2 - 300 };
}

function partMarquee(ctx, lt, t, drawNext) {
  if (lt < 4) return;
  fillBg(ctx, C.ink);
  const exitP = seg(lt, 6.0, 6.35, ease.inExpo);
  if (lt < 6.0) {
    for (let r = 0; r < 5; r++) marqueeRow(ctx, lt, r, 0);
    return;
  }
  for (let r = 0; r < 5; r++) if (r !== 2 && exitP < 1) marqueeRow(ctx, lt, r, exitP);
  const M = centerMotion(ctx, lt);
  // zoom into the first "O"
  const gO = M.g.list[1];
  const A0 = [M.x0 + gO.x + gO.w / 2 + counter.dx, M.base + counter.dy];
  const p = clamp((lt - 6.45) / (8.0 - 6.45));
  const ZMAX = 90;
  const z = Math.pow(ZMAX, ease.inQuart(p));
  const ap = ease.inOutCubic(p);
  const anchor = [lerp(A0[0], 960, ap), lerp(A0[1], 540, ap)];
  ctx.save();
  ctx.translate(anchor[0], anchor[1]);
  ctx.scale(z, z);
  ctx.translate(-A0[0], -A0[1]);
  drawCenterRow(ctx, lt, M);
  ctx.restore();
  if (p > 0 && drawNext) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(anchor[0], anchor[1], counter.rx * z + 1, counter.ry * z + 1, 0, 0, TAU);
    ctx.clip();
    ctx.translate(anchor[0], anchor[1]);
    const s3 = z / ZMAX;
    ctx.scale(s3, s3);
    ctx.translate(-960, -540);
    drawNext(ctx);
    ctx.restore();
    // redraw the O ring on top so the edge stays crisp
    ctx.save();
    ctx.translate(anchor[0], anchor[1]);
    ctx.scale(z, z);
    ctx.translate(-A0[0], -A0[1]);
    font(ctx, MQ.size, 900);
    ctx.fillStyle = rgba(C.paper);
    ctx.textAlign = 'center';
    ctx.fillText('O', M.x0 + gO.x + gO.w / 2, M.base);
    ctx.restore();
  }
}

const scene = {
  id: 'type',
  label: 'Kinetic Typography',
  num: '02',
  start: 4,
  end: 12,
  hud: (lt) => (lt < 4 ? C.ink : C.paper),
  init() { measureCounter(); },
  draw(ctx, lt, t, drawNext) {
    if (lt < 4) {
      fillBg(ctx, C.orange);
      partHallo(ctx, lt);
      partIntro(ctx, lt);
      partClaude(ctx, lt);
      partBewegung(ctx, lt);
    } else {
      partMarquee(ctx, lt, t, drawNext);
    }
  },
  blur: (lt) => (lt < 0.5 || (lt > 2.9 && lt < 3.6) ? 8 : lt > 7.3 ? 10 : 0),
  sfx: [
    { t: 0.0, type: 'impact', gain: 1.0 },
    { t: 0.84, type: 'swish', gain: 0.5, pan: 0 },
    { t: 1.0, type: 'swish', gain: 0.4, pan: -0.3 },
    { t: 1.08, type: 'swish', gain: 0.35, pan: 0.3 },
    { t: 1.38, type: 'pop', gain: 0.7, pitch: 1.3 },
    { t: 2.0, type: 'wobble', gain: 0.5, dur: 0.8 },
    { t: 2.78, type: 'drop', gain: 0.5 },
    { t: 3.0, type: 'whoosh', gain: 0.6, pan: -0.6, dur: 0.4 },
    { t: 3.1, type: 'whoosh', gain: 0.55, pan: 0.6, dur: 0.4 },
    { t: 3.2, type: 'whoosh', gain: 0.5, pan: -0.6, dur: 0.4 },
    ...Array.from({ length: 9 }, (_, i) => ({ t: 3.5 + i * 0.045, type: 'blip', gain: 0.35, pitch: 1 + i * 0.12 })),
    { t: 4.0, type: 'impact', gain: 0.7 },
    { t: 4.5, type: 'clack', gain: 0.5 }, { t: 5.0, type: 'clack', gain: 0.5 }, { t: 5.5, type: 'clack', gain: 0.5 },
    { t: 6.0, type: 'swish', gain: 0.6 },
    { t: 6.45, type: 'zoom', gain: 0.9, dur: 1.55 },
  ],
};
export default scene;
