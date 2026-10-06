// Scenes 1–5: hook, "Sirup", Boston 1919, the tank, what is inside.
import { SW, SH, P, img, bg, camera, shake, sticker, print, plate, handCircle, handArrow, handStroke, highlight, onTwos } from '../lib/collage.js';
import { liquidBegin, liquidEnd, drip, blob, strand, dripsAlong, surface, fillBelow } from '../lib/liquid.js';
import { row, letters, setFont, measure, pop, breathe, typed, hand } from '../lib/type.js';
import { L, W_, WE, CUT, BEAT, E8, E16 } from './timeline.js';
import { TAU, clamp, lerp, ease, noise3, rng, rgba, S, street, runner, strip, stripWord, stripRow, waveMask, waveDetail, floodMask, tank, TANK_RINGS, clock, odometer, imageInText } from './common.js';
import HL from '../../../assets/molasse/img/highlights.json' with { type: 'json' };

// ================================================================ 1 · HOOK
// Frame 1 is already the absurd image: a glossy brown wave breaking over a 1909 Boston street.
function hook(ctx, t) {
  const u = t; // scene starts at 0
  const [sx, sy, sr] = shake(t, 0, 14, 2.7, 15);
  ctx.save();
  camera(ctx, t, { x: SW / 2 + sx, y: SH / 2 + sy, z: lerp(1.02, 1.12, ease.inOutSine(clamp(u / 2.6))), r: sr }, 1, 3);
  street(ctx, t, { x: lerp(0.66, 0.74, u / 2.6) });

  // 8 m of syrup against 1.7 m people: the wave towers over the whole street
  const wv = { front: lerp(380, 760, ease.inOutSine(clamp(u / 2.6))), top: lerp(190, 120, clamp(u / 2.6)), base: 1560, seed: 3 };
  let m = liquidBegin(ctx);
  waveMask(m, t, wv);
  liquidEnd(ctx, { depth: 10, top: wv.top, bottom: wv.base + 300, t, detail: waveDetail(t, wv) });

  // people fleeing to the right — small against the wave (scale), animated on twos
  const run = [
    ['p_man_bowler', 700, 1560, 0.3, 1.0, 0.6],
    ['p_girl_wood', 540, 1600, 0.34, 1.2, 0.2],
    ['p_woman', 820, 1640, 0.36, 1.1, 0.0],
    ['p_girl_box', 600, 1700, 0.4, 1.4, 0.4],
    ['p_boy_wood', 900, 1750, 0.42, 1.3, 0.8],
  ];
  for (const [k, x0, y, s, sp, ph] of run) {
    const x = x0 + u * 120 * sp;
    runner(ctx, k, x, y + u * 18 * sp, s * (1 + u * 0.06), t, { phase: ph, speed: 1.2 });
  }
  // the flood rising in the street (in front of everything)
  m = liquidBegin(ctx);
  const lvl = lerp(1980, 1500, ease.inOutCubic(clamp((u - 0.2) / 2.3)));
  floodMask(m, t, lvl, { seed: 5, amp: 16 });
  liquidEnd(ctx, { depth: 8, top: lvl - 40, bottom: SH, t });
  ctx.restore();

  // ---- typography: torn strips; "21" stands like a cut-paper monument while the syrup rises up its legs
  const w = (i) => W_('m01', i);
  stripRow(ctx, t, [['Diese', 'D', 96, w(0), -0.04], ['Welle', 'G', 150, w(1), 0.03]], SW / 2, 330, { seed: 1 });
  stripRow(ctx, t, [['hat', 'D', 74, w(2), -0.02]], SW / 2, 480, { seed: 2 });
  if (t >= w(3)) {
    const k = pop(t, w(3));
    const br = breathe(t, 7, 1.5);
    ctx.save();
    ctx.translate(SW / 2 + br.dx, 1120 + br.dy);
    ctx.rotate(-0.03 + br.r);
    const sc = lerp(1.6, 1, k) * br.s;
    ctx.scale(sc, sc);
    setFont(ctx, 'A', 600);
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.save(); ctx.globalAlpha = 0.28; ctx.translate(10, 26); ctx.filter = 'blur(10px)'; ctx.fillStyle = '#1e160e'; ctx.fillText('21', 0, 220); ctx.restore();
    ctx.strokeStyle = rgba(P.card);
    ctx.lineWidth = 30;
    ctx.strokeText('21', 0, 220);
    ctx.fillStyle = rgba(P.ink);
    ctx.fillText('21', 0, 220);
    ctx.letterSpacing = '0px';
    ctx.restore();
    // syrup creeping up the number from the flood
    if (t > w(4) - 0.3) {
      const mm = liquidBegin(ctx);
      const lv = lerp(1360, 1180, ease.inOutCubic(clamp((t - w(4) + 0.3) / 1.2)));
      const pts = surface(-40, SW + 40, lv, t, { amp: 9, seed: 9, freq: 0.008 });
      mm.save(); mm.beginPath(); mm.rect(250, 600, 580, 760); mm.clip();
      // only where the number is: clip to its glyphs
      mm.restore();
      mm.globalCompositeOperation = 'source-over';
      fillBelow(mm, pts, 1420);
      mm.globalCompositeOperation = 'destination-in';
      mm.setTransform(1, 0, 0, 1, 0, 0);
      setFont(mm, 'A', 600 * sc);
      mm.textAlign = 'center';
      mm.lineJoin = 'round';
      mm.lineWidth = 30 * sc;
      mm.translate(SW / 2 + br.dx, 1120 + br.dy); mm.rotate(-0.03 + br.r);
      mm.fillText('21', 0, 220 * sc); mm.strokeText('21', 0, 220 * sc);
      mm.letterSpacing = '0px';
      liquidEnd(ctx, { depth: 7, top: lv - 30, bottom: 1420, t, shadow: false });
    }
  }
  stripRow(ctx, t, [['Menschen', 'G', 100, w(4), 0.02], ['getötet.', 'D', 100, w(5), -0.03]], SW / 2, 1480, { seed: 3 });
}

