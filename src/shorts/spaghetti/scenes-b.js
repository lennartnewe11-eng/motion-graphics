// Scenes 6–10: stretched and squeezed, toothpaste, a thread of atoms, the absurd part, the small hole.
import { SW, SH, img } from '../lib/collage.js';
import { setFont, pop, hand } from '../lib/type.js';
import { L, W_, WE, CUT } from './timeline.js';
import {
  TAU, clamp, lerp, ease, noise3, rng, rgba, V, R, night, word, tag, flash, fallingWord,
  CHALK, DEEP, view, proj, layer, chalk, ellipsePts, chalkArrow, blackHole, sheet, ribbon, stretchFigure,
  deepField, stars, tube, astro,
} from './common.js';
import { spiral } from './scenes-a.js';

// a word whose glyphs are scaled (sx, sy) — stretched or crushed
function scaledWord(ctx, t, text, x, y, at, sx, sy, { role = R.G, size = 150, color = V.snow, seed = 1 } = {}) {
  if (t < at) return;
  const p = pop(t, at, 0.9);
  ctx.save();
  ctx.translate(x + noise3(t * 0.4, seed, 1) * 3, y);
  ctx.scale(sx * lerp(0.4, 1, p), sy * lerp(0.4, 1, p));
  ctx.globalAlpha *= clamp(p * 4);
  setFont(ctx, role, size); ctx.letterSpacing = '0px';
  ctx.fillStyle = rgba(color); ctx.textAlign = 'center';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// ================================================================ 6 · STRETCH
// A pull, then the long stretch (the camera backs off and tilts with him), then the squeeze from both sides.
export function stretch(ctx, t) {
  const t0 = CUT.stretch;
  const w = (i) => W_('s06', i);
  const k = ease.inOutCubic(clamp((t - w(5)) / 0.35)) * 0.06 + ease.inOutCubic(clamp((t - w(7)) / (w(12) - w(7) + 0.4))) * 0.72;
  const sq = ease.inOutCubic(clamp((t - w(13)) / (w(17) - w(13) + 0.3)));
  night(ctx, [8, 9, 15], [3, 4, 7]);
  const back = ease.inOutCubic(clamp((t - w(7)) / (w(12) - w(7) + 0.6)));
  const cam = { x: 0, y: lerp(-80, 520, back), z: lerp(150, -1100, back) + Math.sin((t - t0) * 0.7) * 30, roll: lerp(-0.06, 0.08, back) };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_xdf', 7000, { alpha: 0.4, scale: 5 });
  stars(ctx, cam, null, { n: 150, seed: 15, size: 4 });
  layer(ctx, cam, 2600, (c) => blackHole(c, 0, 0, 300, t, { spin: 1.4, tilt: 0.3 }), { x: 0, y: 2900 });
  layer(ctx, cam, 1000, (c) => {
    stretchFigure(c, astro(), 170, -300, 1050, k, { squeeze: 0.6 + sq * 0.9 });
    // the squeeze, drawn: two hands of arrows closing in from the sides
    if (sq > 0) {
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
        const y = -300 + i * 650, x0 = 170 + side * 640, x1 = 170 + side * lerp(520, 210, sq);
        chalkArrow(c, x0, y, x1, y, { t, color: V.accent, width: 10, p: clamp(sq * 3 - i * 0.3), seed: 30 + i + (side > 0 ? 5 : 0), head: 40 });
      }
    }
  });
  ctx.restore();
  // type
  if (t < w(6)) {
    word(ctx, t, 'Erst spürst du nur ein', SW / 2, 1480, w(0), { role: R.D, size: 76, color: V.snow, seed: 1 });
    if (t >= w(5)) tag(ctx, t, 'ZIEHEN.', SW / 2, 1620, w(5), { role: R.G, size: 96, col: V.ink, bgc: V.snow, seed: 2, rot: -0.03 });
  } else if (t < w(13)) {
    word(ctx, t, 'Dann wirst du in die', SW / 2, 270, w(6), { role: R.D, size: 76, color: V.snow, seed: 3 });
    const kl = ease.inOutCubic(clamp((t - w(11)) / 0.7));
    scaledWord(ctx, t, 'LÄNGE', 260, 900, w(11), lerp(1, 0.7, kl), lerp(1, 2.4, kl), { role: R.G, size: 130, color: V.accent, seed: 4 });
    word(ctx, t, 'gezogen.', 260, 1080, w(12), { role: R.D, size: 80, color: V.snow, seed: 5 });
  } else {
    word(ctx, t, 'Und von den Seiten', SW / 2, 300, w(13), { role: R.D, size: 76, color: V.snow, seed: 6 });
    const kz = ease.outBack(clamp((t - w(17)) / 0.4));
    scaledWord(ctx, t, 'ZUSAMMENGEDRÜCKT', SW / 2, 500, w(17), lerp(0.62, 0.36, kz), lerp(1, 1.45, kz), { role: R.G, size: 150, color: V.accent, seed: 7 });
  }
}
export const stretchBlur = () => 1;

