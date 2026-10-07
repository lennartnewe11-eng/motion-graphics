// Scenes 11–14: the giant hole (no feeling at the edge), the outside view, frozen and red at the rim, a star
// that really became spaghetti (AT2019qiz) — then the loop back into the hook.
import { SW, SH, img } from '../lib/collage.js';
import { setFont, pop, hand } from '../lib/type.js';
import { L, W_, WE, CUT, DURATION } from './timeline.js';
import {
  TAU, clamp, lerp, ease, noise3, rng, rgba, V, R, night, word, tag, flap, drum, flash,
  CHALK, DEEP, view, proj, layer, chalk, ellipsePts, chalkArrow, blackHole, ribbon, stretchFigure,
  deepField, stars, eye, clockFace, astro,
} from './common.js';
import { hook, spiral } from './scenes-a.js';

// ================================================================ 11 · GIANT
// A horizon so large it is a horizon: a curved black edge across the frame. He drifts over it, whole.
export function giant(ctx, t) {
  const t0 = CUT.giant;
  const u = t - t0;
  const w = (i) => W_('s11', i);
  const k = ease.inOutSine(clamp(u / (CUT.outside - t0)));
  night(ctx, [8, 9, 15], [3, 4, 7]);
  const cam = { x: lerp(-120, 120, k), y: lerp(-200, 120, k), z: lerp(0, 380, k), roll: lerp(-0.14, 0.04, k) };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_xdf', 8000, { alpha: 0.5, scale: 6 });
  stars(ctx, cam, null, { n: 160, seed: 23, size: 4 });
  layer(ctx, cam, 1600, (c) => {
    // the edge of a supermassive hole: a giant black disc with a chalk rim and a glowing amber band
    const R0 = 6000, cy = 300 + R0;
    c.save(); c.globalCompositeOperation = 'screen';
    const g = c.createRadialGradient(0, cy, R0 * 0.98, 0, cy, R0 * 1.06);
    g.addColorStop(0, rgba(V.accent, 0.6)); g.addColorStop(1, rgba(V.accent, 0));
    c.fillStyle = g; c.fillRect(-3000, 0, 6000, 1200);
    c.restore();
    c.fillStyle = '#020305';
    c.beginPath(); c.arc(0, cy, R0, 0, TAU); c.fill();
    chalk(c, ellipsePts(0, cy, R0, R0, -Math.PI * 0.62, -Math.PI * 0.38, 120), { t, color: CHALK, width: 5, alpha: 0.9, seed: 51, p: clamp((t - w(5)) / 0.6) });
    if (t >= w(6)) {
      // the label follows the curve
      const lp = clamp((t - w(6)) / 0.5);
      setFont(c, R.M, 70); c.letterSpacing = '0px';
      const text = 'EREIGNISHORIZONT';
      const tw = c.measureText(text).width;
      let a = -Math.PI / 2 - tw / 2 / (R0 + 60);
      for (const ch of text) {
        const cw = c.measureText(ch).width;
        a += cw / 2 / (R0 + 60);
        c.save(); c.translate(Math.cos(a) * (R0 + 60), cy + Math.sin(a) * (R0 + 60)); c.rotate(a + Math.PI / 2);
        c.fillStyle = rgba(V.accent, lp); c.textAlign = 'center'; c.fillText(ch, 0, 0); c.restore();
        a += cw / 2 / (R0 + 60);
      }
    }
  });
  // him, whole and calm, drifting across the edge
  layer(ctx, cam, 1000, (c) => {
    const A = astro(); const h = 520, s = h / A.height;
    c.save(); c.translate(lerp(-380, 120, k), lerp(-520, 60, k) + Math.sin(u * 1.2) * 12); c.rotate(lerp(-0.25, 0.2, k));
    c.drawImage(A, -A.width * s / 2, -A.height * s / 2, A.width * s, A.height * s);
    c.restore();
  });
  ctx.restore();
  word(ctx, t, 'Bei einem', SW / 2 - 200, 300, w(0), { role: R.D, size: 84, color: V.snow, seed: 1 });
  if (t >= w(2)) tag(ctx, t, 'RIESIGEN', SW / 2 + 120, 420, w(2), { role: R.G, size: 120, col: V.ink, bgc: V.snow, seed: 2, rot: 0.03 });
  word(ctx, t, 'fällst du über den Rand,', SW / 2, 1450, w(3), { role: R.D, size: 72, color: V.snow, seed: 3 });
  if (t >= w(8)) word(ctx, t, 'ohne etwas zu merken.', SW / 2, 1600, w(8), { role: R.D, size: 84, color: V.accent, seed: 4 });
}
export const giantBlur = () => 2;

