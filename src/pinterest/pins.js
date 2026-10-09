// The pin library: every pin image is a colored-pencil illustration drawn from code, rendered once
// into a card texture (image with rounded corners + optional title row, Pinterest home-feed style).
import { TAU, rng, clamp, lerp } from '../engine/core.js';
import { drawPencil, pencilText, ellipse, capsule, blob, smooth, rrect, PC, shadeOf, mat, xf } from './pencil.js';

export const CW = 210;          // column / card width in frame pixels
export const TEX_SCALE = 2.4;   // texture resolution multiplier (crisp in close-ups)
export const RADIUS = 18;

// ------------------------------------------------------------ helpers ---
const bg = (w, h, fill, seed = 1, o = {}) => ({ pts: [[-6, -6], [w + 6, -6], [w + 6, h + 6], [-6, h + 6]], fill, shade: null, line: null, flat: 1, gloss: 0, gap: 3.6, pressure: 0.62, solid: true, hw: 1.9, seed, noOcclude: true, ...o });
const leaf = (x, y, len, wid, rot, fill = PC.green, seed = 3) => {
  const P = [[0, 0], [len * 0.3, -wid], [len * 0.75, -wid * 0.7], [len, 0], [len * 0.7, wid * 0.65], [len * 0.3, wid * 0.8]];
  return { pts: smooth(P, true, 6), m: mat(x, y, rot), fill, seed, lw: 2 };
};
const line = (pts, color, lw = 2.2, seed = 9, o = {}) => ({ pts, open: true, line: color, lw, seed, ...o });
const dots = (n, x0, y0, x1, y1, r, fill, seed) => {
  const R = rng(seed), out = [];
  for (let i = 0; i < n; i++) out.push({ pts: ellipse(lerp(x0, x1, R()), lerp(y0, y1, R()), r * (0.7 + R() * 0.5)), fill, seed: seed + i, lw: 1.6, shade: null });
  return out;
};

