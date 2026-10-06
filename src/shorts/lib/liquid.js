// Liquid material: draw any shape (paths, text, blobs) into a mask, get back glossy, viscous molasses —
// dark amber body, warm rim light on the upper edges, a sharp specular streak, a dark lower lip.
// The one colour of the film lives here.
import { TAU, clamp, lerp, noise3, rng } from '../../engine/core.js';
import { canvas, SW, SH } from './collage.js';

export const AMBER = {
  deep: [20, 8, 3],
  body: [58, 25, 7],
  mid: [120, 56, 14],
  rim: [222, 140, 52],
  spec: [255, 236, 200],
  marker: [226, 140, 38],
};

let M = null, A = null, B = null, Q = null;
const QS = 4; // big blurs run at quarter resolution (software canvas: blur cost ~ pixels x radius)
function bufs() {
  if (!M) { M = canvas(SW, SH); A = canvas(SW, SH); B = canvas(SW, SH); Q = canvas(SW / QS, SH / QS); }
}
// blur `src` by r px using the small buffer, return it (drawn scaled back up by the caller)
function smallBlur(src, r) {
  const q = Q.getContext('2d');
  q.setTransform(1, 0, 0, 1, 0, 0);
  q.globalCompositeOperation = 'source-over';
  q.clearRect(0, 0, Q.width, Q.height);
  q.filter = `blur(${Math.max(0.5, r / QS)}px)`;
  q.drawImage(src, 0, 0, Q.width, Q.height);
  q.filter = 'none';
  return Q;
}

// Begin a liquid layer: returns a 2D context to draw the shape into (any fill colour; alpha = coverage).
// The caller's current transform is copied, so shapes can be drawn in scene coordinates.
export function liquidBegin(ctx) {
  bufs();
  const m = M.getContext('2d');
  m.setTransform(1, 0, 0, 1, 0, 0);
  m.globalCompositeOperation = 'source-over';
  m.globalAlpha = 1;
  m.filter = 'none';
  m.clearRect(0, 0, SW, SH);
  if (ctx) m.setTransform(ctx.getTransform());
  m.fillStyle = '#fff'; m.strokeStyle = '#fff';
  return m;
}

// Composite the liquid onto ctx (in screen space).
// o: { light: [dx,dy] direction the light comes from, depth (bevel px), gloss 0..1, top, bottom (gradient y range), alpha }
export function liquidEnd(ctx, o = {}) {
  const { depth = 7, gloss = 1, top = 0, bottom = SH, alpha = 1, warm = 1, t = 0 } = o;
  const [lx, ly] = o.light || [-0.45, -1];
  const ln = Math.hypot(lx, ly), ux = lx / ln, uy = ly / ln;
  const a = A.getContext('2d'), b = B.getContext('2d');
  for (const c of [a, b]) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.filter = 'none'; c.clearRect(0, 0, SW, SH); }

  // 1) body: vertical gradient through the mask
  a.drawImage(M, 0, 0);
  a.globalCompositeOperation = 'source-in';
  const g = a.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, `rgb(${Math.round(70 + 40 * warm)},${Math.round(30 + 16 * warm)},9)`);
  g.addColorStop(0.3, 'rgb(44,18,5)');
  g.addColorStop(1, 'rgb(14,5,2)');
  a.fillStyle = g;
  a.fillRect(0, 0, SW, SH);
  // inner glow: light caught just under the surface facing the light
  b.drawImage(M, 0, 0);
  b.globalCompositeOperation = 'destination-out';
  b.drawImage(M, -ux * depth * 4, -uy * depth * 4);
  b.globalCompositeOperation = 'source-in';
  b.fillStyle = 'rgb(150,70,18)';
  b.fillRect(0, 0, SW, SH);
  a.globalCompositeOperation = 'source-atop';
  a.globalAlpha = 0.55;
  a.drawImage(smallBlur(B, depth * 1.6), 0, 0, SW, SH);
  a.globalAlpha = 1;
  b.globalCompositeOperation = 'source-over';
  b.clearRect(0, 0, SW, SH);
  if (o.detail) { a.save(); a.globalCompositeOperation = 'source-atop'; o.detail(a); a.restore(); }

  // 2) rim light: mask minus mask shifted away from the light => the edges facing the light
  b.globalCompositeOperation = 'source-over';
  b.drawImage(M, 0, 0);
  b.globalCompositeOperation = 'destination-out';
  b.drawImage(M, -ux * depth, -uy * depth);
  b.globalCompositeOperation = 'source-in';
  b.fillStyle = 'rgb(222,140,52)';
  b.fillRect(0, 0, SW, SH);
  a.globalCompositeOperation = 'source-atop';
  a.filter = `blur(${Math.max(1, depth * 0.45)}px)`;
  a.globalAlpha = 0.9;
  a.drawImage(B, 0, 0);
  a.filter = 'none';
  a.globalAlpha = 1;

  // 3) specular streak: thinner offset, near white
  if (gloss > 0) {
    b.globalCompositeOperation = 'source-over';
    b.clearRect(0, 0, SW, SH);
    b.drawImage(M, ux * depth * 0.25, uy * depth * 0.25);
    b.globalCompositeOperation = 'destination-out';
    b.drawImage(M, -ux * depth * 0.35, -uy * depth * 0.35);
    b.globalCompositeOperation = 'source-in';
    b.fillStyle = 'rgb(255,238,206)';
    b.fillRect(0, 0, SW, SH);
    a.globalCompositeOperation = 'source-atop';
    a.globalAlpha = 0.95 * gloss;
    a.drawImage(B, -ux * depth * 0.55, -uy * depth * 0.55);
    a.globalAlpha = 1;
  }

  // 4) dark lower lip (edges facing away from the light)
  b.globalCompositeOperation = 'source-over';
  b.clearRect(0, 0, SW, SH);
  b.drawImage(M, 0, 0);
  b.globalCompositeOperation = 'destination-out';
  b.drawImage(M, ux * depth * 0.8, uy * depth * 0.8);
  b.globalCompositeOperation = 'source-in';
  b.fillStyle = 'rgb(8,3,1)';
  b.fillRect(0, 0, SW, SH);
  a.globalCompositeOperation = 'source-atop';
  a.globalAlpha = 0.7;
  a.drawImage(B, 0, 0);
  a.globalAlpha = 1;

  // contact shadow: the mask tinted dark
  if (o.shadow !== false) {
    b.globalCompositeOperation = 'source-over';
    b.clearRect(0, 0, SW, SH);
    b.drawImage(M, 0, 0);
    b.globalCompositeOperation = 'source-in';
    b.fillStyle = 'rgb(40,24,12)';
    b.fillRect(0, 0, SW, SH);
  }
  // drop the result onto the scene (screen space)
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (o.shadow !== false) {
    ctx.globalAlpha = alpha * 0.3;
    ctx.drawImage(smallBlur(B, 9), 3, 12, SW, SH);
  }
  ctx.globalAlpha = alpha;
  ctx.drawImage(A, 0, 0);
  ctx.restore();
}

