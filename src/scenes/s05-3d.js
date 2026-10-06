// 05 — 3D & camera: a hand-written 3D renderer (perspective projection, painter's sort,
// Lambert shading, atmospheric fog). A kick-reactive column field and a floating icosahedron.
import { W, H, TAU, clamp, lerp, ease, seg, kf, noise3, C, rgba, mix, gradientAt } from '../engine/core.js';
import { F, font, fillBg } from '../engine/draw.js';

const G = 22;
const FOCAL = 1250;
const LIGHT = (() => { const v = [-0.45, 1, 0.35]; const l = Math.hypot(...v); return v.map((x) => x / l); })();
const BG = C.ink;
const RAMP = [C.violet, C.orange, C.lime];

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };

function camera(lt) {
  const yaw = 0.55 + lt * 0.2 + ease.inOutCubic(seg(lt, 2.9, 4.6)) * 1.1;
  const pitch = kf(lt, [[0, 0.62], [2.9, 0.5], [4.2, 0.2, ease.snappy], [5.0, 0.2], [6.0, 1.2, ease.inOutCubic]]);
  const dist = kf(lt, [[0, 30], [0.9, 24, ease.outCubic], [2.9, 23], [4.2, 16.5, ease.snappy], [5.0, 16], [6.0, 27, ease.inOutCubic]]);
  const target = [0, 1.1, 0];
  const pos = [
    target[0] + dist * Math.cos(pitch) * Math.sin(yaw),
    target[1] + dist * Math.sin(pitch),
    target[2] + dist * Math.cos(pitch) * Math.cos(yaw),
  ];
  const fwd = norm(sub(target, pos));
  const right = norm(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  return { pos, fwd, right, up };
}

function project(cam, p) {
  const r = sub(p, cam.pos);
  const z = dot(r, cam.fwd);
  return [960 + (FOCAL * dot(r, cam.right)) / z, 540 - (FOCAL * dot(r, cam.up)) / z, z];
}

function heightAt(i, j, lt) {
  const d = Math.hypot(i, j);
  let h = 0.35 + 0.9 * (0.5 + 0.5 * Math.sin(d * 0.55 - lt * 3.2)) + 0.7 * noise3(i * 0.13, j * 0.13, lt * 0.35);
  // kick pulses: a ring wave per beat
  for (let b = 0; b <= 5.5; b += 0.5) {
    const u = lt - b;
    if (u < 0 || u > 1.6) continue;
    const r = u * 13;
    const amp = (b === 0 ? 3.4 : 1.8) * Math.exp(-u * 2.2) * (1 - Math.exp(-u * 30));
    h += amp * Math.exp(-((d - r) ** 2) / 2.2);
  }
  // flatten into a tidy grid at the end
  return Math.max(0.08, lerp(h, 0.12 + 0.12 * ((i + j) & 1), seg(lt, 4.9, 5.7, ease.inOutCubic)));
}

// icosahedron
const ICO = (() => {
  const t = (1 + Math.sqrt(5)) / 2;
  const v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
  const f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  return { v, f };
})();

function rotY(p, a) { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; }
function rotX(p, a) { const c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; }

function shade(base, n, fog) {
  const l = 0.42 + 0.58 * Math.max(0, dot(n, LIGHT));
  const c = [base[0] * l, base[1] * l, base[2] * l];
  return rgba(mix(c, BG, fog));
}

export default {
  id: '3d',
  label: '3D & Kamera',
  num: '05',
  start: 24,
  end: 30,
  hud: C.paper,
  draw(ctx, lt) {
    fillBg(ctx, BG);
    const sky = ctx.createRadialGradient(960, 380, 0, 960, 380, 1100);
    sky.addColorStop(0, rgba(C.violet, 0.35));
    sky.addColorStop(1, rgba(C.violet, 0));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const cam = camera(lt);
    const items = [];
    const half = (G - 1) / 2;
    for (let a = 0; a < G; a++) for (let b = 0; b < G; b++) {
      const i = a - half, j = b - half;
      const h = heightAt(i, j, lt);
      const cx = i, cz = j;
      const dist = Math.hypot(cx - cam.pos[0], h / 2 - cam.pos[1], cz - cam.pos[2]);
      items.push({ kind: 'col', i, j, h, dist });
    }
    // floating icosahedron
    const icoY = 5.2 + 0.35 * Math.sin(lt * 2.2);
    const icoS = 1.9 * (0.4 + 0.6 * ease.outBack(seg(lt, 0.15, 0.9))) * (1 - ease.inBack(seg(lt, 4.7, 5.1)));
    const ia = lt * 0.9, ib = lt * 0.55;
    const iv = ICO.v.map((p) => { const r = rotX(rotY(p, ia), ib); return [r[0] * icoS, r[1] * icoS + icoY, r[2] * icoS]; });
    for (const f of ICO.f) {
      const a = iv[f[0]], b = iv[f[1]], c = iv[f[2]];
      const ctr = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
      const n = norm(cross(sub(b, a), sub(c, a)));
      if (icoS <= 0.01 || dot(n, sub(cam.pos, ctr)) <= 0) continue;
      items.push({ kind: 'tri', pts: [a, b, c], n, dist: Math.hypot(...sub(ctr, cam.pos)) });
    }
    items.sort((x, y) => y.dist - x.dist);

    const maxD = 40;
    ctx.lineJoin = 'round';
    for (const it of items) {
      const fog = clamp((it.dist - 14) / (maxD - 14)) * 0.85;
      if (it.kind === 'tri') {
        const P = it.pts.map((p) => project(cam, p));
        const l = 0.3 + 0.7 * Math.max(0, dot(it.n, LIGHT));
        const rim = Math.pow(1 - Math.abs(dot(it.n, cam.fwd)), 2);
        ctx.fillStyle = rgba(mix(mix(C.violet, C.paper, l), C.orange, rim * 0.55));
        ctx.strokeStyle = rgba(C.paper, 0.55);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[1][0], P[1][1]); ctx.lineTo(P[2][0], P[2][1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        continue;
      }
      const { i, j, h } = it;
      const s = 0.4;
      const x0 = i - s, x1 = i + s, z0 = j - s, z1 = j + s;
      const base = gradientAt(RAMP, clamp((h - 0.3) / 3.2));
      // visible sides
      const sides = [
        { n: [1, 0, 0], q: [[x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0]], c: [x1, h / 2, j] },
        { n: [-1, 0, 0], q: [[x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1]], c: [x0, h / 2, j] },
        { n: [0, 0, 1], q: [[x1, 0, z1], [x0, 0, z1], [x0, h, z1], [x1, h, z1]], c: [i, h / 2, z1] },
        { n: [0, 0, -1], q: [[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0]], c: [i, h / 2, z0] },
      ];
      for (const sd of sides) {
        if (dot(sd.n, sub(cam.pos, sd.c)) <= 0) continue;
        const P = sd.q.map((p) => project(cam, p));
        ctx.fillStyle = shade(mix(base, C.ink, 0.25), sd.n, fog);
        ctx.beginPath();
        ctx.moveTo(P[0][0], P[0][1]);
        for (let k = 1; k < 4; k++) ctx.lineTo(P[k][0], P[k][1]);
        ctx.closePath();
        ctx.fill();
      }
      if (cam.pos[1] > h) {
        const P = [[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]].map((p) => project(cam, p));
        ctx.fillStyle = shade(mix(base, C.paper, 0.08), [0, 1, 0], fog);
        ctx.beginPath();
        ctx.moveTo(P[0][0], P[0][1]);
        for (let k = 1; k < 4; k++) ctx.lineTo(P[k][0], P[k][1]);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = rgba(C.paper, 0.18 * (1 - fog));
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // typographic layer
    const tp = seg(lt, 0.5, 1.0, ease.outExpo) * (1 - seg(lt, 4.6, 5.0, ease.inExpo));
    if (tp > 0) {
      font(ctx, 20, 500, F.mono);
      ctx.letterSpacing = '6px';
      ctx.fillStyle = rgba(C.paper, 0.7 * tp);
      ctx.textAlign = 'center';
      ctx.fillText(`${G * G} SÄULEN · PERSPEKTIVE · PAINTER'S ALGORITHM`, 960, 1000 - 64 - 40 + (1 - tp) * 20);
    }
    // flash from the previous scene
    const fl = 1 - seg(lt, 0.0, 0.45, ease.outCubic);
    if (fl > 0) {
      ctx.fillStyle = rgba(C.paper, fl);
      ctx.fillRect(0, 0, W, H);
    }
  },
  blur: (lt) => (lt > 3.0 && lt < 4.4 ? 6 : 0),
  sfx: [
    { t: 0.0, type: 'impact', gain: 1.2, big: true },
    { t: 0.0, type: 'crash', gain: 0.7 },
    { t: 2.9, type: 'whoosh', gain: 0.6, dur: 1.3, pan: 0.4 },
    { t: 4.85, type: 'drop', gain: 0.5 },
  ],
};
