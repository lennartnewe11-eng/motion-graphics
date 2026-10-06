// Scenes 11–15: Bruno Honke, the injuries, the coma, the world record, her own words (and the loop back to the fall).
import { SW, SH, img, camera, shake, sticker, plate, handCircle, handArrow, handStroke, tornPath, tornShadow, pathPts } from '../lib/collage.js';
import { setFont, measure, pop, breathe, hand, typed } from '../lib/type.js';
import { L, W_, WE, CUT, DURATION, BEAT, E8 } from './timeline.js';
import {
  TAU, clamp, lerp, ease, noise3, rng, rgba, inR, V, R, night, cloudField, specks, YU, yuaht, PIECE_CX,
  flap, drum, word, tag, marker, flash,
} from './common.js';
import { fall } from './scenes-a.js';

// a word cracked in two along a jagged diagonal; after tc the halves shift apart
function crackWord(ctx, t, text, x, y, at, tc, { role = R.G, size = 150, color = V.snow, seed = 4, crack = V.orange } = {}) {
  if (t < at) return;
  const p = pop(t, at);
  const m = measure(ctx, text, role, size);
  const k = ease.outBack(clamp((t - tc) / 0.25));
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i <= 10; i++) pts.push([lerp(-m.w * 0.12, m.w * 0.12, i / 10) + (r() - 0.5) * size * 0.18 + (i % 2 ? 1 : -1) * size * 0.06, lerp(-m.asc - 20, m.desc + 20, i / 10)]);
  const cx = (r() - 0.5) * m.w * 0.4;
  const half = (side) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(side * 4000, -2000);
    pts.forEach(([px, py]) => ctx.lineTo(px + cx, py));
    ctx.lineTo(side * 4000, 2000);
    ctx.closePath();
    ctx.clip();
    ctx.translate(side * 16 * k, side * 10 * k);
    ctx.rotate(side * 0.025 * k);
    setFont(ctx, role, size);
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(color);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(lerp(0.3, 1, p), lerp(0.3, 1, p));
  ctx.globalAlpha *= clamp(p * 4);
  half(-1); half(1);
  if (k > 0) {
    ctx.strokeStyle = rgba(crack);
    ctx.lineWidth = 5;
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px + cx, py) : ctx.moveTo(px + cx, py)));
    ctx.globalAlpha *= clamp(k);
    ctx.stroke();
  }
  ctx.letterSpacing = '0px';
  ctx.restore();
}

