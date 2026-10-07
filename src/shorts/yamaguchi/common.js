// Props of "Yamaguchi": the man (an ink silhouette — no free photograph of him exists), the two clouds, carbon
// documents, distance rings. House style from ../lib/night.js; the accent is crimson (burns, times, distances).
import { TAU, clamp, lerp, ease, noise3, rng, rgba } from '../../engine/core.js';
import { SW, SH, img, canvas, tornPath, tornShadow, pathPts } from '../lib/collage.js';
import { setFont } from '../lib/type.js';
import { V, R } from '../lib/night.js';

export * from '../lib/night.js';
V.accent = [232, 36, 44];

// ----------------------------------------------------------------- the man
// man.png (261 x 722): a figure cut from a 1902 platform photo, filled with ink. Feet at (x, y), height h.
const cache = new Map();
function variant(kind) {
  if (cache.has(kind)) return cache.get(kind);
  const im = img('man');
  const pad = 60;
  const c = canvas(im.width + pad * 2, im.height + pad * 2), x = c.getContext('2d');
  if (kind === 'rim') { // backlight: a white halo around the outline
    x.filter = 'blur(14px)';
    x.drawImage(im, pad, pad);
    x.filter = 'none';
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = 'rgb(255,248,236)';
    x.fillRect(0, 0, c.width, c.height);
  } else if (kind === 'burn') { // the burn: crimson body with a hot inner glow
    x.drawImage(im, pad, pad);
    x.globalCompositeOperation = 'source-in';
    const g = x.createLinearGradient(pad, 0, pad + im.width, 0);
    g.addColorStop(0, rgba([255, 120, 70])); g.addColorStop(0.5, rgba(V.accent)); g.addColorStop(1, rgba([120, 10, 16]));
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
  }
  c.pad = pad;
  cache.set(kind, c);
  return c;
}
export function man(ctx, x, y, h, { flip = false, alpha = 1, rim = 0, burn = 0, rot = 0, sway = 0, t = 0 } = {}) {
  const im = img('man');
  const s = h / im.height;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot + Math.sin(t * 1.3) * 0.006 * sway);
  ctx.scale(s * (flip ? -1 : 1), s);
  ctx.globalAlpha *= alpha;
  if (rim > 0) {
    const r = variant('rim');
    ctx.save(); ctx.globalAlpha *= rim; ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(r, -im.width / 2 - r.pad, -im.height - r.pad);
    ctx.restore();
  }
  ctx.drawImage(im, -im.width / 2, -im.height);
  if (burn > 0) {
    // his left side = the viewer's right (he faces us)
    const b = variant('burn');
    ctx.save();
    ctx.beginPath(); ctx.rect(0, -im.height - 10, im.width, im.height + 20); ctx.clip();
    ctx.globalAlpha *= burn;
    ctx.drawImage(b, -im.width / 2 - b.pad, -im.height - b.pad);
    ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------- the clouds
// a mushroom cloud rising (time-lapse): k 0..1 grows the column from the ground; base at (x, y), final width w.
// A crimson-hot glow sits at its root (the only colour on the cloud).
export function mushroom(ctx, key, x, y, w, k, { alpha = 1, glow = 1, t = 0 } = {}) {
  if (k <= 0) return;
  const im = img(key);
  const e = ease.outCubic(clamp(k));
  const s = (w / im.width) * lerp(0.25, 1, e);
  const sy = s * lerp(0.55, 1, e);
  ctx.save();
  ctx.translate(x + noise3(t * 0.3, 2, 1) * 4, y);
  ctx.scale(s, sy);
  ctx.globalAlpha *= alpha * clamp(k * 5);
  ctx.drawImage(im, -im.width / 2, -im.height);
  ctx.restore();
  if (glow > 0) {
    const r = w * lerp(0.2, 0.45, e);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(x, y - r * 0.2, 0, x, y - r * 0.2, r);
    const a = glow * alpha * (0.55 + 0.15 * Math.sin(t * 9)) * (1 - 0.5 * e);
    g.addColorStop(0, rgba([255, 200, 160], a)); g.addColorStop(0.35, rgba(V.accent, a * 0.8)); g.addColorStop(1, rgba(V.accent, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r * 1.2, r * 2, r * 2);
    ctx.restore();
  }
}

// --------------------------------------------------------------- documents
// a carbon copy filling the frame (house style: the document is the background)
export function carbon(ctx, { tint = V.carbon } = {}) {
  const g = ctx.createLinearGradient(0, 0, SW * 0.3, SH);
  g.addColorStop(0, rgba(tint)); g.addColorStop(1, rgba([16, 24, 40]));
  ctx.fillStyle = g;
  ctx.fillRect(-200, -200, SW + 400, SH + 400);
}
// a rubber stamp in the accent colour, slammed on at t0
export function stamp(ctx, t, t0, text, x, y, { size = 90, rot = -0.16, pop = null } = {}) {
  if (t < t0) return;
  const k = clamp((t - t0) / 0.12);
  const s = lerp(2.2, 1, ease.outBack(k));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.globalAlpha *= clamp(k * 3) * 0.92;
  setFont(ctx, R.T, size);
  ctx.letterSpacing = '0px';
  const w = ctx.measureText(text).width;
  ctx.strokeStyle = rgba(V.accent);
  ctx.lineWidth = size * 0.08;
  ctx.strokeRect(-w / 2 - size * 0.3, -size * 0.85, w + size * 0.6, size * 1.2);
  ctx.fillStyle = rgba(V.accent);
  ctx.textAlign = 'center';
  ctx.fillText(text, 0, size * 0.18);
  ctx.restore();
}
// distance rings (dashed), drawn on a photo in perspective (sy < 1 = ellipse on the ground)
export function rings(ctx, cx, cy, radii, p, { sy = 1, color = V.accent, width = 4, t = 0 } = {}) {
  ctx.save();
  ctx.strokeStyle = rgba(color);
  ctx.lineWidth = width;
  ctx.setLineDash([16, 12]);
  ctx.lineDashOffset = -t * 30;
  radii.forEach((r, i) => {
    const k = ease.outCubic(clamp(p * radii.length - i));
    if (k <= 0) return;
    ctx.globalAlpha = 0.9 - i * 0.15;
    ctx.beginPath(); ctx.ellipse(cx, cy, r * k, r * k * sy, 0, 0, TAU); ctx.stroke();
  });
  ctx.restore();
}
// shock ring of a blast (screen-space), expanding from t0
export function shock(ctx, t, t0, x, y, { dur = 0.9, max = 1600, sy = 0.35, color = [255, 245, 230] } = {}) {
  const k = (t - t0) / dur;
  if (k <= 0 || k >= 1) return;
  ctx.save();
  ctx.strokeStyle = rgba(color, (1 - k) * 0.8);
  ctx.lineWidth = 30 * (1 - k) + 2;
  ctx.beginPath(); ctx.ellipse(x, y, max * ease.outCubic(k), max * ease.outCubic(k) * sy, 0, 0, TAU); ctx.stroke();
  ctx.restore();
}
// a torn print of a photo with its own pan (x 0..1) at screen (cx, cy), w x h, rotation
export function band(ctx, key, cx, cy, w, h, { ix = 0.5, iy = 0.5, z = 1, rot = 0, seed = 7, alpha = 1, shadow = true } = {}) {
  const im = img(key);
  const sc = Math.max(w / im.width, h / im.height) * z;
  const vw = w / sc, vh = h / sc;
  const sx = clamp(ix * im.width - vw / 2, 0, im.width - vw), sy = clamp(iy * im.height - vh / 2, 0, im.height - vh);
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.globalAlpha *= alpha;
  if (shadow) { const sh = tornShadow(w, h, seed, 'trbl', 8, 16); ctx.save(); ctx.globalAlpha *= 0.6; ctx.drawImage(sh, -w / 2 + 10 - sh.pad, -h / 2 + 22 - sh.pad); ctx.restore(); }
  pathPts(ctx, tornPath(w, h, seed, { sides: 'trbl', amp: 8 }), -w / 2, -h / 2);
  ctx.clip();
  ctx.drawImage(im, sx, sy, vw, vh, -w / 2, -h / 2, w, h);
  ctx.restore();
  return { sc, sx, sy, map: (px, py) => [cx + ((px - sx) * sc - w / 2) * Math.cos(rot) - ((py - sy) * sc - h / 2) * Math.sin(rot), cy + ((px - sx) * sc - w / 2) * Math.sin(rot) + ((py - sy) * sc - h / 2) * Math.cos(rot)] };
}
