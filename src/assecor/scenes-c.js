// Part C (32.3 – 48.05 s): the numbers (20+ years, 250+ projects, 120+ experts),
// "Für den Mittelstand und für Großunternehmen." and the build-up into the drop
// (locations, then client names cut on eighth notes).
import { W, H, TAU, clamp, lerp, ease, seg, hash1, noise2 } from '../engine/core.js';
import {
  COL, FT, IMG, setFont, bg, camera, shake, rise, sentence, label, frameMarks, stroke, pts, arrow, hand,
  highlight, cover, photo, pixelIcon, lineIcon, block, cellWipe, measure, rgbaHex,
} from './lib.js';
import { wt } from './timeline.js';

// rolling odometer digits
function odometer(ctx, v, digits, x, y, size, color, o = {}) {
  const { fam = FT.cond, weight = 900, align = 'left' } = o;
  setFont(ctx, size, weight, fam);
  const dw = ctx.measureText('0').width * 0.98;
  const total = dw * digits;
  const ox = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox - 10, y - size * 0.8, total + 20, size * 0.86);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  for (let k = 0; k < digits; k++) {
    const place = Math.pow(10, digits - 1 - k);
    const raw = v / place;
    const below = (v % place) / place; // progress of the lower columns
    let pos = Math.floor(raw) + (place > 1 ? Math.max(0, (below * place - (place - 1))) : raw - Math.floor(raw));
    const d0 = Math.floor(pos), f = ease.inOutCubic(pos - d0);
    const cx = ox + dw * (k + 0.5);
    for (const [d, dy] of [[d0, -f], [d0 + 1, 1 - f]]) ctx.fillText(String(d % 10), cx, y + dy * size * 0.86);
  }
  ctx.restore();
  return total;
}

// ------------------------------------------------------------ 20+ Jahre ---
const jahre = {
  start: 32.3, end: wt('a08', 4) - 0.06,
  draw(ctx, t) {
    const T = (i) => wt('a08', i);
    bg(ctx, COL.yellow, 0.35);
    // a ruler of years scrolls by underneath
    const off = (t - 32.3) * 260;
    ctx.strokeStyle = COL.navy; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = -2; i < 40; i++) {
      const x = i * 60 - (off % 60);
      const big = (i + Math.floor(off / 60)) % 5 === 0;
      ctx.moveTo(x, 960); ctx.lineTo(x, 960 - (big ? 50 : 24));
    }
    ctx.moveTo(0, 960); ctx.lineTo(W, 960);
    ctx.stroke();
    const v = 20 * ease.outCubic(seg(t, T(2) - 0.15, T(2) + 0.55));
    const [sx, sy] = shake(t, T(2) + 0.5, 8, 0.3);
    ctx.save();
    ctx.translate(sx, sy);
    rise(ctx, 'Seit über', 140, 300, t, T(0) - 0.05, { size: 78, weight: 300, style: 'italic', color: COL.navy });
    const ow = odometer(ctx, v, 2, 120, 790, 560, COL.navy);
    const pp = ease.outBack(seg(t, T(2) + 0.45, T(2) + 0.7));
    if (pp > 0) {
      ctx.save(); ctx.translate(120 + ow + 120, 430); ctx.scale(pp, pp);
      ctx.fillStyle = COL.coral; ctx.fillRect(-60, -18, 120, 36); ctx.fillRect(-18, -60, 36, 120);
      ctx.restore();
    }
    rise(ctx, 'Jahren.', 900, 760, t, T(3) - 0.05, { size: 170, weight: 700, style: 'italic', color: COL.navy });
    hand(ctx, 'Digitalisierungserfahrung', 920, 860, seg(t, T(3) + 0.2, T(3) + 0.7), { size: 58, color: COL.navy, rot: -0.03 });
    ctx.restore();
    frameMarks(ctx, t, { color: COL.navy, idx: '07 — Erfahrung', title: 'Seit über 20 Jahren', alpha: 0.6 });
  },
  sfx: [
    { t: 32.28, s: 'paper', gain: 0.35 },
    { t: wt('a08', 2) - 0.15, type: 'counter', gain: 0.35, dur: 0.65 },
    { t: wt('a08', 2) + 0.48, type: 'pop', gain: 0.4, pitch: 1.2 },
    { t: wt('a08', 2) + 0.5, s: 'stamp', gain: 0.4 },
  ],
};