// ================================================================ 7 · PASTE
// "Wie Zahnpasta aus der Tube." — a chalk tube squeezed; what comes out is him.
export function paste(ctx, t) {
  const t0 = CUT.paste;
  const u = t - t0;
  const w = (i) => W_('s07', i);
  const sq = ease.inOutCubic(clamp((t - w(1)) / 0.9));
  night(ctx, [10, 10, 16], [3, 4, 7]);
  const z = lerp(1.25, 1.0, ease.outCubic(clamp(u / 0.5)));
  ctx.save();
  ctx.translate(SW / 2, SH / 2); ctx.scale(z, z); ctx.rotate(lerp(0.12, -0.04, ease.outCubic(clamp(u / 1.2)))); ctx.translate(-SW / 2, -SH / 2);
  const tx = 360, ty = 820;
  tube(ctx, tx, ty, 1.3, 0.35, t, sq, { p: clamp(u / 0.35) });
  // out of the nozzle: the astronaut as a thin, curling ribbon
  const nx = tx + Math.cos(0.35) * 300, ny = ty + Math.sin(0.35) * 300;
  const L0 = lerp(0, 1500, sq);
  if (L0 > 10) {
    const A = astro();
    ribbon(ctx, A, (q) => {
      const d = (1 - q) * L0;
      const a = 0.35 + d * 0.0018 + Math.sin(d * 0.006 + t) * 0.25;
      return [nx + Math.cos(0.35) * d * 0.8 + Math.sin(d * 0.004) * 120, ny + d * 0.55 + Math.sin(a * 3) * 40];
    }, { n: 120, scale: 0.16, widthAt: (q) => lerp(0.9, 0.5, q) });
  }
  ctx.restore();
  word(ctx, t, 'Wie', SW / 2, 330, w(0), { role: R.D, size: 90, color: V.snow, seed: 1 });
  if (t >= w(1)) tag(ctx, t, 'ZAHNPASTA', SW / 2, 470, w(1), { role: R.G, size: 112, col: V.ink, bgc: V.accent, seed: 2, rot: -0.03 });
  word(ctx, t, 'aus der Tube.', SW / 2 + 140, 1650, w(2), { role: R.D, size: 84, color: V.snow, seed: 3 });
}
export const pasteBlur = () => 2;

