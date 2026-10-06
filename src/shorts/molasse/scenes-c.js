// Scenes 11–18: what really killed them, the children, the leak, the brown paint, the harbour, the smell.
import { SW, SH, P, img, bg, camera, shake, sticker, print, plate, handCircle, handArrow, handStroke, highlight, onTwos, tearWipe } from '../lib/collage.js';
import { liquidBegin, liquidEnd, drip, blob, strand, dripsAlong, surface, fillBelow } from '../lib/liquid.js';
import { row, letters, setFont, measure, pop, breathe, typed, hand } from '../lib/type.js';
import { L, W_, CUT, BEAT, E8, E16, DURATION } from './timeline.js';
import { TAU, clamp, lerp, ease, noise3, rng, rgba, street, runner, strip, stripRow, stripWord, odometer } from './common.js';

// ============================================================ 11 · DEADLY
// The real aftermath (firemen in the syrup under the El), split into two depth layers that drift
// apart in parallax; the music falls away; TÖDLICHE assembles letter by letter, slowly.
function deadly(ctx, t) {
  const w = (i) => W_('m10', i);
  const u = t - CUT.deadly;
  const k = ease.inOutSine(clamp(u / 2.4));
  // photo plate mapping (plate_fire is 2709 x 1684; fire_fg was cut at 280,1090 with 2x upsampling)
  const z = lerp(1.0, 1.1, k);
  const pm = plate(ctx, 'plate_fire', { x: lerp(0.42, 0.5, k), y: 0.55, z, dx: lerp(-10, 10, k) });
  // foreground figures: same mapping, plus extra parallax shift and scale (they are nearer)
  const fs = 1 + 0.06 * k;
  const [fx, fy] = pm.map(280, 1090);
  ctx.save();
  ctx.translate(fx + lerp(0, -46, k), fy + lerp(0, 14, k));
  ctx.scale(pm.sc * 0.5 * fs, pm.sc * 0.5 * fs);
  ctx.drawImage(img('fire_fg'), 0, 0);
  ctx.restore();
  // darken towards the words (the scene turns heavy)
  const g = ctx.createLinearGradient(0, 0, 0, SH);
  g.addColorStop(0, 'rgba(18,14,10,0.0)'); g.addColorStop(0.5, 'rgba(18,14,10,0.35)'); g.addColorStop(1, 'rgba(18,14,10,0.1)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  stripRow(ctx, t, [['Doch', 'D', 84, w(0)], ['das', 'D', 84, w(1)]], SW / 2, 560, { seed: 61 });
  if (t >= w(2)) {
    strip(ctx, SW / 2, 760, 880, 210, { seed: 62, rot: -0.01 });
    letters(ctx, 'TÖDLICHE', SW / 2, 820, 'G', 170, (i) => {
      const ti = w(2) + i * 0.06;
      return t < ti ? null : { dy: (1 - ease.outCubic(clamp((t - ti) / 0.25))) * -30, alpha: clamp((t - ti) / 0.08) };
    }, { align: 'center' });
  }
  stripRow(ctx, t, [['kommt', 'D', 84, w(3)], ['erst', 'D', 84, w(4)], ['danach.', 'G', 110, w(5)]], SW / 2, 980, { seed: 63 });
}

// ============================================================== 12 · COLD
// January: the thermometer falls, the syrup cools — and the animation itself slows down to a stop.
function thermometer(ctx, x, y, h, temp) {
  const r = 46, tw = 34;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = rgba(P.card);
  ctx.strokeStyle = rgba(P.ink); ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect(-tw / 2, -h, tw, h, tw / 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, r * 0.6, r, 0, TAU); ctx.fill(); ctx.stroke();
  // scale −10..40 °C
  const yOf = (c) => -((c + 10) / 50) * (h - 30) - 10;
  setFont(ctx, 'G8', 30); ctx.fillStyle = rgba(P.ink); ctx.textAlign = 'right'; ctx.letterSpacing = '0px';
  for (let c = -10; c <= 40; c += 5) {
    ctx.lineWidth = c % 10 ? 2 : 4;
    ctx.beginPath(); ctx.moveTo(tw / 2 + 4, yOf(c)); ctx.lineTo(tw / 2 + (c % 10 ? 16 : 28), yOf(c)); ctx.stroke();
    if (c % 10 === 0) ctx.fillText(`${c}°`, -tw / 2 - 12, yOf(c) + 10);
  }
  ctx.fillStyle = 'rgb(30,26,22)';
  ctx.beginPath(); ctx.arc(0, r * 0.6, r * 0.72, 0, TAU); ctx.fill();
  ctx.fillRect(-tw * 0.22, yOf(temp), tw * 0.44, -yOf(temp) + r * 0.3);
  ctx.restore();
}
function cold(ctx, t) {
  const w = (i) => W_('m11', i);
  const u = t - CUT.cold;
  bg(ctx);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.04, u / 3.7) }, lerp(1, 0.2, clamp(u / 3.5)), 23);
  // the syrup's own "clock": time inside the liquid slows as it cools (viscosity up)
  const visc = ease.inOutCubic(clamp((t - w(5)) / (w(12) + 0.4 - w(5))));
  const lt = CUT.cold + (u < (w(5) - CUT.cold) ? u : (w(5) - CUT.cold) + (u - (w(5) - CUT.cold)) * lerp(1, 0.05, visc) * (1 - visc * 0.5));
  // temperature: the molasses came warm out of the tank, the air was about 5 °C
  const temp = lerp(30, 4, ease.inOutCubic(clamp((t - w(5)) / 1.1)));
  thermometer(ctx, 170, 1180, 640, temp);
  if (t > w(6)) hand(ctx, '≈ 5 °C', 300, 1080, t, w(6) + 0.1, { size: 60, rot: -0.05, align: 'left' });
  // a stick pulled out of the cooling syrup: the strand gets thicker and refuses to break
  const pool = 1520;
  const m = liquidBegin(ctx);
  fillBelow(m, surface(-40, SW + 40, pool, lt, { amp: lerp(22, 4, visc), seed: 6, speed: 0.9, freq: 0.005 }));
  const lift = ease.inOutSine(clamp((t - w(7)) / 1.6)) * 330;
  const sx = 760, sy = pool - 40 - lift;
  strand(m, sx, sy + 40, sx + 10, pool + 10, lerp(26, 90, visc), lerp(40, 150, visc), 0.0);
  drip(m, sx, sy + 30, lerp(30, 70, visc), lerp(30, 54, visc));
  liquidEnd(ctx, { depth: 9, top: pool - 380, bottom: SH, t: lt });
  // the stick (wood, cut-out)
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(0.12);
  ctx.fillStyle = 'rgb(170,140,100)'; ctx.strokeStyle = rgba(P.ink); ctx.lineWidth = 3;
  ctx.fillRect(-14, -520, 28, 560); ctx.strokeRect(-14, -520, 28, 560);
  ctx.restore();
  ctx.restore();
  stripRow(ctx, t, [['Es', 'D', 76, w(0)], ['ist', 'D', 76, w(1)], ['Januar.', 'G', 120, w(2)]], SW / 2, 260, { seed: 71 });
  stripRow(ctx, t, [['Die', 'D', 64, w(3)], ['Melasse', 'G', 88, w(4)], ['kühlt', 'G', 88, w(5)], ['ab', 'D', 64, w(6)]], SW / 2, 400, { seed: 72 });
  stripRow(ctx, t, [['und', 'D', 64, w(7)], ['wird', 'D', 64, w(8)], ['mit', 'D', 64, w(9)], ['jeder', 'D', 64, w(10)]], SW / 2, 525, { seed: 73 });
  stripRow(ctx, t, [['Minute', 'G', 100, w(11)]], SW / 2, 655, { seed: 74 });
  // ZÄHER — in syrup, its drips nearly frozen in place
  if (t >= w(12)) {
    const k = pop(t, w(12), 0.5);
    const mm = liquidBegin(ctx);
    mm.save(); mm.translate(SW / 2 + 120, 900); mm.scale(lerp(1.3, 1, k), lerp(1.3, 1, k));
    setFont(mm, 'G', 200); mm.textAlign = 'center'; mm.fillText('ZÄHER.', 0, 0); mm.letterSpacing = '0px';
    mm.restore();
    [-260, -60, 140, 300].forEach((x, i) => drip(mm, SW / 2 + 120 + x, 892, 40 + i * 12 + (t - w(12)) * 6, 34));
    liquidEnd(ctx, { depth: 9, top: 750, bottom: 930, t });
  }
}

