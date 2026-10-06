// Scenes 6–10: the rattle, the rivets, the burst, the wave, the crushed elevated railway.
import { SW, SH, P, img, bg, camera, shake, sticker, print, plate, handCircle, handArrow, handStroke, highlight, onTwos, tearWipe } from '../lib/collage.js';
import { liquidBegin, liquidEnd, drip, blob, strand, dripsAlong, surface, fillBelow } from '../lib/liquid.js';
import { row, letters, setFont, measure, pop, breathe, typed, hand } from '../lib/type.js';
import { L, W_, CUT, BEAT, E8, E16 } from './timeline.js';
import { TAU, clamp, lerp, ease, noise3, rng, rgba, street, runner, strip, stripRow, stripWord, waveMask, waveDetail, floodMask, tank, TANK_RINGS } from './common.js';
import HL from '../../../assets/molasse/img/highlights.json' with { type: 'json' };

// ============================================================== 6 · RATTLE
// Residents in the street turn their heads; RATTERN rattles; a WWI Lewis gun fires the long word.
const GUN_T = () => W_('m06', 5) - 0.04;
function rattle(ctx, t) {
  const w = (i) => W_('m06', i);
  if (t < GUN_T()) {
    const u = t - CUT.rattle;
    ctx.save();
    camera(ctx, t, { z: lerp(1.04, 1.12, u / 1.5) }, 1.2, 15);
    street(ctx, t, { x: 0.55 });
    // standing people; on "hören" they snap round towards the tank (left), on twos
    const turned = t >= w(1) + 0.08;
    const ppl = [['p_woman', 300, 1560, 0.42, 0], ['p_man_bowler', 560, 1500, 0.38, 1], ['p_girl_wood', 780, 1600, 0.44, 2], ['p_boy_walk', 960, 1540, 0.4, 3]];
    for (const [k, x, y, s, i] of ppl) {
      const tt = turned && t >= w(1) + 0.08 + i * E16;
      const jit = tt ? noise3(Math.floor(t * 12), i, 2) * 0.03 : 0;
      sticker(ctx, k, x, y, { s, rot: jit, flip: tt, lift: 0.3 });
      if (tt) hand(ctx, '?', x + 30, y - s * 1000 - 20, t, w(1) + 0.12 + i * E16, { size: 90, rot: 0.1 });
    }
    ctx.restore();
    stripRow(ctx, t, [['Dann', 'D', 80, w(0)], ['hören', 'G', 110, w(1)]], SW / 2, 330, { seed: 21 });
    stripRow(ctx, t, [['Anwohner', 'G', 110, w(2)]], SW / 2, 480, { seed: 22 });
    stripRow(ctx, t, [['ein', 'D', 80, w(3)]], SW / 2 - 300, 640, { seed: 23 });
    // RATTERN: every letter jumps on 16ths, like the rivets about to go
    if (t >= w(4)) {
      const k = pop(t, w(4));
      strip(ctx, SW / 2 + 60, 650, 640, 170, { seed: 24, rot: 0.02 });
      letters(ctx, 'RATTERN.', SW / 2 + 60, 700, 'G', 130, (i) => {
        const q = Math.floor(t / E16 * 1.5);
        const r = noise3(q * 1.7, i * 3.3, 4);
        return { dy: r * 16 * k, rot: noise3(q, i, 8) * 0.12, sx: lerp(1.5, 1, k), sy: lerp(1.5, 1, k) };
      }, { align: 'center' });
    }
    return;
  }
  // ---- "Wie Maschinengewehrfeuer": the Lewis gun fires the word letter by letter
  const g0 = GUN_T(), u = t - g0;
  bg(ctx);
  const [sx, sy] = shake(t, w(6), 10, 1.2, 30);
  ctx.save();
  camera(ctx, t, { x: SW / 2 + sx, y: SH / 2 + sy, z: lerp(1.05, 1, ease.outCubic(clamp(u / 0.4))) }, 1, 16);
  const slide = ease.outExpo(clamp(u / 0.3));
  const recoil = t >= w(6) ? Math.abs(Math.sin((t - w(6)) / E16 * Math.PI)) * 10 : 0;
  sticker(ctx, 'lewis_gun', lerp(-500, 40, slide) - recoil, 1330, { s: 0.9, rot: -0.12, ax: 0, ay: 0.5, lift: 0.4 });
  const muzzle = [lerp(-500, 40, slide) + 0.9 * 560 - recoil, 1330 - 0.9 * 280];
  // the word: 20 letters, one per 1/32 note, flying out of the muzzle into line
  const word = 'MASCHINENGEWEHRFEUER';
  const size = 76;
  setFont(ctx, 'G', size);
  const full = ctx.measureText(word).width;
  ctx.letterSpacing = '0px';
  const lx0 = SW / 2 - full / 2;
  letters(ctx, word, lx0, 860, 'G', size, (i, n, gl) => {
    const ti = w(6) + i * (E16 / 2);
    if (t < ti) return null;
    const p = ease.outExpo(clamp((t - ti) / 0.12));
    const tx = lx0 + gl.x + gl.w / 2;
    return { dx: lerp(muzzle[0] - tx, 0, p), dy: lerp(muzzle[1] - 860, 0, p) + noise3(i, t * 3, 1) * 3, rot: lerp(-0.6, 0, p) };
  });
  // muzzle flashes on each shot (paper-white star with ink outline)
  if (t >= w(6) && t < w(6) + 20 * E16 / 2 + 0.05) {
    const q = Math.floor((t - w(6)) / (E16 / 2));
    if (q % 2 === 0) {
      ctx.save(); ctx.translate(muzzle[0] + 20, muzzle[1]); ctx.rotate(-0.12 + q);
      ctx.fillStyle = rgba(P.card); ctx.strokeStyle = rgba(P.ink); ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, r = i % 2 ? 22 : 70 + (q % 3) * 14; ctx.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 0.7); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
  row(ctx, t, [{ text: 'Wie', role: 'D', size: 96, at: w(5) }], SW / 2, 700, { seed: 25 });
}

// ============================================================== 7 · RIVETS
// Macro on the riveted steel: the rivets shoot out on 16ths, syrup squirts from every hole.
const RIV = (() => {
  const r = rng(71), out = [];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 4; x++) out.push({ x: 150 + x * 260 + (y % 2) * 40, y: 640 + y * 230, d: r() });
  return out.sort((a, b) => a.d - b.d);
})();
function steel(ctx, t, crack = 0) {
  const g = ctx.createLinearGradient(0, 0, SW, SH);
  g.addColorStop(0, 'rgb(150,146,140)'); g.addColorStop(0.45, 'rgb(196,192,184)'); g.addColorStop(0.55, 'rgb(170,166,159)'); g.addColorStop(1, 'rgb(96,92,87)');
  ctx.fillStyle = g;
  ctx.fillRect(-200, -200, SW + 400, SH + 400);
  // brushed streaks
  const r = rng(5);
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 160; i++) { ctx.fillStyle = r() < 0.5 ? '#fff' : '#222'; ctx.fillRect(-200, r() * SH, SW + 400, 1 + r() * 2); }
  ctx.globalAlpha = 1;
  // plate seams
  ctx.strokeStyle = 'rgba(30,26,22,0.55)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-200, 1555); ctx.lineTo(SW + 200, 1555); ctx.stroke();
}
function rivetHead(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, 'rgb(236,232,224)'); g.addColorStop(0.5, 'rgb(150,145,138)'); g.addColorStop(1, 'rgb(60,56,52)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(20,18,16,0.6)'; ctx.lineWidth = 3; ctx.stroke();
}
const RIV_FIRST = () => W_('m07', 3) + 0.12;
function rivets(ctx, t) {
  const w = (i) => W_('m07', i);
  const u = t - CUT.rivets;
  const [sx, sy] = shake(t, w(5), 18, 1.4, 26);
  ctx.save();
  camera(ctx, t, { x: SW / 2 + sx, y: SH / 2 + sy, z: lerp(1.0, 1.15, u / 2.6) }, 1.2, 17);
  steel(ctx, t);
  const popStart = w(3);
  const holes = [];
  RIV.forEach((rv, i) => {
    const tp = popStart + i * (E16 * 0.75);
    if (t < tp) { rivetHead(ctx, rv.x, rv.y, 34 + noise3(i, t * 4, 2) * (t > tp - 0.3 ? 2 : 0)); return; }
    holes.push({ ...rv, tp });
  });
  // dark holes + squirting syrup (one liquid pass for all jets)
  for (const h of holes) { ctx.fillStyle = 'rgb(18,10,6)'; ctx.beginPath(); ctx.arc(h.x, h.y, 26, 0, TAU); ctx.fill(); }
  if (holes.length) {
    const m = liquidBegin(ctx);
    for (const h of holes) {
      const a = t - h.tp;
      const len = Math.min(1, a / 0.35) * (180 + h.d * 160);
      const sag = a * a * 260;
      // jet: from hole towards camera/down, thick then breaking into drops
      m.lineCap = 'round';
      for (let k = 0; k < 12; k++) {
        const s = k / 11;
        const x = h.x + (h.d - 0.5) * 120 * s, y = h.y + s * len * 0.4 + sag * s * s;
        m.beginPath(); m.arc(x, y, Math.max(3, 24 * (1 - s * 0.6)), 0, TAU); m.fill();
      }
      drip(m, h.x, h.y + 10, Math.min(260, a * 300), 26);
    }
    liquidEnd(ctx, { depth: 7, top: 500, bottom: 1700, t });
  }
  // flying rivet heads (towards camera: growing, spinning, gone in ~0.25 s)
  for (const h of holes) {
    const a = (t - h.tp) / 0.28;
    if (a > 1) continue;
    const s = 1 + a * a * 7;
    ctx.save();
    ctx.translate(h.x + (h.d - 0.5) * 900 * a, h.y - 500 * a + 900 * a * a);
    ctx.rotate(a * 8);
    rivetHead(ctx, 0, 0, 34 * s);
    ctx.restore();
  }
  // crack across the plate on "Stahl"
  const pc = clamp((t - w(8)) / 0.25);
  if (pc > 0) handStroke(ctx, [[-20, 1120], [180, 1060], [330, 1150], [520, 1040], [700, 1170], [860, 1080], [1100, 1140]], pc, { width: 9, color: [16, 12, 10], t, seed: 4, boil: 3 });
  ctx.restore();
  // Nieten — the i-dot is a rivet that shoots off with the first one
  if (t >= w(3)) {
    const k = pop(t, w(3));
    strip(ctx, SW / 2, 330, 680, 210, { seed: 31, rot: -0.02 });
    const g = letters(ctx, 'Nıeten.', SW / 2, 395, 'G', 170, () => ({ sx: lerp(1.4, 1, k), sy: lerp(1.4, 1, k) }), { align: 'center' });
    const gi = g.list[1];
    const dx = g.x + gi.x + gi.w / 2, dy = 395 - 150;
    const a = clamp((t - RIV_FIRST()) / 0.3);
    ctx.save();
    ctx.translate(dx + a * 260, dy - a * 300 + a * a * 900);
    ctx.rotate(a * 6);
    rivetHead(ctx, 0, 0, 19 * (1 + a * 2));
    ctx.restore();
  }
  row(ctx, t, [{ text: 'Es', role: 'D', size: 76, at: w(0) }, { text: 'sind', role: 'D', size: 76, at: w(1) }, { text: 'die', role: 'D', size: 76, at: w(2) }], SW / 2, 200, { seed: 32 });
  // "platzen": letters burst outwards on the word
  if (t >= w(5)) {
    const b = clamp((t - w(5)) / 0.3);
    strip(ctx, SW / 2, 1660, 620, 150, { seed: 33, rot: 0.02 });
    letters(ctx, 'platzen', SW / 2, 1700, 'DB', 120, (i, n) => {
      const a = (i - (n - 1) / 2) * 0.5;
      return { dx: Math.sin(a) * 60 * ease.outExpo(b) * (1 - clamp((t - w(5) - 0.4) / 0.3)), dy: -Math.cos(a) * 30 * ease.outExpo(b) * (1 - clamp((t - w(5) - 0.4) / 0.3)), rot: a * 0.3 * (1 - b) };
    }, { align: 'center' });
  }
  // "aus dem Stahl." split by the crack
  if (t >= w(6)) {
    const splitP = ease.outBack(clamp((t - w(8) - 0.1) / 0.3));
    stripRow(ctx, t, [['aus', 'D', 76, w(6)], ['dem', 'D', 76, w(7)]], SW / 2 - 240, 1480, { seed: 34 });
    if (t >= w(8)) {
      ctx.save();
      strip(ctx, SW / 2 + 190, 1480, 400, 150, { seed: 35, rot: 0.03 });
      letters(ctx, 'STAHL.', SW / 2 + 190, 1525, 'G', 118, (i, n) => ({ dx: (i < 3 ? -1 : 1) * splitP * 26, rot: (i < 3 ? -1 : 1) * splitP * 0.06 }), { align: 'center' });
      ctx.restore();
    }
  }
}