// ---------------------------------------------------------- 250+ Projekte ---
const GRID_N = 250, GC = 25, GR = 10, CELL = 38, GAP = 8;
const order = Array.from({ length: GRID_N }, (_, i) => i).sort((a, b) => hash1(a * 7.31) - hash1(b * 7.31));
const rank = new Array(GRID_N);
order.forEach((k, r) => { rank[k] = r; });
const CELL_COL = [COL.mint, COL.blue, COL.coral, COL.yellow, COL.white];
const projekte = {
  start: wt('a08', 4) - 0.06, end: wt('a08', 8) - 0.06,
  draw(ctx, t) {
    const T = (i) => wt('a08', i);
    bg(ctx, COL.navy);
    const fill = seg(t, T(6) - 0.1, T(7) + 0.2, ease.inOutSine);
    const gx = 760, gy = 300;
    ctx.save();
    camera(ctx, { z: 1 + 0.03 * seg(t, this.start, this.end) });
    for (let i = 0; i < GRID_N; i++) {
      const c = i % GC, r = Math.floor(i / GC);
      const x = gx + c * (CELL + GAP), y = gy + r * (CELL + GAP);
      const on = rank[i] / GRID_N < fill;
      ctx.strokeStyle = rgbaHex(COL.white, 0.18);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
      if (on) {
        const age = clamp((fill - rank[i] / GRID_N) * 20);
        const s = CELL * ease.outBack(age);
        ctx.fillStyle = CELL_COL[Math.floor(hash1(i * 3.7) * 5)];
        ctx.fillRect(x + (CELL - s) / 2, y + (CELL - s) / 2, s, s);
      }
    }
    rise(ctx, 'Mehr als', 130, 340, t, T(4) - 0.05, { size: 64, weight: 300, style: 'italic' });
    odometer(ctx, Math.round(250 * fill * 4) / 4, 3, 120, 640, 300, COL.white);
    const pp = ease.outBack(seg(t, T(7) - 0.1, T(7) + 0.15));
    if (pp > 0) { ctx.save(); ctx.translate(640, 455); ctx.scale(pp, pp); ctx.fillStyle = COL.mint; ctx.fillRect(-36, -11, 72, 22); ctx.fillRect(-11, -36, 22, 72); ctx.restore(); }
    rise(ctx, 'Projekte.', 130, 800, t, T(7) - 0.05, { size: 130, weight: 700, style: 'italic' });
    label(ctx, 'KI · Software · Digitalisierung', 136, 870, { alpha: 0.7 * seg(t, T(7), T(7) + 0.3), size: 15 });
    ctx.restore();
    frameMarks(ctx, t, { idx: '08 — Projekte', title: 'Erfolgreich umgesetzt', alpha: 0.5 });
  },
  sfx: [
    { t: wt('a08', 4) - 0.06, s: 'glitch', gain: 0.25 },
    { t: wt('a08', 6) - 0.1, type: 'counter', gain: 0.3, dur: 1.4 },
    { t: wt('a08', 6), s: 'blocks', gain: 0.3, rate: 1.5 },
    { t: wt('a08', 7) - 0.1, type: 'pop', gain: 0.35, pitch: 1.5 },
  ],
};

