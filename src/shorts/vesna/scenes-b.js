// Scenes 6–10: the bomb, the break-up, 28 -> 27, wedged in the fuselage, the snowy slope.
import { SW, SH, img, camera, shake, sticker, plate, handCircle, handArrow, handStroke, tornPath, tornShadow, pathPts } from '../lib/collage.js';
import { setFont, measure, pop, breathe, hand } from '../lib/type.js';
import { L, W_, WE, CUT, BEAT, E8 } from './timeline.js';
import {
  TAU, clamp, lerp, ease, noise3, rng, rgba, inR, V, R, night, cloudField, specks, YU, windowAt, yuaht, PIECE_CX,
  flap, drum, word, tag, fallingWord, marker, flash, fireball,
} from './common.js';

// screen position of an image point of YU-AHT drawn by yuaht(ctx, x, y, s, rot) (centred on the image middle)
const yuPt = (x, y, s, rot, px, py, ix = YU.w / 2, iy = YU.h / 2) => {
  const dx = (px - ix) * s, dy = (py - iy) * s;
  return [x + dx * Math.cos(rot) - dy * Math.sin(rot), y + dx * Math.sin(rot) + dy * Math.cos(rot)];
};
// letters spread apart and tumble (k 0..1)
function splitWord(ctx, t, text, x, y, at, k, { role = R.G, size = 130, color = V.snow, seed = 3 } = {}) {
  if (t < at) return;
  const p = pop(t, at);
  setFont(ctx, role, size);
  ctx.letterSpacing = '0px';
  const ws = [...text].map((c) => ctx.measureText(c).width);
  const total = ws.reduce((a, b) => a + b, 0);
  const r = rng(seed);
  let ox = x - total / 2;
  [...text].forEach((c, i) => {
    const u = (i + 0.5) / text.length - 0.5;
    const dx = u * 900 * k + (r() - 0.5) * 80 * k, dy = (r() - 0.5) * 260 * k + k * k * 300 * r();
    ctx.save();
    ctx.translate(ox + ws[i] / 2 + dx, y + dy);
    ctx.rotate((r() - 0.5) * 2.4 * k);
    ctx.scale(lerp(0.3, 1, p), lerp(0.3, 1, p));
    ctx.globalAlpha *= clamp(p * 4);
    ctx.fillStyle = rgba(color);
    ctx.textAlign = 'center';
    ctx.fillText(c, 0, 0);
    ctx.restore();
    ox += ws[i];
  });
}

