// Act 4 (20–30 s): "Machen." The four saved ideas come to life as one continuous sketchbook panorama —
// cooking, throwing a vase, a summit, a living-room dance — joined by whip pans, then the camera pulls
// back until the four drawings sit side by side like pins on a board.
import { clamp, lerp, ease, seg, spring, kf, rng, TAU, smoothstep } from '../engine/core.js';
import * as G from './gl.js';
import { THREE } from './gl.js';
import { drawPencil, pencilText, boilAt, ellipse, capsule, blob, smooth, rrect, PC, shadeOf, mat, xf } from './pencil.js';
import { personItems, CAST } from './figures.js';
import { kinetic, rr, RED, INK } from './ui.js';

export const T0 = 20, T1 = 30;
const SP = 2400; // scene spacing in world px
export const OUT = [29.15, 30.0]; // pull-back to the board

// ------------------------------------------------------------ camera ---
export function cam(t) {
  const W = ease.inOutQuart;
  const x = kf(t, [[0, 0], [22.36, 0], [22.64, SP, W], [24.86, SP], [25.14, SP * 2, W], [27.36, SP * 2], [27.64, SP * 3, W], [OUT[0], SP * 3], [OUT[1], SP * 1.5, ease.inOutCubic]]);
  const push = (a, b) => (t >= a && t < b ? 1 + 0.05 * seg(t, a, b, ease.inOutSine) : 0);
  let z = push(-10, 22.5) || push(22.5, 25.0) || push(25.0, 27.5) || push(27.5, OUT[0]) || 1;
  if (t >= OUT[0]) z = lerp(1.05, 0.2, ease.inOutCubic(seg(t, OUT[0], OUT[1])));
  if (t >= 27.5 && t < OUT[0]) z = 1 + 0.05 * seg(t, 27.5, OUT[0], ease.inOutSine);
  return { x, z };
}
const toScreen = (c, wx, wy) => [(wx - c.x - 960) * c.z + 960, (wy - 540) * c.z + 540];

// ------------------------------------------------------- background ---
const wash = (pts, fill, seed) => ({ pts, fill, shade: null, line: null, flat: 1, gloss: 0, gap: 3.8, pressure: 0.5, solid: true, hw: 1.9, seed, noOcclude: true });
const ol = (pts, color, lw = 2.4, seed = 1) => ({ pts, open: true, line: color, lw, seed });
const leaf = (x, y, len, wid, rot, fill = PC.green, seed = 3) => {
  const P = [[0, 0], [len * 0.3, -wid], [len * 0.75, -wid * 0.7], [len, 0], [len * 0.7, wid * 0.65], [len * 0.3, wid * 0.8]];
  return { pts: smooth(P, true, 6), m: mat(x, y, rot), fill, seed, lw: 2 };
};
const plant = (x, y, s, seed) => {
  const out = [];
  [[-1.9, 70], [-1.5, 84], [-1.1, 76], [-2.3, 60], [-0.8, 62]].forEach(([r, l], i) => out.push(leaf(x, y - 10 * s, l * s, 16 * s, r, i % 2 ? PC.green : PC.forest, seed + i)));
  out.push({ pts: smooth([[x - 40 * s, y - 6 * s], [x + 40 * s, y - 6 * s], [x + 30 * s, y + 60 * s], [x - 30 * s, y + 60 * s]], true, 2), fill: PC.coral, shade: PC.brown, seed: seed + 9 });
  return out;
};

