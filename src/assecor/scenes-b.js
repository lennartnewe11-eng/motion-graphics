// Part B (16.05 – 32.3 s): the three services (KI, Software, Transformation),
// "Von der Idee bis zur Umsetzung" as a hand-drawn journey and "Alles aus einer Hand."
import { W, H, TAU, clamp, lerp, ease, seg, hash1, noise2 } from '../engine/core.js';
import {
  COL, FT, IMG, setFont, bg, camera, shake, rise, sentence, label, frameMarks, stroke, pts, arrow, hand,
  highlight, cover, photo, pixelIcon, lineIcon, block, cellWipe, measure, rgbaHex,
} from './lib.js';
import { wt } from './timeline.js';

// hand-drawn box (rounded-ish rectangle with overshoot)
const boxPts = (x, y, w, h) => [
  ...pts.line(x - 6, y, x + w + 4, y + 2, 16), ...pts.line(x + w + 4, y + 2, x + w, y + h + 3, 8).slice(1),
  ...pts.line(x + w, y + h + 3, x - 2, y + h, 16).slice(1), ...pts.line(x - 2, y + h, x + 2, y - 8, 8).slice(1),
];
const check = (x, y, s) => [...pts.line(x - s, y, x - s * 0.3, y + s * 0.7, 6), ...pts.line(x - s * 0.3, y + s * 0.7, x + s, y - s * 0.8, 10).slice(1)];