// ================================================================ 12 · OUTSIDE
// The camera rushes back out to someone watching from far away: a drawn eye, a tiny figure at the hole.
export function outside(ctx, t) {
  const t0 = CUT.outside;
  const u = t - t0;
  const w = (i) => W_('s12', i);
  const k = ease.outExpo(clamp(u / 0.9));
  night(ctx, [7, 8, 14], [2, 3, 6]);
  const cam = { x: lerp(300, 0, k), y: lerp(300, 0, k), z: lerp(2200, -400, k), roll: lerp(0.3, 0, k) };
  const prev = { ...cam, z: cam.z + 260 * (1 - k) };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_legion', 8000, { alpha: 0.45, scale: 6 });
  stars(ctx, cam, prev, { n: 200, seed: 25, size: 4 });
  layer(ctx, cam, 2600, (c) => {
    blackHole(c, 300, 300, 260, t, { spin: 1, tilt: 0.3 });
    const A = astro(); const s = 120 / A.height;
    c.save(); c.translate(300 + 330, 300 - 200); c.rotate(0.5);
    c.drawImage(A, -A.width * s / 2, -A.height * s / 2, A.width * s, A.height * s); c.restore();
  });
  ctx.restore();
  // the observer
  eye(ctx, 300, 1450, 1.3, t, { p: clamp(u / 0.5), look: Math.sin(u * 1.5) * 0.3 + 0.3 });
  chalkArrow(ctx, 470, 1360, 700, 980, { t, color: CHALK, width: 4, p: clamp((u - 0.4) / 0.4), seed: 61, dash: [10, 10], head: 26 });
  word(ctx, t, 'Und von außen?', SW / 2, 330, w(0), { role: R.D, size: 96, color: V.snow, seed: 1 });
  if (t >= w(5)) tag(ctx, t, 'NIEMAND', SW / 2 + 150, 1700, w(5), { role: R.G, size: 110, col: V.ink, bgc: V.snow, seed: 2, rot: -0.03 });
  word(ctx, t, 'sieht dich', SW / 2 + 160, 1560, w(3), { role: R.D, size: 72, color: V.snow, seed: 3 });
}
export const outsideBlur = (t) => (t - CUT.outside < 0.9 ? 3 : 2);

// ================================================================ 13 · FREEZE
// Seen from outside, he slows down at the rim, turns red, and fades — a clock beside him running down.
export function freeze(ctx, t) {
  const t0 = CUT.freeze;
  const u = t - t0;
  const w = (i) => W_('s13', i);
  const slow = clamp((t - w(7)) / (w(12) - w(7)));
  const red = clamp((t - w(9)) / 0.8);
  const fade = clamp((t - w(12)) / 1.0);
  night(ctx, [8, 9, 15], [3, 4, 7]);
  const cam = { x: 0, y: 0, z: lerp(0, 520, ease.inOutSine(clamp(u / 5))), roll: lerp(0.04, -0.03, clamp(u / 5)) };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_xdf', 8000, { alpha: 0.4, scale: 6 });
  layer(ctx, cam, 1800, (c) => blackHole(c, 0, 520, 420, t, { spin: lerp(1, 0.15, slow), tilt: 0.3 }));
  // his own clock: he approaches the rim ever more slowly (exponential approach), turning red, fading out
  const us = W_('s13', 7) - t0; // from here on his clock (as seen from outside) runs ever slower
  const prog = 1 - Math.exp(-(Math.min(u, us) * 0.6 + Math.max(0, u - us) * 0.06));
  layer(ctx, cam, 1000, (c) => {
    const A = astro(); const h = 520, s = h / A.height;
    c.save(); c.translate(lerp(-120, 0, prog), lerp(-180, 60, prog)); c.rotate(0.15);
    c.globalAlpha = 1 - fade;
    if (red > 0) c.filter = `sepia(${red.toFixed(2)}) saturate(${(1 + red * 7).toFixed(2)}) hue-rotate(-${(red * 45).toFixed(0)}deg) brightness(${(1 - red * 0.3).toFixed(2)})`;
    c.drawImage(A, -A.width * s / 2, -A.height * s / 2, A.width * s, A.height * s);
    c.filter = 'none';
    c.restore();
  });
  ctx.restore();
  const ang = u * TAU * 0.6 * lerp(1, 0.02, ease.outCubic(slow));
  clockFace(ctx, 880, 820, 110, t, (t - t0) * TAU * 0.5 * lerp(1, 0.05, slow) + Math.sin(ang) * 0, { p: clamp(u / 0.5) });
  word(ctx, t, 'Für jeden Beobachter', SW / 2, 300, w(0), { role: R.D, size: 72, color: V.snow, seed: 1 });
  if (t >= w(7)) {
    // LANGSAMER: letters drift apart ever more slowly
    const kl = 1 - Math.exp(-(t - w(7)) * 1.2);
    setFont(ctx, R.G, 110); ctx.letterSpacing = `${(kl * 26).toFixed(1)}px`;
    ctx.fillStyle = rgba(V.snow); ctx.textAlign = 'center'; ctx.globalAlpha = clamp((t - w(7)) / 0.2);
    ctx.fillText('LANGSAMER', SW / 2, 470); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  }
  if (t >= w(10)) word(ctx, t, 'RÖTER', SW / 2, 620, w(10), { role: R.G, size: 130, color: DEEP, seed: 2 });
  if (t >= w(13)) word(ctx, t, 'verblasst.', SW / 2, 1640, w(13), { role: R.D, size: 90, color: V.snow, seed: 3, alpha: 1 - clamp((t - w(13) - 0.4) / 0.8) });
}
export const freezeBlur = () => 1;