export const BG = {
  kitchen() {
    const it = [wash(blob(960, 560, 820, 3, 0.1, 60, 0.62), '#FFF1D6', 1)];
    // shelf + jars on the left
    it.push({ pts: rrect(110, 420, 430, 18, 6), fill: PC.tan, shade: PC.brown, seed: 2 });
    [[150, 90, PC.yellow], [260, 120, PC.coral], [380, 80, PC.mint]].forEach(([x, h, c], i) => {
      it.push({ pts: rrect(x, 420 - h, 80, h, 14), fill: '#EEF2F6', shade: '#B9C2CF', line: '#7A8494', seed: 10 + i, pressure: 0.6 });
      it.push({ pts: rrect(x + 10, 420 - h * 0.7, 60, h * 0.62, 10), fill: c, seed: 20 + i, lw: 1.6 });
      it.push({ pts: rrect(x + 4, 420 - h - 16, 72, 18, 6), fill: PC.brown, seed: 30 + i });
    });
    it.push(...plant(470, 345, 0.7, 40));
    // hanging utensils
    it.push(ol([[1540, 150], [1860, 150]], PC.graphite, 3, 50));
    it.push(ol([[1600, 150], [1600, 290]], PC.umber, 6, 51), { pts: ellipse(1600, 310, 22, 30), fill: PC.tan, seed: 52 });
    it.push(ol([[1700, 150], [1700, 260]], PC.graphite, 3, 53), { pts: ellipse(1700, 300, 48, 48), fill: PC.graphite, shade: PC.ink, seed: 54 });
    it.push(ol([[1800, 150], [1800, 300]], PC.umber, 5, 55), { pts: rrect(1780, 300, 40, 50, 10), fill: '#C9CED6', seed: 56 });
    // counter
    it.push({ pts: rrect(-80, 800, 2080, 400, 10), fill: PC.tan, shade: PC.brown, seed: 60, gloss: 0.2 });
    it.push({ pts: rrect(-80, 790, 2080, 30, 8), fill: shadeOf(PC.tan, -0.15), seed: 61 });
    for (let k = 0; k < 7; k++) it.push(ol([[k * 300 + 40, 860], [k * 300 + 40, 1080]], shadeOf(PC.tan, -0.3), 1.6, 70 + k));
    // cutting board with tomatoes + basil
    it.push({ pts: rrect(470, 770, 380, 34, 16), fill: PC.ochre, shade: PC.brown, seed: 80 });
    [[560, 752, 26], [620, 760, 20]].forEach(([x, y, r], i) => it.push({ pts: ellipse(x, y, r, r * 0.92), fill: PC.red, shade: PC.crimson, seed: 81 + i }));
    it.push(leaf(700, 760, 50, 18, -0.3, PC.green, 85), leaf(740, 770, 44, 16, -2.8, PC.forest, 86));
    return it;
  },
  studio() {
    const it = [wash(blob(960, 560, 830, 8, 0.1, 60, 0.6), '#EFE8F8', 101)];
    it.push({ pts: rrect(1330, 390, 470, 18, 6), fill: PC.tan, shade: PC.brown, seed: 102 });
    const vase = (cx, base, hgt, wid, neck, fill, seed) => ({ pts: smooth([[cx - neck, base - hgt], [cx - wid, base - hgt * 0.45], [cx - wid * 0.5, base], [cx + wid * 0.5, base], [cx + wid, base - hgt * 0.45], [cx + neck, base - hgt]], true, 6), fill, seed });
    it.push(vase(1420, 390, 130, 44, 16, PC.coral, 103), vase(1540, 390, 90, 40, 22, PC.sky, 104), vase(1660, 390, 150, 34, 12, PC.cream, 105), vase(1750, 390, 70, 30, 18, PC.teal, 106));
    it.push(...plant(260, 780, 1.2, 110));
    // stool hint + floor
    it.push(ol([[-60, 1010], [1980, 1000]], shadeOf('#EFE8F8', -0.4), 2.4, 120));
    return it;
  },
  summit() {
    const it = [wash(blob(960, 520, 900, 12, 0.08, 60, 0.6), '#DDEFFB', 201)];
    return it;
  },
  room() {
    const it = [wash(blob(960, 560, 840, 21, 0.1, 60, 0.6), '#FDE6EF', 301)];
    // floor + rug
    it.push(ol([[-60, 905], [1980, 900]], '#C9A0B0', 2.6, 302));
    it.push({ pts: ellipse(960, 930, 520, 54), fill: PC.lilac, shade: PC.violet, seed: 303 });
    // arc lamp left
    it.push(ol(smooth([[330, 900], [330, 420], [420, 250], [600, 230]], false, 8), PC.graphite, 5, 304));
    it.push({ pts: smooth([[540, 230], [660, 230], [640, 280], [560, 280]], true, 3), fill: PC.yellow, shade: PC.ochre, seed: 305 });
    it.push({ pts: ellipse(330, 905, 60, 14), fill: PC.graphite, seed: 306 });
    // sideboard right
    it.push({ pts: rrect(1380, 660, 440, 240, 18), fill: PC.teal, shade: shadeOf(PC.teal, -0.4), seed: 307 });
    it.push(ol([[1600, 680], [1600, 880]], shadeOf(PC.teal, -0.45), 2, 308));
    it.push({ pts: ellipse(1570, 780, 8, 8), fill: PC.ochre, seed: 309 }, { pts: ellipse(1630, 780, 8, 8), fill: PC.ochre, seed: 310 });
    it.push(...plant(1760, 600, 0.8, 320));
    // record player body (record spins live)
    it.push({ pts: rrect(1420, 590, 250, 70, 12), fill: PC.coral, shade: PC.brown, seed: 330 });
    // poster
    it.push({ pts: rrect(1440, 250, 170, 220, 8), fill: PC.white, seed: 340, line: PC.umber }, { pts: blob(1525, 360, 50, 5, 0.2), fill: PC.orange, seed: 341 }, { pts: blob(1490, 400, 32, 9, 0.2), fill: PC.pink, seed: 342 });
    return it;
  },
};
const bgCache = new Map();
function bgCanvas(name, boil) {
  const k = name + (boil % 3);
  if (bgCache.has(k)) return bgCache.get(k);
  const c = document.createElement('canvas');
  c.width = 1920; c.height = 1080;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.fillRect(0, 0, 1920, 1080);
  drawPencil(g, BG[name](), { boil: boil % 3 });
  bgCache.set(k, c);
  return c;
}

// ----------------------------------------------------------- scenes ---
const beat = (t) => (t - 20) / 0.5;

