// Scenes 1–4: the hook (Hiroshima -> train -> Nagasaki), the business trip, the last day 8:15, the first flash.
import { SW, SH, img, camera, shake, plate, handArrow, handStroke, handCircle } from '../lib/collage.js';
import { setFont, pop, typed } from '../lib/type.js';
import { L, W_, WE, CUT, HOOKFLASH, FLASH1 } from './timeline.js';
import {
  TAU, clamp, lerp, ease, noise3, rng, rgba, V, R, night, cloudField, specks, flap, drum, word, tag, marker, flash,
  man, mushroom, carbon, stamp, rings, shock, band,
} from './common.js';

const HOT = [255, 236, 214];
// the city line at the bottom of the hook frames (Hiroshima panorama, dark)
function skyline(ctx, y, a = 0.5) {
  const im = img('plate_hiro');
  const w = SW * 1.5, h = (im.height / im.width) * w;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.filter = 'brightness(0.45) contrast(1.2)';
  ctx.drawImage(im, SW / 2 - w / 2, y - h * 0.18, w, h);
  ctx.filter = 'none';
  ctx.restore();
  const g = ctx.createLinearGradient(0, y - h * 0.2, 0, y + 60);
  g.addColorStop(0, rgba(V.ink, 1)); g.addColorStop(1, rgba(V.ink, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, y - h * 0.2 - 2, SW, h * 0.2 + 64);
}

// ================================================================ 1 · HOOK
// Frame 1: a man, backlit by a rising atomic cloud. "Dann fuhr er nach Hause" — the train. "Nach Nagasaki." — again.
export function hook(ctx, t) {
  const t2 = L.y02.t, tf = HOOKFLASH;
  const w = (i) => W_('y01', i), w2 = (i) => W_('y02', i), w3 = (i) => W_('y03', i);
  if (t < t2) {
    // ---- Hiroshima: the cloud is already climbing on frame 1
    night(ctx, [12, 14, 22], [52, 46, 48]);
    const [sx, sy, sr] = shake(t, -0.2, 26, 1.6, 17);
    ctx.save();
    camera(ctx, t, { x: SW / 2 + sx, y: SH / 2 + sy, z: lerp(1.0, 1.08, ease.inOutSine(clamp(t / t2))), r: sr }, 1.2, 3);
    cloudField(ctx, 4 + t, { seed: 81, n: 5, speed: -40, dir: 'left', layer: 'back', zmin: 0.3, zmax: 0.7, size: 0.6, alpha: 0.35, lane: 0.25 });
    mushroom(ctx, 'cloud_hiro', SW / 2 + 20, 1430, 1080, (t + 2.0) / 4.2, { t, glow: 1.1 });
    shock(ctx, t, -0.25, SW / 2, 1430, { dur: 1.3, max: 1500, sy: 0.22 });
    skyline(ctx, 1430, 0.85);
    specks(ctx, t, { n: 50, seed: 4, vy: -90, vx: 25, size: 4, alpha: 0.55, color: [255, 150, 110] });
    man(ctx, SW / 2, 1830, 960, { rim: 0.9, t, sway: 1 });
    ctx.restore();
    // type: "Dieser Mann hat die Atombombe von Hiroshima überlebt."
    word(ctx, t, 'Dieser', 250, 300, w(0), { role: R.D, size: 96, color: V.snow, seed: 1, rot: -0.04 });
    word(ctx, t, 'Mann', 300, 440, w(1), { role: R.G, size: 170, color: V.snow, seed: 2, rot: -0.04 });
    handArrow(ctx, 330, 500, 470, 900, clamp((t - w(1) - 0.05) / 0.3), { width: 9, color: V.accent, t, seed: 2, bend: 0.25, head: 38 });
    if (t >= w(4)) tag(ctx, t, 'ATOMBOMBE', 790, 300, w(4), { role: R.G, size: 74, col: V.snow, bgc: V.ink, seed: 3, rot: 0.05 });
    if (t >= w(6)) tag(ctx, t, 'HIROSHIMA', SW / 2, 1450, w(6), { role: R.LG, size: 190, col: V.ink, bgc: V.accent, seed: 5, rot: -0.02 });
    word(ctx, t, 'überlebt.', SW / 2, 1680, w(7), { role: R.G, size: 150, color: V.snow, seed: 6 });
  } else if (t < tf) {
    // ---- the train home: hard cut, the print rushes past behind him, the board flips towards home
    const u = t - t2;
    night(ctx, [10, 12, 18], V.ink);
    ctx.save();
    camera(ctx, t, { z: 1.02 }, 1.5, 5);
    specks(ctx, t, { n: 40, seed: 7, vy: 0, vx: -2600, size: 3, alpha: 0.25, streak: 0.03, color: V.fog });
    const x = lerp(SW + 760, -900, ease.inOutSine(clamp(u / (tf - t2 + 0.15))));
    band(ctx, 'plate_train', x, 1200, 1500, 980, { ix: 0.45, iy: 0.55, z: 1.05, rot: -0.03, seed: 21 });
    man(ctx, SW / 2, 1830, 820, { rim: 0.35, t });
    ctx.restore();
    // board: "NACH" — flips through the line and lands on NAGASAKI on the word
    setFont(ctx, R.M5, 30); ctx.fillStyle = rgba(V.steel); ctx.textAlign = 'center'; ctx.fillText('NACH', SW / 2, 250); ctx.letterSpacing = '0px';
    if (t < w3(1) - 0.5) flap(ctx, 'HIROSHIMA', SW / 2, 340, t, t2 - 0.3, { size: 96, cellW: 84, gap: 8, align: 'center', seed: 31, stagger: 0.02 });
    else flap(ctx, 'NAGASAKI', SW / 2, 340, t, w3(1) - 0.5, { size: 96, cellW: 84, gap: 8, align: 'center', seed: 32, stagger: 0.02, dur: 0.45, accent: [0, 1, 2, 3, 4, 5, 6, 7] });
    word(ctx, t, 'Dann fuhr er', SW / 2, 560, w2(0), { role: R.D, size: 92, color: V.snow, seed: 7 });
    if (t >= w2(3)) tag(ctx, t, 'NACH HAUSE.', SW / 2, 700, w2(3), { role: R.G, size: 100, col: V.ink, bgc: V.snow, seed: 8, rot: 0.02 });
  } else {
    // ---- Nagasaki: the same frame again — the second cloud
    const u = t - tf;
    night(ctx, [14, 14, 20], [60, 48, 48]);
    const [sx, sy, sr] = shake(t, tf, 70, 1.4, 22);
    ctx.save();
    camera(ctx, t, { x: SW / 2 + sx, y: SH / 2 + sy, z: lerp(1.12, 1.0, ease.outCubic(clamp(u / 1.2))), r: sr }, 1.2, 6);
    mushroom(ctx, 'cloud_naga', SW / 2 - 10, 1440, 1100, 0.35 + u / 2.2, { t, glow: 1.3 });
    shock(ctx, t, tf, SW / 2, 1440, { dur: 1.1, max: 1700, sy: 0.22 });
    skyline(ctx, 1440, 0.9);
    specks(ctx, t, { n: 60, seed: 9, vy: -120, vx: -30, size: 4, alpha: 0.6, color: [255, 150, 110] });
    man(ctx, SW / 2, 1830, 960, { rim: 1, t });
    ctx.restore();
    flash(ctx, t, tf, { dur: 0.45, peak: 1, color: HOT });
    setFont(ctx, R.M5, 30); ctx.fillStyle = rgba(V.steel); ctx.textAlign = 'center'; ctx.fillText('NACH', SW / 2, 250); ctx.letterSpacing = '0px';
    flap(ctx, 'NAGASAKI', SW / 2, 340, t, w3(1) - 0.5, { size: 96, cellW: 84, gap: 8, align: 'center', seed: 32, stagger: 0.02, dur: 0.45, accent: [0, 1, 2, 3, 4, 5, 6, 7] });
  }
}
export const hookBlur = (t) => (t >= L.y02.t && t < HOOKFLASH ? 3 : 2);

// ================================================================ 2 · TRIP
// The business-trip order as carbon copy (the document is the stage). The man stands in front of it.
export function trip(ctx, t) {
  const t0 = CUT.trip;
  const u = t - t0;
  const w = (i) => W_('y04', i);
  carbon(ctx);
  ctx.save();
  camera(ctx, t, { x: SW / 2, y: lerp(900, 1000, ease.inOutSine(clamp(u / 8))), z: lerp(1.04, 1.0, clamp(u / 8)), r: -0.02 }, 1, 7);
  const ink = [214, 222, 235], dim = [150, 165, 190];
  typed(ctx, 'MITSUBISHI JUKOGYO  ·  WERFT NAGASAKI', 100, 560, t, t0 + 0.1, { cps: 70, size: 38, color: ink, cursor: false });
  typed(ctx, 'DIENSTREISEAUFTRAG', 100, 640, t, t0 + 0.55, { cps: 45, size: 64, color: ink, cursor: false });
  ctx.fillStyle = rgba(ink, 0.6);
  ctx.fillRect(100, 680, 880 * ease.outCubic(clamp((u - 0.9) / 0.4)), 4);
  const rows = [['NAME', 'YAMAGUCHI, TSUTOMU', w(3)], ['ALTER', '29', w(5)], ['BERUF', 'SCHIFFSINGENIEUR', w(6)], ['FIRMA', 'MITSUBISHI', w(8)], ['ZIEL', 'HIROSHIMA', w(13)], ['DAUER', '3 MONATE', w(13) + 0.3]];
  rows.forEach(([a, b, at], i) => {
    const y = 790 + i * 82;
    typed(ctx, a, 100, y, t, t0 + 1.0 + i * 0.12, { cps: 40, size: 38, color: dim, cursor: false });
    typed(ctx, b, 360, y, t, at, { cps: 34, size: 44, color: ink, cursor: false });
  });
  stamp(ctx, t, w(13) + 0.05, 'HIROSHIMA', 400, 1250, { size: 74, rot: -0.1 });
  ctx.restore();
  // date board
  flap(ctx, '06', 100, 330, t, w(0), { size: 96, cellW: 76, gap: 8, seed: 41 });
  flap(ctx, 'AUG', 100 + 2 * 84 + 28, 330, t, w(1), { size: 96, cellW: 76, gap: 8, seed: 42 });
  flap(ctx, '1945', 100 + 5 * 84 + 56, 330, t, w(2), { size: 96, cellW: 76, gap: 8, seed: 43, accent: [0, 1, 2, 3] });
  // the man in front of his own travel order, name in big type
  man(ctx, 900, 1990, 760, { t, sway: 1 });
  if (t >= w(3)) {
    word(ctx, t, 'TSUTOMU', 70, 1420, w(3), { role: R.G, size: 120, color: V.snow, seed: 2, align: 'left' });
    word(ctx, t, 'YAMAGUCHI', 70, 1540, w(4), { role: R.G, size: 120, color: V.snow, seed: 3, align: 'left' });
  }
  if (t >= w(5)) {
    const k = pop(t, w(5), 1.1);
    ctx.save(); ctx.translate(600, 1700); ctx.scale(lerp(1.6, 1, k), lerp(1.6, 1, k)); ctx.globalAlpha = clamp(k * 3);
    setFont(ctx, R.A, 200); ctx.fillStyle = rgba(V.accent); ctx.textAlign = 'center'; ctx.fillText('29', 0, 0); ctx.restore();
  }
}
export const tripBlur = () => 1;

// ================================================================ 3 · LAST
// "Es ist sein letzter Tag. Acht Uhr fünfzehn." — a summer morning (cicadas), the board turns to 08:15.
export function last(ctx, t) {
  const t0 = CUT.last;
  const u = t - t0;
  const w = (i) => W_('y05', i);
  night(ctx, [18, 20, 28], V.ink);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.1, ease.inSine(clamp(u / 3))) }, 0.6, 8);
  ctx.globalAlpha = 0.22;
  plate(ctx, 'plate_hiro2', { x: 0.5, y: 0.4, z: 1.1 + u * 0.02 });
  ctx.restore();
  word(ctx, t, 'Es ist sein', SW / 2, 470, w(0), { role: R.D, size: 92, color: V.snow, seed: 1 });
  if (t >= w(3)) tag(ctx, t, 'LETZTER TAG.', SW / 2, 620, w(3), { role: R.G, size: 112, col: V.ink, bgc: V.snow, seed: 2, rot: -0.02 });
  // the clock: 08:14 ... 08:15 (lands on "fünfzehn")
  const fs = 190, cw = 150, gap = 14;
  setFont(ctx, R.M5, 32); ctx.fillStyle = rgba(V.steel); ctx.textAlign = 'center';
  if (t >= w(5) - 0.2) ctx.fillText('6. AUGUST 1945 · HIROSHIMA', SW / 2, 920);
  ctx.letterSpacing = '0px';
  if (t >= w(5) - 0.2) {
    const final = t >= w(7) - 0.05;
    flap(ctx, final ? '08:15' : '08:14', SW / 2, 1120, t, final ? w(7) - 0.05 : w(5) - 0.2, { size: fs, cellW: cw, gap, align: 'center', seed: final ? 52 : 51, stagger: 0.03, dur: 0.3, accent: final ? [0, 1, 2, 3, 4] : null });
  }
  // a thin second hand of red under the board: the last seconds
  if (t >= w(5)) {
    const k = clamp((t - w(5)) / (w(7) - w(5)));
    ctx.fillStyle = rgba(V.accent);
    ctx.fillRect(SW / 2 - 380, 1290, 760 * k, 6);
  }
}
export const lastBlur = () => 1;

