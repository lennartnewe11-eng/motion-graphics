// Part A (0 – 16.05 s): power-on, "Digitalisierung verändert die Welt.", "Aber nicht jede Technologie
// verändert Ihr Geschäft.", "Deshalb fragen wir zuerst: Was bringt echten Mehrwert?", service overview.
import { W, H, TAU, clamp, lerp, ease, seg, hash1 } from '../engine/core.js';
import {
  COL, FT, IMG, setFont, bg, camera, shake, rise, sentence, pixelWord, label, frameMarks, stroke, pts, arrow, hand,
  highlight, cover, photo, pixelIcon, lineIcon, block, cellWipe, measure,
} from './lib.js';
import { wt, we, beat } from './timeline.js';

const layer = new OffscreenCanvas(W, H);
const lctx = layer.getContext('2d');

// ------------------------------------------------------------------ intro ---
const intro = {
  start: 0, end: 2.6,
  draw(ctx, t) {
    bg(ctx, COL.navy);
    frameMarks(ctx, t, { idx: 'Assecor GmbH', title: 'Imagefilm — 2026', t0: 0.45, alpha: 0.5 });
    label(ctx, 'IT-Beratung · KI · Software', 92, H - 50, { alpha: 0.45 * seg(t, 0.6, 0.9), size: 13 });
    // the first pixel: a block cursor blinking on the music
    const cx = W / 2, cy = H / 2, s = 64;
    const on = t < 2.15 ? (Math.floor((t - 0.05) / 0.5) % 2 === 0 || t > 1.6) : true;
    const split = seg(t, 2.15, 2.6);
    if (t > 0.35 && on && split <= 0) {
      const pop = ease.outBack(seg(t, 0.35, 0.55));
      ctx.fillStyle = COL.mint;
      ctx.fillRect(cx - (s * pop) / 2, cy - (s * pop) / 2, s * pop, s * pop);
    }
    // handwriting: "Bereit?" + arrow to the cursor
    hand(ctx, 'Bereit?', cx - 420, cy - 150, seg(t, 0.95, 1.45), { size: 96, color: COL.white, rot: -0.1 });
    arrow(ctx, pts.arc(cx - 230, cy - 120, cx - 60, cy - 20, -50), seg(t, 1.35, 1.8), { color: COL.white, width: 5, t, seed: 4, head: 22 });
    // the cursor splits into one block per letter of "Digitalisierung"
    if (split > 0) {
      const str = 'Digitalisierung';
      setFont(ctx, 138, 300, FT.serif);
      const total = ctx.measureText(str).width;
      const t0 = wt('a01', 0) - 0.05;
      const pal = [COL.mint, COL.blue, COL.coral, COL.yellow];
      for (let i = 0; i < str.length; i++) {
        const gx = W / 2 - total / 2 + ctx.measureText(str.slice(0, i)).width + ctx.measureText(str[i]).width / 2;
        const arrive = t0 + i * 0.035;
        const p = ease.inOutCubic(clamp((t - 2.15) / (arrive - 2.15)));
        const x = lerp(cx, gx, p), y = lerp(cy, 470 - 50, p) - Math.sin(p * Math.PI) * (60 + 90 * hash1(i));
        const b = lerp(s, 138 * 0.72, p);
        ctx.fillStyle = pal[i % 4];
        ctx.fillRect(x - b / 2, y - b / 2, b, b);
      }
    }
  },
  post(ctx, t) {
    // CRT power-on: a bright line opens into the picture
    if (t > 0.75) return;
    const p = ease.outExpo(seg(t, 0.12, 0.6));
    const h = lerp(3, H, p);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H / 2 - h / 2);
    ctx.fillRect(0, H / 2 + h / 2, W, H / 2 - h / 2 + 1);
    const flash = 1 - seg(t, 0.1, 0.7);
    ctx.fillStyle = `rgba(235,245,255,${0.85 * flash})`;
    ctx.fillRect(0, H / 2 - h / 2, W, h);
    if (t < 0.12) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - 900 * seg(t, 0.02, 0.12), H / 2 - 1.5, 1800 * seg(t, 0.02, 0.12), 3); }
  },
  sfx: [
    { t: 0.02, s: 'crtOn', gain: 0.55 },
    ...[0.55, 1.05, 1.55].map((t) => ({ t, type: 'tick', gain: 0.35 })),
    { t: 0.95, s: 'scribble', gain: 0.3, rate: 1.2 },
    { t: 1.35, s: 'underline', gain: 0.3 },
    { t: 2.15, s: 'blocks', gain: 0.45 },
  ],
};

