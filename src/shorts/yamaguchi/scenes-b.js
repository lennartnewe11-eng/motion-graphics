// Scenes 5–8: burns / eardrums / blind, the night and the train home, bandaged to the office, telling the boss.
import { SW, SH, img, canvas, camera, shake, plate, handCircle, handStroke, tornPath, tornShadow, pathPts } from '../lib/collage.js';
import { setFont, measure, pop, hand } from '../lib/type.js';
import { L, W_, WE, CUT } from './timeline.js';
import {
  TAU, clamp, lerp, ease, noise3, rng, rgba, V, R, night, specks, flap, word, tag, fallingWord, flash,
  man, mushroom, band,
} from './common.js';

// letters thrown outward from the word's centre (k 0..1)
function burst(ctx, t, text, x, y, at, k, { role = R.G, size = 140, color = V.snow, seed = 3 } = {}) {
  if (t < at) return;
  const p = pop(t, at, 1.2);
  setFont(ctx, role, size);
  ctx.letterSpacing = '0px';
  const ws = [...text].map((c) => ctx.measureText(c).width);
  const tot = ws.reduce((a, b) => a + b, 0);
  const r = rng(seed);
  let ox = x - tot / 2;
  [...text].forEach((c, i) => {
    const u = (ox + ws[i] / 2 - x) / tot;
    ctx.save();
    ctx.translate(ox + ws[i] / 2 + u * 700 * k, y + (r() - 0.5) * 300 * k);
    ctx.rotate((r() - 0.5) * 1.6 * k);
    ctx.scale(lerp(0.3, 1, p), lerp(0.3, 1, p));
    ctx.globalAlpha *= clamp(p * 4) * (1 - k * 0.6);
    ctx.fillStyle = rgba(color); ctx.textAlign = 'center';
    ctx.fillText(c, 0, 0);
    ctx.restore();
    ox += ws[i];
  });
}
// a photograph inside the letters of a word
let TT = null;
function imageInWord(ctx, text, key, x, y, role, size, { alpha = 1, ix = 0.5, iy = 0.5 } = {}) {
  if (!TT) TT = canvas(SW, SH);
  const c = TT.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over';
  c.clearRect(0, 0, SW, SH);
  setFont(c, role, size); c.letterSpacing = '0px';
  c.textAlign = 'center';
  c.fillStyle = '#000';
  c.fillText(text, x, y);
  const m = measure(c, text, role, size);
  c.globalCompositeOperation = 'source-in';
  const im = img(key);
  const bw = m.w, bh = m.asc + m.desc;
  const sc = Math.max(bw / im.width, bh / im.height) * 1.1;
  c.drawImage(im, x - bw / 2 - (im.width * sc - bw) * ix, y - m.asc - (im.height * sc - bh) * iy, im.width * sc, im.height * sc);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha *= alpha;
  ctx.drawImage(TT, 0, 0);
  ctx.restore();
}
// paper bandage strips (the only white: torn strips wrapped over the silhouette)
function bandage(ctx, x, y, w, h, rot, k, seed) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  const ww = w * ease.outCubic(clamp(k));
  pathPts(ctx, tornPath(ww, h, seed, { sides: 'lr', amp: 5, step: 6 }), -w / 2, -h / 2);
  ctx.fillStyle = 'rgb(226,224,216)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,110,100,0.35)'; ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + (h * i) / 4); ctx.lineTo(-w / 2 + ww, -h / 2 + (h * i) / 4 + 2); ctx.stroke(); }
  ctx.restore();
}

