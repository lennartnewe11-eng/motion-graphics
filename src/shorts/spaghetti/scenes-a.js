// Scenes 1–5: the hook (a noodle spiralling in), the name, feet first, the tide, closer (dolly zoom).
import { SW, SH, img, shake } from '../lib/collage.js';
import { setFont, pop, hand } from '../lib/type.js';
import { L, W_, WE, CUT, E8 } from './timeline.js';
import {
  TAU, clamp, lerp, ease, noise3, rng, rgba, V, R, night, word, tag, flash, drum,
  CHALK, DEEP, F, view, proj, layer, chalk, ellipsePts, chalkArrow, hatch, blackHole, sheet, ribbon, stretchFigure,
  deepField, stars, fork, astro,
} from './common.js';

const BH = { x: 0, y: -60, z: 2600, r: 230 }; // the hole in world units (hook / name)

// the astronaut's spiral path into the disk: u = 0 (head, far out) .. 1 (feet, at the horizon)
export function spiral(t, { r0 = 1500, r1 = 160, turns = 1.15, phase = 0, tilt = 0.28, rot = -0.12, natural = 300, head = 0.42 } = {}) {
  // a spiral in the disk plane, parametrised by arc length from its outer end. The upper body (u < head) keeps its
  // natural length (world units); the legs are stretched over everything else, down to the horizon.
  const at = (s) => {
    const r = lerp(r1, r0, Math.pow(s, 1.6));
    const a = phase - t * 0.9 + s * turns * TAU;
    const x = Math.cos(a) * r, y = Math.sin(a) * r * tilt;
    return [x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)];
  };
  const N = 400, cum = [0], pts = [at(1)];
  for (let i = 1; i <= N; i++) { const q = at(1 - i / N); cum.push(cum[i - 1] + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1])); pts.push(q); }
  const total = cum[N];
  const byLen = (d) => {
    let lo = 0, hi = N;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < d) lo = m; else hi = m; }
    const f = (d - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo]);
    return [lerp(pts[lo][0], pts[hi][0], f), lerp(pts[lo][1], pts[hi][1], f)];
  };
  const hl = Math.min(natural, total * 0.5);
  return (u) => byLen(u < head ? (u / head) * hl : hl + (total - hl) * Math.pow((u - head) / (1 - head), 1.25));
}