// ------------------------------------------------------- "… die Welt." ---
const welt = {
  start: 2.6, end: 5.6,
  draw(ctx, t) {
    const cut = wt('a01', 3); // "Welt." — hard cut to the WELT card
    if (t < cut) {
      bg(ctx, COL.navy);
      frameMarks(ctx, t, { idx: 'Assecor GmbH', title: 'Imagefilm — 2026', alpha: 0.5 });
      const z = 1 + 0.03 * seg(t, 2.6, cut);
      ctx.save();
      camera(ctx, { z });
      pixelWord(ctx, 'Digitalisierung', W / 2, 470, t, wt('a01', 0) - 0.05, { size: 138, weight: 300 });
      const vx = W / 2 + 120;
      const vw = rise(ctx, 'verändert', vx, 600, t, wt('a01', 1) - 0.05, { size: 72, weight: 300, style: 'italic' });
      stroke(ctx, pts.swoosh(vx - 10, 628, vw + 30, 16), seg(t, wt('a01', 1) + 0.15, wt('a01', 1) + 0.5), { color: COL.mint, width: 6, t, seed: 2 });
      rise(ctx, 'die', vx + vw + 26, 600, t, wt('a01', 2) - 0.05, { size: 72, weight: 300, style: 'italic', color: COL.blue2 });
      ctx.restore();
      return;
    }
    // WELT: giant condensed type, the aerial photo lives inside the letters
    bg(ctx, COL.yellowT, 0.5);
    const lt = t - cut;
    const z = 1.0 + 0.07 * ease.outCubic(seg(t, cut, 5.6));
    ctx.save();
    camera(ctx, { z });
    const [sx, sy] = shake(t, cut, 10, 0.35);
    ctx.translate(sx, sy);
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, W, H);
    lctx.font = '900 640px "Roboto Condensed"';
    lctx.textAlign = 'center';
    lctx.letterSpacing = '-8px';
    lctx.fillStyle = '#000';
    const pin = ease.outExpo(seg(lt, 0, 0.35));
    lctx.fillText('WELT', W / 2, 800 + (1 - pin) * 300);
    lctx.globalCompositeOperation = 'source-in';
    cover(lctx, IMG.welt, 0, 0, W, H, { zoom: 1.25 - 0.08 * seg(lt, 0, 1.4), fx: 0.45 + 0.1 * seg(lt, 0, 1.4), fy: 0.5 });
    lctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(layer, 0, 0);
    // orbit around the word + the travelling dot
    const loop = pts.loop(W / 2, 560, 800, 175, { turns: 1.05, start: 2.6, tilt: -0.1 });
    stroke(ctx, loop, seg(lt, 0.15, 0.75, ease.inOutSine), { color: COL.coral, width: 6, t, seed: 7 });
    const dp = seg(lt, 0.75, 1.36);
    if (dp > 0) {
      const k = Math.floor(lerp(0, loop.length - 1, dp));
      ctx.fillStyle = COL.coral;
      ctx.fillRect(loop[k][0] - 14, loop[k][1] - 14, 28, 28);
    }
    rise(ctx, 'die', 300, 300, t, cut - 0.1, { size: 74, weight: 300, style: 'italic', color: COL.navy });
    ctx.restore();
    label(ctx, '52° 31′ N · 13° 24′ E', 92, H - 50, { color: COL.navy, alpha: 0.7 });
    label(ctx, 'Berlin', W - 92, H - 50, { color: COL.navy, alpha: 0.7, align: 'right' });
    frameMarks(ctx, t, { color: COL.navy, idx: '01 — Welt', title: 'Digitalisierung', alpha: 0.6 });
  },
  blur: (t) => (t > wt('a01', 3) && t < wt('a01', 3) + 0.4 ? 5 : 3),
  sfx: [
    { t: wt('a01', 0) - 0.05, s: 'type', gain: 0.35 },
    { t: wt('a01', 1) + 0.15, s: 'underline', gain: 0.3, rate: 1.1 },
    { t: wt('a01', 3) - 0.04, s: 'shutter', gain: 0.5 },
    { t: wt('a01', 3), type: 'whoosh', gain: 0.4, dur: 0.35 },
    { t: wt('a01', 3) + 0.15, s: 'circle', gain: 0.35 },
  ],
};