// ============================================================= 13 · STUCK
function stuck(ctx, t) {
  const w = (i) => W_('m12', i);
  const u = t - CUT.stuck;
  bg(ctx);
  ctx.save();
  camera(ctx, t, { y: SH / 2 + 40, z: lerp(1.08, 1.0, ease.outCubic(clamp(u / 2.2))) }, 0.6, 25);
  const level = lerp(1260, 1180, ease.inOutSine(clamp(u / 2.3)));
  // he tries — jerks on twos — but goes nowhere
  const tryT = onTwos(t, 8);
  const jerk = noise3(tryT * 2.3, 1, 3);
  sticker(ctx, 'p_man_bowler', SW / 2 + jerk * 8, level + 300 - Math.max(0, jerk) * 10, { s: 0.7, rot: jerk * 0.06, lift: 0.35 });
  // the syrup holding him, with strands clinging to the coat
  const m = liquidBegin(ctx);
  fillBelow(m, surface(-40, SW + 40, level, t * 0.3, { amp: 8, seed: 11, speed: 0.4, freq: 0.006 }));
  for (let i = 0; i < 4; i++) strand(m, SW / 2 - 110 + i * 70, level - 30 - Math.abs(jerk) * 40 - i * 6, SW / 2 - 120 + i * 75, level + 10, 10, 26, 0.05);
  liquidEnd(ctx, { depth: 9, top: level - 60, bottom: SH, t });
  ctx.restore();
  stripRow(ctx, t, [['Wer', 'D', 84, w(0)]], SW / 2, 250, { seed: 81 });
  // "feststeckt": letters half sunk in the syrup line
  if (t >= w(1)) {
    const k = pop(t, w(1));
    letters(ctx, 'feststeckt,', SW / 2, 440, 'G', 150, (i) => ({ dy: Math.sin(i * 1.7) * 6, sx: lerp(1.3, 1, k), sy: lerp(1.3, 1, k) }), { align: 'center' });
    const mm = liquidBegin(ctx);
    fillBelow(mm, surface(SW / 2 - 420, SW / 2 + 420, 420, t * 0.4, { amp: 4, seed: 12, freq: 0.01 }), 462);
    dripsAlong(mm, [[300, 462], [520, 462], [760, 462]], t, w(1), { n: 3, maxL: 60, w: 18, seed: 13, speed: 0.4 });
    liquidEnd(ctx, { depth: 6, top: 410, bottom: 470, t });
  }
  stripRow(ctx, t, [['kommt', 'D', 80, w(2)], ['nicht', 'G', 110, w(3)], ['mehr', 'D', 80, w(4)]], SW / 2, 610, { seed: 82 });
  // "frei" jumps up — and the strings pull it back down
  if (t >= w(5)) {
    const a = t - w(5);
    const up = Math.sin(clamp(a / 0.5) * Math.PI) * 80 * Math.exp(-a * 1.2) * (a < 0.5 ? 1 : 0.35);
    const yb = 800 - up;
    stripWord(ctx, t, 'frei.', 'DB', 130, SW / 2, yb, w(5), { seed: 83 });
    const mm = liquidBegin(ctx);
    for (let i = 0; i < 3; i++) strand(mm, SW / 2 - 70 + i * 70, yb + 70, SW / 2 - 60 + i * 60, 920, 8, 18, 0.02);
    fillBelow(mm, surface(SW / 2 - 300, SW / 2 + 300, 920, t, { amp: 6, seed: 14 }), 960);
    liquidEnd(ctx, { depth: 6, top: 900, bottom: 970, t, shadow: false });
  }
}