// ============================================================== 2 · SIRUP
function sirup(ctx, t) {
  const t0 = CUT.sirup;
  const u = t - t0;
  bg(ctx);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.06, ease.inOutSine(clamp(u / 2.4))) }, 1, 5);
  const w = (i) => W_('m02', i);
  row(ctx, t, [
    { text: 'Und', role: 'D', size: 78, at: w(0) },
    { text: 'sie', role: 'D', size: 78, at: w(1) },
    { text: 'bestand', role: 'G', size: 92, at: w(2) },
    { text: 'aus', role: 'D', size: 78, at: w(3) },
  ], SW / 2, 700, { seed: 2 });

  // the spoken pause ("aus … Sirup"): three dots arrive one per eighth, holding the breath
  if (t >= w(4) && t < w(5)) {
    for (let i = 0; i < 3; i++) {
      const k = pop(t, w(4) + i * E8 * 0.6);
      if (k <= 0) continue;
      ctx.save(); ctx.translate(SW / 2 + (i - 1) * 90, 1000); ctx.scale(k, k);
      ctx.fillStyle = rgba(P.ink); ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
  if (t >= w(5)) {
    const k = pop(t, w(5), 0.8);
    const ts = t - w(5);
    const m = liquidBegin(ctx);
    const size = 330;
    m.save();
    m.translate(SW / 2, 1040);
    m.scale(lerp(1.3, 1, k), lerp(1.3, 1, k) * (1 + clamp(ts / 1.3) * 0.06));
    setFont(m, 'G', size);
    m.textAlign = 'center';
    m.fillText('SIRUP', 0, 0);
    m.letterSpacing = '0px';
    m.restore();
    // drips along the baseline of every letter; strands from the bottom bowls towards the floor
    const xs = [-410, -250, -90, 70, 200, 370].map((x) => SW / 2 + x * 0.98);
    xs.forEach((x, i) => {
      const L = Math.pow(clamp((ts - i * 0.07) / 1.5), 0.85) * (220 + (i % 3) * 140);
      drip(m, x, 1032, L, 30 + (i % 2) * 12);
    });
    const r = rng(8);
    for (let i = 0; i < 6; i++) {
      const x = SW / 2 + (r() - 0.5) * 760, L = clamp((ts - 0.3 - r() * 0.5) / 1.6) * (500 + r() * 400);
      if (L > 0) strand(m, x, 1035, x + (r() - 0.5) * 30, 1035 + L, 14, 4, 0.02);
    }
    liquidEnd(ctx, { depth: 10, top: 760, bottom: 1300, t });
  }
  hand(ctx, 'kein Witz.', 740, 1560, t, w(5) + 0.55, { size: 96, rot: -0.08 });
  ctx.restore();
}

// ============================================================= 3 · BOSTON
// The same-day newspaper (Evening Public Ledger, Philadelphia, 15 Jan 1919) as evidence; the date is
// highlighted while it is spoken; the O of BOSTON becomes the clock — "kurz nach Mittag".
function boston(ctx, t) {
  const t0 = CUT.boston, u = t - t0;
  const w = (i) => W_('m03', i);
  bg(ctx);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.05, u / 4.4) }, 1, 9);

  // newspaper drops in (lifted -> lands), the inner camera travels from the masthead to the headline
  const land = ease.outCubic(clamp((u + 0.05) / 0.35));
  const toDate = ease.inOutCubic(clamp((t - w(1) + 0.3) / 0.7));
  const toHead = ease.inOutCubic(clamp((t - w(4) + 0.2) / 0.8));
  const inner = { x: lerp(lerp(0.45, 0.42, toDate), 0.6, toHead), y: lerp(lerp(0.32, 0.1, toDate), 0.55, toHead), z: lerp(lerp(1.15, 2.1, toDate), 1.7, toHead) };
  const hl = HL.news_ledger;
  print(ctx, 'news_ledger', SW / 2, lerp(1300, 1220, land), {
    w: 980, h: 900, rot: lerp(-0.12, -0.025, land), border: 0, torn: 'trbl', seed: 21, lift: lerp(1, 0.25, land), inner,
    after: (c, m) => {
      const map = ([x, y, ww, hh]) => [m.x + (x - m.cx) * m.sx, m.y + (y - m.cy) * m.sy, ww * m.sx, hh * m.sy];
      highlight(c, ...map(hl.date), clamp((t - w(1)) / (w(3) + 0.6 - w(1))), { seed: 3 });
      highlight(c, ...map(hl.headline), clamp((t - w(4) - 0.1) / 0.35), { seed: 4 });
    },
  });

  // BOSTON — the harbour photo inside the letters, panning; the first O turns into a watch
  const pB = pop(t, w(0), 0.9);
  if (pB > 0) {
    const sc = lerp(1.4, 1, pB);
    ctx.save();
    ctx.translate(SW / 2, 470);
    ctx.scale(sc, sc);
    ctx.translate(-SW / 2, -470);
    const clockOn = t >= w(4) - 0.12;
    imageInText(ctx, 'BOSTON', 'G', 250, SW / 2, 560, 'plate_twharf', [0, 420, 1536, 700], {
      inner: { x: lerp(0.25, 0.75, u / 4.4), y: 0.6, z: 1.6 },
      fn: (c) => {
        // draw glyph by glyph so the O (index 1) can leave for the clock
        letters(c, 'BOSTON', SW / 2, 560, 'G', 250, (i) => (i === 1 && clockOn ? null : {}), { align: 'center' });
      },
    });
    // ink outline so the photo-letters read on paper
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    letters(ctx, 'BOSTON', SW / 2, 560, 'G', 250, (i) => (i === 1 && clockOn ? null : { color: [60, 52, 46], alpha: 0.35 }), { align: 'center' });
    ctx.restore();
    if (clockOn) {
      // the watch rolls into the O's place; hands spin from midnight to 12:40 on "Mittag"
      setFont(ctx, 'G', 250);
      const full = ctx.measureText('BOSTON').width, bw = ctx.measureText('B').width, ow = ctx.measureText('O').width;
      ctx.letterSpacing = '0px';
      const ox = SW / 2 - full / 2 + bw + ow / 2 - 6, oy = 560 - 92;
      const k = pop(t, w(4) - 0.12, 0.8);
      const spin = ease.outCubic(clamp((t - w(4)) / (w(6) + 0.25 - w(4))));
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate((1 - k) * -1.2);
      clock(ctx, 0, 0, 98 * k, lerp(0, 12 + 40 / 60, spin));
      ctx.restore();
    }
    ctx.restore();
  }
  // the German date, typed like a telegram while it is spoken
  ctx.save();
  ctx.translate(0, 0);
  const n = typed(ctx, '15. JANUAR 1919', SW / 2, 700, t, w(1), { cps: 15, size: 70, align: 'center' });
  ctx.restore();
  if (t >= w(4)) hand(ctx, 'kurz nach Mittag', 330, 300, t, w(4), { size: 78, rot: -0.07, dur: 0.6 });
  ctx.restore();
}