// ================================================================ 11 · HONKE
// The wreck in the snowy forest; a scream travels through the trees. A villager: Bruno Honke, a wartime medic.
export function honke(ctx, t) {
  const t0 = CUT.honke;
  const u = t - t0;
  const w = (i) => W_('v12', i);
  night(ctx);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.08, ease.inOutSine(clamp(u / 4.2))) }, 1, 12);
  plate(ctx, 'plate_snow_b', { x: 0.45, y: 0.55, z: 1.0 });
  ctx.fillStyle = rgba(V.ink, 0.45);
  ctx.fillRect(-50, -50, SW + 100, SH + 100);
  // the wreck, half sunk into the snow
  const wx = 640, wy = 1240;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, SW, wy + 40); ctx.clip();
  yuaht(ctx, wx, wy, 0.42, 0.32, { piece: 2, ix: PIECE_CX[2], burn: 0.4 });
  ctx.restore();
  // the snow in front of it: the same photograph again, clipped below a drift line (the wreck sinks in)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-50, SH + 50);
  for (let x = -50; x <= SW + 50; x += 30) ctx.lineTo(x, wy + 10 + noise3(x * 0.006, 3, 1) * 40 + Math.abs(x - wx) * 0.05);
  ctx.lineTo(SW + 50, SH + 50);
  ctx.closePath();
  ctx.clip();
  plate(ctx, 'plate_snow_b', { x: 0.45, y: 0.55, z: 1.0 });
  ctx.fillStyle = rgba(V.ink, 0.45);
  ctx.fillRect(-50, -50, SW + 100, SH + 100);
  ctx.restore();
  // the scream: rings travelling out from the wreck
  if (t >= w(2)) {
    for (let i = 0; i < 6; i++) {
      const k = ((t - w(2)) * 0.9 - i * 0.18);
      if (k <= 0 || k > 1) continue;
      ctx.strokeStyle = rgba(V.orange, (1 - k) * 0.8);
      ctx.lineWidth = 5 * (1 - k) + 1;
      ctx.beginPath(); ctx.ellipse(wx, wy - 40, 60 + k * 900, 40 + k * 600, 0, 0, TAU); ctx.stroke();
    }
  }
  specks(ctx, t, { n: 70, seed: 21, vy: 70, vx: -14, size: 4, alpha: 0.55 });
  ctx.restore();

  // ---- type
  if (t < w(5)) {
    word(ctx, t, 'Ein Dorfbewohner', SW / 2, 380, w(0), { role: R.D, size: 96, color: V.snow, seed: 2 });
    word(ctx, t, 'hört sie', SW / 2, 520, w(2), { role: R.D, size: 96, color: V.snow, seed: 3 });
    if (t >= w(4)) {
      // SCHREIEN with an echo: outlines growing out of the word
      for (let i = 3; i >= 0; i--) {
        const k = clamp((t - w(4) - i * 0.06) / 0.6);
        ctx.save();
        ctx.translate(SW / 2, 720);
        const s = 1 + i * 0.12 * k;
        ctx.scale(s, s);
        setFont(ctx, R.G, 170);
        ctx.textAlign = 'center';
        if (i === 0) { ctx.fillStyle = rgba(V.snow); ctx.fillText('SCHREIEN', 0, 0); }
        else { ctx.strokeStyle = rgba(V.snow, (1 - k) * 0.6); ctx.lineWidth = 2; ctx.strokeText('SCHREIEN', 0, 0); }
        ctx.restore();
      }
      ctx.letterSpacing = '0px';
    }
  } else {
    // name on a dark card, typed
    const k = ease.outCubic(clamp((t - w(5) + 0.05) / 0.25));
    ctx.save();
    ctx.translate(SW / 2, 520);
    ctx.rotate(-0.025);
    ctx.globalAlpha = k;
    const cw = 900, ch = 250;
    const pts = tornPath(cw, ch, 91, { sides: 'trbl', amp: 6 });
    const sh = tornShadow(cw, ch, 91, 'trbl', 6, 12);
    ctx.save(); ctx.globalAlpha *= 0.6; ctx.drawImage(sh, -cw / 2 + 6 - sh.pad, -ch / 2 + 16 - sh.pad); ctx.restore();
    ctx.fillStyle = rgba(V.carbon);
    pathPts(ctx, pts, -cw / 2, -ch / 2); ctx.fill();
    setFont(ctx, R.M5, 28);
    ctx.fillStyle = rgba(V.fog);
    ctx.textAlign = 'left';
    ctx.fillText('NAME', -cw / 2 + 50, -ch / 2 + 60);
    ctx.restore();
    ctx.save();
    ctx.translate(SW / 2, 520); ctx.rotate(-0.025);
    typed(ctx, 'BRUNO HONKE', -400, 50, t, w(5), { cps: 26, size: 104, color: V.snow, cursor: true });
    ctx.restore();
    if (t >= w(7)) {
      word(ctx, t, 'Im Krieg war er', SW / 2, 1440, w(7), { role: R.D, size: 84, color: V.snow, seed: 6 });
      if (t >= w(11)) {
        tag(ctx, t, 'SANITÄTER.', SW / 2 + 40, 1600, w(11), { role: R.G, size: 120, col: V.ink, bgc: V.snow, seed: 7, rot: -0.02 });
        const kp = clamp((t - w(11) - 0.15) / 0.3);
        handStroke(ctx, [[150, 1600], [270, 1600]], kp, { width: 18, color: V.orange, t, seed: 3 });
        handStroke(ctx, [[210, 1540], [210, 1660]], clamp(kp * 2 - 0.6), { width: 18, color: V.orange, t, seed: 4 });
      }
    }
  }
}
export const honkeBlur = () => 2;

