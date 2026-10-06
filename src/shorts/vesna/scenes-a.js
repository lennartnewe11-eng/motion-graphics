// Scenes 1–5: the fall (hook), black + "überlebt", flight JU 367, on board, the duty roster.
import { SW, SH, img, camera, shake, sticker, print, plate, handCircle, handArrow, handStroke, onTwos, tornPath, tornShadow, pathPts } from '../lib/collage.js';
import { setFont, measure, pop, breathe, typed } from '../lib/type.js';
import { L, W_, WE, CUT, IMPACT, BEAT, E8 } from './timeline.js';
import {
  TAU, clamp, lerp, ease, noise3, rng, rgba, inR, V, R, night, cloudField, specks, YU, windowAt, yuaht, divePlane,
  flap, drum, word, tag, fallingWord, marker, flash, fireball,
} from './common.js';

const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// ================================================================ 1 · FALL
// Frame 1: a DC-9, nose down, tumbling through cloud. The camera falls with it; clouds tear upward past the lens,
// the altimeter runs out, the forest comes up — and the screen goes black on the impact.
const ALT0 = 10160;
function fallWarp(t) { return t * 0.9 + t * t * 0.32; } // the fall accelerates
export function fall(ctx, t) {
  const T = IMPACT;
  const u = clamp(t / T);
  const tw = fallWarp(t);
  // sky: deep blue-black, a little haze lower down
  night(ctx, mixc([9, 12, 19], [24, 30, 40], u), mixc([30, 36, 48], [60, 68, 80], u));
  const [sx, sy, sr] = shake(t, 0, 10, T, 13);
  const gs = 0.9 + 0.1 * Math.sin(t * 31); // buffeting
  ctx.save();
  camera(ctx, t, { x: SW / 2 + sx * gs, y: SH / 2 + sy * gs, z: 1, r: sr }, 1.6, 2);

  // far clouds behind the plane
  const g0 = 2.2; // below the cloud deck from here
  cloudField(ctx, tw, { seed: 11, n: 10, speed: 640, layer: 'back', zmin: 0.3, zmax: 1, lane: 0.16, size: 0.8, alpha: 1 - clamp((t - g0) / 0.3) });
  // wind: thin streaks rushing upward past the lens
  specks(ctx, tw, { n: 40, seed: 5, vy: -2600, vx: 0, size: 3, alpha: 0.22 * (1 - clamp((t - g0) / 0.5)), streak: 0.03, color: V.fog });
  // the ground comes up from below: the forest's tree line rises into the frame and grows
  if (t > g0 - 0.1) {
    const k = clamp((t - g0 + 0.1) / (T - g0 + 0.1));
    const im = img('plate_snow_b');
    const sc = lerp(0.62, 2.6, ease.inCubic(k)) * (SW / im.width) * 1.6;
    const w = im.width * sc, h = im.height * sc;
    const top = lerp(SH * 0.92, -h * 0.42, ease.inQuad(k));
    ctx.save();
    ctx.globalAlpha = clamp((t - g0 + 0.1) / 0.3);
    ctx.drawImage(im, SW / 2 - w * 0.52, top, w, h);
    // the photo's overcast sky dissolves into ours
    const g = ctx.createLinearGradient(0, top, 0, top + h * 0.3);
    g.addColorStop(0, rgba([44, 52, 64], 1)); g.addColorStop(1, rgba([44, 52, 64], 0));
    ctx.fillStyle = g;
    ctx.fillRect(-100, top - 2, SW + 200, h * 0.3 + 2);
    ctx.fillStyle = rgba([44, 52, 64]);
    ctx.fillRect(-100, -200, SW + 200, top + 200);
    // haze thins as the ground comes closer
    ctx.fillStyle = rgba([60, 68, 80], lerp(0.5, 0, k));
    ctx.fillRect(-100, top, SW + 200, SH - top + 100);
    ctx.restore();
  }

  // the plane: nose down, rolling slowly; at the very end it drops out of frame (the camera stops)
  const plunge = ease.inCubic(clamp((t - (T - 0.42)) / 0.42));
  const px = SW * 0.52 + noise3(t * 0.9, 1, 1) * 40 + plunge * 60;
  const py = 1000 + noise3(t * 0.8, 2, 1) * 30 + plunge * 1500;
  const pr = -1.95 + t * 0.09 + noise3(t * 1.7, 3, 1) * 0.06;
  divePlane(ctx, px, py, 0.74 + plunge * 0.4, pr, { flip: true });

  // near clouds tear past in front of the plane (faster, bigger, fewer: the plane must stay readable)
  cloudField(ctx, tw, { seed: 23, n: 5, speed: 780, layer: 'front', zmin: 1.1, zmax: 2.6, lane: 0.05, alpha: 0.95 * (1 - clamp((t - g0) / 0.25)) });
  // the cloud deck: we punch through a white-out, then clear air above the forest
  if (inR(t, 1.75, 2.45)) {
    const k = (t - 1.75) / 0.7;
    const im = img('cloud_f');
    const s = (SW / im.width) * 3.6;
    const y = lerp(SH + im.height * s * 0.8, -im.height * s * 0.8, ease.inOutSine(k));
    ctx.save();
    ctx.translate(SW / 2, y);
    ctx.scale(s, s * 1.9);
    ctx.drawImage(im, -im.width / 2, -im.height / 2);
    ctx.restore();
  }
  ctx.restore();

  // ---- type (screen space, but everything we pass streams upward with the clouds)
  const w = (i) => W_('v01', i);
  const lift = (t0) => -Math.max(0, fallWarp(t) - fallWarp(t0)) * 520; // world-space drift of things we fall past
  // "Diese Frau": her portrait, slapped onto the frame, arrow to the plane
  if (t >= w(0) - 0.05) {
    const dy = lift(w(3));
    const k = pop(t, w(0) - 0.05, 0.9);
    print(ctx, 'plate_vesna', 300, 470 + dy, { w: 330, rot: -0.07 + (1 - k) * 0.3, border: 12, card: V.snow, seed: 4, lift: 0.8, crop: [230, 260, 1200, 1300], inner: { x: 0.5, y: 0.45, z: 1.05 + t * 0.02 }, alpha: clamp(k * 3) });
    ctx.save();
    ctx.globalAlpha *= 1 - clamp((t - w(5)) / 0.3);
    handArrow(ctx, 430, 640 + dy, px - 40, py - 180 + dy * 0.2, clamp((t - w(1)) / 0.35), { width: 9, color: V.orange, t, seed: 3, bend: -0.25, head: 40 });
    ctx.restore();
    word(ctx, t, 'Diese', 700, 380 + dy, w(0), { role: R.D, size: 92, color: V.snow, seed: 2, rot: -0.03 });
    word(ctx, t, 'Frau', 700, 540 + dy, w(1), { role: R.G, size: 170, color: V.snow, seed: 3, rot: -0.03, stroke: 0 });
  }
  // "über zehntausend Meter": the number stretches as it falls
  if (t >= w(3)) {
    const dy = lift(w(6)) * 0.8;
    word(ctx, t, 'über', SW / 2, 820 + dy, w(3), { role: R.D, size: 84, color: V.snow, seed: 5 });
    const st = 1 + clamp((t - w(4)) / 1.2) * 0.35;
    tag(ctx, t, 'ZEHNTAUSEND', SW / 2, 960 + dy, w(4), { role: R.LG, size: 190, col: V.snow, bgc: V.ink, seed: 6, rot: 0.02 });
    if (t >= w(5)) word(ctx, t, 'METER', SW / 2, 1230 + dy, w(5), { role: R.G, size: 150, color: V.orange, seed: 7, sy: st });
  }
  // "tief gestürzt": letters drop
  if (t >= w(6)) {
    word(ctx, t, 'tief', SW / 2, 1290, w(6), { role: R.D, size: 96, color: V.snow, seed: 8, alpha: 1 - clamp((t - W_('v02', 0)) / 0.2) });
    fallingWord(ctx, t, 'GESTÜRZT', SW / 2, 1425, w(7), WE('v01', 7) - 0.05, { role: R.G, size: 132, color: V.snow, stagger: 0.04 });
  }
  // "Ohne Fallschirm." — the parachute crossed out
  const o = (i) => W_('v02', i);
  if (t >= o(0)) {
    word(ctx, t, 'Ohne', SW / 2, 700, o(0), { role: R.DB, size: 120, color: V.snow, seed: 9, rot: -0.04 });
    tag(ctx, t, 'FALLSCHIRM', SW / 2, 870, o(1), { role: R.G, size: 128, col: V.ink, bgc: V.orange, seed: 10, rot: 0.03 });
    handStroke(ctx, [[150, 905], [520, 860], [940, 835]], clamp((t - o(1) - 0.22) / 0.18), { width: 14, color: V.snow, t, seed: 4 });
  }

  // altimeter: always running, bottom of the safe zone
  const alt = ALT0 * (1 - ease.inQuad(u));
  ctx.save();
  setFont(ctx, R.M5, 30);
  ctx.fillStyle = rgba(V.fog);
  ctx.textAlign = 'center';
  ctx.fillText('HÖHE', SW / 2, 1490);
  ctx.restore();
  drum(ctx, SW / 2 - 30, 1580, alt, 5, { size: 128, color: V.orange, unit: 'm' });
}
export const fallBlur = () => 3;