// ------------------------------------------------- 120+ Expertinnen & Experten ---
const PEOPLE = ['team', 'talk', 'meeting', 'presenter', 'whiteboard', 'sticky', 'typing', 'handshake2', 'machinist', 'notes', 'sketch', 'code'];
const TC = 15, TR = 8, TW = W / TC, TH = H / TR;
const TILES = Array.from({ length: TC * TR }, (_, k) => ({
  img: PEOPLE[Math.floor(hash1(k * 5.13) * PEOPLE.length)],
  fx: 0.2 + 0.6 * hash1(k * 2.7), fy: 0.25 + 0.5 * hash1(k * 9.1), zoom: 2.2 + 2 * hash1(k * 4.4),
  d: Math.hypot((k % TC) - 7, Math.floor(k / TC) - 3.5),
}));
const experten = {
  start: wt('a08', 8) - 0.06, end: 40.95,
  draw(ctx, t) {
    const T = (i) => wt('a08', i);
    bg(ctx, COL.navy);
    const t0 = this.start;
    // break at 38.05: the drums drop out, the camera starts drifting in
    const z = 1 + 0.12 * ease.inOutSine(seg(t, 38.0, 40.95));
    ctx.save();
    camera(ctx, { z, r: 0.01 * seg(t, 38, 40.95) });
    TILES.forEach((tile, k) => {
      const c = k % TC, r = Math.floor(k / TC);
      const p = seg(t, t0 + tile.d * 0.05, t0 + tile.d * 0.05 + 0.25);
      const po = seg(t, 40.25 + (14 - tile.d) * 0.03, 40.45 + (14 - tile.d) * 0.03);
      const sx = Math.abs(Math.cos((1 - p) * Math.PI / 2 + po * Math.PI)); // flip in, then over to the light back
      if (p <= 0 || sx < 0.01) return;
      ctx.save();
      ctx.translate(c * TW + TW / 2, r * TH + TH / 2);
      ctx.scale(sx, 1);
      if (po > 0.5) { ctx.fillStyle = COL.blueT; ctx.fillRect(-TW / 2, -TH / 2, TW + 1, TH + 1); }
      else {
        cover(ctx, IMG[tile.img], -TW / 2 + 2, -TH / 2 + 2, TW - 4, TH - 4, { zoom: tile.zoom, fx: tile.fx, fy: tile.fy });
        if (hash1(k * 1.7) < 0.14) { ctx.fillStyle = rgbaHex([COL.mint, COL.blue, COL.coral, COL.yellow][k % 4], 0.85); ctx.globalCompositeOperation = 'multiply'; ctx.fillRect(-TW / 2 + 2, -TH / 2 + 2, TW - 4, TH - 4); ctx.globalCompositeOperation = 'source-over'; }
      }
      ctx.restore();
    });
    ctx.restore();
    // counter plate
    const out = seg(t, 40.1, 40.4, ease.inBack);
    const pp = ease.outBack(seg(t, T(9) - 0.1, T(9) + 0.2)) * (1 - out);
    if (pp > 0) {
      ctx.save();
      ctx.translate(W / 2, 470); ctx.scale(pp, pp);
      ctx.fillStyle = COL.coral; ctx.fillRect(-330, -190, 660, 330);
      odometer(ctx, 120 * ease.outCubic(seg(t, T(9) - 0.1, T(9) + 0.6)), 3, 0, 110, 290, COL.white, { align: 'center' });
      ctx.fillStyle = COL.white; ctx.fillRect(250, -95, 60, 18); ctx.fillRect(271, -116, 18, 60);
      ctx.restore();
    }
    if (t < 40.4) {
      ctx.fillStyle = rgbaHex(COL.navy, 0.92 * seg(t, T(10) - 0.15, T(10)));
      ctx.fillRect(0, 700, W, 170);
      sentence(ctx, 'a08', t, { from: 8, to: 13, y: 812, size: 74, weight: 300, styles: (i) => (i === 9 ? { size: 0.001 } : i === 10 || i === 12 ? { weight: 700 } : { style: 'italic' }), words: { 9: '' }, out: 40.1 });
    }
    frameMarks(ctx, t, { idx: '09 — Menschen', title: 'KI-Architekt:innen & IT-Expert:innen', alpha: 0.6 * (1 - seg(t, 40.2, 40.5)) });
  },
  blur: (t) => (t < 37.6 || t > 40.2 ? 4 : 3),
  sfx: [
    { t: wt('a08', 8) - 0.06, s: 'shutter', gain: 0.35 },
    ...Array.from({ length: 6 }, (_, i) => ({ t: wt('a08', 8) + i * 0.07, type: 'flip', gain: 0.2 })),
    { t: wt('a08', 9) - 0.1, type: 'counter', gain: 0.25, dur: 0.7 },
    { t: wt('a08', 9) - 0.08, type: 'pop', gain: 0.4 },
    { t: 40.25, s: 'tape', gain: 0.3 },
  ],
};