// ============================================================== 14 · KIDS
// Two of the dead were ten years old (Maria Di Stasio, Pasquale Iantosca — they had been gathering
// firewood). Shown as paper silhouettes cut from Hine's Boston children, then as empty cut-outs.
function kids(ctx, t) {
  const w = (i) => W_('m13', i);
  const u = t - CUT.kids;
  bg(ctx);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.05, u / 3.7) }, 0.4, 27);
  const gone = ease.inOutCubic(clamp((t - w(8) - 0.25) / 0.7));
  const kidsD = [['p_girl_wood', SW / 2 - 150, w(3)], ['p_boy_wood', SW / 2 + 150, w(4)]];
  for (const [k, x, at] of kidsD) {
    if (t < at) continue;
    const p = ease.outCubic(clamp((t - at) / 0.4));
    // ink silhouette, fading into an empty white paper cut-out (absence)
    sticker(ctx, k, x, 1360 + (1 - p) * 40, { s: 0.62, lift: lerp(0.15, 0.6, gone), alpha: p, filter: `brightness(0) invert(${gone})` });
  }
  // "10" above each, in pencil
  if (t >= w(6)) {
    hand(ctx, '10', SW / 2 - 150, 700, t, w(6), { size: 110, rot: -0.05 });
    hand(ctx, '10', SW / 2 + 150, 700, t, w(6) + 0.1, { size: 110, rot: 0.04 });
  }
  ctx.restore();
  row(ctx, t, [{ text: 'Unter', role: 'D', size: 80, at: w(0) }, { text: 'den', role: 'D', size: 80, at: w(1) }, { text: 'Toten:', role: 'G', size: 104, at: w(2) }], SW / 2, 300, { seed: 9, breathe: 0.4 });
  row(ctx, t, [{ text: 'zwei', role: 'D', size: 92, at: w(3) }, { text: 'Kinder.', role: 'G', size: 120, at: w(4) }], SW / 2, 450, { seed: 10, breathe: 0.4 });
  row(ctx, t, [{ text: 'Beide', role: 'D', size: 80, at: w(5) }, { text: 'zehn', role: 'G', size: 104, at: w(6) }, { text: 'Jahre', role: 'D', size: 80, at: w(7) }, { text: 'alt.', role: 'D', size: 80, at: w(8) }], SW / 2, 1560, { seed: 11, breathe: 0.4 });
}

