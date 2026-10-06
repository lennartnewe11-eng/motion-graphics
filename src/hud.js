// Persistent editorial HUD: brand, timecode and an animated section label.
import { clamp, ease, seg, rgba, mix, TAU } from './engine/core.js';
import { F, font } from './engine/draw.js';

const M = 64; // safe margin

function maskedText(ctx, str, x, y, p, out = 0, align = 'left') {
  // p: reveal 0..1 (from below); out: exit 0..1 (upwards)
  if (p <= 0 || out >= 1) return;
  const h = 26;
  ctx.save();
  ctx.beginPath();
  const w = 900;
  ctx.rect(align === 'left' ? x - 4 : x - w, y - h * 0.8, w + 4, h * 1.2);
  ctx.clip();
  ctx.textAlign = align;
  ctx.fillText(str, x, y + h * (1 - p) - h * out);
  ctx.restore();
}

export function drawHud(ctx, t, frame, fps, section, color) {
  if (t < 0.55 || t >= 46) return;
  const col = color;
  const intro = (d) => seg(t, 0.6 + d, 1.0 + d, ease.outExpo);
  const outro = seg(t, 45.92, 46, ease.linear);
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = '3px';

  // --- top left: brand
  const p0 = intro(0);
  ctx.fillStyle = rgba(col);
  ctx.beginPath();
  ctx.arc(M + 7, M - 6, 7 * ease.outBack(p0), 0, TAU);
  ctx.fill();
  font(ctx, 17, 700, F.mono);
  ctx.fillStyle = rgba(col);
  maskedText(ctx, 'CLAUDE', M + 26, M, intro(0.05), outro);
  font(ctx, 17, 400, F.mono);
  ctx.fillStyle = rgba(col, 0.55);
  maskedText(ctx, '/  MOTION REEL 2026', M + 118, M, intro(0.1), outro);

  // --- top right: timecode
  const s = Math.floor(frame / fps);
  const ff = frame % fps;
  const tc = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
  font(ctx, 17, 500, F.mono);
  ctx.fillStyle = rgba(col);
  maskedText(ctx, tc, 1920 - M, M, intro(0.15), outro, 'right');
  ctx.fillStyle = rgba(col, 0.55);
  font(ctx, 17, 400, F.mono);
  maskedText(ctx, `${fps} FPS  ·  1920×1080  ·`, 1920 - M - 130, M, intro(0.2), outro, 'right');

  // --- bottom left: section label (animated swap)
  if (section) {
    const { num, label, t0, prev } = section;
    const pin = seg(t, t0 + 0.12, t0 + 0.55, ease.outExpo);
    const pout = prev ? seg(t, t0 - 0.05, t0 + 0.12, ease.inCubic) : 1;
    const base = 1080 - M + 10;
    font(ctx, 17, 700, F.mono);
    ctx.fillStyle = rgba(col);
    if (prev && pout < 1) maskedText(ctx, prev.num, M, base, 1, pout);
    maskedText(ctx, num, M, base, Math.min(pin, intro(0.1)), outro);
    // divider line grows
    const lp = Math.min(intro(0.15), 1 - outro);
    ctx.strokeStyle = rgba(col, 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(M + 38, base - 6);
    ctx.lineTo(M + 38 + 40 * lp, base - 6);
    ctx.stroke();
    font(ctx, 17, 400, F.mono);
    ctx.fillStyle = rgba(col, 0.85);
    if (prev && pout < 1) maskedText(ctx, prev.label.toUpperCase(), M + 96, base, 1, pout);
    maskedText(ctx, label.toUpperCase(), M + 96, base, Math.min(seg(t, t0 + 0.18, t0 + 0.6, ease.outExpo), intro(0.2)), outro);
  }

  // --- bottom right
  font(ctx, 17, 400, F.mono);
  ctx.fillStyle = rgba(col, 0.55);
  maskedText(ctx, 'BEWERBUNG ALS MOTION DESIGNER', 1920 - M, 1080 - M + 10, intro(0.25), outro, 'right');
  ctx.restore();
}

export function hudColorMix(a, b, p) {
  return mix(a, b, clamp(p));
}
