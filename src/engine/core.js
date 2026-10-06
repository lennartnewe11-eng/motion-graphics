// Core math, easing, springs, keyframes, noise and colour helpers.
// Everything is a pure function of time so any frame can be rendered in any order.

export const W = 1920;
export const H = 1080;
export const TAU = Math.PI * 2;

export const BPM = 120;
export const BEAT = 60 / BPM; // 0.5 s
export const BAR = BEAT * 4; // 2 s

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const remap = (x, a, b, c, d) => c + (d - c) * ((x - a) / (b - a));
export const fract = (x) => x - Math.floor(x);
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ---------------------------------------------------------------- easing ---
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
export const ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inQuart: (t) => t * t * t * t,
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2),
  inQuint: (t) => t ** 5,
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t) =>
    t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  outSine: (t) => Math.sin((t * Math.PI) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  inCirc: (t) => 1 - Math.sqrt(1 - t * t),
  outCirc: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  inOutCirc: (t) =>
    t < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
  inBack: (t) => c3 * t * t * t - c1 * t * t,
  outBack: (t) => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
  inOutBack: (t) =>
    t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2,
  outElastic: (t) =>
    t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
};

// CSS-style cubic-bezier easing (the After Effects "speed graph" in code form).
export function bezier(x1, y1, x2, y2) {
  const A = (a1, a2) => 1 - 3 * a2 + 3 * a1;
  const B = (a1, a2) => 3 * a2 - 6 * a1;
  const C = (a1) => 3 * a1;
  const calc = (t, a1, a2) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
  const slope = (t, a1, a2) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const s = slope(t, x1, x2);
      if (Math.abs(s) < 1e-6) break;
      t -= (calc(t, x1, x2) - x) / s;
    }
    // bisection fallback for robustness
    let lo = 0, hi = 1;
    if (Math.abs(calc(t, x1, x2) - x) > 1e-4) {
      t = x;
      for (let i = 0; i < 30; i++) {
        const v = calc(t, x1, x2);
        if (v < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
    }
    return calc(t, y1, y2);
  };
}
// A few signature curves
ease.snappy = bezier(0.7, 0, 0.2, 1); // strong anticipation-free "motion designer" in/out
ease.swift = bezier(0.55, 0, 0.1, 1);
ease.smooth = bezier(0.45, 0, 0.25, 1);
ease.punch = bezier(0.1, 0.9, 0.2, 1); // instant attack, soft landing

// progress of t inside [t0, t0+d], eased
export const prog = (t, t0, d, e = ease.linear) => e(clamp((t - t0) / d));
// eased progress inside [a, b]
export const seg = (t, a, b, e = ease.linear) => e(clamp((t - a) / (b - a)));

// Damped spring step response (0 -> 1), physically based, closed form.
export function spring(t, { stiffness = 170, damping = 14, mass = 1, v0 = 0 } = {}) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const x0 = -1; // displacement from target
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const A = x0;
    const B = (zeta * w0 * x0 - v0) / wd;
    return 1 + Math.exp(-zeta * w0 * t) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
  }
  const A = x0;
  const B = -v0 + w0 * x0;
  return 1 + Math.exp(-w0 * t) * (A + -B * t);
}
export const springAt = (t, t0, opts) => spring(t - t0, opts);

// Keyframe track: keys = [[time, value, easeIntoThisKey?], ...]; value may be number or array.
export function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 1; i < keys.length; i++) {
    const k1 = keys[i];
    if (t <= k1[0]) {
      const k0 = keys[i - 1];
      const e = k1[2] || ease.inOutCubic;
      const p = e((t - k0[0]) / (k1[0] - k0[0]));
      if (Array.isArray(k0[1])) return k0[1].map((v, j) => lerp(v, k1[1][j], p));
      return lerp(k0[1], k1[1], p);
    }
  }
  return last[1];
}

// --------------------------------------------------------------- random ---
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash1 = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);

// --------------------------------------------------------- simplex noise ---
const grad3 = new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]);
const perm = new Uint8Array(512);
const permMod12 = new Uint8Array(512);
{
  const r = rng(1337);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }
}
const F3 = 1 / 3, G3 = 1 / 6;
export function noise3(xin, yin, zin) {
  let n0, n1, n2, n3;
  const s = (xin + yin + zin) * F3;
  const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
  const t = (i + j + k) * G3;
  const x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);
  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) {
    if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
    else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
  } else {
    if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
    else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
    else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
  }
  const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
  const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
  const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
  const ii = i & 255, jj = j & 255, kk = k & 255;
  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 < 0) n0 = 0;
  else { const g = permMod12[ii + perm[jj + perm[kk]]] * 3; t0 *= t0; n0 = t0 * t0 * (grad3[g] * x0 + grad3[g + 1] * y0 + grad3[g + 2] * z0); }
  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 < 0) n1 = 0;
  else { const g = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3; t1 *= t1; n1 = t1 * t1 * (grad3[g] * x1 + grad3[g + 1] * y1 + grad3[g + 2] * z1); }
  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2 < 0) n2 = 0;
  else { const g = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3; t2 *= t2; n2 = t2 * t2 * (grad3[g] * x2 + grad3[g + 1] * y2 + grad3[g + 2] * z2); }
  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 < 0) n3 = 0;
  else { const g = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3; t3 *= t3; n3 = t3 * t3 * (grad3[g] * x3 + grad3[g + 1] * y3 + grad3[g + 2] * z3); }
  return 32 * (n0 + n1 + n2 + n3); // ~[-1, 1]
}
export const noise2 = (x, y) => noise3(x, y, 0.5);

// ---------------------------------------------------------------- colour ---
export function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export function gradientAt(stops, t) {
  // stops: array of rgb arrays evenly spaced
  t = clamp(t) * (stops.length - 1);
  const i = Math.min(Math.floor(t), stops.length - 2);
  return mix(stops[i], stops[i + 1], t - i);
}

// Brand palette — limited, editorial, high-contrast.
export const C = {
  ink: hex('#0E0E10'),
  ink2: hex('#1A1A1F'),
  paper: hex('#F2EDE4'),
  paper2: hex('#E6DFD3'),
  orange: hex('#FF4F1A'),
  violet: hex('#5546FF'),
  lime: hex('#D7FF3B'),
  pink: hex('#FF9ED8'),
  sky: hex('#8FD3FF'),
};
export const css = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, rgba(v)]));
