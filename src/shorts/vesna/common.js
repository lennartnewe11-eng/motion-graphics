// Props of "Vesna": the DC-9 (YU-AHT) and its pieces, the dive, the fireball. Everything else is the house style
// in ../lib/night.js (accent = signal orange).
import { TAU, clamp, lerp, ease, noise3, rng, rgba } from '../../engine/core.js';
import { SW, SH, img, canvas, sticker } from '../lib/collage.js';
import { V } from '../lib/night.js';

export * from '../lib/night.js';
V.accent = V.orange;
// yuaht.png (2277 x 551): YU-AHT herself, side view, nose left. Window row and the forward hold in image pixels.
export const YU = { w: 2277, h: 551, nose: [4, 386], hold: [430, 380, 330, 120], reg: [1785, 296, 180, 50], logo: [1985, 92, 220, 120] };
export const windowAt = (k) => { const x = 383 + 31.9 * k; return [x, 332 + (x - 383) * 0.0094]; };
// jagged break lines across the fuselage (image x), shared by all pieces so they fit together
const CUTS = [560, 1000, 1640];
const cutCache = new Map();
function cutLine(i) {
  if (cutCache.has(i)) return cutCache.get(i);
  const r = rng(40 + i), pts = [];
  for (let y = -10; y <= YU.h + 10; y += 22) pts.push([CUTS[i] + (r() - 0.5) * 46 + noise3(y * 0.01, i, 3) * 40, y]);
  cutCache.set(i, pts);
  return pts;
}
// piece i: 0 nose, 1 forward fuselage (the hold with the bomb), 2 centre with wing (Vesna), 3 tail
export function piecePath(ctx, i) {
  ctx.beginPath();
  const L = i === 0 ? [[-20, -10], [-20, YU.h + 10]] : cutLine(i - 1);
  const Rr = i === 3 ? [[YU.w + 20, -10], [YU.w + 20, YU.h + 10]] : cutLine(i);
  L.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  for (let k = Rr.length - 1; k >= 0; k--) ctx.lineTo(Rr[k][0], Rr[k][1]);
  ctx.closePath();
}
export const PIECE_CX = [280, 780, 1320, 1960];
// one piece of YU-AHT, rendered once per burn level: clipped by its break lines, the breaks scorched
// (soot, then an orange-hot rim) — only on the aircraft's pixels, never on the empty corners
const pieceCache = new Map();
function pieceCanvas(i, burn) {
  const q = Math.round(clamp(burn) * 4);
  const key = i + '|' + q;
  if (pieceCache.has(key)) return pieceCache.get(key);
  const c = canvas(YU.w, YU.h), x = c.getContext('2d');
  piecePath(x, i); x.clip();
  x.drawImage(img('yuaht'), 0, 0);
  if (q > 0) {
    x.globalCompositeOperation = 'source-atop';
    x.lineJoin = 'round'; x.lineCap = 'round';
    const lines = [i > 0 ? cutLine(i - 1) : null, i < 3 ? cutLine(i) : null].filter(Boolean);
    for (const [w, col, a] of [[90, V.ink, 0.7], [34, V.orange, 0.85], [10, V.ember, 1]]) {
      x.lineWidth = w; x.strokeStyle = rgba(col, a * q / 4);
      x.filter = w > 50 ? 'blur(14px)' : w > 20 ? 'blur(5px)' : 'none';
      for (const pts of lines) { x.beginPath(); pts.forEach(([px, py], k) => (k ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke(); }
    }
    x.filter = 'none';
  }
  pieceCache.set(key, c);
  return c;
}
// draw YU-AHT (or one piece) centred on the image point (ix, iy) at screen (x, y)
export function yuaht(ctx, x, y, s, rot = 0, { piece = -1, ix = YU.w / 2, iy = YU.h / 2, alpha = 1, burn = 0, flip = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s * (flip ? -1 : 1), s);
  ctx.translate(-ix, -iy);
  ctx.globalAlpha *= alpha;
  ctx.drawImage(piece >= 0 ? pieceCanvas(piece, burn) : img('yuaht'), 0, 0);
  ctx.restore();
}
// the NASA C-9 in a dive (plane_dive.png 1428 x 1144: nose at upper right, tail lower left)
export function divePlane(ctx, x, y, s, rot, { flip = false, alpha = 1 } = {}) {
  sticker(ctx, 'plane_dive', x, y, { s, rot, ax: 0.55, ay: 0.45, flip, shadow: false, alpha });
}

// ----------------------------------------------------------- split-flap ---
export function fireball(ctx, x, y, s, t, t0, { alpha = 1, rot = 0, comp = 'screen' } = {}) {
  if (t < t0) return;
  const k = clamp((t - t0) / 1.4);
  const im = img('fireball');
  const sc = s * lerp(0.15, 1.1, ease.outExpo(clamp((t - t0) / 0.5))) * (1 + k * 0.15);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot + k * 0.2);
  ctx.scale(sc, sc);
  ctx.globalCompositeOperation = comp;
  ctx.globalAlpha *= alpha * (1 - ease.inCubic(k));
  ctx.drawImage(im, -im.width * 0.63, -im.height * 0.5);
  ctx.restore();
}