// ------------------------------------------------------------ shapes ---
// Teardrop drip hanging from (x, y) with length L and width w; neck thins as it stretches.
export function drip(m, x, y, L, w) {
  if (L <= 0.5) return;
  const neck = Math.max(1.2, w * 0.38 * (1 - clamp(L / (w * 9)) * 0.75));
  const r = w * (0.5 + 0.18 * clamp(L / (w * 4)));
  m.beginPath();
  m.moveTo(x - w / 2, y);
  m.bezierCurveTo(x - w / 2, y + L * 0.25, x - neck, y + L * 0.55, x - neck, y + L - r * 1.3);
  m.bezierCurveTo(x - r * 1.05, y + L - r * 0.9, x - r, y + L + r * 0.9, x, y + L + r * 0.95);
  m.bezierCurveTo(x + r, y + L + r * 0.9, x + r * 1.05, y + L - r * 0.9, x + neck, y + L - r * 1.3);
  m.bezierCurveTo(x + neck, y + L * 0.55, x + w / 2, y + L * 0.25, x + w / 2, y);
  m.closePath();
  m.fill();
}
// Viscous string between two points that sags and thins (alpha encodes nothing — full coverage).
export function strand(m, x0, y0, x1, y1, w0, w1, sag = 0.2) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + Math.hypot(x1 - x0, y1 - y0) * sag;
  const n = 24;
  let px = x0, py = y0;
  m.save();
  m.lineCap = 'round';
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * mx + u * u * x1;
    const y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * my + u * u * y1;
    m.lineWidth = Math.max(1, lerp(w0, w1, u) * (0.35 + 0.65 * Math.abs(u - 0.5) * 2));
    m.beginPath(); m.moveTo(px, py); m.lineTo(x, y); m.stroke();
    px = x; py = y;
  }
  m.restore();
}
// Organic blob (droplet / splash) with wobbling edge.
export function blob(m, x, y, r, t = 0, seed = 1, wob = 0.18) {
  m.beginPath();
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const k = 1 + wob * noise3(Math.cos(a) * 1.3, Math.sin(a) * 1.3, t * 0.8 + seed * 3.1);
    const px = x + Math.cos(a) * r * k, py = y + Math.sin(a) * r * k;
    i ? m.lineTo(px, py) : m.moveTo(px, py);
  }
  m.closePath();
  m.fill();
}
// Surface line of a viscous flood: y(x) with slow heavy undulation; returns points (for fills + rims).
export function surface(x0, x1, yBase, t, { amp = 18, freq = 0.006, speed = 0.6, seed = 1, step = 12 } = {}) {
  const pts = [];
  for (let x = x0; x <= x1 + step; x += step) {
    const y = yBase + noise3(x * freq, t * speed, seed) * amp + noise3(x * freq * 3.1, t * speed * 1.7, seed + 2) * amp * 0.35;
    pts.push([x, y]);
  }
  return pts;
}
export function fillBelow(m, pts, bottom = SH + 50) {
  m.beginPath();
  m.moveTo(pts[0][0], bottom);
  for (const [x, y] of pts) m.lineTo(x, y);
  m.lineTo(pts[pts.length - 1][0], bottom);
  m.closePath();
  m.fill();
}
// A seeded set of drips along a surface (hanging edge of a word / lip of a wave)
export function dripsAlong(m, pts, t, t0, { n = 8, seed = 4, maxL = 160, w = 16, speed = 1 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const k = Math.floor(r() * pts.length);
    const [x, y] = pts[k];
    const delay = r() * 0.8, grow = 0.6 + r() * 0.9;
    const L = Math.pow(clamp((t - t0 - delay) * speed / (1.6 * grow)), 0.8) * maxL * (0.4 + r() * 0.6);
    drip(m, x, y - 2, L, w * (0.6 + r() * 0.7));
  }
}
