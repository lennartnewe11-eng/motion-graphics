// Scenes 9–13: "verrückt", 11:02 and the white office, again (the Nagasaki ground-zero map), the recognition,
// 93 years and the fight against the bomb — then the loop back into the first frame.
import { SW, SH, img, camera, shake, plate, handStroke, handArrow, handCircle } from '../lib/collage.js';
import { setFont, pop, hand, typed } from '../lib/type.js';
import { L, W_, WE, CUT, DURATION, FLASH2 } from './timeline.js';
import {
  TAU, clamp, lerp, ease, noise3, rng, rgba, V, R, night, specks, flap, drum, word, tag, flash,
  man, mushroom, carbon, stamp, rings, shock,
} from './common.js';
import { hook } from './scenes-a.js';

const HOT = [255, 236, 214];
function twoMen(ctx, t, { bossShake = 0 } = {}) {
  ctx.save(); ctx.globalAlpha = 0.85; ctx.filter = 'brightness(3.2)';
  man(ctx, 860, 1990, 960, { flip: true, t, sway: 1, rim: 0.25, rot: Math.sin(t * 14) * 0.035 * bossShake });
  ctx.filter = 'none'; ctx.restore();
  man(ctx, 230, 1990, 900, { t, sway: 1, rim: 0.55 });
}

// ================================================================ 9 · CRAZY
export function crazy(ctx, t) {
  const w = (i) => W_('y11', i);
  night(ctx, [20, 22, 30], V.ink);
  ctx.save();
  camera(ctx, t, { z: 1.03 }, 1, 15);
  twoMen(ctx, t, { bossShake: clamp((t - w(2)) / 0.2) });
  ctx.restore();
  word(ctx, t, 'Der Chef hält ihn für', SW / 2, 420, w(0), { role: R.D, size: 80, color: V.snow, seed: 1 });
  if (t >= w(5)) {
    // VERRÜCKT: every letter on its own crooked course
    const p = pop(t, w(5), 1.1);
    setFont(ctx, R.G, 170); ctx.letterSpacing = '0px';
    const text = 'VERRÜCKT.';
    const ws = [...text].map((c) => ctx.measureText(c).width);
    let x = SW / 2 - ws.reduce((a, b) => a + b, 0) / 2;
    [...text].forEach((c, i) => {
      ctx.save();
      ctx.translate(x + ws[i] / 2 + noise3(t * 9, i, 1) * 10, 680 + noise3(t * 7, i, 2) * 28 + Math.sin(i * 1.7) * 20);
      ctx.rotate(noise3(t * 6, i, 3) * 0.35 + Math.sin(i * 2.3) * 0.12);
      ctx.scale(lerp(0.3, 1, p), lerp(0.3, 1, p));
      ctx.globalAlpha = clamp(p * 4);
      ctx.fillStyle = rgba(i % 3 === 1 ? V.accent : V.snow); ctx.textAlign = 'center';
      ctx.fillText(c, 0, 0);
      ctx.restore();
      x += ws[i];
    });
    hand(ctx, '?!', 870, 960, t, w(5) + 0.2, { size: 120, color: V.accent, dur: 0.25, rot: 0.1 });
  }
}
export const crazyBlur = () => 2;