function sceneKitchen(ctx, t, boil) {
  const b = beat(t);
  const pot = [1270, 712];
  const stir = t * TAU * 1.0;
  const spoonTip = [pot[0] + Math.cos(stir) * 70, pot[1] + 6 + Math.sin(stir) * 14];
  const salt = Math.sin(t * TAU * 4) * 10;
  const cook = personItems(CAST.cook, {
    x: 1000, y: 930, s: 1.1, lean: 0.05 + 0.02 * Math.sin(b * Math.PI), headTilt: 0.06 * Math.sin(b * Math.PI) + 0.08, look: 0.35,
    bob: -6 * Math.abs(Math.sin(b * Math.PI)), smile: 1, mouthOpen: 0.1 + 0.12 * Math.max(0, Math.sin(b * Math.PI * 0.5)),
    blink: ((t * 1.1) % 2.6) < 0.1 ? 1 : 0,
    armR: { t: [(spoonTip[0] - 50 - 1000) / 1.1, (spoonTip[1] - 95 - 930) / 1.1], bend: 1 },
    armL: { t: [-175 + salt * 0.5, -395 + salt], bend: -1 },
    hide: { legs: true },
  });
  const it = [...cook.items.slice(0, cook.armStart)];
  // pot (in front of the cook, behind the stirring arm's hand? — arm sits on top)
  it.push({ pts: smooth([[pot[0] - 160, 712], [pot[0] + 160, 712], [pot[0] + 146, 820], [pot[0] + 110, 846], [pot[0] - 110, 846], [pot[0] - 146, 820]], true, 4), fill: PC.red, shade: PC.crimson, seed: 401, light: [-0.7, -0.6] });
  it.push({ pts: rrect(pot[0] - 200, 724, 50, 22, 10), fill: PC.crimson, seed: 402 }, { pts: rrect(pot[0] + 150, 724, 50, 22, 10), fill: PC.crimson, seed: 403 });
  it.push({ pts: ellipse(pot[0], 712, 162, 30), fill: '#5A2A20', shade: null, seed: 404, line: PC.crimson, solid: true });
  for (let k = 0; k < 6; k++) {
    const pts = [];
    for (let i = 0; i <= 18; i++) { const a = i * 0.45 + k * 1.3 + t * 2; pts.push([pot[0] + Math.cos(a) * (40 + k * 18), 712 + Math.sin(a) * (6 + k * 3)]); }
    it.push(ol(smooth(pts, false, 3), k % 2 ? PC.yellow : PC.ochre, 3, 410 + k));
  }
  // bubbles
  for (let k = 0; k < 5; k++) {
    const ph = (t * 1.7 + k * 0.37) % 1;
    const bx = pot[0] - 100 + k * 50, by = 708 - ph * 8;
    if (ph < 0.8) it.push({ pts: ellipse(bx, by, 6 + ph * 6, 4 + ph * 4), fill: null, shade: null, line: PC.cream, lw: 1.6, seed: 420 + k, noOcclude: true });
  }
  // wooden spoon from the right hand into the pot
  const hR = cook.hands.R;
  it.push(...cook.items.slice(cook.armStart));
  it.push(ol([hR, spoonTip], PC.ochre, 7, 430), ol([hR, spoonTip], PC.brown, 2, 431));
  // salt pinch falling from the left hand
  const hL = cook.hands.L;
  for (let k = 0; k < 3; k++) {
    const ph = (t * 1.4 + k / 3) % 1, a = -2.2 + k * 0.5;
    const r0 = 40 + ph * 70;
    it.push({ ...ol([[hL[0] + Math.cos(a) * r0, hL[1] + Math.sin(a) * r0], [hL[0] + Math.cos(a) * (r0 + 22), hL[1] + Math.sin(a) * (r0 + 22)]], PC.orange, 3.4, 440 + k), reveal: 1 - ph });
  }
  // steam
  for (let k = 0; k < 3; k++) {
    const pts = [];
    const x0 = pot[0] - 70 + k * 70;
    for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push([x0 + Math.sin(u * 5 + t * 3 + k) * 22, 680 - u * 230]); }
    it.push({ ...ol(smooth(pts, false, 3), '#A7A0B0', 2.2, 450 + k), reveal: 0.6 + 0.4 * Math.sin(t * 2 + k) });
  }
  drawPencil(ctx, it, { boil, paper: true, shadow: { dx: 8, dy: 14, blur: 26, alpha: 0.08 } });
  annotate(ctx, t, 21.0, 'Pasta wie in Rom', 1440, 400, [[1660, 430], [1600, 520], [1440, 630]], boil, -0.05, PC.red);
}