// ----------------------------------------- "Aber nicht jede Technologie …" ---
const ORBIT = [
  ['line', 'chip'], ['pixel', 'ai'], ['line', 'cubes'], ['pixel', 'sd'],
  ['line', 'flow'], ['pixel', 'dt'], ['line', 'iso'], ['block', COL.coral], ['block', COL.yellow], ['block', COL.mint],
];
const aber = {
  start: 5.6, end: wt('a02', 6),
  draw(ctx, t) {
    if (t < wt('a02', 1) - 0.05) { // "Aber"
      bg(ctx, COL.blueT, 0.6);
      rise(ctx, 'Aber', W / 2, 570, t, wt('a02', 0) - 0.06, { size: 76, weight: 500, fam: FT.sans, color: COL.navy, align: 'center' });
      frameMarks(ctx, t, { color: COL.navy, alpha: 0.5 });
      return;
    }
    if (t < wt('a02', 2) - 0.05) { // "nicht"
      bg(ctx, COL.coralT, 0.6);
      rise(ctx, 'nicht', W / 2, 580, t, wt('a02', 1) - 0.06, { size: 110, weight: 300, style: 'italic', color: COL.navy, align: 'center' });
      frameMarks(ctx, t, { color: COL.navy, alpha: 0.5 });
      return;
    }
    // "jede Technologie verändert Ihr …" with an orbit of tech icons
    bg(ctx, COL.navy);
    const t0 = wt('a02', 2) - 0.05;
    const lt = t - t0;
    const items = ORBIT.map((it, i) => {
      const a = (i / ORBIT.length) * TAU + lt * 0.9 + 0.4;
      const depth = Math.sin(a);
      return { it, i, a, depth, x: W / 2 + Math.cos(a) * 780, y: 520 + depth * 330, s: 0.7 + 0.5 * (depth + 1) / 2 };
    }).sort((p, q) => p.depth - q.depth);
    const drawItem = ({ it, i, x, y, s, depth }) => {
      const pop = ease.outBack(seg(lt, 0.08 + i * 0.05, 0.4 + i * 0.05));
      if (pop <= 0) return;
      const sz = 150 * s * pop;
      ctx.globalAlpha = 0.45 + 0.55 * (depth + 1) / 2;
      if (it[0] === 'line') lineIcon(ctx, it[1], x, y, sz, 1, { width: 4 });
      else if (it[0] === 'pixel') pixelIcon(ctx, it[1], x, y, sz, 99, 0, {});
      else { ctx.fillStyle = it[1]; ctx.fillRect(x - sz * 0.18, y - sz * 0.18, sz * 0.36, sz * 0.36); }
      ctx.globalAlpha = 1;
    };
    items.filter((p) => p.depth < 0).forEach(drawItem);
    const ty = 600;
    rise(ctx, 'Technologie', W / 2, ty, t, wt('a02', 3) - 0.06, { size: 160, weight: 700, fam: FT.sans, align: 'center', track: -2 });
    const tw = measure(ctx, 'Technologie', 160, 700, FT.sans, 'normal', -2);
    const jx = W / 2 - tw / 2 + 6;
    const jw = rise(ctx, 'jede', jx, ty - 175, t, t0, { size: 64, weight: 300, style: 'italic' });
    // crossed out: not every technology
    stroke(ctx, pts.scratch(jx - 10, ty - 225, jw + 20, 60, 5), seg(t, wt('a02', 4) - 0.05, wt('a02', 4) + 0.3), { color: COL.coral, width: 7, t, seed: 3 });
    hand(ctx, 'nicht jede!', jx + jw + 40, ty - 190, seg(t, wt('a02', 4) + 0.15, wt('a02', 4) + 0.55), { size: 66, color: COL.coral, rot: -0.07 });
    const vw = rise(ctx, 'verändert', W / 2 - 60, ty + 120, t, wt('a02', 4) - 0.05, { size: 60, weight: 300, style: 'italic', align: 'center' });
    rise(ctx, 'Ihr', W / 2 - 60 + vw / 2 + 24, ty + 120, t, wt('a02', 5) - 0.05, { size: 60, weight: 300, style: 'italic' });
    items.filter((p) => p.depth >= 0).forEach(drawItem);
    frameMarks(ctx, t, { idx: '02 — Technologie', title: 'Assecor GmbH', alpha: 0.45 });
  },
  sfx: [
    { t: wt('a02', 0) - 0.06, s: 'paper', gain: 0.3 },
    { t: wt('a02', 1) - 0.06, s: 'paper', gain: 0.3, rate: 1.15 },
    { t: wt('a02', 2) - 0.06, type: 'whooshUp', gain: 0.35, dur: 0.5 },
    ...[0, 1, 2, 3, 4, 5].map((i) => ({ t: wt('a02', 2) + 0.08 + i * 0.1, type: 'blip', gain: 0.25, pitch: 1 + i * 0.12 })),
    { t: wt('a02', 4) - 0.05, s: 'scribble', gain: 0.55 },
  ],
};