// =============================================================== 15 · LEAK
// The real tank photo: syrup runs down its plates; marker circles find the leaks; 1915 is stamped.
const TANK_PH = { x0: 222, x1: 400, y0: 98, y1: 150 }; // tank body inside plate_tank (417 x 327)
function tankPrint(ctx, t, u, after) {
  return print(ctx, 'plate_tank', SW / 2, 900, {
    w: 1000, rot: -0.02, border: 20, seed: 91, lift: 0.3,
    crop: [150, 40, 267, 230], inner: { x: 0.55, y: 0.45, z: lerp(1.0, 1.12, clamp(u / 5)) }, after,
  });
}
function leakDrips(c, m, t, t0, n = 7) {
  const r = rng(19);
  const out = [];
  for (let i = 0; i < n; i++) {
    const px = lerp(TANK_PH.x0 + 10, TANK_PH.x1 - 10, r()), py = lerp(TANK_PH.y0 + 6, TANK_PH.y0 + 20, r());
    const x = m.x + (px - m.cx) * m.sx, y = m.y + (py - m.cy) * m.sy;
    const L = clamp((t - t0 - r() * 0.8) / 1.4) * (80 + r() * 200);
    out.push([x, y, L, 18 + r() * 10]);
  }
  return out;
}
function leak(ctx, t) {
  const w = (i) => W_('m14', i);
  const u = t - CUT.leak;
  bg(ctx);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.05, u / 2.5) }, 1, 29);
  tankPrint(ctx, t, u, (c, m) => {
    const pts = leakDrips(c, m, t, w(2));
    const lm = liquidBegin(c);
    for (const [x, y, L, ww] of pts) drip(lm, x, y, L, ww);
    liquidEnd(c, { depth: 4, top: 400, bottom: 1300, t, shadow: false });
    // marker circles around three leaks on "geleckt"
    if (t >= w(8) - 0.05) pts.slice(0, 3).forEach(([x, y, L], i) => handCircle(c, x, y + L * 0.5, 46, 36 + L * 0.55, clamp((t - w(8) + 0.05 - i * 0.12) / 0.3), { width: 6, t, seed: 5 + i }));
  });
  // 1915 stamp on "von Anfang an"
  if (t >= w(5)) {
    const k = pop(t, w(5) + 0.1, 1.4);
    ctx.save(); ctx.translate(820, 560); ctx.rotate(-0.12); ctx.scale(lerp(1.8, 1, k), lerp(1.8, 1, k));
    ctx.globalAlpha = clamp(k * 3) * 0.85;
    ctx.strokeStyle = rgba(P.ink); ctx.lineWidth = 7; ctx.strokeRect(-150, -62, 300, 124);
    setFont(ctx, 'T', 84); ctx.fillStyle = rgba(P.ink); ctx.textAlign = 'center'; ctx.fillText('1915', 0, 30); ctx.letterSpacing = '0px';
    ctx.restore();
    hand(ctx, 'gebaut', 820, 470, t, w(5) + 0.25, { size: 48, rot: -0.1 });
  }
  ctx.restore();
  row(ctx, t, [{ text: 'Und', role: 'D', size: 80, at: w(0) }, { text: 'der', role: 'D', size: 80, at: w(1) }, { text: 'Tank?', role: 'G', size: 130, at: w(2) }], SW / 2, 300, { seed: 12 });
  row(ctx, t, [{ text: 'Der', role: 'D', size: 76, at: w(3) }, { text: 'hatte', role: 'D', size: 76, at: w(4) }, { text: 'von', role: 'D', size: 76, at: w(5) }, { text: 'Anfang', role: 'G', size: 104, at: w(6) }, { text: 'an', role: 'D', size: 76, at: w(7) }], SW / 2, 1440, { seed: 13 });
  if (t >= w(8)) {
    const k = pop(t, w(8));
    const g = letters(ctx, 'geleckt.', SW / 2, 1620, 'G', 150, () => ({ sx: lerp(1.3, 1, k), sy: lerp(1.3, 1, k) }), { align: 'center' });
    const mm = liquidBegin(ctx);
    g.list.forEach((gl, i) => { if (i % 2 === 0) drip(mm, g.x + gl.x + gl.w / 2, 1612, clamp((t - w(8) - i * 0.04) / 0.8) * (40 + i * 9), 16); });
    liquidEnd(ctx, { depth: 5, top: 1600, bottom: 1700, t, shadow: false });
  }
}