// ================================================================ 4 · FLASH
// Hiroshima, 3 km between him and the point below the bomb. The flash.
export function flashScene(ctx, t) {
  const t0 = CUT.flash;
  const u = t - t0;
  const w = (i) => W_('y06', i);
  const tf = FLASH1;
  const [sx, sy, sr] = shake(t, tf, 60, 1.4, 22);
  night(ctx, V.night, V.ink);
  ctx.save();
  camera(ctx, t, { x: SW / 2 + sx, y: SH / 2 + sy, z: lerp(1.0, 1.06, ease.inOutSine(clamp(u / 3))), r: sr }, 1, 9);
  ctx.save();
  ctx.globalAlpha = t < tf ? 0.75 : 0.95;
  plate(ctx, 'plate_hiro', { x: 0.45, y: 0.5, z: 1.0 });
  ctx.restore();
  ctx.fillStyle = rgba(V.ink, t < tf ? 0.35 : 0.1);
  ctx.fillRect(-100, -100, SW + 200, SH + 200);
  const gx = 640, gy = 830; // the point below the bomb, far out on the panorama
  // the distance: from him (foreground) to the hypocentre
  if (t >= w(0) - 0.05) {
    const k = clamp((t - w(0) + 0.05) / 0.5);
    ctx.save();
    ctx.setLineDash([18, 14]); ctx.lineDashOffset = -t * 40;
    handStroke(ctx, [[220, 1430], [380, 1210], [520, 1010], [gx, gy]], k, { width: 6, color: V.accent, t, seed: 5 });
    ctx.restore();
    rings(ctx, gx, gy, [140, 300, 480], clamp((t - w(3)) / 0.7), { sy: 0.22, t });
  }
  if (t >= tf) {
    mushroom(ctx, 'cloud_hiro', gx, gy + 20, 1000, (t - tf) / 1.4 + 0.35, { t, glow: 1.4 });
    shock(ctx, t, tf, gx, gy, { dur: 1.2, max: 1800, sy: 0.3 });
  }
  man(ctx, 210, 1880, 640, { rim: t >= tf ? 1 : 0.15, t });
  ctx.restore();
  flash(ctx, t, tf, { dur: 1.1, peak: 1, color: HOT });
  // type
  if (t >= w(0)) tag(ctx, t, '3 KM', 560, 1180, w(0), { role: R.M, size: 96, col: V.snow, bgc: V.accent, seed: 3, rot: -0.12 });
  word(ctx, t, 'von ihm entfernt:', SW / 2, 380, w(2), { role: R.D, size: 88, color: V.snow, seed: 4 });
  if (t >= w(5)) word(ctx, t, 'der', SW / 2, 520, w(5), { role: R.D, size: 88, color: t >= tf ? V.ink : V.snow, seed: 5 });
  if (t >= tf) word(ctx, t, 'BLITZ.', SW / 2, 700, tf, { role: R.G, size: 230, color: V.accent, seed: 6, k: 1.3 });
}
export const flashSceneBlur = (t) => (t >= FLASH1 && t < FLASH1 + 0.8 ? 3 : 2);