// ================================================================ 14 · STAR
// 2019, AT2019qiz: a star like our Sun torn into a stream. The Sun (SDO) is laid along the spiral. Loop.
export function starScene(ctx, t) {
  const t0 = CUT.star;
  const u = t - t0;
  const w = (i) => W_('s14', i);
  const loop = DURATION - 0.5;
  if (t >= loop) { hook(ctx, t - DURATION); return; }
  const tear = ease.inOutCubic(clamp((t - w(12)) / 1.4));
  night(ctx, [6, 7, 12], [2, 3, 6]);
  const cam = { x: lerp(500, 0, ease.inOutSine(clamp(u / 4))), y: lerp(-300, 0, ease.inOutSine(clamp(u / 4))), z: lerp(-1800, 700, ease.inOutCubic(clamp(u / 7))), roll: lerp(0.2, -0.1, clamp(u / 7)) };
  const prev = { ...cam, z: cam.z - 40 };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_xdf', 9000, { alpha: 0.5, scale: 6 });
  stars(ctx, cam, prev, { n: 200, seed: 27, size: 4 });
  layer(ctx, cam, 2600, (c) => {
    blackHole(c, 0, 0, 230, t, { spin: 1.6, tilt: 0.3 });
    const S = img('sun');
    if (tear <= 0) {
      const s = 0.42;
      c.drawImage(S, 900 - S.width * s / 2, -500 - S.height * s / 2, S.width * s, S.height * s);
    } else {
      // the star stretched along the spiral, its outer half still round-ish, the rest a glowing stream
      const path = spiral(t, { r0: lerp(1050, 1350, tear), r1: 240, turns: lerp(0.15, 1.2, tear), phase: -0.5, natural: S.height * 0.42 * lerp(1, 0.45, tear), head: 0.35 });
      c.save(); c.globalCompositeOperation = 'screen';
      ribbon(c, S, path, { n: 150, scale: 0.42, widthAt: (q) => (q < 0.35 ? lerp(1, 0.75, tear) : lerp(lerp(1, 0.75, tear), lerp(0.6, 0.05, tear), (q - 0.35) / 0.65)) });
      c.restore();
    }
  });
  ctx.restore();
  // type
  flap(ctx, '2019', SW / 2, 330, t, w(0) - 0.1, { size: 120, cellW: 96, gap: 10, align: 'center', seed: 141, accent: [0, 1, 2, 3] });
  word(ctx, t, 'haben Astronomen genau das beobachtet:', SW / 2, 500, w(1), { role: R.D, size: 58, color: V.snow, seed: 1, alpha: 1 - clamp((t - w(6)) / 0.3) });
  if (t >= w(5) + 0.2) {
    setFont(ctx, R.M5, 34); ctx.fillStyle = rgba(V.fog, clamp((t - w(5) - 0.2) / 0.3)); ctx.textAlign = 'center';
    ctx.fillText('AT2019qiz · TIDAL DISRUPTION EVENT', SW / 2, 580); ctx.letterSpacing = '0px';
  }
  if (t >= w(8) - 0.05 && t < w(12)) {
    drum(ctx, SW / 2 - 60, 1430, lerp(0, 215000000, ease.outExpo(clamp((t - w(8) + 0.05) / 1.1))), 9, { size: 92, color: V.accent, unit: 'LJ' });
    word(ctx, t, 'Lichtjahre entfernt', SW / 2, 1560, w(10), { role: R.D, size: 64, color: V.snow, seed: 2 });
  }
  if (t >= w(12)) {
    word(ctx, t, 'wurde zu', SW / 2, 1230, w(12), { role: R.D, size: 84, color: V.snow, seed: 3 });
    const kk = ease.inOutCubic(clamp((t - w(14) - 0.2) / 1.2));
    // the last word, pulled long
    setFont(ctx, R.G, 170); ctx.letterSpacing = '0px';
    if (t >= w(14)) {
      const p = pop(t, w(14), 0.9);
      ctx.save(); ctx.translate(SW / 2, 1600); ctx.scale(lerp(0.4, 1, p) * (1 - kk * 0.25), lerp(0.4, 1, p) * (1 + kk * 0.9));
      ctx.globalAlpha = clamp(p * 4); ctx.fillStyle = rgba(V.accent); ctx.textAlign = 'center'; ctx.fillText('SPAGHETTI.', 0, 0);
      ctx.restore();
    }
  }
}
export const starSceneBlur = (t) => (t >= DURATION - 0.5 ? 3 : 2);