// ------------------------------------------------------------------ KI ---
const ki = {
  start: 16.05, end: 20.05,
  draw(ctx, t) {
    const T = (i) => wt('a04', i);
    if (t < T(1) - 0.06) {
      // "KI," — the AI icon explodes into place behind giant type
      bg(ctx, COL.blue);
      const [sx, sy] = shake(t, 16.05, 14, 0.4);
      ctx.save();
      camera(ctx, { z: 1.02 + 0.05 * seg(t, 16.05, 16.7), x: sx, y: sy });
      pixelIcon(ctx, 'ai', 1340, 520, 560, t, 15.98, { dist: 900, dur: 0.45, stagger: 0.012, map: { '#DDE0F7': COL.blueT, '#8893E3': COL.yellow } });
      const sc = ease.outBack(seg(t, 16.0, 16.3));
      ctx.translate(560, 560); ctx.scale(sc, sc); ctx.translate(-560, -560);
      setFont(ctx, 560, 900, FT.cond);
      ctx.fillStyle = COL.white;
      ctx.textAlign = 'center';
      ctx.fillText('KI,', 560, 760);
      ctx.restore();
      label(ctx, '01 — KI-Beratung & Integration', 92, H - 50, { alpha: 0.8 });
      frameMarks(ctx, t, { idx: 'Leistung 01', title: 'Assecor GmbH', alpha: 0.6 });
      return;
    }
    if (t < T(4) - 0.06) {
      // "die Prozesse automatisiert" — server room, a process flow draws itself and ticks off
      bg(ctx, COL.navy);
      const lt = t - (T(1) - 0.06);
      cover(ctx, IMG.servers, 0, 0, W, H, { zoom: 1.1 + 0.06 * lt / 1.8, fx: 0.5, fy: 0.5 });
      ctx.fillStyle = rgbaHex(COL.blue, 0.72);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = rgbaHex(COL.navy, 0.35);
      ctx.fillRect(0, 0, W, H);
      const bx = [230, 760, 1290], by = 300, bw = 400, bh = 190;
      bx.forEach((x, i) => {
        const a = T(2) + i * 0.18;
        stroke(ctx, boxPts(x, by, bw, bh), seg(t, a - 0.1, a + 0.3), { color: COL.white, width: 4, t, seed: 11 + i });
        if (i < 2) arrow(ctx, pts.arc(x + bw + 22, by + bh / 2, x + 530 - 22, by + bh / 2, -18, 16), seg(t, a + 0.15, a + 0.4), { color: COL.white, width: 4, t, seed: 21 + i, head: 16 });
        // automation: each step fills with a pixel and gets its check on "automatisiert"
        const ap = seg(t, T(3) + i * 0.16, T(3) + i * 0.16 + 0.25);
        if (ap > 0) {
          const s = 70 * ease.outBack(ap);
          ctx.fillStyle = [COL.mint, COL.yellow, COL.coral][i];
          ctx.fillRect(x + 50 - s / 2 + 35, by + bh / 2 - s / 2, s, s);
          stroke(ctx, check(x + 250, by + bh / 2, 40), seg(t, T(3) + i * 0.16 + 0.1, T(3) + i * 0.16 + 0.35), { color: COL.white, width: 7, t, seed: 31 + i });
        }
        label(ctx, ['Eingang', 'Prüfung', 'Freigabe'][i], x + 6, by - 24, { alpha: seg(t, a, a + 0.2), size: 14 });
      });
      sentence(ctx, 'a04', t, { from: 1, to: 4, x: 230, y: 760, align: 'left', size: 92, weight: 300, style: 'italic', styles: { 3: { fam: FT.sans, weight: 700, style: 'normal' } } });
      lineIcon(ctx, 'chip', 1640, 850, 170, seg(t, T(1), T(1) + 0.9), { width: 4 });
      frameMarks(ctx, t, { idx: 'Leistung 01 — KI', title: 'Prozesse', alpha: 0.6 });
      return;
    }
    // "und Kosten senkt." — a falling hand-drawn chart
    bg(ctx, COL.blueT, 0.55);
    const t0 = T(4) - 0.06;
    const chart = [[980, 300], [1120, 380], [1230, 340], [1360, 520], [1470, 480], [1600, 700], [1720, 820]];
    const smooth = chart.flatMap((p, i) => (i ? pts.line(chart[i - 1][0], chart[i - 1][1], p[0], p[1], 10).slice(1) : [p]));
    // axes
    stroke(ctx, [...pts.line(940, 240, 940, 900, 20), ...pts.line(940, 900, 1800, 902, 24).slice(1)], seg(t, t0, t0 + 0.4), { color: COL.navy, width: 4, t, seed: 41, alpha: 0.6 });
    arrow(ctx, smooth, seg(t, wt('a04', 5), wt('a04', 6) + 0.4), { color: COL.coral, width: 8, t, seed: 43, head: 34 });
    hand(ctx, '€', 900, 230, seg(t, t0 + 0.1, t0 + 0.4), { size: 70, color: COL.navy });
    rise(ctx, 'und', 140, 470, t, wt('a04', 4) - 0.05, { size: 70, weight: 300, style: 'italic', color: COL.navy });
    rise(ctx, 'Kosten', 130, 690, t, wt('a04', 5) - 0.05, { size: 230, weight: 900, fam: FT.cond, color: COL.navy, track: -2 });
    const sw = rise(ctx, 'senkt.', 140, 850, t, wt('a04', 6) - 0.05, { size: 120, weight: 400, style: 'italic', color: COL.coral });
    stroke(ctx, pts.swoosh(130, 885, sw + 40, 18), seg(t, wt('a04', 6) + 0.2, wt('a04', 6) + 0.55), { color: COL.navy, width: 6, t, seed: 44 });
    frameMarks(ctx, t, { color: COL.navy, idx: 'Leistung 01 — KI', title: 'Wirkung', alpha: 0.6 });
  },
  blur: (t) => (t < 16.4 ? 5 : 3),
  sfx: [
    { t: 16.03, s: 'stamp', gain: 0.6 },
    { t: 15.98, s: 'blocks', gain: 0.5, rate: 0.9 },
    { t: wt('a04', 1) - 0.06, s: 'shutter', gain: 0.4 },
    ...[0, 1, 2].map((i) => ({ t: wt('a04', 2) + i * 0.18 - 0.1, s: 'underline', gain: 0.22, rate: 1 + i * 0.1, pan: (i - 1) * 0.6 })),
    ...[0, 1, 2].map((i) => ({ t: wt('a04', 3) + i * 0.16, type: 'toggle', gain: 0.35 })),
    { t: wt('a04', 4) - 0.06, s: 'paper', gain: 0.3 },
    { t: wt('a04', 5), s: 'scribble', gain: 0.35, rate: 0.9 },
    { t: wt('a04', 5) + 0.2, type: 'whoosh', gain: 0.25, dur: 0.6, pan: 0.4 },
  ],
};