// ================================================================ 5 · BURN
export function burn(ctx, t) {
  const t0 = CUT.burn;
  const u = t - t0;
  const w = (i) => W_('y07', i);
  const tb = w(9); // "vorübergehend blind"
  night(ctx, [30, 22, 24], V.ink);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.08, ease.inOutSine(clamp(u / 5))) }, 1.2, 11);
  ctx.globalAlpha = 0.28;
  plate(ctx, 'plate_hiro2', { x: 0.4, y: 0.6, z: 1.2 });
  ctx.globalAlpha = 1;
  specks(ctx, t, { n: 70, seed: 13, vy: -140, vx: 20, size: 5, alpha: 0.8, color: [255, 120, 70] });
  const hx = SW / 2, feet = 1980, H = 1250, head = feet - H + 110;
  man(ctx, hx, feet, H, { rim: 0.5, burn: ease.inOutCubic(clamp((t - w(3) + 0.1) / 0.6)) * (0.85 + 0.15 * noise3(t * 5, 1, 1)), t, sway: 1 });
  // the dividing line: his left side
  if (t >= w(1) && t < w(4)) {
    ctx.save(); ctx.setLineDash([14, 10]);
    handStroke(ctx, [[hx, head - 140], [hx, feet - 20]], clamp((t - w(1)) / 0.3), { width: 4, color: V.snow, t, seed: 3 });
    ctx.restore();
    hand(ctx, 'links', hx + 170, head + 120, t, w(1) + 0.1, { size: 70, color: V.snow, dur: 0.3 });
  }
  // the eardrums: rings around the head, then they snap
  if (t >= w(4) && t < tb) {
    const snap = t >= w(6);
    for (let side of [-1, 1]) for (let i = 0; i < 4; i++) {
      const k = ((t - w(4)) * 1.6 + i * 0.25) % 1;
      ctx.save();
      ctx.strokeStyle = rgba(snap ? V.accent : V.snow, (1 - k) * 0.9);
      ctx.lineWidth = 4;
      ctx.beginPath();
      const r = 40 + k * 200, a0 = side > 0 ? -0.9 : Math.PI - 0.9;
      const gap = snap ? 0.5 + noise3(i, t * 8, side) * 0.3 : 0;
      ctx.arc(hx + side * 60, head + 40, r, a0 + gap, a0 + 1.8 - gap);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
  // blind: the world whites out
  if (t >= tb) {
    const k = ease.outCubic(clamp((t - tb) / 0.6));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(240,236,228,${0.9 * k})`; ctx.fillRect(0, 0, SW, SH);
    ctx.restore();
  }
  // type
  if (t < w(4)) {
    word(ctx, t, 'Seine linke', SW / 2, 300, w(0), { role: R.D, size: 92, color: V.snow, seed: 1 });
    word(ctx, t, 'KÖRPERHÄLFTE', SW / 2, 470, w(2), { role: R.LG, size: 180, color: V.snow, seed: 2 });
    if (t >= w(3)) tag(ctx, t, 'VERBRENNT.', SW / 2, 620, w(3), { role: R.G, size: 110, col: V.ink, bgc: V.accent, seed: 3, rot: -0.02 });
  } else if (t < tb) {
    word(ctx, t, 'Beide', SW / 2, 300, w(4), { role: R.D, size: 92, color: V.snow, seed: 4 });
    word(ctx, t, 'TROMMELFELLE', SW / 2, 470, w(5), { role: R.LG, size: 180, color: V.snow, seed: 5 });
    burst(ctx, t, 'PLATZEN.', SW / 2, 640, w(6), ease.outCubic(clamp((t - w(6) - 0.1) / 0.5)) * 0.35, { role: R.G, size: 130, color: V.accent, seed: 6 });
  } else {
    word(ctx, t, 'Er ist vorübergehend', SW / 2, 820, w(7), { role: R.D, size: 84, color: V.ink, seed: 7 });
    if (t >= w(10)) {
      ctx.save(); ctx.filter = `blur(${(3 + 3 * Math.sin(t * 3)).toFixed(1)}px)`;
      word(ctx, t, 'BLIND.', SW / 2, 1080, w(10), { role: R.G, size: 260, color: V.ink, seed: 8 });
      ctx.restore();
    }
  }
}
export const burnBlur = () => 2;

// ============================================================== 6 · SHELTER
// The night underground; at dawn the train home (Hiroshima -> Nagasaki on the board).
export function shelterScene(ctx, t) {
  const t0 = CUT.shelter;
  const u = t - t0;
  const w = (i) => W_('y08', i);
  const td = w(7); // "Am nächsten Morgen"
  if (t < td) {
    night(ctx, [8, 9, 14], V.ink, false);
    // ruins on the horizon, lit by fires; the ground line; a pocket of light below it
    const gy = 1000;
    ctx.save();
    ctx.globalAlpha = 0.5;
    const im = img('plate_hiro');
    const ww = SW * 1.4, hh = (im.height / im.width) * ww;
    ctx.filter = 'brightness(0.35)';
    ctx.drawImage(im, SW / 2 - ww / 2, gy - hh * 0.62, ww, hh * 0.62);
    ctx.filter = 'none';
    ctx.restore();
    const fg = ctx.createLinearGradient(0, gy - 260, 0, gy);
    fg.addColorStop(0, rgba(V.accent, 0)); fg.addColorStop(1, rgba(V.accent, 0.35 + 0.08 * Math.sin(t * 7)));
    ctx.fillStyle = fg; ctx.fillRect(0, gy - 260, SW, 260);
    ctx.fillStyle = rgba([12, 12, 16]); ctx.fillRect(0, gy, SW, SH - gy);
    ctx.fillStyle = rgba(V.steel, 0.6); ctx.fillRect(0, gy, SW, 3);
    // the shelter: a lit hollow in the earth
    const k = ease.outCubic(clamp((t - w(4)) / 0.5));
    const lx = SW / 2, ly = 1430;
    const g = ctx.createRadialGradient(lx, ly, 10, lx, ly, 420);
    g.addColorStop(0, `rgba(255,214,160,${0.45 * k})`); g.addColorStop(1, 'rgba(255,214,160,0)');
    ctx.fillStyle = g; ctx.fillRect(lx - 420, ly - 420, 840, 840);
    man(ctx, lx, 1640, 420, { alpha: 0.9, t });
    specks(ctx, t, { n: 30, seed: 17, vy: -40, vx: 8, size: 4, alpha: 0.6, color: [255, 120, 70] });
    word(ctx, t, 'Er verbringt die', SW / 2, 330, w(0), { role: R.D, size: 88, color: V.snow, seed: 1 });
    word(ctx, t, 'NACHT', SW / 2, 560, w(3), { role: R.LG, size: 260, color: V.snow, seed: 2 });
    if (t >= w(6)) fallingWord(ctx, t, 'LUFTSCHUTZKELLER', SW / 2, 1130, w(6), w(6) + 0.25, { role: R.LG, size: 116, color: V.fog, stagger: 0.015, g: 260 });
  } else {
    const k = clamp((t - td) / 0.8);
    night(ctx, [40, 44, 56], [14, 16, 22]);
    ctx.save();
    camera(ctx, t, { z: 1.02 }, 1, 12);
    const x = lerp(SW + 500, 160, ease.inOutSine(clamp((t - td) / 2.6)));
    band(ctx, 'plate_ueno', x, 1180, 1500, 940, { ix: 0.55, iy: 0.4, z: 1.0, rot: 0.02, seed: 33 });
    man(ctx, 840, 1990, 760, { t });
    ctx.restore();
    setFont(ctx, R.M5, 30); ctx.fillStyle = rgba(V.steel); ctx.textAlign = 'left';
    ctx.fillText('VON', 120, 250); ctx.fillText('NACH', 120, 440); ctx.letterSpacing = '0px';
    flap(ctx, 'HIROSHIMA', 120, 320, t, w(10), { size: 88, cellW: 72, gap: 8, seed: 61, stagger: 0.02 });
    flap(ctx, 'NAGASAKI', 120, 510, t, w(13) - 0.1, { size: 88, cellW: 72, gap: 8, seed: 62, stagger: 0.02, accent: [0, 1, 2, 3, 4, 5, 6, 7] });
    word(ctx, t, 'Am nächsten Morgen', SW / 2, 700, td, { role: R.D, size: 80, color: V.snow, seed: 3, alpha: k });
    if (t >= w(14)) tag(ctx, t, 'NACH HAUSE.', SW / 2, 1700, w(14), { role: R.G, size: 110, col: V.ink, bgc: V.snow, seed: 4, rot: -0.02 });
  }
}
export const shelterSceneBlur = () => 2;

// =============================================================== 7 · OFFICE
// 9 August. Bandaged, back at work: Nagasaki from the air (before), the board, the bandages.
export function office(ctx, t) {
  const t0 = CUT.office;
  const u = t - t0;
  const w = (i) => W_('y09', i);
  night(ctx, V.night, V.ink);
  ctx.save();
  camera(ctx, t, { z: lerp(1.0, 1.06, ease.inOutSine(clamp(u / 4.6))) }, 1, 13);
  ctx.globalAlpha = 0.55;
  plate(ctx, 'plate_naga_before', { x: 0.5, y: 0.5, z: 1.0 + u * 0.01 });
  ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(0, 0, 0, SH);
  g.addColorStop(0, 'rgba(9,12,17,0.85)'); g.addColorStop(0.45, 'rgba(9,12,17,0.25)'); g.addColorStop(1, 'rgba(9,12,17,0.9)');
  ctx.fillStyle = g; ctx.fillRect(-100, -100, SW + 200, SH + 200);
  const hx = SW / 2 + 80, feet = 1990, H = 1050, top = feet - H;
  man(ctx, hx, feet, H, { t, sway: 1 });
  // bandages: head, then the left arm and side
  bandage(ctx, hx - 10, top + 120, 190, 44, -0.18, clamp((t - w(3)) / 0.25), 71);
  bandage(ctx, hx + 20, top + 175, 170, 40, 0.12, clamp((t - w(3) - 0.12) / 0.25), 72);
  bandage(ctx, hx + 40, top + 470, 230, 50, -0.35, clamp((t - w(3) - 0.24) / 0.25), 73);
  ctx.restore();
  flap(ctx, '09', 100, 300, t, w(0), { size: 96, cellW: 76, gap: 8, seed: 81 });
  flap(ctx, 'AUG', 100 + 2 * 84 + 28, 300, t, w(1), { size: 96, cellW: 76, gap: 8, seed: 82 });
  flap(ctx, '1945', 100 + 5 * 84 + 56, 300, t, w(1) + 0.1, { size: 96, cellW: 76, gap: 8, seed: 83, accent: [0, 1, 2, 3] });
  if (t >= w(2)) tag(ctx, t, 'MIT VERBÄNDEN', 330, 520, w(3), { role: R.G, size: 84, col: V.ink, bgc: V.snow, seed: 84, rot: -0.04 });
  word(ctx, t, 'zur Arbeit,', 300, 680, w(6), { role: R.D, size: 80, color: V.snow, seed: 85 });
  word(ctx, t, 'ins Büro der Werft', 330, 1360, w(8), { role: R.D, size: 72, color: V.snow, seed: 86 });
  if (t >= w(13)) tag(ctx, t, 'NAGASAKI', 320, 1520, w(13), { role: R.LG, size: 170, col: V.ink, bgc: V.accent, seed: 87, rot: -0.03 });
}
export const officeBlur = () => 1;

// ================================================================= 8 · BOSS
// He tells his boss: one bomb, a whole city. The city is inside the letters — and falls out of them.
export function boss(ctx, t) {
  const t0 = CUT.boss;
  const u = t - t0;
  const w = (i) => W_('y10', i);
  night(ctx, [20, 22, 30], V.ink);
  ctx.save();
  camera(ctx, t, { z: 1.0 + u * 0.008 }, 1, 14);
  // two figures facing each other: Yamaguchi (bandaged) and the boss (the same cut-out, mirrored, in grey)
  ctx.save(); ctx.globalAlpha = 0.85; ctx.filter = 'brightness(3.2)';
  man(ctx, 860, 1990, 960, { flip: true, t, sway: 1, rim: 0.25 });
  ctx.filter = 'none'; ctx.restore();
  man(ctx, 230, 1990, 900, { t, sway: 1, rim: 0.55 });
  bandage(ctx, 225, 1205, 170, 40, -0.18, 1, 71);
  ctx.restore();
  word(ctx, t, 'Er erzählt seinem Chef:', SW / 2, 300, w(0), { role: R.D, size: 70, color: V.fog, seed: 1 });
  if (t >= w(4)) {
    setFont(ctx, R.DB, 240); ctx.fillStyle = rgba(V.accent); ctx.textAlign = 'left'; ctx.globalAlpha = clamp((t - w(4)) / 0.15);
    ctx.fillText('„', 60, 560); ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
  }
  if (t < w(8)) {
    word(ctx, t, 'Eine einzige', SW / 2, 520, w(4), { role: R.D, size: 96, color: V.snow, seed: 2 });
    if (t >= w(6)) {
      const k = pop(t, w(6), 0.9);
      ctx.save(); ctx.translate(SW / 2, 820); ctx.scale(lerp(1.5, 1, k), lerp(1.5, 1, k)); ctx.globalAlpha = clamp(k * 3);
      setFont(ctx, R.G, 230); ctx.fillStyle = rgba(V.snow); ctx.textAlign = 'center'; ctx.fillText('BOMBE', 0, 0);
      ctx.restore(); ctx.letterSpacing = '0px';
    }
  } else {
    word(ctx, t, 'eine ganze', SW / 2, 520, w(8), { role: R.D, size: 96, color: V.snow, seed: 3 });
    const tz = w(11) + 0.1;
    if (t < tz) {
      const k = pop(t, w(10), 0.9);
      if (k > 0) imageInWord(ctx, 'STADT', 'plate_hiro', SW / 2, 830, R.G, 300 * lerp(1.3, 1, k), { alpha: clamp(k * 3), ix: 0.5 });
    } else {
      fallingWord(ctx, t, 'STADT', SW / 2, 830, tz - 0.4, tz, { role: R.G, size: 300, color: [150, 150, 150], stagger: 0.06, g: 3400 });
    }
    if (t >= w(11)) word(ctx, t, 'zerstört.', SW / 2, 1040, w(11), { role: R.DB, size: 110, color: V.accent, seed: 4 });
  }
}
export const bossBlur = (t) => (t > W_('y10', 11) ? 2 : 1);