// ------------------------------------------ Mittelstand & Großunternehmen ---
const factory = () => [
  // shed with saw-tooth roof + chimney
  ...pts.line(250, 720, 250, 520, 10), ...pts.line(250, 520, 340, 450, 8).slice(1), ...pts.line(340, 450, 340, 520, 6).slice(1),
  ...pts.line(340, 520, 430, 450, 8).slice(1), ...pts.line(430, 450, 430, 520, 6).slice(1), ...pts.line(430, 520, 520, 450, 8).slice(1),
  ...pts.line(520, 450, 520, 520, 6).slice(1), ...pts.line(520, 520, 600, 520, 6).slice(1), ...pts.line(600, 520, 600, 330, 10).slice(1),
  ...pts.line(600, 330, 650, 330, 4).slice(1), ...pts.line(650, 330, 650, 720, 14).slice(1), ...pts.line(650, 720, 200, 720, 16).slice(1),
];
const tower = () => [
  ...pts.line(1280, 720, 1280, 190, 20), ...pts.line(1280, 190, 1390, 130, 6).slice(1), ...pts.line(1390, 130, 1500, 190, 6).slice(1),
  ...pts.line(1500, 190, 1500, 720, 20).slice(1), ...pts.line(1500, 720, 1230, 720, 10).slice(1),
];
const mittelstand = {
  start: 40.95, end: 44.05,
  draw(ctx, t) {
    const T = (i) => wt('a09', i);
    bg(ctx, COL.blueT, 0.6);
    ctx.save();
    camera(ctx, { z: 1 + 0.03 * seg(t, 40.95, 44.05) });
    // ground line
    stroke(ctx, pts.line(80, 722, 1840, 724, 40), seg(t, 41.0, 41.4), { color: COL.navy, width: 4, t, seed: 201 });
    stroke(ctx, factory(), seg(t, T(2) - 0.15, T(2) + 0.45), { color: COL.navy, width: 5, t, seed: 202 });
    for (let i = 0; i < 3; i++) { // windows of the shed
      const p = seg(t, T(2) + 0.3 + i * 0.06, T(2) + 0.4 + i * 0.06);
      ctx.fillStyle = COL.yellow; ctx.fillRect(285 + i * 95, 590, 45 * p, 45);
    }
    stroke(ctx, tower(), seg(t, T(5) - 0.15, T(5) + 0.45), { color: COL.navy, width: 5, t, seed: 203 });
    for (let r = 0; r < 9; r++) for (let c = 0; c < 3; c++) { // tower windows
      const p = seg(t, T(5) + 0.2 + (r * 3 + c) * 0.015, T(5) + 0.3 + (r * 3 + c) * 0.015);
      if (p > 0) { ctx.fillStyle = (r + c) % 3 ? COL.navy : COL.coral; ctx.fillRect(1310 + c * 62, 230 + r * 52, 36 * p, 26); }
    }
    photo(ctx, IMG.machinist, 860, 420, 300, 210, { rot: 0.05, seed: 4, scale: ease.outBack(seg(t, T(2), T(2) + 0.3)), torn: true });
    photo(ctx, IMG.tower, 1720, 420, 260, 340, { rot: -0.04, seed: 6, scale: ease.outBack(seg(t, T(5), T(5) + 0.3)), fx: 0.4 });
    rise(ctx, 'Für den', 200, 860, t, T(0) - 0.05, { size: 62, weight: 300, style: 'italic', color: COL.navy });
    rise(ctx, 'Mittelstand', 200, 990, t, T(2) - 0.05, { size: 112, weight: 700, fam: FT.sans, color: COL.navy, track: -2 });
    rise(ctx, 'und für', 1820, 860, t, T(3) - 0.05, { size: 62, weight: 300, style: 'italic', color: COL.navy, align: 'right' });
    rise(ctx, 'Großunternehmen.', 1820, 990, t, T(5) - 0.05, { size: 112, weight: 700, fam: FT.sans, color: COL.navy, track: -2, align: 'right' });
    ctx.restore();
    frameMarks(ctx, t, { color: COL.navy, idx: '10 — Kunden', title: 'KMU & Konzerne', alpha: 0.6 });
  },
  sfx: [
    { t: 40.95, s: 'paper', gain: 0.3 },
    { t: wt('a09', 2) - 0.15, s: 'scribble', gain: 0.3, rate: 0.9 },
    { t: wt('a09', 2), s: 'photo', gain: 0.35 },
    { t: wt('a09', 5) - 0.15, s: 'scribble', gain: 0.3, rate: 0.8 },
    { t: wt('a09', 5), s: 'photo', gain: 0.35 },
  ],
};

