// 04 — Particles & generative systems: a deterministic fixed-step simulation.
// Burst -> curl-noise flow -> particles assemble into a word -> release -> vortex -> collapse -> flash.
import { W, H, TAU, clamp, lerp, ease, seg, noise3, rng, C, rgba } from '../engine/core.js';
import { F, font, fillBg } from '../engine/draw.js';

const N = 4600;
const DT = 1 / 240;
const HIST = 10; // trail length in steps
const WORD = 'IDEEN';

const px = new Float32Array(N), py = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
const tx = new Float32Array(N), ty = new Float32Array(N);
const hx = new Float32Array(N * HIST), hy = new Float32Array(N * HIST);
const prevX = new Float32Array(N), prevY = new Float32Array(N);
const orbit = new Float32Array(N);
const delay = new Float32Array(N), size = new Float32Array(N), colIdx = new Uint8Array(N);
let step = -1;
const PALETTE = [C.orange, C.violet, C.lime, C.paper, C.orange];
const COLSTR = PALETTE.map((c) => rgba(c));

function sampleWord() {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d', { willReadFrequently: true });
  font(c, 380, 900);
  c.letterSpacing = '-12px';
  c.textAlign = 'center';
  c.fillStyle = '#fff';
  c.fillText(WORD, 960, 540 + 135);
  const d = c.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
  return pts;
}

function reset() {
  const r = rng(42);
  const pts = sampleWord();
  for (let i = 0; i < N; i++) {
    const a = r() * TAU, s = 300 + r() * 1400;
    px[i] = 960 + Math.cos(a) * 4; py[i] = 540 + Math.sin(a) * 4;
    vx[i] = Math.cos(a) * s; vy[i] = Math.sin(a) * s;
    const p = pts[Math.floor(r() * pts.length)];
    tx[i] = p[0] + (r() - 0.5) * 3; ty[i] = p[1] + (r() - 0.5) * 3;
    delay[i] = r() * 0.2 + ((p[0] - 400) / 1100) * 0.2;
    orbit[i] = 140 + Math.pow(r(), 0.7) * 380;
    size[i] = 1.3 + r() * r() * 3.2;
    colIdx[i] = Math.floor(r() * PALETTE.length);
    for (let k = 0; k < HIST; k++) { hx[i * HIST + k] = px[i]; hy[i * HIST + k] = py[i]; }
    prevX[i] = px[i]; prevY[i] = py[i];
  }
  step = 0;
}

// forces as a function of local time
function stepSim(n) {
  const lt = n * DT;
  const attractT = (i) => clamp((lt - 0.95 - delay[i]) / 0.45);
  const release = lt >= 2.55;
  const vortex = seg(lt, 2.6, 3.4) ;
  const collapse = seg(lt, 4.9, 5.6, ease.inCubic);
  const slot = n % HIST;
  for (let i = 0; i < N; i++) {
    prevX[i] = px[i]; prevY[i] = py[i];
    let x = px[i], y = py[i];
    // curl noise flow field
    const s = 0.0021, z = lt * 0.25;
    const e = 1;
    const n1 = noise3(x * s, (y + e) * s, z), n2 = noise3(x * s, (y - e) * s, z);
    const n3 = noise3((x + e) * s, y * s, z), n4 = noise3((x - e) * s, y * s, z);
    let fx = (n1 - n2) / (2 * e * s) * 0.5, fy = -(n3 - n4) / (2 * e * s) * 0.5;
    let ax = 0, ay = 0;
    const flowAmt = 380;
    let drag = 2.2;
    const a = release ? 0 : ease.inOutCubic(attractT(i));
    if (a > 0) {
      // critically damped spring to the glyph target
      const k = 260 * a;
      ax += (tx[i] - x) * k;
      ay += (ty[i] - y) * k;
      drag = lerp(2.2, 26, a);
    }
    ax += fx * flowAmt * (1 - a) * (1 - collapse);
    ay += fy * flowAmt * (1 - a) * (1 - collapse);
    if (release && n === Math.round(2.55 / DT)) {
      const dx = x - 960, dy = y - 560, d = Math.hypot(dx, dy) + 1;
      const imp = 900 + (i % 7) * 120;
      vx[i] += (dx / d) * imp; vy[i] += (dy / d) * imp;
    }
    let galaxy = false;
    if (vortex > 0) {
      // galaxy: spring each particle onto its own orbit radius, drive tangential speed
      const dx = x - 960, dy = (y - 540) * 1.6, d = Math.hypot(dx, dy) + 1e-3;
      const ux = dx / d, uy = dy / d, txx = -uy, tyy = ux;
      const vr = vx[i] * ux + vy[i] * uy, vt = vx[i] * txx + vy[i] * tyy;
      const R = orbit[i] * (1 - collapse * 0.97);
      const vT = (520 + 260 * collapse) * Math.sqrt(300 / (d + 60));
      const ar = (R - d) * 30 * vortex - vr * 6 * vortex;
      const at = (vT - vt) * 4 * vortex;
      ax += ux * ar + txx * at;
      ay += (uy * ar + tyy * at) / 1.6;
      galaxy = true;
    }
    const dragNow = galaxy ? drag * (1 - vortex) : drag;
    vx[i] += (ax - vx[i] * dragNow) * DT;
    vy[i] += (ay - vy[i] * dragNow) * DT;
    px[i] = x + vx[i] * DT;
    py[i] = y + vy[i] * DT;
    hx[i * HIST + slot] = px[i];
    hy[i * HIST + slot] = py[i];
  }
}