// clay profile: lump → cylinder → vase as it is pulled up
function clay(t) {
  const g = ease.inOutCubic(seg(t, 22.7, 24.6));
  const H = lerp(90, 215, g);
  const r = (u) => {
    const lump = 112 * Math.sqrt(Math.max(0, 1 - u * u * 0.85));
    const vase = 72 + 44 * Math.sin(Math.PI * Math.min(1, u * 1.15)) - 38 * smoothstep(0.62, 0.92, u) + 20 * smoothstep(0.9, 1, u);
    return lerp(lump, vase, g);
  };
  return { H, r };
}
function sceneStudio(ctx, t, boil) {
  const cx = 1060, base = 778;
  const { H, r } = clay(t);
  const hu = lerp(0.18, 0.46, (Math.sin(t * 2.4) * 0.5 + 0.5)) * (0.5 + 0.5 * seg(t, 22.7, 24.6));
  const hy = base - hu * H;
  const s = 1.0, px = 1060, py = 830;
  const potter = personItems(CAST.potter, {
    x: px, y: py, s, lean: 0.12, headTilt: 0.1, look: 0, smile: 0.8, blink: ((t * 1.3) % 2.2) < 0.1 ? 1 : 0, sway: Math.sin(t * 2),
    armL: { t: [cx - r(hu) - 14 - px, hy - py], bend: 1, hand: 'shown' },
    armR: { t: [cx + r(hu) + 14 - px, hy - py], bend: -1 },
    hide: { legs: true },
  });
  const it = [...potter.items.slice(0, potter.armStart)];
  // wheel body, splash pan, wheel head
  it.push({ pts: smooth([[760, 800], [1360, 800], [1400, 1100], [720, 1100]], true, 2), fill: '#6E7890', shade: '#3E4660', seed: 501 });
  it.push({ pts: ellipse(cx, 800, 310, 70), fill: '#9AA6BE', shade: '#5E6A86', seed: 502 });
  it.push({ pts: ellipse(cx, 790, 220, 44), fill: '#D9DEE8', shade: '#9AA6BE', seed: 503 });
  // spinning marks on the wheel head
  for (let k = 0; k < 4; k++) {
    const a = t * 9 + k * (TAU / 4);
    const x = cx + Math.cos(a) * 170, y = 790 + Math.sin(a) * 34;
    if (Math.sin(a) > -0.2) it.push(ol([[x - 14, y], [x + 14, y + 1]], '#6E7890', 2.4, 510 + k));
  }
  // the clay
  const L = [], R = [];
  for (let i = 0; i <= 16; i++) { const u = i / 16; L.push([cx - r(u), base - u * H]); R.push([cx + r(u), base - u * H]); }
  it.push({ pts: smooth([...L, ...R.reverse()], true, 3), fill: '#C9865A', shade: '#8E5232', seed: 520, light: [-0.8, -0.3] });
  it.push({ pts: ellipse(cx, base - H, r(1) * 0.92, 12), fill: '#8E5232', shade: null, seed: 521 });
  // throwing rings drifting round (reads as rotation)
  for (let k = 0; k < 3; k++) {
    const ph = ((t * 1.6 + k / 3) % 1) * 2 - 1;
    const u0 = 0.15 + k * 0.25;
    const pts = [];
    for (let i = 0; i <= 6; i++) { const u = u0 + i * 0.03; pts.push([cx + ph * r(u) * 0.8, base - u * H]); }
    it.push(ol(pts, '#E8B48E', 3, 530 + k));
  }
  for (let k = 0; k < 4; k++) {
    const u = 0.1 + k * 0.22;
    it.push(ol(smooth([[cx - r(u) * 0.96, base - u * H], [cx, base - u * H + 6], [cx + r(u) * 0.96, base - u * H]], false, 4), '#A86A44', 1.6, 540 + k));
  }
  // splashes
  for (let k = 0; k < 6; k++) {
    const ph = (t * 1.3 + k * 0.17) % 1;
    const sd = k % 2 ? 1 : -1;
    const x = cx + sd * (r(hu) + 20 + ph * 260), y = hy + ph * ph * 200 - ph * 60;
    if (ph < 0.85) it.push({ pts: ellipse(x, y, 4, 3), fill: '#B97A52', shade: null, seed: 550 + k, lw: 1.2 });
  }
  it.push(...potter.items.slice(potter.armStart));
  drawPencil(ctx, it, { boil, paper: true, shadow: { dx: 8, dy: 14, blur: 26, alpha: 0.08 } });
  annotate(ctx, t, 23.4, 'meine erste Vase!', 1360, 560, [[1360, 580], [1290, 640], [1200, 680]], boil, 0.04, PC.violet);
}