// ================================================================ 6 · BOMB
// Above the cloud sea of Czechoslovakia, 10 km up. The forward hold is marked — then it goes off.
export function bomb(ctx, t) {
  const t0 = CUT.bomb;
  const u = t - t0;
  const w = (i) => W_('v07', i);
  const tb = w(7); // "Bombe"
  const [sx, sy, sr] = shake(t, tb, 60, 1.0, 26);
  night(ctx, [12, 16, 24], V.ink);
  ctx.save();
  // the cloud sea (B-17 photograph, 1940) far below, drifting
  ctx.globalAlpha = 0.55;
  plate(ctx, 'plate_cloudsea', { x: 0.3 + u * 0.03, y: 0.62, z: 1.05 });
  ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(0, 0, 0, SH);
  g.addColorStop(0, 'rgba(9,12,17,0.92)'); g.addColorStop(0.5, 'rgba(9,12,17,0.25)'); g.addColorStop(1, 'rgba(9,12,17,0.7)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  // zoom towards the hold on "im Gepäckraum"
  const zk = ease.inOutCubic(clamp((t - w(4) + 0.1) / 0.6));
  const S = 0.44;
  const px = SW / 2 + 40, py = 1000 + Math.sin(u * 2) * 8;
  const [hx, hy] = yuPt(px, py, S, 0, YU.hold[0], YU.hold[1]);
  const Z = lerp(1, 2.1, zk);
  ctx.translate(SW / 2 + sx, SH / 2 + sy);
  ctx.rotate(sr);
  ctx.scale(Z, Z);
  ctx.translate(-lerp(SW / 2, hx + 80, zk), -lerp(SH / 2, hy - 60, zk));
  cloudField(ctx, u, { seed: 41, n: 5, speed: -200, dir: 'left', layer: 'back', zmin: 0.3, zmax: 0.9, size: 0.5, lane: 0.12, alpha: 0.8 });
  if (t < tb + 0.05) yuaht(ctx, px, py, S, Math.sin(u * 1.3) * 0.01);
  // the hold, marked like evidence: dashed outline + label
  if (t >= w(4) - 0.05 && t < tb + 0.1) {
    const k = ease.outCubic(clamp((t - w(4) + 0.05) / 0.3));
    const [bw, bh] = [YU.hold[2] * S, YU.hold[3] * S];
    ctx.save();
    ctx.strokeStyle = rgba(V.orange);
    ctx.lineWidth = 4 / Z;
    ctx.setLineDash([12 / Z, 9 / Z]);
    ctx.lineDashOffset = -t * 40;
    ctx.strokeRect(hx - bw / 2, hy - bh / 2, bw * k, bh);
    ctx.setLineDash([]);
    ctx.fillStyle = rgba(V.orange, 0.22 * k);
    ctx.fillRect(hx - bw / 2, hy - bh / 2, bw * k, bh);
    ctx.restore();
    if (t >= w(5)) {
      setFont(ctx, R.M, 34 / Z * 1.6);
      ctx.fillStyle = rgba(V.orange);
      ctx.textAlign = 'left';
      ctx.fillText('GEPÄCKRAUM', hx - bw / 2, hy + bh / 2 + 52 / Z * 1.4);
      ctx.letterSpacing = '0px';
    }
  }
  // the explosion
  if (t >= tb) {
    const k = t - tb;
    fireball(ctx, hx, hy, 0.42, t, tb, { rot: -0.2 });
    // pieces start to separate (the break-up continues in the next scene)
    const sep = ease.outCubic(clamp(k / 0.6));
    for (let i = 0; i < 4; i++) {
      const [cx, cy] = yuPt(px, py, S, 0, PIECE_CX[i], YU.h / 2);
      const dir = i - 1.4;
      yuaht(ctx, cx + dir * 60 * sep, cy + (i === 1 ? -40 : 20 * dir) * sep, S, dir * 0.08 * sep, { piece: i, ix: PIECE_CX[i], burn: clamp(k * 3) });
    }
    fireball(ctx, hx + 40, hy - 20, 0.28, t, tb + 0.08, { rot: 0.6 });
  }
  ctx.restore();
  flash(ctx, t, tb, { dur: 0.22, peak: 0.95, color: [255, 236, 210] });

  // ---- type
  if (t < tb) {
    word(ctx, t, 'Über der', SW / 2, 330, w(0), { role: R.D, size: 86, color: V.snow, seed: 2 });
    word(ctx, t, 'TSCHECHOSLOWAKEI', SW / 2, 500, w(2), { role: R.LG, size: 168, color: V.snow, seed: 3 });
    if (t >= w(2) + 0.2) {
      setFont(ctx, R.M5, 30);
      ctx.fillStyle = rgba(V.fog);
      ctx.textAlign = 'center';
      ctx.fillText('ČSSR · 50°49′ N  14°21′ O · 10 160 m'.slice(0, Math.floor((t - w(2) - 0.2) * 60)), SW / 2, 580);
      ctx.letterSpacing = '0px';
    }
    if (t >= w(3)) {
      const j = (t - w(3)) < 0.4 ? 1 : 0.25;
      word(ctx, t, 'explodiert', SW / 2 + noise3(t * 40, 1, 1) * 8 * j, 1500, w(3), { role: R.DB, size: 120, color: V.snow, seed: 4 });
    }
  } else {
    // BOMBE: letters blast outward from the hold
    const k = ease.outCubic(clamp((t - tb) / 0.9));
    splitWord(ctx, t, 'BOMBE', SW / 2, 1520, tb, k * 0.3, { role: R.G, size: 260, color: V.orange, seed: 7 });
    word(ctx, t, 'eine', SW / 2, 1270, tb - 0.15, { role: R.D, size: 90, color: V.snow, seed: 5, alpha: 1 - k });
  }
}
export const bombBlur = (t) => (t > W_('v07', 7) - 0.02 ? 3 : 2);

// ============================================================= 7 · BREAKUP
// The DC-9 breaks apart: four pieces, scorched edges, debris, the fall begins (clouds start to rise).
export function breakup(ctx, t) {
  const t0 = CUT.breakup;
  const u = t - t0;
  const w = (i) => W_('v08', i);
  const tb = W_('v07', 7);
  const k = t - tb; // seconds since the blast
  const [sx, sy, sr] = shake(t, tb, 50, 2.2, 20);
  night(ctx, [12, 16, 24], [30, 36, 48]);
  ctx.save();
  camera(ctx, t, { x: SW / 2 + sx, y: SH / 2 + sy, z: lerp(1.15, 0.92, ease.outCubic(clamp(u / 2))), r: sr }, 1.2, 8);
  // from level flight into the fall: the clouds turn from sideways to upward
  const fallK = ease.inOutCubic(clamp(u / 1.6));
  cloudField(ctx, u, { seed: 51, n: 7, speed: -180 * (1 - fallK), dir: 'left', layer: 'back', zmin: 0.3, zmax: 1, size: 0.55, lane: 0.14, alpha: 1 - fallK });
  cloudField(ctx, u * u * 0.5, { seed: 53, n: 8, speed: 900, layer: 'back', zmin: 0.3, zmax: 1, size: 0.7, lane: 0.2, alpha: fallK });
  // fire behind the pieces
  const S = 0.62;
  const cx = SW / 2 + 60, cy = 1000;
  fireball(ctx, cx - 420, cy - 30, 0.75, t, tb, { rot: -0.2 });
  // the four pieces: each its own drift, spin and drop
  const r = rng(77);
  const spec = [
    { dx: -520, dy: 420, rot: -1.6 },  // nose: falls away fast
    { dx: -160, dy: -260, rot: 0.9 },  // forward hold: blown up
    { dx: 90, dy: 260, rot: -0.55 },   // centre section: Vesna
    { dx: 520, dy: 120, rot: 1.25 },   // tail
  ];
  spec.forEach((p, i) => {
    const e = ease.outCubic(clamp(k / 2.4));
    const drop = Math.max(0, k - 0.5) ** 2 * 180;
    const [bx, by] = yuPt(cx, cy, S, 0, PIECE_CX[i], YU.h / 2);
    yuaht(ctx, bx + p.dx * e, by + p.dy * e + drop, S * (i === 2 ? lerp(1, 1.18, e) : 1), p.rot * e + noise3(t * 2, i, 1) * 0.05, { piece: i, ix: PIECE_CX[i], burn: clamp(1.2 - k * 0.3) });
  });
  // debris: small fragments cut from the fuselage photo
  const im = img('yuaht');
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, sp = 300 + r() * 900, sz = 14 + r() * 46;
    const ix = 300 + r() * 1700, iy = 120 + r() * 300;
    const kk = clamp(k / 2.2);
    const x = cx - 200 + Math.cos(a) * sp * kk * 1.4, y = cy + Math.sin(a) * sp * kk + kk * kk * 600;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r() * TAU + k * (r() - 0.5) * 12);
    ctx.beginPath(); ctx.moveTo(-sz / 2, -sz * 0.3); ctx.lineTo(sz * 0.4, -sz / 2); ctx.lineTo(sz / 2, sz * 0.4); ctx.lineTo(-sz * 0.2, sz / 2); ctx.closePath();
    ctx.clip();
    ctx.drawImage(im, ix, iy, sz * 2.2, sz * 2.2, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
  }
  // embers
  specks(ctx, t, { n: 50, seed: 12, vy: -260, vx: 60, size: 5, alpha: 0.85 * (1 - clamp(k / 2.6)), color: V.ember });
  ctx.restore();

  // ---- type: "Die DC-9 bricht in der Luft auseinander."
  word(ctx, t, 'Die', SW / 2 - 300, 330, w(0), { role: R.D, size: 96, color: V.snow, seed: 1 });
  if (t >= w(1)) flap(ctx, 'DC-9', SW / 2 - 140, 320, t, w(1) - 0.05, { size: 100, cellW: 76, gap: 8, seed: 9, stagger: 0.03, dur: 0.3 });
  word(ctx, t, 'bricht', SW / 2, 520, w(2), { role: R.G, size: 150, color: V.snow, seed: 2, rot: -0.04 });
  word(ctx, t, 'in der Luft', SW / 2, 650, w(3), { role: R.D, size: 96, color: V.snow, seed: 3 });
  splitWord(ctx, t, 'AUSEINANDER', SW / 2, 1560, w(6), ease.outCubic(clamp((t - w(6) - 0.15) / 0.8)) * 0.35, { role: R.LG, size: 210, color: V.orange, seed: 5 });
}
export const breakupBlur = () => 3;