// ---------------------------------------------------- build: locations ---
// The four Assecor locations as line drawings in coloured circles (after the site's location icons).
const CITIES = [
  { name: 'Berlin', col: COL.mint, x: 360 },
  { name: 'Hannover', col: COL.blue, x: 760 },
  { name: 'Nürnberg', col: COL.coral, x: 1160 },
  { name: 'Stralsund', col: COL.yellow, x: 1560 },
];
function cityArt(i, cx, cy) {
  const L = (x0, y0, x1, y1, n = 8) => pts.line(cx + x0, cy + y0, cx + x1, cy + y1, n);
  if (i === 0) return [L(0, -150, 0, -95), pts.loop(cx, cy - 60, 36, 36, { turns: 1, start: 0 }), L(-10, -24, -14, 110), L(10, -24, 14, 110), L(-60, 110, 60, 110)];
  if (i === 1) return [L(-90, 110, -90, -10), L(-90, -10, 90, -10), L(90, -10, 90, 110), pts.arc(cx - 45, cy - 10, cx + 45, cy - 10, 55, 20), L(0, -65, 0, -120), L(-90, 110, 90, 110), L(-50, 40, -50, 110), L(0, 40, 0, 110), L(50, 40, 50, 110)];
  if (i === 2) return [L(-90, 110, -90, -40), L(-90, -40, -40, -40), L(-40, -40, -40, -90), L(-40, -90, 10, -90), L(10, -90, 10, 110), L(10, 0, 90, 0), L(90, 0, 90, 110), L(-95, 110, 95, 110), L(-75, -40, -75, -60), L(-55, -40, -55, -60)];
  return [L(0, -120, 0, 60), L(0, -120, 70, 40), L(70, 40, 0, 40), L(-8, -90, -70, 40), L(-70, 40, -8, 40), L(-100, 70, 100, 70), L(-100, 70, -70, 105), L(-70, 105, 70, 105), L(70, 105, 100, 70)];
}
const CLIENTS = ['DATEV', 'BVG', 'Deutsche Bahn', 'S-Bahn Berlin', 'Stromnetz Berlin', 'Vattenfall', 'Hamburg Port Authority', 'ITDZ Berlin'];
const CLIENT_BG = [COL.navy, COL.yellow, COL.coral, COL.blue, COL.navy, COL.mint, COL.navy, COL.yellow];
const CLIENT_IMG = { 0: 'station', 4: 'pylon', 6: 'spree' };
const build = {
  start: 44.05, end: 48.05,
  draw(ctx, t) {
    if (t < 46.05) {
      bg(ctx, COL.navy);
      rise(ctx, 'Überall zuhause.', W / 2, 250, t, 44.08, { size: 64, weight: 400, align: 'center' });
      // dashed route connecting the locations
      ctx.setLineDash([16, 14]);
      stroke(ctx, pts.line(360, 540, 1560, 540, 60), seg(t, 44.1, 45.9), { color: COL.white, width: 3, t, seed: 301, double: false, alpha: 0.5 });
      ctx.setLineDash([]);
      CITIES.forEach((c, i) => {
        const t0 = 44.05 + i * 0.5;
        const p = ease.outBack(seg(t, t0, t0 + 0.3));
        if (p <= 0) return;
        ctx.fillStyle = c.col;
        ctx.beginPath(); ctx.arc(c.x, 540, 150 * p, 0, TAU); ctx.fill();
        cityArt(i, c.x, 530).forEach((s, k) => stroke(ctx, s, seg(t, t0 + 0.08 + k * 0.03, t0 + 0.35 + k * 0.03), { color: COL.navy, width: 5, t, seed: 310 + i * 10 + k }));
        rise(ctx, c.name, c.x, 790, t, t0 + 0.1, { size: 34, weight: 500, fam: FT.sans, align: 'center' });
      });
      frameMarks(ctx, t, { idx: '11 — Standorte', title: 'Vereint in der Mission', alpha: 0.5 });
      return;
    }
    // client names on eighth notes
    const k = clamp(Math.floor((t - 46.05) / 0.25), 0, CLIENTS.length - 1);
    const lt = t - (46.05 + k * 0.25);
    bg(ctx, CLIENT_BG[k]);
    const dark = CLIENT_BG[k] === COL.yellow || CLIENT_BG[k] === COL.mint;
    if (CLIENT_IMG[k]) {
      cover(ctx, IMG[CLIENT_IMG[k]], 0, 0, W, H, { zoom: 1.15 + lt * 0.3 });
      ctx.fillStyle = rgbaHex(COL.navy, 0.45); ctx.fillRect(0, 0, W, H);
    }
    const name = CLIENTS[k];
    let size = 260;
    const mw = measure(ctx, name.toUpperCase(), size, 900, FT.cond, 'normal', -2);
    if (mw > 1700) size *= 1700 / mw;
    const sc = 1.15 - 0.15 * ease.outExpo(clamp(lt / 0.2));
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
    setFont(ctx, size, 900, FT.cond);
    ctx.letterSpacing = '-2px';
    ctx.fillStyle = dark && !CLIENT_IMG[k] ? COL.navy : COL.white;
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), W / 2, H / 2 + size * 0.35);
    ctx.letterSpacing = '0px';
    ctx.restore();
    label(ctx, 'Kund:innen, u. a.', 92, 82, { color: dark && !CLIENT_IMG[k] ? COL.navy : COL.white, size: 15 });
    label(ctx, `${String(k + 1).padStart(2, '0')} / 08`, W - 92, 82, { color: dark && !CLIENT_IMG[k] ? COL.navy : COL.white, size: 15, align: 'right' });
    // white-out into the drop
    const wo = seg(t, 47.75, 48.05, ease.inQuad);
    if (wo > 0) { ctx.fillStyle = `rgba(255,255,255,${wo})`; ctx.fillRect(0, 0, W, H); }
  },
  blur: (t) => (t > 46 ? 2 : 3),
  sfx: [
    ...CITIES.map((c, i) => ({ t: 44.05 + i * 0.5, type: 'pop', gain: 0.35, pitch: 0.8 + i * 0.15 })),
    ...CITIES.map((c, i) => ({ t: 44.12 + i * 0.5, s: 'scribble', gain: 0.16, rate: 1.3, pan: (i - 1.5) * 0.4 })),
    ...CLIENTS.map((c, i) => ({ t: 46.05 + i * 0.25, s: 'shutter', gain: 0.3, rate: 1 + i * 0.03 })),
    { t: 46.05, type: 'riser', gain: 0.4, dur: 2.0 },
  ],
};

export default [jahre, projekte, experten, mittelstand, build];