// letters that spaghettify: each glyph is stretched more the further down (toward the hole) it sits
function noodleWord(ctx, t, text, x, y, at, k, { role = R.G, size = 150, color = V.accent, vertical = false, seed = 2 } = {}) {
  if (t < at) return;
  const p = pop(t, at, 0.9);
  setFont(ctx, role, size); ctx.letterSpacing = '0px';
  const ws = [...text].map((c) => ctx.measureText(c).width);
  const n = text.length;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= clamp(p * 4);
  let off = 0;
  [...text].forEach((c, i) => {
    const u = n > 1 ? i / (n - 1) : 0;
    const sy = 1 + k * Math.pow(u, 2.2) * 3.2, sx = 1 - k * Math.pow(u, 1.5) * 0.55;
    ctx.save();
    if (vertical) {
      ctx.translate(0, off + size * 0.5 * sy);
      ctx.scale(sx * lerp(0.4, 1, p), sy * lerp(0.4, 1, p));
      ctx.fillStyle = rgba(color); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(c, noise3(t * 3, i, seed) * 4, 0);
      off += size * 0.86 * sy;
    } else {
      ctx.translate(off + ws[i] * sx / 2, 0);
      ctx.scale(sx * lerp(0.4, 1, p), sy * lerp(0.4, 1, p));
      ctx.fillStyle = rgba(color); ctx.textAlign = 'center';
      ctx.fillText(c, 0, 0);
      off += ws[i] * sx;
    }
    ctx.restore();
  });
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

// ================================================================ 1 · HOOK
export function hook(ctx, t) {
  const t1 = CUT.name;
  const k = clamp(t / t1);
  const w = (i) => W_('s01', i);
  night(ctx, [6, 7, 12], [2, 3, 6]);
  const cam = { x: lerp(300, -40, ease.inOutSine(k)), y: lerp(-220, -40, ease.inOutSine(k)), z: lerp(150, 1100, ease.inQuad(k)), roll: lerp(-0.22, 0.06, ease.inOutSine(k)) };
  const prev = { ...cam, z: cam.z - 70, x: cam.x + 8 };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_xdf', 9000, { alpha: 0.55, scale: 6 });
  stars(ctx, cam, prev, { n: 220, seed: 3, size: 4 });
  layer(ctx, cam, BH.z, (c) => {
    blackHole(c, 0, 0, BH.r, t, { spin: 1.4 });
    // the noodle: Bruce McCandless (NASA, 1984) laid along the spiral, feet first into the disk
    const A = astro(), sc = 0.46;
    const path = spiral(t, { r0: 1350, r1: BH.r * 1.05, turns: 0.9, phase: 0.45, natural: A.height * sc * 0.42, head: 0.42 });
    ribbon(c, A, path, { n: 160, scale: sc, widthAt: (u) => (u < 0.42 ? 1 : lerp(1, 0.14, Math.pow((u - 0.42) / 0.58, 0.6))) });
  }, { x: BH.x, y: BH.y });
  ctx.restore();
  // ---- type
  word(ctx, t, 'Wenn du in ein', SW / 2, 330, w(0), { role: R.D, size: 84, color: V.snow, seed: 1 });
  if (t >= w(4)) tag(ctx, t, 'SCHWARZES LOCH', SW / 2, 470, w(4), { role: R.G, size: 96, col: V.snow, bgc: V.ink, seed: 2, rot: -0.02 });
  word(ctx, t, 'fällst, wirst du zu', SW / 2, 1360, w(6), { role: R.D, size: 80, color: V.snow, seed: 3 });
  if (t >= w(10)) {
    const kk = ease.inOutCubic(clamp((t - w(10) - 0.15) / 0.9));
    noodleWord(ctx, t, 'SPAGHETTI', 140, 1560, w(10), kk * 0.55, { role: R.G, size: 150, color: V.accent });
    // a fork shows up and starts to twirl
    fork(ctx, 820, 1180 + (1 - ease.outBack(clamp((t - w(10)) / 0.4))) * 600, 1.5, 0.3 + Math.sin(t * 7) * 0.1, t, { p: clamp((t - w(10)) / 0.35) });
  }
}
export const hookBlur = () => 3;

// ================================================================ 2 · NAME
// "Kein Witz." The word itself is spaghettified: vertical, stretching toward the hole the camera tilts down to.
export function name(ctx, t) {
  const t0 = CUT.name, t1 = CUT.feet;
  const u = t - t0;
  const w = (i) => W_('s02', i);
  const tw = w(6) - 0.05; // "Spaghettifizierung"
  night(ctx, [6, 7, 12], [2, 3, 6]);
  // camera: tilts down the word from top to the hole at its foot
  const tilt = ease.inOutCubic(clamp((t - tw) / (t1 - tw - 0.1)));
  const cam = { x: 0, y: lerp(-400, 1500, tilt), z: lerp(0, 260, tilt), roll: lerp(0.08, -0.04, tilt) };
  const prev = { ...cam, y: cam.y - 30 * (tilt > 0 && tilt < 1 ? 1 : 0) };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_legion', 6000, { alpha: 0.5, scale: 5 });
  stars(ctx, cam, prev, { n: 160, seed: 5, size: 4 });
  layer(ctx, cam, 1000, (c) => blackHole(c, 0, 0, 220, t, { spin: 1.2, tilt: 0.3 }), { x: 0, y: 3200 });
  // the word, in world space at z = 1000 (screen scale 1 at cam.z = 0)
  layer(ctx, cam, 1000, (c) => {
    noodleWord(c, t, 'SPAGHETTIFIZIERUNG', 0, -620, tw, ease.inOutCubic(clamp((t - tw) / 1.6)) * 0.85, { role: R.G, size: 170, color: V.accent, vertical: true });
  });
  ctx.restore();
  if (t < tw + 0.3) {
    if (t >= w(0)) tag(ctx, t, 'KEIN WITZ.', SW / 2, 620, w(0), { role: R.G, size: 130, col: V.ink, bgc: V.snow, seed: 4, rot: -0.04 });
    word(ctx, t, 'Das heißt wirklich so:', SW / 2, 860, w(2), { role: R.D, size: 84, color: V.snow, seed: 5, alpha: 1 - clamp((t - tw) / 0.3) });
  }
}
export const nameBlur = (t) => (t > W_('s02', 6) ? 3 : 2);

// ================================================================ 3 · FEET
// Reset to a body: the astronaut whole again, turning feet-first. The rubber sheet of spacetime draws itself
// beneath him and bends into the funnel; the camera pulls out to show where he is falling.
export const ASTRO_AXIS = 0; // astro() is already upright; he turns from his photo pose (+0.7) to feet-down
export function feet(ctx, t) {
  const t0 = CUT.feet;
  const u = t - t0;
  const w = (i) => W_('s03', i);
  const k = ease.inOutCubic(clamp(u / (CUT.tide - t0)));
  night(ctx, [8, 9, 15], [3, 4, 7]);
  const cam = { x: 0, y: lerp(0, 160, k), z: lerp(400, -900, k), roll: lerp(0.18, 0, k) };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_xdf', 7000, { alpha: 0.45, scale: 5 });
  stars(ctx, cam, null, { n: 140, seed: 7, size: 4 });
  layer(ctx, cam, 1600, (c) => {
    sheet(c, 0, 520, t, { w: 3400, d: 2400, n: 18, depth: 1400, horizon: 0.3, p: clamp((t - w(0)) / 1.4), alpha: 0.5 });
    blackHole(c, 0, 640, 120, t, { spin: 1.1, tilt: 0.3, glow: 0.8 });
  });
  layer(ctx, cam, 1000, (c) => {
    const rot = lerp(0.7, ASTRO_AXIS, ease.inOutBack(clamp((t - w(4)) / 0.9)));
    c.save(); c.rotate(rot);
    const im = astro(); const s = 620 / im.height;
    c.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s);
    c.restore();
  }, { x: 0, y: -260 + Math.sin(u * 1.4) * 14 });
  ctx.restore();
  word(ctx, t, 'Stell dir vor,', SW / 2, 300, w(0), { role: R.D, size: 84, color: V.snow, seed: 1 });
  word(ctx, t, 'du fällst', SW / 2, 420, w(3), { role: R.D, size: 84, color: V.snow, seed: 2 });
  if (t >= w(7)) {
    tag(ctx, t, 'FÜSSE VORAUS', SW / 2 + 160, 1520, w(7), { role: R.G, size: 84, col: V.ink, bgc: V.accent, seed: 3, rot: 0.04 });
    chalkArrow(ctx, 760, 1440, 640, 1220, { t, color: V.accent, width: 7, p: clamp((t - w(7)) / 0.35), seed: 8, head: 34 });
  }
}
export const feetBlur = () => 2;