function sceneSummit(ctx, t, boil, c) {
  // parallax layers relative to the camera
  const par = (k) => -(c.x - SP * 2) * k;
  const it = [];
  // sun + rays
  const sx = 1500 + par(0.05), sy = 230;
  for (let k = 0; k < 12; k++) {
    const a = k * (TAU / 12) + t * 0.3;
    it.push(ol([[sx + Math.cos(a) * 88, sy + Math.sin(a) * 88], [sx + Math.cos(a) * 128, sy + Math.sin(a) * 128]], PC.orange, 3, 600 + k));
  }
  it.push({ pts: ellipse(sx, sy, 70, 70), fill: PC.yellow, shade: PC.orange, seed: 620, line: PC.orange });
  // clouds
  for (let k = 0; k < 3; k++) {
    const x = ((200 + k * 640 + t * 40 + par(0.1)) % 2100) - 100, y = 160 + k * 70;
    it.push({ pts: blob(x, y, 70, k + 2, 0.18, 30, 0.45), fill: PC.white, shade: '#DCE6F2', line: '#9FB4CC', seed: 630 + k });
  }
  const ridge = (base, amp, seed, fill, k, freq = 2.1) => {
    const R = rng(seed), P = [[-300, 1200]];
    for (let i = 0; i <= 14; i++) { const x = -300 + (i / 14) * 2520; P.push([x + par(k), base - amp * Math.abs(Math.sin(i * freq * 0.5 + seed)) - R() * amp * 0.35]); }
    P.push([2220 + par(k), 1200]);
    return { pts: P, fill, seed, line: shadeOf(fill, -0.4), lw: 2.4 };
  };
  it.push(ridge(560, 250, 3, '#A9B8DC', 0.15));
  it.push({ pts: [[520 + par(0.15), 330], [600 + par(0.15), 280], [680 + par(0.15), 340], [640 + par(0.15), 350], [600 + par(0.15), 330], [560 + par(0.15), 352]], fill: PC.white, seed: 640, shade: '#D3DDF0', line: '#8EA2C8', lw: 1.8 });
  it.push(ridge(760, 170, 6, '#86B98A', 0.3, 1.6));
  // pines on the mid ridge
  for (let k = 0; k < 7; k++) {
    const x = 120 + k * 270 + par(0.3) + (k % 2) * 60, y = 800 + (k % 3) * 30;
    if (Math.abs(x - 1000) < 260) continue;
    it.push({ pts: [[x, y - 110], [x + 30, y - 55], [x + 16, y - 55], [x + 40, y], [x - 40, y], [x - 16, y - 55], [x - 30, y - 55]], fill: PC.forest, seed: 650 + k, lw: 2.2 });
  }
  // birds
  for (let k = 0; k < 4; k++) {
    const x = ((300 + k * 120 + t * 160) % 2200) - 100 + par(0.08), y = 300 + Math.sin(t * 2 + k) * 20 + k * 26;
    const f = Math.sin(t * 14 + k * 2) * 8;
    it.push(ol(smooth([[x - 16, y - f], [x - 6, y - 4], [x, y], [x + 6, y - 4], [x + 16, y - f]], false, 3), PC.graphite, 2.2, 660 + k));
  }
  // summit rock (foreground)
  it.push({ pts: smooth([[-200, 1200], [-200, 960], [500, 900], [820, 840], [1000, 826], [1200, 844], [1500, 900], [2200, 960], [2200, 1200]], true, 4), fill: '#9C8F86', shade: '#6A5E58', seed: 670, light: [-0.6, -0.8] });
  it.push({ pts: smooth([[-200, 1200], [-200, 1000], [600, 960], [1000, 920], [1500, 960], [2200, 1010], [2200, 1200]], true, 4), fill: PC.lime, shade: PC.green, seed: 671 });
  // the hiker: arms go up, little jumps on the beat
  const up = spring(t - 25.25, { stiffness: 120, damping: 10 });
  const b = beat(t);
  const jump = t > 25.6 ? Math.max(0, Math.sin((b % 2) * Math.PI)) * (t < 27.2 ? 1 : 0) : 0;
  const s = 0.86, px = 1000, py = 600 - jump * 40;
  const hk = personItems(CAST.hiker, {
    x: px, y: py, s, smile: 1, mouthOpen: 0.3 * up, headTilt: -0.08 * up, look: 0,
    blink: ((t * 0.9) % 2.4) < 0.1 ? 1 : 0,
    armL: { t: [lerp(-60, -170, up), lerp(220, -440, up)], bend: 1 },
    armR: { t: [lerp(60, 175, up), lerp(220, -450, up)], bend: -1 },
    legL: { t: [-50, 290 - jump * 0], foot: -0.3 }, legR: { t: [50, 290], foot: 0.3 },
  });
  const hR = hk.hands.R;
  const flagWave = Math.sin(t * 9);
  const fl = [hR[0] + 46, hR[1] - 110];
  const flag = [ol([[hR[0], hR[1] + 20], fl], PC.umber, 5, 680),
    { pts: smooth([fl, [fl[0] + 60, fl[1] + 8 + flagWave * 6], [fl[0] + 120, fl[1] + 20 + flagWave * 10], [fl[0] + 60, fl[1] + 40 + flagWave * 6], [fl[0], fl[1] + 56]], true, 3), fill: '#E60023', shade: PC.crimson, seed: 681 }];
  drawPencil(ctx, [...it, ...flag, ...hk.items], { boil });
  annotate(ctx, t, 25.9, 'Gipfel geschafft!', 300, 560, [[560, 590], [700, 560], [800, 470]], boil, -0.04, PC.blue);
}