// ------------------------------------------------------------ Software ---
const software = {
  start: 20.05, end: 24.05,
  draw(ctx, t) {
    const T = (i) => wt('a05', i);
    if (t < T(2) - 0.06) {
      // "Software," — the </> icon assembles
      bg(ctx, COL.coral);
      pixelIcon(ctx, 'sd', 480, 540, 470, t, 19.98, { dist: 700, stagger: 0.02, map: { '#FFE0E0': COL.coralT, '#FF9393': COL.navy } });
      rise(ctx, 'Software,', 800, 610, t, T(0) - 0.04, { size: 170, weight: 700 });
      label(ctx, '02 — Softwareentwicklung & Modernisierung', 92, H - 50, { alpha: 0.85 });
      frameMarks(ctx, t, { idx: 'Leistung 02', title: 'Assecor GmbH', alpha: 0.6 });
      return;
    }
    if (t < T(3) - 0.06) {
      // "skaliert," — the icon multiplies while the camera pulls back
      bg(ctx, COL.coral);
      const lt = t - (T(2) - 0.06);
      const z = lerp(1, 0.16, ease.outCubic(seg(lt, 0, 0.6)));
      ctx.save();
      camera(ctx, { z });
      const n = 9;
      for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
        const d = Math.hypot(i, j);
        const p = seg(lt, d * 0.04, d * 0.04 + 0.2);
        if (p <= 0) continue;
        pixelIcon(ctx, 'sd', W / 2 + i * 560, H / 2 + j * 560, 470 * ease.outBack(p), 99, 0, { map: { '#FFE0E0': COL.coralT, '#FF9393': COL.navy } });
      }
      ctx.restore();
      ctx.fillStyle = rgbaHex(COL.coral, 0.55);
      ctx.fillRect(0, 380, W, 300);
      rise(ctx, 'skaliert,', W / 2, 640, t, T(2) - 0.06, { size: 300, weight: 900, fam: FT.cond, align: 'center', color: COL.white, track: -2 });
      return;
    }
    if (t < T(5) - 0.06) {
      // "stabil läuft" — Assecor's own photo of a code session, with a live status chip and a steady pulse
      bg(ctx, COL.navy);
      const lt = t - (T(3) - 0.06);
      cover(ctx, IMG.laptop, 0, 0, W, H, { zoom: 1.12 + 0.05 * lt, fx: 0.55, fy: 0.45 });
      ctx.fillStyle = rgbaHex(COL.navy, 0.45);
      ctx.fillRect(0, 0, W, H);
      // status chip
      const cp = ease.outBack(seg(lt, 0.05, 0.3));
      if (cp > 0) {
        ctx.save();
        ctx.translate(1430, 210); ctx.scale(cp, cp);
        ctx.fillStyle = COL.white;
        ctx.beginPath(); ctx.roundRect(-250, -42, 500, 84, 42); ctx.fill();
        ctx.fillStyle = COL.mint;
        const pulse = 1 + 0.25 * Math.sin(t * 9);
        ctx.beginPath(); ctx.arc(-205, 0, 13 * pulse, 0, TAU); ctx.fill();
        setFont(ctx, 30, 500, FT.sans); ctx.fillStyle = COL.navy; ctx.fillText('System läuft · 99,9 %', -175, 11);
        ctx.restore();
      }
      // heartbeat line, steady
      const hb = [];
      for (let i = 0; i <= 120; i++) {
        const x = 120 + i * 14.3, k = i % 30;
        hb.push([x, 560 + (k === 12 ? -60 : k === 13 ? 70 : k === 14 ? -25 : 0)]);
      }
      stroke(ctx, hb, seg(lt, 0, 0.9), { color: COL.mint, width: 5, t, seed: 51, amp: 1 });
      sentence(ctx, 'a05', t, { from: 3, to: 5, x: 120, y: 820, align: 'left', size: 120, weight: 300, style: 'italic', styles: { 3: { weight: 700, style: 'normal' } } });
      frameMarks(ctx, t, { idx: 'Leistung 02 — Software', title: 'Betrieb', alpha: 0.6 });
      return;
    }
    // "und mitwächst." — pixel blocks stack up into a growing chart
    bg(ctx, COL.coralT, 0.6);
    const t0 = T(5) - 0.06;
    const S = 92, base = 900, cols = [1060, 1170, 1280, 1390, 1500, 1610];
    cols.forEach((x, c) => {
      const n = c + 2;
      for (let k = 0; k < n; k++) {
        const ta = t0 + 0.08 + c * 0.07 + k * 0.06;
        const p = seg(t, ta, ta + 0.25);
        if (p <= 0) continue;
        const y = base - (k + 1) * (S + 8);
        const drop = (1 - ease.outCubic(p)) * -500;
        ctx.fillStyle = k === n - 1 ? COL.coral : [COL.navy, COL.coral2][(k + c) % 2];
        ctx.fillRect(x, y + drop, S, S);
      }
    });
    arrow(ctx, pts.arc(1010, 820, 1760, 160, 90), seg(t, T(6) + 0.1, T(6) + 0.7), { color: COL.navy, width: 6, t, seed: 61, head: 30 });
    rise(ctx, 'und', 140, 520, t, T(5) - 0.05, { size: 72, weight: 300, style: 'italic', color: COL.navy });
    rise(ctx, 'mitwächst.', 130, 700, t, T(6) - 0.05, { size: 150, weight: 700, style: 'italic', color: COL.navy });
    hand(ctx, 'heute & morgen', 160, 830, seg(t, T(6) + 0.4, T(6) + 0.9), { size: 60, color: COL.coral, rot: -0.05 });
    frameMarks(ctx, t, { color: COL.navy, idx: 'Leistung 02 — Software', title: 'Zukunftssicher', alpha: 0.6 });
  },
  blur: (t) => (t > wt('a05', 2) - 0.1 && t < wt('a05', 3) ? 6 : 3),
  sfx: [
    { t: 19.98, s: 'blocks', gain: 0.5 },
    { t: 20.03, type: 'clack', gain: 0.4 },
    { t: wt('a05', 2) - 0.06, type: 'zoom', gain: 0.35, dur: 0.5 },
    { t: wt('a05', 2) - 0.02, s: 'blocks', gain: 0.35, rate: 1.4 },
    { t: wt('a05', 3) - 0.06, s: 'shutter', gain: 0.4 },
    { t: wt('a05', 3), type: 'notify', gain: 0.3 },
    ...[0, 1, 2, 3, 4, 5].map((c) => ({ t: wt('a05', 5) + 0.05 + c * 0.07, type: 'clack', gain: 0.25, pitch: 1 + c * 0.1 })),
    { t: wt('a05', 6) + 0.1, s: 'underline', gain: 0.3, rate: 0.85 },
  ],
};