// ================================================================ 4 · TIDE
// The tide, drawn: a long arrow at the feet, a short one at the head. The camera rides down his body.
export function tide(ctx, t) {
  const t0 = CUT.tide;
  const u = t - t0;
  const w = (i) => W_('s04', i);
  night(ctx, [8, 9, 15], [3, 4, 7]);
  // camera: head (close) -> down the body -> feet, slight roll
  const ride = ease.inOutCubic(clamp((t - w(3)) / (w(10) - w(3) + 0.4)));
  const cam = { x: lerp(-60, 40, ride), y: lerp(-420, 420, ride), z: lerp(380, 120, Math.sin(ride * Math.PI) * 0.6 + 0.2), roll: lerp(-0.05, 0.05, ride) };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_xdf', 6000, { alpha: 0.4, scale: 5 });
  stars(ctx, cam, null, { n: 140, seed: 9, size: 4 });
  layer(ctx, cam, 2600, (c) => blackHole(c, 0, 0, 260, t, { spin: 1, tilt: 0.3 }), { x: 0, y: 2200 });
  layer(ctx, cam, 1000, (c) => {
    stretchFigure(c, astro(), 0, 0, 1100, 0.03, { rot: 0 });
    // the pull: same direction, different strength (feet > head)
    const pa = clamp((t - w(1)) / 0.4), pb = clamp((t - w(5)) / 0.4), pc = clamp((t - w(9)) / 0.4);
    chalkArrow(c, -300, -430, -300, -330, { t, color: CHALK, width: 7, p: pc, seed: 11, head: 26 });
    chalkArrow(c, -300, 330, -300, 760, { t, color: V.accent, width: 11, p: pb, seed: 12, head: 46 });
    chalk(c, [[-200, -520], [200, -520]], { t, width: 3, alpha: 0.5, p: pa, seed: 13, dash: [12, 10] });
    hand(c, 'Kopf', -360, -350, t, w(10) - 0.1, { size: 64, color: CHALK, dur: 0.3, align: 'right' });
    hand(c, 'Füße', -360, 540, t, w(5), { size: 72, color: V.accent, dur: 0.3, align: 'right' });
  });
  ctx.restore();
  word(ctx, t, 'Die Schwerkraft zieht', SW / 2, 300, w(0), { role: R.D, size: 80, color: V.snow, seed: 1 });
  if (t >= w(6)) {
    const p = pop(t, w(6), 0.9);
    // STÄRKER: the word itself is pulled harder at its bottom
    noodleWord(ctx, t, 'STÄRKER', 170, 1650, w(6), ease.inOutCubic(clamp((t - w(6)) / 0.8)) * 0.35, { role: R.G, size: 170, color: V.accent });
    if (p <= 0) return;
  }
}
export const tideBlur = () => 2;