// =============================================================== 4 · TANK
// Real photo of the tank as evidence; the tank rebuilt as a collage object, ring by ring;
// a five-storey house stacks up floor by floor beside it ("so hoch wie ein fünfstöckiges Haus").
const PXM = 27; // px per metre in this scene
function house(ctx, x, base, floors, t) {
  const fw = 6.5 * PXM, fh = 3 * PXM;
  for (let i = 0; i < 5; i++) {
    const k = clamp(floors - i);
    if (k <= 0) break;
    const y = base - (i + 1) * fh;
    const drop = (1 - ease.outBack(k)) * -120;
    ctx.save();
    ctx.translate(x, y + drop);
    ctx.globalAlpha *= clamp(k * 3);
    ctx.fillStyle = 'rgb(205,197,184)';
    ctx.fillRect(0, 0, fw, fh);
    ctx.strokeStyle = rgba(P.ink); ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, fw, fh);
    for (let j = 0; j < 3; j++) { ctx.fillStyle = 'rgb(40,36,32)'; ctx.fillRect(fw * (0.12 + j * 0.3), fh * 0.22, fw * 0.16, fh * 0.56); }
    ctx.restore();
    // floor number in handwriting, on the beat it lands
    if (k > 0.2) { setFont(ctx, 'H', 44); ctx.fillStyle = rgba(P.ink); ctx.textAlign = 'left'; ctx.fillText(String(i + 1), x + fw + 14, y + fh * 0.7); }
  }
  if (floors >= 5) {
    ctx.fillStyle = 'rgb(60,54,48)';
    ctx.beginPath(); ctx.moveTo(x - 8, base - 5 * fh); ctx.lineTo(x + fw / 2, base - 5 * fh - fh * 0.7); ctx.lineTo(x + fw + 8, base - 5 * fh); ctx.fill();
  }
}
function tankScene(ctx, t) {
  const t0 = CUT.tank, u = t - t0;
  const w = (i) => W_('m04', i);
  bg(ctx);
  ctx.save();
  camera(ctx, t, { y: SH / 2 + lerp(-20, 30, u / 3.5), z: lerp(1.06, 1.0, ease.outCubic(clamp(u / 1.2))) }, 1, 11);
  const base = 1380;
  // harbour backdrop print (T Wharf, Boston) behind the scene, on "Hafen"
  const ph = pop(t, w(1), 0.7);
  if (ph > 0) print(ctx, 'plate_twharf', SW / 2 - 60, 760, { w: 820 * lerp(0.6, 1, ph), rot: -0.03, border: 14, seed: 41, lift: 0.2, inner: { x: 0.55, y: 0.5, z: lerp(1.1, 1.25, u / 3.5) }, crop: [0, 330, 1536, 820] });
  // ground line
  handStroke(ctx, [[60, base + 2], [1020, base + 2]], clamp((t - w(1)) / 0.5), { width: 4, t, seed: 3 });
  // the tank grows ring by ring from "steht" to "Stahltank" (one ring per 16th)
  const rings = clamp((t - w(2)) / (E16 * TANK_RINGS)) * TANK_RINGS;
  const tw = 27 * PXM * 0.92, th = 15 * PXM;
  tank(ctx, 60 + tw / 2, base, tw, th, { rings, t, label: clamp((t - w(4) - 0.1) / 0.3) });
  // the person for scale (1.7 m)
  sticker(ctx, 'p_man_bowler', 60 + tw + 26, base + 4, { s: (1.75 * PXM) / 1000, lift: 0.1 });
  // five storeys, one per 16th, starting on "fünfstöckiges"
  const floors = clamp((t - w(9) + 0.05) / (E16 * 5)) * 5;
  house(ctx, 60 + tw + 60, base, floors, t);
  // height bracket 15 m between them
  const pb = clamp((t - w(10)) / 0.4);
  if (pb > 0) {
    const x = 60 + tw + 48;
    const hx = x + 6.5 * PXM + 58;
    handStroke(ctx, [[hx - 12, base], [hx, base], [hx, base - th], [hx - 12, base - th]], pb, { width: 4, t, seed: 8 });
    hand(ctx, '15 m', hx + 34, base - th / 2, t, w(10) + 0.1, { size: 60, rot: -1.5708 + 0.04, align: 'center' });
  }
  // the real tank, pinned as evidence (Bostonian Society photo, before 1919)
  const pt = pop(t, w(4) - 0.05, 0.9);
  if (pt > 0) print(ctx, 'plate_tank', 800, 640, { w: 360 * lerp(0.5, 1, pt), rot: 0.07, border: 16, seed: 43, lift: lerp(1, 0.45, pt), inner: { x: 0.55, y: 0.5, z: lerp(1.05, 1.15, u / 3.5) } });
  if (t > w(4) + 0.3) hand(ctx, 'das Original', 800, 470, t, w(4) + 0.3, { size: 52, rot: 0.06 });
  ctx.restore();
  // words
  row(ctx, t, [
    { text: 'Am', role: 'D', size: 70, at: w(0) },
    { text: 'Hafen', role: 'G', size: 84, at: w(1) },
    { text: 'steht', role: 'D', size: 70, at: w(2) },
    { text: 'ein', role: 'D', size: 70, at: w(3) },
  ], SW / 2, 250, { seed: 4 });
  row(ctx, t, [{ text: 'Stahltank,', role: 'G', size: 132, at: w(4) }], SW / 2, 395, { seed: 5 });
  row(ctx, t, [
    { text: 'so', role: 'D', size: 76, at: w(5) },
    { text: 'hoch', role: 'G', size: 96, at: w(6) },
    { text: 'wie', role: 'D', size: 76, at: w(7) },
    { text: 'ein', role: 'D', size: 76, at: w(8) },
  ], SW / 2, 1530, { seed: 6 });
  row(ctx, t, [
    { text: 'fünfstöckiges', role: 'G', size: 96, at: w(9) },
    { text: 'Haus.', role: 'D', size: 96, at: w(10) },
  ], SW / 2, 1640, { seed: 7 });
}