// ------------------------------------------------------ Transformation ---
const HEADS = [[326, 579, 95], [451, 438, 85], [768, 425, 92], [1180, 322, 105]];
const transformation = {
  start: 24.05, end: 27.62,
  draw(ctx, t) {
    const T = (i) => wt('a06', i);
    if (t < T(2) - 0.06) {
      // "Und Transformation," — the checkerboard icon flips its tiles over in a wave
      bg(ctx, COL.mint);
      const lt = t - 24.05;
      pixelIcon(ctx, 'dt', 420, 540, 440, t, 23.98, { dist: 600, stagger: 0.03, map: { '#CCF5ED': COL.navy, '#4DDCC0': COL.yellow } });
      // a few tiles flip to show the change
      [[126.6, 21.3], [337.1, 231.8], [21.3, 337.1]].forEach(([x, y], i) => {
        const p = seg(lt, 0.4 + i * 0.12, 0.7 + i * 0.12);
        if (p <= 0) return;
        const k = 440 / 464, s = 105.25 * k;
        const cx = 420 - 220 + (x + 52.6) * k, cy = 540 - 220 + (y + 52.6) * k;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(Math.cos(p * Math.PI), 1);
        ctx.fillStyle = p < 0.5 ? COL.white : COL.coral;
        ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
      });
      rise(ctx, 'Und', 720, 440, t, T(0) - 0.05, { size: 70, weight: 300, style: 'italic', color: COL.navy });
      rise(ctx, 'Transformation,', 710, 620, t, T(1) - 0.05, { size: 122, weight: 400, color: COL.navy });
      label(ctx, '03 — Digitale Transformation', 92, H - 50, { color: COL.navy, alpha: 0.85 });
      frameMarks(ctx, t, { color: COL.navy, idx: 'Leistung 03', title: 'Assecor GmbH', alpha: 0.6 });
      return;
    }
    if (t < T(5) - 0.06) {
      // "die Ihre Teams" — the people: photo + marker circles around every head
      bg(ctx, COL.navy);
      const lt = t - (T(2) - 0.06);
      cover(ctx, IMG.team, 0, 0, W, H, { zoom: 1 + 0.04 * lt });
      HEADS.forEach(([x, y, r], i) => {
        const a = T(4) - 0.1 + i * 0.09;
        stroke(ctx, pts.loop(x, y, r, r * 1.15, { turns: 1.08, start: -1.9 + i }), seg(t, a, a + 0.32), { color: COL.yellow, width: 6, t, seed: 70 + i });
      });
      sentence(ctx, 'a06', t, { from: 2, to: 5, x: 1840, y: 960, align: 'right', size: 110, weight: 300, style: 'italic', styles: { 4: { weight: 700, style: 'normal' } } });
      hand(ctx, 'Ihr Team', 1290, 210, seg(t, T(4) + 0.25, T(4) + 0.6), { size: 64, color: COL.yellow, rot: -0.05 });
      arrow(ctx, pts.arc(1280, 200, 1215, 270, 30, 20), seg(t, T(4) + 0.45, T(4) + 0.7), { color: COL.yellow, width: 4, t, seed: 77, head: 16 });
      frameMarks(ctx, t, { idx: 'Leistung 03 — Transformation', title: 'Menschen', alpha: 0.6 });
      return;
    }
    // "mitnimmt." — a dashed path carries three coloured pixels (the team) along
    bg(ctx, COL.mintT, 0.6);
    const t0 = T(5) - 0.06;
    const path = pts.arc(140, 760, 1780, 520, -220, 80);
    const dp = seg(t, t0, t0 + 0.8, ease.inOutCubic);
    ctx.setLineDash([22, 18]);
    stroke(ctx, path, dp, { color: COL.navy, width: 5, t, seed: 81, double: false });
    ctx.setLineDash([]);
    [COL.coral, COL.blue, COL.yellow].forEach((c, i) => {
      const u = clamp(dp - i * 0.06);
      const k = Math.floor(u * (path.length - 1));
      const [x, y] = path[k];
      const hop = Math.abs(Math.sin(t * 9 + i)) * 18;
      ctx.fillStyle = c;
      ctx.fillRect(x - 26, y - 70 - hop, 52, 52);
    });
    photo(ctx, IMG.sticky, 420, 330, 480, 320, { rot: -0.06, scale: ease.outBack(seg(t, t0 - 0.02, t0 + 0.25)), torn: true, seed: 8, fx: 0.7 });
    rise(ctx, 'mitnimmt.', 1820, 930, t, T(5) - 0.05, { size: 150, weight: 700, style: 'italic', color: COL.navy, align: 'right' });
    hand(ctx, 'alle an Bord', 1280, 330, seg(t, T(5) + 0.5, T(5) + 0.9), { size: 62, color: COL.navy, rot: 0.04 });
    frameMarks(ctx, t, { color: COL.navy, idx: 'Leistung 03 — Transformation', title: 'Wandel', alpha: 0.6 });
  },
  sfx: [
    { t: 23.98, s: 'blocks', gain: 0.45 },
    ...[0, 1, 2].map((i) => ({ t: 24.45 + i * 0.12, type: 'flip', gain: 0.3 })),
    { t: wt('a06', 2) - 0.06, s: 'shutter', gain: 0.4 },
    ...[0, 1, 2, 3].map((i) => ({ t: wt('a06', 4) - 0.1 + i * 0.09, s: 'circle', gain: 0.22, rate: 1.1 + i * 0.07, pan: (i - 1.5) * 0.4 })),
    { t: wt('a06', 5) - 0.06, s: 'photo', gain: 0.45 },
    { t: wt('a06', 5) - 0.02, type: 'whoosh', gain: 0.35, dur: 0.7, pan: 0.6 },
    ...[0, 1, 2].map((i) => ({ t: wt('a06', 5) + 0.2 + i * 0.12, type: 'pop', gain: 0.25, pitch: 1 + i * 0.25 })),
  ],
};

