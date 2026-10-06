// Part D (48.05 – 64 s): the drop ("Skalierbar. Wirtschaftlich. Verantwortungsvoll."),
// the claim of assecor.de as a hero shot, logo + call to action, CRT power-off.
import { W, H, TAU, clamp, lerp, ease, seg, hash1 } from '../engine/core.js';
import {
  COL, FT, IMG, setFont, bg, camera, shake, rise, sentence, label, frameMarks, stroke, pts, arrow, hand,
  highlight, photo, pixelIcon, block, measure, logo, rgbaHex,
} from './lib.js';
import { wt, lineEnd } from './timeline.js';

// giant word whose letters slam in one after another
function slam(ctx, str, t, t0, o = {}) {
  const { color = COL.white, maxW = 1720, size0 = 330, y = 640 } = o;
  setFont(ctx, size0, 900, FT.cond);
  ctx.letterSpacing = '-3px';
  let size = size0;
  const w0 = ctx.measureText(str).width;
  if (w0 > maxW) size = size0 * maxW / w0;
  setFont(ctx, size, 900, FT.cond);
  const total = ctx.measureText(str).width;
  let x = W / 2 - total / 2;
  ctx.textAlign = 'left';
  for (let i = 0; i < str.length; i++) {
    const pre = ctx.measureText(str.slice(0, i)).width;
    const cw = ctx.measureText(str[i]).width;
    const p = seg(t, t0 + i * 0.022, t0 + i * 0.022 + 0.22);
    if (p <= 0) continue;
    const s = lerp(2.4, 1, ease.outExpo(p));
    ctx.save();
    ctx.translate(x + pre + cw / 2, y - size * 0.35);
    ctx.scale(s, s);
    ctx.globalAlpha = clamp(p * 3);
    ctx.fillStyle = color;
    ctx.fillText(str[i], -cw / 2, size * 0.35);
    ctx.restore();
  }
  ctx.letterSpacing = '0px';
  return { size, total };
}

const VALUES = [
  { w: 0, word: 'Skalierbar.', bg: COL.blue, fg: COL.white, acc: COL.yellow, note: 'wächst mit' },
  { w: 1, word: 'Wirtschaftlich.', bg: COL.mint, fg: COL.navy, acc: COL.coral, note: 'rechnet sich' },
  { w: 2, word: 'Verantwortungsvoll.', bg: COL.coral, fg: COL.white, acc: COL.yellow, note: 'sicher & souverän' },
];
const drop = {
  start: 48.05, end: 53.6,
  draw(ctx, t) {
    const starts = VALUES.map((v) => wt('a10', v.w) - 0.03);
    const k = t < starts[1] ? 0 : t < starts[2] ? 1 : 2;
    const v = VALUES[k], t0 = starts[k];
    // closing move: the colour field folds into the hero layout (navy with brand blocks)
    const fold = seg(t, 52.75, 53.6, ease.inOutExpo);
    bg(ctx, v.bg);
    const [sx, sy] = shake(t, t0, 18, 0.45);
    ctx.save();
    camera(ctx, { z: 1.0 + 0.06 * seg(t, t0, t0 + 1.5), x: sx, y: sy });
    // stage blocks sweep through on every value
    block(ctx, -20, 120 + k * 60, 520, 150, v.acc, seg(t, t0 + 0.05, t0 + 0.4), 'left');
    block(ctx, W - 300, 760 - k * 40, 300, 220, k === 1 ? COL.blue : COL.navy, seg(t, t0 + 0.1, t0 + 0.45), 'right');
    slam(ctx, v.word, t, t0, { color: v.fg });
    hand(ctx, v.note, 260, 860, seg(t, t0 + 0.45, t0 + 0.8), { size: 72, color: v.fg, rot: -0.06 });
    stroke(ctx, [...pts.line(160, 820, 190, 850, 4), ...pts.line(190, 850, 240, 780, 6).slice(1)], seg(t, t0 + 0.35, t0 + 0.5), { color: v.fg, width: 7, t, seed: 400 + k });
    label(ctx, `Warum Assecor? — 0${k + 1}`, 92, 82, { color: v.fg, size: 15 });
    ctx.restore();
    // fold into the hero: navy closes in from the edges, leaving the coral and blue blocks of the homepage stage
    if (fold > 0) {
      ctx.fillStyle = COL.navy;
      ctx.fillRect(0, 0, W, H * 0.5 * fold);
      ctx.fillRect(0, H - H * 0.5 * fold, W, H * 0.5 * fold + 1);
    }
  },
  blur: (t) => {
    const near = VALUES.some((v) => { const s = wt('a10', v.w); return t > s - 0.05 && t < s + 0.3; });
    return near || t > 52.75 ? 6 : 3;
  },
  sfx: [
    { t: 48.03, s: 'boom', gain: 0.6 },
    { t: 48.05, type: 'impact', gain: 0.4, big: true },
    { t: wt('a10', 1) - 0.03, s: 'stamp', gain: 0.55 },
    { t: wt('a10', 1) - 0.03, type: 'impact', gain: 0.3 },
    { t: wt('a10', 2) - 0.03, s: 'stamp', gain: 0.55, rate: 0.9 },
    { t: wt('a10', 2) - 0.03, type: 'impact', gain: 0.3 },
    ...[0, 1, 2].map((k) => ({ t: wt('a10', k) + 0.35, s: 'underline', gain: 0.25, rate: 1.2 })),
    { t: 52.75, type: 'whoosh', gain: 0.35, dur: 0.8 },
  ],
};