// ============================================================= 5 · INSIDE
// Cutaway: the tank is cut open like paper, the syrup level rises, the odometer counts the litres.
function inside(ctx, t) {
  const t0 = CUT.inside, u = t - t0;
  const w = (i) => W_('m05', i);
  bg(ctx);
  ctx.save();
  const z = lerp(1.0, 1.12, ease.inOutCubic(clamp(u / 3.8)));
  camera(ctx, t, { y: SH / 2 - 40, z }, 1, 13);
  const base = 1190, tw = 860, th = 440, cx = SW / 2;
  tank(ctx, cx, base, tw, th, { rings: TANK_RINGS, t, label: 0 });
  // cut-open window (torn paper edge), syrup inside rising to the brim
  const open = ease.outCubic(clamp((t - w(0)) / 0.45));
  if (open > 0) {
    const wx0 = cx - tw * 0.4, wx1 = cx + tw * 0.4, wy0 = base - th + 40, wy1 = base - 20;
    const r = rng(17);
    const edge = [];
    for (let i = 0; i <= 24; i++) edge.push([lerp(wx0, wx1, i / 24), wy0 + (r() - 0.5) * 14]);
    const right = [], bottom = [], left = [];
    for (let i = 0; i <= 12; i++) right.push([wx1 + (r() - 0.5) * 14, lerp(wy0, wy1, i / 12)]);
    for (let i = 0; i <= 24; i++) bottom.push([lerp(wx1, wx0, i / 24), wy1 + (r() - 0.5) * 14]);
    for (let i = 0; i <= 12; i++) left.push([wx0 + (r() - 0.5) * 14, lerp(wy1, wy0, i / 12)]);
    const poly = [...edge, ...right, ...bottom, ...left];
    // window grows from the centre
    ctx.save();
    ctx.translate(cx, (wy0 + wy1) / 2); ctx.scale(open, open); ctx.translate(-cx, -(wy0 + wy1) / 2);
    ctx.fillStyle = 'rgb(28,24,21)';
    ctx.beginPath(); poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip();
    const lvl = lerp(wy1 + 10, wy0 + 30, ease.inOutCubic(clamp((t - w(2)) / (w(5) - w(2) + 0.2))));
    const m = liquidBegin(ctx);
    fillBelow(m, surface(wx0 - 20, wx1 + 20, lvl, t, { amp: 6, seed: 4, freq: 0.01, speed: 0.3 }));
    liquidEnd(ctx, { depth: 8, top: lvl, bottom: wy1 + 40, t });
    ctx.restore();
    // paper edge of the cut
    ctx.strokeStyle = rgba(P.card); ctx.lineWidth = 10; ctx.lineJoin = 'round';
    ctx.beginPath(); poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  // litres counter (8.700.000 L) rolling from "neun" to "Liter"
  const cnt = clamp((t - w(2)) / (w(4) + 0.35 - w(2)));
  if (t > w(1)) {
    const k = pop(t, w(1));
    ctx.save();
    ctx.translate(SW / 2, 420); ctx.scale(lerp(0.4, 1, k), lerp(0.4, 1, k));
    odometer(ctx, 0, 0, Math.round(ease.outCubic(cnt) * 8700000), 7, { size: 112, unit: 'L' });
    ctx.restore();
    row(ctx, t, [{ text: 'fast', role: 'D', size: 64, at: w(1) }], SW / 2 - 330, 315, { seed: 8 });
  }
  row(ctx, t, [{ text: 'Darin:', role: 'D', size: 70, at: w(0) }], SW / 2, 230, { seed: 9 });
  // MELASSE in the liquid itself
  if (t >= w(5)) {
    const k = pop(t, w(5), 0.8);
    const m = liquidBegin(ctx);
    m.save(); m.translate(SW / 2, 640); m.scale(lerp(1.4, 1, k), lerp(1.4, 1, k));
    setFont(m, 'G', 170); m.textAlign = 'center'; m.fillText('MELASSE', 0, 0); m.letterSpacing = '0px';
    m.restore();
    liquidEnd(ctx, { depth: 8, top: 520, bottom: 660, t });
  }
  // "zäher": letters pull apart, held together by strings of syrup
  if (t >= w(6)) {
    const ts = t - w(6);
    const spread = ease.outCubic(clamp(ts / 0.9)) * 26;
    const m = liquidBegin(ctx);
    const xs = [];
    const g = letters(m, 'zäher,', SW / 2, 1410, 'DB', 150, (i, n) => { const dx = (i - (n - 1) / 2) * spread; xs.push(dx); return { dx }; }, { align: 'center' });
    for (let i = 0; i < g.list.length - 2; i++) {
      const a = g.list[i], b = g.list[i + 1];
      strand(m, g.x + a.x + a.w * 0.8 + xs[i], 1380, g.x + b.x + b.w * 0.2 + xs[i + 1], 1380, 7, 7, 0.25);
    }
    liquidEnd(ctx, { depth: 6, top: 1290, bottom: 1430, t });
  }
  row(ctx, t, [{ text: 'schwarzer', role: 'G', size: 104, at: w(7) }], SW / 2, 1535, { seed: 10 });
  // Zuckersirup — the i-dot is a sugar cube
  if (t >= w(8)) {
    const b = row(ctx, t, [{ text: 'Zuckersırup.', role: 'D', size: 110, at: w(8) }], SW / 2, 1650, { seed: 11 })[0];
    const k = pop(t, w(8) + 0.08, 0.7);
    setFont(ctx, 'D', 110);
    const pre = ctx.measureText('Zuckers').width, iw = ctx.measureText('ı').width;
    ctx.letterSpacing = '0px';
    const x = b.x + pre + iw / 2 + 4, y = 1650 - 96;
    ctx.save(); ctx.translate(x, y - (1 - k) * 60); ctx.rotate(0.3 + (1 - k) * 2);
    ctx.fillStyle = 'rgb(250,248,242)'; ctx.fillRect(-13, -13, 26, 26);
    ctx.fillStyle = 'rgb(205,198,186)'; ctx.fillRect(-13, 7, 26, 6); ctx.fillRect(7, -13, 6, 26);
    ctx.strokeStyle = rgba(P.ink); ctx.lineWidth = 2; ctx.strokeRect(-13, -13, 26, 26);
    ctx.restore();
  }
}

export const SCENES_A = [
  { id: 'hook', start: 0, end: CUT.sirup, draw: hook, blur: () => 1 },
  { id: 'sirup', start: CUT.sirup, end: CUT.boston, draw: sirup, blur: () => 1 },
  { id: 'boston', start: CUT.boston, end: CUT.tank, draw: boston, blur: () => 1 },
  { id: 'tank', start: CUT.tank, end: CUT.inside, draw: tankScene, blur: () => 1 },
  { id: 'inside', start: CUT.inside, end: CUT.rattle, draw: inside, blur: () => 1 },
];