// =============================================================== 2 · BLACK
// Impact: snow white, then nothing. Out of the dark: her face. "überlebt."
export function black(ctx, t) {
  const t0 = CUT.black;
  const u = t - t0;
  night(ctx, V.ink, V.ink, false);
  // snow burst of the impact (cloud cut-outs as powder), gone within half a second
  if (u < 0.55) {
    const k = u / 0.55;
    ctx.save();
    ctx.globalAlpha = 1 - ease.inQuad(k);
    const [sx, sy] = shake(t, t0, 70, 0.55, 30);
    ctx.translate(sx, sy);
    plate(ctx, 'plate_snow_v', { x: 0.5, y: 0.7, z: 3.6 + k });
    for (let i = 0; i < 5; i++) {
      const im = img(['cloud_a', 'cloud_c', 'cloud_d', 'cloud_b', 'cloud_e'][i]);
      const s = lerp(0.6, 2.4, ease.outCubic(k)) * (1 + i * 0.2);
      ctx.save();
      ctx.translate(SW / 2 + (i - 2) * 220 * k, SH * 0.7 - k * 500 * (0.6 + i * 0.2));
      ctx.rotate((i - 2) * 0.3);
      ctx.scale(s, s);
      ctx.drawImage(im, -im.width / 2, -im.height / 2);
      ctx.restore();
    }
    ctx.restore();
  }
  flash(ctx, t, t0, { dur: 0.16, peak: 1 });
  // quiet snowfall in the dark
  if (u > 0.5) specks(ctx, t, { n: 70, seed: 9, vy: 55, vx: 8, size: 4, alpha: 0.5 * clamp((u - 0.5) / 0.6) });

  const w = (i) => W_('v03', i);
  // her face rises out of the black (heartbeat on "überlebt")
  const a = clamp((t - (w(0) - 0.45)) / 0.9);
  if (a > 0) {
    const beat = (tb) => (t > tb ? Math.exp(-(t - tb) * 9) * 0.035 : 0);
    const s = 0.6 + (t - w(0)) * 0.012 + beat(w(3)) + beat(w(3) + 0.42);
    ctx.save();
    ctx.globalAlpha = ease.inOutSine(a);
    sticker(ctx, 'vesna', SW / 2, 1000, { s, ax: 0.5, ay: 0.42, shadow: false, filter: `brightness(${lerp(0.4, 0.85, a).toFixed(2)})` });
    // light falls on the face only: dark gradient over the edges
    const g = ctx.createRadialGradient(SW / 2, 900, 120, SW / 2, 1000, 900);
    g.addColorStop(0, 'rgba(9,12,17,0)'); g.addColorStop(1, 'rgba(9,12,17,0.96)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SW, SH);
    ctx.restore();
  }
  word(ctx, t, 'Und sie hat', SW / 2, 380, w(0), { role: R.D, size: 96, color: V.snow, seed: 3 });
  if (t >= w(3)) {
    // "überlebt." assembles: letters punch in from depth, one per 1/32
    setFont(ctx, R.G, 196);
    const text = 'überlebt.';
    const ws = [...text].map((c) => ctx.measureText(c).width);
    let x = SW / 2 - ws.reduce((p, q) => p + q, 0) / 2;
    [...text].forEach((c, i) => {
      const k = pop(t, w(3) + i * 0.025, 1.2);
      if (k > 0) {
        ctx.save();
        ctx.translate(x + ws[i] / 2, 1640);
        ctx.scale(lerp(2.4, 1, k), lerp(2.4, 1, k));
        ctx.globalAlpha = clamp(k * 3);
        setFont(ctx, R.G, 196);
        ctx.textAlign = 'center';
        ctx.fillStyle = rgba(V.orange);
        ctx.fillText(c, 0, 0);
        ctx.restore();
      }
      x += ws[i];
    });
    ctx.letterSpacing = '0px';
  }
}
export const blackBlur = (t) => (t - CUT.black < 0.6 ? 3 : 1);

// =============================================================== 3 · FLIGHT
// The delivery photo of YU-AHT (Long Beach, 1971) is the document: highlighted registration, departure board above;
// on "von Stockholm" the plane is cut out of the photo and lifts off it.
const JS = 2200 / 1280; // plate_jat px per source px
const yuToJat = (px, py) => [(px / 2 + 37.5) * JS, (py / 2 + 53) * JS];
export function flight(ctx, t) {
  const t0 = CUT.flight;
  const u = t - t0;
  const w = (i) => W_('v04', i);
  night(ctx, [18, 23, 32], V.ink);
  ctx.save();
  camera(ctx, t, { z: 1 + u * 0.004 }, 1, 4);

  // ---- the photograph: a torn band, uniform scale; the view pans nose -> tail and settles before the lift-off
  const enter = ease.outCubic(clamp(u / 0.45));
  const BW = 1130, BH = 700, BX = SW / 2 + (1 - enter) * 300, BY = 1320 + (1 - enter) * 600, A = -0.025 + 0.15 * (1 - enter);
  const sc = 1.12 + u * 0.006;
  const panK = ease.inOutCubic(clamp((t - w(3) + 0.3) / 1.0));
  const ix = lerp(560, 1520, panK), iy = 420;
  const toScreen = (px, py) => {
    const dx = (px - ix) * sc, dy = (py - iy) * sc;
    return [BX + dx * Math.cos(A) - dy * Math.sin(A), BY + dx * Math.sin(A) + dy * Math.cos(A)];
  };
  ctx.save();
  ctx.translate(BX, BY); ctx.rotate(A);
  const pts = tornPath(BW, BH, 12, { sides: 'trbl', amp: 8 });
  const sh = tornShadow(BW, BH, 12, 'trbl', 8, 16);
  ctx.save(); ctx.globalAlpha = 0.6; ctx.drawImage(sh, -BW / 2 + 10 - sh.pad, -BH / 2 + 24 - sh.pad); ctx.restore();
  pathPts(ctx, pts, -BW / 2, -BH / 2);
  ctx.save();
  ctx.clip();
  ctx.scale(sc, sc);
  ctx.translate(-ix, -iy);
  ctx.drawImage(img('plate_jat'), 0, 0);
  // registration YU-AHT: orange marker on the white tail
  const [r0x, r0y] = yuToJat(1782, 296), [r1x, r1y] = yuToJat(1968, 344);
  marker(ctx, r0x, r0y, r1x - r0x, r1y - r0y, clamp((t - w(3)) / 0.3), { seed: 4 });
  // the hole the cut-out leaves in the print
  if (t >= w(6) - 0.02) {
    const [nx, ny] = yuToJat(0, 0);
    ctx.save();
    ctx.translate(nx, ny); ctx.scale(JS / 2, JS / 2);
    ctx.filter = 'brightness(0.12)';
    ctx.drawImage(img('yuaht'), 0, 0);
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
  // JAT logo circled (in screen space, follows the pan)
  const [lx, ly] = toScreen(...yuToJat(2106, 133));
  if (t >= w(4) && t < w(6) + 0.25) {
    ctx.save(); ctx.globalAlpha = 1 - clamp((t - w(6)) / 0.25);
    handCircle(ctx, lx, ly, 120, 80, clamp((t - w(4)) / 0.4), { width: 8, color: V.orange, t, seed: 6 });
    ctx.restore();
  }
  // lift-off: YU-AHT is cut out of the photo and climbs away (shadow on the print grows, then she leaves frame)
  if (t >= w(6) - 0.02) {
    const k = clamp((t - w(6)) / (CUT.board - w(6)));
    const [nx, ny] = toScreen(...yuToJat(YU.w / 2, YU.h / 2));
    const s0 = sc * JS / 2;
    const up = ease.outCubic(clamp(k * 2.5));
    const kl = ease.inCubic(clamp((k - 0.25) / 0.75));
    const s = s0 * lerp(1, 1.12, up);
    const x = nx + up * 10 + kl * 1600, y = ny - up * 60 - kl * 700;
    const rot = A - 0.05 * up - 0.22 * kl;
    ctx.save();
    ctx.globalAlpha = 0.5 * (1 - kl);
    ctx.filter = 'blur(12px) brightness(0)';
    yuaht(ctx, nx + 30 * up, ny + 60 * up, s0, A);
    ctx.restore();
    yuaht(ctx, x, y, s, rot);
  }
  ctx.restore();

  // ---- departure board (top)
  const fs = 96, cw = 74, gap = 8, step = cw + gap;
  const bx = SW / 2 - (11 * step - gap) / 2;
  const label = (txt, y, at) => {
    if (t < at - 0.2) return;
    setFont(ctx, R.M5, 30);
    ctx.fillStyle = rgba(V.steel);
    ctx.textAlign = 'left';
    ctx.globalAlpha = clamp((t - at + 0.2) / 0.2);
    ctx.fillText(txt, bx, y - 74);
    ctx.globalAlpha = 1;
    ctx.letterSpacing = '0px';
  };
  label('DATUM', 300, w(0));
  flap(ctx, '26', bx, 300, t, w(0), { size: fs, cellW: cw, gap, seed: 1 });
  flap(ctx, 'JAN', bx + 3 * step, 300, t, w(1), { size: fs, cellW: cw, gap, seed: 2 });
  flap(ctx, '1972', bx + 7 * step, 300, t, w(2), { size: fs, cellW: cw, gap, seed: 3, accent: [0, 1, 2, 3] });
  label('FLUG', 480, w(3));
  flap(ctx, 'JAT', bx, 480, t, w(3), { size: fs, cellW: cw, gap, seed: 4 });
  flap(ctx, '367', bx + 4 * step, 480, t, w(4), { size: fs, cellW: cw, gap, seed: 5, stagger: 0.06 });
  label('VON', 660, w(6));
  flap(ctx, 'STOCKHOLM', bx, 660, t, w(6), { size: fs, cellW: cw, gap, seed: 6, stagger: 0.025 });
  label('NACH', 840, w(8));
  flap(ctx, 'BELGRAD', bx, 840, t, w(8) - 0.05, { size: fs, cellW: cw, gap, seed: 7, stagger: 0.025, accent: [0, 1, 2, 3, 4, 5, 6] });
}
export const flightBlur = () => 2;

// ================================================================ 4 · BOARD
// YU-AHT in level flight above the clouds; the camera dives into one window — and finds her.
export function board(ctx, t) {
  const t0 = CUT.board;
  const u = t - t0;
  const w = (i) => W_('v05', i);
  const tz = w(3) - 0.1; // zoom into a window on "Stewardess"
  const tv = w(4) - 0.08; // iris opens on "Vesna"
  if (t < tv + 0.25) {
    night(ctx, [12, 16, 24], [40, 48, 60]);
    ctx.save();
    const zk = ease.inExpo(clamp((t - tz) / (tv - tz)));
    const [wx, wy] = windowAt(16);
    const S0 = 0.46;
    const px = SW / 2 + 20, py = 980 + Math.sin(u * 2.2) * 10;
    // the window's screen position at scale S0 (plane centred on its image middle)
    const sx = px + (wx - YU.w / 2) * S0, sy = py + (wy - YU.h / 2) * S0;
    const Z = lerp(1, 11, zk);
    ctx.translate(lerp(SW / 2, SW / 2, zk), lerp(SH / 2, SH / 2, zk));
    ctx.scale(Z, Z);
    ctx.translate(-lerp(SW / 2, sx, zk), -lerp(SH / 2, sy, zk));
    cloudField(ctx, u, { seed: 31, n: 7, speed: -260, dir: 'left', layer: 'back', zmin: 0.3, zmax: 1, size: 0.6, lane: 0.1 });
    yuaht(ctx, px, py, S0, Math.sin(u * 1.3) * 0.012);
    cloudField(ctx, u, { seed: 37, n: 2, speed: -420, dir: 'left', layer: 'front', zmin: 1.1, zmax: 1.6, alpha: 0.75, size: 0.7 });
    ctx.restore();
  }
  // "An Bord:" — label lettering like the fuselage title
  word(ctx, t, 'An Bord:', SW / 2, 420, w(0), { role: R.DB, size: 130, color: V.snow, seed: 4, alpha: t < tv ? 1 : 0 });
  word(ctx, t, 'die Stewardess', SW / 2, 1560, w(2), { role: R.D, size: 92, color: V.snow, seed: 5, alpha: t < tv ? 1 : 0 });

  if (t >= tv) {
    // iris: the window shape grows to the full frame, her portrait inside
    const k = ease.inOutCubic(clamp((t - tv) / 0.35));
    const rw = lerp(60, 1400, k), rh = lerp(80, 2200, k);
    ctx.save();
    ctx.beginPath(); ctx.roundRect(SW / 2 - rw / 2, SH / 2 - rh / 2, rw, rh, lerp(40, 0, k)); ctx.clip();
    night(ctx, [20, 26, 37], V.ink);
    const pz = 1 + (t - tv) * 0.03;
    ctx.globalAlpha = 0.35;
    plate(ctx, 'plate_vesna', { x: 0.5, y: 0.35, z: 1.25 * pz });
    ctx.globalAlpha = 1;
    // name behind her head, cut-out in front
    const nm = pop(t, tv + 0.05);
    setFont(ctx, R.G, 360);
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(V.snow);
    ctx.save();
    ctx.translate(SW / 2, 690);
    ctx.scale(lerp(1.4, 1, nm) * (1 + (t - tv) * 0.02), lerp(1.4, 1, nm) * (1 + (t - tv) * 0.02));
    ctx.globalAlpha = clamp(nm * 3);
    ctx.fillText('VESNA', 0, 0);
    ctx.restore();
    ctx.letterSpacing = '0px';
    sticker(ctx, 'vesna', SW / 2, SH + 230, { s: 0.66 * pz, ax: 0.5, ay: 1, lift: 0.6 });
    ctx.restore();
    if (t >= w(5)) {
      tag(ctx, t, 'Vulović', SW / 2 + 120, 850, w(5), { role: R.DB, size: 150, col: V.orange, bgc: V.ink, seed: 8, rot: -0.04 });
    }
  }
}
export const boardBlur = (t) => (t > W_('v05', 3) - 0.1 && t < W_('v05', 4) + 0.3 ? 3 : 2);

// =============================================================== 5 · ROSTER
// The duty roster as carbon copy (the document is the background). "Verwechselt": the name prints twice.
export function roster(ctx, t) {
  const t0 = CUT.roster;
  const u = t - t0;
  const w = (i) => W_('v06', i);
  // carbon-blue paper fills the frame
  night(ctx, V.carbon, [20, 30, 50]);
  ctx.save();
  camera(ctx, t, { x: SW / 2, y: lerp(820, 1040, ease.inOutSine(clamp(u / 5))), z: lerp(1.06, 1.0, clamp(u / 5)), r: -0.03 }, 1, 6);
  const ink = [214, 222, 235];
  const ty = 330;
  typed(ctx, 'JUGOSLOVENSKI AEROTRANSPORT', 110, ty, t, t0 + 0.05, { cps: 70, size: 44, color: ink, cursor: false });
  typed(ctx, 'DIENSTPLAN KABINE', 110, ty + 80, t, t0 + 0.4, { cps: 50, size: 58, color: ink, cursor: false });
  typed(ctx, '26.01.1972   JU 367   ARN-CPH-ZAG-BEG', 110, ty + 150, t, t0 + 0.7, { cps: 60, size: 36, color: ink, cursor: false });
  ctx.fillStyle = rgba(ink, 0.6);
  ctx.fillRect(110, ty + 185, 860 * ease.outCubic(clamp((u - 0.9) / 0.4)), 4);
  const rows = [['KAPITÄN', '·  ·  ·  ·'], ['1. OFFIZIER', '·  ·  ·  ·'], ['STEWARDESS', 'VESNA ·  ·  ·'], ['STEWARDESS', '·  ·  ·  ·']];
  rows.forEach(([a, b], i) => {
    const y = ty + 290 + i * 92;
    typed(ctx, a, 110, y, t, t0 + 1.0 + i * 0.25, { cps: 40, size: 40, color: [150, 165, 190], cursor: false });
    typed(ctx, b, 520, y, t, t0 + 1.1 + i * 0.25, { cps: 40, size: 40, color: ink, cursor: false });
  });
  // "VESNA" on the roster: marked on "verwechselt"
  const vy = ty + 290 + 2 * 92;
  if (t >= w(13) - 0.1) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = rgba(V.orange, 0.85);
    const k = ease.outCubic(clamp((t - w(13) + 0.1) / 0.3));
    ctx.fillRect(505, vy - 44, 200 * k, 60);
    ctx.restore();
  }
  // stamp: "FREI" (she was off that day)
  if (t >= w(8)) {
    const k = pop(t, w(8), 1.4);
    ctx.save();
    ctx.translate(800, vy - 10);
    ctx.rotate(-0.18);
    ctx.scale(lerp(2.2, 1, k), lerp(2.2, 1, k));
    ctx.globalAlpha = clamp(k * 3) * 0.92;
    ctx.strokeStyle = rgba(V.orange);
    ctx.lineWidth = 8;
    ctx.strokeRect(-130, -62, 260, 112);
    setFont(ctx, R.T, 92);
    ctx.fillStyle = rgba(V.orange);
    ctx.textAlign = 'center';
    ctx.fillText('FREI', 0, 28);
    ctx.restore();
  }
  ctx.restore();
  // the roster steps back when the two cards arrive
  if (t >= W_('v06', 14)) { ctx.fillStyle = rgba(V.ink, 0.62 * ease.outCubic(clamp((t - W_('v06', 14)) / 0.3))); ctx.fillRect(0, 0, SW, SH); }

  // ---- big type in front
  if (t < w(9)) {
    word(ctx, t, 'Eigentlich', SW / 2, 1290, w(0), { role: R.D, size: 100, color: V.snow, seed: 2, rot: -0.03 });
    if (t >= w(6)) tag(ctx, t, 'KEIN DIENST.', SW / 2, 1460, w(7), { role: R.G, size: 120, col: V.ink, bgc: V.snow, seed: 3, rot: 0.02 });
  } else if (t < w(14)) {
    word(ctx, t, 'Die Airline hat sie', SW / 2, 1270, w(9), { role: R.D, size: 84, color: V.snow, seed: 4 });
    if (t >= w(13)) {
      // misregistered double print: orange and white copies drift apart
      const k = ease.outCubic(clamp((t - w(13)) / 0.5));
      for (const [col, dx, dy] of [[V.orange, -14 - 10 * k, 10 * k], [V.snow, 8 * k, -6 * k]]) {
        word(ctx, t, 'VERWECHSELT', SW / 2 + dx, 1450 + dy, w(13), { role: R.LG, size: 230, color: col, seed: 5 });
      }
    }
  } else {
    // two cards: her, and a cut-out hole of the same shape — the other Vesna
    const k1 = pop(t, w(14), 0.9), k2 = pop(t, w(16), 0.9);
    print(ctx, 'plate_vesna', 300, 1330, { w: 380, rot: -0.06 + (1 - k1) * 0.4, border: 14, card: V.snow, seed: 21, lift: 0.7, crop: [130, 160, 1400, 1600], inner: { x: 0.5, y: 0.4, z: 1.0 }, alpha: clamp(k1 * 3) });
    if (k2 > 0) {
      ctx.save();
      ctx.translate(780, 1330);
      ctx.rotate(0.05 - (1 - k2) * 0.4);
      ctx.globalAlpha = clamp(k2 * 3);
      ctx.fillStyle = rgba(V.snow);
      ctx.fillRect(-190, -228, 380, 456);
      ctx.fillStyle = rgba(V.ink);
      ctx.fillRect(-176, -214, 352, 428);
      // her silhouette as a hole, a question mark inside
      ctx.save();
      ctx.beginPath(); ctx.rect(-176, -214, 352, 428); ctx.clip();
      ctx.filter = 'brightness(0.18)';
      sticker(ctx, 'vesna', 0, 214, { s: 0.25, ax: 0.5, ay: 1, shadow: false });
      ctx.restore();
      setFont(ctx, R.DB, 230);
      ctx.fillStyle = rgba(V.orange);
      ctx.textAlign = 'center';
      ctx.fillText('?', 0, 70);
      ctx.restore();
    }
    word(ctx, t, 'Mit einer', SW / 2, 820, w(14), { role: R.D, size: 96, color: V.snow, seed: 6 });
    word(ctx, t, 'ANDEREN', SW / 2, 990, w(16), { role: R.G, size: 150, color: V.snow, seed: 7 });
    if (t >= w(17)) tag(ctx, t, 'VESNA.', SW / 2, 1640, w(17), { role: R.G, size: 120, col: V.ink, bgc: V.orange, seed: 8, rot: -0.03 });
  }
}