// ------------------------------------------------------- illustrations ---
// Each design: (w, h) => items (or a function (g, w, h) for extra canvas ops). h is the image height.
export const DESIGNS = {
  pasta(w, h) {
    const cx = w / 2, cy = h * 0.52, R = w * 0.42;
    const it = [bg(w, h, '#F7E3C6', 11)];
    it.push({ pts: ellipse(cx + 8, cy + 10, R * 1.02, R * 0.98), fill: '#D9C7AE', shade: null, line: null, seed: 12, pressure: 0.5 }); // table shadow
    it.push({ pts: ellipse(cx, cy, R, R * 0.96), fill: PC.white, shade: '#C9C3D0', seed: 13, line: '#7A7F96' });
    it.push({ pts: ellipse(cx, cy, R * 0.74, R * 0.7), fill: '#F3F0EA', shade: '#D3CDD8', seed: 14, line: '#9EA2B5', lw: 1.8 });
    it.push({ pts: blob(cx, cy, R * 0.6, 4, 0.12, 40, 0.92), fill: PC.ochre, shade: PC.orange, seed: 15, line: '#B47A2A' });
    // spaghetti swirls
    const S = rng(5);
    for (let k = 0; k < 9; k++) {
      const a0 = S() * TAU, r0 = R * (0.1 + S() * 0.42), pts = [];
      for (let i = 0; i <= 26; i++) { const a = a0 + i * 0.26; const rr = r0 * (0.6 + 0.4 * Math.sin(i * 0.3 + k)); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.92]); }
      it.push(line(smooth(pts, false, 3), k % 2 ? '#E0A23A' : '#C98622', 2.4, 20 + k));
    }
    // tomato sauce dollop + basil
    it.push({ pts: blob(cx - 6, cy - 4, R * 0.24, 9, 0.2), fill: PC.red, shade: PC.crimson, seed: 31 });
    it.push(...[[-0.5, -0.7, 0.3], [0.6, -0.4, -1.4], [0.1, 0.2, 2.1]].map(([dx, dy, r], i) => leaf(cx + dx * R * 0.5, cy + dy * R * 0.5, 34, 13, r, PC.green, 40 + i)));
    it.push(...dots(10, cx - R * 0.4, cy - R * 0.3, cx + R * 0.4, cy + R * 0.4, 2.4, PC.sand, 60));
    // fork + cherry tomatoes on the table
    it.push({ pts: capsule(w * 0.86, h * 0.1, w * 0.97, h * 0.45, 5, 4), fill: '#C9CED6', seed: 70, line: '#6A7080' });
    it.push({ pts: ellipse(w * 0.14, h * 0.86, 16, 15), fill: PC.red, seed: 71 }, { pts: ellipse(w * 0.26, h * 0.92, 13, 12), fill: PC.red, seed: 72 });
    it.push(leaf(w * 0.13, h * 0.83, 14, 5, -2.2, PC.green, 73));
    return it;
  },
  vases(w, h) {
    const it = [bg(w, h, '#E9E1F4', 81), bg(w, h, '#D8CDE8', 82, { pts: [[-6, h * 0.72], [w + 6, h * 0.72], [w + 6, h + 6], [-6, h + 6]], noOcclude: false })];
    const vase = (cx, base, hgt, wid, neck, fill, seed) => {
      const P = [[cx - neck, base - hgt], [cx - neck * 1.2, base - hgt * 0.88], [cx - wid, base - hgt * 0.45], [cx - wid * 0.85, base - hgt * 0.12], [cx - wid * 0.5, base], [cx + wid * 0.5, base], [cx + wid * 0.85, base - hgt * 0.12], [cx + wid, base - hgt * 0.45], [cx + neck * 1.2, base - hgt * 0.88], [cx + neck, base - hgt]];
      return { pts: smooth(P, true, 6), fill, seed };
    };
    const b = h * 0.86;
    it.push(vase(w * 0.32, b, h * 0.42, 44, 14, PC.coral, 83));
    it.push(line(smooth([[w * 0.32 - 40, b - h * 0.2], [w * 0.32, b - h * 0.17], [w * 0.32 + 40, b - h * 0.2]], false, 6), PC.cream, 3.4, 84));
    it.push(vase(w * 0.68, b, h * 0.3, 38, 18, PC.sky, 85));
    it.push(...dots(9, w * 0.58, b - h * 0.25, w * 0.78, b - h * 0.06, 3.2, PC.navy, 86));
    it.push(vase(w * 0.52, b + 4, h * 0.18, 26, 12, PC.cream, 87));
    // branch with leaves out of the tall vase
    it.push(line(smooth([[w * 0.32, b - h * 0.42], [w * 0.3, b - h * 0.6], [w * 0.38, b - h * 0.78], [w * 0.36, b - h * 0.9]], false, 6), PC.umber, 2.6, 88));
    [[0.31, 0.55, -2.4], [0.33, 0.66, -0.6], [0.37, 0.76, -2.6], [0.38, 0.84, -0.4], [0.35, 0.9, -1.6]].forEach(([x, y, r], i) => it.push(leaf(w * x, b - h * y + h * 0.0, 30, 11, r, i % 2 ? PC.green : PC.lime, 90 + i)));
    return it;
  },
  mountains(w, h) {
    const it = [bg(w, h, '#CFE7F7', 101)];
    it.push({ pts: ellipse(w * 0.72, h * 0.2, 26, 26), fill: PC.yellow, shade: PC.orange, seed: 102, line: PC.orange });
    const ridge = (base, amp, seed, fill, shade, freq = 2.2) => {
      const R = rng(seed), P = [[-10, h + 10]];
      for (let i = 0; i <= 10; i++) { const x = (i / 10) * (w + 20) - 10; P.push([x, base - amp * Math.abs(Math.sin(i * freq * 0.5 + seed)) - R() * amp * 0.4]); }
      P.push([w + 10, h + 10]);
      return { pts: P, fill, shade, seed, line: shadeOf(fill, -0.4), lw: 2 };
    };
    it.push(ridge(h * 0.52, h * 0.22, 3, '#9FB7D8', '#6E87B5'));
    // snow caps
    it.push({ pts: [[w * 0.18, h * 0.33], [w * 0.27, h * 0.27], [w * 0.36, h * 0.35], [w * 0.3, h * 0.37], [w * 0.25, h * 0.34], [w * 0.21, h * 0.37]], fill: PC.white, seed: 104, shade: '#D3DDF0', line: '#8EA2C8', lw: 1.6 });
    it.push(ridge(h * 0.66, h * 0.16, 6, '#7FB27A', '#4F8A5E', 1.7));
    // lake
    it.push({ pts: ellipse(w * 0.5, h * 0.84, w * 0.62, h * 0.12), fill: '#6FB5DE', shade: '#3D7FB8', seed: 106, line: '#3D7FB8' });
    it.push(line([[w * 0.3, h * 0.82], [w * 0.5, h * 0.82]], PC.white, 2, 107), line([[w * 0.55, h * 0.87], [w * 0.72, h * 0.87]], PC.white, 2, 108));
    // pines
    const pine = (x, y, s, seed) => ({ pts: [[x, y - 60 * s], [x + 16 * s, y - 30 * s], [x + 9 * s, y - 30 * s], [x + 22 * s, y], [x - 22 * s, y], [x - 9 * s, y - 30 * s], [x - 16 * s, y - 30 * s]], fill: PC.forest, seed, lw: 2 });
    it.push(pine(w * 0.12, h * 0.78, 1, 110), pine(w * 0.22, h * 0.76, 0.8, 111), pine(w * 0.88, h * 0.79, 1.1, 112));
    // birds
    [[0.3, 0.16], [0.4, 0.12], [0.36, 0.2]].forEach(([x, y], i) => it.push(line(smooth([[w * x - 8, h * y], [w * x - 3, h * y - 4], [w * x, h * y], [w * x + 3, h * y - 4], [w * x + 8, h * y]], false, 3), PC.graphite, 1.8, 115 + i)));
    return it;
  },
  monstera(w, h) {
    const it = [bg(w, h, '#F4EEDF', 121)];
    const cx = w / 2, potT = h * 0.7;
    // big heart-shaped leaves with a midrib and side veins
    const hleaf = (x, y, s, rot, fill, seed) => {
      const P = [[0, 0], [-34, -14], [-46, -46], [-30, -78], [0, -96], [30, -78], [46, -46], [34, -14]];
      const m = mat(x, y, rot, s);
      const out = [{ pts: smooth(P, true, 5).map((p) => xf(m, p)), fill, seed, lw: 2.2 }];
      out.push(line([xf(m, [0, -4]), xf(m, [0, -88])], shadeOf(fill, 0.35), 1.8, seed + 1));
      for (const k of [-1, 1]) for (const yy of [-24, -46, -66]) out.push(line([xf(m, [0, yy]), xf(m, [k * 28, yy - 16])], shadeOf(fill, 0.35), 1.4, seed + 2 + yy));
      return out;
    };
    const stems = [[-0.9, 0.5, -0.9], [-0.45, 0.62, -0.4], [0.05, 0.66, 0.05], [0.5, 0.6, 0.5], [0.9, 0.46, 1.0], [-0.2, 0.36, -0.25], [0.3, 0.34, 0.35]];
    const cols = [PC.green, PC.forest, '#5FA862'];
    stems.forEach(([dx, dy, r], i) => {
      const tx = cx + dx * w * 0.3, ty = potT - h * dy * 0.75;
      it.push(line(smooth([[cx + dx * 10, potT], [lerp(cx, tx, 0.4), lerp(potT, ty, 0.6)], [tx, ty]], false, 6), PC.forest, 2.4, 130 + i));
      it.push(...hleaf(tx, ty, 0.62 + (i % 3) * 0.08, r, cols[i % 3], 140 + i * 10));
    });
    it.push({ pts: smooth([[cx - 58, potT], [cx + 58, potT], [cx + 46, h * 0.95], [cx - 46, h * 0.95]], true, 2), fill: PC.coral, shade: PC.brown, seed: 260 });
    it.push({ pts: rrect(cx - 64, potT - 8, 128, 20, 6), fill: shadeOf(PC.coral, -0.1), seed: 261 });
    return it;
  },
  coffee(w, h) {
    const it = [bg(w, h, '#EAD9C6', 171)];
    const cx = w * 0.42, cy = h * 0.5;
    it.push({ pts: ellipse(cx, cy, 78, 74), fill: PC.white, shade: '#CFC6BD', seed: 172, line: '#8F8378' }); // saucer
    it.push({ pts: ellipse(cx, cy, 54, 52), fill: PC.cream, seed: 173, line: '#8F8378' });
    it.push({ pts: ellipse(cx, cy, 44, 42), fill: '#B07A4E', shade: PC.brown, seed: 174, line: PC.umber });
    // latte-art heart
    it.push({ pts: smooth([[cx, cy + 22], [cx - 24, cy], [cx - 18, cy - 18], [cx, cy - 8], [cx + 18, cy - 18], [cx + 24, cy]], true, 6), fill: PC.cream, shade: null, seed: 175, line: '#C9A27E', lw: 1.6 });
    it.push({ pts: capsule(cx + 56, cy + 2, cx + 82, cy + 4, 9, 9), fill: PC.white, seed: 176, line: '#8F8378' });
    // croissant
    const cr = (x, y, s, r, seed) => {
      const P = [[-60, 6], [-40, -18], [-14, -30], [14, -30], [40, -18], [60, 6], [36, 0], [12, 10], [-12, 10], [-36, 0]];
      return { pts: smooth(P, true, 5), m: mat(x, y, r, s), fill: PC.ochre, shade: PC.brown, seed, line: '#9C6420' };
    };
    it.push(cr(w * 0.66, h * 0.86, 1, -0.3, 177));
    [-1, 0, 1].forEach((k, i) => it.push(line([xf(mat(w * 0.66, h * 0.86, -0.3), [k * 22, -26]), xf(mat(w * 0.66, h * 0.86, -0.3), [k * 18, 6])], '#9C6420', 1.8, 178 + i)));
    // steam
    [0, 1].forEach((k) => it.push(line(smooth([[cx - 10 + k * 20, cy - 60], [cx - 18 + k * 20, cy - 80], [cx - 6 + k * 20, cy - 100], [cx - 14 + k * 20, cy - 122]], false, 6), '#A89C92', 1.8, 182 + k)));
    return it;
  },
  tart(w, h) {
    const it = [bg(w, h, '#FCE3E6', 191)];
    const cx = w / 2, cy = h * 0.55, R = w * 0.4;
    it.push({ pts: ellipse(cx, cy + 6, R + 6, R * 0.55 + 10), fill: '#E3C9CF', shade: null, line: null, seed: 192, pressure: 0.6 });
    it.push({ pts: ellipse(cx, cy, R, R * 0.55), fill: PC.tan, shade: PC.brown, seed: 193, line: '#9C6A3C' });
    it.push({ pts: ellipse(cx, cy - 4, R * 0.85, R * 0.45), fill: PC.lemon, seed: 194, line: PC.ochre, lw: 1.8 });
    const S = rng(9);
    for (let i = 0; i < 16; i++) {
      const a = S() * TAU, rr = Math.sqrt(S()) * R * 0.72;
      const x = cx + Math.cos(a) * rr, y = cy - 4 + Math.sin(a) * rr * 0.52;
      it.push({ pts: smooth([[x, y - 12], [x + 9, y - 3], [x + 4, y + 9], [x - 4, y + 9], [x - 9, y - 3]], true, 4), fill: PC.red, shade: PC.crimson, seed: 200 + i, lw: 1.8 });
      it.push(leaf(x - 2, y - 11, 9, 4, -1.8, PC.green, 220 + i));
    }
    it.push(...dots(14, cx - R * 0.6, cy - R * 0.3, cx + R * 0.6, cy + R * 0.25, 1.8, PC.white, 240));
    return it;
  },
  armchair(w, h) {
    const it = [bg(w, h, '#F3E9DA', 251), bg(w, h, '#E3D2BC', 252, { pts: [[-6, h * 0.78], [w + 6, h * 0.78], [w + 6, h + 6], [-6, h + 6]], noOcclude: false })];
    // rug
    it.push({ pts: ellipse(w * 0.5, h * 0.88, w * 0.46, h * 0.06), fill: PC.lilac, seed: 253 });
    // lamp
    it.push(line([[w * 0.18, h * 0.85], [w * 0.18, h * 0.3]], PC.graphite, 2.6, 254));
    it.push({ pts: [[w * 0.06, h * 0.33], [w * 0.3, h * 0.33], [w * 0.25, h * 0.16], [w * 0.11, h * 0.16]], fill: PC.yellow, shade: PC.ochre, seed: 255 });
    it.push({ pts: ellipse(w * 0.18, h * 0.86, 20, 5), fill: PC.graphite, seed: 256 });
    // chair
    const cx = w * 0.6, base = h * 0.82;
    it.push({ pts: smooth([[cx - 60, base - 40], [cx - 56, base - 150], [cx, base - 165], [cx + 56, base - 150], [cx + 60, base - 40]], true, 6), fill: PC.teal, shade: shadeOf(PC.teal, -0.4), seed: 257 });
    it.push({ pts: rrect(cx - 72, base - 70, 144, 40, 16), fill: shadeOf(PC.teal, 0.1), shade: shadeOf(PC.teal, -0.4), seed: 258 });
    it.push({ pts: rrect(cx - 82, base - 105, 30, 70, 14), fill: PC.teal, seed: 259 }, { pts: rrect(cx + 52, base - 105, 30, 70, 14), fill: PC.teal, seed: 260 });
    [[-60, 1], [60, -1]].forEach(([dx, d], i) => it.push(line([[cx + dx, base - 32], [cx + dx + d * 8, base]], PC.umber, 3, 261 + i)));
    it.push({ pts: rrect(cx - 20, base - 140, 40, 34, 10), fill: PC.coral, seed: 263 }); // cushion
    // picture frame
    it.push({ pts: rrect(w * 0.48, h * 0.1, 72, 54, 4), fill: PC.white, seed: 264, line: PC.umber });
    it.push({ pts: [[w * 0.5, h * 0.1 + 48], [w * 0.62, h * 0.1 + 18], [w * 0.7, h * 0.1 + 48]], fill: PC.green, seed: 265, lw: 1.6 });
    return it;
  },
  sneakers(w, h) {
    const it = [bg(w, h, '#DDEFE4', 271)];
    const shoe = (x, y, s, r, col, seed) => {
      const m = mat(x, y, r, s, s * 1.35), T = (P) => P.map((p) => xf(m, p));
      const upper = smooth([[-74, 4], [-76, -26], [-66, -44], [-44, -46], [-30, -36], [-12, -40], [8, -34], [36, -22], [64, -16], [82, -4], [84, 6]], true, 4);
      return [
        { pts: T(rrect(-80, 2, 168, 20, 10)), fill: PC.white, shade: '#B9BECB', seed: seed + 1, line: '#5A6070', lw: 2 },
        line(T([[-76, 14], [84, 14]]), PC.red, 2.4, seed + 9),
        { pts: T(upper), fill: PC.white, shade: '#C8CCD8', seed, line: '#4A5060' },
        { pts: T(smooth([[-40, -10], [-10, -24], [30, -14], [60, -6], [30, -2], [-10, -6]], true, 4)), fill: col, seed: seed + 2, lw: 1.6 },
        { pts: T(rrect(-78, -40, 18, 34, 6)), fill: col, seed: seed + 3, lw: 1.6 },
        ...[0, 1, 2, 3].map((k) => line(T([[-16 + k * 13, -40 + k * 5], [-6 + k * 13, -30 + k * 5]]), PC.graphite, 1.6, seed + 4 + k)),
        line(T(smooth([[-62, -44], [-48, -40], [-34, -36]], false, 3)), PC.graphite, 1.8, seed + 8),
      ];
    };
    it.push(...shoe(w * 0.46, h * 0.4, 1.0, -0.14, PC.red, 280), ...shoe(w * 0.54, h * 0.72, 1.0, 0.06, PC.red, 300));
    return it;
  },
  palette(w, h) {
    const it = [bg(w, h, '#FFFFFF', 301, { pressure: 0.0 })];
    const cols = [PC.coral, PC.peach, PC.yellow, PC.mint, PC.sky, PC.lilac];
    cols.forEach((c, i) => {
      const x = 18 + (i % 2) * (w / 2 - 6), y = 20 + Math.floor(i / 2) * (h - 30) / 3;
      it.push({ pts: rrect(x, y, w / 2 - 30, (h - 30) / 3 - 18, 10), fill: c, seed: 302 + i, shade: null, line: shadeOf(c, -0.3), lw: 1.6 });
    });
    return (g) => {
      drawPencil(g, it, { boil: 0 });
      cols.forEach((c, i) => {
        const x = 18 + (i % 2) * (w / 2 - 6), y = 20 + Math.floor(i / 2) * (h - 30) / 3 + (h - 30) / 3 - 26;
        pencilText(g, ['#F2775E', '#F6C3A0', '#F5D04A', '#8FD3B6', '#7CC0E8', '#B79BDA'][i], x + 6, y + 6, { font: '700 15px Caveat', color: PC.graphite });
      });
    };
  },
  beach(w, h) {
    const it = [bg(w, h, '#FFD9B8', 311), bg(w, h, '#FFB98F', 312, { pts: [[-6, h * 0.25], [w + 6, h * 0.25], [w + 6, h * 0.5], [-6, h * 0.5]], noOcclude: false, pressure: 0.6 })];
    it.push({ pts: ellipse(w * 0.5, h * 0.5, 44, 44), fill: PC.coral, shade: PC.red, seed: 313, line: PC.red });
    it.push({ pts: [[-6, h * 0.5], [w + 6, h * 0.5], [w + 6, h * 0.72], [-6, h * 0.72]], fill: '#4FA3C7', shade: '#2E6F9E', seed: 314, line: null, flat: 1 });
    it.push({ pts: smooth([[-10, h * 0.74], [w * 0.4, h * 0.7], [w + 10, h * 0.76], [w + 10, h + 10], [-10, h + 10]], true, 4), fill: PC.sand, shade: PC.tan, seed: 315 });
    [0.56, 0.6, 0.64].forEach((y, i) => it.push(line([[w * (0.2 + i * 0.1), h * y], [w * (0.5 + i * 0.1), h * y]], '#FFE6C9', 2, 316 + i)));
    // palm
    it.push(line(smooth([[w * 0.8, h * 0.95], [w * 0.76, h * 0.7], [w * 0.7, h * 0.48], [w * 0.68, h * 0.36]], false, 6), PC.brown, 6, 320));
    [[-2.6, 54], [-2.0, 60], [-1.2, 56], [-0.5, 52], [-3.3, 46]].forEach(([r, l], i) => it.push(leaf(w * 0.68, h * 0.36, l, 12, r, i % 2 ? PC.forest : PC.green, 321 + i)));
    return it;
  },
  tent(w, h) {
    const it = [bg(w, h, '#283A73', 331, { pressure: 1.1, gap: 3.6 })];
    const S = rng(4);
    for (let i = 0; i < 22; i++) { const x = S() * w, y = S() * h * 0.55, r = 1.5 + S() * 2.5; it.push({ pts: ellipse(x, y, r, r), fill: PC.lemon, seed: 340 + i, shade: null, line: PC.lemon, lw: 1 }); }
    it.push({ pts: ellipse(w * 0.76, h * 0.16, 20, 20), fill: PC.lemon, seed: 365, shade: PC.ochre });
    it.push({ pts: ellipse(w * 0.79, h * 0.14, 17, 17), fill: '#283A73', seed: 366, line: null, shade: null, pressure: 1.2, gap: 3 });
    it.push({ pts: smooth([[-10, h * 0.76], [w * 0.3, h * 0.68], [w * 0.7, h * 0.72], [w + 10, h * 0.66], [w + 10, h + 10], [-10, h + 10]], true, 4), fill: '#2F5B48', seed: 367, line: null });
    it.push({ pts: [[w * 0.2, h * 0.8], [w * 0.47, h * 0.5], [w * 0.74, h * 0.8]], fill: PC.orange, shade: PC.red, seed: 368, line: '#9C3A1A' });
    it.push({ pts: [[w * 0.4, h * 0.8], [w * 0.47, h * 0.62], [w * 0.54, h * 0.8]], fill: PC.yellow, seed: 369, line: PC.ochre });
    // campfire
    it.push({ pts: smooth([[w * 0.84, h * 0.86], [w * 0.8, h * 0.8], [w * 0.84, h * 0.72], [w * 0.88, h * 0.8]], true, 4), fill: PC.yellow, shade: PC.orange, seed: 370, line: PC.orange });
    return it;
  },
  cactus(w, h) {
    const it = [bg(w, h, '#FFF1C9', 381)];
    const pot = (x, y, wd, col, seed) => ({ pts: [[x - wd / 2, y], [x + wd / 2, y], [x + wd * 0.38, y + wd * 0.7], [x - wd * 0.38, y + wd * 0.7]], fill: col, seed });
    const base = h * 0.72;
    it.push({ pts: capsule(w * 0.25, base, w * 0.25, base - 90, 20, 20), fill: PC.green, seed: 382 }, { pts: capsule(w * 0.25, base - 40, w * 0.12, base - 70, 9, 9), fill: PC.green, seed: 383 });
    it.push(pot(w * 0.25, base, 62, PC.coral, 384));
    it.push({ pts: ellipse(w * 0.52, base - 26, 30, 28), fill: PC.lime, shade: PC.green, seed: 385 }, { pts: ellipse(w * 0.52, base - 56, 8, 6), fill: PC.pink, seed: 386 });
    it.push(pot(w * 0.52, base, 58, PC.sky, 387));
    it.push({ pts: smooth([[w * 0.78, base], [w * 0.7, base - 50], [w * 0.78, base - 110], [w * 0.86, base - 50]], true, 5), fill: PC.forest, shade: '#1E4A30', seed: 388 });
    it.push(pot(w * 0.78, base, 54, PC.yellow, 389));
    for (let i = 0; i < 12; i++) it.push(line([[w * 0.25 + ((i % 3) - 1) * 10, base - 20 - i * 6], [w * 0.25 + ((i % 3) - 1) * 10 + 3, base - 23 - i * 6]], PC.forest, 1.4, 390 + i));
    it.push(bg(w, h, '#EBD7A6', 405, { pts: [[-6, h * 0.86], [w + 6, h * 0.86], [w + 6, h + 6], [-6, h + 6]], noOcclude: false }));
    return it;
  },
  books(w, h) {
    const it = [bg(w, h, '#E4ECF3', 411)];
    const cols = [PC.navy, PC.coral, PC.ochre, PC.teal, PC.rose];
    let y = h * 0.9;
    cols.forEach((c, i) => {
      const bw = w * (0.62 - (i % 2) * 0.08), bh = 22 + (i % 3) * 5, x = w / 2 - bw / 2 + (i % 2 ? 8 : -6);
      it.push({ pts: rrect(x, y - bh, bw, bh, 3), fill: c, seed: 412 + i });
      it.push(line([[x + 10, y - bh / 2], [x + bw * 0.5, y - bh / 2]], PC.cream, 1.8, 420 + i));
      y -= bh + 2;
    });
    // mug on top
    it.push({ pts: rrect(w * 0.42, y - 48, 46, 48, 8), fill: PC.white, shade: '#C8CCD8', seed: 430, line: '#5A6070' });
    it.push({ pts: capsule(w * 0.42 + 46, y - 34, w * 0.42 + 58, y - 18, 7, 7), fill: PC.white, seed: 431, line: '#5A6070' });
    [0, 1].forEach((k) => it.push(line(smooth([[w * 0.47 + k * 14, y - 56], [w * 0.45 + k * 14, y - 72], [w * 0.48 + k * 14, y - 86]], false, 5), '#9AA0AE', 1.6, 432 + k)));
    // window light
    it.push({ pts: rrect(w * 0.1, h * 0.08, w * 0.3, h * 0.26, 4), fill: '#FFF6D5', seed: 435, line: '#B7C2CF' });
    it.push(line([[w * 0.25, h * 0.08], [w * 0.25, h * 0.34]], '#B7C2CF', 1.6, 436));
    return it;
  },
  tulips(w, h) {
    const it = [bg(w, h, '#E8F4E1', 441)];
    const vx = w / 2, vb = h * 0.92;
    const heads = [[-0.28, 0.25, PC.rose], [0.0, 0.16, PC.red], [0.26, 0.24, PC.yellow], [-0.14, 0.38, PC.pink], [0.16, 0.36, PC.coral]];
    heads.forEach(([dx, dy, c], i) => {
      const x = vx + dx * w, y = h * dy;
      it.push(line(smooth([[vx + dx * 20, vb - 90], [lerp(vx, x, 0.6), lerp(vb, y, 0.5)], [x, y + 20]], false, 6), PC.green, 2.6, 450 + i));
      it.push(leaf(lerp(vx, x, 0.5), lerp(vb - 90, y, 0.4), 40, 9, -Math.PI / 2 + dx * 2 + (i % 2 ? 0.5 : -0.5), PC.green, 460 + i));
      it.push({ pts: smooth([[x - 16, y], [x - 12, y - 18], [x - 4, y - 8], [x, y - 22], [x + 4, y - 8], [x + 12, y - 18], [x + 16, y], [x + 8, y + 22], [x - 8, y + 22]], true, 4), fill: c, seed: 470 + i });
    });
    it.push({ pts: smooth([[vx - 40, vb - 100], [vx + 40, vb - 100], [vx + 34, vb], [vx - 34, vb]], true, 3), fill: '#BFE3F2', shade: '#7CB6D4', seed: 480, line: '#5C93B5', pressure: 0.7 });
    return it;
  },
  avocado(w, h) {
    const it = [bg(w, h, '#FFF7E8', 491)];
    const cx = w / 2, cy = h * 0.52;
    it.push({ pts: ellipse(cx, cy, w * 0.44, h * 0.3), fill: PC.white, shade: '#D7D2CC', seed: 492, line: '#9A948E' });
    it.push({ pts: smooth([[cx - 70, cy + 50], [cx - 74, cy - 20], [cx - 84, cy - 52], [cx - 50, cy - 78], [cx, cy - 70], [cx + 50, cy - 80], [cx + 84, cy - 54], [cx + 74, cy - 20], [cx + 72, cy + 50]], true, 5), fill: PC.ochre, shade: PC.brown, seed: 493 });
    it.push({ pts: smooth([[cx - 58, cy - 40], [cx + 54, cy - 46], [cx + 62, cy + 30], [cx - 60, cy + 38]], true, 5), fill: PC.lime, shade: PC.green, seed: 494, line: PC.green });
    for (let i = 0; i < 4; i++) it.push(line(smooth([[cx - 50, cy - 26 + i * 18], [cx, cy - 34 + i * 18], [cx + 50, cy - 28 + i * 18]], false, 5), PC.green, 1.8, 495 + i));
    it.push({ pts: ellipse(cx - 10, cy - 6, 18, 9, 0.2), fill: PC.white, seed: 500, line: '#C9C3BD' }, { pts: ellipse(cx - 8, cy - 6, 8, 7), fill: PC.yellow, seed: 501 });
    it.push(...dots(16, cx - 50, cy - 40, cx + 50, cy + 30, 1.7, PC.red, 502));
    return it;
  },
  pattern(w, h) {
    const it = [bg(w, h, '#FFE3D3', 521)];
    const cols = [PC.red, PC.yellow, PC.teal, PC.pink];
    let k = 0;
    for (let y = 26; y < h; y += 52) for (let x = 26; x < w; x += 52) {
      const c = cols[k % 4];
      if (k % 3 === 0) it.push({ pts: ellipse(x, y, 16, 16), fill: c, seed: 530 + k, lw: 1.8 });
      else if (k % 3 === 1) it.push({ pts: [[x - 16, y + 14], [x, y - 16], [x + 16, y + 14]], fill: c, seed: 530 + k, lw: 1.8 });
      else it.push({ pts: rrect(x - 14, y - 14, 28, 28, 6), fill: c, seed: 530 + k, lw: 1.8 });
      k++;
    }
    return it;
  },
  quote(w, h) {
    const it = [bg(w, h, '#FFF1F3', 601)];
    it.push(line(smooth([[30, h * 0.72], [w * 0.5, h * 0.75], [w - 30, h * 0.7]], false, 6), PC.red, 3, 602));
    it.push({ pts: smooth([[w * 0.78, h * 0.18], [w * 0.84, h * 0.12], [w * 0.9, h * 0.18], [w * 0.84, h * 0.28]], true, 4), fill: PC.red, seed: 603 });
    return (g) => {
      drawPencil(g, it, { boil: 0 });
      pencilText(g, 'Einfach', w / 2, h * 0.42, { font: '700 46px Caveat', color: PC.ink, align: 'center', rot: -0.05 });
      pencilText(g, 'mal machen.', w / 2, h * 0.62, { font: '700 46px Caveat', color: PC.red, align: 'center', rot: -0.05 });
    };
  },
  cat(w, h) {
    const it = [bg(w, h, '#EDE6F7', 611)];
    const cx = w / 2, cy = h * 0.6;
    it.push({ pts: ellipse(cx, cy + 40, w * 0.42, 22), fill: PC.lilac, seed: 612, shade: null }); // cushion
    it.push({ pts: smooth([[cx - 80, cy + 30], [cx - 70, cy - 30], [cx, cy - 50], [cx + 70, cy - 30], [cx + 84, cy + 30]], true, 6), fill: PC.orange, shade: PC.brown, seed: 613 });
    it.push({ pts: ellipse(cx + 46, cy - 18, 34, 30), fill: PC.orange, shade: PC.brown, seed: 614 });
    it.push({ pts: [[cx + 22, cy - 38], [cx + 26, cy - 62], [cx + 40, cy - 44]], fill: PC.orange, seed: 615, lw: 2 }, { pts: [[cx + 52, cy - 46], [cx + 66, cy - 64], [cx + 70, cy - 40]], fill: PC.orange, seed: 616, lw: 2 });
    it.push(line(smooth([[cx + 30, cy - 18], [cx + 36, cy - 14], [cx + 42, cy - 18]], false, 3), PC.umber, 2, 617), line(smooth([[cx + 52, cy - 18], [cx + 58, cy - 14], [cx + 64, cy - 18]], false, 3), PC.umber, 2, 618));
    it.push({ pts: smooth([[cx - 80, cy + 26], [cx - 96, cy - 10], [cx - 70, cy - 22], [cx - 74, cy + 8]], true, 4), fill: PC.orange, seed: 619 });
    for (let i = 0; i < 4; i++) it.push(line([[cx - 40 + i * 22, cy - 40], [cx - 34 + i * 22, cy - 18]], PC.brown, 2, 620 + i));
    // zzz
    return (g) => { drawPencil(g, it, { boil: 0 }); pencilText(g, 'z z z', cx + 30, cy - 90, { font: '700 30px Caveat', color: PC.violet, rot: -0.2 }); };
  },
  icecream(w, h) {
    const it = [bg(w, h, '#D9F2EE', 631)];
    const cx = w / 2, top = h * 0.35;
    it.push({ pts: [[cx - 40, top + 40], [cx + 40, top + 40], [cx, h * 0.9]], fill: PC.ochre, shade: PC.brown, seed: 632 });
    for (let i = -2; i <= 2; i++) it.push(line([[cx + i * 14 - 6, top + 46], [cx + i * 6, h * 0.86]], PC.brown, 1.4, 633 + i + 2));
    it.push({ pts: blob(cx, top + 28, 44, 3, 0.1), fill: PC.pink, shade: PC.rose, seed: 640 });
    it.push({ pts: blob(cx, top - 26, 40, 5, 0.1), fill: PC.mint, shade: PC.teal, seed: 641 });
    it.push({ pts: blob(cx, top - 74, 34, 8, 0.12), fill: PC.lemon, shade: PC.ochre, seed: 642 });
    it.push({ pts: ellipse(cx + 6, top - 112, 10, 10), fill: PC.red, seed: 643 });
    it.push(...dots(10, cx - 30, top - 50, cx + 30, top + 40, 2, PC.navy, 644));
    return it;
  },
  balloons(w, h) {
    const it = [bg(w, h, '#CDE8F6', 651)];
    const bal = (x, y, s, c1, c2, seed) => [
      { pts: smooth([[0, -60], [40, -40], [36, 10], [8, 44], [-8, 44], [-36, 10], [-40, -40]], true, 6).map((p) => [x + p[0] * s, y + p[1] * s]), fill: c1, shade: shadeOf(c1, -0.35), seed },
      { pts: smooth([[0, -60], [12, -30], [6, 30], [0, 44], [-6, 30], [-12, -30]], true, 5).map((p) => [x + p[0] * s, y + p[1] * s]), fill: c2, seed: seed + 1, lw: 1.6 },
      line([[x - 7 * s, y + 44 * s], [x - 7 * s, y + 60 * s]], PC.umber, 1.4, seed + 2), line([[x + 7 * s, y + 44 * s], [x + 7 * s, y + 60 * s]], PC.umber, 1.4, seed + 3),
      { pts: rrect(x - 9 * s, y + 60 * s, 18 * s, 12 * s, 3), fill: PC.brown, seed: seed + 4, lw: 1.6 },
    ];
    it.push(...bal(w * 0.32, h * 0.32, 1.1, PC.red, PC.yellow, 660), ...bal(w * 0.72, h * 0.22, 0.7, PC.teal, PC.cream, 670), ...bal(w * 0.66, h * 0.62, 0.55, PC.orange, PC.pink, 680));
    it.push({ pts: smooth([[-10, h * 0.86], [w * 0.4, h * 0.8], [w + 10, h * 0.86], [w + 10, h + 10], [-10, h + 10]], true, 4), fill: PC.lime, shade: PC.green, seed: 690 });
    it.push({ pts: blob(w * 0.18, h * 0.66, 26, 4, 0.2, 30, 0.5), fill: PC.white, shade: null, seed: 691, line: '#A9C7DA' });
    return it;
  },
  donuts(w, h) {
    const it = [bg(w, h, '#FFF0D9', 701)];
    const dn = (x, y, r, icing, seed) => [
      { pts: ellipse(x, y, r, r * 0.9), fill: PC.ochre, shade: PC.brown, seed },
      { pts: blob(x, y - 2, r * 0.8, seed % 7, 0.1, 36, 0.88), fill: icing, seed: seed + 1 },
      { pts: ellipse(x, y - 2, r * 0.28, r * 0.24), fill: '#FFF0D9', seed: seed + 2, shade: null, line: PC.brown, lw: 1.8 },
      ...[...Array(9)].map((_, i) => { const a = i * 0.7 + seed; const rr = r * 0.55; const px = x + Math.cos(a) * rr, py = y - 2 + Math.sin(a) * rr * 0.85; return line([[px - 3, py - 2], [px + 3, py + 2]], [PC.yellow, PC.sky, PC.white][i % 3], 2.6, seed + 10 + i); }),
    ];
    it.push(...dn(w * 0.34, h * 0.32, 52, PC.pink, 710), ...dn(w * 0.66, h * 0.55, 50, '#7A4A2E', 730), ...dn(w * 0.36, h * 0.78, 46, PC.lilac, 750));
    return it;
  },
  night(w, h) {
    const it = [bg(w, h, '#1F2A55', 771, { pressure: 1.15, gap: 3.4 })];
    it.push({ pts: ellipse(w * 0.5, h * 0.36, 52, 52), fill: PC.lemon, shade: PC.ochre, seed: 772 });
    it.push({ pts: ellipse(w * 0.58, h * 0.32, 46, 46), fill: '#1F2A55', seed: 773, line: null, shade: null, pressure: 1.2, gap: 3 });
    const S = rng(8);
    for (let i = 0; i < 14; i++) {
      const x = S() * w, y = S() * h * 0.85, r = 3 + S() * 5;
      it.push({ pts: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const a = k * Math.PI / 4, rr = k % 2 ? r * 0.35 : r; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; }), fill: PC.lemon, seed: 780 + i, lw: 1, shade: null });
    }
    return it;
  },
  lemonade(w, h) {
    const it = [bg(w, h, '#FFF9D6', 801)];
    const glass = (cx, b, gh, gw, seed) => {
      const out = [];
      out.push(line([[cx + 10, b - gh - 40], [cx - 6, b - gh * 0.3]], PC.red, 4, seed + 7)); // straw
      out.push({ pts: [[cx - gw / 2, b - gh], [cx + gw / 2, b - gh], [cx + gw * 0.42, b], [cx - gw * 0.42, b]], fill: '#FFF0A0', shade: PC.yellow, seed, line: '#B9A84A', pressure: 0.75 });
      out.push({ pts: rrect(cx - gw * 0.3, b - gh * 0.7, 18, 16, 3, 3), fill: PC.white, seed: seed + 1, line: '#C9C08A', lw: 1.4, shade: null });
      out.push({ pts: rrect(cx + 2, b - gh * 0.55, 16, 15, 3, 3), fill: PC.white, seed: seed + 2, line: '#C9C08A', lw: 1.4, shade: null });
      out.push({ pts: ellipse(cx - gw / 2 + 6, b - gh + 2, 17, 17), fill: PC.lemon, seed: seed + 3, line: PC.ochre });
      out.push(line([[cx - gw / 2 + 6 - 12, b - gh + 2], [cx - gw / 2 + 6 + 12, b - gh + 2]], PC.white, 1.6, seed + 4));
      out.push(leaf(cx + 6, b - gh - 2, 22, 8, -0.7, PC.green, seed + 5));
      return out;
    };
    it.push(...glass(w * 0.36, h * 0.86, h * 0.42, 66, 802), ...glass(w * 0.68, h * 0.9, h * 0.34, 56, 820));
    it.push({ pts: ellipse(w * 0.84, h * 0.32, 26, 26), fill: PC.yellow, shade: PC.ochre, seed: 840 });
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; it.push(line([[w * 0.84, h * 0.32], [w * 0.84 + Math.cos(a) * 20, h * 0.32 + Math.sin(a) * 20]], PC.white, 1.6, 841 + k)); }
    it.push({ pts: ellipse(w * 0.2, h * 0.24, 22, 18, -0.4), fill: PC.lemon, shade: PC.ochre, seed: 850 });
    return it;
  },
  bike(w, h) {
    const it = [bg(w, h, '#E3F0FB', 831)];
    const y = h * 0.66, r = 38, x0 = w * 0.27, x1 = w * 0.73;
    for (const x of [x0, x1]) {
      it.push({ pts: ellipse(x, y, r, r), fill: null, line: PC.graphite, seed: 832 + x | 0, shade: null, noOcclude: true, lw: 3 });
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 6; it.push(line([[x - Math.cos(a) * r, y - Math.sin(a) * r], [x + Math.cos(a) * r, y + Math.sin(a) * r]], PC.grey, 1, 840 + k)); }
    }
    const P = (a, b) => line([a, b], PC.red, 4, 850 + (a[0] | 0));
    const seat = [w * 0.42, y - 62], bar = [w * 0.66, y - 66], crank = [w * 0.47, y];
    it.push(P([x0, y], crank), P(crank, seat), P(seat, [x0, y]), P(crank, [w * 0.68, y - 50]), P([w * 0.4, y - 50], [w * 0.68, y - 50]), P([w * 0.68, y - 50], [x1, y]), P([w * 0.68, y - 50], bar));
    it.push({ pts: rrect(seat[0] - 14, seat[1] - 6, 28, 8, 4), fill: PC.umber, seed: 860 }, line([[bar[0] - 4, bar[1]], [bar[0] + 16, bar[1] - 6]], PC.graphite, 3, 861));
    it.push({ pts: rrect(w * 0.6, y - 92, 38, 26, 5), fill: PC.ochre, seed: 862 }); // basket
    it.push(...[[0.62, 0.28, PC.red], [0.67, 0.27, PC.yellow], [0.72, 0.29, PC.pink]].map(([x, yy, c], i) => ({ pts: ellipse(w * x, y - 96 - i * 2, 8, 8), fill: c, seed: 863 + i, lw: 1.4 })));
    it.push(line([[-10, y + r + 2], [w + 10, y + r + 2]], PC.green, 3, 870));
    return it;
  },
  vinyl(w, h) {
    const it = [bg(w, h, '#FBE3EC', 941)];
    const cx = w * 0.48, cy = h * 0.6;
    it.push({ pts: rrect(cx - 92, cy - 70, 184, 150, 14), fill: PC.coral, shade: PC.brown, seed: 942 });
    it.push({ pts: ellipse(cx - 8, cy + 2, 62, 58), fill: PC.ink, shade: null, seed: 943, solid: true, gap: 3.4, line: PC.ink });
    for (const rr2 of [46, 36, 26]) it.push({ pts: ellipse(cx - 8, cy + 2, rr2, rr2 * 0.94), fill: null, shade: null, line: '#6A6A78', lw: 1.2, seed: 944 + rr2, noOcclude: true });
    it.push({ pts: ellipse(cx - 8, cy + 2, 16, 15), fill: PC.yellow, seed: 950, shade: null });
    it.push(line([[cx + 70, cy - 52], [cx + 62, cy + 6], [cx + 30, cy + 22]], '#9AA0AE', 3.4, 951));
    it.push({ pts: ellipse(cx + 70, cy - 52, 9, 9), fill: '#C9CED6', seed: 952 });
    // disco ball + notes
    it.push(line([[w * 0.78, 0], [w * 0.78, h * 0.12]], PC.graphite, 1.6, 953));
    it.push({ pts: ellipse(w * 0.78, h * 0.18, 26, 26), fill: '#D7DCE6', shade: '#8E96AA', seed: 954, line: '#6A7080' });
    for (let k = -2; k <= 2; k++) it.push(line([[w * 0.78 - 24, h * 0.18 + k * 9], [w * 0.78 + 24, h * 0.18 + k * 9]], '#9AA2B6', 1, 955 + k + 2));
    const note = (x, y, s2, c, seed) => [{ pts: ellipse(x, y, 9 * s2, 7 * s2, -0.4), fill: c, seed, lw: 1.6 }, line([[x + 8 * s2, y - 2], [x + 8 * s2, y - 34 * s2], [x + 20 * s2, y - 28 * s2]], c, 2.4, seed + 1)];
    it.push(...note(w * 0.2, h * 0.3, 1.2, PC.violet, 960), ...note(w * 0.36, h * 0.18, 0.9, PC.red, 963), ...note(w * 0.18, h * 0.52, 0.8, PC.teal, 966));
    return it;
  },
  yarn(w, h) {
    const it = [bg(w, h, '#F6E4EC', 881)];
    const ball = (x, y, r, c, seed) => {
      const out = [{ pts: ellipse(x, y, r, r), fill: c, shade: shadeOf(c, -0.35), seed }];
      for (let k = 0; k < 5; k++) { const a = k * 0.6 + seed; out.push(line(smooth([[x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a + 1.6) * r * 0.3, y + Math.sin(a + 1.6) * r * 0.3], [x + Math.cos(a + Math.PI) * r, y + Math.sin(a + Math.PI) * r]], false, 5), shadeOf(c, -0.25), 1.6, seed + 1 + k)); }
      return out;
    };
    it.push(...ball(w * 0.36, h * 0.66, 46, PC.rose, 890), ...ball(w * 0.66, h * 0.72, 38, PC.mint, 900), ...ball(w * 0.56, h * 0.44, 34, PC.yellow, 910));
    it.push(line([[w * 0.2, h * 0.2], [w * 0.62, h * 0.86]], PC.umber, 3, 920), line([[w * 0.8, h * 0.18], [w * 0.4, h * 0.86]], PC.umber, 3, 921));
    it.push(line(smooth([[w * 0.36 + 46, h * 0.66], [w * 0.6, h * 0.92], [w * 0.9, h * 0.86]], false, 6), PC.rose, 2, 922));
    return it;
  },
};