function advanceTo(lt) {
  const target = Math.floor(Math.max(0, lt) / DT);
  if (step < 0 || target < step) reset();
  while (step < target) { step++; stepSim(step); }
  return (Math.max(0, lt) / DT) - target; // fraction for interpolation
}

export default {
  id: 'particles',
  label: 'Partikel & Generative Systeme',
  num: '04',
  start: 18,
  end: 24,
  hud: C.paper,
  init() { reset(); },
  draw(ctx, lt) {
    fillBg(ctx, C.ink);
    // soft violet glow
    const g = ctx.createRadialGradient(960, 540, 0, 960, 540, 900);
    g.addColorStop(0, rgba(C.violet, 0.22));
    g.addColorStop(1, rgba(C.violet, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const f = advanceTo(lt);
    const formed = seg(lt, 1.3, 1.9) * (1 - seg(lt, 2.5, 2.7));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    // bucket by colour to minimise state changes
    for (let c = 0; c < PALETTE.length; c++) {
      ctx.strokeStyle = COLSTR[c];
      for (let i = 0; i < N; i++) {
        if (colIdx[i] !== c) continue;
        const x = lerp(prevX[i], px[i], f), y = lerp(prevY[i], py[i], f);
        const old = (step - 6 + HIST * 100) % HIST;
        const ox = hx[i * HIST + old], oy = hy[i * HIST + old];
        const sh = formed > 0 ? 0.6 + 0.4 * Math.sin(lt * 18 + i) : 1;
        ctx.globalAlpha = (0.55 + 0.45 * sh) * (0.85);
        ctx.lineWidth = size[i] * (1 + formed * 0.9);
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(x + 0.01, y);
        ctx.stroke();
      }
    }
    ctx.restore();

    // poetic caption while the word holds
    const cp = seg(lt, 1.6, 2.0, ease.outExpo) * (1 - seg(lt, 2.45, 2.6));
    if (cp > 0) {
      font(ctx, 54, 400, F.serif, 'italic');
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(C.paper, cp);
      ctx.fillText('aus Rauschen wird Form.', 960, 860 + (1 - cp) * 30);
    }
    const cp2 = seg(lt, 3.1, 3.5, ease.outExpo) * (1 - seg(lt, 4.6, 4.9));
    if (cp2 > 0) {
      font(ctx, 20, 500, F.mono);
      ctx.letterSpacing = '6px';
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(C.paper, cp2 * 0.7);
      ctx.fillText(`${N} PARTIKEL · CURL NOISE · 240 HZ SIMULATION`, 960, 1000 - 64 - 40 + (1 - cp2) * 20);
    }

    // collapse into a hot core, then flash
    const core = seg(lt, 5.2, 5.75, ease.inCubic);
    if (core > 0) {
      const rg = ctx.createRadialGradient(960, 540, 0, 960, 540, 60 + core * 260);
      rg.addColorStop(0, rgba(C.paper, core));
      rg.addColorStop(0.3, rgba(C.orange, core * 0.6));
      rg.addColorStop(1, rgba(C.orange, 0));
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }
    const flash = seg(lt, 5.75, 6.0, ease.inExpo);
    if (flash > 0) {
      ctx.fillStyle = rgba(C.paper, flash);
      ctx.beginPath();
      ctx.arc(960, 540, lerp(20, 1250, flash), 0, TAU);
      ctx.fill();
    }
  },
  sfx: [
    { t: 0.0, type: 'burst', gain: 0.8 },
    { t: 0.05, type: 'air', gain: 0.5, dur: 1.2 },
    { t: 1.15, type: 'shimmer', gain: 0.5 },
    { t: 1.6, type: 'chime', gain: 0.4 },
    { t: 2.55, type: 'burst', gain: 0.9 },
    { t: 2.6, type: 'swirl', gain: 0.5, dur: 2.2 },
    { t: 4.9, type: 'suck', gain: 0.7, dur: 0.85 },
  ],
};