// =============================================================== 8 · BURST
// Two beats of silence while the tank strains; then it tears in two and the syrup fills the lens.
function burst(ctx, t) {
  const t0 = CUT.burst, u = t - t0;
  const tb = CUT.wave - 0.12; // the tear
  bg(ctx);
  const strain = clamp(u / (tb - t0));
  const [sx, sy] = shake(t, tb, 46, 0.8, 24);
  ctx.save();
  camera(ctx, t, { x: SW / 2 + sx + noise3(t * 40, 1, 1) * strain * 4, y: SH / 2 + sy, z: lerp(0.94, 1.0, strain) }, 1, 18);
  print(ctx, 'plate_twharf', SW / 2, 820, { w: 1040, border: 0, torn: 'tb', seed: 51, lift: 0.1, crop: [0, 300, 1536, 900], inner: { x: 0.5, y: 0.5, z: 1.1 } });
  const cx = SW / 2, base = 1350, tw = 800, th = 440;
  if (t < tb) {
    ctx.save();
    ctx.translate(cx, base); ctx.scale(1 + strain * 0.04 + noise3(t * 30, 2, 2) * strain * 0.01, 1 - strain * 0.015); ctx.translate(-cx, -base);
    tank(ctx, cx, base, tw, th, { rings: TANK_RINGS, t, label: 1 });
    ctx.restore();
  } else {
    // the halves fly apart (the report: "two great segments of sheet iron, pulled in opposite directions")
    const a = (t - tb);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(cx + side * (tw * 0.25 + a * 900), base - a * 600 + a * a * 900);
      ctx.rotate(side * a * 2.2);
      ctx.beginPath(); ctx.rect(side < 0 ? -tw / 2 - 40 : -40, -th - 200, tw / 2 + 40, th + 400); ctx.clip();
      tank(ctx, side * -tw * 0.25, 0, tw, th, { rings: TANK_RINGS, t, label: 1 });
      ctx.restore();
    }
    const m = liquidBegin(ctx);
    const r = Math.pow(a / 0.12, 1.3) * 500;
    for (let i = 0; i < 9; i++) { const an = (i / 9) * TAU; blob(m, cx + Math.cos(an) * r * 0.5, base - th / 2 + Math.sin(an) * r * 0.4, r * 0.55, t, i, 0.3); }
    blob(m, cx, base - th / 2, r, t, 3, 0.25);
    liquidEnd(ctx, { depth: 12, top: base - th - r, bottom: base + r, t });
  }
  ctx.restore();
  // a 1-frame flash on the tear
  if (t >= tb && t < tb + 1 / 30) { ctx.fillStyle = rgba(P.card); ctx.fillRect(0, 0, SW, SH); }
}

