// Shot 4 (22–30 s): out of the light, a 3D field of 2,560 dots that breathes with the kick.
// On "Takt." the dots leave the terrain and lock into a dot-matrix word, pulse on the beat,
// then spiral into the centre and become a drop of liquid.
import { W, H, TAU, clamp, lerp, ease, seg, kf, noise3, hash1, C, rgba, mix } from '../engine/core.js';
import { F, font, fillBg } from '../engine/draw.js';
import { spoken, wordAt, bgGlow } from './common.js';

const GX = 64, GZ = 40, N = GX * GZ;
const FOC = 1150;
const tx = new Float32Array(N), ty = new Float32Array(N);
const sx = new Float32Array(N), sy = new Float32Array(N), sz = new Float32Array(N), sh = new Float32Array(N);
const order = new Uint16Array(N);

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };

function camera(t) {
  const yaw = 0.35 + (t - 22) * 0.16;
  const pitch = kf(t, [[22, 1.45], [23.6, 0.62, ease.inOutCubic], [25.4, 0.48], [26.6, 1.5, ease.inOutCubic]]);
  const dist = kf(t, [[22, 14], [23.6, 34, ease.inOutCubic], [25.4, 30], [26.6, 40, ease.inOutCubic]]);
  const target = [0, 0, 0];
  const pos = [dist * Math.cos(pitch) * Math.sin(yaw), dist * Math.sin(pitch), dist * Math.cos(pitch) * Math.cos(yaw)];
  const fwd = norm(sub(target, pos));
  const right = norm(cross(fwd, [0, 1, 0]));
  return { pos, fwd, right, up: cross(right, fwd) };
}

function height(x, z, t) {
  const d = Math.hypot(x, z);
  let h = 0.9 * noise3(x * 0.09, z * 0.09, t * 0.35) + 0.6 * Math.sin(d * 0.45 - t * 3);
  for (let b = 22; b < 30; b += 0.5) {
    const u = t - b;
    if (u < 0 || u > 1.6) continue;
    h += (b === 22 ? 3.2 : 1.6) * Math.exp(-u * 2.4) * (1 - Math.exp(-u * 30)) * Math.exp(-((d - u * 22) ** 2) / 6);
  }
  return h;
}

function sampleText() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  font(g, 360, 900);
  g.letterSpacing = '6px';
  g.textAlign = 'center';
  g.fillStyle = '#fff';
  g.fillText('TAKT.', 960, 540 + 130);
  const d = g.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y += 9) for (let x = 0; x < W; x += 9) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
  // assign: dots sorted left->right map to text points sorted left->right (keeps motion coherent)
  const idx = [...Array(N).keys()].sort((a, b) => (a % GX) - (b % GX) || Math.floor(a / GX) - Math.floor(b / GX));
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  idx.forEach((i, k) => { const p = pts[Math.floor((k / N) * pts.length)]; tx[i] = p[0]; ty[i] = p[1]; });
}

export default {
  start: 22,
  end: 30,
  hud: (t) => (t < 29.2 ? C.ink : C.paper),
  init() { sampleText(); },
  draw(ctx, t) {
    fillBg(ctx, C.paper);
    const cam = camera(t);
    const tT = wordAt('l5', 4); // "Takt."
    const toText = ease.snappy(seg(t, tT - 0.15, tT + 0.45));
    const release = seg(t, 28.3, 29.75, ease.inCubic);
    // ink drop expanding from the centre (the next shot's darkness)
    const ink = seg(t, 29.05, 29.95, ease.inOutCubic);

    let k = 0;
    for (let j = 0; j < GZ; j++) for (let i = 0; i < GX; i++, k++) {
      const x = i - (GX - 1) / 2, z = j - (GZ - 1) / 2;
      const y = height(x, z, t);
      const r = sub([x * 0.9, y, z * 0.9], cam.pos);
      const zz = dot(r, cam.fwd);
      let px = 960 + (FOC * dot(r, cam.right)) / zz, py = 540 - (FOC * dot(r, cam.up)) / zz;
      let size = Math.max(0.6, (0.16 * FOC) / zz);
      if (toText > 0) {
        const pulse = t >= 27.5 ? 1 + 0.1 * Math.exp(-((t - 27.5) % 0.5) * 9) : 1;
        const qx = 960 + (tx[k] - 960) * pulse, qy = 540 + (ty[k] - 540) * pulse;
        const e = ease.snappy(clamp(toText * 1.25 - hash1(k) * 0.25));
        px = lerp(px, qx, e); py = lerp(py, qy, e);
        size = lerp(size, 3.4, e);
      }
      if (release > 0) {
        const ang = release * (5 + hash1(k * 3) * 3);
        const rad = 1 - ease.inCubic(clamp(release * 1.15 - hash1(k * 5) * 0.15));
        const dx = px - 960, dy = py - 540;
        px = 960 + (dx * Math.cos(ang) - dy * Math.sin(ang)) * rad;
        py = 540 + (dx * Math.sin(ang) + dy * Math.cos(ang)) * rad;
        size *= 1 + release;
      }
      sx[k] = px; sy[k] = py; sz[k] = zz; sh[k] = size;
      order[k] = k;
    }
    // far to near
    const idx = Array.from(order).sort((a, b) => sz[b] - sz[a]);
    for (const k2 of idx) {
      const hgt = height((k2 % GX) - (GX - 1) / 2, Math.floor(k2 / GX) - (GZ - 1) / 2, t);
      let col = hgt > 1.4 ? C.orange : hgt < -0.9 ? C.violet : C.ink;
      if (toText > 0.5) col = C.ink;
      if (release > 0) col = mix(col, C.orange, release);
      ctx.fillStyle = rgba(col);
      ctx.beginPath();
      ctx.arc(sx[k2], sy[k2], sh[k2], 0, TAU);
      ctx.fill();
    }

    if (ink > 0) {
      ctx.fillStyle = rgba(C.ink);
      ctx.beginPath();
      ctx.arc(960, 540, ink * 1150, 0, TAU);
      ctx.fill();
    }
    // the gathered dots become one drop of liquid
    const drop = seg(t, 29.45, 30.0, ease.outBack);
    if (drop > 0) {
      ctx.fillStyle = rgba(C.orange);
      ctx.beginPath();
      ctx.arc(960, 540, 140 * drop, 0, TAU);
      ctx.fill();
    }

    spoken(ctx, 'l5', t, { y: 930, size: 24, family: F.mono, style: 'normal', weight: 600, tracking: 6, upper: true, color: C.ink, out: 28.4, upto: 4 });

    const flash = 1 - seg(t, 22.0, 22.5, ease.outCubic);
    if (flash > 0) { ctx.fillStyle = rgba(C.paper, flash); ctx.fillRect(0, 0, W, H); }
  },
  blur: (t) => (t < 23.7 || (t > 26.8 && t < 27.5) || t > 28.3 ? 8 : 4),
  sfx: [
    { t: 22.0, type: 'impact', gain: 1.25, big: true },
    { t: 22.0, type: 'crash', gain: 0.8 },
    { t: 22.1, type: 'whooshUp', gain: 0.5, dur: 1.4 },
    { t: 26.8, type: 'swarm', gain: 0.6, dur: 0.6 },
    { t: 27.0, type: 'lock', gain: 0.8 },
    { t: 28.3, type: 'swirl', gain: 0.6, dur: 1.4 },
    { t: 29.45, type: 'drip', gain: 0.9 },
  ],
};