// =============================================================== 8 · COUNT
// 28 lit windows, cut from the fuselage photograph. 27 go dark. One stays — orange.
const WIN = [];
for (let k = 0; k < 33 && WIN.length < 28; k++) if (k !== 20 && k !== 22 && k !== 26 && k !== 28 && k !== 30) WIN.push(k);
const SURVIVOR = 17; // index into WIN: the window that stays lit
export function count(ctx, t) {
  const t0 = CUT.count;
  const u = t - t0;
  const w = (i) => W_('v09', i);
  night(ctx, V.night, V.ink);
  ctx.save();
  camera(ctx, t, { z: 1 + u * 0.01 }, 1, 9);
  // two torn strips of the fuselage: 14 windows each
  const im = img('yuaht');
  const sc = 2.3;
  const strips = [WIN.slice(0, 14), WIN.slice(14)];
  const order = rng(5);
  const offT = WIN.map((_, i) => (i === SURVIVOR ? Infinity : w(5) + 0.05 + order() * 1.05));
  strips.forEach((ks, si) => {
    const [x0] = windowAt(ks[0]), [x1] = windowAt(ks[ks.length - 1]);
    const ix = x0 - 26, iw = x1 - x0 + 52, iy = 250, ih = 160;
    const sw = iw * sc, sh = ih * sc;
    const enter = ease.outCubic(clamp((t - t0 - si * 0.12) / 0.5));
    const X = SW / 2 + (si ? 1 : -1) * (1 - enter) * 1200 + (si ? 30 : -30), Y = 860 + si * 470;
    const rot = si ? 0.03 : -0.025;
    ctx.save();
    ctx.translate(X, Y); ctx.rotate(rot);
    ctx.translate(-sw / 2, -sh / 2);
    const pts = tornPath(sw, sh, 60 + si, { sides: 'trbl', amp: 9 });
    const shd = tornShadow(sw, sh, 60 + si, 'trbl', 9, 14);
    ctx.save(); ctx.globalAlpha = 0.6; ctx.drawImage(shd, 8 - shd.pad, 20 - shd.pad); ctx.restore();
    pathPts(ctx, pts);
    ctx.clip();
    ctx.drawImage(im, ix, iy, iw, ih, 0, 0, sw, sh);
    // window lights
    ks.forEach((k) => {
      const i = WIN.indexOf(k);
      const [wx, wy] = windowAt(k);
      const lx = (wx - ix) * sc, ly = (wy - iy) * sc;
      const off = t >= offT[i];
      const surv = i === SURVIVOR && t >= w(5) + 1.2;
      const on = t >= t0 + 0.25 + i * 0.012;
      if (!on) return;
      ctx.save();
      if (off) {
        // the light goes out: the window turns to ink
        const kk = clamp((t - offT[i]) / 0.08);
        ctx.fillStyle = rgba(V.ink, 0.92 * kk);
        ctx.beginPath(); ctx.ellipse(lx, ly, 9.5 * sc, 11.5 * sc, 0, 0, TAU); ctx.fill();
      } else {
        const col = surv ? V.orange : [255, 232, 196];
        const fl = 0.88 + 0.12 * noise3(t * 6, i, 2);
        ctx.fillStyle = rgba(col, 0.95 * fl);
        ctx.beginPath(); ctx.ellipse(lx, ly, 9 * sc, 11 * sc, 0, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'screen';
        const g = ctx.createRadialGradient(lx, ly, 6 * sc, lx, ly, 30 * sc);
        g.addColorStop(0, rgba(col, 0.5 * fl)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(lx - 32 * sc, ly - 32 * sc, 64 * sc, 64 * sc);
      }
      ctx.restore();
    });
    ctx.restore();
    // the survivor's window, circled
    if (si === 1 && t >= w(5) + 1.25) {
      const k = WIN[SURVIVOR];
      const [wx, wy] = windowAt(k);
      const lx = (wx - ix) * sc - sw / 2, ly = (wy - iy) * sc - sh / 2;
      const gx = X + lx * Math.cos(rot) - ly * Math.sin(rot), gy = Y + lx * Math.sin(rot) + ly * Math.cos(rot);
      handCircle(ctx, gx, gy, 62, 70, clamp((t - w(5) - 1.25) / 0.35), { width: 7, color: V.orange, t, seed: 8 });
      hand(ctx, 'eine überlebt', gx + 40, gy + 150, t, w(5) + 1.45, { size: 72, color: V.orange, dur: 0.45, rot: -0.05 });
    }
  });
  ctx.restore();

  // ---- numbers
  if (t < w(5)) {
    if (t >= w(0)) {
      const k = pop(t, w(0), 0.8);
      ctx.save();
      ctx.translate(SW / 2, 470);
      ctx.scale(lerp(1.5, 1, k), lerp(1.5, 1, k));
      setFont(ctx, R.A, 330);
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(V.snow);
      ctx.globalAlpha = clamp(k * 3);
      ctx.fillText('28', 0, 0);
      ctx.restore();
    }
    word(ctx, t, 'Menschen an Bord.', SW / 2, 1660, w(1), { role: R.D, size: 84, color: V.snow, seed: 3 });
  } else {
    // 27 — stamped on the word, while the windows go dark one after another
    const k = pop(t, w(5), 1.2);
    ctx.save();
    ctx.translate(SW / 2, 470);
    ctx.scale(lerp(1.6, 1, k), lerp(1.6, 1, k));
    setFont(ctx, R.A, 330);
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(V.snow);
    ctx.fillText('27', 0, 0);
    ctx.restore();
    if (t >= WE('v09', 5)) word(ctx, t, 'sterben.', SW / 2, 1660, w(6), { role: R.DB, size: 110, color: V.snow, seed: 4 });
  }
}
export const countBlur = () => 1;

// ============================================================== 9 · WEDGED
// The centre section falls, spinning. A loupe on one window: her. Pinned by a service trolley.
export function wedged(ctx, t) {
  const t0 = CUT.wedged;
  const u = t - t0;
  const w = (i) => W_('v10', i);
  night(ctx, [14, 18, 27], [34, 40, 52]);
  ctx.save();
  camera(ctx, t, { z: 1.0 }, 1.4, 10);
  cloudField(ctx, 3 + u, { seed: 61, n: 9, speed: 1100, layer: 'back', zmin: 0.3, zmax: 1, size: 0.7, lane: 0.22 });
  specks(ctx, t, { n: 36, seed: 6, vy: -2400, vx: 0, size: 3, alpha: 0.2, streak: 0.03, color: V.fog });
  const S = 0.95;
  const px = SW / 2 + noise3(t * 0.7, 1, 1) * 30, py = 960 + noise3(t * 0.6, 2, 1) * 30;
  const rot = -0.35 + u * 0.22;
  yuaht(ctx, px, py, S, rot, { piece: 2, ix: PIECE_CX[2], burn: 0.9 });
  cloudField(ctx, 3 + u, { seed: 67, n: 3, speed: 1500, layer: 'front', zmin: 1.2, zmax: 2.2, size: 0.8, lane: 0.3, alpha: 0.85 });
  ctx.restore();
  // loupe on a window of the piece -> her portrait
  const [wx, wy] = windowAt(23);
  const [gx, gy] = yuPt(px, py, S, rot, wx, wy, PIECE_CX[2], YU.h / 2);
  const lk = ease.outBack(clamp((t - w(0) + 0.05) / 0.35));
  if (lk > 0) {
    const LX = 290, LY = 560, LR = 180 * lk;
    ctx.save();
    ctx.strokeStyle = rgba(V.orange);
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(LX + (gx - LX) * 0.2, LY + (gy - LY) * 0.2 + LR * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(gx, gy, 18, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(LX, LY, LR, 0, TAU); ctx.clip();
    ctx.fillStyle = rgba(V.ink); ctx.fillRect(LX - LR, LY - LR, 2 * LR, 2 * LR);
    const im = img('plate_vesna');
    const fs = (2 * LR) / 900;
    ctx.drawImage(im, 380, 380, 900, 900, LX - LR + noise3(t * 2, 1, 5) * 4, LY - LR, 900 * fs, 900 * fs);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = rgba(V.snow); ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(LX, LY, LR, 0, TAU); ctx.stroke();
    ctx.restore();
    hand(ctx, 'Vesna', LX, LY + LR + 80, t, w(0), { size: 84, color: V.orange, dur: 0.35, rot: -0.06 });
  }
  // type: "steckt im Rumpf fest" / "eingeklemmt" squeezed / "SERVIERWAGEN" block
  if (t < w(5)) {
    word(ctx, t, 'steckt', 790, 420, w(1), { role: R.D, size: 96, color: V.snow, seed: 2 });
    tag(ctx, t, 'IM RUMPF', 790, 570, w(2), { role: R.G, size: 96, col: V.ink, bgc: V.snow, seed: 3, rot: 0.03 });
    word(ctx, t, 'fest,', 800, 730, w(4), { role: R.DB, size: 100, color: V.snow, seed: 4 });
  } else {
    // two orange bars close in; the word is crushed between them
    const k = ease.inOutCubic(clamp((t - w(5)) / 0.55));
    const gap = lerp(1000, 760, k);
    const cy = 1440;
    ctx.fillStyle = rgba(V.orange);
    ctx.fillRect(SW / 2 - gap / 2 - 40, cy - 120, 40, 160);
    ctx.fillRect(SW / 2 + gap / 2, cy - 120, 40, 160);
    word(ctx, t, 'EINGEKLEMMT', SW / 2, cy, w(5), { role: R.G, size: 128, color: V.snow, seed: 5, sx: lerp(1, 0.78, k), sy: lerp(1, 1.12, k) });
    word(ctx, t, 'von einem', SW / 2, 1560, w(6), { role: R.D, size: 70, color: V.fog, seed: 6 });
    if (t >= w(8)) tag(ctx, t, 'SERVIERWAGEN', SW / 2, 1680, w(8), { role: R.G, size: 92, col: V.ink, bgc: V.orange, seed: 7, rot: -0.02 });
  }
}
export const wedgedBlur = () => 2;

// =============================================================== 10 · SLOPE
// The section comes down on a snow-covered, wooded slope; the horizon tilts with the hillside.
export function slope(ctx, t) {
  const t0 = CUT.slope;
  const u = t - t0;
  const w = (i) => W_('v11', i);
  const ti = WE('v11', 7) - 0.15; // impact on "Hang"
  const k = clamp(u / (ti - t0));
  const [sx, sy, sr] = shake(t, ti, 80, 1.2, 24);
  night(ctx, [40, 48, 60], [70, 78, 90]);
  ctx.save();
  camera(ctx, t, { x: SW / 2 + sx, y: SH / 2 + sy, z: 1, r: -0.22 + sr }, 1.2, 11);
  cloudField(ctx, 5 + u * 1.3, { seed: 71, n: 6, speed: 700, layer: 'back', zmin: 0.4, zmax: 1, size: 0.8, alpha: 0.7 });
  // the forest comes up (same move as the hook, tilted: a hillside)
  const im = img('plate_snow_a');
  const sc = lerp(0.8, 2.4, ease.inQuad(Math.min(k, 1))) * (SW / im.width) * 1.7;
  const W2 = im.width * sc, H2 = im.height * sc;
  const top = lerp(SH * 0.6, -H2 * 0.38, ease.inQuad(Math.min(k, 1)));
  ctx.drawImage(im, SW / 2 - W2 / 2, top, W2, H2);
  const g = ctx.createLinearGradient(0, top, 0, top + H2 * 0.25);
  g.addColorStop(0, 'rgba(56,64,76,1)'); g.addColorStop(1, 'rgba(56,64,76,0)');
  ctx.fillStyle = g; ctx.fillRect(-400, top - 1, SW + 800, H2 * 0.25);
  ctx.fillStyle = 'rgb(56,64,76)'; ctx.fillRect(-400, -800, SW + 800, top + 800);
  // the section, falling into the trees
  if (t < ti + 0.05) {
    const e = ease.inCubic(k);
    yuaht(ctx, lerp(SW * 0.74, SW * 0.55, e), lerp(-120, 1250, e), lerp(0.85, 1.3, e), 0.4 + u * 0.3, { piece: 2, ix: PIECE_CX[2], burn: 0.6 });
  }
  // snow powder: cloud cut-outs thrown up by the impact
  if (t >= ti) {
    const q = clamp((t - ti) / 1.2);
    for (let i = 0; i < 6; i++) {
      const cim = img(['cloud_a', 'cloud_c', 'cloud_e', 'cloud_b', 'cloud_d', 'cloud_f'][i]);
      const s = lerp(0.3, 1.5 + i * 0.15, ease.outCubic(q));
      ctx.save();
      ctx.translate(SW / 2 + (i - 2.5) * 180 * ease.outCubic(q), 1250 - ease.outCubic(q) * (300 + i * 90));
      ctx.rotate((i - 2.5) * 0.25);
      ctx.scale(s, s);
      ctx.globalAlpha = 1 - ease.inQuad(q) * 0.7;
      ctx.drawImage(cim, -cim.width / 2, -cim.height / 2);
      ctx.restore();
    }
  }
  ctx.restore();
  flash(ctx, t, ti, { dur: 0.18, peak: 0.85 });
  specks(ctx, t, { n: 60, seed: 4, vy: 120, vx: -30, size: 4, alpha: 0.6 });

  // ---- type along the slope
  ctx.save();
  ctx.translate(SW / 2 - 90, 760);
  ctx.rotate(-0.22);
  word(ctx, t, 'Das Wrackteil', -40, -260, w(0), { role: R.D, size: 90, color: V.snow, seed: 1, alpha: t < w(5) ? 1 : 0 });
  if (t < w(5)) tag(ctx, t, 'STÜRZT', 0, -110, w(2), { role: R.G, size: 130, col: V.ink, bgc: V.snow, seed: 2 });
  tag(ctx, t, 'VERSCHNEITEN,', -20, 40, w(5), { role: R.LG, size: 150, col: V.snow, bgc: V.ink, seed: 3 });
  tag(ctx, t, 'BEWALDETEN', 40, 200, w(6), { role: R.LG, size: 150, col: V.snow, bgc: V.ink, seed: 4 });
  ctx.restore();
  if (t >= w(7)) {
    const k2 = pop(t, w(7), 1.3);
    ctx.save();
    ctx.translate(SW / 2, 1560);
    ctx.rotate(-0.22);
    ctx.scale(lerp(2, 1, k2), lerp(2, 1, k2));
    setFont(ctx, R.G, 250);
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(V.orange);
    ctx.fillText('HANG.', 0, 0);
    ctx.restore();
  }
}
export const slopeBlur = (t) => (t < WE('v11', 7) + 0.4 ? 3 : 2);