// ================================================================ 9 · WAVE
// Same street as the hook (the loop's anchor). Measured: 8 m against a 1.7 m man; 56 km/h.
function waveScene(ctx, t) {
  const w = (i) => W_('m08', i);
  const u = t - CUT.wave;
  const rush = ease.inOutCubic(clamp((t - w(5)) / 1.4));
  const [sx, sy] = shake(t, CUT.wave, 30, 1.5, 18);
  const [sx2, sy2] = shake(t, w(5), 22, 2.5, 20);
  ctx.save();
  camera(ctx, t, { x: SW / 2 + sx + sx2, y: SH / 2 + sy + sy2, z: lerp(1.2, 1.0, ease.outCubic(clamp(u / 0.8))) }, 1.3, 19);
  street(ctx, t, { x: lerp(0.3, 0.85, rush) });
  const wv = { front: lerp(150, 1350, ease.inOutSine(clamp(u / 4.1))) - rush * 200, top: 260, base: 1650, seed: 7 };
  // people swept: before the front they run, after it they tumble with the flow
  const ppl = [['p_woman', 520, 1660, 0.36, 0.1], ['p_girl_box', 700, 1720, 0.4, 0.5], ['p_man_bowler', 860, 1640, 0.32, 0.3], ['p_boy_wood', 980, 1760, 0.42, 0.7]];
  const m = liquidBegin(ctx);
  waveMask(m, t, wv);
  liquidEnd(ctx, { depth: 11, top: wv.top, bottom: wv.base + 300, t, detail: waveDetail(t, wv) });
  for (const [k, x0, y, s, ph] of ppl) {
    const x = x0 + u * 110;
    if (x < wv.front + 140) {
      const a = (wv.front + 140 - x) / 300;
      sticker(ctx, k, x + a * 120, y - a * 220, { s, rot: a * 3 + ph, lift: 0.7, alpha: clamp(1 - a * 0.9) });
    } else runner(ctx, k, x, y, s, t, { phase: ph, speed: 1.4 });
  }
  const mm = liquidBegin(ctx);
  floodMask(mm, t, lerp(1900, 1700, clamp(u / 4)), { seed: 8, amp: 18, x1: wv.front + 300 });
  liquidEnd(ctx, { depth: 8, top: 1650, bottom: SH, t });
  // the 8 m ruler (a hand-drawn tape against the crest) with a 1.7 m man for scale
  const pr = clamp((t - w(1)) / 0.45);
  if (pr > 0 && t < w(5) + 0.2) {
    const x = Math.min(SW - 120, wv.front + 330), top = wv.top + 40, base = wv.base;
    const yT = lerp(base, top, ease.outCubic(pr));
    ctx.save();
    ctx.fillStyle = rgba(P.card, 0.92);
    ctx.fillRect(x - 26, yT, 52, base - yT);
    ctx.strokeStyle = rgba(P.ink); ctx.lineWidth = 3; ctx.strokeRect(x - 26, yT, 52, base - yT);
    for (let i = 0; i <= 8; i++) {
      const y = base - (i / 8) * (base - top);
      if (y < yT) break;
      ctx.beginPath(); ctx.moveTo(x - 26, y); ctx.lineTo(x + (i % 2 ? 0 : 12), y); ctx.stroke();
      setFont(ctx, 'G', 30); ctx.fillStyle = rgba(P.ink); ctx.textAlign = 'right'; ctx.fillText(String(i), x - 34, y + 10); ctx.letterSpacing = '0px';
    }
    sticker(ctx, 'p_man_bowler', x + 60, base, { s: (1.7 / 8) * (base - top) / 1000, lift: 0.2 });
    ctx.restore();
  }
  ctx.restore();
  // words
  stripRow(ctx, t, [['Eine', 'D', 80, w(0)], ['acht', 'G', 120, w(1)], ['Meter', 'G', 120, w(2)]], SW / 2, 300, { seed: 41 });
  stripRow(ctx, t, [['hohe', 'D', 80, w(3)], ['Welle', 'G', 120, w(4)]], SW / 2, 450, { seed: 42 });
  stripRow(ctx, t, [['rast', 'G', 110, w(5), -0.05], ['mit', 'D', 80, w(6)]], SW / 2, 620, { seed: 43 });
  // 56 km/h: the needle runs up while the number is spoken, speed lines tear through
  if (t >= w(7)) {
    const k = pop(t, w(7));
    const v = Math.round(ease.outCubic(clamp((t - w(7)) / 0.6)) * 56);
    ctx.save();
    ctx.translate(SW / 2 - 60, 1040);
    ctx.rotate(-0.05);
    ctx.scale(lerp(1.5, 1, k), lerp(1.5, 1, k));
    // speed lines
    ctx.strokeStyle = rgba(P.ink); ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const y = -230 + i * 52, l = 200 + ((i * 37) % 5) * 60, x = -300 - ((t * 2400 + i * 300) % 400);
      ctx.lineWidth = 6 + (i % 3) * 3; ctx.beginPath(); ctx.moveTo(x - l, y); ctx.lineTo(x, y); ctx.stroke();
    }
    setFont(ctx, 'A', 460);
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(P.card); ctx.lineWidth = 28; ctx.strokeText(String(v), 0, 150);
    ctx.fillStyle = rgba(P.ink); ctx.fillText(String(v), 0, 150);
    ctx.letterSpacing = '0px';
    ctx.restore();
    stripWord(ctx, t, 'km/h', 'DB', 110, SW / 2 + 330, 1130, w(8), { seed: 44, rot: 0.06 });
  }
  stripRow(ctx, t, [['durch', 'D', 80, w(9)], ['die', 'D', 80, w(10)], ['Straßen.', 'G', 120, w(11)]], SW / 2, 1450, { seed: 45 });
}