// --------------------------------------------------------- "Ihr Geschäft." ---
const geschaeft = {
  start: wt('a02', 6), end: 9.38,
  draw(ctx, t) {
    const t0 = this.start;
    bg(ctx, COL.coral);
    const [sx, sy] = shake(t, t0, 16, 0.45);
    ctx.save();
    camera(ctx, { z: 1 + 0.05 * seg(t, t0, 9.4), x: sx, y: sy });
    block(ctx, W - 380, 90, 380, 170, COL.yellow, seg(t, t0 + 0.05, t0 + 0.45), 'right');
    block(ctx, 0, 640, 230, 330, COL.blue, seg(t, t0 + 0.1, t0 + 0.5), 'left');
    block(ctx, 230, 805, 165, 165, COL.blue, seg(t, t0 + 0.18, t0 + 0.55), 'left');
    const sc = lerp(1.35, 1, ease.outBack(seg(t, t0, t0 + 0.32)));
    photo(ctx, IMG.handshake, W / 2 + 40, 440, 960, 560, { rot: -0.035, torn: true, seed: 5, scale: sc, fy: 0.45 });
    hand(ctx, 'genau darum.', 1500, 330, seg(t, t0 + 0.4, t0 + 0.8), { size: 62, color: COL.navy, rot: 0.06 });
    rise(ctx, 'Ihr', 400, 945, t, t0 - 0.12, { size: 96, weight: 300, style: 'italic' });
    rise(ctx, 'Geschäft.', 580, 945, t, t0, { size: 150, weight: 700 });
    ctx.restore();
    // out: navy cells close the frame on the beat before the next line
    cellWipe(ctx, t, 8.92, 0.42, { size: 135, palette: [COL.navy, COL.navy, COL.navy2] });
  },
  blur: (t) => (t < wt('a02', 6) + 0.3 ? 5 : 3),
  sfx: [
    { t: wt('a02', 6) - 0.02, s: 'boom', gain: 0.65 },
    { t: wt('a02', 6), s: 'photo', gain: 0.6 },
    { t: wt('a02', 6) + 0.05, type: 'impact', gain: 0.35 },
    { t: wt('a02', 6) + 0.4, s: 'scribble', gain: 0.25, rate: 1.3 },
    { t: 8.92, s: 'blocks', gain: 0.4, rate: 1.1 },
  ],
};

// --------------------------------------- "Deshalb fragen wir zuerst: …" ---
const ARROWS = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * TAU + 0.2 + (hash1(i) - 0.5) * 0.25;
  const r0 = 1150, r1 = 520 + 80 * hash1(i * 3);
  return { a, r0, r1, bend: (hash1(i * 7) - 0.5) * 120, d: hash1(i * 11) * 0.35 };
});
const frage = {
  start: 9.38, end: 13.35,
  draw(ctx, t) {
    bg(ctx, COL.navy);
    const zoom = seg(t, 12.95, 13.35, ease.inCubic);
    const z = 1 + zoom * 5;
    ctx.save();
    // zoom into "Mehrwert"
    const fx = W / 2, fy = 640;
    ctx.translate(fx, fy); ctx.scale(z, z); ctx.translate(-fx, -fy);
    const retract = seg(t, 10.9, 11.2);
    ARROWS.forEach((A, i) => {
      const k = 0.92 + 0.08 * seg(t, 9.4, 11, ease.outCubic);
      const x0 = W / 2 + Math.cos(A.a) * A.r0, y0 = 540 + Math.sin(A.a) * A.r0 * 0.6;
      const x1 = W / 2 + Math.cos(A.a) * A.r1 * k, y1 = 540 + Math.sin(A.a) * A.r1 * 0.55 * k;
      arrow(ctx, pts.arc(x0, y0, x1, y1, A.bend), seg(t, 9.42 + A.d, 9.95 + A.d), { color: COL.white, width: 3.5, t, seed: i + 1, head: 20, alpha: 0.75 * (1 - retract) });
    });
    sentence(ctx, 'a03', t, { to: 4, y: 560, size: 60, weight: 300, style: 'italic', out: 10.92, styles: { 3: { fam: FT.sans, weight: 500, style: 'normal' } } });
    if (t > 10.9) {
      // whiteboard photo: the question is asked in a workshop
      const pp = ease.outBack(seg(t, 11.0, 11.35));
      photo(ctx, IMG.whiteboard, 1540, 260, 400, 270, { rot: 0.05, scale: pp, seed: 2, fx: 0.4 });
      label(ctx, 'Workshop · Analyse', 1360, 440, { alpha: seg(t, 11.3, 11.5), size: 12 });
      sentence(ctx, 'a03', t, { from: 4, to: 7, y: 450, size: 64, weight: 300, fam: FT.sans });
      const mt = wt('a03', 7);
      setFont(ctx, 200, 400, FT.serif, 'italic');
      const mw = ctx.measureText('Mehrwert?').width;
      highlight(ctx, W / 2 - mw / 2 - 30, 560, mw + 60, 175, seg(t, mt - 0.08, mt + 0.18), COL.yellow, { seed: 5 });
      rise(ctx, 'Mehrwert?', W / 2, 700, t, mt - 0.04, { size: 200, weight: 400, style: 'italic', color: COL.navy, align: 'center' });
      stroke(ctx, pts.loop(W / 2, 640, mw / 2 + 110, 150, { turns: 1.1, start: -2.4 }), seg(t, mt + 0.28, mt + 0.75), { color: COL.coral, width: 7, t, seed: 9 });
      hand(ctx, 'darum geht’s.', W / 2 + mw / 2 + 60, 860, seg(t, mt + 0.6, mt + 1.0), { size: 60, color: COL.coral, rot: -0.08 });
    }
    ctx.restore();
    frameMarks(ctx, t, { idx: '03 — Die Frage', title: 'Assecor GmbH', alpha: 0.45 * (1 - zoom) });
  },
  blur: (t) => (t > 12.95 ? 6 : 3),
  sfx: [
    ...[0, 1, 2, 3, 4].map((i) => ({ t: 9.45 + i * 0.09, s: 'underline', gain: 0.2, pan: (i % 2 ? 0.5 : -0.5), rate: 0.9 + i * 0.08 })),
    { t: 10.92, type: 'swish', gain: 0.35 },
    { t: 11.02, s: 'photo', gain: 0.4 },
    { t: wt('a03', 7) - 0.08, s: 'underline', gain: 0.45, rate: 0.8 },
    { t: wt('a03', 7) + 0.28, s: 'circle', gain: 0.5 },
    { t: wt('a03', 7) + 0.6, s: 'scribble', gain: 0.25, rate: 1.25 },
    { t: 12.95, type: 'zoom', gain: 0.4, dur: 0.4 },
  ],
};