// --------------------------------------------------------------- claim ---
// "Wir bringen Technologie dorthin, wo sie Wirkung entfaltet." — the hero of assecor.de, re-staged.
const claim = {
  start: 53.6, end: 57.45,
  draw(ctx, t) {
    bg(ctx, COL.navy);
    const hit = wt('a11', 7); // "entfaltet" on the final hit (56.05)
    const [sx, sy] = shake(t, hit, 10, 0.4);
    ctx.save();
    camera(ctx, { z: 1 + 0.035 * seg(t, 53.6, 57.45), x: sx, y: sy });
    // homepage stage blocks
    block(ctx, W - 90, 130, 90, 210, COL.coral, seg(t, 53.6, 53.9), 'right');
    block(ctx, 0, 470, 90, 210, COL.blue, seg(t, 53.65, 53.95), 'left');
    // the claim, word by word
    const boxes = sentence(ctx, 'a11', t, { y: 480, size: 84, weight: 400, breaks: [4], lh: 1.45, out: 56.95 });
    const wk = boxes.find((b) => b.i === 6);
    if (wk) {
      // marker underline on "Wirkung"
      stroke(ctx, pts.swoosh(wk.x - 6, wk.y + 26, wk.w + 14, 10), seg(t, wk.t0 + 0.05, wk.t0 + 0.35), { color: COL.yellow, width: 8, t, seed: 501 });
    }
    // unfold: brand blocks burst out of "entfaltet" on the hit
    const en = boxes.find((b) => b.i === 7);
    if (en && t > hit) {
      const lt = t - hit;
      const pal = [COL.mint, COL.blue, COL.coral, COL.yellow, COL.white];
      for (let i = 0; i < 36; i++) {
        const a = hash1(i * 3.3) * TAU, sp = 300 + 900 * hash1(i * 7.7);
        const d = sp * (1 - Math.exp(-lt * 3.2));
        const s = (14 + 40 * hash1(i * 1.9)) * (1 - seg(lt, 0.6, 1.3));
        if (s <= 0) continue;
        ctx.save();
        ctx.translate(en.x + en.w / 2 + Math.cos(a) * d, en.y - 30 + Math.sin(a) * d * 0.7);
        ctx.rotate(lt * (hash1(i) - 0.5) * 6);
        ctx.fillStyle = pal[i % pal.length];
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      }
    }
    ctx.restore();
    label(ctx, 'Skalierbar · wirtschaftlich · verantwortungsvoll', W / 2, 760, { align: 'center', alpha: 0.6 * seg(t, 54, 54.4) * (1 - seg(t, 56.9, 57.2)), size: 15 });
    frameMarks(ctx, t, { idx: 'Assecor GmbH', title: 'IT-Beratung & Softwareentwicklung', alpha: 0.45 });
  },
  blur: (t) => (t > wt('a11', 7) && t < wt('a11', 7) + 0.6 ? 5 : 3),
  sfx: [
    { t: wt('a11', 6) + 0.05, s: 'underline', gain: 0.35, rate: 0.9 },
    { t: wt('a11', 7) - 0.02, type: 'final', gain: 0.35 },
    { t: wt('a11', 7), s: 'blocks', gain: 0.4, rate: 0.8 },
  ],
};