// ------------------------------------------- "Von der Idee bis zur Umsetzung." ---
// One long hand-drawn sheet; the camera tracks along it and every station draws itself as it enters.
const ST = [480, 1320, 2160, 3000];
const TAGS = ['Idee', 'Strategie', 'Entwicklung', 'Umsetzung'];
const journeyPath = (() => {
  const o = [];
  for (let i = 0; i <= 240; i++) {
    const x = 200 + i * 13.5;
    o.push([x, 690 + Math.sin(i * 0.11) * 34 + noise2(i * 0.05, 3) * 14]);
  }
  return o;
})();
const journey = {
  start: 27.62, end: wt('a07', 6) - 0.06,
  draw(ctx, t) {
    bg(ctx, COL.paper, 0.9);
    const camX = lerp(0, ST[3] - 1380, ease.inOutCubic(seg(t, 28.0, 29.3)));
    // a station draws while it travels into view (or from the start for the first one)
    const sp = (i, a = 0, b = 1) => {
      const p = i === 0 ? seg(t, 27.7, 28.4) : seg(camX, ST[i] - 1900, ST[i] - 1300);
      return clamp((p - a) / (b - a));
    };
    ctx.save();
    ctx.translate(-camX, 0);
    // the pen line runs ahead of the camera and links the stations
    stroke(ctx, journeyPath, clamp((camX + 1500 - 200) / 3240), { color: COL.navy, width: 5, t, seed: 91 });
    // 01 idea: photo of a hand sketching, a light bulb lights up
    photo(ctx, IMG.squiggle, ST[0] - 230, 420, 300, 410, { rot: -0.06, seed: 3, scale: ease.outBack(seg(t, 27.62, 27.9)), fy: 0.6 });
    const bx = ST[0] + 170, by = 380;
    stroke(ctx, pts.loop(bx, by, 85, 100, { turns: 1, start: 1.25 }), sp(0, 0, 0.5), { color: COL.navy, width: 6, t, seed: 92 });
    stroke(ctx, pts.line(bx - 32, by + 118, bx + 32, by + 118, 6), sp(0, 0.45, 0.6), { color: COL.navy, width: 6, t, seed: 93 });
    stroke(ctx, pts.line(bx - 26, by + 145, bx + 26, by + 145, 6), sp(0, 0.5, 0.65), { color: COL.navy, width: 6, t, seed: 94 });
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.6;
      stroke(ctx, pts.line(bx + Math.cos(a) * 130, by + Math.sin(a) * 145, bx + Math.cos(a) * 180, by + Math.sin(a) * 195, 4), sp(0, 0.6 + i * 0.06, 0.75 + i * 0.06), { color: COL.coral, width: 6, t, seed: 95 + i });
    }
    // 02 strategy: whiteboard boxes and arrows
    const s2 = ST[1];
    [[s2 - 200, 230, 190, 120], [s2 + 50, 230, 190, 120], [s2 - 75, 450, 190, 120]].forEach(([x, y, w, h], i) => {
      stroke(ctx, boxPts(x, y, w, h), sp(1, i * 0.2, 0.4 + i * 0.2), { color: COL.navy, width: 5, t, seed: 101 + i });
    });
    arrow(ctx, pts.arc(s2 - 10, 295, s2 + 40, 295, -10, 8), sp(1, 0.5, 0.7), { color: COL.navy, width: 4, t, seed: 105, head: 14 });
    arrow(ctx, pts.arc(s2 + 140, 360, s2 + 60, 445, -20, 12), sp(1, 0.6, 0.8), { color: COL.navy, width: 4, t, seed: 106, head: 14 });
    ctx.fillStyle = COL.blue; ctx.fillRect(s2 - 160, 265, 52 * sp(1, 0.7, 0.8), 52);
    ctx.fillStyle = COL.yellow; ctx.fillRect(s2 + 90, 265, 52 * sp(1, 0.75, 0.85), 52);
    ctx.fillStyle = COL.mint; ctx.fillRect(s2 - 35, 485, 52 * sp(1, 0.8, 0.9), 52);
    // 03 development: a screen with the </> icon
    const s3 = ST[2];
    stroke(ctx, boxPts(s3 - 220, 210, 440, 290), sp(2, 0, 0.45), { color: COL.navy, width: 6, t, seed: 111 });
    stroke(ctx, pts.line(s3 - 90, 560, s3 + 90, 560, 8), sp(2, 0.4, 0.55), { color: COL.navy, width: 6, t, seed: 112 });
    stroke(ctx, pts.line(s3, 500, s3, 560, 4), sp(2, 0.35, 0.45), { color: COL.navy, width: 6, t, seed: 113 });
    if (sp(2) > 0.3) pixelIcon(ctx, 'sd', s3, 355, 220, sp(2), 0.3, { dur: 0.45, stagger: 0.02, dist: 180, map: { '#FFE0E0': COL.coralT, '#FF9393': COL.coral, white: COL.navy } });
    // 04 delivery: rubber stamp
    const s4 = ST[3];
    const stp = seg(t, wt('a07', 5) + 0.02, wt('a07', 5) + 0.16);
    if (stp > 0) {
      ctx.save();
      ctx.translate(s4, 380); ctx.rotate(-0.12);
      const sc = lerp(1.7, 1, ease.outCubic(stp));
      ctx.scale(sc, sc);
      ctx.globalAlpha = stp;
      ctx.strokeStyle = COL.coral; ctx.lineWidth = 10;
      ctx.strokeRect(-280, -90, 560, 180);
      setFont(ctx, 92, 900, FT.cond);
      ctx.fillStyle = COL.coral; ctx.textAlign = 'center';
      ctx.fillText('UMGESETZT', 0, 32);
      ctx.restore();
    }
    ST.forEach((x, i) => label(ctx, `0${i + 1} · ${TAGS[i]}`, x - 70, 790, { color: COL.navy, size: 16, alpha: 0.75 * sp(i, 0, 0.3) }));
    // words on the sheet
    rise(ctx, 'Von der', ST[0] - 300, 950, t, wt('a07', 0) - 0.05, { size: 76, weight: 300, style: 'italic', color: COL.navy });
    rise(ctx, 'Idee', ST[0] - 20, 950, t, wt('a07', 2) - 0.05, { size: 130, weight: 700, color: COL.navy });
    rise(ctx, 'bis zur', ST[1] + 280, 950, t, wt('a07', 3) - 0.05, { size: 76, weight: 300, style: 'italic', color: COL.navy });
    rise(ctx, 'Umsetzung.', ST[3] - 330, 950, t, wt('a07', 5) - 0.05, { size: 130, weight: 700, color: COL.navy });
    ctx.restore();
    frameMarks(ctx, t, { color: COL.navy, idx: '05 — Vorgehen', title: 'End-to-End', alpha: 0.6 });
  },
  blur: (t) => (t > 27.85 && t < 29.3 ? 5 : 3),
  sfx: [
    { t: 27.62, s: 'photo', gain: 0.4 },
    { t: 27.72, s: 'scribble', gain: 0.3, rate: 0.8 },
    { t: 27.8, type: 'whoosh', gain: 0.3, dur: 1.5, pan: 0.7 },
    { t: 28.25, s: 'underline', gain: 0.25 },
    { t: 28.55, s: 'circle', gain: 0.2, rate: 1.3 },
    { t: 28.85, s: 'blocks', gain: 0.3, rate: 1.3 },
    { t: wt('a07', 5) + 0.02, s: 'stamp', gain: 0.75 },
  ],
};