function sceneRoom(ctx, t, boil) {
  const b = beat(t), ph = b * Math.PI;
  const it = [];
  // disco ball + sparkles
  it.push(ol([[1100, 0], [1100, 120]], PC.graphite, 2, 700));
  it.push({ pts: ellipse(1100, 170, 54, 54), fill: '#D7DCE6', shade: '#8E96AA', seed: 701, line: '#6A7080' });
  for (let k = -2; k <= 2; k++) it.push(ol([[1050, 170 + k * 20], [1150, 170 + k * 20]], '#9AA2B6', 1.4, 702 + k + 2));
  for (let k = 0; k < 4; k++) { const a = t * 1.5 + k * 1.6; it.push(ol(smooth([[1100 + Math.cos(a) * 54, 120], [1100 + Math.cos(a) * 40, 170], [1100 + Math.cos(a) * 54, 220]], false, 3), '#9AA2B6', 1.4, 710 + k)); }
  for (let k = 0; k < 7; k++) {
    const R = rng(720 + k);
    const x = 300 + R() * 1400, y = 120 + R() * 500;
    const tw = Math.max(0, Math.sin(t * 6 + k * 1.7));
    if (tw < 0.2) continue;
    const sz = 10 + 14 * tw;
    it.push(ol([[x - sz, y], [x + sz, y]], PC.yellow, 3, 730 + k), ol([[x, y - sz], [x, y + sz]], PC.yellow, 3, 740 + k));
  }
  // spinning record
  const rx = 1545, ry = 590;
  it.push({ pts: ellipse(rx, ry, 100, 22), fill: PC.ink, solid: true, seed: 750, line: PC.ink });
  const ra = t * 8;
  it.push(ol([[rx + Math.cos(ra) * 80, ry + Math.sin(ra) * 17], [rx + Math.cos(ra) * 40, ry + Math.sin(ra) * 9]], '#8A8A9A', 2, 751));
  it.push({ pts: ellipse(rx, ry, 24, 6), fill: PC.yellow, seed: 752 });
  // notes floating up
  for (let k = 0; k < 4; k++) {
    const p = (t * 0.6 + k * 0.25) % 1;
    const x = 1500 + Math.sin(p * 6 + k) * 60 - k * 40, y = 560 - p * 380;
    const c = [PC.violet, PC.red, PC.teal, PC.orange][k];
    it.push({ pts: ellipse(x, y, 12, 9, -0.4), fill: c, seed: 760 + k * 2, lw: 1.6 }, ol([[x + 11, y - 2], [x + 11, y - 44], [x + 26, y - 36]], c, 3, 761 + k * 2));
  }
  // the dancer
  const s = 0.95;
  const sw = Math.sin(ph);
  const dn = personItems(CAST.dancer, {
    x: 960 + sw * 24, y: 575, s, lean: 0.14 * sw, headTilt: 0.14 * Math.sin(ph + 0.6), look: 0.3 * sw, sway: Math.sin(ph + 1),
    bob: -18 * Math.abs(Math.sin(ph)), smile: 1, mouthOpen: 0.25 + 0.2 * Math.abs(Math.sin(ph * 0.5)),
    blink: ((t * 1.2) % 2) < 0.1 ? 1 : 0,
    armL: { t: [-235 - 25 * Math.cos(ph), -250 - 140 * Math.max(0, Math.cos(ph))], bend: -1 },
    armR: { t: [235 + 25 * Math.cos(ph), -250 - 140 * Math.max(0, -Math.cos(ph))], bend: 1 },
    legL: { t: [-70 - 10 * sw, 300 - 50 * Math.max(0, Math.sin(ph))], foot: -0.3 },
    legR: { t: [70 - 10 * sw, 300 - 50 * Math.max(0, -Math.sin(ph))], foot: 0.3 },
  });
  // motion dashes around the dancer
  const dash = [];
  for (let k = 0; k < 3; k++) { const sd = k % 2 ? 1 : -1; const x = 960 + sd * (230 + k * 20), y = 420 + k * 90; dash.push({ ...ol([[x, y], [x + sd * 40, y - 14]], PC.rose, 3, 790 + k), reveal: Math.abs(Math.sin(ph)) }); }
  drawPencil(ctx, it, { boil });
  drawPencil(ctx, [...dn.items, ...dash], { boil, paper: true, shadow: { dx: 8, dy: 14, blur: 26, alpha: 0.08 } });
  annotate(ctx, t, 28.0, 'einfach tanzen', 230, 560, [[300, 590], [420, 640], [620, 620]], boil, -0.05, PC.rose);
}