// ------------------------------------------------------ service overview ---
const ICONS = [
  { name: 'ai', x: 560, cap: 'KI-Beratung & Integration', t0: 13.5 },
  { name: 'sd', x: 960, cap: 'Softwareentwicklung', t0: 13.75 },
  { name: 'dt', x: 1360, cap: 'Digitale Transformation', t0: 14.0 },
];
const leistungen = {
  start: 13.35, end: 16.05,
  draw(ctx, t) {
    bg(ctx, COL.navy2);
    // zoom into the lavender block of the AI icon
    const S = 230, iy = 545;
    const px = ICONS[0].x - S / 2 + 421.6 * (S / 464), py = iy - S / 2 + 231.8 * (S / 464);
    const zp = seg(t, 15.3, 16.05, ease.inExpo);
    const z = Math.pow(60, zp);
    const e2 = ease.inOutCubic(seg(t, 15.2, 15.9));
    ctx.save();
    ctx.translate(lerp(px, W / 2, e2), lerp(py, H / 2, e2)); ctx.scale(z, z); ctx.translate(-px, -py);
    rise(ctx, 'Unsere Leistungen', W / 2, 250, t, 13.4, { size: 56, weight: 400, align: 'center' });
    ICONS.forEach((ic, i) => {
      pixelIcon(ctx, ic.name, ic.x, iy, S, t, ic.t0, { dist: 520, seed: i + 3 });
      label(ctx, `0${i + 1}`, ic.x, iy - 170, { align: 'center', color: COL.mint, alpha: seg(t, ic.t0 + 0.2, ic.t0 + 0.4), size: 14 });
      rise(ctx, ic.cap, ic.x, iy + 210, t, ic.t0 + 0.3, { size: 28, weight: 500, fam: FT.sans, align: 'center' });
    });
    ctx.restore();
    frameMarks(ctx, t, { idx: '04 — Leistungen', title: 'Assecor GmbH', alpha: 0.45 * (1 - zp) });
  },
  blur: (t) => (t > 15.3 ? 7 : 3),
  sfx: [
    { t: 13.4, s: 'paper', gain: 0.25 },
    ...ICONS.map((ic, i) => ({ t: ic.t0, s: 'blocks', gain: 0.45, rate: 1 + i * 0.08, pan: (i - 1) * 0.5 })),
    { t: 15.25, type: 'zoom', gain: 0.5, dur: 0.8 },
  ],
};

export default [intro, welt, aber, geschaeft, frage, leistungen];