// ================================================================ 10 · WHITE
// 11:02. The office turns white — and stays white (the only all-white frame of the film).
export function whiteScene(ctx, t) {
  const w = (i) => W_('y12', i);
  const tf = FLASH2;
  night(ctx, [20, 22, 30], V.ink);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.06, clamp((t - CUT.white) / 2)) }, 1, 16);
  twoMen(ctx, t);
  ctx.restore();
  flap(ctx, '11:02', SW / 2, 620, t, w(0) - 0.1, { size: 200, cellW: 156, gap: 14, align: 'center', seed: 91, stagger: 0.04, dur: 0.35, accent: [0, 1, 2, 3, 4] });
  setFont(ctx, R.M5, 32); ctx.fillStyle = rgba(V.steel); ctx.textAlign = 'center';
  if (t >= w(0)) ctx.fillText('9. AUGUST 1945 · NAGASAKI', SW / 2, 420);
  ctx.letterSpacing = '0px';
  word(ctx, t, 'Das Büro wird', SW / 2, 960, w(3), { role: R.D, size: 96, color: V.snow, seed: 2 });
  if (t >= tf) {
    const k = clamp((t - tf) / 0.08);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(250,248,242,${k})`; ctx.fillRect(0, 0, SW, SH);
    ctx.restore();
    // "weiß." — white on white, only its shadow of grain shows
    word(ctx, t, 'weiß.', SW / 2, 1020, tf + 0.1, { role: R.G, size: 280, color: [226, 222, 214], seed: 3 });
  }
}
export const whiteSceneBlur = () => 1;

// ================================================================ 11 · AGAIN
// The US ground-zero map of Nagasaki is the stage: again 3 km, again the flash, again he survives.
const GZ = [1144, 464]; // the marked hypocentre on plate_naga_map
export function again(ctx, t) {
  const t0 = CUT.again;
  const u = t - t0;
  const w = (i) => W_('y13', i);
  const tb = w(5) - 0.05;
  const [sx, sy, sr] = shake(t, tb, 50, 1.3, 20);
  // coming out of the white
  night(ctx, V.night, V.ink);
  ctx.save();
  camera(ctx, t, { x: SW / 2 + sx, y: SH / 2 + sy, z: lerp(1.25, 1.0, ease.outCubic(clamp(u / 3.5))), r: sr }, 1, 17);
  const m = plate(ctx, 'plate_naga_map', { x: 0.6, y: 0.45, z: 1.05, alpha: 0.85 });
  ctx.fillStyle = 'rgba(9,12,17,0.35)'; ctx.fillRect(-100, -100, SW + 200, SH + 200);
  const [gx, gy] = m.map(GZ[0], GZ[1]);
  handCircle(ctx, gx, gy, 46, 46, clamp((t - w(0)) / 0.3), { width: 7, color: V.accent, t, seed: 4 });
  // 3 km: the line runs off the map — he was beyond its edge
  if (t >= w(1)) {
    ctx.save(); ctx.setLineDash([18, 14]); ctx.lineDashOffset = -t * 40;
    handStroke(ctx, [[gx, gy], [gx - 300, gy + 520], [gx - 520, gy + 1100], [gx - 700, gy + 1600]], clamp((t - w(1)) / 0.6), { width: 6, color: V.accent, t, seed: 6 });
    ctx.restore();
    tag(ctx, t, '3 KM', gx - 330, gy + 640, w(2), { role: R.M, size: 90, col: V.snow, bgc: V.accent, seed: 7, rot: -0.3 });
  }
  if (t >= tb) {
    mushroom(ctx, 'cloud_naga2', gx, gy + 40, 980, (t - tb) / 1.4 + 0.3, { t, glow: 1.4 });
    shock(ctx, t, tb, gx, gy, { dur: 1.1, max: 1600, sy: 0.6 });
  }
  man(ctx, 230, 1990, 720, { t, rim: t >= tb ? 1 : 0.3 });
  ctx.restore();
  flash(ctx, t, t0, { dur: 0.6, peak: 1, color: [250, 248, 242] });
  flash(ctx, t, tb, { dur: 0.5, peak: 0.9, color: HOT });
  // WIEDER, three times, stacked and growing
  [[w(0), 90, V.snow], [w(3), 120, V.snow], [w(7), 160, V.accent]].forEach(([at, size, col], i) => {
    word(ctx, t, 'WIEDER', 90, 300 + i * 140 + (i === 2 ? 30 : 0), at, { role: R.LG, size, color: col, seed: 10 + i, align: 'left', rot: -0.03 });
  });
  if (t >= w(8)) tag(ctx, t, 'ÜBERLEBT', SW / 2 + 120, 1660, w(8), { role: R.G, size: 120, col: V.ink, bgc: V.snow, seed: 14, rot: -0.03 });
}
export const againBlur = (t) => (t >= W_('y13', 5) - 0.05 && t < W_('y13', 5) + 0.7 ? 3 : 2);

// ================================================================ 12 · RECOG
// 2009: the official recognition (carbon copy) — then the two clouds side by side, him between them.
export function recog(ctx, t) {
  const t0 = CUT.recog;
  const u = t - t0;
  const w = (i) => W_('y14', i);
  const t2 = w(7); // "Als einzigen Menschen…"
  carbon(ctx);
  ctx.save();
  camera(ctx, t, { z: lerp(1.03, 1.0, clamp(u / 6)), r: -0.015 }, 1, 18);
  const ink = [214, 222, 235], dim = [150, 165, 190];
  const fade = t < t2 ? 1 : 1 - ease.outCubic(clamp((t - t2) / 0.4)) * 0.75;
  ctx.globalAlpha = fade;
  typed(ctx, 'JAPANISCHE REGIERUNG  ·  PRÄFEKTUR NAGASAKI', 100, 560, t, t0 + 0.05, { cps: 70, size: 36, color: ink, cursor: false });
  typed(ctx, 'AMTLICHE ANERKENNUNG', 100, 640, t, t0 + 0.4, { cps: 45, size: 62, color: ink, cursor: false });
  ctx.fillStyle = rgba(ink, 0.6); ctx.fillRect(100, 680, 880 * ease.outCubic(clamp((u - 0.8) / 0.4)), 4);
  [['NAME', 'YAMAGUCHI, TSUTOMU'], ['STATUS', 'NIJU HIBAKUSHA'], ['', '(ZWEIFACH ÜBERLEBT)'], ['HIROSHIMA', '06.08.1945  08:15'], ['NAGASAKI', '09.08.1945  11:02']].forEach(([a, b], i) => {
    typed(ctx, a, 100, 790 + i * 80, t, t0 + 0.9 + i * 0.15, { cps: 40, size: 36, color: dim, cursor: false });
    typed(ctx, b, 380, 790 + i * 80, t, t0 + 1.0 + i * 0.25, { cps: 40, size: 40, color: ink, cursor: false });
  });
  stamp(ctx, t, w(5), 'OFFIZIELL', 700, 1260, { size: 92, rot: -0.14 });
  ctx.globalAlpha = 1;
  ctx.restore();
  flap(ctx, '2009', SW / 2, 330, t, w(1) - 0.1, { size: 130, cellW: 104, gap: 12, align: 'center', seed: 101, accent: [0, 1, 2, 3] });
  if (t >= t2) {
    // both clouds, him between them
    const k = ease.outCubic(clamp((t - t2) / 0.6));
    mushroom(ctx, 'cloud_hiro', 270, 1500, 520, 0.6 + 0.4 * k, { t, glow: 0.6, alpha: k });
    mushroom(ctx, 'cloud_naga', 810, 1500, 560, 0.6 + 0.4 * clamp((t - t2 - 0.3) / 0.6), { t, glow: 0.6, alpha: clamp((t - t2 - 0.3) / 0.4) });
    man(ctx, SW / 2, 1680, 420, { t, rim: 0.6, alpha: k });
    setFont(ctx, R.M5, 28); ctx.fillStyle = rgba(V.fog, k); ctx.textAlign = 'center';
    ctx.fillText('HIROSHIMA · 8:15', 270, 1560); ctx.fillText('NAGASAKI · 11:02', 810, 1560); ctx.letterSpacing = '0px';
    if (t >= w(8)) tag(ctx, t, 'ALS EINZIGER', SW / 2, 1720, w(8), { role: R.G, size: 92, col: V.ink, bgc: V.accent, seed: 102, rot: -0.02 });
  }
}
export const recogBlur = () => 1;

// ================================================================ 13 · END
// 93 years. He spent them against the bomb: both clouds crossed out. Then the loop: back into frame 1.
export function end93(ctx, t) {
  const t0 = CUT.end93;
  const w = (i) => W_('y15', i);
  const loop = DURATION - 0.5;
  if (t >= loop) { hook(ctx, t - DURATION); return; }
  night(ctx, [16, 18, 26], V.ink);
  ctx.save();
  camera(ctx, t, { z: 1 + (t - t0) * 0.01 }, 1, 19);
  const k2 = ease.outCubic(clamp((t - w(5)) / 0.6));
  if (k2 > 0) {
    mushroom(ctx, 'cloud_hiro', 300, 1560, 640, 1, { t, glow: 0.5, alpha: k2 * 0.9 });
    mushroom(ctx, 'cloud_naga', 790, 1560, 680, 1, { t, glow: 0.5, alpha: k2 * 0.9 });
    // crossed out on "gegen"
    const kx = clamp((t - w(9)) / 0.35);
    handStroke(ctx, [[60, 640], [540, 1100], [1020, 1580]], kx, { width: 26, color: V.accent, t, seed: 8, boil: 2 });
    handStroke(ctx, [[1020, 660], [560, 1110], [70, 1560]], clamp((t - w(9) - 0.25) / 0.35), { width: 26, color: V.accent, t, seed: 9, boil: 2 });
  }
  man(ctx, SW / 2, 1990, 760, { t, rim: 0.5 });
  ctx.restore();
  if (t < w(5)) {
    word(ctx, t, 'Er wurde', SW / 2, 420, w(0), { role: R.D, size: 92, color: V.snow, seed: 1 });
    if (t >= w(2)) drum(ctx, SW / 2, 720, lerp(0, 93, ease.outExpo(clamp((t - w(2)) / 0.8))), 2, { size: 360, color: V.accent, unit: '' });
    word(ctx, t, 'JAHRE ALT.', SW / 2, 1000, w(3), { role: R.LG, size: 160, color: V.snow, seed: 2 });
  } else {
    word(ctx, t, 'Und kämpfte bis zuletzt', SW / 2, 330, w(5), { role: R.D, size: 80, color: V.snow, seed: 3 });
    if (t >= w(9)) tag(ctx, t, 'GEGEN ATOMWAFFEN.', SW / 2, 480, w(9), { role: R.G, size: 92, col: V.ink, bgc: V.snow, seed: 4, rot: -0.02 });
    if (t >= WE('y15', 10) + 0.2) {
      setFont(ctx, R.M5, 30); ctx.fillStyle = rgba(V.fog, clamp((t - WE('y15', 10) - 0.2) / 0.3)); ctx.textAlign = 'center';
      ctx.fillText('TSUTOMU YAMAGUCHI  1916 – 2010', SW / 2, 1650); ctx.letterSpacing = '0px';
    }
  }
}
export const end93Blur = (t) => (t >= DURATION - 0.5 ? 3 : 1);