// ================================================================ 8 · ATOMS
// The thread thins out to a string of single atoms that pour into the hole — the camera dives after them.
export function atoms(ctx, t) {
  const t0 = CUT.atoms, t1 = CUT.absurd;
  const u = t - t0;
  const w = (i) => W_('s08', i);
  const k = clamp(u / (t1 - t0));
  const dive = ease.inExpo(clamp((t - w(10) - 0.2) / (t1 - w(10) - 0.2)));
  night(ctx, [6, 7, 12], [2, 3, 6]);
  const cam = { x: 0, y: lerp(-120, 0, k), z: lerp(-200, 2450, Math.max(dive, ease.inOutSine(k) * 0.35)), roll: lerp(0.1, -0.5, dive) };
  const prev = { ...cam, z: cam.z - 40 - dive * 200 };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_legion', 8000, { alpha: 0.45, scale: 6 });
  stars(ctx, cam, prev, { n: 200, seed: 17, size: 4 });
  layer(ctx, cam, 2600, (c) => {
    blackHole(c, 0, 0, 240, t, { spin: 1.6, tilt: 0.3 });
    // the thread: thin ribbon early, then dots
    const path = spiral(t, { r0: 1300, r1: 250, turns: 1.4, phase: 1.2, natural: 40, head: 0.05 });
    const thin = lerp(0.06, 0.02, k);
    if (t < w(9)) ribbon(c, astro(), path, { n: 140, scale: 0.4, widthAt: () => thin / 0.4 });
    const r = rng(9);
    const dk = clamp((t - w(7)) / 1.2);
    for (let i = 0; i < 260; i++) {
      const q = (r() + u * 0.18) % 1;
      const [x, y] = path(q);
      c.fillStyle = rgba(i % 5 ? CHALK : V.accent, dk * (0.4 + 0.6 * r()));
      c.beginPath(); c.arc(x + (r() - 0.5) * 18, y + (r() - 0.5) * 8, 2.2 + r() * 2.5, 0, TAU); c.fill();
    }
  });
  ctx.restore();
  word(ctx, t, 'Am Ende bist du nur noch', SW / 2, 300, w(0), { role: R.D, size: 72, color: V.snow, seed: 1, alpha: 1 - dive });
  if (t >= w(7)) word(ctx, t, 'ein Faden', SW / 2, 440, w(6), { role: R.G2, size: 120, color: V.snow, seed: 2, alpha: 1 - dive });
  if (t >= w(10)) {
    // ATOMEN: the letters crumble into dots
    const kd = clamp((t - w(10) - 0.25) / 0.8);
    if (kd < 1) word(ctx, t, 'ATOMEN.', SW / 2, 1640, w(10), { role: R.G, size: 160, color: V.accent, seed: 3, alpha: 1 - kd });
    const r = rng(31);
    for (let i = 0; i < 160 * kd; i++) {
      const x = SW / 2 + (r() - 0.5) * 620, y = 1600 + (r() - 0.5) * 120;
      ctx.fillStyle = rgba(V.accent, (1 - kd * 0.6) * r());
      ctx.beginPath(); ctx.arc(x + (r() - 0.5) * 400 * kd, y - kd * 500 * r(), 3, 0, TAU); ctx.fill();
    }
  }
  // into the black
  if (dive > 0.7) { ctx.fillStyle = `rgba(2,3,5,${(dive - 0.7) / 0.3})`; ctx.fillRect(0, 0, SW, SH); }
}
export const atomsBlur = () => 3;

// ================================================================ 9 · ABSURD
// Out of the black: a vast pull-back. A small hole, then a giant one — and the twist: bigger is gentler.
export function absurd(ctx, t) {
  const t0 = CUT.absurd;
  const u = t - t0;
  const w = (i) => W_('s09', i);
  const k = ease.outCubic(clamp(u / 1.6));
  const pan = ease.inOutCubic(clamp((t - w(3)) / 1.0));
  night(ctx, [7, 8, 14], [2, 3, 6]);
  const cam = { x: lerp(-700, 300, pan), y: lerp(0, -100, pan), z: lerp(2500, -2600, k), roll: lerp(-0.5, 0, k) };
  const prev = { ...cam, z: cam.z + 120 * (1 - k) };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_xdf', 9000, { alpha: 0.5, scale: 6 });
  stars(ctx, cam, prev, { n: 220, seed: 19, size: 4 });
  layer(ctx, cam, 2600, (c) => {
    blackHole(c, -700, 0, 150, t, { spin: 2, tilt: 0.3, seed: 5 });
    blackHole(c, 900, 120, 900, t, { spin: 0.5, tilt: 0.26, seed: 9 });
    const lp = clamp((t - w(3)) / 0.5);
    if (lp > 0) {
      setFont(c, R.H, 110); c.fillStyle = rgba(CHALK, lp); c.textAlign = 'center';
      c.fillText('klein', -700, -360);
      c.fillStyle = rgba(V.accent, lp); c.fillText('riesig', 900, -1250);
    }
  });
  ctx.restore();
  if (t >= w(1)) tag(ctx, t, 'DAS ABSURDE:', SW / 2, 330, w(1), { role: R.G, size: 92, col: V.ink, bgc: V.snow, seed: 1, rot: -0.03 });
  if (t >= w(2)) {
    const g = ease.outCubic(clamp((t - w(3)) / 0.6));
    word(ctx, t, 'je', SW / 2 - 390, 1450, w(2), { role: R.D, size: 90, color: V.snow, seed: 2 });
    word(ctx, t, 'GRÖSSER', SW / 2 + 60, 1470, w(3), { role: R.G, size: lerp(90, 150, g), color: V.snow, seed: 3 });
  }
  if (t >= w(7)) {
    word(ctx, t, 'desto', SW / 2 - 300, 1640, w(7), { role: R.D, size: 90, color: V.snow, seed: 4 });
    word(ctx, t, 'sanfter.', SW / 2 + 90, 1650, w(8), { role: R.D, size: 150, color: V.accent, seed: 5 });
  }
}
export const absurdBlur = (t) => (t - CUT.absurd < 1.6 ? 3 : 2);