// handwritten note + arrow + check that writes itself on
function annotate(ctx, t, t0, str, x, y, arrow, boil, rot, color) {
  const p = seg(t, t0, t0 + 0.55);
  if (p <= 0) return;
  pencilText(ctx, str, x, y, { font: '700 62px Caveat', color, rot, reveal: p, boil });
  const a = seg(t, t0 + 0.4, t0 + 0.75);
  if (a > 0) {
    const pts = smooth(arrow, false, 6);
    const end = pts[pts.length - 1], pre = pts[pts.length - 4];
    const ang = Math.atan2(end[1] - pre[1], end[0] - pre[0]);
    const head = [[end[0] - Math.cos(ang - 0.5) * 26, end[1] - Math.sin(ang - 0.5) * 26], end, [end[0] - Math.cos(ang + 0.5) * 26, end[1] - Math.sin(ang + 0.5) * 26]];
    drawPencil(ctx, [{ pts, open: true, line: color, lw: 3.4, seed: 900, reveal: a }, { pts: head, open: true, line: color, lw: 3.4, seed: 901, reveal: seg(t, t0 + 0.7, t0 + 0.85) }], { boil });
  }
  // check mark in a circle
  const c = seg(t, t0 + 0.55, t0 + 0.85);
  if (c > 0) {
    ctx.save();
    ctx.font = '700 62px Caveat';
    const w = ctx.measureText(str).width;
    ctx.restore();
    const cx = x + w * Math.cos(rot) + 46, cy = y - 20 + w * Math.sin(rot);
    drawPencil(ctx, [{ pts: ellipse(cx, cy, 30, 28), open: true, line: color, lw: 3, seed: 910, reveal: c }, { pts: [[cx - 14, cy], [cx - 3, cy + 12], [cx + 18, cy - 16]], open: true, line: color, lw: 4, seed: 911, reveal: seg(t, t0 + 0.75, t0 + 0.95) }], { boil });
  }
}

const SCENES = [
  { bg: 'kitchen', draw: sceneKitchen },
  { bg: 'studio', draw: sceneStudio },
  { bg: 'summit', draw: sceneSummit },
  { bg: 'room', draw: sceneRoom },
];

// --------------------------------------------------------------- GL ---
let accents = [];
export async function init() {
  for (const n of Object.keys(BG)) for (let b = 0; b < 3; b++) bgCanvas(n, b);
  const grp = new THREE.Group();
  grp.visible = false;
  G.getScene().add(grp);
  const defs = [
    [0, 'sphere', 'red', 330, 700, 26, 'bounce'], [0, 'sphere', 'red', 830, 690, 20, 'bounce2'],
    [1, 'torus', 'mint', 1620, 760, 46, 'float'], [1, 'box', 'butter', 420, 300, 40, 'float'],
    [2, 'star', 'butter', 1700, 560, 44, 'float'], [2, 'sphere', 'pink', 230, 300, 36, 'float'],
    [3, 'heart', 'red', 560, 520, 50, 'bounce'], [3, 'sphere', 'lilac', 1320, 330, 38, 'float'], [3, 'ring', 'butter', 1760, 300, 44, 'float'],
  ];
  for (const [k, kind, col, x, y, size, mode] of defs) {
    const m = G.mesh(kind, col), sh = G.shadowMesh();
    grp.add(m, sh);
    accents.push({ k, m, sh, x, y, size, mode, kind });
  }
  accents.group = grp;
}
function layoutAccents(t, c, only = null) {
  for (const a of accents) {
    const vis = only === null ? true : only.includes(a.k);
    a.m.visible = a.sh.visible = vis;
    if (!vis) continue;
    const b = (t - 20) / 0.5;
    let y = a.y, sq = 1, ground = a.y;
    if (a.mode.startsWith('bounce')) {
      const ph = ((b + (a.mode === 'bounce2' ? 0.5 : 0)) % 1 + 1) % 1;
      const h = 4 * ph * (1 - ph);
      y = a.y - h * 160;
      sq = ph < 0.08 || ph > 0.92 ? 0.8 : 1;
    } else y = a.y + Math.sin(t * 1.6 + a.x) * 24;
    const [sx, sy] = toScreen(c, a.x + a.k * SP, y);
    const [gx, gy] = toScreen(c, a.x + a.k * SP, a.mode.startsWith('bounce') ? ground + a.size : a.y + 150);
    const s = a.size * c.z;
    a.m.position.set(sx, sy, -200);
    a.m.scale.set(s / sq ** 0.5, s * sq, s / sq ** 0.5);
    a.m.rotation.set(t * 0.9 + a.x, t * 1.3, a.kind === 'heart' ? Math.PI + Math.sin(t * 3) * 0.3 : t * 0.4);
    a.sh.position.set(gx + 10 * c.z, gy, -0.5);
    const lift = clamp(1 - (gy - sy) / 400);
    a.sh.scale.set(s * 3 * (0.6 + 0.4 * lift), s * 1.0 * (0.6 + 0.4 * lift), 1);
    a.sh.material.opacity = 0.5 + 0.5 * lift;
  }
}