// ============================================================= 12 · INJURIES
// Her portrait as an X-ray negative. Each injury cracks — the image and the word.
export function injuries(ctx, t) {
  const t0 = CUT.injuries;
  const u = t - t0;
  const w = (i) => W_('v13', i);
  night(ctx, [8, 14, 24], V.ink, false);
  ctx.save();
  camera(ctx, t, { z: lerp(1.04, 1.0, clamp(u / 3)) }, 1, 13);
  // the negative: inverted, cold, glowing like film on a light box
  ctx.save();
  ctx.globalAlpha = ease.outCubic(clamp(u / 0.3));
  sticker(ctx, 'vesna', SW / 2 - 60, 1180, { s: 0.6, ax: 0.5, ay: 0.5, shadow: false, filter: 'invert(1) grayscale(1) contrast(1.25) brightness(0.85)' });
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgb(120,160,215)';
  ctx.fillRect(0, 0, SW, SH);
  ctx.restore();
  // fracture lines drawn on the film
  const head = [[330, 640], [420, 700], [395, 760], [480, 820], [460, 880], [540, 930]];
  handStroke(ctx, head, clamp((t - w(0)) / 0.3), { width: 7, color: V.orange, t, seed: 5, boil: 2 });
  ctx.restore();
  // a spine on the right: 9 vertebrae, three crack orange on "Drei Wirbel"
  for (let i = 0; i < 9; i++) {
    const y = 760 + i * 92;
    const k = pop(t, t0 + 0.2 + i * 0.03);
    const broken = i >= 3 && i <= 5 && t >= w(5) + (i - 3) * 0.12;
    ctx.save();
    ctx.translate(930, y);
    ctx.scale(k, k);
    ctx.fillStyle = rgba(broken ? V.orange : V.fog, broken ? 1 : 0.55);
    ctx.beginPath(); ctx.roundRect(-55, -30, 110, 60, 14); ctx.fill();
    if (broken) { ctx.strokeStyle = rgba(V.ink); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-50, -18); ctx.lineTo(-8, 6); ctx.lineTo(10, -10); ctx.lineTo(50, 14); ctx.stroke(); }
    ctx.restore();
  }
  // words
  if (t < w(1)) crackWord(ctx, t, 'SCHÄDELBRUCH.', SW / 2, 420, w(0) - 0.02, w(0) + 0.3, { role: R.G, size: 112, seed: 4 });
  else if (t < w(4)) {
    word(ctx, t, 'Beide Beine', SW / 2, 330, w(1), { role: R.D, size: 110, color: V.snow, seed: 6 });
    crackWord(ctx, t, 'GEBROCHEN.', SW / 2, 490, w(3) - 0.02, w(3) + 0.25, { role: R.G, size: 150, seed: 7 });
  } else {
    ctx.save();
    const k = pop(t, w(4), 0.9);
    ctx.translate(SW / 2 - 200, 520);
    ctx.scale(lerp(1.5, 1, k), lerp(1.5, 1, k));
    setFont(ctx, R.A, 360);
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(V.orange);
    ctx.globalAlpha = clamp(k * 3);
    ctx.fillText('3', 0, 0);
    ctx.restore();
    word(ctx, t, 'Wirbel', SW / 2 + 120, 400, w(5), { role: R.DB, size: 110, color: V.snow, seed: 8 });
    crackWord(ctx, t, 'GEBROCHEN.', SW / 2 + 60, 1700, w(6) - 0.02, w(6) + 0.25, { role: R.G, size: 130, seed: 9 });
  }
}
export const injuriesBlur = () => 1;