// =============================================================== 10 · CRUSH
// Evidence of what it did: the crushed houses (aerial, Red Cross photo), the broken "L" (newspaper),
// and the elevated railway snapping like matchsticks (before: Dudley St. 1904 — after: Jan. 1919).
function match(ctx, x, y, len, ang, snap) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const half = len / 2;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.rotate(s * snap * 0.5);
    ctx.fillStyle = 'rgb(214,196,160)';
    ctx.strokeStyle = rgba(P.ink); ctx.lineWidth = 2.5;
    ctx.fillRect(s < 0 ? -half : 0, -7, half, 14);
    ctx.strokeRect(s < 0 ? -half : 0, -7, half, 14);
    if (s > 0) { ctx.fillStyle = 'rgb(46,22,10)'; ctx.beginPath(); ctx.ellipse(half, 0, 16, 11, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}
function crush(ctx, t) {
  const w = (i) => W_('m09', i);
  const u = t - CUT.crush;
  bg(ctx);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.06, u / 3.5) }, 1, 20);
  // 1) the aerial: houses crushed
  if (t < w(4) - 0.05) {
    const land = ease.outCubic(clamp(u / 0.3));
    print(ctx, 'plate_aerial', SW / 2, lerp(900, 860, land), { w: 1000, rot: lerp(0.1, 0.02, land), border: 18, seed: 61, lift: lerp(1, 0.3, land), inner: { x: 0.45, y: 0.55, z: lerp(1.25, 1.5, u / 1.2) } });
    hand(ctx, 'North End, 15.01.1919', SW / 2, 1300, t, CUT.crush + 0.3, { size: 54, rot: -0.03 });
  } else {
    // 2) before -> after: the elevated railway, torn across on "knickt"
    const pk = clamp((t - w(4)) / 0.35);
    tearWipe(ctx, pk,
      (c) => print(c, 'plate_dudley', SW / 2, 860, { w: 1000, rot: -0.02, border: 18, seed: 62, lift: 0.3, inner: { x: 0.68, y: 0.62, z: 1.9 } }),
      (c) => print(c, 'plate_elwreck', SW / 2, 860, { w: 1000, rot: 0.025, border: 18, seed: 63, lift: 0.3, inner: { x: 0.5, y: 0.45, z: lerp(1.05, 1.2, clamp((t - w(4)) / 2)) } }),
      { seed: 9, angle: 0.1 });
    // the newspaper clipping: "Blows Out Pillars of 'L' Road, Wrecks Buildings"
    const pn = pop(t, w(5) - 0.1, 0.8);
    if (pn > 0) {
      const hl = HL.news_newbritain;
      print(ctx, 'news_newbritain', SW / 2 + 40, lerp(200, 330, pn), {
        w: 780, rot: -0.04, border: 0, torn: 'trbl', seed: 64, lift: 0.5, crop: [300, 276, 500, 175], inner: { x: 0.5, y: 0.5, z: 1 },
        after: (c, m) => {
          const map = ([x, y, ww, hh]) => [m.x + (x - m.cx) * m.sx, m.y + (y - m.cy) * m.sy, ww * m.sx, hh * m.sy];
          highlight(c, ...map(hl.pillars), clamp((t - w(6)) / 0.45), { seed: 7 });
          highlight(c, ...map(hl.buildings), clamp((t - w(7) + 0.05) / 0.3), { seed: 8 });
        },
      });
    }
    // 3) matches: snapping like the steel columns
    if (t >= w(8) - 0.1) {
      for (let i = 0; i < 7; i++) {
        const ts = w(8) + i * E16 * 0.6;
        const snap = ease.outBack(clamp((t - ts) / 0.12));
        match(ctx, 150 + i * 130, 1180 + (i % 2) * 20, 210, -1.5708 + (i - 3) * 0.04, snap * (0.7 + (i % 3) * 0.2) * (i % 2 ? 1 : -1));
      }
    }
  }
  ctx.restore();
  // words
  const sq = t >= w(2) ? 1 - 0.55 * ease.outBack(clamp((t - w(2) - 0.12) / 0.25)) : 1; // HÄUSER squashed by the mass
  if (t < w(4) - 0.05) {
    stripRow(ctx, t, [['Sie', 'D', 80, w(0)], ['zerdrückt', 'G', 118, w(1)]], SW / 2, 290, { seed: 51 });
    if (t >= w(2)) {
      ctx.save();
      ctx.translate(SW / 2, 1520);
      ctx.scale(1 + (1 - sq) * 0.35, sq);
      strip(ctx, 0, -55, 700, 190, { seed: 52 });
      setFont(ctx, 'G', 170); ctx.textAlign = 'center'; ctx.fillStyle = rgba(P.ink); ctx.fillText('HÄUSER', 0, 0); ctx.letterSpacing = '0px';
      ctx.restore();
      // the mass that squashes it
      const m = liquidBegin(ctx);
      const yb = lerp(1250, 1400 + (1 - sq) * 140, ease.inCubic(clamp((t - w(2)) / 0.14)));
      fillBelow(m, surface(-40, SW + 40, 0, t, { amp: 6 }).map(([x]) => [x, yb + noise3(x * 0.01, t, 3) * 20]), -200);
      dripsAlong(m, [[200, yb], [400, yb], [640, yb], [880, yb]], t, w(2), { n: 5, maxL: 90, w: 22, seed: 6 });
      liquidEnd(ctx, { depth: 9, top: -100, bottom: yb, t });
    }
  } else {
    stripRow(ctx, t, [['und', 'D', 80, w(3)]], SW / 2 - 330, 1360, { seed: 53 });
    // "knickt" breaks in the middle like a beam
    const kb = ease.outBack(clamp((t - w(4) - 0.05) / 0.25));
    strip(ctx, SW / 2 + 60, 1340, 520, 170, { seed: 54, rot: 0.02 });
    letters(ctx, 'knickt', SW / 2 + 60, 1385, 'G', 140, (i) => ({ dy: (i === 2 || i === 3 ? 1 : 0.4) * kb * 26, rot: (i < 3 ? 1 : -1) * kb * 0.18 }), { align: 'center' });
    stripRow(ctx, t, [['die', 'D', 76, w(5)], ['Hochbahn', 'G', 118, w(6)]], SW / 2, 1500, { seed: 55 });
    stripRow(ctx, t, [['wie', 'D', 76, w(7)], ['Streichhölzer.', 'DB', 104, w(8)]], SW / 2, 1640, { seed: 56 });
  }
}

export const SCENES_B = [
  { id: 'rattle', start: CUT.rattle, end: CUT.rivets, draw: rattle, blur: () => 1 },
  { id: 'rivets', start: CUT.rivets, end: CUT.burst, draw: rivets, blur: () => 2 },
  { id: 'burst', start: CUT.burst, end: CUT.wave, draw: burst, blur: () => 2 },
  { id: 'wave', start: CUT.wave, end: CUT.crush, draw: waveScene, blur: (t) => (t > W_('m08', 5) && t < W_('m08', 7) + 0.4 ? 3 : 1) },
  { id: 'crush', start: CUT.crush, end: CUT.deadly, draw: crush, blur: () => 1 },
];