// ------------------------------------------------- "Alles aus einer Hand." ---
const RAYS = new Set([6, 7, 8, 12, 13, 14]);
const handScene = {
  start: wt('a07', 6) - 0.06, end: 32.3,
  draw(ctx, t) {
    bg(ctx, COL.navy);
    const t0 = this.start;
    const p = seg(t, t0, t0 + 1.1);
    ctx.save();
    camera(ctx, { z: 1 + 0.04 * seg(t, t0, 32.3) });
    lineIcon(ctx, 'hand', W / 2, 430, 560, p, { width: 3.2, stagger: 0.55, accent: (i) => (RAYS.has(i) ? COL.yellow : null) });
    sentence(ctx, 'a07', t, { from: 6, y: 930, size: 84, weight: 300, styles: { 9: { weight: 700, style: 'italic', color: COL.yellow } } });
    ctx.restore();
    frameMarks(ctx, t, { idx: '06 — Partnerschaft', title: 'Alles aus einer Hand', alpha: 0.5 });
  },
  sfx: [
    { t: wt('a07', 6) - 0.06, s: 'underline', gain: 0.3, rate: 0.7 },
    { t: wt('a07', 6) + 0.3, s: 'scribble', gain: 0.22, rate: 0.7 },
    { t: wt('a07', 9), type: 'chime', gain: 0.25 },
  ],
};

export default [ki, software, transformation, journey, handScene];