// ------------------------------------------------------------- draw ---
export function draw(ctx, t, frame, { portal = false } = {}) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 1920, 1080);
  const boil = boilAt(frame / 60);
  const c = portal ? { x: 0, z: 1 + 0.05 * seg(t, 19.2, 22.5) } : cam(t);
  const k0 = Math.floor((c.x - 1300 / c.z) / SP), k1 = Math.ceil((c.x + 1300 / c.z) / SP);
  const out = t >= OUT[0] ? ease.inOutCubic(seg(t, OUT[0], OUT[1])) : 0;
  const vis = [];
  for (let k = Math.max(0, k0); k <= Math.min(3, k1); k++) vis.push(k);
  for (const k of vis) {
    ctx.save();
    ctx.translate(960, 540); ctx.scale(c.z, c.z); ctx.translate(-(c.x + 960) + k * SP, -540);
    if (out > 0) {
      // the drawings become cards
      rr(ctx, 0, 0, 1920, 1080, lerp(0, 120, out));
      ctx.save();
      ctx.shadowColor = `rgba(0,0,0,${0.12 * out})`; ctx.shadowBlur = 80 * c.z; ctx.shadowOffsetY = 20;
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore();
      ctx.clip();
    }
    ctx.drawImage(bgCanvas(SCENES[k].bg, boil), 0, 0);
    SCENES[k].draw(ctx, t, boil, c);
    ctx.restore();
  }
  // 3D accents for the visible scenes
  layoutAccents(t, c, out > 0.4 ? [] : vis);
  accents.group.visible = true;
  G.renderOnly(ctx, [accents.group]);
  accents.group.visible = false;
  // headline
  if (!portal) {
    kinetic(ctx, 'Einfach', 110, 470, 150, t, 20.05, 22.1, { align: 'left', weight: 850 });
    kinetic(ctx, 'machen.', 110, 620, 150, t, 20.18, 22.15, { align: 'left', weight: 850, color: RED });
  }
}

export function blur(t) {
  for (const w of [22.5, 25.0, 27.5]) if (Math.abs(t - w) < 0.2) return 12;
  if (t > OUT[0]) return 6;
  return 4;
}

export const sfx = (() => {
  const c = [];
  c.push({ t: 20.0, type: 'pageOpen', gain: 0.9 });
  // kitchen foley
  c.push({ t: 20.0, type: 'sizzle', gain: 0.6, dur: 2.5 });
  for (let t = 20.1; t < 22.4; t += 0.5) c.push({ t, type: 'stir', gain: 0.5 });
  for (let t = 20.25; t < 22.4; t += 0.25) c.push({ t, type: 'bubble', gain: 0.35, pitch: 0.8 + ((t * 7) % 1) * 0.6 });
  c.push({ t: 21.0, type: 'pencilWrite', gain: 0.6, dur: 0.6 }, { t: 21.55, type: 'check', gain: 0.8 });
  // whips
  for (const w of [22.5, 25.0, 27.5]) c.push({ t: w - 0.14, type: 'whip', gain: 1 }, { t: w + 0.05, type: 'paperThump', gain: 0.7 });
  // pottery
  c.push({ t: 22.5, type: 'wheel', gain: 0.55, dur: 2.5 });
  for (let t = 22.8; t < 24.9; t += 0.42) c.push({ t, type: 'squish', gain: 0.45, pitch: 0.8 + ((t * 3) % 1) * 0.5 });
  c.push({ t: 23.4, type: 'pencilWrite', gain: 0.6, dur: 0.6 }, { t: 23.95, type: 'check', gain: 0.8 });
  // summit
  c.push({ t: 25.0, type: 'wind', gain: 0.6, dur: 2.5 }, { t: 25.25, type: 'cheer', gain: 0.8 });
  for (let t = 25.1; t < 27.4; t += 0.7) c.push({ t, type: 'bird', gain: 0.35, pitch: 1 + ((t * 5) % 1) * 0.4 });
  for (let t = 25.5; t < 27.2; t += 1.0) c.push({ t: t + 0.5, type: 'landing', gain: 0.5 });
  c.push({ t: 25.9, type: 'pencilWrite', gain: 0.6, dur: 0.6 }, { t: 26.45, type: 'check', gain: 0.8 });
  // dance
  c.push({ t: 27.5, type: 'vinylStart', gain: 0.7 });
  for (let t = 27.75; t < 29.1; t += 0.5) c.push({ t, type: 'stomp', gain: 0.45 });
  c.push({ t: 28.0, type: 'pencilWrite', gain: 0.6, dur: 0.6 }, { t: 28.55, type: 'check', gain: 0.8 });
  // bounces of the 3D accents in the kitchen
  for (let t = 20.0; t < 22.4; t += 0.5) c.push({ t, type: 'boing', gain: 0.25 }, { t: t + 0.25, type: 'boing', gain: 0.18 });
  c.push({ t: OUT[0], type: 'zoomOut', gain: 0.9, dur: OUT[1] - OUT[0] });
  return c;
})();

// Snapshot of scene k at time t as a small card image (used by the end card).
const snaps = new Map();
export function snapshot(k, t, frame, scale = 0.4) {
  const key = k + '|' + frame;
  if (snaps.has(key)) return snaps.get(key);
  const c = document.createElement('canvas');
  c.width = Math.round(1920 * scale); c.height = Math.round(1080 * scale);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.scale(scale, scale);
  const boil = boilAt(frame / 60);
  g.drawImage(bgCanvas(SCENES[k].bg, boil), 0, 0);
  SCENES[k].draw(g, t, boil, { x: k * SP, z: 1 });
  snaps.set(key, c);
  return c;
}