// ================================================================ 13 · COMA
// The hospital photograph (UPI, March 1972) behind an ECG line: flat for days, then the beat comes back.
function ecg(ctx, t, y, amp, density, { color = V.orange, from = 0, to = SW, speed = 420 } = {}) {
  ctx.save();
  ctx.strokeStyle = rgba(color);
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let x = from; x <= to; x += 4) {
    const ph = (x + t * speed) / 300;
    const f = ph - Math.floor(ph);
    let v = 0;
    if (density > 0) {
      const d = clamp(density);
      // QRS complex at f ~ 0.5, scaled by density
      v = (f > 0.44 && f < 0.47 ? -0.25 : f > 0.47 && f < 0.5 ? 1 : f > 0.5 && f < 0.53 ? -0.45 : 0) * d + Math.sin(f * TAU * 2) * 0.03 * d;
    }
    const yy = y - v * amp;
    if (x === from) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
  }
  ctx.stroke();
  ctx.restore();
}
export function coma(ctx, t) {
  const t0 = CUT.coma;
  const u = t - t0;
  const w = (i) => W_('v14', i);
  const wake = clamp((t - w(6)) / 0.5);
  night(ctx);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.1, ease.inOutSine(clamp(u / 4.2))) }, 1, 14);
  ctx.globalAlpha = lerp(0.4, 0.95, wake);
  plate(ctx, 'plate_hospital', { x: 0.3, y: 0.4, z: 1.0 });
  ctx.restore();
  ctx.fillStyle = rgba(V.ink, lerp(0.55, 0.15, wake));
  ctx.fillRect(0, 0, SW, SH);
  // the line: almost flat in the coma, the beat returns on "wacht auf"
  const dens = t < w(5) ? 0.12 : lerp(0.12, 1, clamp((t - w(5)) / 0.6));
  ecg(ctx, t, 1260, 260, dens, { speed: t < w(5) ? 160 : 520 });
  // type
  if (t < w(5)) {
    word(ctx, t, 'TAGELANG', SW / 2, 470, w(0), { role: R.LG, size: 230, color: V.snow, seed: 2, sx: 1 + clamp((t - w(0)) / 1.2) * 0.25 });
    word(ctx, t, 'im Koma.', SW / 2, 620, w(3), { role: R.DB, size: 110, color: V.snow, seed: 3 });
  } else if (t < w(9)) {
    word(ctx, t, 'Dann', SW / 2, 1490, w(5), { role: R.D, size: 100, color: V.snow, seed: 4 });
    tag(ctx, t, 'WACHT SIE AUF', SW / 2, 1640, w(6), { role: R.G, size: 112, col: V.ink, bgc: V.orange, seed: 5, rot: -0.02 });
  } else {
    word(ctx, t, 'und erinnert sich', SW / 2, 440, w(9), { role: R.D, size: 92, color: V.snow, seed: 6 });
    if (t >= w(12)) {
      // "an nichts." — erased from left to right as it is said
      const k = clamp((t - WE('v14', 13) + 0.05) / 0.7);
      ctx.save();
      setFont(ctx, R.G, 170);
      const m = ctx.measureText('an nichts.');
      ctx.beginPath(); ctx.rect(SW / 2 - m.width / 2 + m.width * ease.inOutCubic(k), 400, m.width + 100, 400); ctx.clip();
      word(ctx, t, 'an nichts.', SW / 2, 640, w(12), { role: R.G, size: 170, color: V.snow, seed: 7 });
      ctx.restore();
    }
  }
}
export const comaBlur = () => 2;

// =============================================================== 14 · RECORD
// 1972 -> 1985 on the board. The altimeter number comes back as a world record. Flashbulbs: Paul McCartney.
export function record(ctx, t) {
  const t0 = CUT.record;
  const u = t - t0;
  const w = (i) => W_('v15', i);
  night(ctx, [16, 20, 30], V.ink);
  // flashbulbs on "Paul McCartney"
  const flashes = [w(6) - 0.02, w(7) + 0.1, w(7) + 0.38];
  ctx.save();
  camera(ctx, t, { z: 1 + u * 0.01 }, 1, 15);
  // her, 1973, laughing into the cameras
  if (t >= w(4) - 0.1) {
    const k = pop(t, w(4) - 0.1, 0.8);
    sticker(ctx, 'vesna_1973', 760, SH + 40 + (1 - k) * 500, { s: 1.45, ax: 0.5, ay: 1, lift: 0.7 });
  }
  ctx.restore();
  if (t < w(4)) {
    const fs = 120, cw = 92, gap = 10;
    word(ctx, t, 'Dreizehn Jahre später:', SW / 2, 360, w(0), { role: R.D, size: 84, color: V.snow, seed: 1 });
    flap(ctx, t < w(1) + 0.1 ? '1972' : '1985', SW / 2, 560, t, t < w(1) + 0.1 ? t0 - 1 : w(1) + 0.1, { size: fs, cellW: cw, gap, align: 'center', seed: 12, accent: [0, 1, 2, 3], stagger: 0.05 });
    if (t >= w(3)) {
      word(ctx, t, 'WELTREKORD', SW / 2, 900, w(3), { role: R.LG, size: 220, color: V.snow, seed: 2 });
      drum(ctx, SW / 2 - 40, 1130, lerp(0, 10160, ease.outExpo(clamp((t - w(3)) / 0.9))), 5, { size: 150, color: V.orange, unit: 'm' });
      word(ctx, t, 'höchster Sturz ohne Fallschirm', SW / 2, 1290, w(3) + 0.3, { role: R.D, size: 58, color: V.fog, seed: 3 });
    }
  } else {
    word(ctx, t, 'Überreicht von', 330, 420, w(4), { role: R.D, size: 80, color: V.snow, seed: 4, rot: -0.04 });
    if (t >= w(6)) {
      tag(ctx, t, 'PAUL', 280, 600, w(6), { role: R.G, size: 150, col: V.ink, bgc: V.snow, seed: 5, rot: -0.04 });
      if (t >= w(7)) tag(ctx, t, 'McCARTNEY', 470, 790, w(7), { role: R.G, size: 120, col: V.ink, bgc: V.orange, seed: 6, rot: 0.02 });
    }
  }
  for (const f of flashes) flash(ctx, t, f, { dur: 0.2, peak: 0.75 });
}
export const recordBlur = () => 2;

