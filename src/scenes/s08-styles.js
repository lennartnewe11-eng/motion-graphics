// 08 — Style range: one word, eight design languages, cut on the beat,
// accelerating into 16ths and resolving into a mosaic.
import { W, H, TAU, clamp, lerp, ease, seg, hash1, C, rgba, mix } from '../engine/core.js';
import { F, font, fillBg, glyphs, roundRect } from '../engine/draw.js';

function caption(ctx, idx, name, col, x = 120, y = 150) {
  font(ctx, 18, 700, F.mono);
  ctx.letterSpacing = '4px';
  ctx.fillStyle = rgba(col);
  ctx.textAlign = 'left';
  ctx.fillText(`${String(idx + 1).padStart(2, '0')} / ${name.toUpperCase()}`, x, y);
  ctx.letterSpacing = '0px';
}

const STYLES = [
  {
    name: 'Swiss', hud: C.paper,
    draw(ctx, u) {
      fillBg(ctx, C.orange);
      ctx.strokeStyle = rgba(C.paper, 0.35);
      ctx.lineWidth = 1.5;
      for (const x of [120, 600, 1080, 1560]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      font(ctx, 560, 900);
      ctx.letterSpacing = '-30px';
      ctx.fillStyle = rgba(C.paper);
      ctx.fillText('Stil', 100 - u * 40, 930);
      ctx.letterSpacing = '0px';
      font(ctx, 30, 600);
      ctx.fillStyle = rgba(C.paper);
      ctx.fillText('Form folgt', 1086, 200);
      ctx.fillText('Funktion.', 1086, 238);
      caption(ctx, 0, this.name, C.paper);
    },
  },
  {
    name: 'Editorial', hud: C.ink,
    draw(ctx, u) {
      fillBg(ctx, C.paper);
      ctx.strokeStyle = rgba(C.ink);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(120, 250); ctx.lineTo(1800, 250); ctx.moveTo(120, 860); ctx.lineTo(1800, 860); ctx.stroke();
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(120, 262); ctx.lineTo(1800, 262); ctx.stroke();
      font(ctx, 470, 900, F.playfair, 'italic');
      ctx.fillStyle = rgba(C.ink);
      ctx.textAlign = 'center';
      const s = 1.06 - u * 0.06;
      ctx.save(); ctx.translate(960, 720); ctx.scale(s, s); ctx.fillText('Stil', 0, 0); ctx.restore();
      font(ctx, 18, 500, F.mono);
      ctx.letterSpacing = '5px';
      ctx.fillText('AUSGABE Nº 08  —  HERBST 2026', 960, 905);
      ctx.letterSpacing = '0px';
      caption(ctx, 1, this.name, C.ink, 120, 215);
    },
  },
  {
    name: 'Brutal', hud: C.lime,
    draw(ctx, u) {
      fillBg(ctx, C.lime);
      ctx.save();
      ctx.translate(960, 560);
      ctx.rotate(-0.06);
      font(ctx, 600, 900, F.unbounded);
      ctx.fillStyle = rgba(C.ink);
      ctx.textAlign = 'center';
      ctx.fillText('STIL', u * 60 - 30, 220);
      ctx.restore();
      ctx.fillStyle = rgba(C.ink);
      ctx.fillRect(0, 0, W, 90);
      ctx.fillRect(0, H - 70, W, 70);
      caption(ctx, 2, this.name, C.lime, 120, 58);
    },
  },
  {
    name: 'Retro', hud: C.paper,
    draw(ctx, u) {
      fillBg(ctx, C.violet);
      // sunburst
      ctx.save();
      ctx.translate(960, 620);
      ctx.rotate(u * 0.2);
      ctx.fillStyle = rgba(C.paper, 0.08);
      for (let k = 0; k < 24; k += 2) {
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.arc(0, 0, 2000, (k / 24) * TAU, ((k + 1) / 24) * TAU);
        ctx.fill();
      }
      ctx.restore();
      font(ctx, 640, 400, F.bebas);
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(C.orange);
      for (let k = 28; k > 0; k--) ctx.fillText('STIL', 960 + k * 1.6, 820 + k * 1.6);
      ctx.fillStyle = rgba(C.paper);
      ctx.fillText('STIL', 960, 820);
      caption(ctx, 3, this.name, C.paper);
    },
  },
  {
    name: 'Terminal', hud: C.lime,
    draw(ctx, u, lt) {
      fillBg(ctx, C.ink);
      font(ctx, 22, 500, F.mono);
      ctx.fillStyle = rgba(C.lime, 0.55);
      ctx.fillText('claude@reel:~$ render --style', 120, 300);
      font(ctx, 260, 800, F.mono);
      ctx.fillStyle = rgba(C.lime);
      const str = '> stil';
      const n = Math.min(str.length, Math.floor(2 + u * 8));
      ctx.fillText(str.slice(0, n), 110, 640);
      const w = ctx.measureText(str.slice(0, n)).width;
      if (Math.floor(lt * 8) % 2 === 0) ctx.fillRect(130 + w, 450, 140, 220);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
      caption(ctx, 4, this.name, C.lime);
    },
  },
  {
    name: 'Outline', hud: C.paper,
    draw(ctx, u) {
      fillBg(ctx, C.ink);
      font(ctx, 420, 800, F.syne);
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      for (let k = 5; k >= 1; k--) {
        ctx.strokeStyle = rgba(C.paper, 0.9 - k * 0.14);
        ctx.strokeText('STIL', 960, 700 - k * (70 + u * 30));
        ctx.strokeText('STIL', 960, 700 + k * (70 + u * 30));
      }
      ctx.fillStyle = rgba(C.orange);
      ctx.fillText('STIL', 960, 700);
      caption(ctx, 5, this.name, C.paper);
    },
  },
  {
    name: 'Soft', hud: C.ink,
    draw(ctx, u) {
      fillBg(ctx, C.pink);
      ctx.fillStyle = rgba(C.lime);
      ctx.beginPath(); ctx.arc(1400 - u * 40, 330, 260, 0, TAU); ctx.fill();
      ctx.fillStyle = rgba(C.paper);
      ctx.beginPath(); ctx.arc(520 + u * 40, 760, 200, 0, TAU); ctx.fill();
      font(ctx, 500, 900, F.fraunces);
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(C.ink);
      ctx.save(); ctx.translate(960, 730); ctx.rotate(-0.04 + u * 0.04); ctx.fillText('stil', 0, 0); ctx.restore();
      caption(ctx, 6, this.name, C.ink);
    },
  },
  {
    name: 'Glitch', hud: C.paper,
    draw(ctx, u, lt) {
      fillBg(ctx, C.ink);
      font(ctx, 520, 700, F.grotesk);
      ctx.textAlign = 'center';
      const seed = Math.floor(lt * 30);
      for (let s = 0; s < 14; s++) {
        const y0 = 300 + s * 36, h = 36;
        const off = (hash1(seed * 31 + s) - 0.5) * 140 * (hash1(s + seed) > 0.6 ? 1 : 0.15);
        ctx.save();
        ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgb(255,0,60)';
        ctx.fillText('STIL', 960 + off - 14, 760);
        ctx.fillStyle = 'rgb(0,220,255)';
        ctx.fillText('STIL', 960 + off + 14, 760);
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
      }
      caption(ctx, 7, this.name, C.paper);
    },
  },
];

// which style is on screen, and progress inside the cut
function cutAt(lt) {
  if (lt < 2) { const i = Math.floor(lt / 0.25); return { i: i % 8, u: (lt % 0.25) / 0.25 }; }
  if (lt < 3) { const k = Math.floor((lt - 2) / 0.125); return { i: (k * 3 + 1) % 8, u: ((lt - 2) % 0.125) / 0.125 }; }
  return null;
}

function mosaic(ctx, lt) {
  fillBg(ctx, C.ink);
  const tw = W / 4, th = H / 2;
  for (let k = 0; k < 8; k++) {
    const cx = (k % 4) * tw, cy = Math.floor(k / 4) * th;
    const order = [0, 5, 2, 7, 4, 1, 6, 3][k];
    const ap = seg(lt, 3.0 + order * 0.035, 3.3 + order * 0.035, ease.outExpo);
    const out = seg(lt, 3.62 + order * 0.04, 3.9 + order * 0.04, ease.inExpo);
    if (ap <= 0 || out >= 1) continue;
    ctx.save();
    const pad = 6;
    ctx.beginPath();
    const s = ap * (1 - out);
    const w = (tw - pad * 2) * s, h = (th - pad * 2) * s;
    ctx.rect(cx + tw / 2 - w / 2, cy + th / 2 - h / 2, w, h);
    ctx.clip();
    ctx.translate(cx + tw / 2, cy + th / 2);
    ctx.scale(0.5, 0.5);
    ctx.translate(-960, -540);
    STYLES[k].draw(ctx, (lt - 3) % 1, lt);
    ctx.restore();
  }
}

export default {
  id: 'styles',
  label: 'Stil-Bandbreite',
  num: '08',
  start: 42,
  end: 46,
  hud: (lt) => { const c = cutAt(lt); return c ? STYLES[c.i].hud : C.paper; },
  draw(ctx, lt) {
    const c = cutAt(lt);
    if (c) STYLES[c.i].draw(ctx, c.u, lt);
    else mosaic(ctx, lt);
  },
  blur: () => 1,
  sfx: [
    ...Array.from({ length: 8 }, (_, i) => ({ t: i * 0.25, type: 'cut', gain: 0.55, variant: i })),
    ...Array.from({ length: 8 }, (_, i) => ({ t: 2 + i * 0.125, type: 'cut', gain: 0.45, variant: (i * 3 + 1) % 8 })),
    ...Array.from({ length: 8 }, (_, i) => ({ t: 3.0 + i * 0.035, type: 'tick', gain: 0.3, pitch: 1.4 + i * 0.08 })),
    { t: 3.1, type: 'riser', gain: 0.7, dur: 0.9 },
    { t: 3.62, type: 'suck', gain: 0.6, dur: 0.38 },
  ],
};