// ================================================================ 10 · SMALL
// The small one: its horizon is tiny, the tide is brutal — he is torn apart far outside it.
export function small(ctx, t) {
  const t0 = CUT.small;
  const u = t - t0;
  const w = (i) => W_('s10', i);
  const k = ease.inOutCubic(clamp(u / (CUT.giant - t0)));
  night(ctx, [7, 8, 14], [2, 3, 6]);
  const cam = { x: lerp(-200, -60, k), y: lerp(60, 0, k), z: lerp(600, 1300, k), roll: lerp(0.08, -0.05, k) };
  ctx.save();
  view(ctx, cam);
  deepField(ctx, cam, 'plate_legion', 8000, { alpha: 0.45, scale: 6 });
  stars(ctx, cam, null, { n: 160, seed: 21, size: 4 });
  layer(ctx, cam, 2600, (c) => {
    blackHole(c, 0, 0, 90, t, { spin: 2.4, tilt: 0.3, seed: 5 });
    // the horizon, dashed and labelled; the shredding point far outside it
    chalk(c, ellipsePts(0, 0, 130, 130, 0, TAU, 60), { t, color: CHALK, width: 3, alpha: 0.7, dash: [10, 10], seed: 41, p: clamp((t - w(1)) / 0.5) });
    const sx = 700, sy = -380;
    const tear = ease.inOutCubic(clamp((t - w(2)) / 0.8));
    const A = astro();
    const path = (q) => [lerp(sx + 120, 60, Math.pow(q, 1 / (1 + tear * 3)) * tear + q * (1 - tear) * 0.25), lerp(sy - 220, -10, Math.pow(q, 1 / (1 + tear * 3)) * tear + q * (1 - tear) * 0.25)];
    ribbon(c, A, path, { n: 120, scale: 0.18, widthAt: (q) => lerp(1, lerp(1, 0.12, tear), q) });
    if (t >= w(4)) {
      chalkArrow(c, sx - 80, sy + 160, 150, 60, { t, color: V.accent, width: 6, p: clamp((t - w(4)) / 0.5), seed: 43, head: 30 });
      setFont(c, R.H, 70); c.fillStyle = rgba(V.accent, clamp((t - w(4)) / 0.4)); c.textAlign = 'center';
      c.fillText('noch weit weg', 520, 140);
    }
  });
  ctx.restore();
  word(ctx, t, 'Ein kleines', SW / 2, 320, w(0), { role: R.D, size: 90, color: V.snow, seed: 1 });
  if (t >= w(2)) {
    // ZERREISST: the word torn in two
    const kt = ease.outCubic(clamp((t - w(2) - 0.1) / 0.4));
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 26 * kt, -side * 12 * kt); ctx.rotate(side * 0.03 * kt);
      ctx.beginPath(); side < 0 ? ctx.rect(0, 0, SW / 2 + 10, SH) : ctx.rect(SW / 2 + 10, 0, SW, SH); ctx.clip();
      word(ctx, t, 'ZERREISST', SW / 2, 500, w(2), { role: R.G, size: 150, color: V.accent, seed: 2 });
      ctx.restore();
    }
  }
  word(ctx, t, 'lange bevor du es erreichst.', SW / 2, 1640, w(4), { role: R.D, size: 72, color: V.snow, seed: 3 });
}
export const smallBlur = () => 2;