// ============================================================== 16 · PAINT
// The company's fix: paint it brown. One big brush stroke covers leaks, circles and all.
function paint(ctx, t) {
  const w = (i) => W_('m15', i);
  const u = t - CUT.paint;
  bg(ctx);
  ctx.save();
  camera(ctx, t, { z: lerp(1.05, 1.1, u / 2.8) }, 1, 31);
  const uLeak = t - CUT.leak;
  tankPrint(ctx, t, uLeak, (c, m) => {
    const pts = leakDrips(c, m, t, W_('m14', 2));
    const lm = liquidBegin(c);
    for (const [x, y, L, ww] of pts) drip(lm, x, y, L, ww);
    liquidEnd(c, { depth: 4, top: 400, bottom: 1300, t, shadow: false });
    pts.slice(0, 3).forEach(([x, y, L], i) => handCircle(c, x, y + L * 0.5, 46, 36 + L * 0.55, 1, { width: 6, t, seed: 5 + i }));
  });
  // brush strokes: three passes, on "braun", "an-", "-streichen"
  const strokes = [[w(5) - 0.05, 820], [w(6), 925], [w(6) + 0.35, 1030]];
  const pm = liquidBegin(ctx);
  pm.lineCap = 'round'; pm.lineJoin = 'round';
  strokes.forEach(([ts, y], i) => {
    const p = ease.inOutCubic(clamp((t - ts) / 0.32));
    if (p <= 0) return;
    const dir = i % 2 ? -1 : 1;
    const x0 = dir > 0 ? -20 : SW + 20, x1 = dir > 0 ? SW + 20 : -20;
    const tilt = (i - 1) * 0.05;
    // bristles: uneven lengths, a dry-brush tail, the stroke thins where the paint runs out
    for (let b = 0; b < 30; b++) {
      const r1 = noise3(b * 0.7, i, 2), r2 = noise3(b * 0.9, i, 5);
      const len = p * (0.86 + 0.14 * r1);
      const xe = lerp(x0, x1, len);
      const yy = y + (b - 15) * 6 + r2 * 3;
      pm.lineWidth = 11 + ((b * 7) % 5) * 2;
      pm.beginPath();
      const n = 10;
      for (let k = 0; k <= n; k++) {
        const u = k / n;
        const x = lerp(x0, xe, u), yv = yy + (x - SW / 2) * tilt + Math.sin(u * 3 + i) * 10;
        // dry gaps in the last third
        if (u > 0.7 && noise3(b * 1.3, k, i + 9) > 0.35) { pm.moveTo(x, yv); continue; }
        k ? pm.lineTo(x, yv) : pm.moveTo(x, yv);
      }
      pm.stroke();
    }
  });
  liquidEnd(ctx, { depth: 3, gloss: 0.35, top: 400, bottom: 1000, t, warm: 0.6 });
  ctx.restore();
  // Die Firma — rubber stamp of the owner
  row(ctx, t, [{ text: 'Die', role: 'D', size: 80, at: w(0) }, { text: 'Firma', role: 'G', size: 120, at: w(1) }], SW / 2, 290, { seed: 14 });
  if (t >= w(1) + 0.1) {
    const k = pop(t, w(1) + 0.1, 1.4);
    ctx.save(); ctx.translate(SW / 2 + 30, 1210); ctx.rotate(0.05); ctx.scale(lerp(1.7, 1, k), lerp(1.7, 1, k));
    ctx.globalAlpha = clamp(k * 3) * 0.82;
    ctx.strokeStyle = rgba(P.ink); ctx.lineWidth = 6; ctx.strokeRect(-330, -58, 660, 116);
    ctx.font = '400 74px "League Gothic"'; ctx.letterSpacing = '6px'; ctx.fillStyle = rgba(P.ink); ctx.textAlign = 'center';
    ctx.fillText('PURITY DISTILLING CO.', 0, 26); ctx.letterSpacing = '0px';
    ctx.restore();
  }
  row(ctx, t, [{ text: 'ließ', role: 'D', size: 80, at: w(2) }, { text: 'ihn', role: 'D', size: 80, at: w(3) }, { text: 'einfach', role: 'G', size: 110, at: w(4) }], SW / 2, 1420, { seed: 15 });
  // BRAUN painted on with the brush (stroke reveal left -> right)
  if (t >= w(5)) {
    const p = ease.outCubic(clamp((t - w(5)) / 0.35));
    const mm = liquidBegin(ctx);
    mm.save(); mm.beginPath(); mm.rect(0, 1440, 140 + p * 900, 260); mm.clip();
    setFont(mm, 'G', 190); mm.textAlign = 'center'; mm.fillText('BRAUN', SW / 2, 1640); mm.letterSpacing = '0px';
    mm.restore();
    liquidEnd(ctx, { depth: 4, gloss: 0.4, top: 1480, bottom: 1660, t, warm: 0.6 });
  }
  row(ctx, t, [{ text: 'anstreichen.', role: 'D', size: 84, at: w(6) }], SW / 2, 1760, { seed: 16 });
  hand(ctx, 'echt jetzt?', 820, 1150 - 120, t, w(6) + 0.55, { size: 70, rot: 0.08 });
}