// Pin catalogue: design, aspect (image h / w), title (German, like real feed titles), creator.
export const PINS = {
  pasta: { d: 'pasta', a: 1.3, title: 'Pasta wie in Rom', by: 'Giulia', av: PC.coral },
  vases: { d: 'vases', a: 1.45, title: 'Keramik für Anfänger', by: 'Studio Lehm', av: PC.lilac },
  mountains: { d: 'mountains', a: 1.5, title: 'Wandern im Herbst', by: 'Draußen', av: PC.green },
  monstera: { d: 'monstera', a: 1.4, title: 'Urban Jungle', by: 'Grünzeug', av: PC.forest },
  coffee: { d: 'coffee', a: 1.1, title: 'Café-Morgen', av: PC.brown },
  tart: { d: 'tart', a: 1.0, title: 'Erdbeer-Tarte', by: 'Backliebe', av: PC.rose },
  armchair: { d: 'armchair', a: 1.35, title: 'Leseecke einrichten', av: PC.teal },
  sneakers: { d: 'sneakers', a: 1.2, title: 'Sneaker stylen', av: PC.red },
  palette: { d: 'palette', a: 1.25, title: 'Farbpalette Sommer', av: PC.yellow },
  beach: { d: 'beach', a: 1.55, title: 'Strandtage', av: PC.sky },
  tent: { d: 'tent', a: 1.3, title: 'Camping-Hacks', by: 'Waldzeit', av: PC.orange },
  cactus: { d: 'cactus', a: 1.0, av: PC.lime },
  books: { d: 'books', a: 1.4, title: 'Bücher für den Herbst', av: PC.navy },
  tulips: { d: 'tulips', a: 1.5, title: 'Frühlingsstrauß', av: PC.pink },
  avocado: { d: 'avocado', a: 1.0, title: 'Frühstücksideen', av: PC.lime },
  pattern: { d: 'pattern', a: 1.35, av: PC.red },
  quote: { d: 'quote', a: 1.1, av: PC.red },
  cat: { d: 'cat', a: 1.0, title: 'Katzenliebe', av: PC.orange },
  icecream: { d: 'icecream', a: 1.45, title: 'Eis selber machen', av: PC.mint },
  balloons: { d: 'balloons', a: 1.6, title: 'Reiseziele 2027', av: PC.sky },
  donuts: { d: 'donuts', a: 1.4, title: 'Donuts backen', av: PC.pink },
  night: { d: 'night', a: 1.25, av: PC.navy },
  lemonade: { d: 'lemonade', a: 1.3, title: 'Limo-Rezept', av: PC.yellow },
  bike: { d: 'bike', a: 1.05, title: 'Radtour am Wochenende', av: PC.red },
  vinyl: { d: 'vinyl', a: 1.3, title: 'Wohnzimmer-Disco', by: 'Tanzfläche', av: PC.violet },
  yarn: { d: 'yarn', a: 1.3, title: 'Stricken lernen', av: PC.rose },
};