// ================================================================ 5 · CLOSER
// Dolly zoom: he stays the same size while the camera rushes in — the hole swells behind him, the arrows grow.
export function closer(ctx, t) {
  const t0 = CUT.closer;
  const u = t - t0;
  const w = (i) => W_('s05', i);
  const k = ease.inOutCubic(clamp(u / (CUT.stretch - t0)));
  night(ctx, [8, 9, 15], [3, 4, 7]);
  const cam = { x: 0, y: 0, z: lerp(-1800, 1600, k), roll: lerp(0, 0.12, k) };
  const prev = { ...cam, z: cam.z - 90 };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_legion', 9000, { alpha: 0.4, scale: 7 });
  stars(ctx, cam, prev, { n: 220, seed: 13, size: 4 });
  layer(ctx, cam, 2600, (c) => blackHole(c, 0, 0, 260, t, { spin: 1.3, tilt: 0.3 }), { x: 0, y: 380 });
  ctx.restore();
  // him in screen space at a fixed size (dolly zoom), arrows swelling with the tide
  const tideK = lerp(0.08, 0.28, k);
  ctx.save();
  ctx.translate(SW / 2, 900);
  stretchFigure(ctx, astro(), 0, 0, 900, tideK, { rot: 0 });
  chalkArrow(ctx, 270, -380, 270, -380 + lerp(70, 110, k), { t, color: CHALK, width: 7, seed: 21, head: 24 });
  chalkArrow(ctx, 270, 300, 270, 300 + lerp(260, 620, k), { t, color: V.accent, width: 12, seed: 22, head: 46 });
  ctx.restore();
  // the difference, as a number that keeps climbing
  word(ctx, t, 'je näher du kommst,', SW / 2, 300, w(1), { role: R.D, size: 80, color: V.snow, seed: 1 });
  if (t >= w(5)) {
    word(ctx, t, 'desto größer der', SW / 2, 1520, w(5), { role: R.D, size: 72, color: V.snow, seed: 2 });
    tag(ctx, t, 'UNTERSCHIED', SW / 2, 1660, w(9), { role: R.G, size: 110, col: V.ink, bgc: V.accent, seed: 3, rot: -0.02 });
  }
}
export const closerBlur = () => 3;