// --------------------------------------------------------- logo + CTA ---
const endcard = {
  start: 57.45, end: 64.01,
  draw(ctx, t) {
    bg(ctx, COL.navy);
    ctx.save();
    camera(ctx, { z: 1 + 0.025 * seg(t, 57.45, 63) });
    block(ctx, W - 90, 130, 90, 210, COL.coral, 1, 'right');
    block(ctx, 0, 470, 90, 210, COL.blue, 1, 'left');
    block(ctx, W - 260, H - 170, 170, 170, COL.yellow, seg(t, 58.9, 59.2), 'up');
    // logo
    logo(ctx, W / 2, 430, 1040, t, wt('a12', 0) - 0.12, { stagger: 0.055, dur: 0.6 });
    // claim line
    sentence(ctx, 'a12', t, { from: 1, y: 640, size: 54, weight: 300, style: 'italic', styles: { 4: { weight: 700, style: 'italic' }, 5: { weight: 700, style: 'italic', color: COL.yellow } } });
    // CTA pill like the site's yellow buttons
    const pp = ease.outBack(seg(t, 60.45, 60.75));
    if (pp > 0) {
      const cx = W / 2, cy = 790;
      const press = 1 - 0.06 * Math.exp(-Math.pow((t - 61.15) * 12, 2));
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(pp * press, pp * press);
      ctx.fillStyle = COL.yellow;
      ctx.beginPath(); ctx.roundRect(-210, -46, 420, 92, 46); ctx.fill();
      setFont(ctx, 34, 500, FT.sans); ctx.fillStyle = COL.navy; ctx.textAlign = 'center';
      ctx.fillText('assecor.de', 0, 12);
      ctx.restore();
      // cursor arrives and clicks
      const cp = ease.inOutCubic(seg(t, 60.6, 61.1));
      const mx = lerp(cx + 520, cx + 120, cp), my = lerp(cy + 260, cy + 18, cp);
      if (t > 60.6) {
        ctx.save(); ctx.translate(mx, my);
        ctx.fillStyle = COL.white; ctx.strokeStyle = COL.navy; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.lineTo(12, 35); ctx.lineTo(22, 56); ctx.lineTo(30, 52); ctx.lineTo(20, 32); ctx.lineTo(36, 32); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
        const rp = seg(t, 61.15, 61.6);
        if (rp > 0 && rp < 1) { ctx.strokeStyle = rgbaHex(COL.white, 1 - rp); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx + 120, cy + 18, 20 + 70 * rp, 0, TAU); ctx.stroke(); }
      }
      hand(ctx, 'Wir freuen uns!', cx + 270, cy + 120, seg(t, 61.4, 61.9), { size: 58, color: COL.yellow, rot: -0.07 });
    }
    ctx.restore();
    frameMarks(ctx, t, { idx: 'Assecor GmbH', title: 'Berlin · Hannover · Nürnberg · Stralsund', alpha: 0.45 });
  },
  post(ctx, t) {
    // CRT power-off: the picture collapses into a line, then a dot
    if (t < 62.7) return;
    const a = seg(t, 62.7, 62.98, ease.inCubic), b = seg(t, 62.98, 63.25, ease.inCubic);
    const h = lerp(H, 3, a), w = lerp(W, 6, b);
    const img = ctx.getImageData(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (t > 63.5) return;
    if (b <= 0) {
      // squash the frame vertically
      const tmp = new OffscreenCanvas(W, H); tmp.getContext('2d').putImageData(img, 0, 0);
      ctx.drawImage(tmp, 0, H / 2 - h / 2, W, h);
      ctx.fillStyle = `rgba(230,240,255,${a * 0.9})`; ctx.fillRect(0, H / 2 - h / 2, W, h);
    } else {
      ctx.fillStyle = `rgba(235,245,255,${1 - seg(t, 63.25, 63.5)})`;
      ctx.fillRect(W / 2 - w / 2, H / 2 - 2, w, 4);
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 6 * (1 - seg(t, 63.25, 63.5)), 0, TAU); ctx.fill();
    }
  },
  blur: (t) => (t > 62.7 && t < 63.3 ? 5 : 3),
  sfx: [
    { t: wt('a12', 0) - 0.12, s: 'whoosh', gain: 0.3 },
    { t: wt('a12', 0) - 0.05, type: 'chime', gain: 0.3 },
    { t: 58.9, s: 'blocks', gain: 0.25, rate: 1.2 },
    { t: 60.45, type: 'pop', gain: 0.4 },
    { t: 61.15, type: 'mouse', gain: 0.5 },
    { t: 61.4, s: 'scribble', gain: 0.22, rate: 1.1 },
    { t: 62.68, s: 'crtOff', gain: 0.55 },
  ],
};

export default [drop, claim, endcard];