// ================================================================ 15 · QUOTE
// Her own words over the 1973 interview photograph. "Glück" — then struck out. Hard cut back into the fall (loop).
export function quote(ctx, t) {
  const t0 = CUT.quote;
  const u = t - t0;
  const w = (i) => W_('v16', i);
  const loopCut = DURATION - 0.5;
  if (t >= loopCut) { fall(ctx, t - DURATION); return; }
  night(ctx);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.12, ease.inOutSine(clamp(u / 7))) }, 1, 16);
  ctx.globalAlpha = 0.55;
  plate(ctx, 'plate_reporter', { x: 0.24, y: 0.45, z: 1.0 });
  ctx.restore();
  const g = ctx.createLinearGradient(0, 0, 0, SH);
  g.addColorStop(0, 'rgba(9,12,17,0.85)'); g.addColorStop(0.5, 'rgba(9,12,17,0.35)'); g.addColorStop(1, 'rgba(9,12,17,0.9)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);

  word(ctx, t, 'Sie selbst sagte:', SW / 2, 300, w(0), { role: R.M5, size: 40, color: V.fog, seed: 1 });
  // opening quote mark
  if (t >= w(3) - 0.1) {
    const k = pop(t, w(3) - 0.1);
    setFont(ctx, R.DB, 300);
    ctx.fillStyle = rgba(V.orange, clamp(k * 3));
    ctx.textAlign = 'left';
    ctx.fillText('„', 70, 560);
    ctx.letterSpacing = '0px';
  }
  // line 1: Alle glauben, ich hatte GLÜCK.
  word(ctx, t, 'Alle glauben,', SW / 2, 520, w(3), { role: R.D, size: 100, color: V.snow, seed: 2 });
  word(ctx, t, 'ich hatte', SW / 2, 650, w(5), { role: R.D, size: 100, color: V.snow, seed: 3 });
  if (t >= w(7)) {
    word(ctx, t, 'GLÜCK.', SW / 2, 860, w(7), { role: R.G, size: 230, color: V.orange, seed: 4 });
    // struck out on "Hätte ich Glück gehabt"
    const ks = clamp((t - w(10)) / 0.3);
    handStroke(ctx, [[180, 800], [520, 790], [900, 770]], ks, { width: 16, color: V.snow, t, seed: 6 });
  }
  // line 2
  word(ctx, t, 'Hätte ich Glück gehabt,', SW / 2, 1120, w(8), { role: R.D, size: 86, color: V.snow, seed: 5 });
  word(ctx, t, 'wäre mir das', SW / 2, 1260, w(12), { role: R.D, size: 86, color: V.snow, seed: 6 });
  if (t >= w(15)) tag(ctx, t, 'NIE PASSIERT.', SW / 2, 1460, w(15), { role: R.G, size: 128, col: V.ink, bgc: V.snow, seed: 7, rot: -0.02 });
  if (t >= WE('v16', 16) + 0.2) {
    setFont(ctx, R.M5, 30);
    ctx.fillStyle = rgba(V.fog, clamp((t - WE('v16', 16) - 0.2) / 0.3));
    ctx.textAlign = 'center';
    ctx.fillText('VESNA VULOVIĆ  1950 – 2016', SW / 2, 1640);
    ctx.letterSpacing = '0px';
  }
}
export const quoteBlur = (t) => (t >= DURATION - 0.5 ? 3 : 2);