// --------------------------------------------------------------- cards ---
export const TITLE_H = 46;
export function cardSize(key, w = CW) {
  const p = PINS[key];
  const ih = Math.round(w * p.a);
  return { w, ih, h: ih + (p.title ? TITLE_H : 0) };
}

function roundedClip(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// Draw only the pin image (w × ih logical px) into g at the current transform.
export function drawPinImage(g, key, w, ih) {
  const p = PINS[key];
  g.save();
  roundedClip(g, 0, 0, w, ih, RADIUS);
  g.clip();
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, ih);
  const res = DESIGNS[p.d](w, ih);
  if (typeof res === 'function') res(g, w, ih);
  else drawPencil(g, res, { boil: 0 });
  g.restore();
}

// Full card texture (image + title row), returns { canvas, w, h }.
const cache = new Map();
export function cardCanvas(key, { scale = TEX_SCALE, title = true } = {}) {
  const ck = key + '|' + scale + '|' + title;
  if (cache.has(ck)) return cache.get(ck);
  const p = PINS[key];
  const { w, ih } = cardSize(key);
  const h = ih + (p.title && title ? TITLE_H : 0);
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  g.scale(scale, scale);
  drawPinImage(g, key, w, ih);
  if (p.title && title) {
    g.fillStyle = '#111';
    g.font = '600 13.5px InterV';
    g.textBaseline = 'alphabetic';
    g.fillText(p.title, 4, ih + 20);
    // creator row
    g.fillStyle = p.av;
    g.beginPath(); g.arc(12, ih + 35, 7.5, 0, TAU); g.fill();
    g.fillStyle = '#fff';
    g.font = '700 9px InterV';
    g.textAlign = 'center';
    g.fillText((p.by || 'Pin')[0], 12, ih + 38.2);
    g.textAlign = 'left';
    g.fillStyle = '#5F5F5F';
    g.font = '500 11.5px InterV';
    g.fillText(p.by || 'Inspiration', 25, ih + 39);
    // "…" menu
    g.fillStyle = '#111';
    for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(w - 20 + k * 6, ih + 16, 1.7, 0, TAU); g.fill(); }
  }
  const out = { canvas: c, w, h, ih };
  cache.set(ck, out);
  return out;
}

// Letter card (the feed spells words): solid Pinterest red, white letter.
export function letterCanvas(ch, w = CW, h = Math.round(CW * 1.25), { scale = TEX_SCALE, bg: bgc = '#E60023', fg = '#FFFFFF' } = {}) {
  const ck = 'L' + ch + w + 'x' + h + bgc;
  if (cache.has(ck)) return cache.get(ck);
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.scale(scale, scale);
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  roundedClip(g, 0, 0, w, h, RADIUS);
  g.fillStyle = bgc; g.fill();
  g.fillStyle = fg;
  g.font = '900 190px InterV';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  const m = g.measureText(ch);
  g.fillText(ch, w / 2, h / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
  const out = { canvas: c, w, h, ih: h };
  cache.set(ck, out);
  return out;
}