// ============================================================= 17 · HARBOR
// The harbour turns brown (tint spreading through the water) while the calendar runs to summer.
const MONTHS = ['JANUAR', 'FEBRUAR', 'MÄRZ', 'APRIL', 'MAI', 'JUNI'];
function harbor(ctx, t) {
  const w = (i) => W_('m16', i);
  const u = t - CUT.harbor;
  const pm = plate(ctx, 'plate_rowes', { x: lerp(0.62, 0.7, u / 2.4), y: 0.62, z: lerp(1.05, 1.12, u / 2.4) });
  // water region of the photo (Rowe's Wharf, Boston, c. 1904)
  const water = [[1650, 1040], [2340, 1040], [2340, 1833], [560, 1833], [700, 1700], [780, 1630], [1150, 1520], [1560, 1360], [1640, 1290]];
  const spread = ease.inOutCubic(clamp((t - w(1)) / (w(6) - w(1) + 0.3)));
  ctx.save();
  ctx.beginPath();
  water.forEach(([x, y], i) => { const [sx, sy] = pm.map(x, y); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
  ctx.closePath();
  ctx.clip();
  // the tint rises from the near water to the horizon
  const yTop = lerp(SH + 100, pm.map(0, 1000)[1], spread);
  const g = ctx.createLinearGradient(0, yTop - 160, 0, yTop + 40);
  g.addColorStop(0, 'rgba(120,58,16,0)'); g.addColorStop(1, 'rgba(120,58,16,0.78)');
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = g;
  ctx.fillRect(0, yTop - 160, SW, 200);
  ctx.fillStyle = 'rgba(120,58,16,0.78)';
  ctx.fillRect(0, yTop + 40, SW, SH);
  ctx.restore();
  // tear-off calendar running to June on 16ths
  const mi = clamp(Math.floor((t - w(3)) / (E16 * 0.8)), 0, 5);
  const flipP = ((t - w(3)) / (E16 * 0.8)) % 1;
  if (t >= w(1)) {
    const k = pop(t, w(1));
    ctx.save(); ctx.translate(SW / 2, 820); ctx.rotate(0.04); ctx.scale(lerp(0.5, 1, k), lerp(0.5, 1, k));
    ctx.fillStyle = 'rgba(30,22,14,0.25)'; ctx.fillRect(-196, -150 + 14, 400, 330);
    ctx.fillStyle = rgba(P.card); ctx.fillRect(-200, -150, 400, 330);
    ctx.fillStyle = rgba(P.ink); ctx.fillRect(-200, -150, 400, 70);
    setFont(ctx, 'T', 40); ctx.fillStyle = rgba(P.card); ctx.textAlign = 'center'; ctx.fillText('1919', 0, -100);
    setFont(ctx, 'G', mi === 1 ? 74 : 90); ctx.fillStyle = rgba(P.ink); ctx.fillText(MONTHS[t >= w(3) ? mi : 0], 0, 60);
    ctx.letterSpacing = '0px';
    // the page being torn off
    if (t >= w(3) && mi < 5 && flipP < 0.6) {
      const a = flipP / 0.6;
      ctx.save(); ctx.translate(0, -80); ctx.rotate(-a * 0.9); ctx.translate(a * 160, -a * 140);
      ctx.globalAlpha = 1 - a;
      ctx.fillStyle = rgba(P.card); ctx.fillRect(-200, 0, 400, 260);
      setFont(ctx, 'G', 74); ctx.fillStyle = rgba(P.ink); ctx.fillText(MONTHS[mi], 0, 140); ctx.letterSpacing = '0px';
      ctx.restore();
    }
    ctx.restore();
  }
  stripRow(ctx, t, [['Der', 'D', 80, w(0)], ['Hafen', 'G', 120, w(1)], ['blieb', 'D', 80, w(2)]], SW / 2, 330, { seed: 91 });
  stripRow(ctx, t, [['bis', 'D', 80, w(3)], ['zum', 'D', 80, w(4)], ['Sommer', 'G', 120, w(5)]], SW / 2, 480, { seed: 92 });
  stripRow(ctx, t, [['braun.', 'DB', 130, w(6)]], SW / 2, 1240, { seed: 93 });
}

// ============================================================== 18 · SMELL
// Decades later, on hot days: heat shimmer over the same street, smell lines rising from the
// cobblestones … then one word, in syrup. The last frame hands over to the first (loop).
let SHIM = null;
function smell(ctx, t) {
  const w = (i) => W_('m17', i);
  const u = t - CUT.smell;
  const yrs = t < w(2) ? 1919 : 1919 + Math.round(ease.inOutCubic(clamp((t - w(2)) / 0.75)) * 40);
  if (t < w(4) - 0.06) {
    // years running on: 1919 -> 1959, a split-flap display flipping every 16th
    bg(ctx);
    ctx.save();
    camera(ctx, t, { z: lerp(1.0, 1.05, u / 1.3) }, 1, 33);
    const steps = [1919, 1929, 1939, 1949, 1959];
    const si = t < w(2) ? 0 : clamp(Math.floor((t - w(2)) / E8) + 1, 0, 4);
    const fp = t < w(2) ? 1 : clamp(((t - w(2)) % E8) / (E8 * 0.6));
    ctx.translate(SW / 2, 900);
    ctx.fillStyle = rgba(P.ink); ctx.fillRect(-330, -170, 660, 340);
    setFont(ctx, 'A', 250); ctx.textAlign = 'center'; ctx.fillStyle = rgba(P.card);
    ctx.save(); ctx.scale(1, si > 0 && si <= 4 && fp < 1 ? Math.max(0.05, Math.abs(Math.cos(fp * Math.PI))) : 1);
    ctx.fillText(String(fp < 0.5 && si > 0 ? steps[si - 1] : steps[si]), 0, 92);
    ctx.restore();
    ctx.fillStyle = rgba(P.paper2); ctx.fillRect(-330, -3, 660, 6);
    ctx.letterSpacing = '0px';
    ctx.restore();
    row(ctx, t, [{ text: 'Und', role: 'D', size: 80, at: w(0) }, { text: 'noch', role: 'D', size: 80, at: w(1) }], SW / 2, 640, { seed: 17 });
    row(ctx, t, [{ text: 'Jahrzehnte', role: 'G', size: 120, at: w(2) }, { text: 'später', role: 'D', size: 92, at: w(3) }], SW / 2, 1180, { seed: 18 });
    return;
  }
  // the street in summer heat: horizontal slices of the photo wobble (heat shimmer over the stones)
  const ts = t - w(4);
  ctx.save();
  camera(ctx, t, { z: lerp(1.08, 1.16, clamp(ts / 4)) }, 0.6, 35);
  // draw the street once into a buffer, then shift horizontal slices of it (cheap shimmer)
  if (!SHIM) { SHIM = document.createElement('canvas'); SHIM.width = SW + 120; SHIM.height = SH + 80; }
  const sc = SHIM.getContext('2d');
  sc.setTransform(1, 0, 0, 1, 60, 40);
  street(sc, t, { x: 0.5 });
  const sliceH = 32;
  for (let y = -40; y < SH + 40; y += sliceH) {
    const off = noise3(y * 0.012, t * 1.6, 7) * (y > 1000 ? 7 : 2.5);
    ctx.drawImage(SHIM, 0, y + 40, SW + 120, sliceH + 1, -60 + off, y, SW + 120, sliceH + 1);
  }
  ctx.fillStyle = 'rgba(255,248,230,0.18)'; ctx.fillRect(-100, -100, SW + 200, SH + 200);
  // smell lines rising from the gaps between the cobblestones (hand-drawn, boiling)
  for (let i = 0; i < 7; i++) {
    const x0 = 120 + i * 140, y0 = 1650 + (i % 2) * 60;
    const p = clamp((t - w(4) - i * 0.08) / 0.9);
    const rise = ((t - w(4)) * 90 + i * 40) % 160;
    const pts = [];
    for (let k = 0; k <= 16; k++) { const s = k / 16; pts.push([x0 + Math.sin(s * 9 + t * 3 + i) * 24, y0 - rise - s * 420]); }
    ctx.globalAlpha = 0.8 * (1 - clamp((t - w(10)) / 0.4) * 0.6);
    handStroke(ctx, pts, p, { width: 5, t, seed: 40 + i, boil: 2 });
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  stripRow(ctx, t, [['roch', 'G', 110, w(4)], ['es', 'D', 80, w(5)], ['dort', 'D', 80, w(6)]], SW / 2, 330, { seed: 94 });
  stripRow(ctx, t, [['an', 'D', 80, w(7)], ['heißen', 'G', 110, w(8)], ['Tagen …', 'D', 80, w(9)]], SW / 2, 480, { seed: 95 });
  // … süß. — one word, in syrup, the drip from the ß falls on the last beat (→ loop to the wave)
  if (t >= w(11)) {
    const k = pop(t, w(11), 0.6);
    const a = t - w(11);
    const m = liquidBegin(ctx);
    m.save(); m.translate(SW / 2, 1080); m.scale(lerp(1.35, 1, k), lerp(1.35, 1, k));
    setFont(m, 'DB', 330); m.textAlign = 'center'; m.fillText('süß.', 0, 0); m.letterSpacing = '0px';
    m.restore();
    const L = Math.pow(clamp(a / 1.9), 2.2) * 520;
    drip(m, SW / 2 + 40, 1062, L, 40);
    if (a > 1.9) blob(m, SW / 2 + 40, 1062 + 520 + (a - 1.9) * 2600, 30, t, 2);
    liquidEnd(ctx, { depth: 10, top: 820, bottom: 1120, t });
  }
}

export const SCENES_C = [
  { id: 'deadly', start: CUT.deadly, end: CUT.cold, draw: deadly, blur: () => 1 },
  { id: 'cold', start: CUT.cold, end: CUT.stuck, draw: cold, blur: () => 1 },
  { id: 'stuck', start: CUT.stuck, end: CUT.kids, draw: stuck, blur: () => 1 },
  { id: 'kids', start: CUT.kids, end: CUT.leak, draw: kids, blur: () => 1 },
  { id: 'leak', start: CUT.leak, end: CUT.paint, draw: leak, blur: () => 1 },
  { id: 'paint', start: CUT.paint, end: CUT.harbor, draw: paint, blur: () => 1 },
  { id: 'harbor', start: CUT.harbor, end: CUT.smell, draw: harbor, blur: () => 1 },
  { id: 'smell', start: CUT.smell, end: DURATION + 1, draw: smell, blur: () => 1 },
];
